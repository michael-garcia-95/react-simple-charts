import assert from 'node:assert/strict';
import {
  mkdtemp,
  readFile,
  rm,
  mkdir,
  access,
  writeFile,
} from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import {
  createEvidenceRun,
  atomicJson,
  errorDetails,
} from '../verification-evidence.mjs';

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
  'delayed first pointer claim rejects overlapping startup without reordering admission',
  { timeout: 5000 },
  async () =>
    temporary(async (base) => {
      const prior = await createEvidenceRun(base, 'test');
      await prior.execute(async () => {});
      const priorBytes = await readFile(join(prior.directory, 'results.json'));
      let entered, release;
      const blocked = new Promise((resolve) => {
        release = resolve;
      });
      const ready = new Promise((resolve) => {
        entered = resolve;
      });
      const firstStart = createEvidenceRun(
        base,
        'test',
        {},
        {
          write: async (path, value) => {
            if (path === join(base, 'current.json')) {
              entered();
              await blocked;
            }
            await atomicJson(path, value);
          },
        },
      );
      try {
        await ready;
        await assert.rejects(
          createEvidenceRun(base, 'test'),
          /claim in progress or interrupted/,
        );
        assert.equal(
          JSON.parse(await readFile(join(base, 'current.json'), 'utf8')).runId,
          prior.report.runId,
        );
      } finally {
        release();
      }
      const first = await firstStart;
      const second = await createEvidenceRun(base, 'test');
      await second.execute(async () => {});
      await first.execute(async () => {});
      assert.notEqual(first.report.runId, second.report.runId);
      assert.equal(
        JSON.parse(await readFile(join(base, 'current.json'), 'utf8')).runId,
        second.report.runId,
      );
      assert.deepEqual(
        await readFile(join(prior.directory, 'results.json')),
        priorBytes,
      );
      await assert.rejects(access(join(base, '.current-claim')), {
        code: 'ENOENT',
      });
    }),
);

test(
  'interrupted pointer ownership fails closed without deleting the guard or prior result',
  { timeout: 5000 },
  async () =>
    temporary(async (base) => {
      const prior = await createEvidenceRun(base, 'test');
      await prior.execute(async () => {});
      await mkdir(join(base, '.current-claim'));
      await assert.rejects(
        createEvidenceRun(base, 'test'),
        /confirm no initializer is active/,
      );
      await access(join(base, '.current-claim'));
      assert.equal(
        JSON.parse(await readFile(join(base, 'current.json'), 'utf8')).runId,
        prior.report.runId,
      );
      assert.equal((await reportAt(prior)).status, 'passed');
    }),
);

test(
  'handled pointer write failure releases only its own guard and allows a later start',
  { timeout: 5000 },
  async () =>
    temporary(async (base) => {
      await assert.rejects(
        createEvidenceRun(
          base,
          'test',
          {},
          {
            write: async (path, value) => {
              if (path === join(base, 'current.json'))
                throw new Error('controlled pointer write failure');
              await atomicJson(path, value);
            },
          },
        ),
        /pointer write failure/,
      );
      await assert.rejects(access(join(base, '.current-claim')), {
        code: 'ENOENT',
      });
      const next = await createEvidenceRun(base, 'test');
      await next.execute(async () => {});
      assert.equal((await reportAt(next)).status, 'passed');
    }),
);

for (const originalFailure of [false, true]) {
  test(
    `normally returning cleanup records failure while preserving original=${originalFailure}`,
    { timeout: 5000 },
    async () =>
      temporary(async (base) => {
        const run = await createEvidenceRun(base, 'test');
        const original = new Error('original assertion');
        const cleanupError = new Error('recorded cleanup failure');
        const recorded = errorDetails(cleanupError);
        await assert.rejects(
          run.execute(
            async () => {
              if (originalFailure) throw original;
            },
            async () => {
              run.report.cleanupErrors.push(
                originalFailure ? cleanupError : recorded,
              );
            },
          ),
          (error) =>
            originalFailure
              ? error === original
              : /cleanup failed/.test(error.message),
        );
        const report = await reportAt(run);
        assert.equal(report.status, 'failed');
        assert.equal(
          report.phases.find((item) => item.name === 'cleanup').status,
          'failed',
        );
        assert.deepEqual(
          report.cleanupErrors[0],
          JSON.parse(JSON.stringify(recorded)),
        );
        if (originalFailure)
          assert.equal(report.error.message, original.message);
        else assert.equal(report.failingPhase, 'cleanup');
      }),
  );
}

for (const type of ['diagnostic', 'phase']) {
  test(
    `cleanup cannot record a ${type} failure and leave a passed outcome`,
    { timeout: 5000 },
    async () =>
      temporary(async (base) => {
        const run = await createEvidenceRun(base, 'test');
        await assert.rejects(
          run.execute(
            async () => {},
            async () => {
              if (type === 'diagnostic')
                run.report.diagnosticErrors.push(
                  errorDetails(new Error('recorded diagnostic failure')),
                );
              else
                run.report.phases.push({
                  name: 'required cleanup check',
                  status: 'failed',
                });
            },
          ),
          /cleanup failed/,
        );
        const report = await reportAt(run);
        assert.equal(report.status, 'failed');
        assert.ok(report.phases.some((item) => item.status === 'failed'));
      }),
  );
}

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

test(
  'changed claim owner is preserved and startup fails closed',
  { timeout: 5000 },
  async () =>
    temporary(async (base) => {
      await assert.rejects(
        createEvidenceRun(
          base,
          'test',
          {},
          {
            write: async (path, value) => {
              await atomicJson(path, value);
              if (path === join(base, 'current.json'))
                await writeFile(
                  join(base, '.current-claim/owner.json'),
                  JSON.stringify({ runId: 'foreign-owner' }),
                );
            },
          },
        ),
        /ownership changed/,
      );
      assert.equal(
        JSON.parse(
          await readFile(join(base, '.current-claim/owner.json'), 'utf8'),
        ).runId,
        'foreign-owner',
      );
      const current = JSON.parse(
        await readFile(join(base, 'current.json'), 'utf8'),
      );
      assert.equal(
        JSON.parse(
          await readFile(join(current.directory, 'results.json'), 'utf8'),
        ).status,
        'failed',
      );
    }),
);
