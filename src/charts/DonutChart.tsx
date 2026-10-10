'use client';
import { PolarRenderer } from '../internal/PolarRenderer';
import type { DonutChartProps } from '../types/contracts';
/** Accessible source-ordered ring chart using the pure polar geometry pipeline. */
export function DonutChart<T extends object>(props: DonutChartProps<T>) {
  return <PolarRenderer family="donut" props={props} />;
}
