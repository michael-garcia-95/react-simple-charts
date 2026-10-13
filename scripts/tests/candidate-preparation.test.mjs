import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFile, mkdtemp, writeFile, rm } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { execFileSync } from 'node:child_process';
import { ciVerificationPolicy } from '../ci-verification-policy.mjs';
import {
  manifestPolicy,
  packageName,
  validateManifest,
} from '../artifact/manifest-policy.mjs';
import { sourceIdentity } from '../artifact/selection.mjs';
import { assessReadiness, readinessDecision } from '../release-readiness.mjs';

const root = resolve(import.meta.dirname, '../..');
const candidateOptions = {
  policy: 'release-candidate',
  'expected-name': packageName,
  'expected-version': '0.1.0',
};
const candidate = manifestPolicy(candidateOptions);
const selectedOptions =
  process.env.RSC_VERIFICATION_POLICY === 'release-candidate'
    ? {
        ...candidateOptions,
        'expected-version': process.env.RSC_EXPECTED_VERSION,
      }
    : {};
test('actual checkout manifest and lockfile match explicitly selected policy', async () => {
  const manifest = JSON.parse(
    await readFile(join(root, 'package.json'), 'utf8'),
  );
  validateManifest(manifest, manifestPolicy(selectedOptions));
  const report = await assessReadiness(root, selectedOptions);
  assert.equal(report.lockfile.status, 'passed');
  assert.equal(report.preparation.status, 'passed');
  assert.equal(
    report.artifactEvidence.status,
    'not ingested or validated by this assessment',
  );
  assert.equal(report.sourceChecks.status, 'not executed by this assessment');
  assert.equal(report.publication.eligible, false);
  if (selectedOptions.policy) assert.equal(manifest.private, false);
});
const actualManifest = JSON.parse(
  await readFile(join(root, 'package.json'), 'utf8'),
);
const developmentManifest = {
  ...actualManifest,
  version: '0.0.0',
  private: true,
};
const candidateManifest = {
  ...actualManifest,
  version: '0.1.0',
  private: false,
};
const repository = 'michael-garcia-95/react-simple-charts';
const branch = 'feat/m06-t06b3-release-candidate';
const prContext = {
  GITHUB_REPOSITORY: repository,
  GITHUB_EVENT_NAME: 'pull_request',
  GITHUB_REF: 'refs/pull/38/merge',
  GITHUB_BASE_REF: 'main',
  RSC_BASE_REPOSITORY: repository,
  RSC_BASE_SHA: 'a'.repeat(40),
  RSC_HEAD_REPOSITORY: repository,
  GITHUB_HEAD_REF: branch,
};
for (const event of ['push', 'workflow_dispatch'])
  for (const ref of [branch, 'main'])
    test(`${event} on ${ref} explicitly selects fixed candidate identity`, () => {
      assert.deepEqual(
        ciVerificationPolicy({
          GITHUB_REPOSITORY: repository,
          GITHUB_EVENT_NAME: event,
          GITHUB_REF: `refs/heads/${ref}`,
        }),
        manifestPolicy({
          ...candidateOptions,
          'expected-version': ref === 'main' ? '0.1.1' : '0.1.0',
        }),
      );
    });
test('candidate feature PR retains candidate policy before and after transition', () => {
  for (const manifest of [developmentManifest, candidateManifest])
    assert.deepEqual(ciVerificationPolicy(prContext, manifest), candidate);
});
for (const headRepository of [repository, 'contributor/fork'])
  test(`ordinary main PR from ${headRepository} follows exact pre/post-merge base`, () => {
    const env = {
      ...prContext,
      RSC_HEAD_REPOSITORY: headRepository,
      GITHUB_HEAD_REF: 'fix/chart-docs',
    };
    assert.deepEqual(
      ciVerificationPolicy(env, developmentManifest),
      manifestPolicy(),
    );
    assert.deepEqual(ciVerificationPolicy(env, candidateManifest), candidate);
    // Only event/base identity selects policy; head manifest must pass separately.
    assert.throws(() =>
      validateManifest(
        candidateManifest,
        ciVerificationPolicy(env, developmentManifest),
      ),
    );
    assert.throws(() =>
      validateManifest(
        developmentManifest,
        ciVerificationPolicy(env, candidateManifest),
      ),
    );
  });
