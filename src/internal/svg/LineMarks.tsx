import type { SeriesGeometry } from '../../core/geometry/types';
import { seriesColor } from './presentation';

/** Decorative marks only; point identity/coordinates come directly from geometry. */
export function LineMarks<T>({
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
          stroke={seriesColor(series, colors)}
          fill={seriesColor(series, colors)}
        >
          {runs.map(
            (run) =>
              run.path !== null && (
                <path
                  key={run.startIndex}
                  d={run.path}
                  fill="none"
                  strokeWidth={2}
                  strokeLinejoin="round"
                />
              ),
          )}
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
