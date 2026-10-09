// @vitest-environment node
import { describe, expect, it, vi } from 'vitest';
import { layoutCartesian } from '../../src/core/layout/cartesian';
import { createXScale } from '../../src/core/scales/cartesian';
import { failure, input, ready } from './helpers';

describe('physical axes and semantic mappings', () => {
  it.each(['line', 'area', 'bar'] as const)(
    '%s uses horizontal semantic X and reversed vertical values',
    (family) => {
      const result = ready(
        layoutCartesian(
          family === 'bar' ? { ...input(), family } : { ...input(), family },
        ),
      );
      expect(result.assignments).toEqual({
        x: { orientation: 'horizontal', semantic: 'x', visible: true },
        y: { orientation: 'vertical', semantic: 'value', visible: true },
      });
      expect(result.axes.x).toMatchObject({
        kind: 'category',
        coordinate: result.plot.bottom,
      });
      expect(result.axes.y).toMatchObject({
        kind: 'linear',
        coordinate: result.plot.left,
      });
      expect(result.scales.value.map(0)).toEqual({
        status: 'mapped',
        position: result.plot.bottom,
      });
      expect(result.scales.value.map(10)).toEqual({
        status: 'mapped',
        position: result.plot.top,
      });
      const x = result.scales.semanticX;
      if (x.kind !== 'category') throw new Error('Expected categories');
      expect(x.position(0)).toEqual({
        status: 'mapped',
        position: result.plot.left + result.plot.width / 4,
      });
      expect(x.position(1)).toEqual({
        status: 'mapped',
        position: result.plot.left + (3 * result.plot.width) / 4,
      });
    },
  );
  it('maps horizontal Bar callbacks and positions to physical directions', () => {
    const numeric = vi.fn((value: number) => `N${value}`);
    const category = vi.fn(
      (value: string | number | Date) => `C${String(value)}`,
    );
    const result = ready(
      layoutCartesian({
        normalized: input().normalized,
        width: 400,
        height: 280,
        family: 'bar',
        orientation: 'horizontal',
        xAxis: { formatTick: numeric, min: 0, max: 20, tickCount: 2 },
        yAxis: { formatTick: category },
      }),
    );
    expect(result.assignments.x.semantic).toBe('value');
    expect(result.assignments.y.semantic).toBe('x');
    expect(result.axes.x).toMatchObject({
      kind: 'linear',
      orientation: 'horizontal',
      semantic: 'value',
    });
    expect(result.axes.y).toMatchObject({
      kind: 'category',
      orientation: 'vertical',
      semantic: 'x',
    });
    expect(numeric.mock.calls.map(([value]) => value)).toEqual([0, 10, 20]);
    expect(category.mock.calls.map(([value]) => value)).toEqual(['A', 'B']);
    expect(result.scales.value.domain.domain).toEqual([0, 20]);
    expect(result.scales.value.map(0)).toEqual({
      status: 'mapped',
      position: result.plot.left,
    });
    expect(result.scales.value.map(20)).toEqual({
      status: 'mapped',
      position: result.plot.right,
    });
    const x = result.scales.semanticX;
    if (x.kind !== 'category') throw new Error('Expected category');
    expect(x.position(0)).toEqual({
      status: 'mapped',
      position: result.plot.top + result.plot.height / 4,
    });
    const second = x.position(1);
    expect(second.status).toBe('mapped');
    if (second.status === 'mapped')
      expect(second.position).toBeCloseTo(
        result.plot.top + (3 * result.plot.height) / 4,
      );
    expect(result.axes.y?.candidates.map((tick) => tick.index)).toEqual([0, 1]);
  });
  it('retains separate bands and original indices for duplicate categories', () => {
    const setup = input([
      { x: 'Jan', y: 10 },
      { x: 'Jan', y: null },
      { x: null, y: 50 },
      { x: 'Feb', y: 20 },
    ]);
    const result = ready(layoutCartesian({ ...setup, family: 'bar' }));
    const x = result.scales.semanticX;
    if (x.kind !== 'category') throw new Error('Expected category');
    expect(x.ticks.map((tick) => tick.index)).toEqual([0, 1, 3]);
    expect(x.bandwidth).toBeCloseTo(result.plot.width / 3);
    expect(x.ticks.map((tick) => tick.value)).toEqual(['Jan', 'Jan', 'Feb']);
    expect(x.position(2).status).toBe('unusable');
    expect(result.scales.value.domain.observed).toEqual([10, 20]);
    const reference = createXScale(setup.normalized, [
      result.plot.left,
      result.plot.right,
    ]);
    if (reference.status !== 'ready' || reference.kind !== 'category')
      throw new Error('Expected category');
    expect(x.bandwidth).toBe(reference.bandwidth);
    expect(x.ticks).toEqual(reference.ticks);
  });
  it.each(['linear', 'utc', 'time'])(
    'rejects %s normalization for Bar',
    (mode) => {
      const setup = input(
        [{ x: mode === 'linear' ? 1 : new Date(0), y: 10 }],
        mode,
      );
      failure(
        layoutCartesian({ ...setup, family: 'bar' }),
        'incompatible-x-scale',
      );
      failure(
        layoutCartesian({
          normalized: setup.normalized,
          width: 400,
          height: 280,
          family: 'bar',
          orientation: 'horizontal',
        }),
        'incompatible-x-scale',
      );
    },
  );
  it('retains linear X bounds and uses number ticks', () => {
    const formatter = vi.fn((value: number) => String(value));
    const result = ready(
      layoutCartesian({
        ...input(
          [
            { x: 0, y: 95 },
            { x: 10, y: 105 },
          ],
          'linear',
        ),
        xAxis: { min: -10, max: 10, tickCount: 2, formatTick: formatter },
      }),
    );
    expect(result.axes.x?.kind).toBe('linear');
    expect(formatter.mock.calls.map(([value]) => value)).toEqual([-10, 0, 10]);
    expect(result.scales.value.domain.domain).toEqual([95, 105]);
    const x = result.scales.semanticX;
    if (x.kind !== 'linear') throw new Error('Expected linear');
    expect(x.map(0)).toEqual({
      status: 'mapped',
      position: result.plot.left + result.plot.width / 2,
    });
    expect(result.zeroBaseline).toBeNull();
  });
  it('hides the physical category axis for horizontal Bar', () => {
    const result = ready(
      layoutCartesian({
        normalized: input().normalized,
        width: 400,
        height: 280,
        family: 'bar',
        orientation: 'horizontal',
        yAxis: { show: false, label: 'Hidden' },
      }),
    );
    expect(result.axes.y).toBeNull();
    expect(result.axes.x?.kind).toBe('linear');
    expect(result.margins.left).toBe(20); // half of two-character numeric labels + padding
    expect(result.scales.semanticX.status).toBe('ready');
  });
});