test('fork named like candidate branch cannot override a development main base', () => {
  assert.equal(
    ciVerificationPolicy(
      { ...prContext, RSC_HEAD_REPOSITORY: 'contributor/fork' },
      developmentManifest,
    ).name,
    'development',
  );
});
for (const [label, change] of [
  ['wrong repository', { GITHUB_REPOSITORY: 'other/repo' }],
  ['wrong base repository', { RSC_BASE_REPOSITORY: 'other/repo' }],
  ['wrong target branch', { GITHUB_BASE_REF: 'develop' }],
  ['wrong PR ref', { GITHUB_REF: 'refs/heads/main' }],
  ['missing base SHA', { RSC_BASE_SHA: undefined }],
  ['malformed base SHA', { RSC_BASE_SHA: '--all' }],
  ['missing head context', { RSC_HEAD_REPOSITORY: undefined }],
  ['pull_request_target', { GITHUB_EVENT_NAME: 'pull_request_target' }],
  ['schedule', { GITHUB_EVENT_NAME: 'schedule' }],
  ['missing event', { GITHUB_EVENT_NAME: undefined }],
])
  test(`CI selection rejects ${label}`, () => {
    assert.throws(() =>
      ciVerificationPolicy({ ...prContext, ...change }, candidateManifest),
    );
  });
for (const ref of ['refs/heads/unknown', 'refs/tags/v0.1.0', 'main', undefined])
  test(`push rejects unknown/non-branch ref ${ref}`, () => {
    assert.throws(() =>
      ciVerificationPolicy({
        GITHUB_REPOSITORY: repository,
        GITHUB_EVENT_NAME: 'push',
        GITHUB_REF: ref,
      }),
    );
  });
test('PR policy rejects missing, unexpected and unknown future base manifests', () => {
  for (const manifest of [
    undefined,
    {},
    { ...candidateManifest, name: 'other' },
    { ...candidateManifest, version: '0.2.0' },
    { ...candidateManifest, private: true },
    { ...developmentManifest, private: false },
    { ...candidateManifest, exports: {} },
  ])
    assert.throws(() => ciVerificationPolicy(prContext, manifest));
});
test('development fixtures and fixed expected versions remain independently strict', () => {
  validateManifest(developmentManifest, manifestPolicy());
  assert.throws(() => validateManifest(candidateManifest, manifestPolicy()));
  assert.throws(() =>
    validateManifest(
      { ...developmentManifest, private: false },
      manifestPolicy(),
    ),
  );
  for (const version of ['0.0.0', '0.2.0', '1.0.0']) {
    assert.throws(() =>
      manifestPolicy({ ...candidateOptions, 'expected-version': version }),
    );
    assert.throws(() =>
      validateManifest({ ...candidateManifest, version }, candidate),
    );
  }
});
test('selected policies never confer implicit publication authorization', () => {
  for (const [manifest, policy] of [
    [developmentManifest, manifestPolicy()],
    [candidateManifest, candidate],
  ]) {
    const report = readinessDecision({
      manifest,
      policy,
      metadataFiles: [],
      availableChecks: [],
    });
    assert.equal(report.publication.eligible, false);
    assert.equal(report.publication.status, 'blocked');
  }
});
test('candidate readiness rejects inconsistent lock identity and cannot grant publication', async () => {
  const manifest = {
    ...JSON.parse(await readFile(join(root, 'package.json'), 'utf8')),
    version: '0.1.0',
    private: false,
  };
  for (const lockfile of [
    {
      name: packageName,
      version: '0.0.0',
      packages: { '': { name: packageName, version: '0.1.0' } },
    },
    {
      name: packageName,
      version: '0.1.0',
      packages: { '': { name: packageName, version: '0.0.0' } },
    },
  ]) {
    const report = readinessDecision({
      manifest,
      policy: candidate,
      lockfile,
      metadataFiles: [],
      availableChecks: [],
    });
    assert.equal(report.preparation.status, 'failed');
    assert.equal(report.lockfile.status, 'failed');
    assert.equal(report.publication.eligible, false);
    assert.equal(
      report.publication.gates.find((row) => row.name.includes('NVDA')).status,
      'pending',
    );
  }
});
test('clean-source identity rejects dirty relevant source without editing real checkout', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'rsc-dirty-candidate-'));
  const git = (...args) =>
    execFileSync('git', args, { cwd: dir, encoding: 'utf8' }).trim();
  try {
    git('init', '-q');
    await writeFile(join(dir, 'package.json'), '{}\n');
    git('add', 'package.json');
    git(
      '-c',
      'user.name=Candidate test',
      '-c',
      'user.email=candidate-test@example.invalid',
      'commit',
      '-qm',
      'synthetic fixture',
    );
    const head = git('rev-parse', 'HEAD');
    await sourceIdentity(dir, head);
    await writeFile(join(dir, 'package.json'), '{"dirty":true}\n');
    await assert.rejects(sourceIdentity(dir, head), /worktree must be clean/);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});
