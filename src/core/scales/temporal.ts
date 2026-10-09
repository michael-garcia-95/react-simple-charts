import { scaleTime, scaleUtc } from 'd3-scale';
import type { DateAxisConfig } from '../../types/contracts';
import type { NormalizedCartesianData } from '../data/types';
import type { ContinuousScaleResult, Interval, PositionResult } from './types';
import { unusable } from './types';
import { temporalDomain } from './domains';
import { tickCount, validateRange } from './ticks';

/** Native Date reads support cross-realm Dates and bypass overridden valueOf. */
function timestamp(value: Date): number {
  try {
    return Date.prototype.getTime.call(value);
  } catch {
    return NaN;
  }
}

export function createTemporalScale<T>(
  data: NormalizedCartesianData<T>,
  range: Interval<number>,
  axis: DateAxisConfig = {},
): ContinuousScaleResult<Date> {
  if (data.xScale !== 'utc' && data.xScale !== 'time')
    return unusable(
      'incompatible-x-scale',
      'Temporal positioning requires utc/time normalization.',
    );
  let earliest: Date | undefined;
  let latest: Date | undefined;
  for (const row of data.rows) {
    if (row.x.status !== 'valid' || typeof row.x.value !== 'object') continue;
    const value = row.x.value;
    const time = timestamp(value);
    if (!Number.isFinite(time)) continue;
    if (!earliest || time < timestamp(earliest)) earliest = value;
    if (!latest || time > timestamp(latest)) latest = value;
  }
  const domain = temporalDomain(earliest && latest ? [earliest, latest] : null);
  if (domain.status === 'unusable') return domain;
  const rangeError = validateRange(range);
  if (rangeError) return rangeError;
  const count = tickCount(axis.tickCount);
  if (count.status === 'unusable') return count;
  if (!domain.observed) return { status: 'empty', domain, ticks: [] };
  const scale = (data.xScale === 'utc' ? scaleUtc() : scaleTime())
    .domain(domain.domain.map(timestamp))
    .range(range);
  const map = (value: Date): PositionResult => {
    const time = timestamp(value);
    if (!Number.isFinite(time))
      return { status: 'unusable', reason: 'invalid-value' };
    const position = scale(time);
    return Number.isFinite(position)
      ? { status: 'mapped', position }
      : { status: 'unusable', reason: 'unsafe-position' };
  };
  const [lower, upper] = domain.domain.map(timestamp);
  if (lower === undefined || upper === undefined)
    return unusable('unsafe-domain', 'Temporal endpoints are absent.');
  let values = scale.ticks(count.count).filter((value) => {
    const time = timestamp(value);
    return Number.isFinite(time) && time >= lower && time <= upper;
  });
  if (!values.length)
    values = domain.domain.map((value) => new Date(timestamp(value)));
  const ticks = [];
  for (const value of values) {
    const position = map(value);
    if (position.status === 'unusable')
      return unusable(
        'unsafe-position',
        'D3 cannot map a temporal tick safely.',
      );
    ticks.push({ value, position: position.position });
  }
  return { status: 'ready', domain, ticks, map };
}
