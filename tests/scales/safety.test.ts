// @vitest-environment node
import { describe, expect, it, vi } from 'vitest';
import { normalizeCartesian } from '../../src/core/data/cartesian';
import {
  createValueScale,
  createXScale,
} from '../../src/core/scales/cartesian';
import { createCategoryScale } from '../../src/core/scales/category';
import { numericDomain } from '../../src/core/scales/domains';
import { createTemporalScale } from '../../src/core/scales/temporal';
import { freezeDeep, linear, model, normalized, ready } from './helpers';

describe('bounds and numerical safety', () => {
  it.each([
    [{ min: -10 }, [-10, 20]],
    [{ max: 30 }, [10, 30]],
    [{ min: 0, max: 40 }, [0, 40]],
  ])('applies explicit numeric bounds %j', (axis, expected) => {
    const scale = ready(linear([{ x: 10 }, { x: 20 }], [0, 100], axis));
    expect(scale.domain).toMatchObject({
      domain: expected,
      observed: [10, 20],
      origin: 'override',
      expanded: false,
    });
    expect(scale.domain.overridden).toEqual({
      min: 'min' in axis,
      max: 'max' in axis,
    });
    expect(scale.map(expected[0]!)).toEqual({ status: 'mapped', position: 0 });
    expect(scale.map(expected[1]!)).toEqual({
      status: 'mapped',
      position: 100,
    });
  });
  it.each([
    { min: NaN },
    { max: Infinity },
    { min: -Infinity },
    { min: 5, max: 4 },
    { min: 4, max: 4 },
    { min: 21 },
    { max: 9 },
    { min: '0' },
    { max: null },
  ])('rejects invalid/reversed/conflicting bounds %j', (axis) => {
    expect(
      linear(
        [{ x: 10 }, { x: 20 }],
        [0, 100],
        axis as { min?: number; max?: number },
      ),
    ).toMatchObject({
      status: 'unusable',
      diagnostics: [{ code: 'invalid-bounds' }],
    });
  });
  it('expands only the automatic side when a single override collapses the domain', () => {
    expect(numericDomain([10, 20], { min: 20 })).toMatchObject({
      domain: [20, 20.2],
      observed: [10, 20],
      origin: 'override',
      expanded: true,
    });
    expect(numericDomain([10, 20], { max: 10 })).toMatchObject({
      domain: [9.9, 10],
      expanded: true,
    });
  });
  it.each(['bar', 'area'] as const)(
    '%s rejects overrides excluding zero',
    (family) => {
      const result = normalized([
        { x: 'a', y: 10 },
        { x: 'b', y: 20 },
      ]);
      for (const axis of [{ min: 1 }, { min: 10, max: 30 }, { max: -1 }])
        expect(createValueScale(result, family, [0, 100], axis)).toMatchObject({
          status: 'unusable',
          diagnostics: [{ code: 'zero-baseline-conflict' }],
        });
      const scale = ready(
        createValueScale(result, family, [0, 100], { min: -10, max: 30 }),
      );
      expect(scale.domain).toMatchObject({
        domain: [-10, 30],
        origin: 'override',
        zeroBaseline: true,
      });
      expect(scale.map(0)).toEqual({ status: 'mapped', position: 25 });
    },
  );
  it('allows an explicit Line domain excluding zero and does not invoke formatTick', () => {
    const formatTick = vi.fn(() => 'label');
    const scale = ready(
      createValueScale(normalized([{ x: 'a', y: 5 }]), 'line', [0, 100], {
        min: 1,
        max: 10,
        tickCount: 3,
        formatTick,
      }),
    );
    expect(scale.domain.domain).toEqual([1, 10]);
    expect(scale.ticks.map((tick) => tick.value)).toEqual([2, 4, 6, 8, 10]);
    expect(formatTick).not.toHaveBeenCalled();
  });
  it('retains explicit bounds for empty data without fabricating points', () => {
    const empty = linear([], [0, 100], { min: -5, max: 5 });
    expect(empty).toMatchObject({
      status: 'empty',
      domain: { observed: null, origin: 'override', domain: [-5, 5] },
      ticks: [],
    });
    expect(empty).not.toHaveProperty('map');
  });
  it.each([
    Number.MAX_VALUE,
    -Number.MAX_VALUE,
    1e308,
    -1e308,
    1e-300,
    -1e-300,
    Number.MIN_VALUE,
    -Number.MIN_VALUE,
  ])('maps a degenerate finite magnitude %s', (value) => {
    const scale = ready(linear([{ x: value }]));
    expect(scale.domain.observed).toEqual([value, value]);
    expect(scale.domain.expanded).toBe(true);
    const position = scale.map(value);
    expect(position.status).toBe('mapped');
    if (position.status === 'mapped')
      expect(Number.isFinite(position.position)).toBe(true);
    expect(scale.ticks.length).toBeGreaterThan(0);
    scale.ticks.forEach((tick) => {
      expect(Number.isFinite(tick.value)).toBe(true);
      expect(Number.isFinite(tick.position)).toBe(true);
    });
  });
  it('uses endpoint ticks for a subnormal span and maps its endpoints', () => {
    const scale = ready(
      linear([{ x: Number.MIN_VALUE }, { x: Number.MIN_VALUE * 2 }]),
    );
    expect(scale.domain.domain).toEqual([
      Number.MIN_VALUE,
      Number.MIN_VALUE * 2,
    ]);
    expect(scale.ticks).toEqual([
      { value: Number.MIN_VALUE, position: 0 },
      { value: Number.MIN_VALUE * 2, position: 100 },
    ]);
  });
  it('rejects an overflowing continuous domain rather than returning misleading coordinates', () => {
    expect(linear([{ x: -1e308 }, { x: 1e308 }])).toMatchObject({
      status: 'unusable',
      diagnostics: [{ code: 'unsafe-domain' }],
    });
  });
  it('reports overflow when extrapolating an extreme outside explicit bounds', () => {
    const scale = ready(
      linear([{ x: 0 }, { x: 1 }], [0, 100], { min: 0, max: 1 }),
    );
    expect(scale.map(Number.MAX_VALUE)).toEqual({
      status: 'unusable',
      reason: 'unsafe-position',
    });
  });
  it('preserves ordinary extrapolation for later clipping decisions', () => {
    const scale = ready(
      linear([{ x: 0 }, { x: 10 }], [0, 100], { min: 2, max: 8 }),
    );
    expect(scale.map(11)).toEqual({ status: 'mapped', position: 150 });
  });
});

