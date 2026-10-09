// @vitest-environment node
import { describe, expect, it, vi } from 'vitest';
import { normalizeCartesian } from '../../src/core/data/cartesian';
import { layoutCartesian } from '../../src/core/layout/cartesian';
import type { CartesianLayoutInput } from '../../src/core/layout/types';
import {
  createValueScale,
  createXScale,
} from '../../src/core/scales/cartesian';
import { freezeDeep, model, normalized } from '../scales/helpers';
import { failure, input, ready, snapshot, usable } from './helpers';

describe('empty/unusable results and partial data', () => {
  it.each(
    [
      [],
      [{ y: 10 }],
      [{ x: null, y: 10 }],
      [{ x: NaN, y: 10 }],
      [{ x: {}, y: 10 }],
    ].map((data) => ({ data })),
  )('returns empty for missing/invalid categories: %j', ({ data }) => {
    const result = usable(layoutCartesian({ ...input(data), family: 'bar' }));
    expect(result.status).toBe('empty');
    expect(result.plot.width).toBe(384);
    expect(result.plot.height).toBe(264);
    expect(result.scales.semanticX).toMatchObject({
      status: 'empty',
      ticks: [],
    });
    expect(result.scales.value).toMatchObject({
      status: 'empty',
      ticks: [],
      domain: { observed: null, origin: 'fallback' },
    });
    expect(result.scales.value).not.toHaveProperty('map');
    expect(result.scales.semanticX).not.toHaveProperty('position');
    expect(result.gridlines).toEqual([]);
    expect(result.zeroBaseline).toBeNull();
  });
  it.each(
    [
      [{ x: 'A' }],
      [{ x: 'A', y: null }],
      [{ x: 'A', y: NaN }],
      [{ x: 'A', y: '10' }],
    ].map((data) => ({ data })),
  )(
    'preserves category-only metadata without pretending marks exist: %j',
    ({ data }) => {
      const result = usable(
        layoutCartesian({ ...input(data), family: 'area' }),
      );
      expect(result.status).toBe('empty');
      expect(result.scales.semanticX.status).toBe('ready');
      expect(result.axes.x?.candidates).toHaveLength(1);
      expect(result.axes.y?.candidates).toEqual([]);
      expect(result.scales.value).not.toHaveProperty('map');
      expect(result.zeroBaseline).toBeNull();
      expect(result.gridlines).toEqual([]);
    },
  );
  it('does not promote overrides on empty scales to fabricated data', () => {
    const result = usable(
      layoutCartesian({
        ...input([{ x: 'A', y: null }]),
        yAxis: { min: -10, max: 10 },
      }),
    );
    expect(result.status).toBe('empty');
    expect(result.scales.value).toMatchObject({
      status: 'empty',
      domain: { observed: null, domain: [-10, 10], origin: 'override' },
    });
    expect(result.scales.value).not.toHaveProperty('map');
    expect(result.axes.y?.visibleTicks).toEqual([]);
  });
  it('supports one category and one real value', () => {
    const result = ready(
      layoutCartesian({ ...input([{ x: 'One', y: 10 }]), family: 'bar' }),
    );
    const x = result.scales.semanticX;
    if (x.kind !== 'category') throw new Error('Expected category');
    expect(x.bandwidth).toBe(result.plot.width);
    expect(x.position(0)).toEqual({
      status: 'mapped',
      position: result.plot.left + result.plot.width / 2,
    });
    expect(result.axes.x?.visibleTicks[0]?.label).toBe('One');
    expect(result.scales.value.domain.domain).toEqual([0, 10]);
  });
  it('includes independent valid series values without converting missing values', () => {
    const setup = normalized(
      [
        { x: 'A', a: null, b: 20 },
        { x: 'B', a: -10, b: NaN },
        { x: null, a: 1000, b: 2000 },
      ],
      'category',
      [{ key: 'a' }, { key: 'b' }],
    );
    const before = snapshot(
      layoutCartesian({ ...input(), normalized: setup, family: 'bar' }),
    );
    const result = ready(
      layoutCartesian({ ...input(), normalized: setup, family: 'bar' }),
    );
    expect(result.scales.value.domain.observed).toEqual([-10, 20]);
    expect(result.scales.value.domain.domain).toEqual([-10, 20]);
    expect(model(setup).rows[0]?.values[0]?.status).toBe('missing');
    expect(model(setup).rows[1]?.values[1]?.status).toBe('invalid');
    expect(snapshot(result)).toEqual(before);
  });
  it('retains normalization errors and rejects configuration failures', () => {
    const result = normalizeCartesian<{ x: string; y: number }>({
      data: [],
      xKey: 'x',
      series: [],
    });
    expect(result.status).toBe('invalid-configuration');
    const before = JSON.stringify(result);
    failure(
      layoutCartesian({ ...input(), normalized: result }),
      'invalid-normalization',
    );
    expect(JSON.stringify(result)).toBe(before);
  });
  it.each([0, -1, 0.5, 101, NaN, Infinity])(
    'rejects tickCount %s even on hidden or empty axes',
    (tickCount) => {
      failure(
        layoutCartesian({ ...input(), xAxis: { tickCount } }),
        'invalid-tick-count',
        'x',
      );
      failure(
        layoutCartesian({ ...input([]), yAxis: { tickCount, show: false } }),
        'invalid-tick-count',
        'y',
      );
    },
  );
  it.each([
    { min: NaN },
    { max: Infinity },
    { min: 10, max: 10 },
    { min: 20, max: 10 },
    { min: 20 },
  ])('rejects invalid numeric bounds %j', (yAxis) => {
    failure(layoutCartesian({ ...input(), yAxis }), 'invalid-bounds', 'y');
  });
  it.each([{ min: 1 }, { max: -1 }])(
    'rejects conflicting zero-baseline bounds %j',
    (axis) => {
      failure(
        layoutCartesian({ ...input(), family: 'bar', yAxis: axis }),
        'zero-baseline-conflict',
        'y',
      );
      failure(
        layoutCartesian({ ...input(), family: 'area', yAxis: axis }),
        'zero-baseline-conflict',
        'y',
      );
      failure(
        layoutCartesian({
          normalized: input().normalized,
          family: 'bar',
          orientation: 'horizontal',
          width: 400,
          height: 280,
          xAxis: axis,
        }),
        'zero-baseline-conflict',
        'x',
      );
    },
  );
  it('rejects unsafe value and X domains without calling formatters', () => {
    const formatTick = vi.fn(() => 'no');
    failure(
      layoutCartesian({
        ...input([
          { x: 'A', y: -1e308 },
          { x: 'B', y: 1e308 },
        ]),
        yAxis: { formatTick },
      }),
      'unsafe-domain',
      'y',
    );
    failure(
      layoutCartesian({
        ...input(
          [
            { x: -1e308, y: 1 },
            { x: 1e308, y: 2 },
          ],
          'linear',
        ),
      }),
      'unsafe-domain',
      'x',
    );
    expect(formatTick).not.toHaveBeenCalled();
  });
});

