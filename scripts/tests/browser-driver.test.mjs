import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, rm, symlink } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { driverVersions, loadBrowserDriver } from '../browser-driver.mjs';

test('isolated browser driver pins remain explicit', () => {
  assert.deepEqual(driverVersions, {
    'playwright-core': '1.64.0',
    '@axe-core/playwright': '4.13.0',
  });
});
test('missing driver provides installation and browser prerequisite commands', () => {
  assert.throws(
    () =>
      loadBrowserDriver(join(tmpdir(), 'missing-rsc-driver-' + process.pid)),
    /browser-driver.mjs --install.*install chromium.*RSC_BROWSER_PATH/,
  );
});
test('driver resolves only isolated packages and verifies manifest and installed versions', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'rsc driver spaces '));
  try {
    await writeFile(
      join(directory, 'package.json'),
      JSON.stringify({ dependencies: driverVersions }),
    );
    for (const [name, version] of Object.entries(driverVersions)) {
      const packageDir = join(directory, 'node_modules', name);
      await mkdir(packageDir, { recursive: true });
      await writeFile(
        join(packageDir, 'package.json'),
        JSON.stringify({ name, version, main: 'index.cjs' }),
      );
      await writeFile(
        join(packageDir, 'index.cjs'),
        name === 'playwright-core'
          ? 'module.exports={chromium:"isolated"}'
          : 'module.exports={default:"isolated axe"}',
      );
    }
    assert.deepEqual(loadBrowserDriver(directory), {
      engines: { chromium: 'isolated' },
      AxeBuilder: 'isolated axe',
    });
    // A correct-looking package outside this installation must not be accepted.
    if (process.platform !== 'win32') {
      const external = join(directory, 'outside-playwright');
      await mkdir(external);
      await writeFile(
        join(external, 'package.json'),
        JSON.stringify({ version: '1.64.0', main: 'index.cjs' }),
      );
      await writeFile(join(external, 'index.cjs'), 'module.exports={}');
      await rm(join(directory, 'node_modules/playwright-core'), {
        recursive: true,
      });
      await symlink(external, join(directory, 'node_modules/playwright-core'));
      assert.throws(
        () => loadBrowserDriver(directory),
        /outside isolated node_modules/,
      );
      await rm(join(directory, 'node_modules/playwright-core'));
      await mkdir(join(directory, 'node_modules/playwright-core'));
      await writeFile(
        join(directory, 'node_modules/playwright-core/index.cjs'),
        'module.exports={chromium:"isolated"}',
      );
    }
    await writeFile(
      join(directory, 'node_modules/playwright-core/package.json'),
      JSON.stringify({ version: '0.0.0', main: 'index.cjs' }),
    );
    assert.throws(
      () => loadBrowserDriver(directory),
      /installed 0.0.0; expected 1.64.0/,
    );
    await writeFile(
      join(directory, 'package.json'),
      JSON.stringify({
        dependencies: { ...driverVersions, 'playwright-core': '^1.64.0' },
      }),
    );
    assert.throws(
      () => loadBrowserDriver(directory),
      /manifest must pin 1.64.0/,
    );
    await writeFile(
      join(directory, 'package.json'),
      JSON.stringify({ dependencies: driverVersions }),
    );
    await rm(join(directory, 'node_modules'), { recursive: true });
    assert.throws(
      () => loadBrowserDriver(directory),
      /Browser driver unavailable/,
    );
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
