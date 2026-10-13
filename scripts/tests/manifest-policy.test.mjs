import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFile, mkdtemp, rm } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { execFileSync } from 'node:child_process';
import {
  packageName,
  manifestPolicy,
  policyArguments,
  validateManifest,
  validateSourceManifest,
  assertPolicyAgreement,
} from '../artifact/manifest-policy.mjs';
import { artifactOptions, selectArtifact } from '../artifact/selection.mjs';
import { readinessDecision, assessReadiness } from '../release-readiness.mjs';
import {
  createConsumerFixture,
  consumerConfigurations,
} from '../consumers/fixtures.mjs';
const root = resolve(import.meta.dirname, '../..');
const actual = JSON.parse(await readFile(join(root, 'package.json'), 'utf8'));
const development = {
  ...structuredClone(actual),
  version: '0.0.0',
  private: true,
};
const selectedOptions =
  process.env.RSC_VERIFICATION_POLICY === 'release-candidate'
    ? {
        policy: 'release-candidate',
        'expected-name': packageName,
        'expected-version': process.env.RSC_EXPECTED_VERSION,
      }
    : {};
const release = () => ({
  ...structuredClone(development),
  version: '0.1.0',
  private: false,
});
const candidateOptions = {
  policy: 'release-candidate',
  'expected-name': packageName,
  'expected-version': '0.1.0',
};
const candidate = manifestPolicy(candidateOptions);
const exactArgs = [
  '--artifact',
  'local-only.tgz',
  '--sha256',
  'a'.repeat(64),
  '--source-sha',
  'b'.repeat(40),
];

test('independent synthetic development manifest passes explicit and default development policy', () => {
  assert.equal(validateManifest(development).name, 'development');
  assert.deepEqual(manifestPolicy(), manifestPolicy({ policy: 'development' }));
});
test('synthetic planning-only 0.1.0 manifest passes with false or absent private', () => {
  validateManifest(release(), candidate);
  const fixture = release();
  delete fixture.private;
  validateManifest(fixture, candidate);
});
test('candidate policy must be explicitly selected with name and version', () => {
  for (const options of [
    { policy: 'release-candidate' },
    { policy: 'release-candidate', 'expected-name': packageName },
    { policy: 'release-candidate', 'expected-version': '0.1.0' },
  ])
    assert.throws(() => manifestPolicy(options), /explicit/);
  assert.throws(
    () => manifestPolicy({ 'expected-version': '0.1.0' }),
    /Expected version/,
  );
  assert.throws(() => manifestPolicy({ policy: 'auto' }), /Unknown/);
});
test('candidate flag cannot trigger development packing or omit digest/source', () => {
  assert.throws(
    () =>
      artifactOptions([
        '--policy',
        'release-candidate',
        '--expected-name',
        packageName,
        '--expected-version',
        '0.1.0',
      ]),
    /requires/,
  );
  assert.throws(
    () =>
      artifactOptions([
        ...exactArgs.slice(0, 2),
        ...policyArguments(candidate),
      ]),
    /requires/,
  );
  assert.throws(
    () =>
      artifactOptions([
        ...exactArgs,
        '--policy',
        'release-candidate',
        '--expected-name',
        packageName,
      ]),
    /expected version/,
  );
  const parsed = artifactOptions([...exactArgs, ...policyArguments(candidate)]);
  assert.deepEqual(manifestPolicy(parsed), candidate);
  assert.equal(manifestPolicy(artifactOptions(exactArgs)).name, 'development');
});
for (const [name, change] of [
  [
    'wrong version',
    (m) => {
      m.version = '0.0.0';
    },
  ],
  [
    'unapproved version',
    (m) => {
      m.version = '0.2.0';
    },
  ],
  [
    'private true',
    (m) => {
      m.private = true;
    },
  ],
  [
    'private null',
    (m) => {
      m.private = null;
    },
  ],
  [
    'private string',
    (m) => {
      m.private = 'false';
    },
  ],
  [
    'wrong name',
    (m) => {
      m.name = 'react-simple-charts';
    },
  ],
  [
    'restricted access',
    (m) => {
      m.publishConfig.access = 'restricted';
    },
  ],
  [
    'missing access',
    (m) => {
      delete m.publishConfig;
    },
  ],
  [
    'missing metadata',
    (m) => {
      delete m.repository;
    },
  ],
  [
    'wrong homepage',
    (m) => {
      m.homepage = 'https://example.com';
    },
  ],
  [
    'unexpected dependency',
    (m) => {
      m.dependencies.react = '*';
    },
  ],
  [
    'extra public export',
    (m) => {
      m.exports['./internal'] = './dist/index.js';
    },
  ],
])
  test(`synthetic candidate validator rejects ${name}`, () => {
    const fixture = release();
    change(fixture);
    assert.throws(() => validateManifest(fixture, candidate));
  });
