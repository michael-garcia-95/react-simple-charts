import { configurationDiagnostic as diagnostic } from './diagnostics';
import type {
  NormalizationDiagnostic,
  NormalizedSeries,
  XScaleMode,
} from './types';
import { isRecord } from './values';

export function validateBase(
  input: unknown,
  fields: readonly string[],
): NormalizationDiagnostic[] {
  if (!isRecord(input))
    return [diagnostic('invalid-config', 'Configuration must be an object.')];
  const diagnostics: NormalizationDiagnostic[] = [];
  if (!Array.isArray(input.data))
    diagnostics.push(
      diagnostic('invalid-data', 'Data must be an array.', 'data'),
    );
  for (const field of fields) {
    if (!isKey(input[field]))
      diagnostics.push(
        diagnostic('invalid-key', 'Field mappings must be string keys.', field),
      );
  }
  return diagnostics;
}
/** Empty strings are legal JavaScript property names; no dataset-wide existence check. */
export function isKey(value: unknown): value is string {
  return typeof value === 'string';
}
export function isScale(value: unknown): value is XScaleMode {
  return (
    value === 'category' ||
    value === 'linear' ||
    value === 'utc' ||
    value === 'time'
  );
}
export function normalizeSeries(input: Record<string, unknown>): {
  series: NormalizedSeries[];
  diagnostics: NormalizationDiagnostic[];
} {
  const diagnostics: NormalizationDiagnostic[] = [];
  const series: NormalizedSeries[] = [];
  const hasY = input.yKey !== undefined;
  const hasSeries = input.series !== undefined;
  if (hasY === hasSeries) {
    diagnostics.push(
      diagnostic(
        'exclusive-values',
        'Configure exactly one of yKey or series.',
      ),
    );
  } else if (hasY) {
    if (isKey(input.yKey)) series.push({ index: 0, key: input.yKey });
    else
      diagnostics.push(
        diagnostic('invalid-key', 'yKey must be a string key.', 'yKey'),
      );
  } else if (!Array.isArray(input.series)) {
    diagnostics.push(
      diagnostic('invalid-series', 'Series must be an array.', 'series'),
    );
  } else if (input.series.length === 0) {
    diagnostics.push(
      diagnostic(
        'empty-series',
        'Series must contain at least one definition.',
        'series',
      ),
    );
  } else {
    const keys = new Set<string>();
    for (let index = 0; index < input.series.length; index++) {
      const definition: unknown = input.series[index];
      if (!isRecord(definition)) {
        diagnostics.push(
          diagnostic(
            'invalid-series',
            'Series definition must be an object.',
            'series',
            index,
          ),
        );
        continue;
      }
      if (!isKey(definition.key))
        diagnostics.push(
          diagnostic(
            'invalid-key',
            'Series key must be a string key.',
            'key',
            index,
          ),
        );
      for (const field of ['label', 'color']) {
        if (
          definition[field] !== undefined &&
          typeof definition[field] !== 'string'
        )
          diagnostics.push(
            diagnostic(
              'invalid-series',
              `${field} must be a string when supplied.`,
              field,
              index,
            ),
          );
      }
      if (isKey(definition.key)) {
        if (keys.has(definition.key))
          diagnostics.push(
            diagnostic(
              'duplicate-series-key',
              'Series keys must be unique.',
              definition.key,
              index,
            ),
          );
        keys.add(definition.key);
        series.push({
          index,
          key: definition.key,
          ...(typeof definition.label === 'string'
            ? { label: definition.label }
            : {}),
          ...(typeof definition.color === 'string'
            ? { color: definition.color }
            : {}),
        });
      }
    }
  }
  return { series, diagnostics };
}
