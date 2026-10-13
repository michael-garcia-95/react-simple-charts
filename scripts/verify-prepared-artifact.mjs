// Run a genuine gate on the already selected archive; never rebuild or repack.
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import {
  manifestPolicy,
  policyArguments,
} from './artifact/manifest-policy.mjs';
import { runVerificationCommand } from './verification-command.mjs';

const gates = {
  package: 'verify-exact-package.mjs',
  browsers: 'verify-browser-smoke.mjs',
  all: 'verify-exact-artifact.mjs',
};
assert(
  process.argv.length === 3 && Object.hasOwn(gates, process.argv[2]),
  'Choose package, browsers or all',
);
const policy = manifestPolicy({
  policy: process.env.RSC_VERIFICATION_POLICY,
  'expected-name': process.env.RSC_EXPECTED_NAME,
  'expected-version': process.env.RSC_EXPECTED_VERSION,
});
const root = resolve(import.meta.dirname, '..');
const { identity } = JSON.parse(
  await readFile(join(root, 'work/candidate/current.json'), 'utf8'),
);
assert.deepEqual(
  identity.policy,
  policy,
  'Prepared archive must match explicitly selected verification policy',
);
await runVerificationCommand(
  'node',
  [
    join(root, 'scripts', gates[process.argv[2]]),
    '--artifact',
    identity.selectedPath,
    '--sha256',
    identity.sha256,
    '--source-sha',
    identity.source.checkoutSha,
    ...policyArguments(policy),
  ],
  { cwd: root, env: process.env, timeoutMs: 2700000 },
);
