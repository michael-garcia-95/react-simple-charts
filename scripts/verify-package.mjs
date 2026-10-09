import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { build } from 'tsdown';
import ts from 'typescript';

const pkg = JSON.parse(await readFile('package.json', 'utf8'));
assert.equal(pkg.private, true);
assert.equal(pkg.type, 'module');
assert.deepEqual(pkg.exports, {
  '.': { types: './dist/index.d.ts', import: './dist/index.js' },
});
const code = await readFile('dist/index.js', 'utf8');
assert.match(code, /^\s*["']use client["'];/);
assert.doesNotMatch(code, /\brequire\(|module\.exports/);
assert.match(await readFile('dist/index.d.ts', 'utf8'), /export/);
const api = await import('react-simple-charts');
assert.deepEqual(Object.keys(api).sort(), ['AreaChart', 'LineChart']);
assert.equal(typeof api.LineChart, 'function');
assert.equal(typeof api.AreaChart, 'function');
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
await assert.rejects(import('react-simple-charts/internal'), {
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
console.log(
  'Package contract, declarations, client boundary, and React externalization verified.',
);
