import { layoutCartesian } from '../layout/cartesian';
import { areaPath } from './area';
import { barGeometry, resolveBarSpacing } from './bar';
import { linePath } from './line';
import { mapSeries } from './points';
import type {
  CartesianGeometryInput,
  CartesianGeometryResult,
  GeometryDiagnostic,
  GeometryMarks,
  PointRun,
  SeriesGeometry,
} from './types';

/** Own the layout construction: unrelated normalized/layout pairs are never accepted. */
export function buildCartesianGeometry<T>(
  input: CartesianGeometryInput<T>,
): CartesianGeometryResult<T> {
  const layout = layoutCartesian(input);
  const metadata = {
    normalizationDiagnostics: input.normalized.diagnostics,
    layoutDiagnostics: layout.diagnostics,
  };
  const unusable = (
    diagnostics: readonly GeometryDiagnostic[],
  ): CartesianGeometryResult<T> => ({
    status: 'unusable',
    ...metadata,
    diagnostics,
  });
  if (layout.status === 'unusable')
    return unusable([
      {
        code: 'layout-unusable',
        description: 'Layout is unusable; inspect layoutDiagnostics.',
      },
    ]);
  const spacing = resolveBarSpacing(input.barSpacing);
  if (!spacing || (input.family !== 'bar' && input.barSpacing !== undefined))
    return unusable([
      {
        code: 'invalid-spacing',
        description:
          'Bar spacing is bar-only; groupRatio and slotRatio must be finite fractions in (0, 1].',
      },
    ]);
  let marks: GeometryMarks<T> =
    input.family === 'bar'
      ? {
          family: 'bar',
          orientation: input.orientation ?? 'vertical',
          bars: [],
        }
      : { family: input.family, series: [] };
  const finish = (
    count: number,
    requiresClipping: boolean,
  ): CartesianGeometryResult<T> => {
    const result = {
      ...metadata,
      ...marks,
      diagnostics: [],
      plot: layout.plot,
      zeroBaseline: layout.zeroBaseline,
      requiresClipping,
    };
    return count > 0 && layout.status === 'ready'
      ? { ...result, status: 'ready', layout }
      : { ...result, status: 'empty', layout };
  };
  // Layout has already rejected invalid normalization; retain that result contract.
  const normalized = input.normalized;
  if (normalized.status !== 'normalized')
    return unusable([
      {
        code: 'layout-unusable',
        description: 'Geometry requires normalized data.',
      },
    ]);
  const data = normalized.data;
  if (layout.status === 'empty') {
    if (input.family !== 'bar') {
      marks = {
        family: input.family,
        series: data.series.map((series) => ({
          series,
          points: [],
          runs: [],
          gaps: data.rows.map((row) => ({
            rowIndex: row.index,
            reason:
              row.x.status === 'valid' ? ('value' as const) : ('x' as const),
          })),
        })),
      };
    }
    return finish(0, false);
  }
  if (input.family === 'bar') {
    const calculated = barGeometry(data, layout, spacing);
    if (calculated.status === 'unusable')
      return unusable(calculated.diagnostics);
    marks = {
      family: 'bar',
      orientation: input.orientation ?? 'vertical',
      bars: calculated.data,
    };
    return finish(
      calculated.data.length,
      calculated.data.some((bar) => bar.outOfPlot),
    );
  }
  if (
    input.family === 'area' &&
    (!layout.zeroBaseline ||
      layout.zeroBaseline.axis !== 'y' ||
      !Number.isFinite(layout.zeroBaseline.position))
  )
    return unusable([
      {
        code: 'invalid-baseline',
        description: 'Area needs a finite physical Y zero baseline.',
      },
    ]);
  const seriesGeometry: SeriesGeometry<T>[] = [];
  let count = 0;
  let requiresClipping = false;
  for (const series of data.series) {
    const mapped = mapSeries(data, series, layout);
    if (mapped.status === 'unusable') return unusable(mapped.diagnostics);
    const runs: PointRun<T>[] = [];
    for (const points of mapped.data.runs) {
      const first = points[0];
      const last = points[points.length - 1];
      if (!first || !last) continue;
      let path: string | null = null;
      if (points.length > 1) {
        const generated =
          input.family === 'line'
            ? linePath(points)
            : areaPath(points, layout.zeroBaseline!.position);
        if (generated.status === 'unusable')
          return unusable(
            generated.diagnostics.map((issue) => ({
              ...issue,
              rowIndex: first.index,
              seriesIndex: series.index,
            })),
          );
        path = generated.data;
      }
      const outOfPlot = points.some((point) => point.outOfPlot);
      runs.push({
        points,
        startIndex: first.index,
        endIndex: last.index,
        path,
        outOfPlot,
      });
      requiresClipping ||= outOfPlot;
    }
    count += mapped.data.points.length;
    seriesGeometry.push({ series, ...mapped.data, runs });
  }
  marks = { family: input.family, series: seriesGeometry };
  return finish(count, requiresClipping);
}
