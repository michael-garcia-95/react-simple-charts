# Internal SVG rendering foundation — M03-T01

`LinePreview` is a source-internal visual consumer, not a released LineChart.
This document records the historical M03-T01 fixture. The package root now exports
LineChart and AreaChart plus approved types; see their public behavior documents.

## Engine and structure

Raw supplied data flows through `normalizeCartesian`, then
`buildCartesianGeometry({ family: 'line', ... })`. Geometry constructs its own
layout. No renderer domains, scales, tick selection, plot calculation, point
mapping, run splitting or path generation exists. Discriminated statuses are
authoritative: only ready Line geometry produces SVG marks. Diagnostics stay on
the internal results without being logged or exposed as stack traces.

- `LinePreview.tsx` orchestrates the typed mapping, sizing, statuses and legend.
- `svg/SvgFrame.tsx` owns naming, focus indication and plot clipping.
- `svg/CartesianAxes.tsx` presents existing axis and grid metadata.
- `svg/DataTable.tsx` presents classified source rows in original order.
- `svg/presentation.ts` resolves internal names, colors and hidden-table styling.
- `use-container-width.ts` is shared with the unchanged historical RenderingProbe.

```tsx
// Source-internal development import, unavailable from the package root.
import { LinePreview } from '../src/internal/LinePreview';

<LinePreview
  data={[
    { month: 'Jan', revenue: 12 },
    { month: 'Feb', revenue: 24 },
  ]}
  xKey="month"
  yKey="revenue"
  width={640}
  accessibility={{ label: 'Revenue', dataTable: 'visible' }}
/>;
```

The generic contract reuses approved common/mapping/axis types but excludes
`animate`, `tooltip` and `onDataActivate`. It preserves exclusive yKey/series and
scale-specific field/formatter typing. There are no new public types.

## SVG presentation

A deterministic numeric viewBox contains title/optional description, definitions,
and grid → axes → marks groups. React useId provides unique chart title,
description and plot IDs within a React root; separately hydrated roots must use
React's matching identifierPrefix convention. A user-space clipPath uses the
exact layout plot rectangle. Marks are clipped, without moving or clamping their
coordinates. Axes, outside labels and the graphic's 3px focus outline remain
outside the plot clip. Endpoint markers may be partially clipped intentionally.

Each ordered series renders each non-null engine path verbatim with a 2px linear
stroke, plus 3.5px-radius markers for all valid points, including singleton runs.
Independent gaps remain separate paths. Keys use series keys and original source
indices, never category labels. There is no interpolation across missing data.

Axes use physical metadata, visibleTicks only, existing labels and coordinates.
Tick formatters are not called again by SVG presentation. Defaults match layout:
12px system-font ticks, 4px tick strokes, 6px gaps, 14px titles. Titles are single
line in the reserved outer strip; Y titles rotate conventionally. A title whose
one-em-per-code-unit estimate exceeds plot width/height, or contains multiline
controls, is omitted conservatively rather than covering marks. Exact glyph
measurement and title wrapping are deferred. Gridlines use exact engine endpoints,
are visually secondary and have pointerEvents disabled. Decorative SVG groups are
hidden from assistive technology; the graphic is one named keyboard focus stop.

Color precedence is configured series.color → palette `colors[index % length]`
→ `--rsc-series-N-color` (one-based) → `--rsc-series-color` → deterministic internal
palette (#2563eb, #0d9488, #9333ea, #c2410c, #be185d). Empty palettes fall through;
strings are used as supplied, so callers must supply valid CSS colors. Marks and
legend share the resolver. Existing text/background/focus variables are retained;
axis/grid variables have internal defaults. No public theme API, mandatory CSS,
global injection or runtime dependency is added. Host className/style applies to
the figure; host CSS can override visual appearance.

The ordered, static multi-series legend sits after the graphic, outside its plot.
Configured labels win; otherwise camelCase/underscore/hyphen keys become readable
names. showLegend=false removes it. There is no interaction.

## Data alternative and states

A semantic HTML table accompanies normalized data in every state. Caption uses
the chart name; X and series columns have scope=col, X row headers have scope=row.
Source order, repeated labels and valid values are preserved. Missing/invalid
states say Missing/Invalid, never zero. Dates default to ISO; valid table
formatters receive copied Dates. Formatter failure falls back to stable source
representation. Default mode is visually hidden, with optional visible presentation.
An invalid mapping/configuration has no normalized model. A raw source table
therefore preserves own source fields and row numbers without claiming mapped
series; unsupported objects say Unsupported. Non-array input has no source table. Unusable geometry with
a normalized model retains its full source table.

Empty geometry displays “No chart data”; unusable geometry/dimensions displays
“Chart rendering unavailable”. Neither exposes fallback domains as data, partial
marks, NaN coordinates or internal errors. Pending responsive/local-time rendering
has an accessible placeholder and the same table. Labels fall back to “Line chart
preview”; applications should supply meaningful labels/descriptions.

## Sizing, SSR and hydration

Height defaults to 280px. Explicit invalid numeric width/height (nonpositive or
nonfinite) produces unavailable presentation; invalid height reserves 280px safely.
Positive finite explicit width renders full category, linear and UTC SVG on the
server. CSS widths and omitted width reserve height and wait for measurement.
CSS width strings are host layout instructions, not parsed chart dimensions.

The shared per-container observer exists only in an effect. No DOM API is read
during SSR. Invalid measurements remove the SVG until usable width returns.
Missing ResizeObserver keeps the placeholder/table. Cleanup disconnects and marks
the callback inactive; late callbacks are ignored. Switching explicit/responsive
branches unmounts the old observer and starts fresh, without stale measurements.
Strict Mode and multiple instances retain independent lifecycles.

Local-time scaleTime ticks depend on execution timezone. Even with explicit
width, local mode uses a stable placeholder for SSR and initial hydration.
useSyncExternalStore uses false server and true client snapshots for this hydration
transition (a no-op subscription; no browser reads). Client geometry then uses
its actual timezone; the engine's time behavior is unchanged. This costs an
initial visual placeholder. UTC remains preferable for server-rendered visuals.
Node regression tests compare local-mode initial markup in UTC/New_York and
verify no time tick formatting occurs; hydration tests cover the transition.
Caller locale-sensitive table/tick formatters can still differ across execution
contexts and must be pure and consistent. No locale-sensitive defaults are added.

## Validation and remaining work

Focused tests use real normalization/geometry and inspect SVG attributes, paths,
series order, singleton/gap marks, ticks, colors, clipping references, tables,
statuses, observer lifecycle and browser-free SSR. Hydration checks capture console
warnings/errors and recoverable errors. Optional Chromium smoke coverage extends
the historical probe checks with ready/responsive engine previews, clipping,
axis labels and accessible tables. Automated evidence is not WCAG certification.

Before public LineChart in M03-T02: validate tooltips, activation, pointer inspection,
keyboard point navigation and public runtime consumer compatibility. Development
Lead review is needed for final tokens, focus-visible behavior, title omission,
marker clipping, diagnostic presentation, performance budgets and browser policy.
No animation, interactive legend, smoothing, stacking or polar rendering exists.
Large datasets retain engine O(rows × series) allocations; no decimation/cache is
introduced. Cross-browser and real screen-reader evaluation remain necessary.
