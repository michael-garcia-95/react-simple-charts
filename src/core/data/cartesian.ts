import { isScale, normalizeSeries, validateBase } from './configuration';
import { configurationDiagnostic, valueDiagnostic } from './diagnostics';
import type {
  CartesianNormalizationInput,
  NormalizationResult,
  NormalizedCartesianData,
} from './types';
import { classifyNumber, classifyX, isRecord, readField } from './values';

export function normalizeCartesian<T extends object>(
  input: CartesianNormalizationInput<T>,
): NormalizationResult<NormalizedCartesianData<T>> {
  const diagnostics = validateBase(input, ['xKey']);
  if (!isRecord(input)) return { status: 'invalid-configuration', diagnostics };
  const configuration = normalizeSeries(input);
  diagnostics.push(...configuration.diagnostics);
  const xScale = input.xScale === undefined ? 'category' : input.xScale;
  if (!isScale(xScale))
    diagnostics.push(
      configurationDiagnostic(
        'invalid-scale',
        'Unknown X scale mode.',
        'xScale',
      ),
    );
  if (diagnostics.length || !isScale(xScale))
    return { status: 'invalid-configuration', diagnostics };
  const rows = Array.from(input.data, (record, index) => {
    const field = readField(record, input.xKey);
    const x = classifyX(field.raw, field.present, xScale);
    diagnostics.push(...valueDiagnostic(x, index, input.xKey));
    const values = configuration.series.map((series) => {
      const field = readField(record, series.key);
      const value = classifyNumber(field.raw, field.present);
      diagnostics.push(
        ...valueDiagnostic(value, index, series.key, series.index),
      );
      return value;
    });
    return { record, index, x, values };
  });
  return {
    status: 'normalized',
    data: { xKey: input.xKey, xScale, series: configuration.series, rows },
    diagnostics,
  };
}
