import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { createServer as portProbe } from 'node:net';
import { test } from 'node:test';
import {
  fixtureIdentity,
  fixtureMeta,
  withVerificationServer,
} from '../verification-server.mjs';

async function unusedPort() {
  const probe = portProbe();
  await new Promise((resolve) => probe.listen(0, '127.0.0.1', resolve));
  const port = probe.address().port;
  await new Promise((resolve) => probe.close(resolve));
  return port;
}
async function assertPortFree(port) {
  const probe = portProbe();
  await new Promise((resolve, reject) => {
    probe.once('error', reject);
    probe.listen(port, '127.0.0.1', resolve);
  });
  await new Promise((resolve) => probe.close(resolve));
}
async function fixture({
  mode = 'ready',
  html,
  command,
  shutdownMs = 500,
  timeoutMs = 3000,
} = {}) {
  const port = await unusedPort();
  const identity = fixtureIdentity('test');
  const source =
    mode === 'exit'
      ? 'process.exit(23)'
      : mode === 'never-listen'
        ? 'setInterval(()=>{},1000)'
        : `
      import {createServer} from 'node:http';
      ${mode === 'ignore-term' ? "process.on('SIGTERM',()=>{});" : ''}
      createServer((request,response)=>{
        ${mode === 'stalled-http' ? '' : `response.end(${JSON.stringify(html ?? fixtureMeta(identity))});`}
      }).listen(${port},'127.0.0.1');`;
  return {
    port,
    identity,
    options: {
      ...(command ? { command } : {}),
      args: ['--input-type=module', '-e', source],
      url: `http://127.0.0.1:${port}`,
      identity,
      timeoutMs,
      pollMs: 20,
      shutdownMs,
    },
  };
}

test('expected identity gates verification and successful cleanup closes the real child', async () => {
  const f = await fixture();
  let child;
  assert.equal(
    await withVerificationServer(f.options, async (server) => {
      child = server.child;
      assert.ok(server.html.includes(f.identity));
      assert.equal((await fetch(server.url)).status, 200);
      assert.equal(child.exitCode, null);
      return 'verified';
    }),
    'verified',
  );
  assert.ok(child.exitCode !== null || child.signalCode !== null);
  await assertPortFree(f.port);
});
for (const currentMarker of [false, true]) {
  test(`occupied port rejects before verification, including current marker ${currentMarker}`, async () => {
    const identity = fixtureIdentity('test');
    const html = fixtureMeta(currentMarker ? identity : fixtureIdentity('old'));
    const existing = createServer((req, res) => res.end(html));
    await new Promise((resolve) => existing.listen(0, '127.0.0.1', resolve));
    const port = existing.address().port;
    let calls = 0;
    try {
      await assert.rejects(
        withVerificationServer(
          {
            args: ['-e', 'process.exit(0)'],
            url: `http://127.0.0.1:${port}`,
            identity,
          },
          () => {
            calls++;
          },
        ),
        /port .* unavailable: EADDRINUSE/,
      );
      assert.equal(calls, 0);
      assert.equal(
        await (await fetch(`http://127.0.0.1:${port}`)).text(),
        html,
        'An incumbent server must not be killed',
      );
    } finally {
      await new Promise((resolve) => existing.close(resolve));
    }
  });
}
test('early process exit is a startup failure and never enters verification', async () => {
  const f = await fixture({ mode: 'exit' });
  let calls = 0;
  await assert.rejects(
    withVerificationServer(f.options, () => {
      calls++;
    }),
    /code 23/,
  );
  assert.equal(calls, 0);
  await assertPortFree(f.port);
});
test('spawn errors surface the actual ENOENT cause', async () => {
  const f = await fixture({ command: '/rsc-missing-executable' });
  await assert.rejects(
    withVerificationServer(f.options, () => assert.fail('must not verify')),
    /process error:.*ENOENT/,
  );
  await assertPortFree(f.port);
});
test('a live child that never listens times out and is terminated', async () => {
  const f = await fixture({ mode: 'never-listen', timeoutMs: 250 });
  await assert.rejects(
    withVerificationServer(f.options, () => assert.fail('must not verify')),
    /startup timed out after 250ms/,
  );
  await assertPortFree(f.port);
});
test('HTTP body stalls cannot bypass the startup deadline or leak the listener', async () => {
  const f = await fixture({ mode: 'stalled-http', timeoutMs: 500 });
  await assert.rejects(
    withVerificationServer(f.options, () => assert.fail('must not verify')),
    /startup timed out after 500ms/,
  );
  await assertPortFree(f.port);
});
test('HTTP success with a previous build identity fails explicitly and cleans up', async () => {
  const f = await fixture({ html: fixtureMeta(fixtureIdentity('test')) });
  let calls = 0;
  await assert.rejects(
    withVerificationServer(f.options, () => {
      calls++;
    }),
    /identity mismatch/,
  );
  assert.equal(calls, 0);
  await assertPortFree(f.port);
});
test('HTTP success without any marker fails explicitly', async () => {
  const f = await fixture({ html: '<title>Same fixture title</title>' });
  await assert.rejects(
    withVerificationServer(f.options, () => assert.fail('must not verify')),
    /identity mismatch/,
  );
  await assertPortFree(f.port);
});
test('test failure is preserved while its child is terminated', async () => {
  const f = await fixture();
  const original = new Error('browser assertion failed');
  await assert.rejects(
    withVerificationServer(f.options, () => {
      throw original;
    }),
    (error) => error === original,
  );
  await assertPortFree(f.port);
});
test('process death during verification cannot be returned as a pass', async () => {
  const f = await fixture();
  await assert.rejects(
    withVerificationServer(f.options, async ({ child }) => {
      const exited = new Promise((resolve) => child.once('exit', resolve));
      child.kill();
      await exited;
      return 'would otherwise pass';
    }),
    /exited before verification completed/,
  );
  await assertPortFree(f.port);
});
test(
  'SIGTERM-resistant child is forcibly stopped within bounded cleanup',
  { skip: process.platform === 'win32' },
  async () => {
    const f = await fixture({ mode: 'ignore-term', shutdownMs: 150 });
    let child;
    await withVerificationServer(f.options, (server) => {
      child = server.child;
    });
    assert.equal(child.signalCode, 'SIGKILL');
    await assertPortFree(f.port);
  },
);
test('build identities differ for successive runs and consumer configurations', () => {
  const identities = [
    fixtureIdentity('vite-18'),
    fixtureIdentity('vite-18'),
    fixtureIdentity('next-18'),
  ];
  assert.equal(new Set(identities).size, 3);
  assert.ok(identities[0].startsWith('vite-18:'));
});

