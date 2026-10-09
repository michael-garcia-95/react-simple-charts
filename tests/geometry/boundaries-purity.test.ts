// @vitest-environment node
import { describe, expect, it, vi } from 'vitest';
import { normalizeCartesian } from '../../src/core/data/cartesian';
import { buildCartesianGeometry } from '../../src/core/geometry/cartesian';
import { layoutCartesian } from '../../src/core/layout/cartesian';
import { mapCartesianPoint } from '../../src/core/geometry/points';
import { safePath } from '../../src/core/geometry/validation';
import type { CartesianGeometryInput } from '../../src/core/geometry/types';
import { freezeDeep, model } from '../scales/helpers';
import { bars, curves, input, pathCoordinates, usable } from './helpers';

describe('empty, unusable, outside-plot and numerical safety', () => {
  it.each(
    [
      [],
      [{ y: 10 }],
      [{ x: null, y: 10 }],
      [{ x: NaN, y: 10 }],
      [{ x: 'A', y: null }],
      [{ x: 'A', y: '10' }],
      [{ x: 'A', y: Infinity }],
    ].map((data) => ({ data })),
  )('returns empty without fallback marks: %j', ({ data }) => {
    for (const family of ['line', 'area', 'bar'] as const) {
      const setup = {
        ...input(data),
        ...(family === 'bar' ? { family: 'bar' as const } : { family }),
        yAxis: { show: false, min: -10, max: 10 },
      };
      const result = usable(buildCartesianGeometry(setup));
      expect(result.status).toBe('empty');
      expect(result.layout.status).toBe('empty');
      expect(
        result.family === 'bar'
          ? result.bars
          : result.series.flatMap((series) => series.points),
      ).toEqual([]);
      expect(result.zeroBaseline).toBeNull();
      expect(result.requiresClipping).toBe(false);
      expect(result.normalizationDiagnostics).toBe(
        setup.normalized.diagnostics,
      );
    }
  });
  it('rejects invalid normalization without coordinates', () => {
    const normalized = normalizeCartesian<{ x: string; y: number }>({
      data: [],
      xKey: 'x',
      series: [],
    });
    const result = buildCartesianGeometry({ ...input(), normalized });
    expect(result).toMatchObject({
      status: 'unusable',
      diagnostics: [{ code: 'layout-unusable' }],
      layoutDiagnostics: [{ code: 'invalid-normalization' }],
    });
    expect(result.normalizationDiagnostics).toBe(normalized.diagnostics);
    expect(result).not.toHaveProperty('plot');
    expect(result).not.toHaveProperty('series');
  });
  it.each([0, -1, NaN, Infinity])(
    'unusable dimensions %s prevent marks',
    (width) => {
      expect(buildCartesianGeometry({ ...input(), width })).toMatchObject({
        status: 'unusable',
        layoutDiagnostics: [{ code: 'invalid-dimensions' }],
      });
    },
  );
  it('continuous normalization is incompatible with Bar', () => {
    expect(
      buildCartesianGeometry({
        ...input([{ x: 1, y: 10 }], 'linear'),
        family: 'bar',
      }),
    ).toMatchObject({
      status: 'unusable',
      layoutDiagnostics: [{ code: 'incompatible-x-scale' }],
    });
  });
  it('does not clamp or drop Line coordinates excluded by explicit bounds', () => {
    const records = [
      { x: -10, y: -10 },
      { x: 5, y: 5 },
      { x: 20, y: 20 },
    ];
    const result = curves({
      ...input(records, 'linear'),
      xAxis: { show: false, min: 0, max: 10 },
      yAxis: { show: false, min: 0, max: 10 },
    });
    const points = result.series[0]!.points;
    expect(points.map((point) => [point.x, point.y, point.outOfPlot])).toEqual([
      [-92, 208, true],
      [58, 58, false],
      [208, -92, true],
    ]);
    expect(points[0]!.record).toBe(records[0]);
    expect(result.requiresClipping).toBe(true);
    expect(result.series[0]!.runs[0]!.outOfPlot).toBe(true);
    expect(pathCoordinates(result.series[0]!.runs[0]!.path)).toEqual([
      -92, 208, 58, 58, 208, -92,
    ]);
  });
  it('Area fills retain actual outside values', () => {
    const result = curves({
      ...input([
        { x: 'A', y: -20 },
        { x: 'B', y: 20 },
      ]),
      family: 'area',
      yAxis: { show: false, min: -10, max: 10 },
    });
    expect(result.requiresClipping).toBe(true);
    expect(result.series[0]!.points.map((point) => point.y)).toEqual([
      158, -42,
    ]);
    expect(pathCoordinates(result.series[0]!.runs[0]!.path)).toEqual([
      33, 158, 83, -42, 83, 58, 33, 58,
    ]);
  });
  it.each([false, true])(
    'Bar bounds excluding data mark outside rectangles, horizontal=%s',
    (horizontal) => {
      const axis = { show: false, min: -10, max: 10 };
      const result = bars(
        {
          ...input([
            { x: 'A', y: -20 },
            { x: 'B', y: 20 },
          ]),
          ...(horizontal ? { xAxis: axis } : { yAxis: axis }),
        },
        horizontal,
      );
      expect(result.requiresClipping).toBe(true);
      expect(result.bars.map((bar) => bar.outOfPlot)).toEqual([true, true]);
      expect(
        result.bars.map((bar) =>
          horizontal ? [bar.x, bar.width] : [bar.y, bar.height],
        ),
      ).toEqual(
        horizontal
          ? [
              [-42, 100],
              [58, 100],
            ]
          : [
              [58, 100],
              [-42, 100],
            ],
      );
      expect(result.bars.map((bar) => bar.value)).toEqual([-20, 20]);
    },
  );
  it.each(['line', 'area', 'bar'] as const)(
    'unsafe extrapolation is an explicit %s failure',
    (family) => {
      const result = buildCartesianGeometry({
        ...input([
          { x: 'A', y: 0 },
          { x: 'B', y: 1e308 },
        ]),
        ...(family === 'bar' ? { family: 'bar' as const } : { family }),
        yAxis: { show: false, min: 0, max: 1e-308 },
      });
      expect(result).toMatchObject({
        status: 'unusable',
        diagnostics: [{ code: 'unsafe-mapping', rowIndex: 1, seriesIndex: 0 }],
      });
      expect(result).not.toHaveProperty('requiresClipping');
      expect(result).not.toHaveProperty('plot');
    },
  );
  it.each([-1, 0, 1.01, NaN, Infinity, null, '0.8'])(
    'invalid grouping fraction %s fails even on empty input',
    (fraction) => {
      for (const key of ['groupRatio', 'slotRatio']) {
        const result = buildCartesianGeometry({
          ...input([]),
          family: 'bar',
          barSpacing: { [key]: fraction },
        } as CartesianGeometryInput<Record<string, number>>);
        expect(result).toMatchObject({
          status: 'unusable',
          diagnostics: [{ code: 'invalid-spacing' }],
        });
      }
    },
  );
  it('bar spacing on Line is rejected, not silently ignored', () => {
    expect(
      buildCartesianGeometry({ ...input(), barSpacing: { groupRatio: 0.5 } }),
    ).toMatchObject({
      status: 'unusable',
      diagnostics: [{ code: 'invalid-spacing' }],
    });
  });
  it.each([{ groupRatio: Number.MIN_VALUE }, { slotRatio: Number.MIN_VALUE }])(
    'reports numerically collapsed slots %j',
    (barSpacing) => {
      expect(
        buildCartesianGeometry({ ...input(), family: 'bar', barSpacing }),
      ).toMatchObject({
        status: 'unusable',
        diagnostics: [{ code: 'unsafe-slot' }],
      });
    },
  );
  it('unsafe domain is forwarded separately from normalization warnings', () => {
    const setup = input([
      { x: 'A', y: -1e308 },
      { x: 'B', y: 1e308 },
      { x: 'C', y: null },
    ]);
    const result = buildCartesianGeometry(setup);
    expect(result).toMatchObject({
      status: 'unusable',
      layoutDiagnostics: [{ code: 'unsafe-domain' }],
    });
    expect(result.normalizationDiagnostics).toBe(setup.normalized.diagnostics);
    expect(result.normalizationDiagnostics).toHaveLength(1);
  });
  it.each([NaN, Infinity, -Infinity])(
    'point mapping independently rejects nonfinite scale return %s',
    (position) => {
      const setup = input();
      const layout = layoutCartesian(setup);
      if (layout.status !== 'ready') throw new Error('Expected ready');
      const row = model(setup.normalized).rows[0]!;
      const series = model(setup.normalized).series[0]!;
      const result = mapCartesianPoint(row, series, {
        ...layout,
        scales: {
          ...layout.scales,
          value: {
            ...layout.scales.value,
            map: () => ({ status: 'mapped', position }),
          },
        },
      });
      expect(result).toMatchObject({
        status: 'unusable',
        diagnostics: [{ code: 'unsafe-mapping', rowIndex: 0, seriesIndex: 0 }],
      });
    },
  );
  it.each([
    null,
    'MNaN,0L1,1',
    'MInfinity,0',
    'Mundefined,0',
    'M1e309,0L1,1',
    'Mbad,0',
    '',
  ])('rejects malformed path output %s', (path) => {
    expect(safePath(() => path)).toMatchObject({
      status: 'unusable',
      diagnostics: [{ code: 'path-failed' }],
    });
  });
  it('catches path calculation exceptions', () => {
    expect(
      safePath(() => {
        throw new Error('D3');
      }),
    ).toMatchObject({
      status: 'unusable',
      diagnostics: [{ code: 'path-failed' }],
    });
  });
  it('retains full path precision for tiny valid coordinates', () => {
    const result = curves({
      ...input(),
      width: 1e-10,
      height: 1e-10,
      spacing: { padding: 0, minPlotSize: 1e-12 },
    });
    expect(pathCoordinates(result.series[0]!.runs[0]!.path)).toEqual([
      2.5e-11, 1e-10, 7.5e-11, 0,
    ]);
  });
});

