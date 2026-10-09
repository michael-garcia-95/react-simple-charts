# Shared geometry foundations — M02-T04

Milestone 02's four planned internal foundation tasks are complete and merged.
Public LineChart and AreaChart consume this internal geometry. Geometry is
pure Cartesian calculation, with no React, DOM, SVG elements, styling, interactions,
stacking, or polar geometry. All helpers remain source-internal.

## Pipeline and integration boundary

`normalizeCartesian` → M02-T02 domains/scales → `layoutCartesian` → shared point
mapping → per-series runs/paths or grouped rectangles.

`buildCartesianGeometry(input)` in `src/core/geometry/cartesian.ts` accepts the
existing `CartesianLayoutInput<T>` plus optional internal `barSpacing`. It calls
`layoutCartesian` itself. There is no entry-point argument for an unrelated layout:
source records, family, dimensions, orientation, axis bounds and scales always
come from the same input. It reuses the existing normalization, domain, scale and
layout policies. Callers normalize once; geometry does not classify raw data again.

```ts
// Internal source usage only, not a package-root import.
const normalized = normalizeCartesian({
  data: [
    { x: 'A', y: 0 },
    { x: 'B', y: 10 },
  ],
  xKey: 'x',
  yKey: 'y',
});
const result = buildCartesianGeometry({
  normalized,
  family: 'line',
  width: 116,
  height: 116,
  xAxis: { show: false },
  yAxis: { show: false },
});
// plot: left/top 8, right/bottom 108, width/height 100
// series[0].points: (33,108) and (83,8)
// series[0].runs[0]: startIndex 0, endIndex 1, path equivalent to M33,108L83,8
```

`CartesianGeometryResult<T>` discriminates on `status`:

- `ready`: at least one valid point or rectangle exists. A singleton is ready
  even though it has no segment or filled path; zero-valued bars remain marks.
- `empty`: valid configuration/layout but no drawable data. No fallback-domain
  observations are fabricated. Empty Line/Area series retain configured metadata,
  empty points/runs, and source gap indices. Empty Bar returns no rectangles.
- `unusable`: layout failure, invalid internal spacing, unsafe mapping/slot/baseline,
  or failed path generation. No partial marks, plot coordinates or layout closures
  are exposed as trustworthy output. The original normalized model remains at
  the caller; a geometry failure does not erase source data.

Usable results expose family-specific marks, the matching layout, plot bounds,
zero-baseline metadata and `requiresClipping`. The layout contains the existing
safe mapping closures, never raw D3 objects. `diagnostics`, `layoutDiagnostics`
and `normalizationDiagnostics` remain separate. Normalization warnings preserve
the exact input diagnostics reference and their original meaning. Geometry failures
include row and series indices when applicable; no logging or user-facing fallback
is performed. Layout diagnostics take precedence when layout itself is unusable.

## Point mapping, identity and gaps

`points.ts` checks each row's X state and each configured series' value state.
Only valid states reach ready scale mappings. Category X maps by **original row
index** to a band center. Linear X maps the validated number; UTC/time maps the
validated Date. Values map through the existing value scale. Both mappings must
return `mapped` and both coordinates must be finite. A failed mapping of a valid
observation is `unsafe-mapping`, not a missing point or an outside-plot flag.

Every point/rectangle retains the exact original `record`, source `index`,
`category` (original X), numerical `value`, `seriesKey`, configured `seriesIndex`,
and the normalized `series` metadata reference (including optional label/color).
Nothing is sorted, coerced, aggregated, stacked or deep-copied. Equal category
labels occupy distinct index bands. Repeated numbers/timestamps may share a
continuous coordinate but remain separate points. Dates are not mutated.
Indices identify source positions for unchanged ordering, not persistent IDs
across insertions/reordering. Retained references are traceable, not deep snapshots.

Each Line/Area series has ordered valid `points`, contiguous `runs`, and `gaps`
with original `rowIndex` and reason (`x` or `value`). An invalid/missing X or value
ends the current run, including invalid X rows which occupy no category band.
If both fields are invalid, X is the reported gap reason; normalization retains
both warnings. A missing value in one series does not remove another's point.
An entirely missing series remains in configured order with no runs.

