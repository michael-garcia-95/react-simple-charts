// Read-only preparation assessment. No registry, account, approval or publication operation.
import { readFile } from 'node:fs/promises';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { join, resolve } from 'node:path';
import { inventory } from './artifact/archive.mjs';
import {
  packageName,
  plannedVersion,
  manifestPolicy,
  validateManifest,
} from './artifact/manifest-policy.mjs';

export function readinessDecision({
  manifest,
  availableChecks,
  metadataFiles,
  sourceSha,
  policy = manifestPolicy(),
  lockfile,
}) {
  const checks = [];
  const check = (name, action) => {
    try {
      action();
      checks.push({ name, status: 'passed' });
    } catch (error) {
      checks.push({ name, status: 'failed', error: error.message });
    }
  };
  check('explicit manifest policy and required package metadata', () =>
    validateManifest(manifest, policy),
  );
  if (lockfile)
    check('root lockfile identity matches manifest', () => {
      if (
        lockfile.name !== manifest.name ||
        lockfile.version !== manifest.version ||
        lockfile.packages?.['']?.name !== manifest.name ||
        lockfile.packages?.['']?.version !== manifest.version
      )
        throw new Error('Lockfile root identity differs from manifest');
    });
  check('required metadata documents present', () => {
    if (metadataFiles.some((row) => !row.available))
      throw new Error('Required release metadata document unavailable');
  });
  check('exact-artifact verification entry points available', () => {
    if (availableChecks.some((row) => !row.available))
      throw new Error('Required exact-artifact check unavailable');
  });
  const candidatePolicy = manifestPolicy({
    policy: 'release-candidate',
    'expected-name': packageName,
    'expected-version':
      policy.name === 'release-candidate'
        ? policy.expectedVersion
        : plannedVersion,
  });
  let candidateError;
  try {
    validateManifest(manifest, candidatePolicy);
  } catch (error) {
    candidateError = error.message;
  }
  const preparationPassed = checks.every((row) => row.status === 'passed');
  return {
    name: 'release-readiness',
    sourceSha,
    policy,
    lockfile: {
      status: lockfile
        ? checks.find(
            (row) => row.name === 'root lockfile identity matches manifest',
          ).status
        : 'not supplied',
    },
    artifactEvidence: {
      status: 'not ingested or validated by this assessment',
      note: 'Completed exact-artifact and CI reports must be reviewed separately; script availability is not verification evidence.',
    },
    summary: preparationPassed
      ? `Preparation checks passed for explicit ${policy.name} policy; publication remains blocked by final release gates.`
      : 'Preparation checks failed; publication remains blocked. See required checks and final release gates.',
    current: {
      name: manifest.name,
      version: manifest.version,
      private: manifest.private,
      access: manifest.publishConfig?.access,
    },
    planned: {
      version: candidatePolicy.expectedVersion,
      policy: candidatePolicy,
      firstPublication:
        'manual owner-controlled npm session with 2FA; no publishing token or automatic GitHub OIDC provenance',
    },
    preparation: { status: preparationPassed ? 'passed' : 'failed', checks },
    inventoryExpectation: [...inventory],
    metadataFiles,
    availableChecks,
    candidateManifest: {
      satisfied: !candidateError,
      error: candidateError,
      note: 'Manifest conditions alone are not a verified or authorized release candidate.',
    },
    publication: {
      status: 'blocked',
      eligible: false,
      gates: [
        { name: 'Development Lead review of candidate PR', status: 'pending' },
        {
          name: 'owner confirmation of npm account readiness before publication',
          status: 'pending',
        },
        {
          name: 'separately authorized manifest preparation and genuine version-specific candidate',
          status:
            policy.name === 'release-candidate' && !candidateError
              ? 'manifest prepared; archive verification and review separate'
              : 'pending',
        },
        {
          name: 'manual NVDA + Firefox across all five chart families',
          status: 'pending',
          deferredUntil: 'final pre-publication validation',
        },
        { name: 'final human accessibility assessment', status: 'pending' },
        {
          name: 'final exact-source/artifact review after authorized version preparation',
          status: 'pending',
        },
        {
          name: 'owner authorization for the exact publication operation',
          status: 'pending',
        },
      ],
    },
    sourceChecks: {
      status: 'not executed by this assessment',
      required: [
        'npm run typecheck',
        'npm run test:types',
        'npm run lint',
        'npm run format:check',
        'npm test',
        'node --test scripts/tests/*.test.mjs',
        policy.name === 'development'
          ? 'npm run verify:package'
          : 'explicit candidate exact-package gate (same selected archive)',
        'npm run verify:site:snippets',
        'npm run build:playground',
        'both production site builds/base-path verifiers',
        'git diff --check',
        'exact selected archive: package/API/declarations, four consumers, Chromium/Firefox/WebKit',
      ],
    },
    ownerConfirmations: {
      independentlyVerified: false,
      source: 'Development Lead/owner planning instructions for M06-T06B2',
      npmUsername: 'michael-garcia-95',
      npm2FA: 'owner confirmed enabled',
      recoveryCodes: 'owner confirmed secured; no codes collected',
      npmAccessTokens: 'owner reports never created',
      githubPrivateVulnerabilityReporting: 'owner confirmed enabled',
    },
    postPublicationVerification: {
      status: 'future required work; no publication authorized',
    },
    limitations: [
      'Availability checks are not executed gate results.',
      'No live registry/account configuration inspection.',
      'Synthetic candidate-policy fixtures are not genuine release artifacts.',
      'No native Windows or manual NVDA testing.',
    ],
  };
}
export async function assessReadiness(root, options = {}) {
  const policy = manifestPolicy(options);
  const lockfile = JSON.parse(
    await readFile(join(root, 'package-lock.json'), 'utf8'),
  );
  const manifest = JSON.parse(
    await readFile(join(root, 'package.json'), 'utf8'),
  );
  async function available(paths) {
    return Promise.all(
      paths.map(async (path) => {
        try {
          await readFile(join(root, path));
          return { path, available: true };
        } catch {
          return { path, available: false };
        }
      }),
    );
  }
  const [metadataFiles, availableChecks, identity] = await Promise.all([
    available([
      'README.md',
      'LICENSE',
      'CHANGELOG.md',
      'docs/RELEASE_POLICY.md',
      'docs/OPEN_DECISIONS.md',
      'docs/M06_PUBLISHING_SECURITY_PLAN.md',
    ]),
    available([
      'scripts/verify-exact-artifact.mjs',
      'scripts/verify-exact-package.mjs',
      'scripts/verify-consumers.mjs',
      'scripts/verify-browser-smoke.mjs',
      'scripts/artifact/archive.mjs',
      'scripts/artifact/selection.mjs',
      'scripts/artifact/results.mjs',
      'scripts/artifact/package.mjs',
      'scripts/artifact/manifest-policy.mjs',
    ]),
    promisify(execFile)('git', ['rev-parse', 'HEAD'], {
      cwd: root,
      timeout: 10000,
    }),
  ]);
  return readinessDecision({
    manifest,
    policy,
    lockfile,
    availableChecks,
    metadataFiles,
    sourceSha: identity.stdout.trim(),
  });
}
if (
  process.argv[1] &&
  resolve(process.argv[1]) === resolve(import.meta.filename)
) {
  const args = process.argv.slice(2).filter((arg) => arg !== '--json');
  const options = {};
  for (let index = 0; index < args.length; index += 2) {
    const key = args[index];
    if (
      !['--policy', '--expected-name', '--expected-version'].includes(key) ||
      !args[index + 1] ||
      args[index + 1].startsWith('--') ||
      Object.hasOwn(options, key.slice(2))
    )
      throw new Error(
        'Use explicit policy/name/version; no approval or publishing options exist',
      );
    options[key.slice(2)] = args[index + 1];
  }
  const report = await assessReadiness(
    resolve(import.meta.dirname, '..'),
    options,
  );
  if (!process.argv.includes('--json')) console.log(report.summary);
  console.log(JSON.stringify(report, null, 2));
  if (report.preparation.status !== 'passed') process.exitCode = 1;
}
