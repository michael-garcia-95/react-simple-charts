import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { readFile, writeFile, chmod } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { archiveBytes, inspectArchive, sha256, inventory } from './archive.mjs';
import { manifestPolicy, validateSourceManifest } from './manifest-policy.mjs';
const git = promisify(execFile);
export function artifactOptions(args = process.argv.slice(2)) {
  const allowed = new Set([
    '--artifact',
    '--sha256',
    '--source-sha',
    '--evidence-base',
    '--parent-run',
    '--policy',
    '--expected-name',
    '--expected-version',
  ]);
  const result = {};
  for (let index = 0; index < args.length; index++) {
    const key = args[index];
    if (['--install-driver-only', '--prepare-only'].includes(key)) continue;
    assert(allowed.has(key), `Unknown exact-artifact option: ${key}`);
    assert(
      args[index + 1] && !args[index + 1].startsWith('--'),
      `Missing value for ${key}`,
    );
    assert(!(key.slice(2) in result), `Duplicate option: ${key}`);
    result[key.slice(2)] = args[++index];
  }
  if (Object.keys(result).length) {
    assert(
      result.artifact && result.sha256 && result['source-sha'],
      'Exact mode requires --artifact, --sha256 and --source-sha; no packing fallback',
    );
    assert(
      /^[a-f0-9]{64}$/.test(result.sha256),
      'Expected SHA-256 must be 64 lowercase hexadecimal characters',
    );
    assert(
      /^[a-f0-9]{40}$/.test(result['source-sha']),
      'Source SHA must be a full commit SHA',
    );
    manifestPolicy(result);
    result.artifact = resolve(result.artifact);
  }
  return Object.keys(result).length ? result : undefined;
}
export async function sourceIdentity(root, claim) {
  const { stdout: head } = await git('git', ['rev-parse', 'HEAD'], {
    cwd: root,
    timeout: 10000,
  });
  assert.equal(
    head.trim(),
    claim,
    'Source SHA claim does not match actual checkout HEAD',
  );
  const sourcePaths = [
    'src',
    'package.json',
    'package-lock.json',
    'README.md',
    'LICENSE',
    'tsdown.config.ts',
    'tsconfig.json',
    'tests/types',
  ];
  const { stdout: dirty } = await git(
    'git',
    ['status', '--porcelain', '--untracked-files=all', '--', ...sourcePaths],
    { cwd: root, timeout: 10000 },
  );
  assert.equal(
    dirty,
    '',
    'Source/manifest/build-contract worktree must be clean',
  );
  const { stdout: status } = await git('git', ['status', '--porcelain'], {
    cwd: root,
    timeout: 10000,
  });
  return {
    checkoutSha: head.trim(),
    claimedSourceSha: claim,
    sourceWorktreeClean: true,
    verificationWorktreeStatus: status,
    provenance:
      'Source claim and checkout/content comparison; no independently attested build provenance',
  };
}
export async function selectArtifact({ root, work, options }) {
  assert(
    options?.artifact && options.sha256 && options['source-sha'],
    'Exact artifact identity is required',
  );
  const source = await sourceIdentity(root, options['source-sha']);
  const bytes = await archiveBytes(options.artifact);
  assert.equal(
    sha256(bytes),
    options.sha256,
    'Selected archive SHA-256 mismatch',
  );
  const files = inspectArchive(bytes);
  const manifest = JSON.parse(files.get('package.json').toString());
  const expected = JSON.parse(
    await readFile(join(root, 'package.json'), 'utf8'),
  );
  const policy = manifestPolicy(options);
  validateSourceManifest(manifest, expected, policy);
  assert.match(files.get('LICENSE').toString(), /MIT License/);
  assert(files.get('README.md').length > 0, 'README is required');
  for (const name of inventory) {
    assert.deepEqual(
      files.get(name),
      await readFile(join(root, name)),
      `Archive/check-out content mismatch: ${name}`,
    );
    assert.doesNotMatch(
      files.get(name).toString(),
      /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----|npm_[A-Za-z0-9]{36,}|gh[pousr]_[A-Za-z0-9]{36,}|github_pat_[A-Za-z0-9_]{40,}|AKIA[0-9A-Z]{16}/,
      `Known credential material: ${name}`,
    );
  }
  const code = files.get('dist/index.js').toString();
  assert.match(code, /^\s*["']use client["'];/);
  assert.doesNotMatch(
    code,
    /\brequire\(|module\.exports|react.production|react.development|\.css["']/,
  );
  for (const specifier of ['react', 'd3-scale', 'd3-shape'])
    assert.match(
      code,
      new RegExp(`from ["']${specifier}(?:/jsx-runtime)?["']`),
      `${specifier} remains external`,
    );
  const map = JSON.parse(files.get('dist/index.js.map').toString());
  assert.equal(map.version, 3);
  assert.equal(map.file, 'index.js');
  assert.equal(map.sourceRoot, undefined);
  assert(map.sources.length > 0);
  assert.equal(map.sources.length, map.sourcesContent.length);
  assert.equal(new Set(map.sources).size, map.sources.length);
  for (const [index, path] of map.sources.entries()) {
    assert.match(
      path,
      /^\.\.\/src\/(?:[A-Za-z0-9_-]+\/)*[A-Za-z0-9_-]+\.tsx?$/,
    );
    const target = resolve(root, 'dist', path);
    await git('git', ['ls-files', '--error-unmatch', target], {
      cwd: root,
      timeout: 10000,
    });
    assert.equal(
      map.sourcesContent[index],
      await readFile(target, 'utf8'),
      `Embedded source mismatch: ${path}`,
    );
  }
  const genuine = join(work, 'selected.tgz');
  await writeFile(genuine, bytes, { flag: 'wx', mode: 0o444 });
  await chmod(genuine, 0o444);
  const identity = {
    policy,
    sha256: options.sha256,
    size: bytes.length,
    name: manifest.name,
    version: manifest.version,
    ...(Object.hasOwn(manifest, 'private')
      ? { private: manifest.private }
      : {}),
    selectedPath: options.artifact,
    source,
    inventory: inventory.map((path) => ({
      path,
      size: files.get(path).length,
      sha256: sha256(files.get(path)),
    })),
  };
  async function verify() {
    for (const path of [options.artifact, genuine])
      assert.equal(
        sha256(await archiveBytes(path)),
        identity.sha256,
        `Archive changed during verification: ${path}`,
      );
    await sourceIdentity(root, options['source-sha']);
    for (const [path, content] of files)
      assert.deepEqual(
        await readFile(join(root, path)),
        content,
        `Checkout content changed: ${path}`,
      );
  }
  await verify();
  return {
    genuine,
    js: files.get('dist/index.js'),
    metadata: identity,
    identity,
    files,
    manifest,
    verify,
  };
}
export function forbidExactRepack(options, cmd, args) {
  assert(
    !(options && cmd === 'npm' && args[0] === 'pack'),
    'npm pack is forbidden in exact-artifact mode',
  );
}
