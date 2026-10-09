import { scaleLinear } from 'd3-scale';
import type { NumericAxisConfig } from '../../types/contracts';
import type {
  ContinuousScaleResult,
  DomainResult,
  Interval,
  PositionResult,
} from './types';
import { unusable } from './types';
import { numericTicks, tickCount, validateRange } from './ticks';

export function createNumericScale(
  domain: DomainResult<number>,
  range: Interval<number>,
  axis: NumericAxisConfig = {},
): ContinuousScaleResult<number> {
  if (domain.status === 'unusable') return domain;
  const rangeError = validateRange(range);
  if (rangeError) return rangeError;
  const count = tickCount(axis.tickCount);
  if (count.status === 'unusable') return count;
  if (!domain.observed) return { status: 'empty', domain, ticks: [] };
  const scale = scaleLinear().domain(domain.domain).range(range);
  const map = (value: number): PositionResult => {
    if (typeof value !== 'number' || !Number.isFinite(value))
      return { status: 'unusable', reason: 'invalid-value' };
    const position = scale(value);
    return Number.isFinite(position)
      ? { status: 'mapped', position }
      : { status: 'unusable', reason: 'unsafe-position' };
  };
  // Verify ordinary interpolation before exposing the mapping closure.
  const [lower, upper] = domain.domain;
  for (const value of [lower, lower + (upper - lower) / 2, upper]) {
    if (map(value).status === 'unusable')
      return unusable(
        'unsafe-position',
        'D3 cannot map this domain/range safely.',
      );
  }
  const ticks = [];
  for (const value of numericTicks(
    () => scale.ticks(count.count),
    domain.domain,
  )) {
    const position = map(value);
    if (position.status === 'unusable')
      return unusable(
        'unsafe-position',
        'D3 cannot map a numeric tick safely.',
      );
    ticks.push({ value, position: position.position });
  }
  return { status: 'ready', domain, ticks, map };
}
