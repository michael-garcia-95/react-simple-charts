import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { within, stopOwnedProcess } from './owned-process.mjs';
import { randomUUID } from 'node:crypto';
import { createServer } from 'node:net';

export function fixtureIdentity(name) {
  assert.match(name, /^[a-z0-9-]+$/);
  return `${name}:${randomUUID()}`;
}
export function fixtureMeta(identity) {
  assert.match(identity, /^[a-z0-9:-]+$/);
  return `<meta name="rsc-verification" content="${identity}">`;
}
function hasIdentity(html, identity) {
  return [...html.matchAll(/<meta\b[^>]*>/gi)].some(
    ([tag]) =>
      /\sname=["']rsc-verification["']/i.test(tag) &&
      tag.match(/\scontent=["']([^"']*)["']/i)?.[1] === identity,
  );
}
async function freePort(url) {
  const address = new URL(url);
  assert.equal(address.hostname, '127.0.0.1');
  assert.ok(Number(address.port) > 0, 'An explicit fixture port is required');
  const probe = createServer();
  await new Promise((resolve, reject) => {
    probe.once('error', (error) =>
      reject(
        new Error(
          `Fixture port ${address.port} is unavailable: ${error.code}`,
          { cause: error },
        ),
      ),
    );
    probe.listen(
      { host: address.hostname, port: Number(address.port), exclusive: true },
      () => probe.close((error) => (error ? reject(error) : resolve())),
    );
  });
}
function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// One owner for startup, verification and bounded cleanup. Never kill by port.
export async function withVerificationServer(
  {
    command = process.execPath,
    args,
    cwd,
    env = process.env,
    url,
    identity,
    timeoutMs = 30000,
    pollMs = 100,
    shutdownMs = 3000,
    verificationMs = 300000,
    cancellationMs = 20000,
    signal,
  },
  verify,
) {
  fixtureMeta(identity); // Validate the marker before starting a child.
  signal?.throwIfAborted();
  await freePort(url); // Reject an incumbent even if it serves a newly rebuilt directory.
  const child = spawn(command, args, {
    cwd,
    env,
    shell: false,
    detached: process.platform !== 'win32',
    stdio: ['ignore', 'inherit', 'pipe'],
  });
  const lifetime = new AbortController();
  const cancellation = [];
  let work;
  const secondaryErrors = [];
  let stderr = '';
  let failure;
  let stopping = false;
  child.stderr?.on('data', (chunk) => {
    stderr = (stderr + chunk).slice(-8192);
    process.stderr.write(chunk);
  });
  let rejectFailure;
  const failed = new Promise((_, reject) => {
    rejectFailure = reject;
  });
  // It may reject while verify is running; assertRunning checks it before success.
  failed.catch(() => {});
  const fail = (error) => {
    if (!stopping && !failure) {
      failure = error;
      lifetime.abort(error);
      rejectFailure(error);
    }
  };
  child.on('error', (error) =>
    fail(
      new Error(`Fixture process error: ${error.message}`, { cause: error }),
    ),
  );
  child.on('exit', (code, signal) =>
    fail(
      new Error(
        `Fixture process exited before verification completed (code ${code}, signal ${signal}). ${stderr.trim()}`,
      ),
    ),
  );
  const close = new Promise((resolve) =>
    child.once('close', () => {
      resolve();
    }),
  );
  const assertRunning = () => {
    if (failure) throw failure;
    assert.ok(
      child.pid && child.exitCode === null && child.signalCode === null,
      'Fixture process is not running',
    );
  };
  const guarded = (promise) => Promise.race([promise, failed]);
  const abort = () =>
    fail(new Error('Fixture verification cancelled', { cause: signal.reason }));
  signal?.addEventListener('abort', abort, { once: true });
  if (signal?.aborted) abort();
  async function stop() {
    stopping = true;
    lifetime.abort();
    await stopOwnedProcess(child, close, { shutdownMs });
  }
  let original;
  let hasError = false;
  let result;
  try {
    const deadline = performance.now() + timeoutMs;
    await within(
      guarded(new Promise((resolve) => child.once('spawn', resolve))),
      timeoutMs,
      'Fixture process spawn timed out',
    );
    let html;
    let last = 'no HTTP response';
    while (performance.now() < deadline) {
      assertRunning();
      let response;
      let body;
      try {
        response = await guarded(
          fetch(url, {
            redirect: 'error',
            cache: 'no-store',
            signal: AbortSignal.any([
              lifetime.signal,
              AbortSignal.timeout(
                Math.max(
                  1,
                  Math.ceil(Math.min(1000, deadline - performance.now())),
                ),
              ),
            ]),
          }),
        );
        body = await guarded(response.text());
        last = `HTTP ${response.status}`;
      } catch (error) {
        assertRunning();
        last = error.message;
      }
      if (response?.ok && body !== undefined) {
        if (!hasIdentity(body, identity))
          throw new Error(
            `Fixture identity mismatch at ${url}; expected ${identity}`,
          );
        // Give early bind/startup failures a turn to arrive before any browser work.
        await guarded(delay(pollMs));
        assertRunning();
        html = body;
        break;
      }
      await guarded(
        delay(Math.min(pollMs, Math.max(0, deadline - performance.now()))),
      );
    }
    if (html === undefined || performance.now() >= deadline)
      throw new Error(
        `Fixture startup timed out after ${timeoutMs}ms at ${url} (${last})`,
      );
    work = Promise.resolve().then(() =>
      verify({
        url,
        html,
        identity,
        child,
        assertRunning,
        signal: lifetime.signal,
        onCancel: (cleanup) => cancellation.push(cleanup),
      }),
    );
    // On cancellation, supported callbacks close owned browser resources before
    // we stop awaiting them. Arbitrary JavaScript cannot be forcibly terminated.
    result = await within(
      guarded(work),
      verificationMs,
      'Fixture verification callback timed out',
    );
    assertRunning();
  } catch (error) {
    original = error;
    hasError = true;
    lifetime.abort(error);
    if (work) {
      const settled = await Promise.allSettled(
        cancellation.map((cleanup) =>
          within(
            Promise.resolve().then(cleanup),
            cancellationMs,
            'Verification cancellation cleanup timed out',
          ),
        ),
      );
      secondaryErrors.push(
        ...settled
          .filter((item) => item.status === 'rejected')
          .map((item) => item.reason),
      );
      try {
        await within(
          work.catch(() => {}),
          cancellationMs,
          'Verification callback did not settle after cancellation',
        );
      } catch (error) {
        secondaryErrors.push(error);
      }
    }
  }
  try {
    await stop();
  } catch (error) {
    if (hasError) secondaryErrors.push(error);
    else {
      original = error;
      hasError = true;
    }
  }
  signal?.removeEventListener('abort', abort);
  if (hasError) {
    if (secondaryErrors.length)
      if (
        original &&
        (typeof original === 'object' || typeof original === 'function')
      )
        original.cleanupErrors = [
          ...(original.cleanupErrors ?? []),
          ...secondaryErrors,
        ];
      else console.error('Fixture cleanup also failed:', secondaryErrors);
    throw original;
  }
  return result;
}
