import assert from 'node:assert/strict';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import ts from 'typescript';
import { createElement } from 'react';
import { renderToString } from 'react-dom/server';
import { verifyInstalledInventory } from './archive.mjs';

export async function verifyExactPackage({ artifact, work, root }) {
  await artifact.verify();
  const directory = join(work, 'inspected');
  // Paths come only from the six-file allowlist, never directly from archive headers.
  for (const [path, bytes] of artifact.files) {
    const target = join(directory, path);
    await mkdir(join(target, '..'), { recursive: true });
    await writeFile(target, bytes, { flag: 'wx' });
  }
  await verifyInstalledInventory(directory, artifact.files);
  const api = await import(pathToFileURL(join(directory, 'dist/index.js')));
  assert.deepEqual(Object.keys(api).sort(), [
    'AreaChart',
    'BarChart',
    'DonutChart',
    'LineChart',
    'PieChart',
  ]);
  for (const [name, chart] of Object.entries(api))
    assert.equal(typeof chart, 'function', `${name} runtime export`);
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
  const contract = join(work, 'contracts.tsx');
  await writeFile(
    contract,
    await readFile(join(root, 'tests/types/contracts.tsx')),
  );
  const entry = join(directory, 'dist/index.d.ts');
  const program = ts.createProgram([entry, contract], {
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
    paths: { [artifact.manifest.name]: [entry] },
  });
  const checker = program.getTypeChecker();
  const symbol = checker.getSymbolAtLocation(program.getSourceFile(entry));
  const names = checker
    .getExportsOfModule(symbol)
    .map((item) => item.name)
    .sort();
  const barrel = ts.createSourceFile(
    'src/index.ts',
    await readFile(join(root, 'src/index.ts'), 'utf8'),
    ts.ScriptTarget.Latest,
  );
  const expected = barrel.statements
    .flatMap((statement) =>
      ts.isExportDeclaration(statement) &&
      statement.exportClause &&
      ts.isNamedExports(statement.exportClause)
        ? statement.exportClause.elements.map((item) => item.name.text)
        : [],
    )
    .sort();
  assert.deepEqual(names, expected, 'Exact archive declaration exports');
  const diagnostics = ts.getPreEmitDiagnostics(program);
  assert.equal(
    diagnostics.length,
    0,
    diagnostics
      .map((item) => ts.flattenDiagnosticMessageText(item.messageText, '\n'))
      .join('\n'),
  );
  await artifact.verify();
  return {
    status: 'passed',
    sha256: artifact.identity.sha256,
    inventory: 'passed',
    manifest: 'passed',
    runtimeExports: Object.keys(api).sort(),
    declarations:
      'strict archived declarations and source public contracts passed',
    ssr: 'passed',
  };
}
