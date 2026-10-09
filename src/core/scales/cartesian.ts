import type {
  CategoryAxisConfig,
  DateAxisConfig,
  NumericAxisConfig,
} from '../../types/contracts';
import type {
  NormalizationResult,
  NormalizedCartesianData,
} from '../data/types';
import { createCategoryScale } from './category';
import { extent, numericDomain } from './domains';
import { createNumericScale } from './numeric';
import { createTemporalScale } from './temporal';
import type {
  ChartFamily,
  ContinuousScaleResult,
  DomainResult,
  Interval,
  XScaleResult,
} from './types';
import { unusable } from './types';
import { calculateValueDomain } from './value';

export function calculateLinearXDomain<T>(
  data: NormalizedCartesianData<T>,
  axis: NumericAxisConfig = {},
): DomainResult<number> {
  if (data.xScale !== 'linear')
    return unusable(
      'incompatible-x-scale',
      'Linear X requires linear normalization.',
    );
  function* values() {
    for (const row of data.rows)
      if (row.x.status === 'valid' && typeof row.x.value === 'number')
        yield row.x.value;
  }
  return numericDomain(extent(values()), axis);
}

/** Construction boundary accepts the result union, never treating configuration errors as empty data. */
export function createXScale<T>(
  result: NormalizationResult<NormalizedCartesianData<T>>,
  range: Interval<number>,
  axis: NumericAxisConfig | DateAxisConfig | CategoryAxisConfig = {},
): XScaleResult {
  if (result.status === 'invalid-configuration')
    return unusable(
      'invalid-normalization',
      'Fix normalization configuration before constructing scales.',
    );
  const { data } = result;
  // Read calculation options only; no caller formatter is invoked or retained.
  const calculation: Pick<NumericAxisConfig, 'min' | 'max' | 'tickCount'> = {};
  if (axis.tickCount !== undefined) calculation.tickCount = axis.tickCount;
  if ('min' in axis && axis.min !== undefined) calculation.min = axis.min;
  if ('max' in axis && axis.max !== undefined) calculation.max = axis.max;
  switch (data.xScale) {
    case 'category':
      return {
        kind: 'category' as const,
        ...createCategoryScale(data, range, axis.tickCount),
      };
    case 'linear':
      return {
        kind: 'linear' as const,
        ...createNumericScale(
          calculateLinearXDomain(data, calculation),
          range,
          calculation,
        ),
      };
    case 'utc':
    case 'time':
      return {
        kind: data.xScale,
        ...createTemporalScale(data, range, calculation),
      };
  }
}

export function createValueScale<T>(
  result: NormalizationResult<NormalizedCartesianData<T>>,
  family: ChartFamily,
  range: Interval<number>,
  axis: NumericAxisConfig = {},
): ContinuousScaleResult<number> {
  if (result.status === 'invalid-configuration')
    return unusable(
      'invalid-normalization',
      'Fix normalization configuration before constructing scales.',
    );
  return createNumericScale(
    calculateValueDomain(result.data, family, axis),
    range,
    axis,
  );
}
