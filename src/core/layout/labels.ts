import type { AxisConfig, CategoryValue } from '../../types/contracts';
import type { LayoutDiagnostic } from './types';

export interface EstimatedLabel {
  readonly label: string;
  readonly estimatedWidth: number;
  readonly estimatedHeight: number;
}
/** One em per UTF-16 code unit deliberately overestimates typical text. */
export function estimateLabel(label: string, fontSize: number): EstimatedLabel {
  return {
    label,
    estimatedWidth: label.length * fontSize,
    estimatedHeight: fontSize * 1.2,
  };
}
function defaultLabel(value: CategoryValue): string {
  return typeof value === 'object'
    ? Date.prototype.toISOString.call(value)
    : String(value);
}

/** Date callbacks receive copies; source/category/tick Dates retain identity. */
export function formatLabels<V extends CategoryValue>(
  ticks: readonly { readonly value: V }[],
  config: AxisConfig<V>,
  fontSize: number,
):
  | { status: 'ready'; labels: readonly EstimatedLabel[] }
  | { status: 'unusable'; diagnostics: readonly LayoutDiagnostic[] } {
  const labels: EstimatedLabel[] = [];
  for (let index = 0; index < ticks.length; index++) {
    const tick = ticks[index]!;
    try {
      const value =
        typeof tick.value === 'object'
          ? (new Date(Date.prototype.getTime.call(tick.value)) as V)
          : tick.value;
      const label: unknown = config.formatTick
        ? config.formatTick(value)
        : defaultLabel(tick.value);
      if (typeof label !== 'string' || /[\r\n\t]/.test(label))
        throw new Error('Tick labels must be single-line strings.');
      labels.push(estimateLabel(label, fontSize));
    } catch {
      return {
        status: 'unusable',
        diagnostics: [
          {
            code: 'formatting-failed',
            description:
              'Tick formatting threw or did not return a single-line string.',
            tickIndex: index,
          },
        ],
      };
    }
  }
  return { status: 'ready', labels };
}
