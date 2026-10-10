import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { npmCommand } from '../npm-command.mjs';

const executable = 'C:\\Program Files\\nodejs\\node.exe';
const adjacent =
  'C:\\Program Files\\nodejs\\node_modules\\npm\\bin\\npm-cli.js';
const options = { platform: 'win32', executable, env: {} };

test('Linux retains the existing npm PATH invocation', async () => {
  assert.deepEqual(await npmCommand({ platform: 'linux' }), {
    command: 'npm',
    prefix: [],
  });
});
test('Windows discovers the CLI next to Node even without npm_execpath', async () => {
  assert.deepEqual(
    await npmCommand({ ...options, isFile: async (p) => p === adjacent }),
    { command: executable, prefix: [adjacent] },
  );
});
test('npm-run selects its supplied CLI before searching other installations', async () => {
  const cli = 'C:\\npm custom prefix\\node_modules\\npm\\bin\\npm-cli.js';
  assert.deepEqual(
    await npmCommand({
      ...options,
      env: { npm_execpath: cli },
      isFile: async () => true,
    }),
    { command: executable, prefix: [cli] },
  );
});
test('Windows handles case-insensitive Path, quoted entries and spaces', async () => {
  const cli = 'C:\\User Tools\\npm\\node_modules\\npm\\bin\\npm-cli.js';
  assert.deepEqual(
    await npmCommand({
      ...options,
      env: { Path: 'C:\\Other;"C:\\User Tools\\npm"' },
      isFile: async (p) => p === cli,
    }),
    { command: executable, prefix: [cli] },
  );
});
test('a stale npm_execpath or npm.cmd falls back to an installed JS CLI', async () => {
  for (const npm_execpath of [
    'C:\\missing\\npm-cli.js',
    'C:\\Tools\\npm.cmd',
  ]) {
    assert.deepEqual(
      await npmCommand({
        ...options,
        env: { npm_execpath },
        isFile: async (p) => p === adjacent,
      }),
      { command: executable, prefix: [adjacent] },
    );
  }
});
test('missing Windows npm fails explicitly without invoking a shell', async () => {
  await assert.rejects(
    npmCommand({ ...options, isFile: async () => false }),
    /Cannot locate npm-cli.js on Windows/,
  );
});
test('Node invocation preserves a CLI path, cwd and arguments with spaces/metacharacters', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'rsc npm path with spaces '));
  try {
    const cli = join(dir, 'npm-cli.js');
    const cwd = join(dir, 'working directory');
    await mkdir(cwd);
    await writeFile(
      cli,
      'process.stdout.write(JSON.stringify({args:process.argv.slice(2),cwd:process.cwd()}));',
    );
    const command = await npmCommand({
      platform: 'win32',
      executable: process.execPath,
      env: { npm_execpath: cli },
    });
    const args = [
      'pack',
      '--pack-destination',
      join(dir, 'archive space'),
      'literal & echo',
      '%PATH%',
      'quote"value',
    ];
    const child = spawn(command.command, [...command.prefix, ...args], {
      cwd,
      shell: false,
    });
    let output = '';
    child.stdout.on('data', (chunk) => {
      output += chunk;
    });
    await new Promise((res, rej) => {
      child.on('error', rej);
      child.on('close', (code) =>
        code === 0 ? res() : rej(new Error(`Node exited ${code}`)),
      );
    });
    assert.deepEqual(JSON.parse(output), { args, cwd });
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});
