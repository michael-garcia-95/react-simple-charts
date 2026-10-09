// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { createCategoryScale } from '../../src/core/scales/category';
import { model, normalized } from './helpers';

function category(
  data: readonly unknown[],
  range: readonly [number, number] = [0, 300],
) {
  const scale = createCategoryScale(model(normalized(data)), range);
  if (scale.status !== 'ready') throw new Error('Expected category scale');
  return scale;
}
describe('row identity band positioning', () => {
  it.each([
    ['Jan', 'Feb', 'Mar'],
    ['Jan', 'Jan', 'Feb'],
    [7, 7, 8],
    [new Date(0), new Date(0), new Date(1)],
  ])('preserves three positions for %j', (...labels) => {
    const scale = category(labels.map((x) => ({ x, y: 1 })));
    expect(scale.bandwidth).toBe(100);
    expect(scale.ticks.map((tick) => tick.index)).toEqual([0, 1, 2]);
    expect(scale.ticks.map((tick) => tick.value)).toEqual(labels);
    expect(scale.ticks.map((tick) => tick.start)).toEqual([0, 100, 200]);
    expect(scale.ticks.map((tick) => tick.position)).toEqual([50, 150, 250]);
    labels.forEach((label, index) =>
      expect(scale.ticks[index]?.value).toBe(label),
    );
    expect(scale.position(1)).toEqual({ status: 'mapped', position: 150 });
    expect(scale.position(99)).toEqual({
      status: 'unusable',
      reason: 'invalid-value',
    });
  });
  it('retains source indices across missing/invalid X rows and closes spacing gaps', () => {
    const result = normalized([
      { x: 'B' },
      { x: null },
      { x: {} },
      {},
      { x: 'A' },
    ]);
    const data = model(result);
    const scale = createCategoryScale(data, [0, 200], 1);
    if (scale.status !== 'ready') throw new Error('Expected ready');
    expect(scale.ticks).toEqual([
      { index: 0, value: 'B', start: 0, position: 50 },
      { index: 4, value: 'A', start: 100, position: 150 },
    ]);
    expect(scale.bandwidth).toBe(100);
    expect(scale.position(1).status).toBe('unusable');
    expect(data.rows).toHaveLength(5);
    expect(result.diagnostics).toHaveLength(8);
  });
  it('supports reversed ranges with ticks still in source order', () => {
    const scale = category([{ x: 'A' }, { x: 'B' }], [200, 0]);
    expect(scale.ticks.map((tick) => tick.position)).toEqual([150, 50]);
    expect(scale.ticks.map((tick) => tick.start)).toEqual([100, 0]);
    expect(scale.bandwidth).toBe(100);
  });
  it.each([
    { data: [] },
    { data: [{ x: null }] },
    { data: [{ x: new Date(NaN) }] },
  ])('reports empty categories for %j', ({ data }) => {
    expect(createCategoryScale(model(normalized(data)), [0, 100])).toEqual({
      status: 'empty',
      ticks: [],
    });
  });
  it('rejects category positioning of linear normalization', () => {
    expect(
      createCategoryScale(model(normalized([], 'linear')), [0, 100]),
    ).toMatchObject({
      status: 'unusable',
      diagnostics: [{ code: 'incompatible-x-scale' }],
    });
  });
  it('reports bandwidth underflow instead of fake category coordinates', () => {
    expect(
      createCategoryScale(model(normalized([{ x: 'a' }, { x: 'b' }])), [
        0,
        Number.MIN_VALUE,
      ]),
    ).toMatchObject({
      status: 'unusable',
      diagnostics: [{ code: 'unsafe-position' }],
    });
  });
});
