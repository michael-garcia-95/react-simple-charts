// Verification policy only. Selecting a policy never authorizes distribution or publication.
import assert from 'node:assert/strict';
export const packageName = '@michael-garcia-95/react-simple-charts';
export const plannedVersion = '0.1.1';
const releaseVersions = Object.freeze(['0.1.0', plannedVersion]);
export function manifestPolicy(options = {}) {
  const name = options.policy ?? 'development';
  assert(
    ['development', 'release-candidate'].includes(name),
    'Unknown manifest policy',
  );
  if (name === 'release-candidate') {
    assert(
      options['expected-name'],
      'Release-candidate policy requires an explicit expected package name',
    );
    assert(
      options['expected-version'],
      'Release-candidate policy requires an explicit expected version',
    );
  }
  const expectedPackageName = options['expected-name'] ?? packageName;
  const expectedVersion = options['expected-version'] ?? '0.0.0';
  assert.equal(expectedPackageName, packageName, 'Approved package name');
  assert(
    name === 'development'
      ? expectedVersion === '0.0.0'
      : releaseVersions.includes(expectedVersion),
    'Expected version must match the policy approved for planning',
  );
  return Object.freeze({ name, expectedPackageName, expectedVersion });
}
export function policyArguments(policy) {
  assertPolicyIdentity(policy);
  return [
    '--policy',
    policy.name,
    '--expected-name',
    policy.expectedPackageName,
    '--expected-version',
    policy.expectedVersion,
  ];
}
export function assertPolicyIdentity(policy) {
  assert(
    policy && typeof policy === 'object',
    'Missing manifest policy identity',
  );
  assert.deepEqual(
    policy,
    manifestPolicy({
      policy: policy.name,
      'expected-name': policy.expectedPackageName,
      'expected-version': policy.expectedVersion,
    }),
    'Incomplete or inconsistent manifest policy identity',
  );
}
export function validateManifestIdentity(manifest, policy = manifestPolicy()) {
  assertPolicyIdentity(policy);
  assert(
    manifest && typeof manifest === 'object' && !Array.isArray(manifest),
    'Valid package manifest required',
  );
  assert.equal(
    manifest.name,
    policy.expectedPackageName,
    'Approved package name',
  );
  assert.equal(
    manifest.version,
    policy.expectedVersion,
    'Manifest version does not match selected policy',
  );
  if (policy.name === 'development')
    assert.equal(
      manifest.private,
      true,
      'Development policy requires private: true',
    );
  else
    assert(
      manifest.private === false || !Object.hasOwn(manifest, 'private'),
      'Release-candidate policy requires private: false or absent',
    );
  return policy;
}
export function validateManifest(manifest, policy = manifestPolicy()) {
  validateManifestIdentity(manifest, policy);
  assert.equal(manifest.type, 'module');
  assert.equal(manifest.types, './dist/index.d.ts');
  assert.equal(manifest.engines, undefined);
  assert.equal(manifest.sideEffects, false);
  assert.equal(manifest.license, 'MIT');
  assert.equal(manifest.repository?.type, 'git');
  assert.equal(
    manifest.repository?.url,
    'git+https://github.com/michael-garcia-95/react-simple-charts.git',
  );
  assert.equal(
    manifest.homepage,
    'https://michael-garcia-95.github.io/react-simple-charts/',
  );
  assert.equal(
    manifest.bugs?.url,
    'https://github.com/michael-garcia-95/react-simple-charts/issues',
  );
  assert.equal(
    manifest.publishConfig?.access,
    'public',
    'Public scoped access required',
  );
  assert(
    typeof manifest.description === 'string' && manifest.description.trim(),
    'Description required',
  );
  assert(
    Array.isArray(manifest.keywords) &&
      manifest.keywords.length > 0 &&
      manifest.keywords.every(
        (word) => typeof word === 'string' && word.trim(),
      ),
    'Keywords required',
  );
  assert.deepEqual(manifest.files, ['dist', 'LICENSE']);
  assert.deepEqual(manifest.exports, {
    '.': { types: './dist/index.d.ts', import: './dist/index.js' },
  });
  assert.deepEqual(manifest.peerDependencies, {
    react: '^18.2.0 || ^19.0.0',
    'react-dom': '^18.2.0 || ^19.0.0',
  });
  assert.deepEqual(manifest.dependencies, {
    'd3-scale': '^4.0.2',
    'd3-shape': '^3.2.0',
  });
  assert(
    manifest.publishConfig.registry === undefined ||
      manifest.publishConfig.registry === 'https://registry.npmjs.org/',
    'Only the official npm registry is allowed',
  );
  assert.equal(manifest.bundledDependencies, undefined);
  assert.equal(manifest.bundleDependencies, undefined);
  return policy;
}
export function validateSourceManifest(
  archiveManifest,
  sourceManifest,
  policy,
) {
  validateManifest(archiveManifest, policy);
  validateManifest(sourceManifest, policy);
  assert.deepEqual(
    archiveManifest,
    sourceManifest,
    'Archive manifest must match actual source manifest',
  );
}
export function assertPolicyAgreement(report, identity) {
  assertPolicyIdentity(identity.policy);
  assertPolicyIdentity(report.policy);
  assertPolicyIdentity(report.artifact?.policy);
  assert.deepEqual(
    report.policy,
    identity.policy,
    'Parent/child manifest policy differs',
  );
  assert.deepEqual(
    report.artifact.policy,
    identity.policy,
    'Artifact manifest policy differs',
  );
  validateManifestIdentity(identity, identity.policy);
  validateManifestIdentity(report.artifact, identity.policy);
  assert.equal(
    Object.hasOwn(report.artifact, 'private'),
    Object.hasOwn(identity, 'private'),
    'Artifact private field presence differs',
  );
  assert.equal(
    report.artifact.private,
    identity.private,
    'Artifact private state differs',
  );
}
