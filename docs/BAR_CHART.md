# Public BarChart — M03-T04

Import `BarChart` from `react-simple-charts`. The package is private at 0.0.0;
these examples describe the packaged API, not an available npm release.

```tsx
import { BarChart } from 'react-simple-charts';

const data = [
  { department: 'Support', actual: 12, budget: 15 },
  { department: 'Support', actual: -3, budget: 8 },
  { department: 'Engineering', actual: 0, budget: null },
];

<BarChart
  data={data}
  xKey="department"
  series={[
    { key: 'actual', label: 'Actual' },
    { key: 'budget', label: 'Budget' },
  ]}
  accessibility={{ label: 'Department balance', dataTable: 'visible' }}
/>;

<BarChart
  data={data}
  xKey="department"
  yKey="actual"
  orientation="horizontal"
  xAxis={{ min: -5, max: 20, label: 'Balance' }}
  yAxis={{ label: 'Department' }}
  tooltip={{ mode: 'shared' }}
  onDataActivate={(datum) => console.log(datum.record, datum.inputMethod)}
/>;
```

## Mapping and physical axes

The existing `BarChartProps<T>` infers records from `data`; mappings and callbacks
use `NoInfer<T>` to preserve that inference. Supply exactly `yKey` or `series`.
Nullable/optional numeric fields qualify. `xKey` always identifies categories,
including strings, numbers and Dates. There is no continuous `xScale` prop.
Horizontal rendering never transposes records or swaps mapping keys.

Vertical is the default: category X and numeric Y. Horizontal uses numeric X and
category Y, with categories in original top-to-bottom source order. The orientation
union checks physical axis formatter types and limits min/max to the numeric axis.
`formatCategory` supplies category ticks; `formatValue` supplies numeric ticks.
Explicit axis `formatTick` wins. Axis labels, visibility, tickCount and value grids
reuse the existing layout engine; horizontal value grids are vertical lines.
Numeric bounds must include zero under the existing foundation policy.

## Geometry and presentation

Source data passes through `normalizeCartesian`, then
`buildCartesianGeometry({ family: 'bar', orientation, ... })`. The SVG module
consumes every `BarRectangle` coordinate and extent verbatim. Vertical positives
extend up and negatives down; horizontal positives extend right and negatives
left. Mixed signs share the actual layout zero baseline. Zero rectangles retain
zero height/width; no minimum decorative extent, default radius or stroke is added.
Opacity is 1. Stacking is unsupported.

Groups occupy 80% of each category band; each configured series receives an equal
slot, with its rectangle occupying 90% of that slot. Missing/invalid observations
retain conceptual slots but emit no data rectangle. Duplicate categories retain
separate bands keyed by original row index. Configured series order is authoritative.
Inputs remain unchanged, including original record and categorical Date references.

Color precedence is series color, supplied palette, existing CSS series variables,
then the deterministic internal palette. Legend and tooltip colors use the same
resolver. `className` and `style` apply to the figure; no stylesheet is required.
Static multi-series legends can be hidden with `showLegend={false}`.

## Inspection and activation

Bar defaults to **item** tooltips for omission, true and function renderers.
`{ mode: 'shared' }` collects valid observations from the same original row in
configured series order, including values clipped by bounds. Missing/invalid
values are excluded; matching category text never merges source rows. Custom
renderers may return null. `tooltip={false}` disables presentation while activation
remains available. Tooltips preserve raw signed values, records, indices, categories,
series keys/labels and resolved colors; Date formatters receive protective copies.

Presentation-only hit regions intersect rectangles with the plot. A partially
clipped bar remains eligible; a wholly invisible nonzero rectangle has no control.
Zero bars at an in-plot baseline have a transparent 12px numerical-direction target,
clipped to the plot and restricted to their decorative category extent. Decorative
geometry never changes. Nonzero hit regions use the visible extent without a
minimum pixel size. Dense/tiny slots consequently remain difficult pointer targets;
keyboard inspection and complete source tables remain available. Adjacent zero
regions retain their series slots and do not intentionally overlap.

One Tab entry traverses eligible source-row/series order in either orientation.
Arrows move, Home/End jump, Enter/Space activate, Escape dismisses; Tab leaves
normally. Focus has an independent stroke and graphic outline. Mouse/pen report
`pointer`, native touch reports `touch`, and keyboard or standalone assistive-tech
clicks report `keyboard`. Shared gesture evidence handles cancellation and synthetic
click deduplication, including activation-triggered parent rerenders. Inspection,
focus and resizing do not activate data.

## Dimensions, SSR, animation and accessibility

Default dimensions are 100% width and 280px height. Positive finite explicit width
renders deterministic server SVG. Responsive/string width starts with the stable
measurement placeholder and source table, then uses the existing per-container
ResizeObserver. Missing observers retain that placeholder; cleanup ignores late
callbacks. Categorical Dates need no local-time scale transition. Caller formatters
must still produce consistent server/client text. React useId supplies title,
description and clip IDs; separately hydrated roots need matching identifierPrefix.

Static rendering is the default. `animate` optionally applies 180ms client opacity
to decorative marks, respects reduced motion and cancels on cleanup. Server markup
is fully visible; there is no baseline movement or artificial growth.

The default accessible name is “Bar chart”; provide a meaningful label and optional
description. Every state includes the semantic source table, visible or visually
hidden, with ordered rows, duplicate categories, zero, Missing and Invalid values.
Invalid mappings retain a raw source-field table. Decorative layers are aria-hidden;
controls remain exposed and tooltips sit outside SVG clipping. Empty state says
“No chart data”; unsafe geometry/dimensions say “Chart rendering unavailable”.
No unsafe partial marks or nonfinite SVG attributes are emitted.

## Validation and limits

Focused real-geometry, interaction, browser-free SSR and hydration tests accompany
existing unchanged Line/Area regressions. Package verification checks exactly three
runtime exports, generated generic declarations, client boundary and external React.
The genuine Vite/Next matrix and measured artifacts are recorded in
[consumer compatibility](CONSUMER_COMPATIBILITY.md).

Large data creates O(rows × series) SVG rectangles and controls; no virtualization
or decimation is included. Tick selection uses estimates, may omit labels/titles,
and offers no wrapping or scrolling. Tooltip positioning uses the existing bounded
200px panel estimate; arbitrary custom content can overflow. Host CSS may change
appearance, and inline styling requires compatible CSP. Chromium/axe coverage does
not establish WCAG certification, screen-reader, Firefox/WebKit, forced-colors or
zoom coverage. Broader accessibility/browser review, performance budgets and final
visual tokens remain for hardening. Pie, Donut and stacking remain deferred.

M03-T05 adds shared long-text wrapping and cross-family validation; see [integration hardening](M03_INTEGRATION_HARDENING.md).
