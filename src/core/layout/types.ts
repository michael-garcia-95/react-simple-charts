import type {
  CategoryAxisConfig,
  CategoryValue,
  DateAxisConfig,
  NumericAxisConfig,
} from '../../types/contracts';
import type {
  NormalizationResult,
  NormalizedCartesianData,
} from '../data/types';
import type {
  ContinuousScaleResult,
  ScaleDiagnosticCode,
  XScaleResult,
} from '../scales/types';

export type PhysicalOrientation = 'horizontal' | 'vertical';
export type SemanticAxis = 'x' | 'value';
export type XAxisConfig =
  CategoryAxisConfig | DateAxisConfig | NumericAxisConfig;
export interface Margins {
  readonly left: number;
  readonly right: number;
  readonly top: number;
  readonly bottom: number;
}
export interface Bounds {
  readonly left: number;
  readonly right: number;
  readonly top: number;
  readonly bottom: number;
  readonly width: number;
  readonly height: number;
}
/** Internal tuning only: resolved pixels, never new public component props. */
export interface LayoutSpacing {
  readonly padding?: number;
  readonly tickFontSize?: number;
  readonly titleFontSize?: number;
  readonly gap?: number;
  readonly tickLength?: number;
  readonly collisionGap?: number;
  readonly maxLabelWidth?: number;
  readonly maxEndpointPadding?: number;
  readonly minPlotSize?: number;
  readonly minimumMargins?: Partial<Margins>;
}
export type CartesianLayoutInput<T> = {
  readonly normalized: NormalizationResult<NormalizedCartesianData<T>>;
  readonly width: number;
  readonly height: number;
  readonly showGrid?: boolean;
  readonly spacing?: LayoutSpacing;
} & (
  | {
      readonly family: 'line' | 'area';
      readonly orientation?: never;
      readonly xAxis?: XAxisConfig;
      readonly yAxis?: NumericAxisConfig;
    }
  | {
      readonly family: 'bar';
      readonly orientation?: 'vertical';
      readonly xAxis?: CategoryAxisConfig;
      readonly yAxis?: NumericAxisConfig;
    }
  | {
      readonly family: 'bar';
      readonly orientation: 'horizontal';
      readonly xAxis?: NumericAxisConfig;
      readonly yAxis?: CategoryAxisConfig;
    }
);
export interface LayoutTick<V> {
  readonly value: V;
  readonly position: number;
  readonly index?: number;
  readonly label: string;
  readonly orientation: PhysicalOrientation;
  readonly selected: boolean;
  readonly estimatedWidth: number;
  readonly estimatedHeight: number;
}
interface AxisMetadata<V> {
  readonly orientation: PhysicalOrientation;
  readonly semantic: SemanticAxis;
  /** Perpendicular physical coordinate: bottom Y or left X. */
  readonly coordinate: number;
  readonly label?: string;
  readonly candidates: readonly LayoutTick<V>[];
  readonly visibleTicks: readonly LayoutTick<V>[];
}
export type AxisLayout =
  | ({ readonly kind: 'category' } & AxisMetadata<CategoryValue>)
  | ({ readonly kind: 'linear' } & AxisMetadata<number>)
  | ({ readonly kind: 'utc' | 'time' } & AxisMetadata<Date>);
export interface AxisAssignment {
  readonly orientation: PhysicalOrientation;
  readonly semantic: SemanticAxis;
  readonly visible: boolean;
}
export interface Gridline {
  readonly orientation: PhysicalOrientation;
  readonly position: number;
  readonly start: number;
  readonly end: number;
}
export interface LayoutDiagnostic {
  readonly code:
    | ScaleDiagnosticCode
    | 'invalid-dimensions'
    | 'invalid-configuration'
    | 'invalid-spacing'
    | 'insufficient-space'
    | 'formatting-failed';
  readonly description: string;
  readonly axis?: 'x' | 'y';
  readonly tickIndex?: number;
}
export type UsableXScale = Exclude<XScaleResult, { status: 'unusable' }>;
export type UsableValueScale = Exclude<
  ContinuousScaleResult<number>,
  { status: 'unusable' }
>;
interface LayoutMetadata {
  readonly width: number;
  readonly height: number;
  readonly chart: Bounds;
  readonly margins: Margins;
  readonly plot: Bounds;
  readonly assignments: {
    readonly x: AxisAssignment;
    readonly y: AxisAssignment;
  };
  /** Hidden axes are null; their semantic scales still exist below. */
  readonly axes: {
    readonly x: AxisLayout | null;
    readonly y: AxisLayout | null;
  };
  readonly gridlines: readonly Gridline[];
  readonly zeroBaseline: {
    readonly axis: 'x' | 'y';
    readonly position: number;
  } | null;
  readonly diagnostics: readonly LayoutDiagnostic[];
}
export type CartesianLayoutResult =
  | ({
      readonly status: 'ready';
      readonly scales: {
        readonly semanticX: Extract<UsableXScale, { status: 'ready' }>;
        readonly value: Extract<UsableValueScale, { status: 'ready' }>;
      };
    } & LayoutMetadata)
  | ({
      readonly status: 'empty';
      readonly scales: {
        readonly semanticX: UsableXScale;
        readonly value: UsableValueScale;
      };
    } & LayoutMetadata)
  | {
      readonly status: 'unusable';
      readonly diagnostics: readonly LayoutDiagnostic[];
    };

export function unusableLayout(
  code: LayoutDiagnostic['code'],
  description: string,
): CartesianLayoutResult {
  return { status: 'unusable', diagnostics: [{ code, description }] };
}
