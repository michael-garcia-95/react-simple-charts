# DonutChart — M04-T03

Import the component and types from the sole package root:

```tsx
import { DonutChart } from 'react-simple-charts';

const data = [
  { name: 'Product', value: 48 },
  { name: 'Services', value: 32 },
  { name: 'Support', value: 20 },
];
<DonutChart
  data={data}
  nameKey="name"
  valueKey="value"
  width={480}
  centerContent="Allocation"
/>;
```

Donut uses genuine engine-generated ring sectors. Its default inner radius is
0.6 times the outer radius; the default hole is empty. Pie remains filled and
accepts neither center content nor an inner radius ratio. No automatic total,
percentage, aggregation or center activation is fabricated.

## Generic TypeScript and props

JSX infers the original record from `data`; `NoInfer` mappings and callback types
cannot widen it. Nullable/optional categorical and numeric fields qualify. No
index signature is required; unknown keys and incompatible field types fail.

```tsx
import type { DonutChartProps } from 'react-simple-charts';
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
  innerRadiusRatio: 0.8,
  centerContent: (
    <>
      <strong>Budget</strong>
      <span>Current quarter</span>
    </>
  ),
  tooltip: ({ segment }) => segment.record.accountId,
  onDataActivate: (segment) =>
    console.log(segment.record.accountId, segment.inputMethod),
} satisfies DonutChartProps<Allocation>;
<DonutChart {...props} />;
```

| Prop                 | Behavior / default                                                 |
| -------------------- | ------------------------------------------------------------------ |
| `data`               | Required readonly original records, in source order                |
| `nameKey`            | Required categorical field: string, finite number or valid Date    |
| `valueKey`           | Required numeric field; finite positives draw slices               |
| `width`              | Positive numeric pixels, CSS string, or omitted `100%`             |
| `height`             | Numeric pixels, default 280                                        |
| `className`, `style` | Applied to the figure; essential styles are inline                 |
| `colors`             | Readonly cycling array, indexed by original source row             |
| `animate`            | Default false; optional 180ms decorative opacity enhancement       |
| `formatValue`        | Number-to-string formatter for table, controls and default tooltip |
| `accessibility`      | Optional `label`, `description`, `dataTable`                       |
| `showLegend`         | Default true; static list of drawable positive slices              |
| `showLabels`         | Default false; conservative ring-interior estimates                |
| `tooltip`            | Default enabled; boolean, function, or `{ render }`                |
| `onDataActivate`     | Optional `SegmentActivation<T>` callback                           |
| `innerRadiusRatio`   | Default 0.6; finite numeric value strictly between 0 and 1         |
| `centerContent`      | Optional ReactNode, displayed only for ready geometry              |

The approved public interface is unchanged. No pixel-radius controls, angle
settings, tooltip contracts or runtime dependencies are added. Inputs, records,
Dates and color arrays are preserved without mutation.

## Geometry and ratio validation

The pure pipeline is `normalizeSegments` → `buildPolarGeometry` with family
`donut` → shared polar presentation. D3 paths, angles, proportions, totals and
percentages come from that engine. Each exact path is translated by the retained
center metadata. Slices progress clockwise from 12 o'clock. A single positive
row creates a full ring with both outer and inner circular arcs.

The viewport center is `(width / 2, height / 2)` and outer radius is
`min(width, height) / 2 - 8`. Inner radius is outer radius times the validated
ratio. Explicit invalid ratios (zero, negative, one, above one, NaN, Infinity,
non-numeric values) produce “Chart rendering unavailable”. They are never clamped
or replaced by 0.6. Very small/large valid ratios still need representable radii
and safe engine paths; an underflowed or omitted inner arc is unavailable.

## Center content, fitting and accessibility

Text, numeric zero, fragments, nested React elements and ordinary interactive
buttons/links are supported. Content is not unconditionally aria-hidden and no
artificial wrapper Tab stop is added. A genuine button follows the SVG's roving
slice entry in document order. Its clicks do not activate a slice.

```tsx
<DonutChart {...props} centerContent={0} />;
<DonutChart
  {...props}
  centerContent={<button onClick={openDetails}>Details</button>}
/>;
```

A positioned HTML region is an inscribed square inside the actual circular hole.
Its dimensions are derived from engine inner radius and expressed as percentages
of an SVG-only frame. SVG height scales proportionally when its explicit width
is CSS-constrained; the region follows the displayed SVG, including non-square
viewports, responsive measurement, ratio changes and resizing. Legend/table height
is outside this frame. There are no portals, DOM text measurement or fixed-width
center assumptions. The region does not overlap ring hit targets.

Text wraps, and excessive content is clipped inside the region rather than
covering slices. Arbitrary large content, fixed-width user elements and long
controls may not fit, particularly in tiny holes. Supply concise content and
choose a suitable ratio; essential information should also exist outside the
chart. User-supplied styles and fonts can affect fitting. Center content is absent
on initial responsive placeholders, empty, invalid, negative or unsafe geometry.
It does not replace the source table, legend or accessible description.

## Colors, legend and ring labels

Source-index colors, palette/CSS-variable fallbacks and boundaries are shared
with [PieChart](PIE_CHART.md). Excluded rows never shift later colors; duplicate
names remain separate slices, controls and legend entries. Legend wraps in source
order and includes only drawable positive rows. `showLegend=false` hides only it.

