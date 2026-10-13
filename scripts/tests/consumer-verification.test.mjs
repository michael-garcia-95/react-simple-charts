import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { test } from 'node:test';
import {
  consumerConfigurations,
  createConsumerFixture,
} from '../consumers/fixtures.mjs';
import { installAndVerifyConsumer } from '../consumers/installed-package.mjs';
import {
  initialConsumerReport,
  createConsumerIO,
  assertConsumerCompleteness,
} from '../consumers/evidence.mjs';
import { createEvidenceRun } from '../verification-evidence.mjs';

const root = resolve(import.meta.dirname, '../..');
const pkg = {
  name: '@michael-garcia-95/react-simple-charts',
  version: '0.0.0',
  private: true,
};
async function temporary(action) {
  const dir = await mkdtemp(join(tmpdir(), 'rsc consumer modules '));
  try {
    await action(dir);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}
function fixtureIO() {
  const files = new Map();
  const file = async (dir, name, content) => {
    files.set(name, content);
  };
  const json = async (dir, name, value) =>
    file(dir, name, JSON.stringify(value, null, 2));
  return { files, file, json };
}

test('complete immutable consumer matrix retains every approved pin and execution order', () => {
  assert.deepEqual(
    consumerConfigurations.map((row) => [
      row.kind,
      row.major,
      row.react,
      row.types,
      row.domTypes,
      row.next,
      row.compiler,
      row.nodeTypes,
      row.framework,
      row.port,
    ]),
    [
      [
        'vite',
        18,
        '18.2.0',
        '18.3.31',
        '18.3.7',
        '14.2.35',
        '6.0.3',
        '24.19.1',
        '8.3.4',
        4318,
      ],
      [
        'next',
        18,
        '18.2.0',
        '18.3.31',
        '18.3.7',
        '14.2.35',
        '5.4.5',
        '20.19.0',
        '14.2.35',
        4318,
      ],
      [
        'vite',
        19,
        '19.3.0',
        '19.3.0',
        '19.3.0',
        '16.4.0',
        '6.0.3',
        '24.19.1',
        '8.3.4',
        4319,
      ],
      [
        'next',
        19,
        '19.3.0',
        '19.3.0',
        '19.3.0',
        '16.4.0',
        '6.0.3',
        '24.19.1',
        '16.4.0',
        4319,
      ],
    ],
  );
  assert.ok(Object.isFrozen(consumerConfigurations));
  assert.ok(consumerConfigurations.every(Object.isFrozen));
});
for (const configuration of consumerConfigurations) {
  const { kind, major } = configuration;
  test(
    `${kind}-${major} fixture wiring, strict declarations, routes and production commands remain distinct`,
    { timeout: 5000 },
    async () =>
      temporary(async (dir) => {
        const { files, file, json } = fixtureIO();
        const genuine = join(dir, 'archive with spaces.tgz');
        const identity = `${kind}-${major}:test`;
        await createConsumerFixture({
          root,
          dir,
          pkg,
          genuine,
          identity,
          configuration,
          file,
          json,
        });
        const manifest = JSON.parse(files.get('package.json'));
        assert.equal(manifest.dependencies[pkg.name], `file:${genuine}`);
        assert.equal(manifest.dependencies.react, configuration.react);
        assert.equal(manifest.dependencies['react-dom'], configuration.react);
        assert.equal(manifest.dependencies.typescript, configuration.compiler);
        assert.equal(manifest.dependencies[kind], configuration.framework);
        const strict = JSON.parse(files.get('tsconfig.package.json'));
        assert.equal(strict.compilerOptions.skipLibCheck, false);
        assert.deepEqual(strict.files, [
          'contracts.tsx',
          'Sample.tsx',
          'Interactive.tsx',
        ]);
        assert.equal(
          JSON.parse(files.get('tsconfig.json')).compilerOptions.skipLibCheck,
          kind === 'next',
        );
        assert.deepEqual(
          await readFile(join(dir, 'contracts.tsx')),
          await readFile(join(root, 'tests/types/contracts.tsx')),
        );
        for (const family of [
          'LineChart',
          'AreaChart',
          'BarChart',
          'PieChart',
          'DonutChart',
        ])
          assert.ok(files.get('Sample.tsx').includes(family), family);
        assert.match(files.get('Interactive.tsx'), /SingleDonutInspection/);
        assert.match(
          files.get('Interactive.tsx'),
          /innerRadiusRatio=\{0.8\} centerContent=\{0\}/,
        );
        assert.match(
          files.get('package-check.mjs'),
          /ERR_PACKAGE_PATH_NOT_EXPORTED/,
        );
        assert.match(
          files.get('package-check.mjs'),
          /validateManifest\(p,.*development/,
        );
        if (kind === 'next') {
          assert.match(files.get('app/page.tsx'), /force-dynamic/);
          assert.match(
            files.get('pages/pages-check.tsx'),
            /getServerSideProps/,
          );
          assert.ok(files.get('app/layout.tsx').includes(identity));
        } else assert.ok(files.get('index.html').includes(identity));
        const installedEntry = `node_modules/${pkg.name}/dist/index.js`;
        const js = Buffer.from(
          '"use client";\nexport const LineChart=()=>null;',
        );
        await mkdir(join(dir, `node_modules/${pkg.name}/dist`), {
          recursive: true,
        });
        await writeFile(join(dir, installedEntry), js);
        const calls = [];
        const run = async (command, args, cwd) => {
          calls.push({ command, args, cwd });
        };
        await installAndVerifyConsumer({
          dir,
          configuration,
          installedEntry,
          js,
          packageName: pkg.name,
          file,
          run,
        });
        const expected = [
          ['npm', ['install', '--no-audit', '--no-fund']],
          ['node', ['package-check.mjs']],
          ['npm', ['ls', 'react', 'react-dom']],
        ];
        if (kind === 'vite') expected.push(['node', ['roots-server.mjs']]);
        expected.push([
          'node',
          [
            'node_modules/typescript/bin/tsc',
            '--project',
            'tsconfig.package.json',
          ],
        ]);
        if (kind === 'vite')
          expected.push([
            'node',
            ['node_modules/typescript/bin/tsc', '--noEmit'],
          ]);
        expected.push([
          'node',
          kind === 'vite'
            ? ['node_modules/vite/bin/vite.js', 'build']
            : [
                'node_modules/next/dist/bin/next',
                'build',
                ...(major === 19 ? ['--webpack'] : []),
              ],
        ]);
        assert.deepEqual(
          calls,
          expected.map(([command, args]) => ({ command, args, cwd: dir })),
        );
        if (kind === 'vite') {
          for (const prefix of [
            'alpha-',
            'beta-',
            'gamma-',
            'pie-explicit-',
            'pie-responsive-',
            'donut-explicit-',
            'donut-responsive-',
          ])
            assert.ok(files.get('roots-server.mjs').includes(prefix), prefix);
          assert.match(files.get('roots.tsx'), /StrictMode/);
          assert.match(
            files.get('vite.config.ts'),
            /input:\['index.html','roots.html'\]/,
          );
        } else assert.equal(files.has('roots-server.mjs'), false);
      }),
  );
}
function passingReport() {
  const report = initialConsumerReport(consumerConfigurations);
  report.configurations.forEach((row) => {
    row.status = 'passed';
  });
  report.checks = consumerConfigurations.map(({ kind, major }) => ({
    kind,
    react: major,
    status: 'pass',
  }));
  return report;
}
test('all required rows explicitly complete before a pass', () => {
  const report = initialConsumerReport(consumerConfigurations);
  assert.ok(report.configurations.every((row) => row.status === 'unexecuted'));
  assertConsumerCompleteness(passingReport(), consumerConfigurations);
});
for (const mutation of [
  'omitted configuration',
  'duplicate browser row',
  'failed browser row',
]) {
  test(`completeness rejects ${mutation}`, () => {
    const report = passingReport();
    if (mutation === 'omitted configuration') report.configurations.pop();
    else if (mutation === 'duplicate browser row')
      report.checks[3] = { ...report.checks[0] };
    else report.checks[3].status = 'fail';
    assert.throws(() =>
      assertConsumerCompleteness(report, consumerConfigurations),
    );
  });
}
test(
  'installed failure crosses the module boundary unchanged and leaves unexecuted rows intact',
  { timeout: 5000 },
  async () =>
    temporary(async (dir) => {
      const evidence = await createEvidenceRun(
        join(dir, 'evidence'),
        'test',
        initialConsumerReport(consumerConfigurations),
      );
      const original = new Error('controlled consumer install failure');
      const scratch = join(dir, 'owned-fixture');
      await mkdir(scratch);
      let cleanup = false;
      await assert.rejects(
        evidence.execute(
          async () => {
            evidence.report.configurations[0].status = 'running';
            await installAndVerifyConsumer({
              dir: scratch,
              configuration: consumerConfigurations[0],
              run: async () => {
                throw original;
              },
            });
          },
          async () => {
            cleanup = true;
            await rm(scratch, { recursive: true });
          },
        ),
        (error) => error === original,
      );
      const report = JSON.parse(
        await readFile(join(evidence.directory, 'results.json'), 'utf8'),
      );
      assert.equal(cleanup, true);
      assert.equal(report.status, 'failed');
      assert.equal(report.error.message, original.message);
      assert.deepEqual(
        report.configurations.map((row) => row.status),
        ['failed', 'unexecuted', 'unexecuted', 'unexecuted'],
      );
      assert.equal(report.checks.length, 0);
    }),
);
test(
  'phase-aware IO keeps fixture writes separate from retained configuration evidence',
  { timeout: 5000 },
  async () =>
    temporary(async (dir) => {
      const evidence = await createEvidenceRun(join(dir, 'evidence'), 'test');
      await evidence.execute(async () => {
        const io = createConsumerIO({
          root: dir,
          evidenceRun: evidence,
          env: process.env,
        });
        const fixture = join(dir, 'fixture with spaces', 'vite-18');
        await io.file(fixture, 'Sample.tsx', 'fixture');
        await io.json(fixture, 'evidence/snapshot.json', { retained: true });
        assert.equal(
          await readFile(join(fixture, 'Sample.tsx'), 'utf8'),
          'fixture',
        );
        assert.deepEqual(
          JSON.parse(
            await readFile(
              join(evidence.directory, 'vite-18/snapshot.json'),
              'utf8',
            ),
          ),
          { retained: true },
        );
      });
    }),
);
