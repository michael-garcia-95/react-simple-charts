import type { LayoutTick, PhysicalOrientation } from './types';

/** Linear scan in candidate order. Reserve last first only if it fits with first. */
export function selectTicks<V>(
  ticks: readonly LayoutTick<V>[],
  orientation: PhysicalOrientation,
  lower: number,
  upper: number,
  crossSpace: number,
  gap: number,
): readonly LayoutTick<V>[] {
  const intervals = ticks.map((tick) => {
    const half =
      (orientation === 'horizontal'
        ? tick.estimatedWidth
        : tick.estimatedHeight) / 2;
    const cross =
      orientation === 'horizontal' ? tick.estimatedHeight : tick.estimatedWidth;
    return {
      start: tick.position - half,
      end: tick.position + half,
      fits:
        tick.label.length > 0 &&
        cross <= crossSpace &&
        tick.position - half >= lower &&
        tick.position + half <= upper,
    };
  });
  const chosen = new Set<number>();
  let first = -1;
  for (let index = 0; index < intervals.length; index++) {
    if (intervals[index]!.fits) {
      first = index;
      break;
    }
  }
  if (first < 0) return ticks.map((tick) => ({ ...tick, selected: false }));
  const separates = (a: number, b: number) => {
    const left = intervals[a]!;
    const right = intervals[b]!;
    return left.end + gap <= right.start || right.end + gap <= left.start;
  };
  chosen.add(first);
  const last = ticks.length - 1;
  const reserveLast =
    last !== first && intervals[last]!.fits && separates(first, last);
  if (reserveLast) chosen.add(last);
  let previous = first;
  for (let index = first + 1; index < ticks.length; index++) {
    if (index === last && reserveLast) continue;
    if (
      intervals[index]!.fits &&
      separates(previous, index) &&
      (!reserveLast || separates(index, last))
    ) {
      chosen.add(index);
      previous = index;
    }
  }
  return ticks.map((tick, index) => ({ ...tick, selected: chosen.has(index) }));
}
