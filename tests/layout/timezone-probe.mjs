// A fresh Node process sets timezone before executing the real TypeScript engine.
import { readFileSync, writeFileSync } from 'node:fs';
import { registerHooks } from 'node:module';
import { transpileModule, ModuleKind } from 'typescript';

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier.startsWith('.') && !/\.[a-z]+$/i.test(specifier))
      return nextResolve(`${specifier}.ts`, context);
    return nextResolve(specifier, context);
  },
  load(url, context, nextLoad) {
    if (!url.endsWith('.ts')) return nextLoad(url, context);
    return {
      format: 'module',
      shortCircuit: true,
      source: transpileModule(readFileSync(new URL(url), 'utf8'), {
        compilerOptions: {
          module: ModuleKind.ESNext,
          verbatimModuleSyntax: true,
        },
      }).outputText,
    };
  },
});
const { normalizeCartesian } = await import('../../src/core/data/cartesian.ts');
const { layoutCartesian } = await import('../../src/core/layout/cartesian.ts');
function layout(mode) {
  const normalized = normalizeCartesian({
    data: [
      { x: new Date('2026-03-07T00:00:00Z'), y: 1 },
      { x: new Date('2026-03-10T00:00:00Z'), y: 2 },
    ],
    xKey: 'x',
    yKey: 'y',
    xScale: mode,
  });
  const result = layoutCartesian({
    normalized,
    family: 'line',
    width: 1600,
    height: 280,
    xAxis: { tickCount: 3 },
  });
  if (result.status !== 'ready') throw new Error(JSON.stringify(result));
  const ticks = result.axes.x.candidates;
  return {
    plot: result.plot,
    labels: ticks.map((tick) => tick.label),
    positions: ticks.map((tick) => tick.position),
    selected: ticks.map((tick) => tick.selected),
    intervals: ticks
      .slice(1)
      .map((tick, index) => (tick.value - ticks[index].value) / 3600000),
  };
}
writeFileSync(
  process.argv[2],
  JSON.stringify({ utc: layout('utc'), time: layout('time') }),
);
