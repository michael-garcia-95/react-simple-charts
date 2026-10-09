import type { CSSProperties, ReactNode } from 'react';

/** Non-null field types must fit V; null-only and never fields are excluded. */
type KeysOfType<T, V> = {
  [K in keyof T]-?: K extends string
    ? [NonNullable<T[K]>] extends [never]
      ? never
      : [NonNullable<T[K]>] extends [V]
        ? K
        : never
    : never;
}[keyof T];

export type StringFieldKey<T> = KeysOfType<T, string>;
export type NumericFieldKey<T> = KeysOfType<T, number>;
export type DateFieldKey<T> = KeysOfType<T, Date>;
export type CategoryValue = string | number | Date;
export type CategoricalFieldKey<T> = KeysOfType<T, CategoryValue>;
export type ValueFormatter = (value: number) => string;
export type CategoryFormatter = (value: CategoryValue) => string;
export type InputMethod = 'pointer' | 'keyboard';

export interface AccessibilityOptions {
  label?: string;
  description?: string;
  /** Intended default: visually-hidden. No mode removes the data alternative. */
  dataTable?: 'visible' | 'visually-hidden';
}

export interface AxisConfig<V> {
  show?: boolean;
  label?: string;
  tickCount?: number;
  /** Generated ticks have no corresponding original record. */
  formatTick?: (value: V) => string;
}
export interface NumericAxisConfig extends AxisConfig<number> {
  min?: number;
  max?: number;
}
export type CategoryAxisConfig = AxisConfig<CategoryValue>;
export type DateAxisConfig = AxisConfig<Date>;

export interface SeriesConfig<T> {
  key: NumericFieldKey<T>;
  label?: string;
  color?: string;
}

export type CartesianValues<T> =
  | { yKey: NumericFieldKey<T>; series?: never }
  | { yKey?: never; series: readonly SeriesConfig<T>[] };

export interface CartesianDatum<T> {
  record: T;
  index: number;
  /** Raw source number, never the formatted string. */
  value: number;
  seriesKey: NumericFieldKey<T>;
  seriesLabel: string;
  color: string;
  category: CategoryValue;
}
export interface CartesianActivation<T> extends CartesianDatum<T> {
  inputMethod: InputMethod;
}
export type CartesianTooltipContext<T> =
  | {
      mode: 'shared';
      category: CategoryValue;
      items: readonly CartesianDatum<T>[];
    }
  | { mode: 'item'; item: CartesianDatum<T> };
export interface CartesianTooltipConfig<T> {
  /** Intended default: shared. */
  mode?: 'shared' | 'item';
  render?: (context: CartesianTooltipContext<T>) => ReactNode;
}
export type CartesianTooltip<T> =
  | boolean
  | CartesianTooltipConfig<T>
  | ((context: CartesianTooltipContext<T>) => ReactNode);

export interface SegmentDatum<T> {
  record: T;
  index: number;
  value: number;
  /** Original record index identifies the segment, even with duplicate labels. */
  segmentId: number;
  label: CategoryValue;
  color: string;
  /** Percentage on a 0–100 scale. */
  percentage: number;
}
export interface SegmentActivation<T> extends SegmentDatum<T> {
  inputMethod: InputMethod;
}
export interface SegmentTooltipContext<T> {
  segment: SegmentDatum<T>;
}
export interface SegmentTooltipConfig<T> {
  render?: (context: SegmentTooltipContext<T>) => ReactNode;
}
export type SegmentTooltip<T> =
  | boolean
  | SegmentTooltipConfig<T>
  | ((context: SegmentTooltipContext<T>) => ReactNode);

export interface CommonChartProps<T> {
  data: readonly T[];
  width?: number | string;
  height?: number;
  className?: string;
  style?: CSSProperties;
  colors?: readonly string[];
  animate?: boolean;
  formatValue?: ValueFormatter;
  accessibility?: AccessibilityOptions;
  showLegend?: boolean;
}

export interface CartesianChartProps<T> extends CommonChartProps<T> {
  showGrid?: boolean;
  formatCategory?: CategoryFormatter;
  tooltip?: CartesianTooltip<NoInfer<T>>;
  onDataActivate?: (payload: CartesianActivation<NoInfer<T>>) => void;
}

/** Category is the default; continuous scales require an explicit discriminant. */
export type CartesianXScale<T> =
  | {
      xScale?: 'category';
      xKey: CategoricalFieldKey<T>;
      xAxis?: CategoryAxisConfig;
    }
  | { xScale: 'linear'; xKey: NumericFieldKey<T>; xAxis?: NumericAxisConfig }
  | { xScale: 'utc' | 'time'; xKey: DateFieldKey<T>; xAxis?: DateAxisConfig };

export type LineChartProps<T extends object> = CartesianChartProps<T> &
  CartesianValues<NoInfer<T>> &
  CartesianXScale<NoInfer<T>> & { yAxis?: NumericAxisConfig };
export type AreaChartProps<T extends object> = LineChartProps<T>;

export type BarChartProps<T extends object> = CartesianChartProps<T> &
  CartesianValues<NoInfer<T>> & {
    xKey: CategoricalFieldKey<NoInfer<T>>;
  } & (
    | {
        orientation?: 'vertical';
        xAxis?: CategoryAxisConfig;
        yAxis?: NumericAxisConfig;
      }
    | {
        orientation: 'horizontal';
        xAxis?: NumericAxisConfig;
        yAxis?: CategoryAxisConfig;
      }
  );

export interface PieChartProps<T extends object> extends CommonChartProps<T> {
  nameKey: CategoricalFieldKey<NoInfer<T>>;
  valueKey: NumericFieldKey<NoInfer<T>>;
  showLabels?: boolean;
  tooltip?: SegmentTooltip<NoInfer<T>>;
  onDataActivate?: (payload: SegmentActivation<NoInfer<T>>) => void;
}
export interface DonutChartProps<T extends object> extends PieChartProps<T> {
  /** Runtime validation will enforce a finite ratio strictly between 0 and 1. */
  innerRadiusRatio?: number;
  centerContent?: ReactNode;
}
