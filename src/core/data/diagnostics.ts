import type {
  DiagnosticCode,
  NormalizationDiagnostic,
  SegmentValueState,
  XValueState,
} from './types';

export function configurationDiagnostic(
  code: DiagnosticCode,
  description: string,
  field?: string,
  seriesIndex?: number,
): NormalizationDiagnostic {
  return {
    scope: 'configuration',
    severity: 'error',
    code,
    description,
    ...(field === undefined ? {} : { field }),
    ...(seriesIndex === undefined ? {} : { seriesIndex }),
  };
}
export function valueDiagnostic(
  state: XValueState | SegmentValueState,
  rowIndex: number,
  field: string,
  seriesIndex?: number,
): NormalizationDiagnostic[] {
  if (state.status === 'valid') return [];
  const code =
    state.status === 'missing'
      ? 'missing-value'
      : state.status === 'invalid'
        ? 'invalid-value'
        : 'unsupported-value';
  return [
    {
      scope: 'data',
      severity: 'warning',
      code,
      description: `${state.status} value for field "${field}".`,
      rowIndex,
      field,
      ...(seriesIndex === undefined ? {} : { seriesIndex }),
    },
  ];
}
