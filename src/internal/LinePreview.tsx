'use client';

import { useId, useSyncExternalStore } from 'react';
import type {
  CartesianChartProps,
  CartesianValues,
  CartesianXScale,
  NumericAxisConfig,
} from '../types/contracts';
import { normalizeCartesian } from '../core/data/cartesian';
import { buildCartesianGeometry } from '../core/geometry/cartesian';
import { usableDimension } from './probe-layout';
import { useContainerWidth } from './use-container-width';
import { SvgFrame } from './svg/SvgFrame';
import { CartesianAxes, Gridlines } from './svg/CartesianAxes';
import { DataTable, SourceDataTable } from './svg/DataTable';
import { seriesColor, seriesLabel, visuallyHidden } from './svg/presentation';

/** Source-internal subset: deliberately excludes interaction and animation. */
export type LinePreviewProps<T extends object> = Omit<
  CartesianChartProps<T>,
  'animate' | 'tooltip' | 'onDataActivate'
> &
  CartesianValues<NoInfer<T>> &
  CartesianXScale<NoInfer<T>> & { yAxis?: NumericAxisConfig };

function Graphic<T extends object>({
  props,
  width,
  id,
}: {
  props: LinePreviewProps<T>;
  width: number | null;
  id: string;
}) {
  const mounted = useSyncExternalStore(
    subscribe,
    clientSnapshot,
    props.xScale === 'time' ? serverSnapshot : clientSnapshot,
  );
  const normalized = normalizeCartesian(props);
  const label = props.accessibility?.label?.trim() || 'Line chart preview';
  const height = props.height === undefined ? 280 : props.height;
  const invalidDimensions =
    !usableDimension(height) ||
    (typeof props.width === 'number' && !usableDimension(props.width));
  const pending =
    !invalidDimensions &&
    (width === null || (props.xScale === 'time' && !mounted));
  const xAxis =
    props.xScale === undefined || props.xScale === 'category'
      ? {
          ...props.xAxis,
          ...(props.xAxis?.formatTick === undefined && props.formatCategory
            ? { formatTick: props.formatCategory }
            : {}),
        }
      : props.xAxis;
  const geometry = pending
    ? null
    : buildCartesianGeometry({
        normalized,
        family: 'line',
        width: width ?? NaN,
        height,
        ...(xAxis === undefined ? {} : { xAxis }),
        ...(props.yAxis === undefined && props.formatValue === undefined
          ? {}
          : {
              yAxis: {
                ...props.yAxis,
                ...(props.yAxis?.formatTick === undefined && props.formatValue
                  ? { formatTick: props.formatValue }
                  : {}),
              },
            }),
        ...(props.showGrid === undefined ? {} : { showGrid: props.showGrid }),
      });
  const ready =
    !invalidDimensions &&
    geometry?.status === 'ready' &&
    geometry.family === 'line';
  return (
    <>
      {ready ? (
        <SvgFrame
          id={id}
          width={geometry.layout.width}
          height={geometry.layout.height}
          plot={geometry.plot}
          label={label}
          description={props.accessibility?.description}
          grid={<Gridlines lines={geometry.layout.gridlines} />}
          axes={<CartesianAxes layout={geometry.layout} />}
        >
          {geometry.series.map(({ series, runs, points }) => (
            <g
              key={series.key}
              data-series={series.key}
              stroke={seriesColor(series, props.colors)}
              fill={seriesColor(series, props.colors)}
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
        </SvgFrame>
      ) : (
        <div
          role="img"
          aria-labelledby={`${id}-title`}
          aria-describedby={
            props.accessibility?.description ? `${id}-description` : undefined
          }
          style={{
            height: usableDimension(height) ? height : 280,
            display: 'grid',
            placeContent: 'center',
          }}
        >
          <span id={`${id}-title`}>
            {label} —{' '}
            {pending
              ? 'awaiting chart measurement or client timezone.'
              : geometry?.status === 'empty' && !invalidDimensions
                ? 'No chart data.'
                : 'Chart rendering unavailable.'}
          </span>
          {props.accessibility?.description && (
            <span id={`${id}-description`} style={visuallyHidden}>
              {props.accessibility.description}
            </span>
          )}
        </div>
      )}
      {normalized.status === 'normalized' && (
        <>
          {props.showLegend !== false && normalized.data.series.length > 1 && (
            <ul
              aria-label="Chart series"
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: 16,
                listStyle: 'none',
                padding: 8,
                margin: 0,
              }}
            >
              {normalized.data.series.map((series) => (
                <li key={series.key}>
                  <span
                    aria-hidden="true"
                    style={{
                      display: 'inline-block',
                      width: 12,
                      height: 12,
                      marginRight: 6,
                      borderRadius: 3,
                      background: seriesColor(series, props.colors),
                    }}
                  />
                  {seriesLabel(series)}
                </li>
              ))}
            </ul>
          )}
          <DataTable
            model={normalized.data}
            label={label}
            visible={props.accessibility?.dataTable === 'visible'}
            formatCategory={props.formatCategory}
            formatValue={props.formatValue}
          />
        </>
      )}
      {normalized.status === 'invalid-configuration' && (
        <SourceDataTable
          data={props.data}
          label={label}
          visible={props.accessibility?.dataTable === 'visible'}
        />
      )}
    </>
  );
}
function Responsive<T extends object>({
  props,
  id,
}: {
  props: LinePreviewProps<T>;
  id: string;
}) {
  const { ref, width } = useContainerWidth();
  return (
    <div ref={ref} style={{ width: '100%', minWidth: 0 }}>
      <Graphic props={props} width={width} id={id} />
    </div>
  );
}
export function LinePreview<T extends object>(props: LinePreviewProps<T>) {
  const id = useId();
  return (
    <figure
      className={props.className}
      style={{
        margin: 0,
        position: 'relative',
        fontFamily: 'system-ui, sans-serif',
        color: 'var(--rsc-text-color, #182b38)',
        background: 'var(--rsc-background, #fff)',
        ...props.style,
        width: usableDimension(props.width)
          ? props.width
          : typeof props.width === 'string'
            ? props.width
            : '100%',
      }}
    >
      {typeof props.width === 'number' ? (
        <Graphic props={props} width={props.width} id={id} />
      ) : (
        <Responsive props={props} id={id} />
      )}
    </figure>
  );
}

const subscribe = () => () => {};
const clientSnapshot = () => true;
const serverSnapshot = () => false;
