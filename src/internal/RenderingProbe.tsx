'use client';

import { useId, useState } from 'react';
import type { CSSProperties } from 'react';
import type { AccessibilityOptions } from '../types/contracts';
import { probeData, probeLayout, usableDimension } from './probe-layout';
import { useContainerWidth } from './use-container-width';

const visuallyHidden: CSSProperties = {
  position: 'absolute',
  width: 1,
  height: 1,
  padding: 0,
  margin: -1,
  overflow: 'hidden',
  clipPath: 'inset(50%)',
  whiteSpace: 'nowrap',
  border: 0,
};

type ProbeStyle = CSSProperties & {
  [variable: `--rsc-${string}`]: string | number;
};

/** Internal architecture fixture, deliberately unrelated to the LineChart API. */
export interface RenderingProbeProps {
  width?: number | string;
  height?: number;
  color?: string;
  style?: ProbeStyle;
  accessibility?: AccessibilityOptions;
}

interface GraphicProps {
  width: number | null;
  height: number;
  id: string;
  label: string;
  description: string | undefined;
  color: string | undefined;
}

function Graphic({
  width,
  height,
  id,
  label,
  description,
  color,
}: GraphicProps) {
  const descriptionId = description ? `${id}-description` : undefined;
  if (width === null) {
    return (
      <div
        role="img"
        aria-labelledby={`${id}-title`}
        aria-describedby={descriptionId}
        style={{ height, display: 'grid', placeContent: 'center' }}
      >
        <span id={`${id}-title`}>
          {label} — awaiting container measurement.
        </span>
        {description && (
          <span id={descriptionId} style={visuallyHidden}>
            {description}
          </span>
        )}
        <span aria-hidden="true">
          Chart data is available in the accompanying table.
        </span>
      </div>
    );
  }

  return (
    <SvgGraphic
      width={width}
      height={height}
      id={id}
      label={label}
      description={description}
      color={color}
    />
  );
}

function SvgGraphic({
  width,
  height,
  id,
  label,
  description,
  color,
}: Omit<GraphicProps, 'width'> & { width: number }) {
  const [focused, setFocused] = useState(false);
  const descriptionId = description ? `${id}-description` : undefined;

  const layout = probeLayout(width, height);
  return (
    <svg
      role="img"
      tabIndex={0}
      aria-labelledby={`${id}-title`}
      aria-describedby={descriptionId}
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      style={{
        display: 'block',
        maxWidth: '100%',
        color: 'var(--rsc-text-color, #182b38)',
        outline: focused
          ? '3px solid var(--rsc-focus-color, #075985)'
          : undefined,
        outlineOffset: 3,
      }}
    >
      <title id={`${id}-title`}>{label}</title>
      {description && <desc id={descriptionId}>{description}</desc>}
      <g aria-hidden="true">
        <line
          x1={layout.insetX}
          x2={width - layout.insetX}
          y1={layout.baseline}
          y2={layout.baseline}
          stroke="currentColor"
        />
        <polyline
          points={layout.polyline}
          fill="none"
          stroke={color ?? 'var(--rsc-series-color, #2563eb)'}
          strokeWidth={2}
        />
        {layout.points.map(({ label: pointLabel, value, x, y }) => (
          <g key={pointLabel}>
            <circle
              cx={x}
              cy={y}
              r={4}
              fill={color ?? 'var(--rsc-series-color, #2563eb)'}
            />
            <text
              x={x}
              y={y - 10}
              textAnchor="middle"
              fill="currentColor"
              fontSize={12}
            >
              {value}
            </text>
            <text
              x={x}
              y={layout.baseline + 20}
              textAnchor="middle"
              fill="currentColor"
              fontSize={12}
            >
              {pointLabel}
            </text>
          </g>
        ))}
      </g>
    </svg>
  );
}

function ResponsiveGraphic(props: Omit<GraphicProps, 'width'>) {
  const { ref, width } = useContainerWidth();
  return (
    <div ref={ref} style={{ width: '100%', minWidth: 0 }}>
      <Graphic {...props} width={width} />
    </div>
  );
}

export function RenderingProbe({
  width,
  height,
  color,
  style,
  accessibility,
}: RenderingProbeProps) {
  const id = useId();
  const resolvedHeight = usableDimension(height) ? height : 280;
  const label = accessibility?.label?.trim() || 'Quarterly sample values';
  const graphicProps = {
    height: resolvedHeight,
    id,
    label,
    description: accessibility?.description,
    color,
  };
  return (
    <figure
      style={{
        margin: 0,
        position: 'relative',
        fontFamily: 'system-ui, sans-serif',
        color: 'var(--rsc-text-color, #182b38)',
        background: 'var(--rsc-background, #fff)',
        ...style,
        width: usableDimension(width)
          ? width
          : typeof width === 'string'
            ? width
            : '100%',
      }}
    >
      {usableDimension(width) ? (
        <Graphic {...graphicProps} width={width} />
      ) : (
        <ResponsiveGraphic {...graphicProps} />
      )}
      <table
        style={
          accessibility?.dataTable === 'visible'
            ? { borderCollapse: 'collapse', width: '100%', textAlign: 'left' }
            : visuallyHidden
        }
      >
        <caption style={{ textAlign: 'left', paddingBlock: 8 }}>
          {label} — data
        </caption>
        <thead>
          <tr>
            <th scope="col">Quarter</th>
            <th scope="col">Value</th>
          </tr>
        </thead>
        <tbody>
          {probeData.map(({ label: quarter, value }) => (
            <tr key={quarter}>
              <th scope="row">{quarter}</th>
              <td>{value}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}
