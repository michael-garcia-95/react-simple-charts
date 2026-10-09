import { expect } from 'vitest';
import { layoutCartesian } from '../../src/core/layout/cartesian';
import type { CartesianLayoutResult } from '../../src/core/layout/types';
import { normalized } from '../scales/helpers';

export function input(
  data: readonly unknown[] = [
    { x: 'A', y: 0 },
    { x: 'B', y: 10 },
  ],
  mode = 'category',
) {
  return {
    normalized: normalized(data, mode),
    family: 'line' as const,
    width: 400,
    height: 280,
  };
}
export function ready(result: CartesianLayoutResult) {
  expect(result.status, JSON.stringify(result)).toBe('ready');
  if (result.status !== 'ready') throw new Error('Expected ready layout');
  return result;
}
export function usable(result: CartesianLayoutResult) {
  expect(result.status).not.toBe('unusable');
  if (result.status === 'unusable') throw new Error(JSON.stringify(result));
  return result;
}
export function basic() {
  return ready(layoutCartesian(input()));
}
export function failure(
  result: CartesianLayoutResult,
  code: string,
  axis?: 'x' | 'y',
) {
  expect(result).toMatchObject({
    status: 'unusable',
    diagnostics: expect.arrayContaining([
      expect.objectContaining({ code, ...(axis ? { axis } : {}) }),
    ]),
  });
  expect(result).not.toHaveProperty('plot');
  expect(result).not.toHaveProperty('scales');
}
export function snapshot(result: CartesianLayoutResult) {
  // Closures are compared through their actual coordinates in individual tests.
  return JSON.parse(JSON.stringify(result));
}
