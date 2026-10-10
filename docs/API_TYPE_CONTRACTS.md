# Public TypeScript contracts — M01-T02

RSC-026/RSC-027 contracts are preserved. LineChart is a public runtime component
as of M03-T02; AreaChart is public as of M03-T03. BarChart is public as of M03-T04; PieChart is public as of M04-T02; DonutChart is public as of M04-T03.
See [LineChart behavior](LINE_CHART.md) for runnable examples and runtime defaults. Import every public type from the package root.

```ts
import type {
  LineChartProps,
  SeriesConfig,
  DonutChartProps,
} from 'react-simple-charts';

interface Sales {
  month: string;
  date: Date;
  revenue: number | null;
  forecast?: number;
}
const data: readonly Sales[] = [];
const single = {
  data,
  xKey: 'month',
  yKey: 'revenue',
  formatValue: (value) => `$${value.toFixed(2)}`,
} satisfies LineChartProps<Sales>;

const series: readonly SeriesConfig<Sales>[] = [
  { key: 'revenue', label: 'Revenue', color: '#2563eb' },
  { key: 'forecast', label: 'Forecast' },
];
const multiple = {
  data,
  xKey: 'month',
  series,
} satisfies LineChartProps<Sales>;
const dated = {
  data,
  xScale: 'utc',
  xKey: 'date',
  yKey: 'revenue',
  xAxis: { formatTick: (date) => date.toISOString() },
} satisfies LineChartProps<Sales>;
```

## Structure and field mappings

`CommonChartProps<T>` carries readonly `data`, optional `width` (number or string),
`height` (number), `className`, React `style`, readonly `colors`, `animate`,
`formatValue`, `accessibility`, and `showLegend`. Props and records are not mutated.
The record generic is constrained to `object` on the five chart contracts; it
requires neither a string index signature nor a specially shaped application record.

`CartesianChartProps<T>` adds grid, category formatting, Cartesian tooltip, and
Cartesian activation options. `CartesianValues<T>` requires exactly one of
`yKey` or readonly `series`. `series` entries contain a numeric `key` and optional
`label` and `color`. Ordinary arrays work; empty arrays are deliberately accepted
for later runtime validation. No nonempty tuple annotation is needed.

`StringFieldKey<T>`, `NumericFieldKey<T>`, `DateFieldKey<T>`, and
`CategoricalFieldKey<T>` retain string-named properties whose non-null types fit
string, number, Date, or string/number/Date respectively. Optional and nullable
fields qualify. Null-only and never fields do not. A number/string union is
categorical but not numeric. Numeric strings are never coerced; date strings are
never parsed. Boolean, object, symbol-named, and numeric-named fields are excluded.

The implementation uses a mapped type with `-?` to remove optionality from the
resulting key union, `NonNullable` to inspect meaningful values, and a
non-distributive conditional to reject partially incompatible unions:

```ts
// Simplified numeric field test:
// [NonNullable<T[K]>] extends [number] ? K : never
```

`NoInfer<T>` on field mappings and callback contexts keeps inference anchored to
`data`. This prevents an invalid field or callback from influencing the inferred
record type. The real LineChart, AreaChart and BarChart imports demonstrate JSX inference; PieChart also uses its actual runtime import; Donut also uses its actual runtime import. `satisfies ChartProps<Record>` is convenient
for validating reusable prop objects; plain object literals may widen string
keys before assignment, so annotate them or use `satisfies` at construction.

## Scales, axes, and formatting

| Chart / setting              | Required xKey field                   | xAxis ticks   | yAxis ticks   |
| ---------------------------- | ------------------------------------- | ------------- | ------------- |
| Line/Area category (default) | string, number, Date, or their unions | CategoryValue | number        |
| Line/Area linear             | number                                | number        | number        |
| Line/Area utc or time        | Date                                  | Date          | number        |
| Bar vertical (default)       | categorical                           | CategoryValue | number        |
| Bar horizontal               | categorical                           | number        | CategoryValue |

`CartesianXScale<T>` discriminates on `xScale`; `BarChartProps<T>` discriminates
on `orientation`. A horizontal Bar still uses `xKey` for category and `yKey` or
`series` for values. Axes refer to physical screen directions, so their types
reverse. Bar exposes no `xScale` option. Area shares the current Line contract;
family-specific visual controls remain outside this milestone.

