// @vitest-environment node
import { expect, it, vi } from 'vitest';
import { buildCartesianGeometry } from '../../src/core/geometry/cartesian';
import { input } from './helpers';

const control = vi.hoisted(() => ({ throws: false }));
vi.mock('d3-shape', () => {
  const generator = () => {
    if (control.throws) throw new Error('Path failure');
    return 'MNaN,0L1,1';
  };
  const factory = () =>
    Object.assign(generator, {
      x: () => factory(),
      y: () => factory(),
      y0: () => factory(),
      y1: () => factory(),
      digits: () => factory(),
    });
  return { line: factory, area: factory };
});

it.each(['line', 'area'] as const)(
  'reports %s malformed paths and exceptions without exposing partial marks',
  (family) => {
    for (const throws of [false, true]) {
      control.throws = throws;
      const result = buildCartesianGeometry({ ...input(), family });
      expect(result).toMatchObject({
        status: 'unusable',
        diagnostics: [{ code: 'path-failed', rowIndex: 0, seriesIndex: 0 }],
      });
      expect(result).not.toHaveProperty('series');
      expect(result).not.toHaveProperty('plot');
    }
  },
);
