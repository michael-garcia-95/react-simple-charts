import { validateBase } from './configuration';
import { valueDiagnostic } from './diagnostics';
import type {
  NormalizationResult,
  NormalizedSegmentData,
  SegmentNormalizationInput,
  SegmentValueState,
} from './types';
import { classifyNumber, classifyX, readField } from './values';

/** Shared source model for Pie and Donut; geometry and percentages are deferred. */
export function normalizeSegments<T extends object>(
  input: SegmentNormalizationInput<T>,
): NormalizationResult<NormalizedSegmentData<T>> {
  const diagnostics = validateBase(input, ['nameKey', 'valueKey']);
  if (diagnostics.length)
    return { status: 'invalid-configuration', diagnostics };
  const segments = Array.from(input.data, (record, index) => {
    const name = readField(record, input.nameKey);
    const label = classifyX(name.raw, name.present, 'category');
    const field = readField(record, input.valueKey);
    const numerical = classifyNumber(field.raw, field.present);
    const value: SegmentValueState =
      numerical.status === 'valid' && numerical.value < 0
        ? {
            status: 'unsupported',
            reason: 'negative',
            raw: numerical.value,
            present: true,
          }
        : numerical;
    diagnostics.push(
      ...valueDiagnostic(label, index, input.nameKey),
      ...valueDiagnostic(value, index, input.valueKey),
    );
    return { record, index, segmentId: index, label, value };
  });
  return {
    status: 'normalized',
    data: { nameKey: input.nameKey, valueKey: input.valueKey, segments },
    diagnostics,
  };
}
