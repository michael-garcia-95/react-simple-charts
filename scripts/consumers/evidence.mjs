// Existing report schema, phase-aware IO, and verified production bundle metrics.
import assert from 'node:assert/strict';
import { mkdir, readFile, writeFile, readdir } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { gzipSync } from 'node:zlib';
import { runVerificationCommand } from '../verification-command.mjs';

export function initialConsumerReport(configurations) {
  return {
    versions: [],
    artifacts: {},
    checks: [],
    servers: [],
    configurations: configurations.map(({ kind, major }) => ({
      kind,
      react: major,
      status: 'unexecuted',
    })),
  };
}
export function createConsumerIO({ root, evidenceRun, env }) {
  async function run(cmd, args, cwd = root) {
    console.log(cwd, cmd, ...args);
    return evidenceRun.phase(
      cmd === 'npm' && args[0] === 'pack'
        ? 'package creation'
        : cmd === 'npm' && args[0] === 'install'
          ? 'consumer installation'
          : 'build/type verification',
      () =>
        runVerificationCommand(cmd, args, {
          cwd,
          env,
          timeoutMs: 600000,
          signal: evidenceRun.signal,
        }),
    );
  }

  async function file(dir, name, content) {
    const path = name.startsWith('evidence/')
      ? join(evidenceRun.directory, dir.split(/[\\/]/).at(-1), name.slice(9))
      : join(dir, name);
    await mkdir(resolve(path, '..'), { recursive: true });
    await writeFile(path, content);
  }
  async function json(dir, name, value) {
    await file(dir, name, JSON.stringify(value, null, 2));
  }

  return { run, file, json };
}

export async function recordBuildEvidence({
  dir,
  configuration,
  installedEntry,
  packageName,
  report,
  file,
  json,
}) {
  const { kind, major, react, types, domTypes, next, compiler, nodeTypes } =
    configuration;
  if (kind === 'next') {
    const clientManifest = await readFile(
      join(dir, '.next/server/app/page_client-reference-manifest.js'),
      'utf8',
    );
    assert(clientManifest.includes(installedEntry));
    // Next manifests register the package namespace (*), not export names.
    // The compiled Server Component must reference the named client export.
    const appServer = await readFile(
      join(dir, '.next/server/app/page.js'),
      'utf8',
    );
    assert(
      appServer.includes('dist/index.js#PieChart') ||
        /dist\/index\.js["'],["']PieChart/.test(appServer),
    );
    assert(
      appServer.includes('dist/index.js#DonutChart') ||
        /dist\/index\.js["'],["']DonutChart/.test(appServer),
    );
    await file(dir, 'evidence/client-reference-manifest.js', clientManifest);
    let bytes = 0;
    let gzip = 0;
    async function measure(directory) {
      for (const entry of await readdir(directory, {
        withFileTypes: true,
      })) {
        const path = join(directory, entry.name);
        if (entry.isDirectory()) await measure(path);
        else if (entry.name.endsWith('.js')) {
          const data = await readFile(path);
          bytes += data.length;
          gzip += gzipSync(data).length;
          assert(!data.toString().includes('react.development.js'));
        }
      }
    }
    await measure(join(dir, '.next/static'));
    report.artifacts[`next${major}`] = {
      staticJsBytes: bytes,
      staticJsGzipBytes: gzip,
    };
  }
  report.versions.push({
    kind,
    react,
    types,
    domTypes,
    framework: kind === 'vite' ? '8.3.4' : next,
    typescript: compiler,
    nodeTypes,
  });
  if (kind === 'vite') {
    const assets = await readdir(join(dir, 'dist/assets'));
    let total = 0;
    let gzip = 0;
    const sources = [];
    for (const name of assets.filter((name) => name.endsWith('.js'))) {
      const js = await readFile(join(dir, 'dist/assets', name));
      total += js.length;
      gzip += gzipSync(js).length;
      const map = JSON.parse(
        await readFile(join(dir, 'dist/assets', `${name}.map`), 'utf8'),
      );
      sources.push(...map.sources);
    }
    report.artifacts[`vite${major}`] = {
      jsBytes: total,
      gzipBytes: gzip,
    };
    await json(dir, 'evidence/bundle-sources.json', sources);
    assert(!sources.some((name) => /react\.development/.test(name)));
    assert(
      sources.some((name) => name.includes(`node_modules/${packageName}/`)),
    );
  }
}

export function assertConsumerCompleteness(report, configurations) {
  assert.equal(report.checks.length, 4, 'All four consumers must execute');
  assert.ok(report.configurations.every((item) => item.status === 'passed'));
  const keys = (rows) =>
    rows.map(({ kind, react }) => `${kind}-${react}`).sort();
  const expected = keys(
    configurations.map(({ kind, major }) => ({ kind, react: major })),
  );
  assert.deepEqual(
    keys(report.configurations),
    expected,
    'Every required configuration must be reported exactly once',
  );
  assert.deepEqual(
    keys(report.checks),
    expected,
    'Every required browser check must be reported exactly once',
  );
  assert.ok(
    report.checks.every((item) => item.status === 'pass'),
    'Every required browser check must pass',
  );
}
