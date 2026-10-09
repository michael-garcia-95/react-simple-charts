import { scaleBand } from 'd3-scale';
import type { NormalizedCartesianData } from '../data/types';
import type { CategoryScaleResult, Interval, PositionResult } from './types';
import { unusable } from './types';
import { tickCount, validateRange } from './ticks';

export function createCategoryScale<T>(
  data: NormalizedCartesianData<T>,
  range: Interval<number>,
  requestedTickCount?: number,
): CategoryScaleResult {
  if (data.xScale !== 'category')
    return unusable(
      'incompatible-x-scale',
      'Category positioning requires category normalization.',
    );
  const rangeError = validateRange(range);
  if (rangeError) return rangeError;
  const count = tickCount(requestedTickCount);
  if (count.status === 'unusable') return count;
  // Invalid-X rows remain in data. Only eligible rows occupy bands.
  const categories = data.rows.flatMap((row) =>
    row.x.status === 'valid' ? [{ index: row.index, value: row.x.value }] : [],
  );
  if (!categories.length) return { status: 'empty', ticks: [] };
  const scale = scaleBand<number>()
    .domain(categories.map((row) => row.index))
    .range(range);
  const bandwidth = scale.bandwidth();
  if (!(bandwidth > 0) || !Number.isFinite(bandwidth))
    return unusable('unsafe-position', 'Category bandwidth is not usable.');
  const ticks = [];
  for (const category of categories) {
    const start = scale(category.index);
    if (
      start === undefined ||
      !Number.isFinite(start) ||
      !Number.isFinite(start + bandwidth / 2)
    )
      return unusable('unsafe-position', 'Category position is not finite.');
    ticks.push({ ...category, start, position: start + bandwidth / 2 });
  }
  const positions = new Map(ticks.map((tick) => [tick.index, tick.position]));
  const position = (sourceIndex: number): PositionResult => {
    const value = positions.get(sourceIndex);
    return value === undefined
      ? { status: 'unusable', reason: 'invalid-value' }
      : { status: 'mapped', position: value };
  };
  // Category ticks intentionally remain complete and ordered. Layout selects labels later.
  return { status: 'ready', ticks, bandwidth, position };
}
