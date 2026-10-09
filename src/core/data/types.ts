import type {
  CartesianValues,
  CartesianXScale,
  CategoryValue,
  CategoricalFieldKey,
  NumericFieldKey,
} from '../../types/contracts';

export type XScaleMode = 'category' | 'linear' | 'utc' | 'time';

/** Raw values and property presence survive classification without coercion. */
export type ValueState<V> =
  | { status: 'valid'; value: V; raw: V; present: true }
  | { status: 'missing'; raw: null | undefined; present: boolean }
  | { status: 'invalid'; raw: unknown; present: boolean };
export type NumericalValueState = ValueState<number>;
export type XValueState = ValueState<CategoryValue>;
export type SegmentValueState =
  | NumericalValueState
  | { status: 'unsupported'; reason: 'negative'; raw: number; present: true };

export interface NormalizedSeries {
  readonly index: number;
  readonly key: string;
  readonly label?: string;
  readonly color?: string;
}
export interface NormalizedCartesianRow<T> {
  readonly record: T;
  readonly index: number;
  readonly x: XValueState;
  /** Position matches NormalizedCartesianData.series, never a category label. */
  readonly values: readonly NumericalValueState[];
}
export interface NormalizedCartesianData<T> {
  readonly xKey: string;
  readonly xScale: XScaleMode;
  readonly series: readonly NormalizedSeries[];
  readonly rows: readonly NormalizedCartesianRow<T>[];
}
export interface NormalizedSegment<T> {
  readonly record: T;
  readonly index: number;
  readonly segmentId: number;
  readonly label: XValueState;
  readonly value: SegmentValueState;
}
export interface NormalizedSegmentData<T> {
  readonly nameKey: string;
  readonly valueKey: string;
  readonly segments: readonly NormalizedSegment<T>[];
}
export type DiagnosticCode =
  | 'invalid-config'
  | 'invalid-data'
  | 'invalid-key'
  | 'invalid-scale'
  | 'exclusive-values'
  | 'empty-series'
  | 'invalid-series'
  | 'duplicate-series-key'
  | 'missing-value'
  | 'invalid-value'
  | 'unsupported-value';
export interface NormalizationDiagnostic {
  readonly scope: 'configuration' | 'data';
  readonly severity: 'error' | 'warning';
  readonly code: DiagnosticCode;
  readonly description: string;
  readonly rowIndex?: number;
  readonly field?: string;
  readonly seriesIndex?: number;
}
export type NormalizationResult<D> =
  | {
      status: 'invalid-configuration';
      diagnostics: readonly NormalizationDiagnostic[];
    }
  | {
      status: 'normalized';
      data: D;
      diagnostics: readonly NormalizationDiagnostic[];
    };

/** Only approved mapping contracts are accepted; unrelated chart props are ignored. */
export type CartesianNormalizationInput<T extends object> = {
  data: readonly T[];
} & CartesianValues<NoInfer<T>> &
  CartesianXScale<NoInfer<T>>;
export interface SegmentNormalizationInput<T extends object> {
  data: readonly T[];
  nameKey: CategoricalFieldKey<NoInfer<T>>;
  valueKey: NumericFieldKey<NoInfer<T>>;
}
