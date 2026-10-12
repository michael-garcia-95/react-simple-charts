import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execute = promisify(execFile);
export function within(promise, ms, message) {
  let timer;
  return Promise.race([
    promise,
    new Promise((_, reject) => {
      timer = setTimeout(() => reject(new Error(message)), ms);
    }),
  ]).finally(() => clearTimeout(timer));
}

// Only a child created by the caller: no port, name or global process search.
export async function stopOwnedProcess(
  child,
  close,
  { shutdownMs = 3000 } = {},
) {
  if (child.pid) {
    if (process.platform === 'win32') {
      if (child.exitCode === null && child.signalCode === null)
        await execute('taskkill.exe', ['/PID', String(child.pid), '/T', '/F'], {
          timeout: shutdownMs,
        });
    } else {
      const signal = (name) => {
        try {
          process.kill(-child.pid, name);
        } catch (error) {
          if (error.code !== 'ESRCH') throw error;
        }
      };
      signal('SIGTERM');
      try {
        await within(
          close,
          shutdownMs,
          'Owned process SIGTERM shutdown timed out',
        );
      } catch {
        signal('SIGKILL');
      }
      // The direct child may exit before a descendant; dispose of its owned group.
      signal('SIGKILL');
    }
  }
  await within(
    close,
    shutdownMs,
    'Owned process did not close after termination',
  );
}
