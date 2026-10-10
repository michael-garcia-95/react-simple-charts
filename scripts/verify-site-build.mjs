// Verify emitted Vite HTML without deploying or requiring a browser.
import assert from 'node:assert/strict';
import { mkdir, readFile, readdir, stat, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { brotliCompressSync, gzipSync } from 'node:zlib';
const base = process.argv[2] ?? '/';
assert.match(base, /^\/(?:[a-z0-9-]+\/)*$/);
const root = resolve(import.meta.dirname, '..', 'site-dist');
const referenced = new Set();
const routes = ['', 'examples/', 'documentation/', 'about/'];
for (const route of routes) {
  const html = await readFile(resolve(root, route, 'index.html'), 'utf8');
  const title = route
    ? route.slice(0, -1).replace(/^./, (c) => c.toUpperCase())
    : 'Home';
  assert.ok(html.includes(`<title>${title} | React Simple Charts</title>`));
  assert.match(html, /<html lang="en">/);
  assert.match(html, /name="viewport"/);
  assert.match(html, /name="description"/);
  assert.match(html, /data:image\/svg\+xml/);
  assert.doesNotMatch(html, /(?:src|href)="(?:[^" ]*\/src\/|https?:)/);
  const assets = [...html.matchAll(/(?:src|href)="([^" ]+\.(?:js|css))"/g)].map(
    (match) => match[1],
  );
  assert.ok(
    assets.some((asset) => asset.endsWith('.js')),
    `${route}: missing JavaScript`,
  );
  assert.ok(
    assets.some((asset) => asset.endsWith('.css')),
    `${route}: missing CSS`,
  );
  for (const asset of assets) {
    assert.ok(
      asset.startsWith(`${base}assets/`),
      `${route}: incorrect base: ${asset}`,
    );
    assert.ok((await stat(resolve(root, asset.slice(base.length)))).isFile());
    referenced.add(asset.slice(base.length));
  }
}
async function files(dir, prefix = '') {
  const result = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = prefix + entry.name;
    if (entry.isDirectory())
      result.push(...(await files(resolve(dir, entry.name), path + '/')));
    else result.push(path);
  }
  return result.sort();
}
const emitted = await files(root);
const expected = new Set(routes.map((route) => route + 'index.html'));
for (const asset of referenced) {
  expected.add(asset);
  if (asset.endsWith('.js')) {
    expected.add(asset + '.map');
    const js = await readFile(resolve(root, asset), 'utf8');
    assert.ok(js.includes(`sourceMappingURL=${asset.split('/').pop()}.map`));
  }
}
assert.deepEqual(
  emitted,
  [...expected].sort(),
  'Unexpected or missing output files',
);
const inventory = [];
for (const path of emitted) {
  const body = await readFile(resolve(root, path));
  inventory.push({
    path,
    bytes: body.length,
    gzip: gzipSync(body).length,
    brotli: brotliCompressSync(body).length,
  });
}
const evidence = resolve(
  import.meta.dirname,
  '../work/visual/site',
  base === '/' ? 'root' : 'pages',
);
await mkdir(evidence, { recursive: true });
await writeFile(
  resolve(evidence, 'artifact.json'),
  JSON.stringify({ base, files: inventory }, null, 2),
);
console.log(`Four HTML entries and all JS/CSS assets verified under ${base}`);
console.log(JSON.stringify(inventory, null, 2));
