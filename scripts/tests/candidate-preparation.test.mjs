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
    ? candidateOptions
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
test('candidate CI selection requires exact repository, event and branch; never manifest values', () => {
  const env = {
    GITHUB_REPOSITORY: 'michael-garcia-95/react-simple-charts',
    GITHUB_EVENT_NAME: 'pull_request',
    RSC_HEAD_REPOSITORY: 'michael-garcia-95/react-simple-charts',
    GITHUB_HEAD_REF: 'feat/m06-t06b3-release-candidate',
  };
  assert.deepEqual(ciVerificationPolicy(env), candidate);
  for (const change of [
    { GITHUB_REPOSITORY: 'other/repo' },
    { RSC_HEAD_REPOSITORY: 'fork/repo' },
    { GITHUB_HEAD_REF: 'main' },
    { GITHUB_EVENT_NAME: 'pull_request_target' },
    { GITHUB_EVENT_NAME: 'schedule' },
  ])
    assert.equal(
      ciVerificationPolicy({ ...env, ...change }).name,
      'development',
    );
  assert.equal(ciVerificationPolicy({}).name, 'development');
  for (const event of ['push', 'workflow_dispatch']) {
    const context = {
      GITHUB_REPOSITORY: env.GITHUB_REPOSITORY,
      GITHUB_EVENT_NAME: event,
      GITHUB_REF: `refs/heads/${env.GITHUB_HEAD_REF}`,
    };
    assert.equal(ciVerificationPolicy(context).name, 'release-candidate');
    assert.equal(
      ciVerificationPolicy({ ...context, GITHUB_REF: 'refs/heads/main' }).name,
      'development',
    );
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
