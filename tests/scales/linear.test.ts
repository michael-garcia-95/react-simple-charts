// @vitest-environment node
import { describe, expect, it } from 'vitest';
import {
  calculateLinearXDomain,
  createXScale,
} from '../../src/core/scales/cartesian';
import { linear, model, normalized, ready } from './helpers';

describe('linear X extents and mapping', () => {
  it.each([
    [
      [10, 30, 20],
      [10, 30],
      [0, 100, 50],
    ],
    [
      [-5, -10, -7.5],
      [-10, -5],
      [100, 0, 50],
    ],
    [
      [0.5, -0.5, 0, 0.5],
      [-0.5, 0.5],
      [100, 0, 50, 100],
    ],
  ])('maps unsorted/repeated %j', (values, domain, coordinates) => {
    const data = values.map((x) => ({ x, y: 1 }));
    const normalizedData = model(normalized(data, 'linear'));
    const scale = ready(linear(data));
    expect(scale.domain.observed).toEqual(domain);
    expect(scale.domain.domain).toEqual(domain);
    expect(scale.domain.origin).toBe('data');
    expect(scale.domain.expanded).toBe(false);
    expect(values.map((value) => scale.map(value))).toEqual(
      coordinates.map((position) => ({ status: 'mapped', position })),
    );
    expect(normalizedData.rows.map((row) => row.x.raw)).toEqual(values);
    normalizedData.rows.forEach((row, index) =>
      expect(row.record).toBe(data[index]),
    );
  });
  it('ignores invalid/missing states without parsing strings', () => {
    const scale = ready(
      linear(
        [3, null, '1000', NaN, undefined, -2, Infinity].map((x) => ({ x })),
      ),
    );
    expect(scale.domain.observed).toEqual([-2, 3]);
    expect(scale.map(NaN)).toEqual({
      status: 'unusable',
      reason: 'invalid-value',
    });
    expect(scale.map('3' as unknown as number).status).toBe('unusable');
  });
  it('expands a repeated constant deterministically without changing its observed extent', () => {
    const scale = ready(linear([{ x: 100 }, { x: 100 }]));
    expect(scale.domain).toMatchObject({
      observed: [100, 100],
      domain: [99, 101],
      expanded: true,
      origin: 'data',
    });
    expect(scale.map(100)).toEqual({ status: 'mapped', position: 50 });
  });
  it('uses typed numerical ticks with expected mapped coordinates', () => {
    const scale = ready(
      linear([{ x: 0 }, { x: 10 }], [0, 100], { tickCount: 5 }),
    );
    expect(scale.ticks).toEqual(
      [0, 2, 4, 6, 8, 10].map((value) => ({ value, position: value * 10 })),
    );
  });
  it.each([{ data: [] }, { data: [{ x: null }] }, { data: [{ x: '2' }] }])(
    'returns an empty scale with fallback metadata for %j',
    ({ data }) => {
      const scale = linear(data);
      expect(scale).toMatchObject({
        status: 'empty',
        domain: {
          domain: [0, 1],
          observed: null,
          origin: 'fallback',
          expanded: false,
        },
        ticks: [],
      });
      expect(scale).not.toHaveProperty('map');
    },
  );
  it('rejects linear domains for a different normalized mode', () => {
    expect(calculateLinearXDomain(model(normalized([])))).toMatchObject({
      status: 'unusable',
      diagnostics: [{ code: 'incompatible-x-scale' }],
    });
  });
  it('dispatches a normalized linear result without exposing a D3 object', () => {
    const result = createXScale(
      normalized([{ x: 0 }, { x: 10 }], 'linear'),
      [20, 120],
    );
    if (
      result.status !== 'ready' ||
      !('kind' in result) ||
      result.kind !== 'linear'
    )
      throw new Error('Expected linear');
    expect(result.map(5)).toEqual({ status: 'mapped', position: 70 });
    expect(result).not.toHaveProperty('invert');
  });
});
