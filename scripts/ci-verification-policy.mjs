// Read-only verification selection; never selects any publishing operation.
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { appendFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  manifestPolicy,
  packageName,
  validateManifest,
} from './artifact/manifest-policy.mjs';

const repository = 'michael-garcia-95/react-simple-charts';
const branch = 'feat/m06-t06b3-release-candidate';
const candidate = () =>
  manifestPolicy({
    policy: 'release-candidate',
    'expected-name': packageName,
    'expected-version': '0.1.0',
  });

function validateContext(env) {
  assert.equal(env.GITHUB_REPOSITORY, repository, 'Approved CI repository');
  assert(
    ['push', 'workflow_dispatch', 'pull_request'].includes(
      env.GITHUB_EVENT_NAME,
    ),
    'Unsupported CI event',
  );
  if (env.GITHUB_EVENT_NAME === 'pull_request') {
    assert.equal(
      env.RSC_BASE_REPOSITORY,
      repository,
      'Approved PR base repository',
    );
    assert.equal(env.GITHUB_BASE_REF, 'main', 'PR must target main');
    assert(
      /^refs\/pull\/[1-9]\d*\/merge$/.test(env.GITHUB_REF),
      'Expected PR merge ref',
    );
    assert(
      /^[a-f0-9]{40}$/.test(env.RSC_BASE_SHA),
      'Exact PR base SHA required',
    );
    assert(
      env.RSC_HEAD_REPOSITORY && env.GITHUB_HEAD_REF,
      'PR head context required',
    );
  } else {
    assert(
      [`refs/heads/${branch}`, 'refs/heads/main'].includes(env.GITHUB_REF),
      'Unsupported CI branch/ref',
    );
  }
}

export function ciVerificationPolicy(env, baseManifest) {
  validateContext(env);
  if (env.GITHUB_EVENT_NAME !== 'pull_request') return candidate();

  // The trusted event's exact main base distinguishes pre/post transition.
  // Validate its full fixed identity; never infer policy from the PR head manifest.
  const basePolicy =
    baseManifest?.version === '0.0.0' ? manifestPolicy() : candidate();
  validateManifest(baseManifest, basePolicy);
  if (env.RSC_HEAD_REPOSITORY === repository && env.GITHUB_HEAD_REF === branch)
    return candidate();
  return basePolicy;
}

if (
  process.argv[1] &&
  resolve(process.argv[1]) === resolve(import.meta.filename)
) {
  validateContext(process.env);
  let baseManifest;
  if (process.env.GITHUB_EVENT_NAME === 'pull_request') {
    const sha = process.env.RSC_BASE_SHA;
    // Shallow head checkout may not contain the event's immutable base object.
    execFileSync('git', ['fetch', '--no-tags', '--depth=1', 'origin', sha], {
      stdio: 'inherit',
    });
    baseManifest = JSON.parse(
      execFileSync('git', ['show', `${sha}:package.json`], {
        encoding: 'utf8',
      }),
    );
  }
  const policy = ciVerificationPolicy(process.env, baseManifest);
  appendFileSync(
    process.env.GITHUB_ENV,
    `RSC_VERIFICATION_POLICY=${policy.name}\nRSC_EXPECTED_NAME=${policy.expectedPackageName}\nRSC_EXPECTED_VERSION=${policy.expectedVersion}\n`,
  );
  console.log(
    `Explicit CI verification policy: ${policy.name}; publication remains blocked.`,
  );
}
