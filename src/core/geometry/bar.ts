import type { NormalizedCartesianData } from '../data/types';
import { mapCartesianPoint } from './points';
import type {
  BarRectangle,
  BarSpacing,
  GeometryCalculation,
  ReadyLayout,
} from './types';
import { failure, outsidePlot } from './validation';

export function resolveBarSpacing(
  spacing: BarSpacing = {},
): { readonly groupRatio: number; readonly slotRatio: number } | null {
  if (typeof spacing !== 'object' || spacing === null || Array.isArray(spacing))
    return null;
  const groupRatio = spacing.groupRatio ?? 0.8;
  const slotRatio = spacing.slotRatio ?? 0.9;
  // Explicit null is invalid, rather than an omitted setting.
  if ([spacing.groupRatio, spacing.slotRatio].some((value) => value === null))
    return null;
  return [groupRatio, slotRatio].every(
    (value) =>
      typeof value === 'number' &&
      Number.isFinite(value) &&
      value > 0 &&
      value <= 1,
  )
    ? { groupRatio, slotRatio }
    : null;
}

export function barGeometry<T>(
  data: NormalizedCartesianData<T>,
  layout: ReadyLayout,
  spacing: { readonly groupRatio: number; readonly slotRatio: number },
): GeometryCalculation<readonly BarRectangle<T>[]> {
  const scale = layout.scales.semanticX;
  const baseline = layout.zeroBaseline;
  if (
    scale.kind !== 'category' ||
    !baseline ||
    !Number.isFinite(baseline.position)
  )
    return failure(
      'invalid-baseline',
      'Bar needs category bands and a finite zero baseline.',
    );
  const horizontal = baseline.axis === 'x';
  const bars: BarRectangle<T>[] = [];
  // Category ticks carry lower band edges; indexing keeps this traversal linear.
  const bands = new Map(scale.ticks.map((tick) => [tick.index, tick.start]));
  for (const row of data.rows) {
    if (row.x.status !== 'valid') continue;
    const bandStart = bands.get(row.index);
    if (bandStart === undefined)
      return failure('unsafe-slot', 'Source category has no band.', {
        rowIndex: row.index,
      });
    const bandEnd = bandStart + scale.bandwidth;
    const groupStart =
      bandStart + (scale.bandwidth * (1 - spacing.groupRatio)) / 2;
    const groupWidth = scale.bandwidth * spacing.groupRatio;
    const slotWidth = groupWidth / data.series.length;
    let previousEnd = bandStart;
    for (const series of data.series) {
      const slotStart = groupStart + slotWidth * series.index;
      const slotEnd = groupStart + slotWidth * (series.index + 1);
      const inset = (slotWidth * (1 - spacing.slotRatio)) / 2;
      const start = slotStart + inset;
      const end = slotEnd - inset;
      const size = end - start;
      if (
        ![bandEnd, slotWidth, slotStart, slotEnd, start, end, size].every(
          Number.isFinite,
        ) ||
        slotWidth <= 0 ||
        size <= 0 ||
        start < slotStart ||
        end > slotEnd ||
        slotStart < previousEnd ||
        slotStart < bandStart ||
        slotEnd > bandEnd ||
        start + size > slotEnd
      )
        return failure(
          'unsafe-slot',
          'Grouped category slots are too small or numerically unsafe.',
          { rowIndex: row.index, seriesIndex: series.index },
        );
      previousEnd = slotEnd;
      const mapped = mapCartesianPoint(row, series, layout);
      if (mapped.status === 'unusable') return mapped;
      if (mapped.status === 'gap') continue;
      const point = mapped.data;
      const numerical = horizontal ? point.x : point.y;
      const length = Math.abs(numerical - baseline.position);
      const origin = Math.min(numerical, baseline.position);
      const rectangle = horizontal
        ? { x: origin, y: start, width: length, height: size }
        : { x: start, y: origin, width: size, height: length };
      if (
        ![
          ...Object.values(rectangle),
          rectangle.x + rectangle.width,
          rectangle.y + rectangle.height,
        ].every(Number.isFinite)
      )
        return failure(
          'unsafe-mapping',
          'Bar rectangle arithmetic is not finite.',
          { rowIndex: row.index, seriesIndex: series.index },
        );
      bars.push({
        ...point,
        ...rectangle,
        baseline: baseline.position,
        slot: { start: slotStart, end: slotEnd },
        outOfPlot:
          outsidePlot(rectangle.x, rectangle.y, layout.plot) ||
          outsidePlot(
            rectangle.x + rectangle.width,
            rectangle.y + rectangle.height,
            layout.plot,
          ),
      });
    }
  }
  return { status: 'ready', data: bars };
}
