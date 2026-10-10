# PieChart — M04-T02

Import the public component and all types from the package root:

```tsx
import { PieChart } from 'react-simple-charts';

const data = [
  { name: 'Product', value: 48 },
  { name: 'Services', value: 32 },
  { name: 'Support', value: 20 },
];
<PieChart data={data} nameKey="name" valueKey="value" width={480} />;
```

## TypeScript and props

JSX infers the record directly from `data`. `NoInfer` keeps mappings and callbacks
from widening it. Optional/nullable categorical and numerical keys qualify;
unknown keys and incompatible field types fail compilation. No index signature
is needed. Props, data, records, Dates and color arrays are not mutated.

```tsx
import type { PieChartProps } from 'react-simple-charts';
interface Allocation {
  name: string;
  amount: number | null;
  accountId: string;
}
const allocations: readonly Allocation[] = [];
const props = {
  data: allocations,
  nameKey: 'name',
  valueKey: 'amount',
  tooltip: ({ segment }) => segment.record.accountId,
  onDataActivate: (segment) =>
    console.log(segment.record.accountId, segment.inputMethod),
} satisfies PieChartProps<Allocation>;
<PieChart {...props} />;
```

| Prop                 | Behavior / default                                                     |
| -------------------- | ---------------------------------------------------------------------- |
| `data`               | Required readonly source records, in source order                      |
| `nameKey`            | Required string-named categorical field (string, number or valid Date) |
| `valueKey`           | Required string-named finite numerical field                           |
| `width`              | Positive numeric pixels or container CSS width; omitted means `100%`   |
| `height`             | Numeric pixels, default 280                                            |
| `className`, `style` | Applied to the figure, self-contained inline styling                   |
| `colors`             | Readonly color array indexed by original source index, cycling         |
| `animate`            | Default false; optional decorative opacity enhancement                 |
| `formatValue`        | Numerical value to string, for table, controls and default tooltip     |
| `accessibility`      | Optional `label`, `description`, `dataTable`                           |
| `showLegend`         | Default true, static positive-segment list                             |
| `showLabels`         | Default false, conservative interior label fitting                     |
| `tooltip`            | Default enabled; boolean, function, or `{ render }`                    |
| `onDataActivate`     | Optional approved `SegmentActivation<T>` callback                      |

Labels accept strings, finite numbers and valid Dates, including cross-realm Dates.
Dates use ISO text by default, without locale or timezone guessing. Numerical
strings are invalid; values are not coerced. Formatter failures fall back to safe
source text. Caller formatters must be deterministic for SSR and hydration.

## Marks, colors, legend and labels

The pure engine computes all proportions, angles, radii and paths. The renderer
uses those exact local paths translated by engine center metadata. The first
slice starts at twelve o'clock, advancing clockwise in source order. Duplicate
labels remain separate. A single positive record is a full circle with two arcs.
White/background-variable boundaries separate adjacent slices without changing
the geometry. There are no axes or public radius/angle settings.

Configured colors take precedence; otherwise shared CSS variables
`--rsc-series-N-color`, then `--rsc-series-color`, fall back to the cycling palette
`#2563eb`, `#0d9488`, `#9333ea`, `#c2410c`, `#be185d`. N is the original index + 1.
Excluded rows do not shift later colors. Marks, legend and inspection payloads
use the same resolution. Background, text and focus use existing shared variables.
Interior labels use a contrasting text outline for legibility. No stylesheet is mandatory.

The legend is a wrapping semantic list of drawable positive segments. It retains
duplicate entries and has no interaction. Zero, missing and invalid entries appear
in the complete source table instead. `showLegend=false` hides only this list.

`showLabels=true` requests the source label at 60% of radius along the angle
bisector. Labels require span >= 0.5 radians, radius >= 48px, <= 18 characters,
and a conservative estimated 7px-per-character width within the interior chord
and radius allowance. No path parsing, slice reshaping, text measurement or
collision avoidance is performed. Wide glyphs and host fonts can exceed estimates.
Tiny/long labels are skipped visually; table, control name and tooltip retain them.

## Inspection, tooltips and activation

Hover or focus inspects; movement and focus do not activate. Default tooltips show
label, formatted source value and percentage with **one decimal place**. The raw
engine percentage remains exact in the payload on the approved 0–100 scale.
Small positive percentages can display `0.0%`; no angle or value is adjusted.

```tsx
<PieChart {...props} tooltip={false} />;
<PieChart
  {...props}
  tooltip={({ segment }) => (
    <span>
      {String(segment.label)}: {segment.percentage.toFixed(2)}%
    </span>
  )}
/>;
<PieChart
  {...props}
  tooltip={{ render: ({ segment }) => segment.record.accountId }}
/>;
```

`true`, omission and `{}` use the default. Custom renderers receive
`SegmentTooltipContext<T>` with `segment`; returning null is valid. `false` hides
tooltip presentation without disabling inspection or activation. Payloads preserve
original `record`, `index`, `segmentId`, `label`, `value`, resolved `color`, and
engine `percentage`. Segment IDs equal original source indices, not label text
or persistent application IDs across insertions.

