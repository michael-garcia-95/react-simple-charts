// @vitest-environment node
import { readFileSync } from 'node:fs';
import { AreaChart, BarChart, LineChart } from '../src';
import * as api from '../src';
import { describe, expect, it } from 'vitest';

const pkg = JSON.parse(
  readFileSync(new URL('../package.json', import.meta.url), 'utf8'),
);

describe('package safety contract', () => {
  it('exports exactly the three approved runtime charts in deterministic order', () => {
    expect(Object.keys(api).sort()).toEqual([
      'AreaChart',
      'BarChart',
      'LineChart',
    ]);
    expect(typeof BarChart).toBe('function');
    expect(typeof AreaChart).toBe('function');
    expect(typeof LineChart).toBe('function');
  });
  it('remains private and exposes only an ESM root entry with declarations', () => {
    expect(pkg.private).toBe(true);
    expect(pkg.type).toBe('module');
    expect(pkg.exports).toEqual({
      '.': { types: './dist/index.d.ts', import: './dist/index.js' },
    });
    expect(pkg.main).toBeUndefined();
  });
  it('requires consumer-owned React 18.2 or React 19 runtimes', () => {
    expect(pkg.peerDependencies).toEqual({
      react: '^18.2.0 || ^19.0.0',
      'react-dom': '^18.2.0 || ^19.0.0',
    });
    expect(pkg.dependencies.react).toBeUndefined();
    expect(pkg.dependencies['react-dom']).toBeUndefined();
  });
});
