'use client';

import { useId, useSyncExternalStore } from 'react';
import type {
  CartesianChartProps,
  CartesianValues,
  CartesianXScale,
  NumericAxisConfig,
  CategoryAxisConfig,
  LineChartProps,
  BarChartProps,
} from '../types/contracts';
import { normalizeCartesian } from '../core/data/cartesian';
import { buildCartesianGeometry } from '../core/geometry/cartesian';
import { usableDimension } from './probe-layout';
import { useContainerWidth } from './use-container-width';
import { LineMarks } from './svg/LineMarks';
import { BarMarks } from './svg/BarMarks';
import { AreaMarks } from './svg/AreaMarks';
import { SvgFrame } from './svg/SvgFrame';
import { CartesianAxes, Gridlines } from './svg/CartesianAxes';
import { DataTable, SourceDataTable } from './svg/DataTable';
import { CartesianPointInspection } from '../charts/CartesianPointInspection';
import { seriesColor, seriesLabel, visuallyHidden } from './svg/presentation';

/** Source-internal subset: deliberately excludes interaction and animation. */
export type LinePreviewProps<T extends object> = Omit<
  CartesianChartProps<T>,
  'animate' | 'tooltip' | 'onDataActivate'
> &
  CartesianValues<NoInfer<T>> &
  CartesianXScale<NoInfer<T>> & { yAxis?: NumericAxisConfig };

export type RendererProps<T extends object> =
  | (LineChartProps<T> & { interactive?: boolean; family?: 'line' | 'area' })
  | (BarChartProps<T> & { interactive?: boolean; family: 'bar' });

function Graphic<T extends object>({
  props,
  width,
  id,
}: {
  props: RendererProps<T>;
  width: number | null;
  id: string;
}) {
  const xScale = 'xScale' in props ? props.xScale : 'category';
  const mounted = useSyncExternalStore(
    subscribe,
    clientSnapshot,
    xScale === 'time' ? serverSnapshot : clientSnapshot,
  );
  // Physical Bar axes are irrelevant to semantic source normalization.
  const { xAxis: normalizationAxis, ...mapping } = props;
  void normalizationAxis;
  const normalized = normalizeCartesian<T>(mapping);
  const label =
    props.accessibility?.label?.trim() ||
    (props.family === 'bar'
      ? 'Bar chart'
      : props.family === 'area'
        ? 'Area chart'
        : props.interactive
          ? 'Line chart'
          : 'Line chart preview');
  const height = props.height === undefined ? 280 : props.height;
  const invalidDimensions =
    !usableDimension(height) ||
    (typeof props.width === 'number' && !usableDimension(props.width));
  const pending =
    !invalidDimensions && (width === null || (xScale === 'time' && !mounted));
  const categoryAxis = (axis: CategoryAxisConfig | undefined) => ({
    ...axis,
    ...(axis?.formatTick === undefined && props.formatCategory
      ? { formatTick: props.formatCategory }
      : {}),
  });
  const valueAxis = (axis: NumericAxisConfig | undefined) => ({
    ...axis,
    ...(axis?.formatTick === undefined && props.formatValue
      ? { formatTick: props.formatValue }
      : {}),
  });
  const common = {
    normalized,
    width: width ?? NaN,
    height,
    ...(props.showGrid === undefined ? {} : { showGrid: props.showGrid }),
  };
  const geometry = pending
    ? null
    : props.family === 'bar'
      ? props.orientation === 'horizontal'
        ? buildCartesianGeometry({
            ...common,
            family: 'bar',
            orientation: 'horizontal',
            xAxis: valueAxis(props.xAxis),
            yAxis: categoryAxis(props.yAxis),
          })
        : buildCartesianGeometry({
            ...common,
            family: 'bar',
            orientation: props.orientation ?? 'vertical',
            xAxis: categoryAxis(props.xAxis),
            yAxis: valueAxis(props.yAxis),
          })
      : buildCartesianGeometry({
          ...common,
          family: props.family ?? 'line',
          ...(props.xScale === undefined || props.xScale === 'category'
            ? { xAxis: categoryAxis(props.xAxis) }
            : props.xAxis === undefined
              ? {}
              : { xAxis: props.xAxis }),
          yAxis: valueAxis(props.yAxis),
        });
  const ready = !invalidDimensions && geometry?.status === 'ready';
  return (
    <>
      {ready ? (
        props.interactive ? (
          <CartesianPointInspection
            props={props}
            geometry={geometry}
            id={id}
            label={label}
          />
        ) : (
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
            {geometry.family === 'bar' ? (
              <BarMarks bars={geometry.bars} colors={props.colors} />
            ) : geometry.family === 'area' ? (
              <AreaMarks series={geometry.series} colors={props.colors} />
            ) : (
              <LineMarks series={geometry.series} colors={props.colors} />
            )}
          </SvgFrame>
        )
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
  props: RendererProps<T>;
  id: string;
}) {
  const { ref, width } = useContainerWidth();
  return (
    <div ref={ref} style={{ width: '100%', minWidth: 0 }}>
      <Graphic props={props} width={width} id={id} />
    </div>
  );
}
export function CartesianPointRenderer<T extends object>(
  props: RendererProps<T>,
) {
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
