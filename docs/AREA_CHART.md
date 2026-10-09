# Public AreaChart — M03-T03

Import the generic component from the sole package root:

```tsx
import { AreaChart } from 'react-simple-charts';

const data = [
  { month: 'Jan', actual: -2, forecast: 1 },
  { month: 'Feb', actual: 5, forecast: 3 },
  { month: 'Mar', actual: null, forecast: 2 },
];

export function Revenue() {
  return (
    <AreaChart
      data={data}
      xKey="month"
      series={[
        { key: 'actual', label: 'Actual', color: '#2563eb' },
        { key: 'forecast', label: 'Forecast', color: '#0d9488' },
      ]}
      width={640}
      accessibility={{ label: 'Revenue', dataTable: 'visible' }}
      onDataActivate={(datum) => console.log(datum.record, datum.inputMethod)}
    />
  );
}
```

TypeScript infers records from data. Single series use `yKey="actual"` instead of
`series`; supplying both is rejected. The approved AreaChartProps contract is
unchanged: category X is default, linear requires a numeric field, UTC and local
`time` require a Date field. Axes retain scale-specific formatter argument types.
No fill opacity, stacking, baseline, interpolation or gradient props are added.

## Geometry and presentation

Data → normalization → `buildCartesianGeometry({ family: 'area' })` → exact
zero-baseline fill paths and pure-core line boundary paths → SVG → shared point
inspection. Normalization preserves original records, Date identities, raw values,
indices and configured series order. Layout owns domains, axes, grids and the
physical zero coordinate. React performs no mathematical path construction.

Positive fills extend upward from zero; negative fills extend downward. Mixed
signs cross the actual zero baseline. Zero-only paths may have zero area. Explicit
Y bounds must include zero; otherwise rendering is unavailable. Out-of-bounds
geometry is preserved and visually clipped to the exact plot rectangle.

Each series has its own unstacked area. No values are summed. Missing or invalid
X/Y ends only that series run; leading, trailing and consecutive gaps are safe.
Singleton runs retain original markers and inspection without a fill or boundary.
Source order is authoritative even for repeated categories or timestamps.

Fill opacity is an internal presentation choice of 0.2. The fill has no stroke:
its baseline and closing walls must not appear as observed data boundaries. A
separate 2px boundary uses the existing pure line-path calculation on the same
mapped run. Markers retain LineChart's treatment. Colors follow configured series
color, palette, then existing CSS-variable/default palette precedence; markers,
boundary, legend, tooltip and activation all share the unchanged resolved color.
Opacity does not alter callback colors. Axes/gridlines and the static multi-series
legend use the established LineChart presentation; `showLegend=false` hides it.

## Inspection, tooltips and activation

Inspection is point-based. Filled polygons have no independent hit testing.
Transparent 10px controls outside decorative clipping expose valid in-plot points;
clipped observations remain in the complete source table. Overlapping observations
can obscure pointer targets; keyboard traversal preserves eligible points.

Tooltip omission or `true` enables shared mode. `false` hides tooltips without
disabling activation. Functions and `{ mode: 'shared' | 'item', render }` objects
use the approved discriminated context; custom renderers may return null. Shared
mode includes valid values from the same original source row, in configured series
order, even when another series value is clipped. Repeated labels/numbers/dates
never combine rows. Item mode contains only the inspected original datum.
Tooltips use bounded approximate placement outside SVG clipping, without portals.

One roving Tab entry traverses source-row/series order. Arrow keys navigate,
Home/End select endpoints, Enter/Space activate, Escape dismisses. Tab leaves
normally; focus has a visible ring and tooltip relationships. Touch release
selects persistently and activates once; a local Dismiss inspection button clears
it. Mouse/pen gestures report `pointer`, touch reports `touch`, Enter/Space and
standalone assistive-technology clicks without pointer evidence report `keyboard`.
The single shared engine preserves gesture-scoped synthetic-click deduplication,
cancellation, blur and subsequent unrelated activations. Payloads retain exact
source references, index, category, value, key, label and resolved color.

## Sizing, server rendering and animation

Default width is responsive `100%`; default height is 280px. Explicit positive
numeric widths render complete deterministic category/linear/UTC SVG on the
server. Responsive/string widths reserve an accessible placeholder until a
per-container ResizeObserver reports valid dimensions. No width is guessed.
Missing observer support retains the placeholder/table; effects clean up safely.

Local time always has a stable SSR/initial hydration placeholder, followed by
client-local geometry. UTC is preferable for complete cross-timezone SSR.
Locale-sensitive custom formatters must behave consistently on server/client;
Date formatter arguments are copies. React useId gives sibling charts unique
references; independent roots need matching `identifierPrefix` values.

Animation defaults off. `animate=true` optionally enhances decorative fill,
boundary and marker opacity over 180ms after mount. SSR remains fully visible;
geometry and axes never move. Reduced-motion preferences disable/cancel the
animation, effects clean up, and absent animation APIs leave static presentation.

## Accessibility, states and limits

Supply a meaningful accessibility label and optional description; the fallback is
“Area chart”. A complete semantic source table is always present, visually hidden
by default or visible with `dataTable: 'visible'`. Missing/invalid values are
identified rather than fabricated as zero. Repeated labels retain distinct rows.
Invalid mappings use a raw source table. Decorative marks are hidden; point
controls have no hidden ancestor and remain outside clipping.

Ready results show real marks; empty shows “No chart data”; unusable shows
“Chart rendering unavailable”; pending shows a sizing/timezone placeholder.
None exposes phantom controls, fallback observations or stack traces.

Translucent areas still overlap, so series order and colors affect perception.
No stacking, smoothing, gradients, custom baselines, polygon inspection, crosshair,
zoom/pan, interactive legend or decimation is implemented. Rendering and lookup
construction scale with points; large SVG/control counts have DOM/sorting costs.
Pointer movement does not normalize data or measure the DOM. Arbitrary custom
tooltip content may exceed approximate positioning. Host CSS/strict CSP can affect
inline styling. Chromium and focused axe checks do not certify WCAG compliance,
real screen-reader behavior or Firefox/WebKit compatibility. Broader browser
policy, performance budgets, theme tokens and release approval remain Development
Lead decisions. BarChart is public; Pie/Donut remain types only. The package stays private 0.0.0.

M03-T05 adds shared long-text wrapping and cross-family validation; see [integration hardening](M03_INTEGRATION_HARDENING.md).
