'use client';
import { PolarRenderer } from '../internal/PolarRenderer';
import type { PieChartProps } from '../types/contracts';
/** Accessible source-ordered Pie chart using the pure polar geometry pipeline. */
export function PieChart<T extends object>(props: PieChartProps<T>) {
  return <PolarRenderer family="pie" props={props} />;
}