For `[{x:'A',y:10}, {x:'B',y:null}, {x:'C',y:20}]`, valid points retain indices
0 and 2, but belong to separate singleton runs. Their `path` is `null`: there is
no A-to-C segment or filled polygon. Leading/trailing/consecutive gaps likewise
never create empty runs. Continuous X remains in original, potentially unsorted
order. No interpolation bridges missing values.

## Line and Area paths

`line.ts` uses the approved d3-shape `line()` generator with linear interpolation.
`area.ts` uses `area()` with the actual X and mapped value Y, and `y0` equal to
layout's physical Y `zeroBaseline`. Each multi-point run generates its own path.
Singleton runs retain their point but have `path: null`, avoiding fictitious line
segments or substantial fills. Multiple series use the same value domain and
baseline independently; there are no stacked totals.

For the 100×100 plot above:

| Area source values | Mapped Y values | Zero Y | Closed path vertices                            |
| ------------------ | --------------- | ------ | ----------------------------------------------- |
| 5, 10              | 58, 8           | 108    | (33,58), (83,8), (83,108), (33,108)             |
| -10, -5            | 108, 58         | 8      | (33,108), (83,58), (83,8), (33,8)               |
| -10, 10            | 108, 8          | 58     | (33,108), (83,8), (83,58), (33,58)              |
| 0, 0               | 58, 58          | 58     | All vertices on Y=58; legitimate zero-area fill |

Mixed-sign fills cross zero using the actual geometry. Negative fills extend
from baseline toward mapped negative values. Degenerate equal X or zero values
may produce zero-area paths; no fictitious width or area is added.

Generators use `digits(null)` to preserve full numeric precision. D3's default
three-decimal rounding can collapse very small valid coordinates. No SVG DOM API
is used. `validation.ts` rejects null/malformed nonfinite path results and catches
generator failures as `path-failed`; orchestration adds source run/series context.
Point sequences are retained alongside path strings because paths do not encode
record identities, markers, run indices or exact datum metadata. They also let
future rendering/interaction work use coordinates without parsing path syntax.

## Vertical and horizontal Bars

`bar.ts` uses one grouping algorithm along the **physical category direction**.
For a source band lower edge `b`, bandwidth `B`, series count `n` and configured
series index `i`, defaults are `groupRatio = 0.8`, `slotRatio = 0.9`:

```ts
const groupStart = b + (B * (1 - groupRatio)) / 2;
const slotWidth = (B * groupRatio) / n;
const slotStart = groupStart + slotWidth * i;
const slotEnd = groupStart + slotWidth * (i + 1);
const inset = (slotWidth * (1 - slotRatio)) / 2;
const start = slotStart + inset;
const size = slotEnd - inset - start;
```

The centered group occupies 80% of each category band, with equal ordered slots;
each rectangle occupies the middle 90% of its slot. A single series therefore
occupies 72% of the band. Missing values produce no rectangle but retain the
conceptual slot. Original category indices associate bands; configured series
indices associate slots. Removing a missing series from slot allocation was
rejected because it would shift the remaining series between categories.

Let `v` be the mapped value and `z` the physical zero baseline:

| Orientation | X        | Y        | Width    | Height   |
| ----------- | -------- | -------- | -------- | -------- |
| Vertical    | start    | min(v,z) | size     | abs(v-z) |
| Horizontal  | min(v,z) | start    | abs(v-z) | size     |

Positive vertical bars extend upward; negatives extend downward. Horizontal
positives extend right; negatives extend left. Zero yields zero numerical extent.
Horizontal semantic xKey remains categorical and categories proceed top to bottom;
records are not transposed. Bars retain their sign through original `value`.

Example: one category, one series, value 10, hidden axes and dimensions 116×116
produce vertical `(x=22,y=8,width=72,height=100,baseline=108)` and horizontal
`(x=8,y=22,width=100,height=72,baseline=8)`. For two series [10,5], category slots
are [18,58] and [58,98], rectangle category starts 20 and 60, widths/heights 36.
The missing second value would leave the first rectangle at 20 with the same slot.
Fractional arithmetic can differ by ordinary floating-point rounding noise.

