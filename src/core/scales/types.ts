import type { CategoryValue } from '../../types/contracts';

export type ChartFamily = 'line' | 'area' | 'bar';
export type Interval<V> = readonly [V, V];
export type ScaleDiagnosticCode =
  | 'invalid-normalization'
  | 'incompatible-x-scale'
  | 'invalid-bounds'
  | 'zero-baseline-conflict'
  | 'invalid-tick-count'
  | 'invalid-range'
  | 'unsafe-domain'
  | 'unsafe-position';
export interface ScaleDiagnostic {
  readonly code: ScaleDiagnosticCode;
  readonly description: string;
}
export interface UnusableScale {
  readonly status: 'unusable';
  readonly diagnostics: readonly ScaleDiagnostic[];
}
export interface DomainMetadata<V> {
  /** Exact eligible extent, before baseline policy, overrides, or expansion. */
  readonly observed: Interval<V> | null;
  readonly domain: Interval<V>;
  readonly origin: 'data' | 'fallback' | 'override';
  readonly expanded: boolean;
  readonly zeroBaseline: boolean;
  readonly overridden: { readonly min: boolean; readonly max: boolean };
}
export type DomainResult<V> =
  ({ readonly status: 'ready' } & DomainMetadata<V>) | UnusableScale;
export type PositionResult =
  | { readonly status: 'mapped'; readonly position: number }
  | {
      readonly status: 'unusable';
      readonly reason: 'invalid-value' | 'unsafe-position';
    };
export interface ContinuousTick<V> {
  readonly value: V;
  readonly position: number;
}
export type ContinuousScaleResult<V> =
  | {
      readonly status: 'ready';
      readonly domain: DomainMetadata<V>;
      readonly ticks: readonly ContinuousTick<V>[];
      readonly map: (value: V) => PositionResult;
    }
  | {
      readonly status: 'empty';
      readonly domain: DomainMetadata<V>;
      readonly ticks: readonly ContinuousTick<V>[];
    }
  | UnusableScale;
export interface CategoryTick {
  readonly index: number;
  readonly value: CategoryValue;
  readonly start: number;
  readonly position: number;
}
export type CategoryScaleResult =
  | {
      readonly status: 'ready';
      readonly ticks: readonly CategoryTick[];
      readonly bandwidth: number;
      readonly position: (sourceIndex: number) => PositionResult;
    }
  | { readonly status: 'empty'; readonly ticks: readonly CategoryTick[] }
  | UnusableScale;

export type XScaleResult =
  | ({ readonly kind: 'category' } & CategoryScaleResult)
  | ({ readonly kind: 'linear' } & ContinuousScaleResult<number>)
  | ({ readonly kind: 'utc' | 'time' } & ContinuousScaleResult<Date>)
  | UnusableScale;

export function unusable(
  code: ScaleDiagnosticCode,
  description: string,
): UnusableScale {
  return { status: 'unusable', diagnostics: [{ code, description }] };
}
