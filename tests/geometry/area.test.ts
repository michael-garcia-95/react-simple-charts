// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { linePath } from '../../src/core/geometry/line';
import { curves, input, pathCoordinates } from './helpers';

describe('area zero-baseline fills', () => {
  it.each([
    { values: [5, 10], baseline: 108, ys: [58, 8] },
    { values: [-10, -5], baseline: 8, ys: [108, 58] },
    { values: [-10, 10], baseline: 58, ys: [108, 8] },
    { values: [0, 0], baseline: 58, ys: [58, 58] },
  ])('closes $values to baseline $baseline', ({ values, baseline, ys }) => {
    const result = curves({
      ...input(values.map((y, index) => ({ x: String(index), y }))),
      family: 'area',
    });
    expect(result.zeroBaseline).toEqual({ axis: 'y', position: baseline });
    const series = result.series[0]!;
    expect(series.points.map((point) => point.y)).toEqual(ys);
    expect(series.points.map((point) => point.value)).toEqual(values);
    const path = series.runs[0]!.path;
    expect(path).toMatch(/Z$/);
    const outline = linePath(series.runs[0]!.points);
    expect(outline.status).toBe('ready');
    if (outline.status === 'ready')
      expect(series.runs[0]!.outlinePath).toBe(outline.data);
    expect(series.runs[0]!.outlinePath).not.toContain('Z');
    expect(pathCoordinates(path)).toEqual([
      33,
      ys[0],
      83,
      ys[1],
      83,
      baseline,
      33,
      baseline,
    ]);
  });
  it('keeps gaps and singletons without inventing filled regions', () => {
    const result = curves({
      ...input([
        { x: 'A', y: 10 },
        { x: 'B', y: null },
        { x: 'C', y: -10 },
        { x: 'D', y: 5 },
        { x: null, y: 10 },
        { x: 'F', y: 0 },
      ]),
      family: 'area',
    });
    const series = result.series[0]!;
    expect(
      series.runs.map((run) => run.points.map((point) => point.index)),
    ).toEqual([[0], [2, 3], [5]]);
    expect(series.runs.map((run) => run.path === null)).toEqual([
      true,
      false,
      true,
    ]);
    expect(series.runs.map((run) => run.outlinePath === null)).toEqual([
      true,
      false,
      true,
    ]);
    expect(series.gaps).toEqual([
      { rowIndex: 1, reason: 'value' },
      { rowIndex: 4, reason: 'x' },
    ]);
    expect(result.zeroBaseline!.position).toBe(58);
  });
  it('constructs independent fills without stacked totals', () => {
    const result = curves({
      ...input(
        [
          { x: 'A', a: 10, b: 20 },
          { x: 'B', a: null, b: 30 },
          { x: 'C', a: 20, b: null },
        ],
        'category',
        [{ key: 'a' }, { key: 'b' }],
      ),
      family: 'area',
    });
    expect(result.layout.scales.value).toMatchObject({
      domain: { domain: [0, 30] },
    });
    expect(result.series[0]!.runs.map((run) => run.path)).toEqual([null, null]);
    expect(result.series[1]!.runs[0]!.path).not.toBeNull();
    expect(result.series[0]!.points[0]!.y).toBeCloseTo(108 - 100 / 3);
    expect(result.series[1]!.points[0]!.y).toBeCloseTo(108 - 200 / 3);
    expect(result.series[0]!.points[1]!.value).toBe(20);
  });
  it('one valid point is ready for a future marker, with no fill path', () => {
    const result = curves({ ...input([{ x: 'A', y: -10 }]), family: 'area' });
    expect(result.status).toBe('ready');
    expect(result.series[0]!.points[0]).toMatchObject({
      x: 58,
      y: 108,
      value: -10,
    });
    expect(result.series[0]!.runs[0]!.path).toBeNull();
    expect(result.zeroBaseline).toEqual({ axis: 'y', position: 8 });
  });
});
