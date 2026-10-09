// @vitest-environment node
import { describe, expect, it, vi } from 'vitest';
import { layoutCartesian } from '../../src/core/layout/cartesian';
import { selectTicks } from '../../src/core/layout/selection';
import type { LayoutTick } from '../../src/core/layout/types';
import type { CategoryAxisConfig } from '../../src/types/contracts';
import { basic, failure, input, ready } from './helpers';

function noCollisions(
  ticks: readonly LayoutTick<unknown>[],
  horizontal: boolean,
) {
  const ordered = [...ticks].sort((a, b) => a.position - b.position);
  for (let index = 1; index < ordered.length; index++) {
    const a = ordered[index - 1]!;
    const b = ordered[index]!;
    const aSize = horizontal ? a.estimatedWidth : a.estimatedHeight;
    const bSize = horizontal ? b.estimatedWidth : b.estimatedHeight;
    expect(a.position + aSize / 2 + 6).toBeLessThanOrEqual(
      b.position - bSize / 2,
    );
  }
}
describe('typed tick candidates, formatting and selection', () => {
  it('resolves deterministic string labels without changing raw values', () => {
    const result = basic();
    expect(result.axes.x?.candidates.map((tick) => tick.label)).toEqual([
      'A',
      'B',
    ]);
    expect(result.axes.y?.candidates.map((tick) => tick.label)).toEqual([
      '0',
      '1',
      '2',
      '3',
      '4',
      '5',
      '6',
      '7',
      '8',
      '9',
      '10',
    ]);
    expect(
      result.axes.y?.candidates.every((tick) => typeof tick.value === 'number'),
    ).toBe(true);
    expect(result.axes.x?.candidates.every((tick) => tick.selected)).toBe(true);
    noCollisions(result.axes.y!.visibleTicks, false);
  });
  it('calls a formatter once per candidate after all scale configuration validation', () => {
    const formatTick = vi.fn((value: number) => `$${value.toFixed(1)}`);
    const result = ready(
      layoutCartesian({ ...input(), yAxis: { tickCount: 5, formatTick } }),
    );
    expect(result.axes.y?.candidates.map((tick) => tick.value)).toEqual([
      0, 2, 4, 6, 8, 10,
    ]);
    expect(result.axes.y?.candidates.map((tick) => tick.label)).toEqual([
      '$0.0',
      '$2.0',
      '$4.0',
      '$6.0',
      '$8.0',
      '$10.0',
    ]);
    expect(formatTick).toHaveBeenCalledTimes(6);
    for (const call of formatTick.mock.calls) expect(call.length).toBe(1);
    formatTick.mockClear();
    failure(
      layoutCartesian({ ...input(), yAxis: { min: 10, max: 0, formatTick } }),
      'invalid-bounds',
      'y',
    );
    expect(formatTick).not.toHaveBeenCalled();
  });
  it('preserves duplicate labels as separate candidates and bands on dense data', () => {
    const data = Array.from({ length: 2000 }, () => ({
      x: 'Duplicate category',
      y: 10,
    }));
    const result = ready(
      layoutCartesian({ ...input(data), xAxis: { tickCount: 1 } }),
    );
    expect(result.axes.x?.candidates).toHaveLength(2000);
    const x = result.scales.semanticX;
    if (x.kind !== 'category') throw new Error('Expected category');
    expect(x.ticks).toHaveLength(2000);
    expect(x.bandwidth).toBeCloseTo(result.plot.width / 2000);
    expect(result.axes.x!.visibleTicks.length).toBeLessThan(2000);
    expect(result.axes.x!.visibleTicks.length).toBeGreaterThan(0);
    const indices = result.axes.x!.visibleTicks.map((tick) => tick.index!);
    expect(indices).toEqual([...indices].sort((a, b) => a - b));
    noCollisions(result.axes.x!.visibleTicks, true);
  });
  it('prefers first and last candidates when they fit', () => {
    const result = ready(
      layoutCartesian(
        input(
          Array.from({ length: 40 }, (_, index) => ({
            x: `C${index}`,
            y: index,
          })),
        ),
      ),
    );
    const ticks = result.axes.x!.visibleTicks;
    expect(ticks[0]?.index).toBe(0);
    expect(ticks.at(-1)?.index).toBe(39);
    expect(ticks.length).toBeLessThan(40);
    noCollisions(ticks, true);
    expect(result.axes.x!.candidates.filter((tick) => tick.selected)).toEqual(
      ticks,
    );
  });
  it('does not force colliding endpoints', () => {
    const make = (position: number, index: number): LayoutTick<string> => ({
      value: 'ABCDE',
      index,
      position,
      label: 'ABCDE',
      selected: false,
      orientation: 'horizontal',
      estimatedWidth: 60,
      estimatedHeight: 14.4,
    });
    const selected = selectTicks(
      [make(50, 0), make(90, 1)],
      'horizontal',
      0,
      140,
      20,
      6,
    );
    expect(selected.map((tick) => tick.selected)).toEqual([true, false]);
    expect(selected.map((tick) => tick.position)).toEqual([50, 90]);
  });
  it('suppresses oversized labels without ellipsis or changing positions', () => {
    const long = 'Long'.repeat(100);
    const result = ready(
      layoutCartesian(
        input([
          { x: long, y: 0 },
          { x: 'Short', y: 10 },
          { x: long, y: 5 },
        ]),
      ),
    );
    expect(result.axes.x?.visibleTicks.map((tick) => tick.index)).toEqual([1]);
    expect(result.axes.x?.candidates[0]?.label).toBe(long);
    expect(result.margins.right).toBe(88);
    expect(result.scales.semanticX.status).toBe('ready');
  });
  it('uses estimated height for dense horizontal Bar categories', () => {
    const result = ready(
      layoutCartesian({
        normalized: input(
          Array.from({ length: 100 }, (_, index) => ({
            x: `Label ${index}`,
            y: index,
          })),
        ).normalized,
        width: 400,
        height: 180,
        family: 'bar',
        orientation: 'horizontal',
      }),
    );
    const y = result.axes.y!;
    expect(y.candidates).toHaveLength(100);
    expect(y.visibleTicks[0]?.index).toBe(0);
    expect(y.visibleTicks.at(-1)?.index).toBe(99);
    expect(y.visibleTicks.length).toBeLessThan(10);
    noCollisions(y.visibleTicks, false);
  });
  it('filters reversed vertical numeric labels and preserves endpoints', () => {
    const result = ready(
      layoutCartesian({ ...input(), height: 120, yAxis: { tickCount: 100 } }),
    );
    const y = result.axes.y!;
    expect(y.candidates.length).toBeGreaterThan(y.visibleTicks.length);
    expect(y.visibleTicks[0]?.value).toBe(0);
    expect(y.visibleTicks.at(-1)?.value).toBe(10);
    expect(y.visibleTicks[0]!.position).toBeGreaterThan(
      y.visibleTicks.at(-1)!.position,
    );
    noCollisions(y.visibleTicks, false);
  });
  it('empty labels remain candidates but are not displayed', () => {
    const result = ready(
      layoutCartesian({ ...input(), xAxis: { formatTick: () => '' } }),
    );
    expect(result.axes.x?.candidates).toHaveLength(2);
    expect(result.axes.x?.visibleTicks).toEqual([]);
  });
  it.each([
    () => {
      throw new Error('failed');
    },
    () => 42,
    () => null,
    () => undefined,
    () => 'multi\nline',
    () => 'a\tb',
  ])(
    'returns structured formatting failure without substitute labels',
    (formatTick) => {
      const config = { formatTick } as unknown as CategoryAxisConfig;
      failure(
        layoutCartesian({ ...input(), xAxis: config }),
        'formatting-failed',
        'x',
      );
    },
  );
  it('keeps category Date identity even when a callback mutates its copy', () => {
    const date = new Date('2026-01-01T00:00:00Z');
    const result = ready(
      layoutCartesian({
        ...input([{ x: date, y: 10 }]),
        xAxis: {
          formatTick: (value: string | number | Date) => {
            expect(value).not.toBe(date);
            if (value instanceof Date) value.setTime(0);
            return 'date';
          },
        },
      }),
    );
    expect(result.axes.x?.candidates[0]?.value).toBe(date);
    expect(date.toISOString()).toBe('2026-01-01T00:00:00.000Z');
  });
  it('formats numeric and Date categories with stable defaults', () => {
    const date = new Date(0);
    const result = ready(
      layoutCartesian(
        input([
          { x: 1.5, y: 10 },
          { x: date, y: 20 },
          { x: '1.5', y: 30 },
        ]),
      ),
    );
    expect(result.axes.x?.candidates.map((tick) => tick.label)).toEqual([
      '1.5',
      '1970-01-01T00:00:00.000Z',
      '1.5',
    ]);
    expect(result.axes.x?.candidates.map((tick) => tick.index)).toEqual([
      0, 1, 2,
    ]);
  });
});
