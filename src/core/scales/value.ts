import type { NumericAxisConfig } from '../../types/contracts';
import type { NormalizedCartesianData } from '../data/types';
import { extent, numericDomain } from './domains';
import type { ChartFamily, DomainResult } from './types';

export function calculateValueDomain<T>(
  data: NormalizedCartesianData<T>,
  family: ChartFamily,
  axis: NumericAxisConfig = {},
): DomainResult<number> {
  function* values() {
    for (const row of data.rows) {
      if (row.x.status !== 'valid') continue;
      for (let index = 0; index < data.series.length; index++) {
        const value = row.values[index];
        if (value?.status === 'valid') yield value.value;
      }
    }
  }
  return numericDomain(extent(values()), axis, family !== 'line');
}
