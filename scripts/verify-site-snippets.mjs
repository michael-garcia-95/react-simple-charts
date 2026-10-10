// Compile generated examples against the genuine built root declarations, without executing JSX.
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import ts from 'typescript';
import { createServer } from 'vite';
const root = resolve(import.meta.dirname, '..');
const dir = resolve(root, 'work/site-snippets');
await mkdir(dir, { recursive: true });
const server = await createServer({
  configFile: resolve(root, 'vite.site.config.ts'),
  server: { middlewareMode: true, hmr: false, ws: false },
  optimizeDeps: { noDiscovery: true, include: [] },
});
const files = [];
try {
  const { exampleCode, defaultSettings } =
    await server.ssrLoadModule('/example-code.ts');
  for (const family of ['line', 'area', 'bar', 'pie', 'donut']) {
    for (const dataset of ['primary', 'alternative']) {
      const states = [
        { ...defaultSettings(), dataset },
        {
          ...defaultSettings(),
          dataset,
          showLegend: false,
          dataTable: 'visually-hidden',
          animate: true,
          tooltip: false,
          showGrid: false,
          multiple: true,
          orientation: 'horizontal',
          showLabels: true,
          innerRadiusRatio: 0.4,
        },
      ];
      if (family === 'donut')
        states.push({
          ...defaultSettings(),
          dataset,
          showLabels: true,
          innerRadiusRatio: 0.8,
        });
      for (const [index, state] of states.entries()) {
        const file = resolve(dir, `${family}-${dataset}-${index}.tsx`);
        await writeFile(file, exampleCode(family, state));
        files.push(file);
      }
    }
  }
} finally {
  await server.close();
}
const program = ts.createProgram(files, {
  strict: true,
  noEmit: true,
  skipLibCheck: true,
  target: ts.ScriptTarget.ES2022,
  module: ts.ModuleKind.NodeNext,
  moduleResolution: ts.ModuleResolutionKind.NodeNext,
  jsx: ts.JsxEmit.ReactJSX,
});
const diagnostics = ts.getPreEmitDiagnostics(program);
if (diagnostics.length)
  console.error(
    ts.formatDiagnosticsWithColorAndContext(diagnostics, {
      getCurrentDirectory: () => root,
      getCanonicalFileName: (path) => path,
      getNewLine: () => '\n',
    }),
  );
assert.equal(
  diagnostics.length,
  0,
  'Generated TSX must compile against public declarations',
);
console.log(
  `${files.length} generated TSX examples compile against the built public root`,
);
