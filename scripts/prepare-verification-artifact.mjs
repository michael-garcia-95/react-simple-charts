// Local verification archive only. No registry writes or distribution.
import assert from 'node:assert/strict';
import { readFile, mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import {
  manifestPolicy,
  validateManifest,
} from './artifact/manifest-policy.mjs';
import { sourceIdentity, selectArtifact } from './artifact/selection.mjs';
import { archiveBytes, sha256 } from './artifact/archive.mjs';
import { runVerificationCommand } from './verification-command.mjs';
import { execFileSync } from 'node:child_process';

const root = resolve(import.meta.dirname, '..');
const args = process.argv.slice(2);
const options = {};
for (let index = 0; index < args.length; index += 2) {
  const key = args[index];
  assert(
    ['--policy', '--expected-name', '--expected-version'].includes(key),
    'Unknown preparation option',
  );
  assert(
    args[index + 1] && !args[index + 1].startsWith('--'),
    'Missing preparation value',
  );
  assert(!Object.hasOwn(options, key.slice(2)), 'Duplicate preparation option');
  options[key.slice(2)] = args[index + 1];
}
const policy = manifestPolicy(options);
const manifest = JSON.parse(await readFile(join(root, 'package.json'), 'utf8'));
validateManifest(manifest, policy);
const sourceSha = execFileSync('git', ['rev-parse', 'HEAD'], {
  cwd: root,
  encoding: 'utf8',
}).trim();
await sourceIdentity(root, sourceSha);
await mkdir(join(root, 'work/candidate'), { recursive: true });
const directory = await mkdtemp(join(root, 'work/candidate/run-'));
await runVerificationCommand('npm', ['run', 'build'], {
  cwd: root,
  env: process.env,
  timeoutMs: 300000,
});
await runVerificationCommand(
  'npm',
  ['pack', '--ignore-scripts', '--pack-destination', directory],
  { cwd: root, env: process.env, timeoutMs: 300000 },
);
const filename = `${manifest.name.replace(/^@/, '').replaceAll('/', '-')}-${manifest.version}.tgz`;
const path = join(directory, filename);
const digest = sha256(await archiveBytes(path));
const scratch = await mkdtemp(join(directory, 'inspection-'));
try {
  const artifact = await selectArtifact({
    root,
    work: scratch,
    options: {
      ...options,
      artifact: path,
      sha256: digest,
      'source-sha': sourceSha,
    },
  });
  const identity = {
    ...artifact.identity,
    filename,
    node: process.version,
    npm: (
      await runVerificationCommand('npm', ['--version'], {
        cwd: root,
        env: process.env,
        capture: true,
        timeoutMs: 10000,
      })
    ).stdout.trim(),
    platform: process.platform,
    architecture: process.arch,
    publication: { status: 'blocked', eligible: false },
  };
  await writeFile(
    join(directory, 'identity.json'),
    JSON.stringify(identity, null, 2) + '\n',
  );
  await writeFile(
    join(root, 'work/candidate/current.json'),
    JSON.stringify({ directory, identity }, null, 2) + '\n',
  );
  console.log(JSON.stringify(identity, null, 2));
} finally {
  await rm(scratch, { recursive: true, force: true });
}