Candidate Donut labels use the angle bisector at `(innerRadius + outerRadius) / 2`.
Estimated text dimensions (7px per character, with stroke allowance), angular
span, chord width and radial thickness determine conservative fitting. A bounding
circle around the estimated text box must remain within the ring and angular
allowance. Thin rings, tiny spans and long labels omit text; tables/tooltips/control
names still expose labels. This is approximate fitting, not text measurement or
exact collision detection. Pie label positions and fitting remain unchanged.

## Inspection, tooltips and activation

Default tooltips show source label, safely formatted original value and percentage
with one decimal. Payload percentage retains the exact engine 0–100 value.
`tooltip={false}` disables presentation; `true`, omission and `{}` use defaults.
Custom function and configuration renderers receive `SegmentTooltipContext<T>`;
null output is valid. Payloads preserve original `record`, `index`, `segmentId`,
`label`, `value`, resolved `color`, `percentage`. SegmentId is source index,
not a persistent application identifier across reordering.

```tsx
<DonutChart {...props} tooltip={({ segment }) => segment.record.accountId} />;
<DonutChart
  {...props}
  tooltip={{ render: ({ segment }) => `${segment.percentage}%` }}
/>;
```

Tooltip anchors use the ring midpoint rather than the hole, with percentage
coordinates following the displayed SVG. Existing 220px HTML
presentation is horizontally bounded and wraps text; vertical placement is
approximate, especially with scaled SVGs or arbitrary tall custom output.
Tooltips have no Tab stop; pointer/touch inspection provides a dismissal button.

One roving slice Tab entry traverses every drawable positive slice. ArrowRight /
ArrowDown advance; ArrowLeft / ArrowUp retreat; boundaries clamp. Home / End select
first/last. Enter / Space activate; repeated keydown does not reactivate. Escape
dismisses inspection. Tab / Shift+Tab exit normally, including to genuine center
controls. Focus shows a ring-sector outline and never activates. Hover inspects
without moving the Tab entry away from an already focused slice.

Mouse/pen report `pointer`; touch release reports `touch` exactly once, consuming
matching delayed native compatibility clicks by pointer ID. Keyboard and standalone
assistive-style clicks report `keyboard`. The existing source-scoped gesture
implementation is shared with Pie. Cancellation clears evidence; independent
later gestures remain valid. Exact ring paths are fill hit targets: the empty
center cannot activate, and no expanded targets cross the hole or neighbors.
Very narrow slices can be difficult to point at but remain keyboard reachable.

Selection retains source array/record/value provenance. Replacements, reorderings
and changed values invalidate stale inspection; focus restores safely to a valid
slice. Resizing/ratio changes retain selection when the source identity is intact.
No persistent selection or drilldown is introduced.

## Source tables, states and accessible names

Default accessible name is **Donut chart**. `accessibility.label` and `description`
use React-generated stable title/description IDs. SVG is a named group with
exposed slice controls; decorative paths and optional labels are hidden from
redundant assistive navigation. Tooltip relationships remain consistent with Pie.

A semantic table always preserves every row, order, duplicate, zero, missing/invalid
field and original negative number. Valid Dates, including cross-realm Dates,
use deterministic ISO formatting. Numeric strings are not coerced. Invalid mapping
configuration uses the safe raw table. Default `dataTable='visually-hidden'` retains
semantic exposure; `'visible'` displays wrapped source rows. No table-removal mode
exists. Formatter failures use the shared safe fallback.

Zero draws no slice. Missing/invalid rows are excluded from geometry and totals,
never invented as zero. Empty says “No chart data”. Any unsupported negative makes
the complete chart unavailable. Unsafe dimensions/proportions/paths show unavailable
content with the source table. No fake 100% ring or default center total is drawn.

## Responsive dimensions, SSR and animation

Positive finite explicit numeric width renders complete deterministic SVG and
center content in Node SSR. Dimensions must be <= MAX_SAFE_INTEGER and both
exceed 16px for a usable circle. Omitted/string width starts with a named 280px
(default-height) measurement placeholder plus source table. Per-instance native
ResizeObserver supplies width; no server width guess is used. Observers clean up
under Strict Mode; without observation the placeholder remains.

No module-level browser globals or random IDs exist. Hydration uses deterministic
markup and React useId; independent roots must use matching, distinct server/client
`identifierPrefix`. Multiple Donuts, paired Pie/Donut and all five families are
supported. The built ESM retains `use client` and external consumer-owned React.

Animation is static by default. `animate=true` enhances decorative marks' opacity
from 0.65 to 1 over 180ms. Reduced motion disables/cancels it; geometry/ratio changes
and unmount cancel prior animations. Center position, interaction targets and paths
are not animated. SSR/hydration remain static and meaningful.

## Validation scope and deferred work

See [consumer compatibility](CONSUMER_COMPATIBILITY.md) for executed consumer,
Chromium, axe and package measurements. `scripts/verify-donut.mjs` audits the
playground at 320/480/1200px, actual center bounds, CSS-constrained non-square
SVGs, hole nonactivation, ring gestures, focus and center buttons. Screenshots and
machine results remain in ignored `work/visual/donut/`.

No full WCAG, manual screen-reader, physical-device, Firefox/WebKit, strict CSP,
arbitrary host-style or measured collision-detection claim is made. Large SVG
counts retain DOM cost; no performance budget or caching is introduced. Interactive
legends, automatic totals, nested rings, drilldown, exploded slices, angle controls,
arc morphing and publication remain deferred. M04-T04 integration evidence is recorded in [five-chart hardening](M04_INTEGRATION_HARDENING.md).

## M04-T04 combined-page hardening

See [five-chart integration](M04_INTEGRATION_HARDENING.md) for the shared-page
audit, reproducible browser checks and demo handoff. The public contract and
pure geometry are unchanged.
