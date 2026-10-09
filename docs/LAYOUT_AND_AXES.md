# Layout and axes — M02-T03

Milestone 01 and M02-T01 through M02-T03 are implemented. The public library
still has **no implemented chart components**. `src/core/layout/` is internal,
framework-independent math. It produces no SVG, React elements, hooks, DOM
measurements, or mark geometry. M02-T04 consumes layout for internal [geometry foundations](GEOMETRY_FOUNDATIONS.md).

## Pipeline and contracts

`layoutCartesian(input)` accepts an existing
`NormalizationResult<NormalizedCartesianData<T>>`, `family` (`line`, `area`,
`bar`), resolved numeric `width`/`height`, physical `xAxis`/`yAxis`, `showGrid`,
and optional internal `spacing`. Bar defaults to `vertical` and also supports
`horizontal`. Line/Area cannot specify an orientation. The input uses existing
public axis types; spacing and layout results add no public component props.
For Line/Area, the internal X-axis configuration union must match the normalized
X mode; the future component adapter will already have that public discriminant.

1. Validate dimensions, family/orientation, axis options, and internal spacing.
2. Reject invalid normalization and continuous-X Bar inputs.
3. Construct semantic X and numerical value scales with unit ranges, forwarding
   physical-axis bounds and tick-count hints to M02-T02. Both scales must pass
   configuration validation before any formatter runs.
4. Format visible-axis candidates once and estimate their label space.
5. Reserve bounded margins and require a useful positive plot rectangle.
6. Construct fresh scales with the final physical ranges, reusing the labels.
7. Select noncolliding labels, position value gridlines, and map required zero.
8. Return a discriminated `CartesianLayoutResult`: `ready`, `empty`, `unusable`.

This uses exactly two scale-construction passes, with no iterative font/layout
solver. Tick values depend on domains/configuration, not output ranges, so labels
remain aligned with the final candidates. Calculations and temporary accumulators
are local. Runtime is O(rows × series + tick candidates), with linear label
selection; dense categories are not compared against every other category.

`Bounds` contains left/top/right/bottom/width/height; `Margins` contains the four
physical margins. `AxisLayout.kind` distinguishes category, linear, UTC, and local
time. Its candidate and visible tick types follow that kind. `LayoutTick<V>`
preserves raw value, physical position, optional original category index, label,
estimated dimensions, orientation, and `selected`. Hidden axes are `null`;
`assignments` still describes their physical orientation, semantic role, and
visibility. `scales.semanticX` and `scales.value` expose existing M02-T02 results
and safe mapping closures, never raw D3 objects.

## Physical and semantic axes

| Family/orientation | Physical horizontal xAxis                        | Physical vertical yAxis |
| ------------------ | ------------------------------------------------ | ----------------------- |
| Line/Area          | Semantic X: category, linear, UTC, or local time | Numerical value         |
| Vertical Bar       | Semantic X: category                             | Numerical value         |
| Horizontal Bar     | Numerical value                                  | Semantic X: category    |

Horizontal Bar still normalizes `xKey` as category and `yKey`/series as values.
Records and normalized rows are never transposed. Its physical `xAxis` receives
numbers and supplies value min/max/tickCount; `yAxis` receives `CategoryValue`.
Horizontal category range is `[plot.left, plot.right]`; vertical category range
is `[plot.top, plot.bottom]`, putting source order from top to bottom. Vertical
values use `[plot.bottom, plot.top]`; horizontal values use
`[plot.left, plot.right]`. Axis lines are placed at the plot's bottom and left
edges; the separate value-zero baseline need not coincide with either axis.

## Dimensions, margins, and label estimation

Future responsive components retain the intended **280px default height**. This
engine receives dimensions already resolved to numbers and never performs
ResizeObserver measurement. Dimensions must be positive finite numbers at most
`Number.MAX_SAFE_INTEGER`; larger pixel coordinates are rejected conservatively.
Zero, negative, NaN, infinite, impossible, and arithmetically unusable dimensions
return diagnostics without any coordinates or mapping functions.

Default internal spacing (pixels):

| Setting            | Default | Purpose                                    |
| ------------------ | ------- | ------------------------------------------ |
| padding            | 8       | Outer chart breathing room                 |
| tickFontSize       | 12      | Assumed label font size                    |
| titleFontSize      | 14      | Assumed title font size                    |
| gap                | 6       | Label/title gap from adjacent content      |
| tickLength         | 4       | Tick extension allowance                   |
| collisionGap       | 6       | Minimum along-axis label separation        |
| maxLabelWidth      | 160     | Cap for vertical tick-label strip          |
| maxEndpointPadding | 80      | Cap for each horizontal endpoint allowance |
| minPlotSize        | 16      | Minimum plot width and height              |