test('candidate workflows retain read-only permissions and exclude raw archive uploads', async () => {
  for (const name of ['ci', 'verify-exact-artifact', 'verify-browsers']) {
    const code = await readFile(
      join(root, `.github/workflows/${name}.yml`),
      'utf8',
    );
    assert.match(code, /contents: read/);
    assert.doesNotMatch(
      code,
      /id-token:|packages: write|npm (?:publish|stage|access|dist-tag|unpublish)/,
    );
    assert.match(code, /ci-verification-policy\.mjs/);
    assert.match(
      code,
      /branches:\s*\[main, feat\/m06-t06b3-release-candidate, feat\/m06-t10a-docs-patch-0\.1\.1\]/,
    );
    assert.match(
      code,
      /RSC_BASE_SHA: \$\{\{ github\.event\.pull_request\.base\.sha \}\}/,
    );
    assert.match(code, /RSC_BASE_REPOSITORY:/);
    assert.match(code, /workflow_dispatch:/);
    assert.doesNotMatch(code, /pull_request_target:/);
    if (name !== 'ci') {
      assert.match(code, /!work\/\*\*\/\*\.tgz/);
      assert.match(code, /!work\/\*\*\/\*\.tar\.gz/);
    }
  }
});
test('readiness rejects approval switches', () => {
  assert.throws(
    () =>
      execFileSync('node', ['scripts/release-readiness.mjs', '--approved'], {
        cwd: root,
        stdio: 'pipe',
      }),
    /Command failed/,
  );
});

