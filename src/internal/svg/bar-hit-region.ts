import type { BarRectangle } from '../../core/geometry/types';
import type { Bounds } from '../../core/layout/types';
/** Presentation-only intersection; never changes data rectangles or slots. */
export function barHitRegion<T>(
  bar: BarRectangle<T>,
  plot: Bounds,
  orientation: 'vertical' | 'horizontal',
) {
  let left = Math.max(bar.x, plot.left);
  let right = Math.min(bar.x + bar.width, plot.right);
  let top = Math.max(bar.y, plot.top);
  let bottom = Math.min(bar.y + bar.height, plot.bottom);
  if (bar.value === 0) {
    if (orientation === 'vertical') {
      if (
        bar.baseline < plot.top ||
        bar.baseline > plot.bottom ||
        right <= left
      )
        return null;
      top = Math.max(plot.top, bar.baseline - 6);
      bottom = Math.min(plot.bottom, bar.baseline + 6);
    } else {
      if (
        bar.baseline < plot.left ||
        bar.baseline > plot.right ||
        bottom <= top
      )
        return null;
      left = Math.max(plot.left, bar.baseline - 6);
      right = Math.min(plot.right, bar.baseline + 6);
    }
  }
  if (right <= left || bottom <= top) return null;
  return { x: left, y: top, width: right - left, height: bottom - top };
}
