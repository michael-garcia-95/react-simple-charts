import assert from 'node:assert/strict';
import { consumerConfigurations } from '../consumers/fixtures.mjs';
import { assertConsumerCompleteness } from '../consumers/evidence.mjs';

export const smokeScenarios = Object.freeze([
  ...['Line', 'Area', 'Bar', 'Pie', 'Donut'].flatMap((family) =>
    ['explicit', 'responsive'].map((sizing) => `${family} ${sizing}`),
  ),
  'empty/unavailable',
  'multiple charts/unique IDs',
  'native resize',
  'axe/accessibility tree',
  'no console/page exceptions',
]);
export const requiredEngines = Object.freeze(['chromium', 'firefox', 'webkit']);
export function validateGateReport(
  report,
  { name, parent, identity, startedAt, finishedAt },
) {
  assert(report && typeof report === 'object', 'Malformed gate report');
  assert.equal(report.name, name, 'Wrong gate name');
  assert.equal(
    report.mode,
    'exact-artifact',
    'Development evidence is not exact-artifact evidence',
  );
  assert.equal(report.parentRunId, parent, 'Unrelated or stale gate run');
  assert.equal(
    report.status,
    'passed',
    'Gate must have a finalized passing outcome',
  );
  assert(
    typeof report.runId === 'string' && report.runId.length > 0,
    'Missing run ID',
  );
  assert(
    Number.isFinite(Date.parse(report.startedAt)) &&
      Number.isFinite(Date.parse(report.finishedAt)),
    'Missing/malformed timestamps',
  );
  assert(
    Date.parse(report.startedAt) >= Date.parse(startedAt) &&
      Date.parse(report.finishedAt) >= Date.parse(report.startedAt) &&
      Date.parse(report.finishedAt) <= Date.parse(finishedAt),
    'Stale or out-of-window evidence',
  );
  assert(
    report.phases?.length > 0 &&
      report.phases.every((phase) => phase.status === 'passed'),
    'Incomplete or failed gate phases',
  );
  assert(
    report.phases.some((phase) => phase.name === 'cleanup') &&
      report.phases.at(-1).name === 'final outcome',
    'Missing finalization/cleanup phases',
  );
  for (const key of ['cleanupErrors', 'diagnosticErrors'])
    assert(
      Array.isArray(report[key]) && report[key].length === 0,
      `Gate ${key} must be empty`,
    );
  assert(
    !report.error && !report.cancellation,
    'Gate has recorded errors/cancellation',
  );
  assert.equal(
    report.artifact?.sha256,
    identity.sha256,
    'Gate artifact digest differs',
  );
  assert.equal(
    report.artifact.size,
    identity.size,
    'Gate artifact size differs',
  );
  assert.equal(
    report.artifact.name,
    identity.name,
    'Gate package name differs',
  );
  assert.equal(
    report.artifact.version,
    identity.version,
    'Gate package version differs',
  );
  assert.equal(
    report.artifact.source?.checkoutSha,
    identity.source.checkoutSha,
    'Gate checkout differs',
  );
  assert.equal(
    report.artifact.source.claimedSourceSha,
    identity.source.claimedSourceSha,
    'Gate source claim differs',
  );
  assert.equal(
    report.artifact.source.sourceWorktreeClean,
    true,
    'Gate source must be clean',
  );
  assert.deepEqual(
    report.artifact.inventory,
    identity.inventory,
    'Gate archive inventory differs',
  );
  if (name === 'installed-consumers') {
    assertConsumerCompleteness(report, consumerConfigurations);
    for (const item of [...report.configurations, ...report.checks])
      assert.equal(
        item.artifactSha256,
        identity.sha256,
        'Consumer row artifact differs',
      );
    assert.deepEqual(
      report.versions,
      consumerConfigurations.map(
        ({ kind, react, types, domTypes, framework, compiler, nodeTypes }) => ({
          kind,
          react,
          types,
          domTypes,
          framework,
          typescript: compiler,
          nodeTypes,
        }),
      ),
      'Actual consumer version matrix must match required pins',
    );
    assert(
      report.servers.length === 4 &&
        report.servers.every((server) => server.status === 'stopped'),
      'All consumer servers must stop',
    );
  } else if (name === 'browser-smoke') {
    assert.deepEqual(
      report.browsers.map((row) => row.engine).sort(),
      [...requiredEngines].sort(),
      'All three engines required exactly once',
    );
    for (const row of report.browsers) {
      assert.equal(row.status, 'pass', `Engine ${row.engine} did not pass`);
      assert.equal(
        row.artifactSha256,
        identity.sha256,
        `Engine ${row.engine} artifact differs`,
      );
      assert.equal(
        row.checks.length,
        15,
        `Engine ${row.engine} must execute all 15 scenarios`,
      );
      assert.deepEqual(
        [...row.checks].sort(),
        [...smokeScenarios].sort(),
        'Every required smoke scenario must execute exactly once',
      );
      assert(
        typeof row.version === 'string' && row.version.length,
        'Missing executed browser version',
      );
      assert(
        Array.isArray(row.pageErrors) && row.pageErrors.length === 0,
        'Browser errors',
      );
      assert.equal(row.axeViolations, 0, 'Axe violations');
    }
    assert.equal(report.server.status, 'stopped', 'Browser server must stop');
  } else throw new Error(`Unsupported exact gate: ${name}`);
  return report;
}