test('CLI reads immutable event base, not moving main or PR head manifest', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'rsc-ci-base-'));
  const git = (...args) =>
    execFileSync('git', args, { cwd: dir, encoding: 'utf8' }).trim();
  const commit = () => {
    git('add', 'package.json');
    git(
      '-c',
      'user.name=Policy test',
      '-c',
      'user.email=policy-test@example.invalid',
      'commit',
      '-qm',
      'synthetic fixture',
    );
    return git('rev-parse', 'HEAD');
  };
  try {
    git('init', '-q', '-b', 'main');
    await writeFile(
      join(dir, 'package.json'),
      JSON.stringify(developmentManifest),
    );
    const developmentSha = commit();
    await writeFile(
      join(dir, 'package.json'),
      JSON.stringify(candidateManifest),
    );
    const candidateSha = commit();
    await writeFile(
      join(dir, 'package.json'),
      JSON.stringify({ ...candidateManifest, version: '0.1.1' }),
    );
    const patchSha = commit();
    git('remote', 'add', 'origin', dir);
    // Current head deliberately invalid: it cannot influence selected base policy.
    await writeFile(
      join(dir, 'package.json'),
      JSON.stringify({ version: '9.9.9' }),
    );
    for (const [sha, expected, version] of [
      [developmentSha, 'development', '0.0.0'],
      [candidateSha, 'release-candidate', '0.1.0'],
      [patchSha, 'release-candidate', '0.1.1'],
    ]) {
      const destination = join(dir, `env-${sha}`);
      execFileSync(
        process.execPath,
        [join(root, 'scripts/ci-verification-policy.mjs')],
        {
          cwd: dir,
          env: {
            ...process.env,
            ...prContext,
            GITHUB_HEAD_REF: 'contribution',
            RSC_HEAD_REPOSITORY: 'contributor/fork',
            RSC_BASE_SHA: sha,
            GITHUB_ENV: destination,
          },
          stdio: 'pipe',
        },
      );
      assert.equal(
        await readFile(destination, 'utf8'),
        `RSC_VERIFICATION_POLICY=${expected}\nRSC_EXPECTED_NAME=${packageName}\nRSC_EXPECTED_VERSION=${version}\n`,
      );
    }
    assert.throws(() =>
      execFileSync(
        process.execPath,
        [join(root, 'scripts/ci-verification-policy.mjs')],
        {
          cwd: dir,
          env: {
            ...process.env,
            ...prContext,
            RSC_BASE_SHA: 'f'.repeat(40),
            GITHUB_ENV: join(dir, 'missing-base-env'),
          },
          stdio: 'pipe',
        },
      ),
    );
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

const patchOptions = { ...candidateOptions, 'expected-version': '0.1.1' };
const patchPolicy = manifestPolicy(patchOptions);
const patchManifest = { ...candidateManifest, version: '0.1.1' };
const patchContext = {
  ...prContext,
  GITHUB_HEAD_REF: 'feat/m06-t10a-docs-patch-0.1.1',
};
test('explicit 0.1.1 candidate is strict and cannot substitute for historical 0.1.0', () => {
  validateManifest(patchManifest, patchPolicy);
  assert.throws(() => validateManifest(candidateManifest, patchPolicy));
  assert.throws(() => validateManifest(patchManifest, candidate));
  for (const version of [undefined, '', '0.1.2', '9.9.9'])
    assert.throws(() =>
      manifestPolicy({ ...patchOptions, 'expected-version': version }),
    );
  for (const options of [
    { policy: 'release-candidate', 'expected-version': '0.1.1' },
    { policy: 'release-candidate', 'expected-name': packageName },
  ])
    assert.throws(() => manifestPolicy(options));
});
test('only owner documentation branch overrides a validated public 0.1.0 base', () => {
  assert.deepEqual(
    ciVerificationPolicy(patchContext, candidateManifest),
    patchPolicy,
  );
  assert.throws(() => ciVerificationPolicy(patchContext, developmentManifest));
  for (const env of [
    { ...patchContext, RSC_HEAD_REPOSITORY: 'attacker/fork' },
    { ...patchContext, GITHUB_HEAD_REF: 'feat/m06-t10a-docs-patch-0.1.2' },
    {
      ...patchContext,
      GITHUB_HEAD_REF: 'ordinary-pr',
      RSC_EXPECTED_VERSION: '0.1.1',
    },
  ]) {
    assert.deepEqual(ciVerificationPolicy(env, candidateManifest), candidate);
    assert.throws(() =>
      validateManifest(
        patchManifest,
        ciVerificationPolicy(env, candidateManifest),
      ),
    );
  }
  for (const manifest of [
    { ...candidateManifest, publishConfig: { access: 'restricted' } },
    { ...candidateManifest, dependencies: {} },
    { ...candidateManifest, version: '0.1.2' },
  ])
    assert.throws(() => ciVerificationPolicy(patchContext, manifest));
});
test('reviewed 0.1.1 main transition selects patch for all subsequent PRs', () => {
  for (const env of [
    patchContext,
    prContext,
    {
      ...prContext,
      RSC_HEAD_REPOSITORY: 'contributor/fork',
      GITHUB_HEAD_REF: 'ordinary',
    },
  ])
    assert.deepEqual(ciVerificationPolicy(env, patchManifest), patchPolicy);
  for (const event of ['push', 'workflow_dispatch'])
    for (const ref of ['main', patchContext.GITHUB_HEAD_REF])
      assert.deepEqual(
        ciVerificationPolicy({
          GITHUB_REPOSITORY: repository,
          GITHUB_EVENT_NAME: event,
          GITHUB_REF: `refs/heads/${ref}`,
        }),
        patchPolicy,
      );
  const report = readinessDecision({
    manifest: patchManifest,
    policy: patchPolicy,
    metadataFiles: [],
    availableChecks: [],
  });
  assert.equal(report.planned.version, '0.1.1');
  assert.equal(report.publication.eligible, false);
});
