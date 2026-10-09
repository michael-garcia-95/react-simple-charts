// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { createValueScale } from '../../src/core/scales/cartesian';
import { calculateValueDomain } from '../../src/core/scales/value';
import { model, normalized, ready } from './helpers';

describe('series-aware renderable value domains', () => {
  it('Line retains the actual positive extent without forcing zero', () => {
    const result = normalized([95, 100, 105].map((y) => ({ x: 'A', y })));
    const scale = ready(createValueScale(result, 'line', [100, 0]));
    expect(scale.domain).toMatchObject({
      observed: [95, 105],
      domain: [95, 105],
      zeroBaseline: false,
      origin: 'data',
    });
    expect(scale.map(100)).toEqual({ status: 'mapped', position: 50 });
  });
  it('uses all configured series, independently ignoring missing and invalid values', () => {
    const result = normalized(
      [
        { x: 'a', a: 0, b: null, c: 'invalid' },
        { x: 'b', a: -25.5, b: 12.25 },
        { x: 'c', b: 100 },
        { x: null, a: -999, b: 999 },
        { x: {}, a: -1000, b: 1000 },
      ],
      'category',
      [{ key: 'b' }, { key: 'c' }, { key: 'a' }],
    );
    const data = model(result);
    expect(calculateValueDomain(data, 'line')).toMatchObject({
      observed: [-25.5, 100],
      domain: [-25.5, 100],
    });
    expect(data.series.map((series) => series.key)).toEqual(['b', 'c', 'a']);
    expect(data.rows).toHaveLength(5);
    expect(data.rows[3]?.values[0]).toMatchObject({
      status: 'valid',
      value: 999,
    });
  });
  it.each(['bar', 'area'] as const)('%s retains a zero baseline', (family) => {
    for (const [values, expected] of [
      [
        [10, 20, 30],
        [0, 30],
      ],
      [
        [-30, -10],
        [-30, 0],
      ],
      [
        [-20, 10],
        [-20, 10],
      ],
    ] as const) {
      const scale = ready(
        createValueScale(
          normalized(values.map((y) => ({ x: 'a', y }))),
          family,
          [100, 0],
        ),
      );
      expect(scale.domain.observed).toEqual([
        Math.min(...values),
        Math.max(...values),
      ]);
      expect(scale.domain.domain).toEqual(expected);
      expect(scale.domain.zeroBaseline).toBe(true);
      expect(scale.map(expected[0])).toEqual({
        status: 'mapped',
        position: 100,
      });
      expect(scale.map(expected[1])).toEqual({ status: 'mapped', position: 0 });
    }
  });
  it('Line retains all-negative extents too', () => {
    expect(
      calculateValueDomain(
        model(normalized([-30, -10].map((y) => ({ x: 'a', y })))),
        'line',
      ),
    ).toMatchObject({ domain: [-30, -10] });
  });
  it.each(['line', 'area', 'bar'] as const)(
    'handles zero-only and empty %s data distinctly',
    (family) => {
      const zero = ready(
        createValueScale(
          normalized([
            { x: 'a', y: 0 },
            { x: 'b', y: 0 },
          ]),
          family,
          [0, 100],
        ),
      );
      expect(zero.domain).toMatchObject({
        observed: [0, 0],
        domain: [-1, 1],
        expanded: true,
        origin: 'data',
      });
      expect(zero.map(0)).toEqual({ status: 'mapped', position: 50 });
      for (const data of [
        [],
        [{ x: 'a', y: null }],
        [{ x: 'b', y: NaN }],
        [{ x: null, y: 100 }],
      ]) {
        const empty = createValueScale(normalized(data), family, [0, 100]);
        expect(empty).toMatchObject({
          status: 'empty',
          domain: { observed: null, domain: [0, 1], origin: 'fallback' },
          ticks: [],
        });
        expect(empty).not.toHaveProperty('map');
      }
    },
  );
  it('does not calculate stacked totals', () => {
    const result = normalized([{ x: 'a', a: 20, b: 30 }], 'category', [
      { key: 'a' },
      { key: 'b' },
    ]);
    expect(calculateValueDomain(model(result), 'bar')).toMatchObject({
      observed: [20, 30],
      domain: [0, 30],
    });
  });
});
