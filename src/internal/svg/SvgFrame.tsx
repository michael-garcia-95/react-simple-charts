import { useState } from 'react';
import type { ReactNode } from 'react';
import type { Bounds } from '../../core/layout/types';

export function SvgFrame({
  id,
  width,
  height,
  plot,
  label,
  description,
  grid,
  axes,
  children,
  interactive = false,
  inspection,
}: {
  id: string;
  width: number;
  height: number;
  plot: Bounds;
  label: string;
  description: string | undefined;
  grid: ReactNode;
  axes: ReactNode;
  children: ReactNode;
  interactive?: boolean;
  inspection?: ReactNode;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <svg
      role={interactive ? 'group' : 'img'}
      tabIndex={interactive ? undefined : 0}
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      aria-labelledby={`${id}-title`}
      aria-describedby={description ? `${id}-description` : undefined}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      style={{
        display: 'block',
        maxWidth: '100%',
        outline: focused
          ? '3px solid var(--rsc-focus-color, #075985)'
          : undefined,
        outlineOffset: 3,
      }}
    >
      <title id={`${id}-title`}>{label}</title>
      {description && <desc id={`${id}-description`}>{description}</desc>}
      <defs>
        <clipPath id={`${id}-plot`} clipPathUnits="userSpaceOnUse">
          <rect
            x={plot.left}
            y={plot.top}
            width={plot.width}
            height={plot.height}
          />
        </clipPath>
      </defs>
      <g aria-hidden={interactive ? undefined : true}>
        <g aria-hidden="true" data-layer="grid" pointerEvents="none">
          {grid}
        </g>
        <g aria-hidden="true" data-layer="axes">
          {axes}
        </g>
        <g data-layer="marks" clipPath={`url(#${id}-plot)`}>
          {children}
        </g>
      </g>
      {inspection && <g data-layer="inspection">{inspection}</g>}
    </svg>
  );
}