test(
  'cleanup also stops a descendant listener that ignores SIGTERM',
  { skip: process.platform === 'win32' },
  async () => {
    const f = await fixture();
    const descendantPort = await unusedPort();
    const descendant = `import {createServer} from 'node:http';
    process.on('SIGTERM',()=>{});
    createServer((req,res)=>res.end('descendant')).listen(${descendantPort},'127.0.0.1');`;
    f.options.args = [
      '--input-type=module',
      '-e',
      `
    import {createServer} from 'node:http'; import {spawn} from 'node:child_process';
    spawn(process.execPath,['--input-type=module','-e',${JSON.stringify(descendant)}],{stdio:'ignore'});
    createServer((req,res)=>res.end(${JSON.stringify(fixtureMeta(f.identity))})).listen(${f.port},'127.0.0.1');`,
    ];
    await withVerificationServer(f.options, async () => {
      const deadline = Date.now() + 3000;
      while (true) {
        try {
          assert.equal(
            await (await fetch(`http://127.0.0.1:${descendantPort}`)).text(),
            'descendant',
          );
          break;
        } catch (error) {
          if (Date.now() >= deadline) throw error;
          await new Promise((resolve) => setTimeout(resolve, 20));
        }
      }
    });
    await assertPortFree(f.port);
    const deadline = Date.now() + 1000;
    while (true) {
      try {
        await assertPortFree(descendantPort);
        break;
      } catch (error) {
        if (Date.now() >= deadline) throw error;
        await new Promise((resolve) => setTimeout(resolve, 20));
      }
    }
  },
);

test('a child-side EADDRINUSE failure cannot be mistaken for readiness', async () => {
  const f = await fixture();
  f.options.args = [
    '--input-type=module',
    '-e',
    `
    import {createServer} from 'node:http';
    createServer((req,res)=>res.end(${JSON.stringify(fixtureMeta(f.identity))}))
      .listen(${f.port},'127.0.0.1',()=>{
        const duplicate=createServer();
        duplicate.on('error',error=>{console.error(error.code);process.exit(7)});
        duplicate.listen(${f.port},'127.0.0.1');
      });`,
  ];
  await assert.rejects(
    withVerificationServer(f.options, () => assert.fail('must not verify')),
    /code 7.*EADDRINUSE/,
  );
  await assertPortFree(f.port);
});
