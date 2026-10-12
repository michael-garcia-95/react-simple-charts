import { runVerificationCommand } from './verification-command.mjs';
import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { build } from 'tsdown';
import ts from 'typescript';

const execute = promisify(execFile);
const pkg = JSON.parse(await readFile('package.json', 'utf8'));
assert.equal(pkg.name, '@michael-garcia-95/react-simple-charts');
assert.equal(pkg.version, '0.0.0');
assert.equal(pkg.private, true);
assert.equal(pkg.type, 'module');
assert.equal(pkg.engines, undefined);
assert.deepEqual(pkg.peerDependencies, {
  react: '^18.2.0 || ^19.0.0',
  'react-dom': '^18.2.0 || ^19.0.0',
});
assert.deepEqual(pkg.dependencies, {
  'd3-scale': '^4.0.2',
  'd3-shape': '^3.2.0',
});
assert.deepEqual(pkg.exports, {
  '.': { types: './dist/index.d.ts', import: './dist/index.js' },
});
const code = await readFile('dist/index.js', 'utf8');
assert.match(code, /^\s*["']use client["'];/);
assert.doesNotMatch(code, /\brequire\(|module\.exports/);
assert.match(await readFile('dist/index.d.ts', 'utf8'), /export/);
// Embedded maps deliberately expose only tracked public library implementation.
const sourceMap = JSON.parse(await readFile('dist/index.js.map', 'utf8'));
assert.equal(sourceMap.version, 3);
assert.equal(sourceMap.file, 'index.js');
assert.equal(sourceMap.sourceRoot, undefined);
assert.equal(sourceMap.sources.length, sourceMap.sourcesContent.length);
assert.ok(sourceMap.sources.length > 0);
assert.equal(new Set(sourceMap.sources).size, sourceMap.sources.length);
for (const [index, source] of sourceMap.sources.entries()) {
  assert.match(
    source,
    /^\.\.\/src\/(?:[A-Za-z0-9_-]+\/)*[A-Za-z0-9_-]+\.tsx?$/,
  );
  const path = resolve('dist', source);
  await execute('git', ['ls-files', '--error-unmatch', path]);
  assert.equal(sourceMap.sourcesContent[index], await readFile(path, 'utf8'));
}
for (const specifier of ['d3-scale', 'd3-shape'])
  assert.ok(
    code.includes(`from "${specifier}"`),
    `${specifier} remains external`,
  );
const forbiddenMaterial =
  /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----|npm_[A-Za-z0-9]{36,}|gh[pousr]_[A-Za-z0-9]{36,}|github_pat_[A-Za-z0-9_]{40,}|AKIA[0-9A-Z]{16}/;
assert.doesNotMatch(JSON.stringify(sourceMap), forbiddenMaterial);
const api = await import(pkg.name);
assert.deepEqual(Object.keys(api).sort(), [
  'AreaChart',
  'BarChart',
  'DonutChart',
  'LineChart',
  'PieChart',
]);
assert.equal(typeof api.LineChart, 'function');
assert.equal(typeof api.AreaChart, 'function');
assert.equal(typeof api.BarChart, 'function');
assert.equal(typeof api.PieChart, 'function');
assert.equal(typeof api.DonutChart, 'function');
const { createElement } = await import('react');
const { renderToString } = await import('react-dom/server');
assert.match(
  renderToString(
    createElement(api.LineChart, {
      data: [{ x: 'A', y: 2 }],
      xKey: 'x',
      yKey: 'y',
      width: 640,
    }),
  ),
  /<svg/,
);
assert.match(code, /from ["']react(?:\/jsx-runtime)?["']/);
await assert.rejects(import(`${pkg.name}/internal`), {
  code: 'ERR_PACKAGE_PATH_NOT_EXPORTED',
});
const declarations = ts.createProgram(
  ['dist/index.d.ts', 'tests/types/contracts.tsx'],
  {
    strict: true,
    exactOptionalPropertyTypes: true,
    noUncheckedIndexedAccess: true,
    jsx: ts.JsxEmit.ReactJSX,
    noEmit: true,
    skipLibCheck: false,
    types: [],
    target: ts.ScriptTarget.ES2022,
    module: ts.ModuleKind.NodeNext,
    moduleResolution: ts.ModuleResolutionKind.NodeNext,
  },
);
const checker = declarations.getTypeChecker();
const entrySource = declarations.getSourceFile('dist/index.d.ts');
const moduleSymbol = checker.getSymbolAtLocation(entrySource);
const exportedNames = checker
  .getExportsOfModule(moduleSymbol)
  .map((symbol) => symbol.name)
  .sort();
const sourceBarrel = ts.createSourceFile(
  'src/index.ts',
  await readFile('src/index.ts', 'utf8'),
  ts.ScriptTarget.Latest,
);
const expectedNames = sourceBarrel.statements
  .flatMap((statement) =>
    ts.isExportDeclaration(statement) &&
    statement.exportClause &&
    ts.isNamedExports(statement.exportClause)
      ? statement.exportClause.elements.map((element) => element.name.text)
      : [],
  )
  .sort();
assert.deepEqual(exportedNames, expectedNames);
const diagnostics = ts.getPreEmitDiagnostics(declarations);
assert.equal(
  diagnostics.length,
  0,
  diagnostics
    .map((diagnostic) =>
      ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n'),
    )
    .join('\n'),
);

// The empty foundation entry cannot exercise React imports. Build a disposable
// probe with the actual configuration to verify all runtime subpaths stay external.
const directory = await mkdtemp(join(tmpdir(), 'rsc-package-'));
try {
  const entry = join(directory, 'probe.ts');
  await writeFile(
    entry,
    `
    export { createElement } from 'react';
    export { jsx } from 'react/jsx-runtime';
    export { createPortal } from 'react-dom';
    export { createRoot } from 'react-dom/client';
  `,
  );
  await build({
    config: 'tsdown.config.ts',
    entry: [entry],
    outDir: join(directory, 'dist'),
    dts: false,
  });
  const probe = await readFile(join(directory, 'dist/probe.js'), 'utf8');
  for (const specifier of [
    'react',
    'react/jsx-runtime',
    'react-dom',
    'react-dom/client',
  ]) {
    assert.ok(
      probe.includes(`from "${specifier}"`) ||
        probe.includes(`from '${specifier}'`),
      `${specifier} must remain external`,
    );
  }
  assert.match(probe, /^\s*["']use client["'];/);
} finally {
  await rm(directory, { recursive: true, force: true });
}
// Inspect a real archive, including its manifest and exact packed build bytes.
const archiveDirectory = await mkdtemp(join(tmpdir(), 'rsc-archive-'));
try {
  const { stdout } = await runVerificationCommand(
    'npm',
    [
      'pack',
      '--json',
      // The parent verify:package command already built the distribution.
      '--ignore-scripts',
      '--cache',
      join(archiveDirectory, 'npm-cache'),
      '--pack-destination',
      archiveDirectory,
    ],
    { capture: true, timeoutMs: 120000 },
  );
  const [packed] = JSON.parse(stdout);
  assert.equal(packed.name, pkg.name);
  assert.equal(packed.version, pkg.version);
  assert.deepEqual(packed.bundled, []);
  const inventory = [
    'LICENSE',
    'README.md',
    'package.json',
    'dist/index.js',
    'dist/index.d.ts',
    'dist/index.js.map',
  ].sort();
  assert.deepEqual(packed.files.map(({ path }) => path).sort(), inventory);
  const archive = join(archiveDirectory, packed.filename);
  const { stdout: entries } = await execute('tar', ['-tzf', archive]);
  assert.deepEqual(
    entries.trim().split('\n').sort(),
    inventory.map((path) => `package/${path}`).sort(),
  );
  await execute('tar', ['-xzf', archive, '-C', archiveDirectory]);
  const packedRoot = join(archiveDirectory, 'package');
  assert.deepEqual(
    JSON.parse(await readFile(join(packedRoot, 'package.json'), 'utf8')),
    pkg,
  );
  for (const path of inventory) {
    assert.doesNotMatch(
      await readFile(join(packedRoot, path), 'utf8'),
      forbiddenMaterial,
    );
    assert.deepEqual(
      await readFile(join(packedRoot, path)),
      await readFile(path),
    );
  }
  console.log(
    `Actual archive verified: ${packed.filename}, ${packed.entryCount} files, ${packed.size} packed bytes, ${packed.unpackedSize} unpacked bytes.`,
  );
} finally {
  await rm(archiveDirectory, { recursive: true, force: true });
}
console.log(
  'Package contract, declarations, client boundary, and React externalization verified.',
);
