import { manifestPolicy } from './artifact/manifest-policy.mjs';
import { mkdtemp, rm } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { createEvidenceRun } from './verification-evidence.mjs';
import { artifactOptions, selectArtifact } from './artifact/selection.mjs';
import { verifyExactPackage } from './artifact/package.mjs';
const root = resolve(import.meta.dirname, '..');
const options = artifactOptions();
if (!options)
  throw new Error(
    'Exact package verification requires explicit archive, digest and source SHA',
  );
const base = options['evidence-base']
  ? resolve(options['evidence-base'])
  : join(root, 'work/exact-package');
const run = await createEvidenceRun(base, 'exact-package', {
  mode: 'exact-artifact',
  policy: manifestPolicy(options),
  selectionRequest: options,
  parentRunId: options['parent-run'],
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
  },
  async () => {
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
        'Exact package cleanup/integrity failed',
      );
  },
);
console.log(JSON.stringify(run.report, null, 2));
