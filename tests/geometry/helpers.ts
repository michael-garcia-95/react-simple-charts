import { expect } from 'vitest';
import { buildCartesianGeometry } from '../../src/core/geometry/cartesian';
import type {
  BarSpacing,
  CartesianGeometryResult,
} from '../../src/core/geometry/types';
import type { LayoutSpacing } from '../../src/core/layout/types';
import { normalized } from '../scales/helpers';

export function input(
  data: readonly unknown[] = [
    { x: 'A', y: 0 },
    { x: 'B', y: 10 },
  ],
  mode = 'category',
  series?: readonly { key: string; label?: string; color?: string }[],
) {
  return {
    normalized: normalized(data, mode, series),
    family: 'line' as const,
    width: 116,
    height: 116,
    xAxis: { show: false },
    yAxis: { show: false },
  };
}
type TestInput = Omit<
  ReturnType<typeof input>,
  'family' | 'xAxis' | 'yAxis'
> & {
  family: 'line' | 'area' | 'bar';
  xAxis?: { show?: boolean; min?: number; max?: number };
  yAxis?: { show?: boolean; min?: number; max?: number };
  spacing?: LayoutSpacing;
  barSpacing?: BarSpacing;
};
export function usable<T>(result: CartesianGeometryResult<T>) {
  expect(result.status, JSON.stringify(result)).not.toBe('unusable');
  if (result.status === 'unusable') throw new Error(JSON.stringify(result));
  return result;
}
export function curves(setup: TestInput) {
  if (setup.family === 'bar') throw new Error('Expected curve input');
  const result = usable(
    buildCartesianGeometry({ ...setup, family: setup.family }),
  );
  if (result.family === 'bar') throw new Error('Expected curves');
  return result;
}
export function bars(setup: TestInput, horizontal = false) {
  const result = usable(
    buildCartesianGeometry({
      ...setup,
      family: 'bar',
      ...(horizontal ? { orientation: 'horizontal' as const } : {}),
    }),
  );
  if (result.family !== 'bar') throw new Error('Expected bars');
  return result;
}
export function pathCoordinates(path: string | null) {
  if (!path) throw new Error('Expected path');
  expect(path).not.toMatch(/NaN|Infinity|undefined/);
  return (path.match(/[-+]?(?:\d*\.\d+|\d+\.?\d*)(?:e[-+]?\d+)?/gi) ?? []).map(
    Number,
  );
}
