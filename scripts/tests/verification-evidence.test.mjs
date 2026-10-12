import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { createEvidenceRun, atomicJson } from '../verification-evidence.mjs';

async function temporary(action) {
  const base = await mkdtemp(join(tmpdir(), 'rsc-evidence-'));
  try {
    await action(base);
  } finally {
    await rm(base, { recursive: true, force: true });
  }
}
const reportAt = async (run) =>
  JSON.parse(await readFile(join(run.directory, 'results.json'), 'utf8'));

test(
  'unique runs preserve prior success and a later pack failure stays failed',
  { timeout: 5000 },
  async () =>
    temporary(async (base) => {
      const first = await createEvidenceRun(base, 'test');
      await first.execute(() =>
        first.phase('browser assertions', async () => {}),
      );
      const before = await readFile(
        join(first.directory, 'results.json'),
        'utf8',
      );
      const second = await createEvidenceRun(base, 'test', {
        browsers: [{ status: 'unexecuted' }],
      });
      const original = new Error('controlled pack failure');
      await assert.rejects(
        second.execute(() =>
          second.phase('package creation', async () => {
            throw original;
          }),
        ),
        (error) => error === original,
      );
      assert.notEqual(first.report.runId, second.report.runId);
      assert.equal(
        await readFile(join(first.directory, 'results.json'), 'utf8'),
        before,
      );
      const report = await reportAt(second);
      assert.equal(report.status, 'failed');
      assert.equal(report.failingPhase, 'package creation');
      assert.equal(report.browsers[0].status, 'unexecuted');
      assert.equal(
        JSON.parse(await readFile(join(base, 'current.json'), 'utf8')).runId,
        second.report.runId,
      );
      await assert.rejects(second.persist(), /finalized/);
    }),
);
for (const phase of ['driver preparation', 'browser launch']) {
  test(
    `${phase} failure is durable before later phases execute`,
    { timeout: 5000 },
    async () =>
      temporary(async (base) => {
        const run = await createEvidenceRun(base, 'test', {
          configurations: [{ status: 'running' }, { status: 'unexecuted' }],
        });
        await assert.rejects(
          run.execute(() =>
            run.phase(phase, async () => {
              throw new Error(phase + ' failure');
            }),
          ),
          /failure/,
        );
        const report = await reportAt(run);
        assert.equal(report.status, 'failed');
        assert.equal(report.failingPhase, phase);
        assert.deepEqual(
          report.configurations.map((item) => item.status),
          ['failed', 'unexecuted'],
        );
      }),
  );
}
test(
  'diagnostic and cleanup errors preserve the original assertion error',
  { timeout: 5000 },
  async () =>
    temporary(async (base) => {
      const run = await createEvidenceRun(base, 'test');
      const original = new Error('original assertion');
      await assert.rejects(
        run.execute(
          async () => {
            await run.diagnostics([
              async () => {
                throw new Error('diagnostic write failure');
              },
              async () => {},
            ]);
            throw original;
          },
          async () => {
            throw new Error('cleanup failure');
          },
        ),
        (error) => error === original,
      );
      const report = await reportAt(run);
      assert.equal(report.status, 'failed');
      assert.equal(report.error.message, original.message);
      assert.match(report.diagnosticErrors[0].message, /diagnostic write/);
      assert.match(report.cleanupErrors[0].message, /cleanup failure/);
    }),
);
test(
  'cleanup failure turns successful verification into a failed complete run',
  { timeout: 5000 },
  async () =>
    temporary(async (base) => {
      const run = await createEvidenceRun(base, 'test');
      await assert.rejects(
        run.execute(
          async () => {},
          async () => {
            throw new Error('cleanup failed');
          },
        ),
        /cleanup failed/,
      );
      assert.equal((await reportAt(run)).status, 'failed');
      assert.equal(run.report.failingPhase, 'cleanup');
    }),
);
test(
  'final report write failure never leaves a current pass',
  { timeout: 5000 },
  async () =>
    temporary(async (base) => {
      const run = await createEvidenceRun(
        base,
        'test',
        {},
        {
          write: async (path, value) => {
            if (value.status === 'passed')
              throw new Error('controlled report write failure');
            await atomicJson(path, value);
          },
        },
      );
      await assert.rejects(
        run.execute(async () => {}),
        /report write failure/,
      );
      assert.equal((await reportAt(run)).status, 'failed');
      assert.equal(
        JSON.parse(await readFile(join(base, 'current.json'), 'utf8')).runId,
        run.report.runId,
      );
    }),
);
test(
  'success records completed phases and final outcome',
  { timeout: 5000 },
  async () =>
    temporary(async (base) => {
      const run = await createEvidenceRun(base, 'test');
      await run.execute(() => run.phase('browser assertions', async () => {}));
      const report = await reportAt(run);
      assert.equal(report.status, 'passed');
      assert.equal(report.phase, 'final outcome');
      assert.ok(
        report.startedAt && report.finishedAt && report.environment.node,
      );
      assert.ok(report.phases.every((item) => item.status === 'passed'));
    }),
);

test(
  'older completion cannot replace a newer current-run pointer',
  { timeout: 5000 },
  async () =>
    temporary(async (base) => {
      const older = await createEvidenceRun(base, 'test');
      const newer = await createEvidenceRun(base, 'test');
      await newer
        .execute(async () => {
          throw new Error('newer failed');
        })
        .catch(() => {});
      await older.execute(async () => {});
      const current = JSON.parse(
        await readFile(join(base, 'current.json'), 'utf8'),
      );
      assert.equal(current.runId, newer.report.runId);
      assert.equal((await reportAt(newer)).status, 'failed');
    }),
);

test(
  'falsy thrown values cannot become a success outcome',
  { timeout: 5000 },
  async () =>
    temporary(async (base) => {
      const run = await createEvidenceRun(base, 'test');
      await assert.rejects(
        run.execute(async () => {
          throw undefined;
        }),
        (value) => value === undefined,
      );
      assert.equal((await reportAt(run)).status, 'failed');
    }),
);

test(
  'a swallowed required-phase failure cannot produce a complete pass',
  { timeout: 5000 },
  async () =>
    temporary(async (base) => {
      const run = await createEvidenceRun(base, 'test');
      await assert.rejects(
        run.execute(async () => {
          await run
            .phase('package creation', async () => {
              throw new Error('pack failed');
            })
            .catch(() => {});
        }),
        /required verification phase failed/,
      );
      assert.equal((await reportAt(run)).status, 'failed');
    }),
);
