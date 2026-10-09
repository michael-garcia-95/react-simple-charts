import { area } from 'd3-shape';
import type { CartesianPoint } from './types';
import { safePath } from './validation';

export function areaPath<T>(
  points: readonly CartesianPoint<T>[],
  baseline: number,
) {
  return safePath(() =>
    area<CartesianPoint<T>>()
      .x((point) => point.x)
      .y0(baseline)
      .y1((point) => point.y)
      .digits(null)(points),
  );
}