Tooltips are noninteractive HTML siblings positioned approximately at the slice
bisector, bounded horizontally using the existing 220px presentation estimate.
They wrap text, have no Tab stop, portal or DOM measurement. Arbitrary custom
content may overflow vertically. A local dismissal button is available for pointer
and touch inspection. Keyboard Escape dismisses inspection.

One roving Tab entry exposes every positive slice as an SVG button. ArrowRight /
ArrowDown advance; ArrowLeft / ArrowUp retreat; boundaries clamp. Home / End choose
endpoints. Enter / Space activate with `keyboard`; repeated keydown does not
reactivate. Escape dismisses; Tab / Shift+Tab leave normally. Focus has a visible
shared-color outline on the exact sector. Focus never triggers activation.

Mouse/pen clicks activate with `pointer`. Touch release activates once with
`touch`; matching delayed native compatibility clicks are consumed by pointer ID.
Task-scoped click evidence handles immediate synthetic clicks and keyboard clicks.
Standalone accessibility clicks without pointer evidence report `keyboard`.
Cancellation clears the gesture, and subsequent independent gestures remain valid.
Selection retains source array, record, index and value provenance; replacement
clears stale inspection and focused controls move safely to the first valid slice.
Responsive resizing preserves inspection of the same source record.

Pointer targets use the exact sector path. Expansion at shared boundaries could
activate neighbors, so no overlapping targets or fabricated visible area are used.
Extremely narrow sectors are difficult to point at; all remain keyboard reachable.
Large positive ratios that cannot retain safe representable arcs make the complete
engine result unavailable instead of silently dropping a positive observation.

## Accessibility, source tables and states

The SVG is a named group, default **Pie chart**, with exposed interactive controls
and hidden decorative layers. `accessibility.label` and `description` use stable
React `useId` title/description relationships; tooltip relationships resolve.
Multiple instances have unique IDs. Independent roots require matching distinct
`identifierPrefix` values on server and client.

A semantic source table exists in every state. It preserves all rows and order,
duplicate labels, valid zeros, Missing/Invalid classification and original finite
negative values. Caption, column headers and row headers remain exposed. A clipped wrapper bounds the intrinsic width of hidden HTML tables. It is
visually hidden by default; `accessibility.dataTable='visible'` shows it with
long-content wrapping; `'visually-hidden'` explicitly selects the default mode. Invalid mappings use a safe raw-field table without
invented mapped columns; malformed nonarray data yields an empty raw source table.

Ready renders all engine slices. Empty says “No chart data”; it never invents a
100% placeholder. Zero has no sector. Missing/invalid labels or values are excluded
from drawable geometry and totals. Any finite negative makes the entire geometry
unavailable, even with an invalid label; no partial positive pie is shown.
Unusable says “Chart rendering unavailable”, without internal diagnostics/stacks.
Initial responsive measurement has a distinct named pending message. Tables are
retained across empty, unavailable, measurement and hydration transitions.

## Dimensions, SSR and animation

Explicit finite positive numeric width renders complete deterministic SVG in Node
SSR. Dimensions must be <= MAX_SAFE_INTEGER; the engine margin requires both width
and height > 16px. Invalid dimensions show unavailable content with the full table. Figures are bounded
to their container; explicit SVG coordinates remain unchanged when CSS scales the SVG.
Responsive/string width starts with a stable accessible 280px default-height
placeholder and measures per container with ResizeObserver. No observer means the
placeholder/table remain; no width is guessed. Effects clean up under Strict Mode.
No browser globals are accessed during SSR or module initialization. The genuine
ESM root retains its `use client` boundary for Next App Router.

Animation defaults static. `animate=true` optionally enhances decorative opacity
from 0.65 to 1 over 180ms. Controls, labels' geometry and source data do not move.
Reduced motion disables/cancels it; geometry changes/unmount clean up effects.
Absent animation APIs leave fully meaningful static marks, including SSR.

## Limits and deferred work

No interactive legend, aggregation, drilldown, center content, angle interpolation,
Canvas, chart rotation or theme API is implemented. Pie has no center-content prop;
DonutChart is public as of M04-T03 and provides center content. Large SVG/control counts have DOM cost;
no performance optimization or budget is claimed. Inline styles and host CSS/CSP
can affect presentation; custom tooltip sizing and label fitting are approximate.
Chromium/axe checks do not establish full WCAG conformance, manual screen-reader
behavior, Firefox or WebKit compatibility. These remain review gaps.

## M04-T03 subsequent integration

[DonutChart](DONUT_CHART.md) is now public using the same polar renderer and
inspection implementation. The pure geometry engine is unchanged. Pie keeps
filled sectors, original labels, colors, tables, payloads and interaction; only
Donut accepts ratio/center content and uses ring-aware presentation. Earlier
milestone statements above preserve historical task boundaries.

## M04-T04 combined-page hardening

See [five-chart integration](M04_INTEGRATION_HARDENING.md) for the shared-page
audit, reproducible browser checks and demo handoff. The public contract and
pure geometry are unchanged.
