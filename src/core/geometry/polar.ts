import { pie } from 'd3-shape';
import { polarArcPath } from './polar-arcs';
import type {
  PolarGeometryInput,
  PolarGeometryResult,
  PolarDiagnostic,
  PolarSlice,
} from './polar-types';
import { resolvePolarViewport } from './polar-validation';

/** Pure source-internal geometry; accepts only the existing normalization result. */
export function buildPolarGeometry<T>(
  input: PolarGeometryInput<T>,
): PolarGeometryResult<T> {
  const { normalized, family } = input;
  const context = {
    family,
    normalized,
    normalizationDiagnostics: normalized.diagnostics,
  };
  const fail = (diagnostic: PolarDiagnostic): PolarGeometryResult<T> => ({
    ...context,
    status: 'unusable',
    diagnostics: [diagnostic],
  });
  if (normalized.status !== 'normalized')
    return fail({
      code: 'normalization-unusable',
      description: 'Segment normalization configuration is unusable.',
    });
  const resolved = resolvePolarViewport(input);
  if (resolved.status === 'unusable') return fail(resolved.diagnostic);
  const { viewport } = resolved;
  const segments = normalized.data.segments;
  const negatives = segments.filter(
    (segment) => segment.value.status === 'unsupported',
  );
  if (negatives.length)
    return {
      ...context,
      status: 'unusable',
      diagnostics: negatives.map((segment) => ({
        code: 'unsupported-negative',
        description:
          'Negative segment values make the complete polar geometry unavailable.',
        rowIndex: segment.index,
        segmentId: segment.segmentId,
      })),
    };
  const eligible = segments.flatMap((segment) =>
    segment.label.status === 'valid' &&
    segment.value.status === 'valid' &&
    segment.value.value > 0
      ? [{ segment, label: segment.label.value, value: segment.value.value }]
      : [],
  );
  if (!eligible.length)
    return {
      ...context,
      diagnostics: [],
      status: 'empty',
      viewport,
      total: { status: 'finite', value: 0 },
      slices: [],
      reason: !segments.length
        ? 'no-source'
        : segments.every(
              (segment) =>
                segment.label.status === 'valid' &&
                segment.value.status === 'valid' &&
                segment.value.value === 0,
            )
          ? 'all-zero'
          : 'no-eligible-positive',
    };
  let maximum = 0;
  for (const entry of eligible) maximum = Math.max(maximum, entry.value);
  // Scale before summation so finite source observations cannot overflow weights.
  const weighted = eligible.map((entry) => ({
    ...entry,
    weight: entry.value / maximum,
  }));
  let sum = 0;
  let compensation = 0;
  for (const entry of weighted) {
    const adjusted = entry.weight - compensation;
    const next = sum + adjusted;
    compensation = next - sum - adjusted;
    sum = next;
  }
  if (!Number.isFinite(sum) || sum <= 0)
    return fail({
      code: 'unsafe-proportions',
      description: 'Proportional weights cannot be represented safely.',
    });
  const rawTotal = maximum * sum;
  const total = Number.isFinite(rawTotal)
    ? ({ status: 'finite', value: rawTotal } as const)
    : ({ status: 'overflow' } as const);
  // Both sorts are disabled explicitly; D3 consumes copied weights, never source values.
  const layout = pie<(typeof weighted)[number]>()
    .sort(null)
    .sortValues(null)
    .value((entry) => entry.weight)(weighted);
  const slices: PolarSlice<T>[] = [];
  for (const item of layout) {
    const { segment, label, value, weight } = item.data;
    const identity = { rowIndex: segment.index, segmentId: segment.segmentId };
    const angularSpan = item.endAngle - item.startAngle;
    const percentage = (weight / sum) * 100;
    if (
      ![item.startAngle, item.endAngle, angularSpan, percentage].every(
        Number.isFinite,
      ) ||
      weight <= 0 ||
      angularSpan <= 0 ||
      percentage <= 0
    )
      return fail({
        code: 'unsafe-proportions',
        description:
          'A positive source observation lost its representable proportion or angular extent.',
        ...identity,
      });
    const path = polarArcPath({
      startAngle: item.startAngle,
      endAngle: item.endAngle,
      padAngle: 0,
      innerRadius: viewport.innerRadius,
      outerRadius: viewport.outerRadius,
    });
    if (path === null)
      return fail({
        code: 'path-failed',
        description:
          'A positive slice did not produce a safe circular arc path.',
        ...identity,
      });
    slices.push({
      ...viewport,
      record: segment.record,
      index: segment.index,
      segmentId: segment.segmentId,
      label,
      value,
      startAngle: item.startAngle,
      endAngle: item.endAngle,
      angularSpan,
      percentage,
      path,
    });
  }
  return {
    ...context,
    diagnostics: [],
    status: 'ready',
    viewport,
    total,
    slices,
  };
}
