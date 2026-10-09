// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { curves, input, pathCoordinates } from './helpers';

describe('ordered line points and paths', () => {
  it('maps duplicate categories by source index with exact identities', () => {
    const records = [
      { x: 'Same', y: 0 },
      { x: 'Same', y: 5 },
      { x: 'Other', y: 10 },
    ];
    const result = curves(input(records));
    expect(result.status).toBe('ready');
    expect(result.plot).toEqual({
      left: 8,
      top: 8,
      right: 108,
      bottom: 108,
      width: 100,
      height: 100,
    });
    const series = result.series[0]!;
    expect(series.points.map((point) => point.index)).toEqual([0, 1, 2]);
    series.points.forEach((point, index) => {
      expect(point.record).toBe(records[index]);
      expect(point.category).toBe(records[index]!.x);
      expect(point.value).toBe(records[index]!.y);
      expect(point.x).toBeCloseTo(8 + ((index + 0.5) * 100) / 3);
      expect(point.y).toBeCloseTo(108 - index * 50);
      expect(point.seriesKey).toBe('y');
      expect(point.seriesIndex).toBe(0);
      expect(point.series).toBe(series.series);
    });
    expect(series.runs).toHaveLength(1);
    const coordinates = pathCoordinates(series.runs[0]!.path);
    coordinates.forEach((coordinate, index) =>
      expect(coordinate).toBeCloseTo(
        index % 2
          ? series.points[Math.floor(index / 2)]!.y
          : series.points[Math.floor(index / 2)]!.x,
      ),
    );
  });
  it.each([null, undefined, NaN, Infinity, -Infinity, '10'])(
    'breaks at missing/invalid Y %s',
    (y) => {
      const result = curves(
        input([
          { x: 'A', y: 0 },
          { x: 'B', y },
          { x: 'C', y: 10 },
        ]),
      );
      expect(result.series[0]!.points.map((point) => point.index)).toEqual([
        0, 2,
      ]);
      expect(
        result.series[0]!.runs.map((run) => [
          run.startIndex,
          run.endIndex,
          run.path,
        ]),
      ).toEqual([
        [0, 0, null],
        [2, 2, null],
      ]);
      expect(result.series[0]!.gaps).toEqual([
        { rowIndex: 1, reason: 'value' },
      ]);
      expect(result.normalizationDiagnostics).toHaveLength(1);
    },
  );
  it.each([null, undefined, NaN, Infinity, {}, true])(
    'invalid X %s breaks runs despite closed category spacing',
    (x) => {
      const result = curves(
        input([
          { x: 'A', y: 0 },
          { x, y: 5 },
          { x: 'C', y: 10 },
        ]),
      );
      expect(
        result.series[0]!.points.map((point) => [point.index, point.x]),
      ).toEqual([
        [0, 33],
        [2, 83],
      ]);
      expect(result.series[0]!.runs).toHaveLength(2);
      expect(result.series[0]!.gaps).toEqual([{ rowIndex: 1, reason: 'x' }]);
    },
  );
  it('keeps independent configured series and an entirely missing series', () => {
    const result = curves(
      input(
        [
          { x: 'A', a: 0, b: 5 },
          { x: 'B', a: null, b: 10 },
          { x: 'C', a: 10, b: null },
        ],
        'category',
        [
          { key: 'b', label: 'Beta', color: 'red' },
          { key: 'a' },
          { key: 'missing' },
        ],
      ),
    );
    expect(result.series.map((entry) => entry.series.key)).toEqual([
      'b',
      'a',
      'missing',
    ]);
    expect(result.series[0]!.series).toMatchObject({
      index: 0,
      key: 'b',
      label: 'Beta',
      color: 'red',
    });
    expect(
      result.series.map((entry) => entry.points.map((point) => point.index)),
    ).toEqual([[0, 1], [0, 2], []]);
    expect(result.series.map((entry) => entry.runs.length)).toEqual([1, 2, 0]);
    expect(result.series[2]!.gaps).toHaveLength(3);
    expect(result.series[0]!.runs[0]!.path).not.toBeNull();
  });
  it('retains singleton points without line segments', () => {
    const result = curves(input([{ x: 'A', y: 100 }]));
    expect(result.status).toBe('ready');
    expect(result.series[0]!.points[0]).toMatchObject({
      x: 58,
      y: 58,
      value: 100,
    });
    expect(result.series[0]!.runs[0]!.path).toBeNull();
  });
  it('keeps repeated and unsorted linear X in source order', () => {
    const result = curves(
      input(
        [
          { x: 10, y: 0 },
          { x: -5, y: 5 },
          { x: 2.5, y: 10 },
          { x: 10, y: 5 },
        ],
        'linear',
      ),
    );
    expect(result.series[0]!.points.map((point) => point.x)).toEqual([
      108, 8, 58, 108,
    ]);
    expect(result.series[0]!.points.map((point) => point.index)).toEqual([
      0, 1, 2, 3,
    ]);
    expect(pathCoordinates(result.series[0]!.runs[0]!.path)).toEqual([
      108, 108, 8, 58, 58, 8, 108, 58,
    ]);
  });
  it.each(['utc', 'time'])(
    'maps repeated/unsorted %s Dates without changing references',
    (mode) => {
      const early = new Date('2026-01-01T00:00:00Z');
      const late = new Date('2026-01-03T00:00:00Z');
      const equal = new Date(late.getTime());
      const result = curves(
        input(
          [
            { x: late, y: 10 },
            { x: early, y: 0 },
            { x: equal, y: 5 },
          ],
          mode,
        ),
      );
      const points = result.series[0]!.points;
      expect(points.map((point) => point.x)).toEqual([108, 8, 108]);
      expect(points[0]!.category).toBe(late);
      expect(points[1]!.category).toBe(early);
      expect(points[2]!.category).toBe(equal);
      expect(late.toISOString()).toBe('2026-01-03T00:00:00.000Z');
      expect(pathCoordinates(result.series[0]!.runs[0]!.path)).toEqual([
        108, 8, 8, 108, 108, 58,
      ]);
    },
  );
  it('invalid continuous X breaks a path', () => {
    const result = curves(
      input(
        [
          { x: 0, y: 0 },
          { x: '5', y: 5 },
          { x: 10, y: 10 },
        ],
        'linear',
      ),
    );
    expect(result.series[0]!.runs.map((run) => run.path)).toEqual([null, null]);
  });
});

it('partitions multi-point paths on both sides of a missing middle row', () => {
  const result = curves(
    input([
      { x: 'A', y: 0 },
      { x: 'B', y: 5 },
      { x: 'gap', y: null },
      { x: 'C', y: 5 },
      { x: 'D', y: 10 },
    ]),
  );
  const runs = result.series[0]!.runs;
  expect(runs.map((run) => [run.startIndex, run.endIndex])).toEqual([
    [0, 1],
    [3, 4],
  ]);
  expect(pathCoordinates(runs[0]!.path)).toEqual([18, 108, 38, 58]);
  expect(pathCoordinates(runs[1]!.path)).toEqual([78, 58, 98, 8]);
});