Width estimate is `label.length * tickFontSize` (UTF-16 code units); height is
`tickFontSize * 1.2`. One em per code unit deliberately overestimates typical text
and also overcounts surrogate pairs/combining characters. Actual fonts, scripts,
and user styling can differ. Renderers must honor these assumed font sizes or
provide matching internal spacing. There is no browser/canvas/font measurement.

Left margin reserves the larger of horizontal half-label endpoint allowance and
the capped vertical label strip plus tick/gap/title space. Right margin reserves
the capped horizontal half-label allowance. Top reserves half a vertical label's
height. Bottom reserves horizontal tick/label/title space plus half a vertical
label's height. Every side includes outer padding. A nonempty title adds
`titleFontSize * 1.2 + gap` to its axis strip. The vertical title strip assumes a
title laid along the vertical axis; title rotation/anchors and title-text fitting
belong to a later renderer. `minimumMargins` can enlarge each side internally.
Oversized vertical tick labels are suppressed rather than increasing the strip
past its cap. Horizontal labels exceeding the chart's available padded interval
are also suppressed. Titles remain raw metadata; there is no title wrapping or
truncation policy yet.

Margins are never squeezed into negative plots or scaled proportionally to fit.
If they cannot leave at least `minPlotSize` in both directions, layout is
`unusable` with `insufficient-space`. Hidden axes can therefore make an otherwise
too-small chart usable. All returned bounds are finite and inside chart bounds.

## Visibility, formatting, and candidate identity

Axes default to shown. `show: false` hides the **entire physical axis including an
explicit title**, skips its formatter and label estimates, and emits no axis/tick
metadata. Scales, bounds validation, and tick-count validation remain active;
gridlines are controlled independently by `showGrid`, which defaults to true.

Formatting happens after scale/domain validation. Numerical formatters get
numbers, temporal formatters get Dates, and category formatters get
`CategoryValue`. They receive one argument and no fabricated source record.
Date callback arguments are fresh copies so a callback cannot mutate source or
scale tick Dates through that argument. Output raw Dates keep their identity.
The engine uses native Date operations, including for cross-realm Dates.

Defaults are `String(value)` for strings/numbers and full ISO UTC timestamps for
Dates, including local-time tick candidates. No default Intl, locale, current
time, or timezone-dependent text formatting is added. A thrown formatter,
non-string runtime return, or line-break/tab-containing label produces
`formatting-failed` with physical axis and candidate offset. There is no fallback
label substitution. Blank strings are accepted candidates but not selected for
display. Axis titles must also be single-line strings.

Category candidates always retain their original row indices, even for duplicate
strings, numbers, or Date timestamps. All valid-X categories retain their bands,
including rows without valid values. No category is deduplicated by its label;
label selection changes neither bandwidth nor any mapping coordinate.

## Selection and gridline policies

Selection makes one deterministic scan in candidate order. Horizontal collision
intervals use estimated width; vertical intervals use estimated height. A label
must fit inside the chart's padded interval, its reserved cross-axis strip, and
have a tick inside the plot. The first eligible candidate wins. The actual last
candidate is reserved if it fits independently and does not collide with first;
interior candidates are then accepted greedily when they clear the previous
accepted label and reserved last label. If endpoints genuinely collide, first
wins. Oversized endpoints are not forced. Visible output retains candidate order,
including descending physical positions on reversed vertical value scales.

`tickCount` is forwarded unchanged as M02-T02's validated `[1,100]` integer hint;
D3 may return more/fewer numerical or temporal ticks. Category count validation
does not sample bands. Selected labels may be far fewer than candidates. No
rotation, wrapping, ellipsis, multiline labels, or exact glyph collision detection
is attempted. Full ISO defaults can suppress endpoint labels because endpoint
padding is capped; applications can use shorter explicit formatters.

Gridlines use **all numerical value tick positions**, not category ticks or only
selected labels. Line/Area/vertical Bar get horizontal lines with endpoints at
plot left/right. Horizontal Bar gets vertical lines with endpoints at plot
top/bottom. Nonfinite, out-of-plot, and exactly duplicate positions are excluded.
`showGrid: false` returns an empty gridline collection. No line elements are made.

Area and Bar expose the value scale's `map(0)` as `zeroBaseline` with physical
axis (`y` normally, `x` for horizontal Bar). Positive, negative, mixed, and
zero-only domains retain M02-T02 policies. Line neither forces zero nor exposes a
mandatory baseline. Explicit Area/Bar bounds excluding zero stay unusable.

## Empty, invalid, partial, and immutable data

- `ready`: both required semantic scales are ready, positive useful plot bounds
  exist, and at least one valid-X/valid-value pair contributes real observations.