`AxisConfig<V>` supports `show`, `label`, `tickCount`, and `formatTick(value)`.
`NumericAxisConfig` additionally supports `min` and `max`. Date axes receive
Date ticks. Tick formatters do not require a source record because generated
ticks need not correspond to a record. `formatValue` receives only a number.
`formatCategory` and categorical axis formatters receive `CategoryValue`, the
union string | number | Date. Formatters return strings and do not alter data.

Categorical callbacks intentionally use the small shared union rather than
tracking the exact selected field through additional generics. Even with a
string-only xKey, use `String(value)` or narrow the value in the formatter.
This sacrifices exact field-level precision for simple contextual typing and
predictable generic inference. Numeric and date scale tick types remain exact.

## Tooltips and activation

Both tooltip families accept `true`, `false`, a configuration object, or a custom
`(context) => ReactNode` renderer. Omission intends the default enabled tooltip.
Cartesian configuration supports `mode: 'shared' | 'item'` and `render`.
The intended default is shared inspection for Line/Area, item inspection for
Bar, and segment inspection for Pie/Donut.
`CartesianTooltipContext<T>` is a discriminated union: shared inspection has
`category` and readonly `items`; item inspection has one `item`. Renderers narrow
`context.mode`; the renderer input remains the complete union even if a config
specifies a fixed mode. This avoids another layer of mode generics.

Every `CartesianDatum<T>` preserves `record: T`, original `index`, raw `value`,
`seriesKey`, resolved `seriesLabel`, resolved `color`, and raw `category`.
The same datum serves single-series and multi-series inspection. The single
series key is the configured yKey. Shared inspection can preserve each item's
own source record and index; no aligned-index or shared-record assumption is
imposed by the contract.

Segment configuration has only `render`; no Cartesian mode is available.
`SegmentTooltipContext<T>` contains `segment: SegmentDatum<T>` with original
record/index, raw value, `segmentId`, raw `label`, resolved color, and percentage
on a **0–100** scale. `segmentId` equals the original record index, allowing
duplicate labels without losing identity. No DOM event or SVG geometry is public.

`onDataActivate` receives `CartesianActivation<T>` or `SegmentActivation<T>`.
These extend their inspection datum with
`inputMethod: 'pointer' | 'keyboard' | 'touch'`. Pointer identifies mouse/pen
activation; touch is reported separately. Consumers can branch on `inputMethod`
in either activation callback. LineChart reports mouse/pen, keyboard and touch activation separately.
No persistent selection is introduced.

```ts
const interactive = {
  data,
  xKey: 'month',
  yKey: 'revenue',
  tooltip: (context) =>
    context.mode === 'item'
      ? context.item.record.month
      : String(context.category),
  onDataActivate: (payload) => {
    console.log(payload.record.month, payload.value, payload.inputMethod);
  },
} satisfies LineChartProps<Sales>;

const donut = {
  data,
  nameKey: 'month',
  valueKey: 'revenue',
  showLabels: true,
  innerRadiusRatio: 0.6,
  centerContent: 'Revenue',
  tooltip: {
    render: ({ segment }) => `${segment.record.month}: ${segment.percentage}%`,
  },
  accessibility: { label: 'Monthly revenue', dataTable: 'visually-hidden' },
} satisfies DonutChartProps<Sales>;
```

Pie and Donut expose `nameKey` (categorical), `valueKey` (numeric), `showLabels`,
segment tooltip/activation, and the common props. Donut additionally accepts
`innerRadiusRatio` and React-compatible `centerContent`. They expose no axes,
grid, x-scale, or Cartesian series configuration.

Accessibility options are `label`, `description`, and `dataTable` with only
`visible` and `visually-hidden`. There is no mode that removes the accessible
data alternative. LineChart and AreaChart implement source tables and roving point inspection; BarChart implements source tables and roving rectangle inspection; PieChart implements source tables and roving segment inspection.

## Intended defaults and runtime responsibilities

This section began as M01-T02 implementation intentions. Cartesian defaults are implemented in M03 and Pie defaults in M04-T02; Donut defaults are implemented in M04-T03:
width `100%`, height `280` (280px), animation disabled for LineChart, axes visible, grid enabled for
Cartesian charts, legend enabled, tooltip enabled (Line/Area shared, Bar item, Pie/Donut segment inspection), category
x-scale, vertical Bar orientation, segment labels hidden, accessible table
visually hidden, Donut inner radius ratio `0.6`. Cartesian palette fallbacks, automatic series labels, default formatting, accessible naming and pure tick generation are implemented; see the public chart documents. Pie presentation is documented in [PieChart](PIE_CHART.md); Donut presentation is documented in [DonutChart](DONUT_CHART.md). No default is encoded by making a property required.

