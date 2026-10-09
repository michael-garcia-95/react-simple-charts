import type {
  PolarGeometryInput,
  PolarDiagnostic,
  PolarViewport,
} from './polar-types';

/** Initial internal edge margin, independent of Cartesian axes and layout. */
const MARGIN = 8;
export function resolvePolarViewport<T>(
  input: PolarGeometryInput<T>,
):
  | { readonly status: 'ready'; readonly viewport: PolarViewport }
  | { readonly status: 'unusable'; readonly diagnostic: PolarDiagnostic } {
  const fail = (code: PolarDiagnostic['code'], description: string) =>
    ({ status: 'unusable', diagnostic: { code, description } }) as const;
  if (
    (input.family !== 'pie' && input.family !== 'donut') ||
    (input.family === 'pie' && input.innerRadiusRatio !== undefined)
  )
    return fail(
      'invalid-configuration',
      'Only Donut accepts an inner radius ratio.',
    );
  const { width, height } = input;
  if (
    ![width, height].every(
      (value) =>
        typeof value === 'number' &&
        Number.isFinite(value) &&
        value > 0 &&
        value <= Number.MAX_SAFE_INTEGER,
    )
  )
    return fail(
      'invalid-dimensions',
      'Dimensions must be positive finite numbers no greater than MAX_SAFE_INTEGER.',
    );
  const outerRadius = Math.min(width, height) / 2 - MARGIN;
  const ratio =
    input.family === 'donut'
      ? input.innerRadiusRatio === undefined
        ? 0.6
        : input.innerRadiusRatio
      : 0;
  if (
    input.family === 'donut' &&
    (typeof ratio !== 'number' ||
      !Number.isFinite(ratio) ||
      ratio <= 0 ||
      ratio >= 1)
  )
    return fail(
      'invalid-radius',
      'Donut ratio must be finite and strictly between zero and one.',
    );
  const innerRadius = outerRadius * ratio;
  if (
    !Number.isFinite(outerRadius) ||
    outerRadius <= 0 ||
    !Number.isFinite(innerRadius) ||
    (input.family === 'donut' &&
      (innerRadius <= 0 || innerRadius >= outerRadius))
  )
    return fail(
      'invalid-radius',
      'Radii must retain a positive circle and a representable Donut hole.',
    );
  return {
    status: 'ready',
    viewport: {
      width,
      height,
      centerX: width / 2,
      centerY: height / 2,
      margin: MARGIN,
      outerRadius,
      innerRadius,
    },
  };
}
