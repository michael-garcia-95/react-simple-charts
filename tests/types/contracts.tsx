import type { ReactElement } from 'react';
import type {
  LineChartProps,
  AreaChartProps,
  BarChartProps,
  PieChartProps,
  DonutChartProps,
  SeriesConfig,
  NumericFieldKey,
  StringFieldKey,
  DateFieldKey,
  CategoricalFieldKey,
  CartesianActivation,
  SegmentActivation,
} from 'react-simple-charts';

interface Row {
  name: string;
  amount: number;
  optional?: number;
  nullable: number | null;
  when: Date;
  mixed: number | string;
  flag: boolean;
  empty: null;
  impossible: never;
}
export const data: readonly Row[] = [];
declare function LineChart<T extends object>(
  props: LineChartProps<T>,
): ReactElement;
declare function AreaChart<T extends object>(
  props: AreaChartProps<T>,
): ReactElement;
declare function BarChart<T extends object>(
  props: BarChartProps<T>,
): ReactElement;
declare function PieChart<T extends object>(
  props: PieChartProps<T>,
): ReactElement;
declare function DonutChart<T extends object>(
  props: DonutChartProps<T>,
): ReactElement;

export const series: readonly SeriesConfig<Row>[] = (
  ['amount', 'optional'] as const
).map((key) => ({ key, label: key, color: '#abc' }));
export const single = {
  data,
  xKey: 'name',
  yKey: 'amount',
} satisfies LineChartProps<Row>;
export const multi = {
  data,
  xKey: 'name',
  series,
} satisfies LineChartProps<Row>;
export const emptySeries = {
  data,
  xKey: 'name',
  series: [],
} satisfies LineChartProps<Row>;
export const keys: [
  StringFieldKey<Row>,
  NumericFieldKey<Row>,
  DateFieldKey<Row>,
  CategoricalFieldKey<Row>,
] = ['name', 'nullable', 'when', 'mixed'];

export const valid = (
  <>
    <LineChart
      data={data}
      xKey="name"
      yKey="optional"
      onDataActivate={(p) => {
        const record: Row = p.record;
        record.amount.toFixed();
        p.value.toFixed();
        // @ts-expect-error Original record is not a string.
        p.record.toUpperCase();
        // @ts-expect-error Cartesian activation has no percentage.
        p.percentage.toFixed();
      }}
    />
    <LineChart data={data} xKey="name" series={series} />
    <LineChart
      data={data}
      xKey="amount"
      xScale="linear"
      yKey="nullable"
      xAxis={{ min: 0, max: 100, formatTick: (n) => n.toFixed() }}
    />
    <LineChart
      data={data}
      xKey="when"
      xScale="utc"
      yKey="amount"
      xAxis={{ formatTick: (date) => date.toISOString() }}
    />
    <AreaChart data={data} xKey="when" xScale="time" yKey="amount" />
    <AreaChart
      data={data}
      xKey="when"
      yKey="nullable"
      formatCategory={(v) => String(v)}
    />
    <BarChart
      data={data}
      xKey="name"
      yKey="amount"
      xAxis={{ formatTick: (v) => String(v) }}
      yAxis={{ min: 0, formatTick: (v) => v.toFixed() }}
    />
    <BarChart data={data} orientation="vertical" xKey="name" series={series} />
    <BarChart
      data={data}
      orientation="horizontal"
      xKey="name"
      yKey="amount"
      xAxis={{ min: 0, formatTick: (v) => v.toFixed() }}
      yAxis={{ formatTick: (v) => String(v) }}
    />
    <LineChart
      data={data}
      xKey="name"
      yKey="amount"
      tooltip={(context) => {
        if (context.mode === 'item') return context.item.record.name;
        return context.items.map((item) => item.record.name).join(',');
      }}
    />
    <LineChart
      data={data}
      xKey="name"
      yKey="amount"
      tooltip={{
        mode: 'item',
        render: (context) =>
          context.mode === 'item' ? context.item.value.toFixed() : null,
      }}
    />
    <LineChart data={data} xKey="name" yKey="amount" tooltip={false} />
    <PieChart
      data={data}
      nameKey="name"
      valueKey="nullable"
      tooltip={true}
      onDataActivate={(p) => {
        const record: Row = p.record;
        record.amount.toFixed();
        p.percentage.toFixed();
        // @ts-expect-error Segment activation has no series key.
        p.seriesKey.toUpperCase();
      }}
    />
    <PieChart
      data={data}
      nameKey="when"
      valueKey="optional"
      tooltip={{ render: (c) => c.segment.record.name }}
    />
    <DonutChart
      data={data}
      nameKey="name"
      valueKey="amount"
      innerRadiusRatio={0.6}
      centerContent={<span>Total</span>}
      tooltip={(c) => c.segment.record.name}
    />
  </>
);

