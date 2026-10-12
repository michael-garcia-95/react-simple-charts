import { stat } from 'node:fs/promises';
import { win32 } from 'node:path';

// Windows npm.cmd requires a shell. Invoke its JS entry with Node instead so
// paths/arguments are never concatenated into a cmd.exe command string.
export async function npmCommand({
  platform = process.platform,
  executable = process.execPath,
  env = process.env,
  isFile = async (path) => {
    try {
      return (await stat(path)).isFile();
    } catch {
      return false;
    }
  },
} = {}) {
  if (platform !== 'win32') return { command: 'npm', prefix: [] };

  const path =
    Object.entries(env).find(([key]) => key.toLowerCase() === 'path')?.[1] ??
    '';
  const directories = path
    .split(win32.delimiter)
    .filter(Boolean)
    .map((dir) => dir.replace(/^"(.*)"$/, '$1'));
  const candidates = [
    env.npm_execpath,
    ...directories.map((dir) =>
      win32.join(dir, 'node_modules/npm/bin/npm-cli.js'),
    ),
    win32.join(win32.dirname(executable), 'node_modules/npm/bin/npm-cli.js'),
  ];
  for (const candidate of candidates) {
    if (
      candidate &&
      win32.basename(candidate) === 'npm-cli.js' &&
      (await isFile(candidate))
    )
      return { command: executable, prefix: [candidate] };
  }
  throw new Error(
    'Cannot locate npm-cli.js on Windows. Install Node with npm and add its directory to PATH, or invoke verification through npm run so npm_execpath identifies the CLI.',
  );
}
