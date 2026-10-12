import { spawn } from 'node:child_process';
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
  } = {},
) {
  if (!['node', 'npm'].includes(command))
    throw new Error(`Unsupported verification command: ${command}`);
  const invocation =
    command === 'node'
      ? { command: process.execPath, prefix: [] }
      : await npmCommand({ ...npmOptions, env });
  const context = `${command} ${args[0] ?? ''} in ${cwd}`;
  return new Promise((resolve, reject) => {
    const child = spawn(invocation.command, [...invocation.prefix, ...args], {
      cwd,
      env,
      shell: false,
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
    child.once('error', (cause) =>
      reject(
        new Error(`${context}: spawn failed (${cause.code ?? cause.message})`, {
          cause,
        }),
      ),
    );
    child.once('close', (code, signal) => {
      if (code === 0 && !signal) resolve({ stdout, stderr });
      else {
        const error = new Error(
          `${context}: ${signal ? `terminated by ${signal}` : `exited ${code}`}${stderr ? `\n${stderr}` : ''}`,
        );
        Object.assign(error, { code, signal, stdout, stderr });
        reject(error);
      }
    });
  });
}
