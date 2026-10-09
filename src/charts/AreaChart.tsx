'use client';
import { CartesianPointRenderer } from '../internal/CartesianPointRenderer';
import type { AreaChartProps } from '../types/contracts';
/** Public unstacked zero-baseline Area chart with shared point inspection. */
export function AreaChart<T extends object>(props: AreaChartProps<T>) {
  return <CartesianPointRenderer {...props} family="area" interactive />;
}
