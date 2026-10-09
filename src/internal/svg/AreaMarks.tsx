import type { SeriesGeometry } from '../../core/geometry/types';
import { seriesColor } from './presentation';
/** Exact core fill and boundary paths; closing walls/baseline have no stroke. */
export function AreaMarks<T>({
  series,
  colors,
}: {
  series: readonly SeriesGeometry<T>[];
  colors: readonly string[] | undefined;
}) {
  return (
    <>
      {series.map(({ series, runs, points }) => (
        <g
          key={series.key}
          data-series={series.key}
          fill={seriesColor(series, colors)}
          stroke={seriesColor(series, colors)}
        >
          {runs.map((run) => (
            <g key={run.startIndex}>
              {run.path !== null && (
                <path
                  data-area-fill=""
                  d={run.path}
                  fillOpacity={0.2}
                  stroke="none"
                />
              )}
              {run.outlinePath != null && (
                <path
                  data-area-boundary=""
                  d={run.outlinePath}
                  fill="none"
                  strokeWidth={2}
                  strokeLinejoin="round"
                />
              )}
            </g>
          ))}
          {points.map((point) => (
            <circle
              key={point.index}
              data-source-index={point.index}
              cx={point.x}
              cy={point.y}
              r={3.5}
              stroke="var(--rsc-background, #fff)"
              strokeWidth={1.5}
            />
          ))}
        </g>
      ))}
    </>
  );
}