test('candidate policy rejects an unapproved registry redirect', () => {
  const fixture = release();
  fixture.publishConfig.registry = 'https://example.com/';
  assert.throws(
    () => validateManifest(fixture, candidate),
    /official npm registry/,
  );
});
test('policy agreement supports absent private while rejecting false/absent misreporting', () => {
  const identity = { policy: candidate, name: packageName, version: '0.1.0' };
  const report = { policy: candidate, artifact: { ...identity } };
  assertPolicyAgreement(report, identity);
  report.artifact.private = false;
  assert.throws(
    () => assertPolicyAgreement(report, identity),
    /field presence/,
  );
});
test('wrong expected name/version are rejected, not treated as new approvals', () => {
  assert.throws(
    () => manifestPolicy({ ...candidateOptions, 'expected-name': 'other' }),
    /package name/,
  );
  assert.throws(
    () => manifestPolicy({ ...candidateOptions, 'expected-version': '0.2.0' }),
    /Expected version/,
  );
});
test('development and candidate manifests cannot cross policy boundaries', () => {
  assert.throws(() => validateManifest(development, candidate), /version/);
  assert.throws(() => validateManifest(release()), /version/);
  assert.throws(
    () => validateManifest({ ...development, private: false }),
    /private: true/,
  );
});
test('archive/source policy match never replaces complete manifest equality', () => {
  const fixture = release();
  validateSourceManifest(fixture, structuredClone(fixture), candidate);
  assert.throws(
    () =>
      validateSourceManifest(
        fixture,
        { ...fixture, description: 'different otherwise valid description' },
        candidate,
      ),
    /actual source manifest/,
  );
  assert.throws(() => validateSourceManifest(fixture, development, candidate));
});
test('policy evidence accepts matching identities and rejects mixed policy/version/name', () => {
  const identity = {
    policy: candidate,
    name: packageName,
    version: '0.1.0',
    private: false,
  };
  const good = () => ({
    policy: candidate,
    artifact: {
      policy: candidate,
      private: false,
      name: packageName,
      version: '0.1.0',
    },
  });
  assertPolicyAgreement(good(), identity);
  for (const change of [
    (r) => {
      r.policy = manifestPolicy();
    },
    (r) => {
      r.artifact.policy = manifestPolicy();
    },
    (r) => {
      r.policy = { ...candidate, expectedVersion: '0.0.0' };
    },
    (r) => {
      r.artifact.version = '0.0.0';
    },
    (r) => {
      delete r.policy;
    },
    (r) => {
      r.artifact.name = 'other';
    },
  ]) {
    const report = good();
    change(report);
    assert.throws(() => assertPolicyAgreement(report, identity));
  }
});
test('selected archive identity and source claim remain mandatory under candidate policy', async () => {
  const work = await mkdtemp(join(tmpdir(), 'rsc candidate policy test-'));
  try {
    await assert.rejects(
      selectArtifact({ root, work, options: candidateOptions }),
      /Exact artifact identity/,
    );
    await assert.rejects(
      selectArtifact({
        root,
        work,
        options: {
          ...candidateOptions,
          artifact: 'missing.tgz',
          sha256: 'a'.repeat(64),
          'source-sha': '0'.repeat(40),
        },
      }),
      /Source SHA claim/,
    );
    const source = execFileSync('git', ['rev-parse', 'HEAD'], {
      cwd: root,
      encoding: 'utf8',
    }).trim();
    await assert.rejects(
      selectArtifact({
        root,
        work,
        options: {
          ...candidateOptions,
          artifact: join(work, 'missing.tgz'),
          sha256: 'a'.repeat(64),
          'source-sha': source,
        },
      }),
      /ENOENT/,
    );
  } finally {
    await rm(work, { recursive: true, force: true });
  }
});
test('readiness never approves publication from a manifest alone and preserves NVDA gate', () => {
  for (const manifest of [development, release()]) {
    const report = readinessDecision({
      manifest,
      metadataFiles: [{ available: true }],
      availableChecks: [{ available: true }],
      sourceSha: 'test-only claim',
    });
    assert.equal(report.publication.eligible, false);
    assert.equal(report.publication.status, 'blocked');
    assert.equal(
      report.publication.gates.find((g) => g.name.includes('NVDA')).status,
      'pending',
    );
    assert.equal(
      report.publication.gates.find((g) =>
        g.name.includes('owner authorization'),
      ).status,
      'pending',
    );
    if (manifest.version === '0.0.0') {
      assert.equal(report.preparation.status, 'passed');
      assert.equal(report.candidateManifest.satisfied, false);
    } else {
      assert.equal(report.preparation.status, 'failed');
      assert.equal(report.candidateManifest.satisfied, false);
    }
  }
});
test('missing implementation/metadata fails preparation without granting release readiness', () => {
  const report = readinessDecision({
    manifest: development,
    metadataFiles: [{ available: false }],
    availableChecks: [{ available: false }],
  });
  assert.equal(report.preparation.status, 'failed');
  assert.equal(report.publication.eligible, false);
});
test('real repository read-only readiness assessment passes preparation and blocks publication', async () => {
  const before = await readFile(join(root, 'package.json'));
  const report = await assessReadiness(root, selectedOptions);
  assert.equal(report.preparation.status, 'passed');
  assert.equal(report.publication.eligible, false);
  assert.equal(report.ownerConfirmations.independentlyVerified, false);
  assert.equal(report.inventoryExpectation.length, 6);
  assert.deepEqual(await readFile(join(root, 'package.json')), before);
});
test('consumer probe uses the explicit policy for a synthetic manifest without changing chart fixtures', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'rsc synthetic policy fixture-'));
  try {
    const files = new Map();
    const file = async (_dir, name, content) => files.set(name, content);
    const json = async (_dir, name, value) =>
      files.set(name, JSON.stringify(value));
    await createConsumerFixture({
      root,
      dir,
      pkg: release(),
      policy: candidate,
      genuine: 'synthetic-only-no-archive.tgz',
      identity: 'synthetic-test-not-provenance',
      configuration: consumerConfigurations[0],
      file,
      json,
    });
    const probe = files.get('package-check.mjs');
    assert(probe.includes(JSON.stringify(candidate)));
    assert(probe.includes('validateManifest(p,'));
    assert(probe.includes('ERR_PACKAGE_PATH_NOT_EXPORTED'));
    assert(files.get('Interactive.tsx').includes('SingleDonutInspection'));
    assert(files.get('Sample.tsx').includes('DonutChart'));
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});
test('verification entry points contain no registry-write command capability', async () => {
  for (const name of [
    'verify-exact-artifact.mjs',
    'verify-exact-package.mjs',
    'verify-consumers.mjs',
    'verify-browser-smoke.mjs',
    'release-readiness.mjs',
    'artifact/manifest-policy.mjs',
  ]) {
    const code = await readFile(join(root, 'scripts', name), 'utf8');
    assert.doesNotMatch(
      code,
      /(?:run|runVerificationCommand)\(\s*['"]npm['"]\s*,\s*\[\s*['"](?:publish|stage|dist-tag|unpublish|deprecate|access|owner)['"]/,
      name,
    );
  }
});
