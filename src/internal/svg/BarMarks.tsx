import type { BarRectangle } from '../../core/geometry/types';
import { seriesColor } from './presentation';
/** Decorative data rectangles retain exact core coordinates, including zero extent. */
export function BarMarks<T>({
  bars,
  colors,
}: {
  bars: readonly BarRectangle<T>[];
  colors: readonly string[] | undefined;
}) {
  return (
    <>
      {bars.map((bar) => (
        <rect
          key={`${bar.index}:${bar.seriesIndex}`}
          data-bar=""
          data-series={bar.seriesKey}
          data-source-index={bar.index}
          x={bar.x}
          y={bar.y}
          width={bar.width}
          height={bar.height}
          fill={seriesColor(bar.series, colors)}
          stroke="none"
        />
      ))}
    </>
  );
}