describe('pure framework-independent calculations', () => {
  it('accepts deeply frozen records, Dates, series, normalized model, and settings', () => {
    const date = new Date('2026-01-01T00:00:00Z');
    const records = freezeDeep([
      { x: date, a: 0, b: 10 },
      { x: date, a: null, b: -5 },
    ]);
    const series = freezeDeep([{ key: 'a' as const }, { key: 'b' as const }]);
    const normalizedResult = freezeDeep(
      normalizeCartesian({ data: records, xKey: 'x', series }),
    );
    const setup = freezeDeep({
      normalized: normalizedResult,
      width: 600,
      height: 280,
      family: 'bar' as const,
      xAxis: { label: 'Date' },
      yAxis: { tickCount: 5 },
      spacing: { minimumMargins: { top: 20 } },
    });
    const before = JSON.stringify(setup);
    const first = ready(layoutCartesian(setup));
    const second = ready(layoutCartesian(setup));
    expect(snapshot(second)).toEqual(snapshot(first));
    expect(JSON.stringify(setup)).toBe(before);
    expect(date.toISOString()).toBe('2026-01-01T00:00:00.000Z');
    const x = first.scales.semanticX;
    if (x.kind !== 'category') throw new Error('Expected category');
    expect(x.ticks.map((tick) => tick.index)).toEqual([0, 1]);
    expect(x.ticks[0]?.value).toBe(date);
    if (normalizedResult.status !== 'normalized')
      throw new Error('Expected model');
    expect(normalizedResult.data.rows[0]?.record).toBe(records[0]);
    expect(normalizedResult.data.rows[1]?.record).toBe(records[1]);
    expect(first.scales.value.map(-5)).toEqual(second.scales.value.map(-5));
  });
  it('does not alter preexisting scales or their metadata', () => {
    const normalizedResult = input().normalized;
    const x = freezeDeep(createXScale(normalizedResult, [0, 100]));
    const y = freezeDeep(createValueScale(normalizedResult, 'line', [100, 0]));
    const beforeX = JSON.stringify(x);
    const beforeY = JSON.stringify(y);
    ready(layoutCartesian({ ...input(), normalized: normalizedResult }));
    expect(JSON.stringify(x)).toBe(beforeX);
    expect(JSON.stringify(y)).toBe(beforeY);
    if (y.status !== 'ready') throw new Error('Expected scale');
    expect(y.map(10)).toEqual({ status: 'mapped', position: 0 });
  });
  it('runs without DOM globals, current time or randomness', () => {
    expect(typeof window).toBe('undefined');
    expect(typeof document).toBe('undefined');
    const now = vi.spyOn(Date, 'now').mockImplementation(() => {
      throw new Error('Clock');
    });
    const random = vi.spyOn(Math, 'random').mockImplementation(() => {
      throw new Error('Random');
    });
    try {
      ready(layoutCartesian(input()));
    } finally {
      now.mockRestore();
      random.mockRestore();
    }
  });
  it('reports invalid runtime axis configuration with no coordinates', () => {
    failure(
      layoutCartesian({
        ...input(),
        yAxis: { label: {} },
      } as unknown as CartesianLayoutInput<Record<string, number>>),
      'invalid-configuration',
    );
  });
});