describe('pure Node geometry', () => {
  it.each(['line', 'area', 'bar'] as const)(
    'frozen %s inputs preserve source, Date, and metadata identities',
    (family) => {
      const date = new Date('2026-01-01T00:00:00Z');
      const records = freezeDeep([
        { x: date, a: -10, b: 20 },
        { x: date, a: null, b: 10 },
      ]);
      const normalized = freezeDeep(
        normalizeCartesian({
          data: records,
          xKey: 'x',
          series: [{ key: 'b', label: 'Beta', color: 'blue' }, { key: 'a' }],
        }),
      );
      const setup = freezeDeep({
        ...input(),
        normalized,
        ...(family === 'bar' ? { family: 'bar' as const } : { family }),
        ...(family === 'bar' ? { barSpacing: { groupRatio: 0.8 } } : {}),
      });
      const before = JSON.stringify(setup);
      const first = usable(buildCartesianGeometry(setup));
      const second = usable(buildCartesianGeometry(setup));
      expect(JSON.stringify(first)).toBe(JSON.stringify(second));
      expect(JSON.stringify(setup)).toBe(before);
      expect(date.toISOString()).toBe('2026-01-01T00:00:00.000Z');
      const marks =
        first.family === 'bar'
          ? first.bars
          : first.series.flatMap((entry) => entry.points);
      if (normalized.status !== 'normalized')
        throw new Error('Expected normalized');
      const metadata = normalized.data.series;
      marks.forEach((mark) => {
        expect(mark.record).toBe(records[mark.index]);
        expect(mark.category).toBe(date);
        expect(mark.series).toBe(metadata[mark.seriesIndex]);
        expect(mark.value).toBe(mark.record[mark.seriesKey as 'a' | 'b']);
      });
      expect(first.normalizationDiagnostics).toBe(normalized.diagnostics);
    },
  );
  it('executes without browser globals, clock or randomness', () => {
    expect(typeof window).toBe('undefined');
    expect(typeof document).toBe('undefined');
    const now = vi.spyOn(Date, 'now').mockImplementation(() => {
      throw new Error('Clock');
    });
    const random = vi.spyOn(Math, 'random').mockImplementation(() => {
      throw new Error('Random');
    });
    try {
      curves(input());
      curves({ ...input(), family: 'area' });
      bars(input(), true);
    } finally {
      now.mockRestore();
      random.mockRestore();
    }
  });
});
