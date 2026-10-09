// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { layoutCartesian } from '../../src/core/layout/cartesian';
import { placeGridlines } from '../../src/core/layout/grid';
import { basic, input, ready } from './helpers';

describe('value gridlines and zero baselines', () => {
  it.each(['line', 'area', 'bar'] as const)(
    '%s creates horizontal gridlines from all value ticks',
    (family) => {
      const result = ready(
        layoutCartesian(
          family === 'bar'
            ? { ...input(), family, yAxis: { tickCount: 100 } }
            : { ...input(), family, yAxis: { tickCount: 100 } },
        ),
      );
      expect(result.gridlines).toHaveLength(result.scales.value.ticks.length);
      expect(result.gridlines.map((line) => line.position)).toEqual(
        result.scales.value.ticks.map((tick) => tick.position),
      );
      expect(result.gridlines.length).toBeGreaterThan(
        result.axes.y!.visibleTicks.length,
      );
      for (const line of result.gridlines) {
        expect(line.orientation).toBe('horizontal');
        expect(line.start).toBe(result.plot.left);
        expect(line.end).toBe(result.plot.right);
        expect(line.position).toBeGreaterThanOrEqual(result.plot.top);
        expect(line.position).toBeLessThanOrEqual(result.plot.bottom);
        expect(Number.isFinite(line.position)).toBe(true);
      }
      expect(new Set(result.gridlines.map((line) => line.position)).size).toBe(
        result.gridlines.length,
      );
    },
  );
  it('horizontal Bar uses vertical gridlines independent of visible axes', () => {
    const result = ready(
      layoutCartesian({
        normalized: input().normalized,
        family: 'bar',
        orientation: 'horizontal',
        width: 400,
        height: 280,
        xAxis: { show: false },
      }),
    );
    expect(result.axes.x).toBeNull();
    expect(result.gridlines.map((line) => line.position)).toEqual(
      result.scales.value.ticks.map((tick) => tick.position),
    );
    result.gridlines.forEach((line) => {
      expect(line.orientation).toBe('vertical');
      expect(line.start).toBe(result.plot.top);
      expect(line.end).toBe(result.plot.bottom);
      expect(line.position).toBeGreaterThanOrEqual(result.plot.left);
      expect(line.position).toBeLessThanOrEqual(result.plot.right);
    });
  });
  it('respects showGrid=false without removing ticks or scales', () => {
    const result = ready(layoutCartesian({ ...input(), showGrid: false }));
    expect(result.gridlines).toEqual([]);
    expect(result.scales.value.ticks).toHaveLength(11);
    expect(result.axes.y?.candidates).toHaveLength(11);
  });
  it('rejects duplicate, nonfinite, and out-of-bounds grid positions', () => {
    const result = basic();
    const lines = placeGridlines(
      [
        result.plot.top,
        result.plot.top,
        result.plot.bottom,
        -1,
        281,
        NaN,
        Infinity,
      ].map((position) => ({ position })),
      result.plot,
      false,
      true,
    );
    expect(lines.map((line) => line.position)).toEqual([
      result.plot.top,
      result.plot.bottom,
    ]);
  });
  it.each([
    { values: [10, 20], domain: [0, 20], fraction: 1 },
    { values: [-20, -10], domain: [-20, 0], fraction: 0 },
    { values: [-10, 30], domain: [-10, 30], fraction: 0.75 },
    { values: [0, 0], domain: [-1, 1], fraction: 0.5 },
  ])(
    'places Area and vertical/horizontal Bar baselines for $values',
    ({ values, domain, fraction }) => {
      const setup = input(values.map((y, index) => ({ x: index, y })));
      for (const family of ['area', 'bar'] as const) {
        const result = ready(
          layoutCartesian(
            family === 'bar' ? { ...setup, family } : { ...setup, family },
          ),
        );
        expect(result.scales.value.domain.domain).toEqual(domain);
        expect(result.zeroBaseline?.axis).toBe('y');
        expect(result.zeroBaseline?.position).toBeCloseTo(
          result.plot.top + fraction * result.plot.height,
        );
        expect(result.scales.value.map(0)).toEqual({
          status: 'mapped',
          position: result.zeroBaseline!.position,
        });
      }
      const horizontal = ready(
        layoutCartesian({
          normalized: setup.normalized,
          width: 400,
          height: 280,
          family: 'bar',
          orientation: 'horizontal',
        }),
      );
      expect(horizontal.zeroBaseline?.axis).toBe('x');
      expect(horizontal.zeroBaseline?.position).toBeCloseTo(
        horizontal.plot.left + (1 - fraction) * horizontal.plot.width,
      );
    },
  );
  it('Line keeps its domain and exposes no mandatory baseline', () => {
    const result = ready(
      layoutCartesian(
        input([
          { x: 'A', y: 95 },
          { x: 'B', y: 105 },
        ]),
      ),
    );
    expect(result.scales.value.domain.domain).toEqual([95, 105]);
    expect(result.zeroBaseline).toBeNull();
  });
});
