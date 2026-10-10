import type { PolarSlice } from '../../core/geometry/polar-types';
import { display } from './DataTable';
import { indexedColor } from './presentation';
export function segmentLabel(value: PolarSlice<unknown>['label']) {
  return display({ status: 'valid', value, raw: value, present: true });
}
export function labelPosition(slice: PolarSlice<unknown>) {
  const angle = (slice.startAngle + slice.endAngle) / 2;
  const radius =
    slice.innerRadius > 0
      ? (slice.innerRadius + slice.outerRadius) / 2
      : slice.outerRadius * 0.6;
  return { x: Math.sin(angle) * radius, y: -Math.cos(angle) * radius };
}
export function PolarMarks<T>({
  slices,
  colors,
  showLabels,
}: {
  slices: readonly PolarSlice<T>[];
  colors: readonly string[] | undefined;
  showLabels: boolean;
}) {
  return (
    <>
      {slices.map((slice) => {
        const text = segmentLabel(slice.label);
        const position = labelPosition(slice);
        // Conservative estimated text box, bounded to a short interior label.
        // No collision detection or DOM measurement is claimed.
        const pieFits =
          slice.angularSpan >= 0.5 &&
          slice.outerRadius >= 48 &&
          text.length <= 18 &&
          text.length * 7 <=
            Math.min(
              slice.outerRadius * 0.8,
              2 *
                slice.outerRadius *
                0.6 *
                Math.sin(Math.min(slice.angularSpan, Math.PI) / 2),
            );
        const radius = (slice.innerRadius + slice.outerRadius) / 2;
        const halfWidth = (text.length * 7) / 2 + 3;
        const halfHeight = 10;
        const donutFits =
          slice.angularSpan >= 0.5 &&
          text.length <= 18 &&
          radius - Math.hypot(halfWidth, halfHeight) > slice.innerRadius &&
          radius + Math.hypot(halfWidth, halfHeight) < slice.outerRadius &&
          Math.hypot(halfWidth, halfHeight) <
            radius * Math.sin(Math.min(slice.angularSpan, Math.PI) / 2);
        const fits = slice.innerRadius > 0 ? donutFits : pieFits;
        return (
          <g
            key={slice.segmentId}
            transform={`translate(${slice.centerX} ${slice.centerY})`}
          >
            <path
              d={slice.path}
              fill={indexedColor(slice.index, colors)}
              stroke="var(--rsc-background, #fff)"
              strokeWidth={1}
            />
            {showLabels && fits && (
              <text
                x={position.x}
                y={position.y}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize={12}
                paintOrder="stroke"
                stroke="var(--rsc-text-color, #182b38)"
                strokeWidth={3}
                strokeLinejoin="round"
                fill="var(--rsc-background, #fff)"
              >
                {text}
              </text>
            )}
          </g>
        );
      })}
    </>
  );
}
