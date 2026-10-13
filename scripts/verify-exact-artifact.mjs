import {
  manifestPolicy,
  policyArguments,
} from './artifact/manifest-policy.mjs';
// Verification only: this coordinator has no registry-write or release operation.
import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { createEvidenceRun, errorDetails } from './verification-evidence.mjs';
import { runVerificationCommand } from './verification-command.mjs';
import { artifactOptions, selectArtifact } from './artifact/selection.mjs';
import { sha256 } from './artifact/archive.mjs';
import { verifyExactPackage } from './artifact/package.mjs';
import { requiredEngines, validateGateReport } from './artifact/results.mjs';

const root = resolve(import.meta.dirname, '..');
const options = artifactOptions();
assert(
  options,
  'Required: --artifact PATH --sha256 DIGEST --source-sha FULL_COMMIT',
);
assert(!options['parent-run'], 'Coordinator cannot be a child gate');
const policy = manifestPolicy(options);
const base = options['evidence-base']
  ? resolve(options['evidence-base'])
  : join(root, 'work/exact-artifact');
const run = await createEvidenceRun(base, 'exact-artifact-verification', {
  mode: 'exact-artifact',
  policy,
  selectionRequest: options,
  requiredEngines,
  gates: [],
  limitations: [
    'Checkout/content linkage is not independently attested build provenance.',
    'Manifest policy verification is not candidate creation, distribution or publication authorization.',
    'Source unit/type/website checks remain separate source gates.',
    'No native Windows, physical Safari/devices or manual NVDA validation.',
    'Read-only copies and digest boundary checks detect cooperative mutations; they do not isolate against a privileged host attacker.',
  ],
});
let scratch;
let artifact;
await run.execute(
  async () => {
    scratch = await mkdtemp(join(base, 'temporary-'));
    artifact = await run.phase('archive selection and inspection', () =>
      selectArtifact({ root, work: scratch, options }),
    );
    run.report.artifact = artifact.identity;
    run.report.package = await run.phase('exact package/API/declarations', () =>
      verifyExactPackage({ artifact, work: scratch, root }),
    );
    for (const [name, script] of [
      ['installed-consumers', 'verify-consumers.mjs'],
      ['browser-smoke', 'verify-browser-smoke.mjs'],
    ]) {
      const gateBase = join(run.directory, name);
      await artifact.verify();
      const startedAt = new Date().toISOString();
      const row = { name, status: 'running', startedAt };
      run.report.gates.push(row);
      await run.phase(name, async () => {
        let commandError;
        try {
          await runVerificationCommand(
            'node',
            [
              join(root, 'scripts', script),
              '--artifact',
              artifact.genuine,
              '--sha256',
              artifact.identity.sha256,
              '--source-sha',
              options['source-sha'],
              ...policyArguments(policy),
              '--parent-run',
              run.report.runId,
              '--evidence-base',
              gateBase,
            ],
            {
              cwd: root,
              env: process.env,
              signal: run.signal,
              timeoutMs: 2400000,
            },
          );
        } catch (error) {
          commandError = error;
        }
        async function readChild() {
          const pointer = JSON.parse(
            await readFile(join(gateBase, 'current.json'), 'utf8'),
          );
          assert.equal(
            resolve(pointer.directory),
            join(gateBase, 'runs', pointer.runId),
            'Gate pointer must stay in owned evidence base',
          );
          const reportPath = join(pointer.directory, 'results.json');
          const bytes = await readFile(reportPath);
          const report = JSON.parse(bytes);
          assert.equal(
            report.runId,
            pointer.runId,
            'Gate pointer/run identity differs',
          );
          Object.assign(row, {
            runId: report.runId,
            reportPath,
            reportSha256: sha256(bytes),
            childStatus: report.status,
            error: report.error,
            diagnosticErrors: report.diagnosticErrors,
            cleanupErrors: report.cleanupErrors,
            configurations: report.configurations,
            checks: report.checks,
            browsers: report.browsers,
            versions: report.versions,
          });
          return { report, reportPath, bytes };
        }
        if (commandError) {
          row.commandError = errorDetails(commandError);
          await run.diagnostics([readChild]);
          throw commandError;
        }
        const { report, reportPath, bytes } = await readChild();
        const finishedAt = new Date().toISOString();
        validateGateReport(report, {
          name,
          parent: run.report.runId,
          identity: artifact.identity,
          startedAt,
          finishedAt,
        });
        Object.assign(row, {
          status: 'passed',
          finishedAt,
          runId: report.runId,
          reportPath,
          reportSha256: sha256(bytes),
          artifactSha256: report.artifact.sha256,
          configurations: report.configurations,
          checks: report.checks,
          browsers: report.browsers,
          versions: report.versions,
        });
        await artifact.verify();
      });
    }
    assert.equal(run.report.gates.length, 2);
    assert(run.report.gates.every((gate) => gate.status === 'passed'));
  },
  async () => {
    for (const gate of run.report.gates)
      if (gate.status === 'running') gate.status = 'failed';
    const integrity = await Promise.allSettled([artifact?.verify()]);
    const results = await Promise.allSettled([
      scratch
        ? rm(scratch, { recursive: true, force: true })
        : Promise.resolve(),
    ]);
    const errors = [...integrity, ...results]
      .filter((item) => item.status === 'rejected')
      .map((item) => item.reason);
    if (errors.length)
      throw new AggregateError(
        errors,
        'Exact artifact cleanup/integrity failed',
      );
  },
);
console.log(JSON.stringify(run.report, null, 2));