// Keep rejected JSX on one line so the directive covers its diagnostic.
// @ts-expect-error Unknown field.
// prettier-ignore
export const unknown = <LineChart data={data} xKey="missing" yKey="amount" />;
// @ts-expect-error String field is not numeric.
// prettier-ignore
export const stringValue = <LineChart data={data} xKey="name" yKey="name" />;
// @ts-expect-error A mixed numeric/string field is not numeric.
// prettier-ignore
export const mixedValue = <LineChart data={data} xKey="name" yKey="mixed" />;
// @ts-expect-error Mutually exclusive mappings.
// prettier-ignore
export const both = <LineChart data={data} xKey="name" yKey="amount" series={series} />;
// @ts-expect-error A value mapping is required.
// prettier-ignore
export const neither = <LineChart data={data} xKey="name" />;
// @ts-expect-error Linear scale requires numbers.
// prettier-ignore
export const linearString = <LineChart data={data} xKey="name" xScale="linear" yKey="amount" />;
// @ts-expect-error Time scale requires Date objects, not strings.
// prettier-ignore
export const timeString = <AreaChart data={data} xKey="name" xScale="time" yKey="amount" />;
// @ts-expect-error UTC scale requires Date objects, not numbers.
// prettier-ignore
export const utcNumber = <LineChart data={data} xKey="amount" xScale="utc" yKey="amount" />;
// @ts-expect-error Numeric axis formatter receives numbers.
// prettier-ignore
export const wrongNumericTick = <LineChart data={data} xKey="name" yKey="amount" yAxis={{ formatTick: (value: string) => value }} />;
// @ts-expect-error Date axis formatter receives Date objects.
// prettier-ignore
export const wrongDateTick = <LineChart data={data} xKey="when" xScale="time" yKey="amount" xAxis={{ formatTick: (value: number) => String(value) }} />;
// @ts-expect-error A categorical formatter must handle all CategoryValue variants.
// prettier-ignore
export const narrowCategory = <BarChart data={data} xKey="name" yKey="amount" xAxis={{ formatTick: (value: string) => value }} />;
// @ts-expect-error Horizontal bar xAxis is numeric.
// prettier-ignore
export const wrongHorizontal = <BarChart data={data} orientation="horizontal" xKey="name" yKey="amount" xAxis={{ formatTick: (value: Date) => String(value) }} />;
// @ts-expect-error Horizontal bar yAxis is categorical and has no min.
// prettier-ignore
export const horizontalMin = <BarChart data={data} orientation="horizontal" xKey="name" yKey="amount" yAxis={{ min: 0 }} />;
// @ts-expect-error Bar does not expose continuous x scales.
// prettier-ignore
export const barScale = <BarChart data={data} xKey="amount" yKey="amount" xScale="linear" />;
// @ts-expect-error Pie has no axes.
// prettier-ignore
export const pieAxis = <PieChart data={data} nameKey="name" valueKey="amount" xAxis={{}} />;
// @ts-expect-error Donut has no series.
// prettier-ignore
export const donutSeries = <DonutChart data={data} nameKey="name" valueKey="amount" series={series} />;
// @ts-expect-error Pie has no grid.
// prettier-ignore
export const pieGrid = <PieChart data={data} nameKey="name" valueKey="amount" showGrid />;
// @ts-expect-error Pie value mapping must be numeric.
// prettier-ignore
export const pieString = <PieChart data={data} nameKey="name" valueKey="name" />;
// @ts-expect-error Segment tooltip has no Cartesian inspection mode.
// prettier-ignore
export const pieMode = <PieChart data={data} nameKey="name" valueKey="amount" tooltip={{ mode: 'shared' }} />;
// @ts-expect-error Accessibility cannot disable the data alternative.
// prettier-ignore
export const hiddenTable = <PieChart data={data} nameKey="name" valueKey="amount" accessibility={{ dataTable: 'none' }} />;
// @ts-expect-error Wrong record assumption in callback.
// prettier-ignore
export const wrongActivation = <LineChart data={data} xKey="name" yKey="amount" onDataActivate={(p: CartesianActivation<{ other: number }>) => p.record.other.toFixed()} />;
// @ts-expect-error Wrong record assumption in segment callback.
// prettier-ignore
export const wrongSegment = <PieChart data={data} nameKey="name" valueKey="amount" onDataActivate={(p: SegmentActivation<{ other: number }>) => p.record.other.toFixed()} />;
// @ts-expect-error Null-only fields are not numeric.
// prettier-ignore
export const nullKey: NumericFieldKey<Row> = 'empty';
// @ts-expect-error Never fields are not numeric.
// prettier-ignore
export const neverKey: NumericFieldKey<Row> = 'impossible';
// @ts-expect-error Boolean fields are not categorical.
// prettier-ignore
export const boolKey: CategoricalFieldKey<Row> = 'flag';

// @ts-expect-error Internal package subpaths are not public.
import type { LineChartProps as InternalProps } from 'react-simple-charts/types/contracts';
// @ts-expect-error The package has no runtime chart exports yet.
import { LineChart as RuntimeChart } from 'react-simple-charts';
export type RejectedInternalImport = InternalProps<Row>;
export const rejectedRuntimeImport = RuntimeChart;
