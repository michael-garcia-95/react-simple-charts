import { randomUUID } from 'node:crypto';
import { mkdir, rename, writeFile, rm, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { hostname } from 'node:os';
import { within } from './owned-process.mjs';

export function errorDetails(error) {
  return serializeError(error, 0);
}
function serializeError(error, depth) {
  return {
    message: String(error?.message ?? error),
    stack: error?.stack,
    kind: error?.kind,
    code: error?.code,
    signal: error?.signal,
    cause:
      depth < 3 && error?.cause
        ? serializeError(error.cause, depth + 1)
        : undefined,
    errors:
      depth < 3 && error?.errors
        ? Array.from(error.errors, (item) => serializeError(item, depth + 1))
        : undefined,
  };
}
export async function atomicJson(path, value) {
  const temporary = `${path}.${randomUUID()}.tmp`;
  await writeFile(temporary, JSON.stringify(value, null, 2) + '\n');
  await rename(temporary, path);
}

// Retained evidence is compact; fixtures/installed dependencies live elsewhere.
export async function createEvidenceRun(
  base,
  name,
  data = {},
  { write = atomicJson } = {},
) {
  await mkdir(base, { recursive: true });
  const claim = join(base, '.current-claim');
  try {
    await mkdir(claim);
  } catch (cause) {
    throw new Error(
      `Cannot own evidence pointer claim at ${claim}: ${cause.code === 'EEXIST' ? 'claim in progress or interrupted; retry after it completes, or confirm no initializer is active before manually removing this guard' : cause.message}`,
      { cause },
    );
  }
  let startupError;
  let startupFailed = false;
  let releaseClaim;
  const runId = `${new Date().toISOString().replaceAll(':', '-')}-${randomUUID()}`;
  const directory = join(base, 'runs', runId);
  const report = {
    ...data,
    runId,
    name,
    startedAt: new Date().toISOString(),
    environment: {
      node: process.version,
      platform: process.platform,
      arch: process.arch,
      cwd: process.cwd(),
    },
    status: 'running',
    phase: 'initialization',
    phases: [{ name: 'initialization', status: 'running' }],
    diagnosticErrors: [],
    cleanupErrors: [],
  };
  let sealed = false;
  let writing = Promise.resolve();
  async function persist() {
    if (sealed)
      throw new Error('Evidence run is finalized; late writes are prohibited');
    const snapshot = JSON.parse(JSON.stringify(report));
    const operation = writing
      .catch(() => {})
      .then(async () => {
        await write(join(directory, 'results.json'), snapshot);
      });
    writing = operation;
    return operation;
  }
  // Admission is ordered by exclusive guard acquisition, not call arrival.
  // Never steal a guard: an interrupted owner requires explicit idle recovery.
  try {
    await writeFile(
      join(claim, 'owner.json'),
      JSON.stringify({
        runId,
        pid: process.pid,
        host: hostname(),
        startedAt: report.startedAt,
      }),
    );
    await mkdir(directory, { recursive: true });
    await write(join(base, 'current.json'), {
      runId,
      directory,
      startedAt: report.startedAt,
    });
    await persist(); // Before manifest reads, pack, driver installation or launch.
  } catch (error) {
    startupError = error;
    startupFailed = true;
  }
  try {
    const owner = JSON.parse(await readFile(join(claim, 'owner.json'), 'utf8'));
    if (owner.runId !== runId)
      throw new Error(
        `Evidence pointer claim ownership changed at ${claim}; refusing to remove it`,
      );
    await rm(claim, { recursive: true });
  } catch (error) {
    releaseClaim = error;
    if (!startupFailed) {
      startupError = error;
      startupFailed = true;
    } else if (startupError && typeof startupError === 'object')
      startupError.cleanupErrors = [
        ...(startupError.cleanupErrors ?? []),
        error,
      ];
  }
  if (startupFailed) {
    report.status = 'failed';
    report.error = errorDetails(startupError);
    report.failingPhase = 'initialization';
    report.phases[0].status = 'failed';
    if (releaseClaim) report.cleanupErrors.push(errorDetails(releaseClaim));
    try {
      await persist();
    } catch (error) {
      console.error('Startup evidence write also failed:', error);
    }
    throw startupError;
  }
  const controller = new AbortController();
  const cancellation = [];
  let cancellationWork;
  controller.signal.addEventListener(
    'abort',
    () => {
      report.cancellation = errorDetails(controller.signal.reason);
      cancellationWork = Promise.allSettled(
        cancellation.map((cleanup) =>
          within(
            Promise.resolve().then(cleanup),
            20000,
            'Run cancellation cleanup timed out',
          ),
        ),
      );
    },
    { once: true },
  );
  const cancel = (signal) =>
    controller.abort(new Error(`Verification run cancelled by ${signal}`));
  const interrupt = () => cancel('SIGINT');
  const terminate = () => cancel('SIGTERM');
  process.on('SIGINT', interrupt);
  process.on('SIGTERM', terminate);
  console.log(`Verification run ${runId}: ${directory}`);
  const run = {
    directory,
    report,
    persist,
    signal: controller.signal,
    onCancel(cleanup) {
      cancellation.push(cleanup);
    },
    async phase(name, action) {
      if (sealed) throw new Error('Evidence run is finalized');
      controller.signal.throwIfAborted();
      const initialization = report.phases[0];
      if (initialization.status === 'running') initialization.status = 'passed';
      report.phase = name;
      const item = {
        name,
        status: 'running',
        startedAt: new Date().toISOString(),
      };
      report.phases.push(item);
      await persist();
      try {
        const value = await action();
        item.status = 'passed';
        item.finishedAt = new Date().toISOString();
        await persist();
        return value;
      } catch (error) {
        item.status = 'failed';
        item.error = errorDetails(error);
        report.failingPhase ??= name;
        throw error;
      }
    },
    async diagnostics(operations) {
      const results = await Promise.allSettled(
        operations.map((operation) =>
          within(
            Promise.resolve().then(operation),
            10000,
            'Diagnostic operation timed out',
          ),
        ),
      );
      report.diagnosticErrors.push(
        ...results
          .filter((item) => item.status === 'rejected')
          .map((item) => errorDetails(item.reason)),
      );
    },
    async execute(action, cleanup = async () => {}) {
      let original;
      let failed = false;
      try {
        await action();
        controller.signal.throwIfAborted();
        if (report.phases.some((phase) => phase.status === 'failed'))
          throw new Error(
            'A required verification phase failed; see phase diagnostics',
          );
        if (report.cleanupErrors.length || report.diagnosticErrors.length)
          throw new Error(
            'Verification diagnostics or cleanup failed; see recorded secondary errors',
          );
      } catch (error) {
        original = error;
        failed = true;
        report.error = errorDetails(error);
        report.failingPhase ??= report.phase;
        report.cleanupErrors.push(
          ...(error?.cleanupErrors ?? []).map(errorDetails),
        );
        for (const phase of report.phases)
          if (phase.status === 'running') phase.status = 'failed';
        for (const item of [
          ...(report.configurations ?? []),
          ...(report.browsers ?? []),
        ]) {
          if (item.status === 'running') {
            item.status = 'failed';
            item.error = errorDetails(error);
          }
        }
      }
      report.phase = 'cleanup';
      if (cancellationWork) {
        const results = await cancellationWork;
        report.cleanupErrors.push(
          ...results
            .filter((item) => item.status === 'rejected')
            .map((item) => errorDetails(item.reason)),
        );
      }
      if (!failed)
        for (const phase of report.phases)
          if (phase.status === 'running') phase.status = 'passed';
      const cleanupPhase = { name: 'cleanup', status: 'running' };
      report.phases.push(cleanupPhase);
      try {
        await persist();
      } catch (error) {
        report.diagnosticErrors.push(errorDetails(error));
        if (!failed) {
          original = error;
          failed = true;
          report.error = errorDetails(error);
        }
      }
      try {
        await within(
          Promise.resolve().then(cleanup),
          30000,
          'Run cleanup timed out',
        );
      } catch (error) {
        report.cleanupErrors.push(errorDetails(error));
        if (!failed) {
          original = error;
          failed = true;
          report.error = errorDetails(error);
          report.failingPhase = 'cleanup';
        }
      }
      // Callbacks may record Error instances or already serialized details.
      for (const key of ['cleanupErrors', 'diagnosticErrors'])
        report[key] = report[key].map((item) =>
          item instanceof Error ? errorDetails(item) : item,
        );
      const failedPhase = report.phases.find(
        (phase) => phase.status === 'failed',
      );
      if (
        failedPhase ||
        report.cleanupErrors.length ||
        report.diagnosticErrors.length
      ) {
        if (!failed) {
          original = new Error(
            'Verification phases, diagnostics or cleanup failed; see recorded errors',
          );
          failed = true;
          report.error = errorDetails(original);
          report.failingPhase ??= failedPhase?.name ?? 'cleanup';
        }
      }
      report.status = failed ? 'failed' : 'passed';
      cleanupPhase.status =
        report.cleanupErrors.length || report.diagnosticErrors.length
          ? 'failed'
          : 'passed';
      report.phase = 'final outcome';
      report.finishedAt = new Date().toISOString();
      const finalPhase = { name: 'final outcome', status: report.status };
      report.phases.push(finalPhase);
      try {
        await persist();
      } catch (error) {
        report.status = 'failed';
        finalPhase.status = 'failed';
        report.diagnosticErrors.push(errorDetails(error));
        if (!failed) {
          original = error;
          failed = true;
          report.error = errorDetails(error);
        }
        // Retry fail-closed state for transient I/O errors. Persistent I/O failure
        // is fatal and cannot guarantee durable evidence; never report success.
        try {
          await persist();
        } catch (writeError) {
          console.error('Final evidence write also failed:', writeError);
        }
      }
      sealed = true;
      process.removeListener('SIGINT', interrupt);
      process.removeListener('SIGTERM', terminate);
      if (failed) throw original;
      return report;
    },
  };
  return run;
}
