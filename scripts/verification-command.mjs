import { spawn } from 'node:child_process';
import { stopOwnedProcess } from './owned-process.mjs';
import { npmCommand } from './npm-command.mjs';

// Only Node/npm verification commands; never construct a shell command string.
export async function runVerificationCommand(
  command,
  args,
  {
    cwd = process.cwd(),
    env = process.env,
    capture = false,
    npmOptions = {},
    timeoutMs,
    signal,
    shutdownMs = 3000,
  } = {},
) {
  if (!['node', 'npm'].includes(command))
    throw new Error(`Unsupported verification command: ${command}`);
  const invocation =
    command === 'node'
      ? { command: process.execPath, prefix: [] }
      : await npmCommand({ ...npmOptions, env });
  const context = `${command} ${args[0] ?? ''} in ${cwd}`;
  if (signal?.aborted)
    throw Object.assign(
      new Error(`${context}: cancelled before spawn`, {
        cause: signal.reason,
      }),
      { kind: 'cancelled' },
    );
  return new Promise((resolve, reject) => {
    const child = spawn(invocation.command, [...invocation.prefix, ...args], {
      cwd,
      env,
      shell: false,
      detached: process.platform !== 'win32',
      stdio: capture ? ['ignore', 'pipe', 'pipe'] : 'inherit',
    });
    let stdout = '',
      stderr = '';
    if (capture) {
      child.stdout.setEncoding('utf8');
      child.stderr.setEncoding('utf8');
      child.stdout.on('data', (chunk) => {
        stdout += chunk;
      });
      child.stderr.on('data', (chunk) => {
        stderr += chunk;
      });
    }
    let failure;
    let timer;
    let termination;
    let terminateCompletion;
    const close = new Promise((res) => child.once('close', res));
    const terminate = (kind, cause) => {
      if (termination) return;
      failure = Object.assign(new Error(`${context}: ${kind}`, { cause }), {
        kind,
      });
      termination = stopOwnedProcess(child, close, { shutdownMs });
      termination.catch(() => {});
      queueMicrotask(() => terminateCompletion?.());
    };
    const abort = () => terminate('cancelled', signal.reason);
    signal?.addEventListener('abort', abort, { once: true });
    if (signal?.aborted) abort();
    if (timeoutMs !== undefined)
      timer = setTimeout(() => terminate('timeout'), timeoutMs);
    child.once('error', (cause) => {
      failure ??= Object.assign(
        new Error(`${context}: spawn failed (${cause.code ?? cause.message})`, {
          cause,
        }),
        { kind: 'spawn' },
      );
    });
    child.once('close', async (code, childSignal) => {
      clearTimeout(timer);
      signal?.removeEventListener('abort', abort);
      if (!failure && (code !== 0 || childSignal)) {
        failure = Object.assign(
          new Error(
            `${context}: ${childSignal ? `terminated by ${childSignal}` : `exited ${code}`}${stderr ? `\n${stderr}` : ''}`,
          ),
          { kind: childSignal ? 'signal' : 'exit' },
        );
      }
      try {
        // Also remove descendants after normal completion/nonzero exit.
        await (termination ?? stopOwnedProcess(child, close, { shutdownMs }));
      } catch (cleanupError) {
        if (failure) failure.cleanupErrors = [cleanupError];
        else failure = Object.assign(cleanupError, { kind: 'cleanup' });
      }
      if (failure) {
        Object.assign(failure, { code, signal: childSignal, stdout, stderr });
        reject(failure);
      } else resolve({ stdout, stderr });
    });
    // A descendant holding a pipe open must not prevent cancellation completion.
    if (timeoutMs !== undefined || signal) {
      const finishTermination = async () => {
        if (!termination) return;
        try {
          await termination;
        } catch (error) {
          failure.cleanupErrors = [error];
        }
        clearTimeout(timer);
        signal?.removeEventListener('abort', abort);
        Object.assign(failure, { stdout, stderr });
        reject(failure);
      };
      terminateCompletion = finishTermination;
    }
  });
}
