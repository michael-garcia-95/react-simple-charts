'use client';
import { useId } from 'react';
import type { PieChartProps } from '../types/contracts';
import { normalizeSegments } from '../core/data/segments';
import { buildPolarGeometry } from '../core/geometry/polar';
import { usableDimension } from './probe-layout';
import { useContainerWidth } from './use-container-width';
import { SegmentDataTable, SourceDataTable } from './svg/DataTable';
import { indexedColor, visuallyHidden } from './svg/presentation';
import { segmentLabel } from './svg/PolarMarks';
import { PolarSegmentInspection } from '../charts/PolarSegmentInspection';
function Graphic<T extends object>({
  props,
  width,
  id,
}: {
  props: PieChartProps<T>;
  width: number | null;
  id: string;
}) {
  const normalized = normalizeSegments(props);
  const height = props.height === undefined ? 280 : props.height;
  const label = props.accessibility?.label?.trim() || 'Pie chart';
  const invalid =
    !usableDimension(height) ||
    (typeof props.width === 'number' && !usableDimension(props.width));
  const pending = !invalid && width === null;
  const geometry = pending
    ? null
    : buildPolarGeometry({
        normalized,
        family: 'pie',
        width: width ?? NaN,
        height,
      });
  return (
    <>
      {!invalid && geometry?.status === 'ready' ? (
        <PolarSegmentInspection
          props={props}
          geometry={geometry}
          id={id}
          label={label}
        />
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
              ? 'awaiting chart measurement.'
              : !invalid && geometry?.status === 'empty'
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
      {props.showLegend !== false && geometry?.status === 'ready' && (
        <ul
          aria-label="Chart segments"
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 16,
            listStyle: 'none',
            padding: 8,
            margin: 0,
          }}
        >
          {geometry.slices.map((slice) => (
            <li
              key={slice.segmentId}
              style={{
                minWidth: 0,
                overflowWrap: 'anywhere',
                maxWidth: '100%',
              }}
            >
              <span
                aria-hidden="true"
                style={{
                  display: 'inline-block',
                  width: 12,
                  height: 12,
                  marginRight: 6,
                  borderRadius: 3,
                  background: indexedColor(slice.index, props.colors),
                }}
              />
              {segmentLabel(slice.label)}
            </li>
          ))}
        </ul>
      )}
      {normalized.status === 'normalized' ? (
        <SegmentDataTable
          model={normalized.data}
          label={label}
          visible={props.accessibility?.dataTable === 'visible'}
          formatValue={props.formatValue}
        />
      ) : (
        <div
          style={
            props.accessibility?.dataTable === 'visible'
              ? undefined
              : visuallyHidden
          }
        >
          <SourceDataTable
            data={props.data}
            label={label}
            visible={props.accessibility?.dataTable === 'visible'}
          />
        </div>
      )}
    </>
  );
}
function Responsive<T extends object>({
  props,
  id,
}: {
  props: PieChartProps<T>;
  id: string;
}) {
  const { ref, width } = useContainerWidth();
  return (
    <div ref={ref} style={{ width: '100%', minWidth: 0 }}>
      <Graphic props={props} width={width} id={id} />
    </div>
  );
}
export function PolarRenderer<T extends object>(props: PieChartProps<T>) {
  const id = useId();
  return (
    <figure
      className={props.className}
      style={{
        margin: 0,
        position: 'relative',
        maxWidth: '100%',
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
