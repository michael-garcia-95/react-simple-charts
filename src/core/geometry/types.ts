import type { CategoryValue } from '../../types/contracts';
import type { NormalizationDiagnostic, NormalizedSeries } from '../data/types';
import type {
  Bounds,
  CartesianLayoutInput,
  CartesianLayoutResult,
  LayoutDiagnostic,
} from '../layout/types';

export type ReadyLayout = Extract<CartesianLayoutResult, { status: 'ready' }>;
export interface GeometryDiagnostic {
  readonly code:
    | 'layout-unusable'
    | 'unsafe-mapping'
    | 'invalid-spacing'
    | 'unsafe-slot'
    | 'invalid-baseline'
    | 'path-failed';
  readonly description: string;
  readonly rowIndex?: number;
  readonly seriesIndex?: number;
}
export interface DatumIdentity<T> {
  readonly record: T;
  readonly index: number;
  readonly category: CategoryValue;
  readonly value: number;
  readonly seriesKey: string;
  readonly seriesIndex: number;
  readonly series: NormalizedSeries;
}
export interface CartesianPoint<T> extends DatumIdentity<T> {
  readonly x: number;
  readonly y: number;
  readonly outOfPlot: boolean;
}
export interface GeometryGap {
  readonly rowIndex: number;
  readonly reason: 'x' | 'value';
}
export interface PointRun<T> {
  readonly points: readonly CartesianPoint<T>[];
  readonly startIndex: number;
  readonly endIndex: number;
  /** Null for singleton runs; these retain a future marker, not a segment/fill. */
  readonly path: string | null;
  /** Area-only data boundary, derived from the same run via pure linePath. */
  readonly outlinePath?: string | null;
  readonly outOfPlot: boolean;
}
export interface SeriesGeometry<T> {
  readonly series: NormalizedSeries;
  readonly points: readonly CartesianPoint<T>[];
  readonly runs: readonly PointRun<T>[];
  readonly gaps: readonly GeometryGap[];
}
export interface BarRectangle<T> extends DatumIdentity<T> {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
  readonly baseline: number;
  readonly slot: { readonly start: number; readonly end: number };
  readonly outOfPlot: boolean;
}
/** Fractions only; no public props or artificial pixel minimum. */
export interface BarSpacing {
  readonly groupRatio?: number;
  readonly slotRatio?: number;
}
export type CartesianGeometryInput<T> = CartesianLayoutInput<T> & {
  readonly barSpacing?: BarSpacing;
};
export type GeometryMarks<T> =
  | {
      readonly family: 'line' | 'area';
      readonly series: readonly SeriesGeometry<T>[];
    }
  | {
      readonly family: 'bar';
      readonly orientation: 'vertical' | 'horizontal';
      readonly bars: readonly BarRectangle<T>[];
    };
interface Diagnostics {
  readonly diagnostics: readonly GeometryDiagnostic[];
  readonly layoutDiagnostics: readonly LayoutDiagnostic[];
  readonly normalizationDiagnostics: readonly NormalizationDiagnostic[];
}
type UsableGeometry<T> = Diagnostics &
  GeometryMarks<T> & {
    readonly plot: Bounds;
    readonly zeroBaseline: ReadyLayout['zeroBaseline'];
    /** Future renderers must apply a plot clipPath when true. */
    readonly requiresClipping: boolean;
  };
export type CartesianGeometryResult<T> =
  | (UsableGeometry<T> & {
      readonly status: 'ready';
      readonly layout: ReadyLayout;
    })
  | (UsableGeometry<T> & {
      readonly status: 'empty';
      readonly layout: Exclude<CartesianLayoutResult, { status: 'unusable' }>;
    })
  | (Diagnostics & { readonly status: 'unusable' });
export type GeometryCalculation<D> =
  | { readonly status: 'ready'; readonly data: D }
  | {
      readonly status: 'unusable';
      readonly diagnostics: readonly GeometryDiagnostic[];
    };
