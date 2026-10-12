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

test(
  'command timeout bounds an unresponsive owned child and retains output',
  { timeout: 5000 },
  async () => {
    await assert.rejects(
      runVerificationCommand(
        'node',
        [
          '-e',
          'process.stdout.write("before timeout");process.on("SIGTERM",()=>{});setInterval(()=>{},1000)',
        ],
        { capture: true, timeoutMs: 300, shutdownMs: 100 },
      ),
      (error) => error.kind === 'timeout' && error.stdout === 'before timeout',
    );
  },
);
test(
  'cancellation waits for owned process cleanup',
  { timeout: 5000 },
  async () => {
    const controller = new AbortController();
    const timer = setTimeout(
      () => controller.abort(new Error('controlled cancellation')),
      300,
    );
    try {
      await assert.rejects(
        runVerificationCommand('node', ['-e', 'setInterval(()=>{},1000)'], {
          capture: true,
          signal: controller.signal,
          shutdownMs: 100,
        }),
        (error) => error.kind === 'cancelled',
      );
    } finally {
      clearTimeout(timer);
    }
  },
);
test('pre-cancelled command does not spawn', { timeout: 5000 }, async () => {
  const controller = new AbortController();
  controller.abort();
  await assert.rejects(
    runVerificationCommand(
      'node',
      ['-e', 'throw new Error("must not execute")'],
      { signal: controller.signal },
    ),
    /cancelled before spawn/,
  );
});

test(
  'POSIX command timeout terminates descendant listeners that ignore SIGTERM',
  { timeout: 5000, skip: process.platform === 'win32' },
  async () => {
    const { createServer } = await import('node:net');
    const probe = createServer();
    await new Promise((resolve) => probe.listen(0, '127.0.0.1', resolve));
    const port = probe.address().port;
    await new Promise((resolve) => probe.close(resolve));
    const descendant = `require('node:http').createServer((q,r)=>r.end('owned')).listen(${port},'127.0.0.1',()=>process.stdout.write('listener-ready'));process.on('SIGTERM',()=>{});`;
    const parent = `require('node:child_process').spawn(process.execPath,['-e',${JSON.stringify(descendant)}],{stdio:'inherit'});process.on('SIGTERM',()=>{});setInterval(()=>{},1000);`;
    await assert.rejects(
      runVerificationCommand('node', ['-e', parent], {
        capture: true,
        timeoutMs: 1000,
        shutdownMs: 100,
      }),
      (error) =>
        error.kind === 'timeout' && error.stdout.includes('listener-ready'),
    );
    const released = createServer();
    await new Promise((resolve, reject) => {
      released.once('error', reject);
      released.listen(port, '127.0.0.1', resolve);
    });
    await new Promise((resolve) => released.close(resolve));
  },
);
