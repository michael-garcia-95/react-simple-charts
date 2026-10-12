import { mkdir, writeFile } from 'node:fs/promises';
import { readFileSync, realpathSync } from 'node:fs';
import { createRequire } from 'node:module';
import { resolve, join, relative, isAbsolute } from 'node:path';
import { runVerificationCommand } from './verification-command.mjs';

export const driverVersions = Object.freeze({
  'playwright-core': '1.64.0',
  '@axe-core/playwright': '4.13.0',
});
const root = resolve(import.meta.dirname, '..');
export const consumerDriver = join(root, 'work/consumers/driver');
export const smokeDriver = join(root, 'work/browser-smoke/driver');

export function loadBrowserDriver(directory = consumerDriver) {
  try {
    const manifest = JSON.parse(
      readFileSync(join(directory, 'package.json'), 'utf8'),
    );
    const require = createRequire(join(directory, 'package.json'));
    const modules = realpathSync(join(directory, 'node_modules'));
    for (const [name, version] of Object.entries(driverVersions)) {
      if (manifest.dependencies?.[name] !== version)
        throw new Error(`${name} manifest must pin ${version}`);
      const entry = realpathSync(require.resolve(name));
      const path = realpathSync(
        join(directory, 'node_modules', name, 'package.json'),
      );
      const boundary = relative(modules, path);
      const entryBoundary = relative(
        realpathSync(join(directory, 'node_modules', name)),
        entry,
      );
      if (
        boundary.startsWith('..') ||
        isAbsolute(boundary) ||
        entryBoundary.startsWith('..') ||
        isAbsolute(entryBoundary)
      )
        throw new Error(`${name} resolved outside isolated node_modules`);
      const installed = JSON.parse(readFileSync(path, 'utf8'));
      if (installed.version !== version)
        throw new Error(
          `${name} installed ${installed.version}; expected ${version}`,
        );
    }
    return {
      engines: require('playwright-core'),
      AxeBuilder: require('@axe-core/playwright').default,
    };
  } catch (cause) {
    throw new Error(
      `Browser driver unavailable or invalid at ${directory}. Run node scripts/browser-driver.mjs --install${directory === smokeDriver ? ' --smoke' : ''}; then install browser binaries with node "${join(directory, 'node_modules/playwright-core/cli.js')}" install chromium (or set RSC_BROWSER_PATH). ${cause.message}`,
      { cause },
    );
  }
}

export async function installBrowserDriver(
  directory,
  { env = process.env, timeoutMs = 300000, signal } = {},
) {
  await mkdir(directory, { recursive: true });
  await writeFile(
    join(directory, 'package.json'),
    JSON.stringify(
      { private: true, type: 'module', dependencies: driverVersions },
      null,
      2,
    ),
  );
  await runVerificationCommand('npm', ['install', '--no-audit', '--no-fund'], {
    cwd: directory,
    env,
    timeoutMs,
    signal,
  });
  return loadBrowserDriver(directory);
}

if (
  process.argv[1] &&
  resolve(process.argv[1]) === resolve(import.meta.filename)
) {
  if (!process.argv.includes('--install'))
    throw new Error(
      'Use --install [--smoke] to prepare the isolated browser driver',
    );
  await installBrowserDriver(
    process.argv.includes('--smoke') ? smokeDriver : consumerDriver,
  );
}
