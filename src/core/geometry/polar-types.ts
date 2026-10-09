import type { CategoryValue } from '../../types/contracts';
import type {
  NormalizationDiagnostic,
  NormalizationResult,
  NormalizedSegmentData,
} from '../data/types';

export type PolarGeometryInput<T> = {
  readonly normalized: NormalizationResult<NormalizedSegmentData<T>>;
  readonly width: number;
  readonly height: number;
} & (
  | { readonly family: 'pie'; readonly innerRadiusRatio?: never }
  | { readonly family: 'donut'; readonly innerRadiusRatio?: number }
);
export interface PolarViewport {
  readonly width: number;
  readonly height: number;
  readonly centerX: number;
  readonly centerY: number;
  readonly margin: number;
  readonly outerRadius: number;
  readonly innerRadius: number;
}
export interface PolarSlice<T> extends PolarViewport {
  readonly record: T;
  readonly index: number;
  readonly segmentId: number;
  readonly label: CategoryValue;
  readonly value: number;
  readonly startAngle: number;
  readonly endAngle: number;
  readonly angularSpan: number;
  readonly percentage: number;
  /** Local coordinates around (0,0); renderer translates to centerX/centerY. */
  readonly path: string;
}
export interface PolarDiagnostic {
  readonly code:
    | 'normalization-unusable'
    | 'invalid-configuration'
    | 'invalid-dimensions'
    | 'invalid-radius'
    | 'unsupported-negative'
    | 'unsafe-proportions'
    | 'path-failed';
  readonly description: string;
  readonly rowIndex?: number;
  readonly segmentId?: number;
}
export type PolarTotal =
  | { readonly status: 'finite'; readonly value: number }
  | { readonly status: 'overflow' };
interface PolarContext<T> {
  readonly family: 'pie' | 'donut';
  readonly normalized: NormalizationResult<NormalizedSegmentData<T>>;
  readonly normalizationDiagnostics: readonly NormalizationDiagnostic[];
  readonly diagnostics: readonly PolarDiagnostic[];
}
export type PolarGeometryResult<T> =
  | (PolarContext<T> & {
      readonly status: 'ready';
      readonly viewport: PolarViewport;
      readonly total: PolarTotal;
      readonly slices: readonly PolarSlice<T>[];
    })
  | (PolarContext<T> & {
      readonly status: 'empty';
      readonly reason: 'no-source' | 'all-zero' | 'no-eligible-positive';
      readonly viewport: PolarViewport;
      readonly total: { readonly status: 'finite'; readonly value: 0 };
      readonly slices: readonly [];
    })
  | (PolarContext<T> & { readonly status: 'unusable' });
