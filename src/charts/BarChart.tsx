'use client';
import { CartesianPointRenderer } from '../internal/CartesianPointRenderer';
import type { BarChartProps } from '../types/contracts';
/** Public grouped Bar chart; xKey always identifies source categories. */
export function BarChart<T extends object>(props: BarChartProps<T>) {
  return <CartesianPointRenderer {...props} family="bar" interactive />;
}
