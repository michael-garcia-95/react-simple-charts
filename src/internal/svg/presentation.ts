import type { CSSProperties } from 'react';
import type { NormalizedSeries } from '../../core/data/types';

export const visuallyHidden: CSSProperties = {
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
const palette = ['#2563eb', '#0d9488', '#9333ea', '#c2410c', '#be185d'];
export function seriesColor(
  series: NormalizedSeries,
  colors?: readonly string[],
) {
  return series.color ?? indexedColor(series.index, colors);
}
export function seriesLabel(series: NormalizedSeries) {
  return series.label ?? readableKey(series.key);
}
export function readableKey(key: string) {
  const words = key
    .replace(/([a-z\d])([A-Z])/g, '$1 $2')
    .replace(/[_-]+/g, ' ');
  return words ? words[0]!.toUpperCase() + words.slice(1) : 'Value';
}

/** Original source indices drive both Cartesian series and polar segment colors. */
export function indexedColor(index: number, colors?: readonly string[]) {
  return (
    colors?.[index % (colors.length || 1)] ??
    `var(--rsc-series-${index + 1}-color, var(--rsc-series-color, ${palette[index % palette.length]}))`
  );
}
