// Read-only verification selection; never selects any publishing operation.
import { appendFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { manifestPolicy, packageName } from './artifact/manifest-policy.mjs';

export function ciVerificationPolicy(env) {
  const repository = 'michael-garcia-95/react-simple-charts';
  const branch = 'feat/m06-t06b3-release-candidate';
  const pullRequest = env.GITHUB_EVENT_NAME === 'pull_request';
  const authorized =
    env.GITHUB_REPOSITORY === repository &&
    (pullRequest
      ? env.RSC_HEAD_REPOSITORY === repository && env.GITHUB_HEAD_REF === branch
      : ['push', 'workflow_dispatch'].includes(env.GITHUB_EVENT_NAME) &&
        env.GITHUB_REF === `refs/heads/${branch}`);
  return manifestPolicy(
    authorized
      ? {
          policy: 'release-candidate',
          'expected-name': packageName,
          'expected-version': '0.1.0',
        }
      : {},
  );
}

if (
  process.argv[1] &&
  resolve(process.argv[1]) === resolve(import.meta.filename)
) {
  const policy = ciVerificationPolicy(process.env);
  appendFileSync(
    process.env.GITHUB_ENV,
    `RSC_VERIFICATION_POLICY=${policy.name}\nRSC_EXPECTED_NAME=${policy.expectedPackageName}\nRSC_EXPECTED_VERSION=${policy.expectedVersion}\n`,
  );
  console.log(
    `Explicit CI verification policy: ${policy.name}; publication remains blocked.`,
  );
}
