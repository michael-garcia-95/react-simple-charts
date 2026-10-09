// Test-only TypeScript loader lets a fresh Node process execute the actual engine.
// Setting TZ before startup avoids assumptions about the Vitest host timezone.
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
const { createXScale } = await import('../../src/core/scales/cartesian.ts');
function scale(mode) {
  const result = createXScale(
    normalizeCartesian({
      data: [
        { x: new Date('2026-03-07T00:00:00Z'), y: 1 },
        { x: new Date('2026-03-10T00:00:00Z'), y: 2 },
      ],
      xKey: 'x',
      yKey: 'y',
      xScale: mode,
    }),
    [0, 100],
    { tickCount: 3 },
  );
  if (result.status !== 'ready') throw new Error(JSON.stringify(result));
  return result.ticks;
}
const utc = scale('utc');
const time = scale('time');
writeFileSync(
  process.argv[2],
  JSON.stringify({
    utc: utc.map((tick) => tick.value.toISOString()),
    time: time.map((tick) => tick.value.toISOString()),
    positions: time.map((tick) => tick.position),
    intervals: time
      .slice(1)
      .map((tick, index) => (tick.value - time[index].value) / 3_600_000),
  }),
);
