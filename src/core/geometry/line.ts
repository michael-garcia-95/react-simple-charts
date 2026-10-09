import { line } from 'd3-shape';
import type { CartesianPoint } from './types';
import { safePath } from './validation';

export function linePath<T>(points: readonly CartesianPoint<T>[]) {
  // Full precision avoids rounding tiny valid coordinates into fake zeroes.
  return safePath(() =>
    line<CartesianPoint<T>>()
      .x((point) => point.x)
      .y((point) => point.y)
      .digits(null)(points),
  );
}
