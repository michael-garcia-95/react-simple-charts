// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { bars, input } from './helpers';

describe('physical bar rectangles', () => {
  it.each([false, true])(
    'mixed positive/negative/zero rectangles, horizontal=%s',
    (horizontal) => {
      const records = [
        { x: 'Same', y: -10 },
        { x: 'Same', y: 10 },
        { x: 'Zero', y: 0 },
      ];
      const result = bars(input(records), horizontal);
      expect(result.status).toBe('ready');
      expect(result.zeroBaseline).toEqual({
        axis: horizontal ? 'x' : 'y',
        position: 58,
      });
      const categorySize = (100 / 3) * 0.8 * 0.9;
      result.bars.forEach((bar, index) => {
        const categoryStart =
          8 + (index * 100) / 3 + (100 / 3 - categorySize) / 2;
        expect(bar.record).toBe(records[index]);
        expect(bar.index).toBe(index);
        expect(bar.value).toBe(records[index]!.y);
        expect(bar.seriesKey).toBe('y');
        expect(bar.seriesIndex).toBe(0);
        expect(bar.baseline).toBe(58);
        expect(horizontal ? bar.y : bar.x).toBeCloseTo(categoryStart);
        expect(horizontal ? bar.height : bar.width).toBeCloseTo(categorySize);
        expect(horizontal ? bar.width : bar.height).toBe(index === 2 ? 0 : 50);
        expect(horizontal ? bar.x : bar.y).toBe(
          horizontal ? [8, 58, 58][index] : [58, 8, 58][index],
        );
        expect(bar.width).toBeGreaterThanOrEqual(0);
        expect(bar.height).toBeGreaterThanOrEqual(0);
        expect(bar.outOfPlot).toBe(false);
      });
    },
  );
  it.each([false, true])(
    'positive-only/negative-only baselines, horizontal=%s',
    (horizontal) => {
      const positive = bars(input([{ x: 'A', y: 10 }]), horizontal);
      const negative = bars(input([{ x: 'A', y: -10 }]), horizontal);
      expect(positive.bars[0]).toMatchObject(
        horizontal
          ? { x: 8, width: 100, baseline: 8 }
          : { y: 8, height: 100, baseline: 108 },
      );
      expect(negative.bars[0]).toMatchObject(
        horizontal
          ? { x: 8, width: 100, baseline: 108 }
          : { y: 8, height: 100, baseline: 8 },
      );
      expect(
        horizontal ? positive.bars[0]!.height : positive.bars[0]!.width,
      ).toBeCloseTo(72);
    },
  );
  it.each([false, true])(
    'zero-only bars have zero numerical extent, horizontal=%s',
    (horizontal) => {
      const result = bars(input([{ x: 'A', y: 0 }]), horizontal);
      expect(result.zeroBaseline!.position).toBe(58);
      expect(horizontal ? result.bars[0]!.width : result.bars[0]!.height).toBe(
        0,
      );
      expect(result.bars).toHaveLength(1);
    },
  );
  it.each([false, true])(
    'missing values produce no bars but retain slots, horizontal=%s',
    (horizontal) => {
      const result = bars(
        input(
          [
            { x: 'A', a: 10, b: null, c: 30 },
            { x: 'B', a: null, b: 20, c: 30 },
          ],
          'category',
          [{ key: 'c' }, { key: 'b' }, { key: 'a' }],
        ),
        horizontal,
      );
      expect(
        result.bars.map((bar) => [bar.index, bar.seriesIndex, bar.seriesKey]),
      ).toEqual([
        [0, 0, 'c'],
        [0, 2, 'a'],
        [1, 0, 'c'],
        [1, 1, 'b'],
      ]);
      expect(result.bars[0]!.slot.start).toBeCloseTo(13);
      expect(result.bars[1]!.slot.start).toBeCloseTo(13 + 80 / 3);
      expect(result.bars[2]!.slot.start).toBeCloseTo(63);
      expect(result.bars[3]!.slot.start).toBeCloseTo(63 + 40 / 3);
      expect(result.bars[0]!.slot.end).toBeLessThan(result.bars[1]!.slot.start);
      expect(
        horizontal ? result.bars[2]!.y : result.bars[2]!.x,
      ).toBeGreaterThan(horizontal ? result.bars[0]!.y : result.bars[0]!.x);
    },
  );
  it.each([false, true])(
    'many categories and series remain fractional and nonoverlapping, horizontal=%s',
    (horizontal) => {
      const series = Array.from({ length: 15 }, (_, index) => ({
        key: `v${index}`,
      }));
      const records = Array.from({ length: 200 }, (_, index) =>
        Object.fromEntries([
          ['x', `C${index}`],
          ...series.map((entry) => [entry.key, 10]),
        ]),
      );
      const result = bars(input(records, 'category', series), horizontal);
      expect(result.bars).toHaveLength(3000);
      result.bars.forEach((bar, index) => {
        const start = horizontal ? bar.y : bar.x;
        const size = horizontal ? bar.height : bar.width;
        expect(size).toBeGreaterThan(0);
        expect(size).toBeLessThan(1);
        expect(start).toBeGreaterThanOrEqual(bar.slot.start);
        expect(start + size).toBeLessThanOrEqual(bar.slot.end);
        const previous = result.bars[index - 1];
        if (previous && previous.index === bar.index)
          expect(start).toBeGreaterThanOrEqual(
            horizontal
              ? previous.y + previous.height
              : previous.x + previous.width,
          );
        expect(bar.outOfPlot).toBe(false);
      });
    },
  );
  it('uses full allowed ratios without overlap', () => {
    const result = bars({
      ...input([{ x: 'A', a: 10, b: 5 }], 'category', [
        { key: 'a' },
        { key: 'b' },
      ]),
      barSpacing: { groupRatio: 1, slotRatio: 1 },
    });
    expect(result.bars.map((bar) => [bar.x, bar.width])).toEqual([
      [8, 50],
      [58, 50],
    ]);
  });
  it('valid very small bands do not receive a pixel minimum', () => {
    const result = bars({
      ...input([
        { x: 'A', y: 10 },
        { x: 'B', y: 10 },
      ]),
      width: 1e-10,
      height: 1e-10,
      spacing: { padding: 0, minPlotSize: 1e-12 },
    });
    expect(result.bars[0]!.width).toBeCloseTo(3.6e-11, 20);
    expect(result.bars[0]!.height).toBeCloseTo(1e-10, 20);
    expect(result.bars[0]!.x + result.bars[0]!.width).toBeLessThan(
      result.bars[1]!.x,
    );
  });
});
