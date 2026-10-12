// Development archive construction and genuine installed-package/type/build checks.
import assert from 'node:assert/strict';
import { mkdir, readFile, stat } from 'node:fs/promises';
import { join } from 'node:path';
import { gzipSync } from 'node:zlib';
import { prepareIndependentRoots } from './fixtures.mjs';

export async function prepareDevelopmentArchive({ root, work, run }) {
  async function pack(dir) {
    await run('npm', ['pack', '--pack-destination', work], dir);
    const p = JSON.parse(await readFile(join(dir, 'package.json'), 'utf8'));
    return join(
      work,
      `${p.name.replace(/^@/, '').replaceAll('/', '-')}-${p.version}.tgz`,
    );
  }
  await mkdir(work, { recursive: true });
  const genuine = await pack(root);
  const js = await readFile(join(root, 'dist/index.js'));
  assert(js.toString().startsWith('"use client";'));
  assert(!/react.production|react.development|\.css["']/.test(js.toString()));
  const metadata = {
    tarballBytes: (await stat(genuine)).size,
    esmBytes: js.length,
    esmGzipBytes: gzipSync(js).length,
  };

  return { genuine, js, metadata };
}

export async function installAndVerifyConsumer({
  dir,
  configuration,
  installedEntry,
  js,
  packageName,
  file,
  run,
}) {
  const { kind, major } = configuration;
  await run('npm', ['install', '--no-audit', '--no-fund'], dir);
  assert.deepEqual(
    await readFile(join(dir, installedEntry)),
    js,
    'Installed genuine ESM must match the packed build',
  );
  await run('node', ['package-check.mjs'], dir);
  await run('npm', ['ls', 'react', 'react-dom'], dir);

  await prepareIndependentRoots({ dir, kind, packageName, file, run });
  await run(
    'node',
    ['node_modules/typescript/bin/tsc', '--project', 'tsconfig.package.json'],
    dir,
  );
  if (kind === 'vite')
    await run('node', ['node_modules/typescript/bin/tsc', '--noEmit'], dir);
  await run(
    'node',
    kind === 'vite'
      ? ['node_modules/vite/bin/vite.js', 'build']
      : [
          'node_modules/next/dist/bin/next',
          'build',
          ...(major === 19 ? ['--webpack'] : []),
        ],
    dir,
  );
}