Runtime must validate dimensions, ratios, finite numbers, min/max ordering,
tick counts, empty data/series, and label/color resolution. Null/undefined numeric
fields are valid mappings, not valid numbers for inspection: emitted datum values
are numbers, and runtime must decide how missing/invalid records are handled.
Cartesian signed values, ordering, scale domains, date validity, normalization and missing categories are implemented in the pure engine; this file is not its algorithm specification. M04-T01 implements pure polar negative rejection, zero-total states and exact percentages. Inputs are preserved in payloads. LineChart runtime normalization and rendering
now implement these Cartesian responsibilities; PieChart now implements the polar presentation responsibilities; Donut implements ring presentation in M04-T03.

TypeScript is structurally typed: excess-property checks protect fresh literals
and JSX, but do not make object types exact. Extra fields on previously assigned
objects can pass structural assignment. `any`, assertions, broad index signatures,
and untyped JavaScript can bypass field checks. A dynamically chosen orientation
or scale may require narrowing into the corresponding union branch first.

## Validation and compatibility

`npm run test:types` checks the source barrel with strict declarations and
`@ts-expect-error` assertions. `npm run verify:package` builds, compares all
public exports, and compiles the same JSX/type suite through the actual package
root with NodeNext resolution and no source alias. Foundation runtime-export,
internal-subpath rejection, client-boundary, and React externalization checks remain.
The regular typecheck excludes this dedicated suite so its source alias cannot
accidentally substitute for package consumer verification.

The supported development compiler is the foundation's TypeScript 6.x.
`NoInfer` requires TypeScript 5.4 or newer; compatibility with older compilers is
not promised or tested. ReactNode and CSSProperties use only shared React 18/19
APIs. Test declarations return ReactElement, avoiding the React 18/19 differences
in allowable component return types. CI pairs React 18 and 19 runtimes with their
matching type definitions on Node 22/24. No global JSX namespace is required.

Local validation used Node 24.19.0 and TypeScript 6.0.3. Typechecking, source
type tests, and built-package verification passed with React types 18.3.31
(React DOM types 18.3.7) and again with React/React DOM types 19.3.0.
The four foundation unit tests, ESLint, formatting, library/playground builds,
and dry-run packing passed. Runtime tests used React 19.3.0; the full Node
22/24 and React 18/19 CI matrix is separate from these local checks.

M03-T03 preserves AreaChartProps without changes. Actual packaged AreaChart JSX
now exercises the contract; see [AreaChart behavior](AREA_CHART.md).

## M03-T04 public BarChart

BarChart now consumes existing grouped rectangle geometry in both orientations.
Physical formatter routing preserves semantic xKey categories; shared presentation
and corrected gesture handling also serve Line/Area. Item inspection is the Bar
default; visible rectangle intersections and in-plot zero targets determine
eligibility. Exact decorative extents, stable missing slots, source tables and
SSR policy are preserved. No public props, dependencies, core math changes or
subpaths are added. See [BarChart](BAR_CHART.md). M03-T05 preserves these contracts and validates integration; see [integration hardening](M03_INTEGRATION_HARDENING.md).

## M04-T02 public PieChart

PieChart now uses the actual root runtime import in JSX inference and installed
consumer tests. Its existing `PieChartProps<T>`, `SegmentDatum<T>`, activation and
tooltip contracts are unchanged; no new public types or props are exported.
Labels/values remain data-driven NoInfer mappings. Percentage remains 0–100 and
source segmentId remains original index. Default labels are off; legend/tooltips
are on. Root runtime exports are exactly LineChart, AreaChart, BarChart, PieChart.
DonutChart remains a type-only contract. See [PieChart](PIE_CHART.md).

## M04-T03 public DonutChart

The actual root import now exercises generic Donut JSX through both source and
installed declarations. DonutChartProps<T> still extends PieChartProps<T> with
only optional numeric innerRadiusRatio and ReactNode centerContent. Runtime ratio
validation belongs to the pure engine; omitted defaults to 0.6. All five runtime
chart exports retain their approved type exports and root-only ESM contract.
See [DonutChart](DONUT_CHART.md).
