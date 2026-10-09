'use client';
import { LineRenderer } from '../internal/LineRenderer';
import type { LineChartProps } from '../types/contracts';
/** Public engine-based Line chart with local point inspection. */
export function LineChart<T extends object>(props: LineChartProps<T>) {
  return <LineRenderer {...props} interactive />;
}
