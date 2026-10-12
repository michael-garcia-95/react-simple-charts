import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { runVerificationCommand } from '../verification-command.mjs';

test(
  'Linux npm PATH invocation completes and a missing executable reports ENOENT',
  { skip: process.platform !== 'linux' },
  async () => {
    const result = await runVerificationCommand('npm', ['--version'], {
      capture: true,
    });
    assert.match(result.stdout.trim(), /^\d+\.\d+\.\d+/);
    await assert.rejects(
      runVerificationCommand('npm', ['--version'], {
        capture: true,
        env: { PATH: join(tmpdir(), 'missing-rsc-path-' + process.pid) },
      }),
      /npm --version in .*spawn failed \(ENOENT\)/s,
    );
  },
);

test('Node and simulated Windows npm preserve arguments, cwd, environment and both streams', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'rsc command spaces '));
  try {
    const cwd = join(directory, 'custom cwd');
    await mkdir(cwd);
    const cli = join(directory, 'npm-cli.js');
    await writeFile(
      cli,
      'process.stdout.write(JSON.stringify({args:process.argv.slice(2),cwd:process.cwd(),env:process.env.RSC_TEST}));process.stderr.write("diagnostic");',
    );
    const args = [
      'space value',
      'literal & echo',
      '%PATH%',
      '$HOME',
      'quote"value',
      "single'quote",
      'back\\slash',
    ];
    const env = { ...process.env, RSC_TEST: 'propagated', npm_execpath: cli };
    for (const command of ['node', 'npm']) {
      const result = await runVerificationCommand(
        command,
        command === 'node' ? [cli, ...args] : args,
        { cwd, env, capture: true, npmOptions: { platform: 'win32' } },
      );
      assert.deepEqual(JSON.parse(result.stdout), {
        args,
        cwd,
        env: 'propagated',
      });
      assert.equal(result.stderr, 'diagnostic');
    }
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
test('nonzero exit retains diagnostics and contextual exit code', async () => {
  await assert.rejects(
    runVerificationCommand(
      'node',
      ['-e', 'process.stderr.write("failed fixture");process.exit(7)'],
      { capture: true },
    ),
    (error) =>
      error.code === 7 &&
      error.stderr === 'failed fixture' &&
      /node -e in .*exited 7/s.test(error.message),
  );
});
test('spawn failure includes ENOENT and working-directory context', async () => {
  await assert.rejects(
    runVerificationCommand('node', ['-e', ''], {
      cwd: join(tmpdir(), 'rsc-missing-directory-' + process.pid),
      capture: true,
    }),
    /spawn failed \(ENOENT\)/,
  );
});
test(
  'signal termination is distinct from an exit code',
  {
    skip:
      process.platform === 'win32'
        ? 'POSIX signal assertion; Windows termination requires native validation'
        : false,
  },
  async () => {
    await assert.rejects(
      runVerificationCommand(
        'node',
        ['-e', 'process.kill(process.pid,"SIGTERM")'],
        { capture: true },
      ),
      (error) =>
        error.signal === 'SIGTERM' &&
        error.code === null &&
        /terminated by SIGTERM/.test(error.message),
    );
  },
);
test('inherited stream execution completes successfully', async () => {
  assert.deepEqual(
    await runVerificationCommand('node', ['-e', 'process.exit(0)']),
    { stdout: '', stderr: '' },
  );
});
