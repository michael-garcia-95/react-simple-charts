import type { AxisLayout, Gridline } from '../../core/layout/types';
import type { ReadyLayout } from '../../core/geometry/types';
import { DEFAULT_SPACING as spacing } from '../../core/layout/bounds';

export function Gridlines({ lines }: { lines: readonly Gridline[] }) {
  return lines.map((line, index) => (
    <line
      key={index}
      x1={line.orientation === 'horizontal' ? line.start : line.position}
      x2={line.orientation === 'horizontal' ? line.end : line.position}
      y1={line.orientation === 'horizontal' ? line.position : line.start}
      y2={line.orientation === 'horizontal' ? line.position : line.end}
      stroke="var(--rsc-grid-color, #e5e7eb)"
      strokeWidth={1}
    />
  ));
}
function Axis({ axis, layout }: { axis: AxisLayout; layout: ReadyLayout }) {
  const horizontal = axis.orientation === 'horizontal';
  const { plot } = layout;
  // Titles use only the reserved outer strip and a conservative one-em estimate.
  const titleFits =
    axis.label &&
    !/[\r\n\t]/.test(axis.label) &&
    axis.label.length * spacing.titleFontSize <=
      (horizontal ? plot.width : plot.height);
  return (
    <g data-axis={horizontal ? 'x' : 'y'}>
      <line
        x1={horizontal ? plot.left : axis.coordinate}
        x2={horizontal ? plot.right : axis.coordinate}
        y1={horizontal ? axis.coordinate : plot.top}
        y2={horizontal ? axis.coordinate : plot.bottom}
        stroke="var(--rsc-axis-color, #94a3b8)"
      />
      {axis.visibleTicks.map((tick, index) => (
        <g key={tick.index ?? index}>
          <line
            x1={
              horizontal ? tick.position : axis.coordinate - spacing.tickLength
            }
            x2={horizontal ? tick.position : axis.coordinate}
            y1={horizontal ? axis.coordinate : tick.position}
            y2={
              horizontal ? axis.coordinate + spacing.tickLength : tick.position
            }
            stroke="var(--rsc-axis-color, #94a3b8)"
          />
          <text
            x={
              horizontal
                ? tick.position
                : axis.coordinate - spacing.tickLength - spacing.gap
            }
            y={
              horizontal
                ? axis.coordinate + spacing.tickLength + spacing.gap
                : tick.position
            }
            dominantBaseline={horizontal ? 'hanging' : 'middle'}
            textAnchor={horizontal ? 'middle' : 'end'}
            fontSize={spacing.tickFontSize}
            fill="currentColor"
          >
            {tick.label}
          </text>
        </g>
      ))}
      {titleFits && (
        <text
          fontSize={spacing.titleFontSize}
          fill="currentColor"
          textAnchor="middle"
          x={
            horizontal
              ? (plot.left + plot.right) / 2
              : spacing.padding + spacing.titleFontSize / 2
          }
          y={
            horizontal
              ? layout.height - spacing.padding
              : (plot.top + plot.bottom) / 2
          }
          transform={
            horizontal
              ? undefined
              : `rotate(-90 ${spacing.padding + spacing.titleFontSize / 2} ${(plot.top + plot.bottom) / 2})`
          }
        >
          {axis.label}
        </text>
      )}
    </g>
  );
}
export function CartesianAxes({ layout }: { layout: ReadyLayout }) {
  return (
    <>
      {layout.axes.x && <Axis axis={layout.axes.x} layout={layout} />}
      {layout.axes.y && <Axis axis={layout.axes.y} layout={layout} />}
    </>
  );
}