describe('range and tick-count validation for every scale family', () => {
  it.each([
    [0, 0],
    [NaN, 100],
    [0, Infinity],
    [-Infinity, 100],
    [-1e308, 1e308],
  ])('rejects range %j', (start, end) => {
    const category = model(normalized([{ x: 'a' }]));
    const temporal = model(normalized([{ x: new Date(0) }], 'utc'));
    for (const scale of [
      linear([{ x: 0 }], [start, end]),
      createCategoryScale(category, [start, end]),
      createTemporalScale(temporal, [start, end]),
    ])
      expect(scale).toMatchObject({
        status: 'unusable',
        diagnostics: [{ code: 'invalid-range' }],
      });
  });
  it.each([0, -1, 1.5, NaN, Infinity, 101])(
    'rejects tickCount %s',
    (tickCount) => {
      for (const scale of [
        linear([{ x: 0 }, { x: 10 }], [0, 100], { tickCount }),
        createCategoryScale(
          model(normalized([{ x: 'a' }])),
          [0, 100],
          tickCount,
        ),
        createTemporalScale(
          model(normalized([{ x: new Date(0) }], 'utc')),
          [0, 100],
          { tickCount },
        ),
      ])
        expect(scale).toMatchObject({
          status: 'unusable',
          diagnostics: [{ code: 'invalid-tick-count' }],
        });
    },
  );
  it.each([1, 100])('accepts bounded tickCount %s', (tickCount) => {
    const scale = ready(
      linear([{ x: 0 }, { x: 100 }], [100, 0], { tickCount }),
    );
    expect(scale.ticks.length).toBeGreaterThan(0);
    expect(scale.ticks.length).toBeLessThanOrEqual(201);
    expect(scale.map(100)).toEqual({ status: 'mapped', position: 0 });
  });
  it('configuration failure stops both construction boundaries without changing diagnostics', () => {
    const result = freezeDeep(
      normalizeCartesian<{ x: string; y: number }>({
        data: [],
        xKey: 'x',
        series: [],
      }),
    );
    const before = result.diagnostics;
    expect(result.status).toBe('invalid-configuration');
    for (const scale of [
      createXScale(result, [0, 100]),
      createValueScale(result, 'line', [0, 100]),
    ])
      expect(scale).toMatchObject({
        status: 'unusable',
        diagnostics: [{ code: 'invalid-normalization' }],
      });
    expect(result.diagnostics).toBe(before);
  });
});

it('is immutable, repeatable, and executable in Node without DOM APIs', () => {
  expect(typeof window).toBe('undefined');
  expect(typeof document).toBe('undefined');
  expect(typeof ResizeObserver).toBe('undefined');
  for (const mode of ['category', 'linear', 'utc', 'time']) {
    const dates = [new Date(2000), new Date(0), new Date(2000)];
    const data = freezeDeep(
      [2, 0, 2].map((x, index) => ({
        x: mode === 'utc' || mode === 'time' ? dates[index] : x,
        y: index * 5,
      })),
    );
    const result = freezeDeep(normalized(data, mode));
    const before = JSON.stringify(result);
    const x = createXScale(result, [0, 100]);
    const again = createXScale(result, [0, 100]);
    if (x.status !== 'ready' || again.status !== 'ready')
      throw new Error('Expected ready');
    expect(x.ticks).toEqual(again.ticks);
    const y = ready(createValueScale(result, 'area', [100, 0]));
    expect(y.domain.domain).toEqual([0, 10]);
    expect(y.map(5)).toEqual({ status: 'mapped', position: 50 });
    expect(JSON.stringify(result)).toBe(before);
    expect(model(result).rows.map((row) => row.index)).toEqual([0, 1, 2]);
    model(result).rows.forEach((row, index) =>
      expect(row.record).toBe(data[index]),
    );
    expect(dates.map((date) => date.getTime())).toEqual([2000, 0, 2000]);
  }
});
