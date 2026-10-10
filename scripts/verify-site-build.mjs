// Verify emitted Vite HTML without deploying or requiring a browser.
import assert from 'node:assert/strict';
import { readFile, stat } from 'node:fs/promises';
import { resolve } from 'node:path';
const base = process.argv[2] ?? '/';
assert.match(base, /^\/(?:[a-z0-9-]+\/)*$/);
const root = resolve(import.meta.dirname, '..', 'site-dist');
for (const route of ['', 'examples/', 'documentation/', 'about/']) {
  const html = await readFile(resolve(root, route, 'index.html'), 'utf8');
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
  }
}
console.log(`Four HTML entries and all JS/CSS assets verified under ${base}`);
