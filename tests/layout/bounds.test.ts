// @vitest-environment node
import { describe, expect, it, vi } from 'vitest';
import { layoutCartesian } from '../../src/core/layout/cartesian';
import type {
  CartesianLayoutInput,
  LayoutSpacing,
} from '../../src/core/layout/types';
import { basic, failure, input, ready } from './helpers';

describe('Cartesian plot bounds and adaptive margins', () => {
  it('calculates exact default bounds and finite metadata', () => {
    const result = basic();
    expect(result.chart).toEqual({
      left: 0,
      top: 0,
      right: 400,
      bottom: 280,
      width: 400,
      height: 280,
    });
    expect(result.margins.left).toBe(42); // "10" is two code units.
    expect(result.margins.right).toBe(14);
    expect(result.margins.top).toBeCloseTo(15.2);
    expect(result.margins.bottom).toBeCloseTo(39.6);
    expect(result.plot).toMatchObject({ left: 42, right: 386, width: 344 });
    expect(result.plot.top).toBeCloseTo(15.2);
    expect(result.plot.bottom).toBeCloseTo(240.4);
    expect(result.plot.height).toBeCloseTo(225.2);
    [
      ...Object.values(result.chart),
      ...Object.values(result.plot),
      ...Object.values(result.margins),
    ].forEach((value) => expect(Number.isFinite(value)).toBe(true));
  });
  it.each([
    0,
    -1,
    NaN,
    Infinity,
    -Infinity,
    Number.MAX_VALUE,
    Number.MAX_SAFE_INTEGER + 1,
  ])('rejects invalid dimension %s', (value) => {
    failure(
      layoutCartesian({ ...input(), width: value }),
      'invalid-dimensions',
    );
    failure(
      layoutCartesian({ ...input(), height: value }),
      'invalid-dimensions',
    );
  });
  it.each([
    { width: 40 },
    { height: 35 },
    { width: 1, height: 1 },
    { width: 100, height: 50 },
  ])('rejects insufficient space %j', (size) => {
    failure(layoutCartesian({ ...input(), ...size }), 'insufficient-space');
  });
  it('supports fractional dimensions and large safe dimensions', () => {
    const result = ready(
      layoutCartesian({ ...input(), width: 400.5, height: 280.5 }),
    );
    expect(result.plot.width).toBe(344.5);
    const large = ready(
      layoutCartesian({
        ...input(),
        width: Number.MAX_SAFE_INTEGER,
        height: Number.MAX_SAFE_INTEGER,
      }),
    );
    Object.values(large.plot).forEach((value) =>
      expect(Number.isFinite(value)).toBe(true),
    );
  });
  it('adapts to formatted labels and caps growth', () => {
    const compact = ready(
      layoutCartesian({ ...input(), yAxis: { formatTick: () => 'X' } }),
    );
    const wider = ready(
      layoutCartesian({
        ...input(),
        yAxis: { formatTick: () => '1234567890' },
      }),
    );
    expect(compact.margins.left).toBe(30);
    expect(wider.margins.left).toBe(138);
    const capped = ready(
      layoutCartesian({
        ...input(),
        yAxis: { formatTick: () => 'x'.repeat(1000) },
      }),
    );
    expect(capped.margins.left).toBe(178);
    expect(capped.axes.y?.visibleTicks).toEqual([]);
    expect(capped.axes.y?.candidates.length).toBeGreaterThan(0);
  });
  it('reserves axis title spacing', () => {
    const base = basic();
    const titled = ready(
      layoutCartesian({
        ...input(),
        xAxis: { label: 'Category' },
        yAxis: { label: 'Value' },
      }),
    );
    expect(titled.margins.left - base.margins.left).toBeCloseTo(22.8);
    expect(titled.margins.bottom - base.margins.bottom).toBeCloseTo(22.8);
    expect(titled.axes.x?.label).toBe('Category');
    expect(titled.axes.y?.label).toBe('Value');
  });
  it('hides axis metadata, titles, formatter calls, and reserved label space', () => {
    const formatTick = vi.fn(() => {
      throw new Error('Hidden');
    });
    const result = ready(
      layoutCartesian({
        ...input(),
        xAxis: { show: false, label: 'Hidden', formatTick },
        yAxis: { show: false, label: 'Hidden', formatTick },
      }),
    );
    expect(result.axes).toEqual({ x: null, y: null });
    expect(result.assignments.x.visible).toBe(false);
    expect(result.margins).toEqual({ left: 8, right: 8, top: 8, bottom: 8 });
    expect(result.plot).toEqual({
      left: 8,
      right: 392,
      top: 8,
      bottom: 272,
      width: 384,
      height: 264,
    });
    expect(result.scales.value.map(10)).toEqual({
      status: 'mapped',
      position: 8,
    });
    expect(result.gridlines.length).toBeGreaterThan(0);
    expect(formatTick).not.toHaveBeenCalled();
  });
  it('can use a small chart when axes are hidden', () => {
    const result = ready(
      layoutCartesian({
        ...input(),
        width: 32,
        height: 32,
        xAxis: { show: false },
        yAxis: { show: false },
      }),
    );
    expect(result.plot.width).toBe(16);
    expect(result.plot.height).toBe(16);
  });
  it('honors explicit internal minimum margins', () => {
    const result = ready(
      layoutCartesian({
        ...input(),
        spacing: { minimumMargins: { left: 100, top: 40 } },
      }),
    );
    expect(result.plot.left).toBe(100);
    expect(result.plot.top).toBe(40);
    failure(
      layoutCartesian({
        ...input(),
        spacing: { minimumMargins: { left: 400 } },
      }),
      'insufficient-space',
    );
  });
  it.each([
    { padding: -1 },
    { tickFontSize: 0 },
    { titleFontSize: NaN },
    { minPlotSize: 0 },
    { collisionGap: Infinity },
    { minimumMargins: { bottom: -1 } },
    { padding: null },
    null,
  ])('rejects invalid spacing %j', (spacing) => {
    failure(
      layoutCartesian({
        ...input(),
        spacing: spacing as unknown as LayoutSpacing,
      }),
      'invalid-spacing',
    );
  });
  it('handles arithmetic that cannot leave a trustworthy rectangle', () => {
    failure(
      layoutCartesian({
        ...input(),
        spacing: { padding: Number.MAX_SAFE_INTEGER },
      }),
      'insufficient-space',
    );
    failure(
      layoutCartesian({
        ...input(),
        width: Number.MIN_VALUE,
        height: Number.MIN_VALUE,
        spacing: { padding: 0, minPlotSize: Number.MIN_VALUE },
        xAxis: { show: false },
        yAxis: { show: false },
      }),
      'unsafe-position',
      'x',
    );
  });
  it.each([
    { xAxis: null },
    { yAxis: { show: 0 } },
    { xAxis: { label: 3 } },
    { yAxis: { formatTick: 'no' } },
    { family: 'pie' },
    { orientation: 'horizontal' },
    { showGrid: null },
  ])('rejects invalid runtime options %j', (options) => {
    failure(
      layoutCartesian({
        ...input(),
        ...options,
      } as unknown as CartesianLayoutInput<Record<string, number>>),
      'invalid-configuration',
    );
  });
});
