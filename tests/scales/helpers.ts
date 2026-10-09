import { normalizeCartesian } from '../../src/core/data/cartesian';
import type { CartesianNormalizationInput } from '../../src/core/data/types';
import { calculateLinearXDomain } from '../../src/core/scales/cartesian';
import { createNumericScale } from '../../src/core/scales/numeric';
import type {
  ContinuousScaleResult,
  Interval,
} from '../../src/core/scales/types';
import type { NumericAxisConfig } from '../../src/types/contracts';

/** Untyped callers exercise invalid runtime fields without changing public contracts. */
export function normalized(
  data: readonly unknown[],
  xScale = 'category',
  series?: readonly { key: string }[],
) {
  return normalizeCartesian({
    data,
    xKey: 'x',
    xScale,
    ...(series ? { series } : { yKey: 'y' }),
  } as CartesianNormalizationInput<Record<string, number>>);
}
export function model(result: ReturnType<typeof normalized>) {
  if (result.status !== 'normalized')
    throw new Error('Expected normalized result');
  return result.data;
}
export function ready<V>(result: ContinuousScaleResult<V>) {
  if (result.status !== 'ready')
    throw new Error(`Expected ready scale: ${JSON.stringify(result)}`);
  return result;
}
export function linear(
  data: readonly unknown[],
  range: Interval<number> = [0, 100],
  axis: NumericAxisConfig = {},
) {
  const result = model(normalized(data, 'linear'));
  return createNumericScale(calculateLinearXDomain(result, axis), range, axis);
}
export function freezeDeep<T>(value: T): T {
  if (value && typeof value === 'object') {
    Object.values(value).forEach(freezeDeep);
    Object.freeze(value);
  }
  return value;
}