`barSpacing` is internal tuning, not a public styling/spacing API. Each explicit
fraction must be finite in `(0,1]`; undefined means default, null is invalid.
The spacing object must be an object, and passing it for Line/Area is rejected.
The calculation validates positive representable slots, finite endpoints/sizes,
nonoverlap and containment in the source band and slot. It reports `unsafe-slot`
when multiplication underflows or offsets collapse at the coordinate magnitude.
There is no artificial one-pixel minimum. Narrow, dense and subpixel bands retain
meaningful fractional widths instead of overlapping. Rectangle coordinates,
dimensions and computed endpoints must all be finite and dimensions nonnegative.

## Out-of-plot geometry and renderer responsibilities

Explicit axis bounds can exclude real values. Finite extrapolated coordinates
are retained unchanged, with source identity; no clamping, endpoint replacement,
data discard, or complex polygon/line clipping occurs. `outOfPlot` exists on
points, runs and rectangles; usable results summarize it with `requiresClipping`.
For linear paths and zero-baseline areas, inside endpoints and an inside baseline
cannot escape the rectangular plot between vertices. Rectangle extents are
checked, not only their origin.

With X/Y bounds [0,10], observations (-10,-10) and (20,20) in the example plot
map to (-92,208) and (208,-92). They remain real source points and require visual
clipping. Nonfinite extrapolation instead fails geometry: it must never be
reported as merely outside the plot. Area/Bar bounds excluding zero remain
unusable under existing M02-T02/M02-T03 rules.

Future SVG renderers must apply a plot `clipPath`, choose marker treatment,
translate/stroke/fill geometry, render axes/legends, resolve styles/series labels,
and implement accessibility, diagnostics/empty presentation and interactions.
Visible clipping and final renderer handling are **not implemented** here.
No chart components, styling API, public exports or new dependency are added.

## Design choices, purity and remaining limits

Building layout internally costs its existing two passes but prevents accidental
reuse of a layout from other data/configuration. An alternative paired immutable
layout/model wrapper could avoid reconstruction, at the price of provenance and
lifetime complexity. This task chooses a single explicit input boundary.

Readonly TypeScript structures and local accumulators build fresh output arrays.
Source records and metadata survive by reference, including frozen inputs and
Dates. There are no caches, global state, clock/random calls, browser measurements,
Canvas or React dependencies. The normalized model contract is trusted as in
M02-T02/M02-T03; manually forged models are not a new supported normalization API.
Callbacks/getters retain the existing pure-caller assumptions. UTC remains the
cross-host predictable mode; local-time layout ticks retain the host-timezone
limitation, without additional geometry defaults based on locale or time.

Geometry traversal is O(rows × series), with O(rows × series) retained coordinates,
runs/marks and path output. A temporary category-edge map keeps Bars linear.
Very large datasets will allocate proportionally; decimation, caching and renderer
performance budgets are deferred. Numerical failure rejects the complete geometry
rather than returning partly trustworthy marks. Caller normalization still retains
valid source records. Partial missing data, in contrast, retains all safe marks.

Linear interpolation, independent unstacked areas, grouped bars and fractional
spacing are explicit initial policies. Alternatives such as smoothing, interpolation
across gaps, pixel minimums, stacking and mathematical clipping impose additional
semantics and are deferred. Development Lead review remains for renderer-facing
presentation, final visual spacing choices, local-time SSR strategy and broader
extreme-number precision support. M02-T04 does not begin the next milestone.

## M03-T03 internal Area boundary extension

Area PointRun results additionally expose optional `outlinePath`: the existing
pure linePath calculation on that same mapped run. Area singletons set it to null;
Line runs retain their prior shape. Filled `path` values are unchanged. Boundary
failure makes geometry unusable. React consumes both paths without mathematical
construction; tests compare real SVG attributes and the pure line calculation.

## M03-T04 public BarChart

BarChart now consumes existing grouped rectangle geometry in both orientations.
Physical formatter routing preserves semantic xKey categories; shared presentation
and corrected gesture handling also serve Line/Area. Item inspection is the Bar
default; visible rectangle intersections and in-plot zero targets determine
eligibility. Exact decorative extents, stable missing slots, source tables and
SSR policy are preserved. No public props, dependencies, core math changes or
subpaths are added. See [BarChart](BAR_CHART.md). M03-T05 remains deferred.
