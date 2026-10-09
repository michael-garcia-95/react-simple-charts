import type { NumericAxisConfig } from '../../types/contracts';
import type { DomainResult, Interval } from './types';
import { unusable } from './types';

/** One pass; no sorting, spread into Math.min, or overflow-prone arithmetic. */
export function extent(values: Iterable<number>): Interval<number> | null {
  let min = Infinity;
  let max = -Infinity;
  for (const value of values) {
    if (!Number.isFinite(value)) continue;
    if (value < min) min = value;
    if (value > max) max = value;
  }
  return min === Infinity ? null : [min, max];
}

export function numericDomain(
  observed: Interval<number> | null,
  axis: NumericAxisConfig = {},
  zeroBaseline = false,
): DomainResult<number> {
  const { min, max } = axis;
  if (
    (min !== undefined && !Number.isFinite(min)) ||
    (max !== undefined && !Number.isFinite(max)) ||
    (min !== undefined && max !== undefined && min >= max)
  )
    return unusable(
      'invalid-bounds',
      'Numeric bounds must be finite and min < max.',
    );
  if (
    zeroBaseline &&
    ((min !== undefined && min > 0) || (max !== undefined && max < 0))
  )
    return unusable(
      'zero-baseline-conflict',
      'Bar/Area numeric bounds must retain zero.',
    );

  const automatic = observed ?? [0, 1];
  let lower = zeroBaseline ? Math.min(0, automatic[0]) : automatic[0];
  let upper = zeroBaseline ? Math.max(0, automatic[1]) : automatic[1];
  lower = min ?? lower;
  upper = max ?? upper;
  if (lower > upper)
    return unusable(
      'invalid-bounds',
      'Explicit bounds conflict with the automatic domain.',
    );
  const expanded = lower === upper;
  if (expanded) {
    const delta =
      lower === 0 ? 1 : Math.max(Math.abs(lower) * 0.01, Number.MIN_VALUE);
    // Preserve explicit sides. At finite boundaries expand only inward.
    const below = lower - delta;
    const above = upper + delta;
    if (min === undefined && Number.isFinite(below)) lower = below;
    if (max === undefined && Number.isFinite(above)) upper = above;
  }
  if (!(lower < upper) || !Number.isFinite(upper - lower))
    return unusable(
      'unsafe-domain',
      'Domain cannot be safely interpolated by a continuous D3 scale.',
    );
  return {
    status: 'ready',
    observed,
    domain: [lower, upper],
    origin:
      min !== undefined || max !== undefined
        ? 'override'
        : observed
          ? 'data'
          : 'fallback',
    expanded,
    zeroBaseline,
    overridden: { min: min !== undefined, max: max !== undefined },
  };
}

export const DATE_LIMIT = 8_640_000_000_000_000;

export function temporalDomain(
  observed: Interval<Date> | null,
): DomainResult<Date> {
  let lower = observed ? Date.prototype.getTime.call(observed[0]) : 0;
  let upper = observed ? Date.prototype.getTime.call(observed[1]) : 86_400_000;
  const expanded = lower === upper;
  if (expanded) {
    lower = Math.max(-DATE_LIMIT, lower - 1);
    upper = Math.min(DATE_LIMIT, upper + 1);
  }
  if (!Number.isFinite(lower) || !Number.isFinite(upper) || lower >= upper)
    return unusable(
      'unsafe-domain',
      'Temporal domain is outside the supported Date interval.',
    );
  return {
    status: 'ready',
    observed,
    domain: [new Date(lower), new Date(upper)],
    origin: observed ? 'data' : 'fallback',
    expanded,
    zeroBaseline: false,
    overridden: { min: false, max: false },
  };
}