- `empty`: valid dimensions/configuration/bounds, but one required scale is empty.
  Useful category metadata and empty fallback-domain metadata are retained. Empty
  value scales have no map, gridlines, or baseline; fallback domains are not data.
- `unusable`: invalid configuration, dimensions, formatter output, scale options,
  unsafe domains/ranges/positions, or insufficient label space. Only structured
  diagnostics are exposed; no partial coordinates masquerade as trustworthy.

Partial valid data yields ready layout when at least one usable pair exists.
Missing values never become zero, and invalid-X values cannot affect the value
domain. Geometry must still narrow each row and each series value; readiness
does not mean every row is a point. Category-only data can expose bands in an
empty layout but never implies actual marks. Normalization diagnostics remain on
the input result; scale/layout diagnostics retain their own meanings. No console
logging or public error/empty presentation is implemented.

Readonly arrays, frozen inputs, original records, series, config objects, Dates,
and existing scale results are preserved. Each layout owns fresh metadata and
scale closures. It is not a deep snapshot: application mutation of retained raw
references is still visible. Pure/repeatable user callbacks and unchanged inputs
are required; callbacks can execute arbitrary external code or depend on locale.

## Example with concrete coordinates

Internal source usage only (these helpers are not public package exports):

```ts
const normalized = normalizeCartesian({
  data: [
    { x: 'A', y: 0 },
    { x: 'B', y: 10 },
  ],
  xKey: 'x',
  yKey: 'y',
});
const layout = layoutCartesian({
  normalized,
  family: 'bar',
  width: 400,
  height: 280,
});
// status: 'ready'
// chart: { left: 0, top: 0, right: 400, bottom: 280, width: 400, height: 280 }
// margins: { left: 42, right: 14, top: 15.2, bottom: 39.6 }
// plot: { left: 42, top: 15.2, right: 386, bottom: 240.4,
//         width: 344, height: 225.2 }
// category centers: index 0 -> 128; index 1 -> 300; bandwidth -> 172
// value 0 -> Y 240.4; value 5 -> Y 127.8; value 10 -> Y 15.2
// zeroBaseline: { axis: 'y', position: 240.4 }
// floating-point results can differ from these decimals by rounding noise.
```

With `orientation: 'horizontal'`, the same Bar data uses margins
`{ left: 30, right: 20, top: 15.2, bottom: 39.6 }`, plot width 350 and height
225.2. Category centers are Y 71.5 and Y 184.1; values 0/5/10 map to X
30/205/380. The baseline is X 30 and gridlines are vertical. Neither original
record nor normalized category/value semantics changes.

M02-T04's geometry builder constructs layout internally from the same input, checks `layout.status === 'ready'`, and maps original
category indices through `scales.semanticX.position()` or continuous X values
through its typed `map()`, and maps classified numerical values through
`scales.value.map()`. Every mapping still requires checking `status: 'mapped'`.
M02-T04 implements Bar rectangles, Area fills, line paths and missing-point gaps.
It flags finite out-of-plot marks; actual visual clipping remains a renderer responsibility.

## SSR, timezone evidence, and limitations

UTC layouts/default labels repeat across timezone contexts. Local-time scaleTime
ticks depend on execution timezone and timezone database, even though their labels
are ISO UTC strings and interpolation uses elapsed milliseconds. Timezone-controlled
Node tests compare actual layouts in UTC and America/New_York over March 7–10,
2026: UTC midnights stay equal, local ticks move to 05:00Z/04:00Z across DST, and
local intervals are 24 then 23 hours. Local layouts are therefore **not universally
identical between SSR and clients**. Later components must require consistent
timezone contexts or choose a safe strategy such as a stable initial placeholder
followed by client layout; UTC is the deterministic cross-host choice.
Locale-sensitive user formatters similarly require matching context or a safe
hydration strategy. Named timezone configuration is not a public contract.

Known approximations are font estimates, bounded strips, and greedy suppression.
No rotated ticks, wrapped text, exact measurement, title fitting, sophisticated
collisions, responsive measurement, stacked placement, polar arcs,
interactions, animation, or production accessibility UI is implemented. Development
Lead decisions remain for user-facing diagnostics, local-time SSR presentation,
final font/title styling, and renderer visual spacing. Grouped placement and Cartesian paths now belong to M02-T04 geometry.

## M03-T04 public BarChart

BarChart now consumes existing grouped rectangle geometry in both orientations.
Physical formatter routing preserves semantic xKey categories; shared presentation
and corrected gesture handling also serve Line/Area. Item inspection is the Bar
default; visible rectangle intersections and in-plot zero targets determine
eligibility. Exact decorative extents, stable missing slots, source tables and
SSR policy are preserved. No public props, dependencies, core math changes or
subpaths are added. See [BarChart](BAR_CHART.md). M03-T05 remains deferred.
