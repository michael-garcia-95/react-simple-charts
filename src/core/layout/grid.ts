import type { Bounds, Gridline } from './types';

export function placeGridlines(
  ticks: readonly { readonly position: number }[],
  plot: Bounds,
  horizontalBar: boolean,
  showGrid: boolean,
): readonly Gridline[] {
  if (!showGrid) return [];
  const positions = new Set<number>();
  const lower = horizontalBar ? plot.left : plot.top;
  const upper = horizontalBar ? plot.right : plot.bottom;
  const lines: Gridline[] = [];
  for (const { position } of ticks) {
    if (
      !Number.isFinite(position) ||
      position < lower ||
      position > upper ||
      positions.has(position)
    )
      continue;
    positions.add(position);
    lines.push({
      orientation: horizontalBar ? 'vertical' : 'horizontal',
      position,
      start: horizontalBar ? plot.top : plot.left,
      end: horizontalBar ? plot.bottom : plot.right,
    });
  }
  return lines;
}
