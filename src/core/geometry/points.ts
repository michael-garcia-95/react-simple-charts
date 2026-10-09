import type {
  NormalizedCartesianData,
  NormalizedCartesianRow,
  NormalizedSeries,
} from '../data/types';
import type { PositionResult } from '../scales/types';
import type {
  CartesianPoint,
  GeometryCalculation,
  GeometryGap,
  ReadyLayout,
} from './types';
import { failure, outsidePlot } from './validation';

export type PointMapping<T> =
  | GeometryCalculation<CartesianPoint<T>>
  | { readonly status: 'gap'; readonly gap: GeometryGap };

/** Map semantic coordinates once, then dispatch to the physical orientation. */
export function mapCartesianPoint<T>(
  row: NormalizedCartesianRow<T>,
  series: NormalizedSeries,
  layout: ReadyLayout,
): PointMapping<T> {
  if (row.x.status !== 'valid')
    return { status: 'gap', gap: { rowIndex: row.index, reason: 'x' } };
  const value = row.values[series.index];
  if (!value || value.status !== 'valid')
    return { status: 'gap', gap: { rowIndex: row.index, reason: 'value' } };
  const xScale = layout.scales.semanticX;
  let category: PositionResult;
  switch (xScale.kind) {
    case 'category':
      category = xScale.position(row.index);
      break;
    case 'linear':
      category =
        typeof row.x.value === 'number'
          ? xScale.map(row.x.value)
          : { status: 'unusable', reason: 'invalid-value' };
      break;
    case 'utc':
    case 'time':
      category =
        typeof row.x.value === 'object'
          ? xScale.map(row.x.value)
          : { status: 'unusable', reason: 'invalid-value' };
      break;
  }
  const numerical = layout.scales.value.map(value.value);
  if (
    category.status !== 'mapped' ||
    numerical.status !== 'mapped' ||
    !Number.isFinite(category.position) ||
    !Number.isFinite(numerical.position)
  )
    return failure(
      'unsafe-mapping',
      'A valid source datum did not map to finite coordinates.',
      { rowIndex: row.index, seriesIndex: series.index },
    );
  const horizontal = layout.assignments.x.semantic === 'value';
  const x = horizontal ? numerical.position : category.position;
  const y = horizontal ? category.position : numerical.position;
  return {
    status: 'ready',
    data: {
      record: row.record,
      index: row.index,
      category: row.x.value,
      value: value.value,
      seriesKey: series.key,
      seriesIndex: series.index,
      series,
      x,
      y,
      outOfPlot: outsidePlot(x, y, layout.plot),
    },
  };
}

export function mapSeries<T>(
  data: NormalizedCartesianData<T>,
  series: NormalizedSeries,
  layout: ReadyLayout,
): GeometryCalculation<{
  readonly points: readonly CartesianPoint<T>[];
  readonly runs: readonly (readonly CartesianPoint<T>[])[];
  readonly gaps: readonly GeometryGap[];
}> {
  const points: CartesianPoint<T>[] = [];
  const runs: CartesianPoint<T>[][] = [];
  const gaps: GeometryGap[] = [];
  let current: CartesianPoint<T>[] | undefined;
  for (const row of data.rows) {
    const mapped = mapCartesianPoint(row, series, layout);
    if (mapped.status === 'unusable') return mapped;
    if (mapped.status === 'gap') {
      gaps.push(mapped.gap);
      current = undefined;
      continue;
    }
    if (!current) {
      current = [];
      runs.push(current);
    }
    current.push(mapped.data);
    points.push(mapped.data);
  }
  return { status: 'ready', data: { points, runs, gaps } };
}
