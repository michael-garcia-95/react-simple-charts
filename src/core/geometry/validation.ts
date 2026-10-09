import type { Bounds } from '../layout/types';
import type { GeometryCalculation, GeometryDiagnostic } from './types';

export function failure(
  code: GeometryDiagnostic['code'],
  description: string,
  identity: { readonly rowIndex?: number; readonly seriesIndex?: number } = {},
): GeometryCalculation<never> {
  return {
    status: 'unusable',
    diagnostics: [{ code, description, ...identity }],
  };
}
export function outsidePlot(x: number, y: number, plot: Bounds): boolean {
  return x < plot.left || x > plot.right || y < plot.top || y > plot.bottom;
}
/** D3 receives only finite points; still guard null, exceptions, and malformed output. */
export function safePath(
  generate: () => string | null,
): GeometryCalculation<string> {
  try {
    const path = generate();
    if (path === null || !path.startsWith('M'))
      return failure('path-failed', 'D3 did not produce finite path data.');
    // These generators produce only M/L/Z commands, decimal or exponential coordinates.
    const number = /[-+]?(?:\d*\.\d+|\d+\.?\d*)(?:e[-+]?\d+)?/gi;
    const coordinates = path.match(number);
    const remainder = path.replace(number, '').replace(/[MLZ,\s]/g, '');
    if (
      !coordinates?.length ||
      remainder ||
      !coordinates.every((value) => Number.isFinite(Number(value)))
    )
      return failure('path-failed', 'D3 did not produce finite path data.');
    return { status: 'ready', data: path };
  } catch {
    return failure('path-failed', 'D3 path generation failed.');
  }
}
