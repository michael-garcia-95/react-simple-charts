# Scales and domains — M02-T02

Milestone 01 and M02-T01 are complete. M02-T02 adds pure internal Cartesian
calculations under `src/core/scales/`. No public chart components, runtime
exports, React hooks, layout, paths, or geometry are implemented. M02-T03 has
not begun. These helpers are source-internal, not package imports.

## Pipeline and internal contracts

`normalizeCartesian()` → eligible observed extent → family policy and bounds →
usable display domain → D3 scale with caller range → typed ticks and mappings.

The construction boundaries `createXScale(result, range, axis)` and
`createValueScale(result, family, range, axis)` accept the existing
`NormalizationResult<NormalizedCartesianData<T>>` union. An
`invalid-configuration` result produces `unusable` with `invalid-normalization`;
it is never interpreted as empty valid data. Normalization diagnostics are
neither changed nor copied into a different meaning; callers retain that result
alongside scale diagnostics.

Only states explicitly marked `valid` contribute values. Linear X uses finite
numerical X; temporal X uses validated Dates; category X uses validated raw
categories. A value-axis extent additionally requires **valid X on the same
row** and a valid numerical series value. A valid Y with missing/invalid X stays
in normalization and diagnostics, but cannot expand the renderable domain.
All configured series participate independently in their original configuration
order. Missing/invalid values are ignored for arithmetic, never converted to
zero. No sorting, aggregation, record removal, or stacked totals occurs.

`DomainResult<V>` is `ready` with `DomainMetadata<V>` or `unusable` with
structured diagnostics. Continuous scale results discriminate `ready`, `empty`,
and `unusable`: only `ready` exposes `map`. `PositionResult` requires narrowing
`mapped` before reading `position`. Invalid values have no fabricated position.
`XScaleResult.kind` preserves category/linear/utc/time distinctions, allowing
later layout to narrow the tick and mapping value types. D3 objects stay inside
mapping closures; no setters, inversion, or raw D3 implementations are exposed.

## Category identity, duplicates, and spacing

`createCategoryScale` uses `scaleBand<number>` with **original row indices** as
the domain, never labels or their string representations. D3 deduplicates equal
domain entries, so using labels would collapse repeated months, equal numbers,
and equal Date timestamps. Index identities preserve every eligible row's
position and raw label reference, even when the same Date object is repeated.
Identity is stable for unchanged ordering; it is not an application identifier
that persists across inserts or reorderings.

The positional domain contains only valid-X rows in source order. Invalid-X
rows remain in normalized data but occupy no band, so eligible rows evenly fill
the supplied interval and spacing gaps close. This is an explicit positional
policy, not silent data removal. Valid-X rows with missing Y still occupy bands.

For range `[0, 300]` and rows `Jan`, `Jan`, `Feb`, ticks are:

```ts
[
  { index: 0, value: 'Jan', start: 0, position: 50 },
  { index: 1, value: 'Jan', start: 100, position: 150 },
  { index: 2, value: 'Feb', start: 200, position: 250 },
];
// bandwidth: 100; position(1): { status: 'mapped', position: 150 }
```

For `[{ x: 'B' }, { x: null }, { x: 'A' }]` and `[0, 200]`, valid indices are
`[0, 2]`, centers are `[50, 150]`, bandwidth is `100`, and `position(1)` is
unusable. Reversed range `[200, 0]` gives centers `[150, 50]`, retaining tick
order. Band starts remain the numerically lower edge of each band. No padding,
rounding, grouped Bar placement, or inter-series geometry is selected here.

## Linear X and value-domain policies

`calculateLinearXDomain` scans valid numerical X in one pass. Unsorted X
`[10, -5, 2.5, 10]` yields observed/display extent `[-5, 10]`; source order stays
`[10, -5, 2.5, 10]`. With range `[0, 150]`, mappings are `[150, 0, 75, 150]`.
Repeated X values intentionally map to the same continuous coordinate.

`calculateValueDomain` scans every configured series on valid-X rows and feeds
the eligible extent to `numericDomain`. The focused `ChartFamily` discriminant
selects a baseline policy; there are no separate redundant chart engines.

| Eligible values | Line domain | Bar/Area domain |
| --------------- | ----------- | --------------- |
| 95, 100, 105    | [95, 105]   | [0, 105]        |
| 10, 20, 30      | [10, 30]    | [0, 30]         |
| -30, -10        | [-30, -10]  | [-30, 0]        |
| -20, 10         | [-20, 10]   | [-20, 10]       |

Line preserves local variation without forcing zero. Bar and Area include zero
because their lengths/filled regions need a truthful baseline. Both still keep
the exact observed extent separately. For two series with values `20` and `30`
on one row, the Bar domain is `[0, 30]`, not `[0, 50]`. Stacking is deferred.

`createNumericScale` uses D3 `scaleLinear` and supports ascending or descending
output ranges. A future vertical value range `[100, 0]` maps a Line domain
`[95, 105]` to positions `95 → 100`, `100 → 50`, `105 → 0`. Ranges come entirely
from the caller; margins, chart orientation, and dimensions are not hardcoded.

## UTC and local-time behavior

`createTemporalScale` scans validated Dates chronologically without changing
source order. Observed endpoints retain original Date references. Display
endpoints and ticks are fresh Date objects; native `Date.prototype.getTime`
reads timestamps without parsing strings, calling custom `valueOf`, or mutating
Dates. Cross-realm Dates work. A JavaScript Date represents an instant; it does
not store an original timezone label that the scale could preserve or change.

UTC uses **scaleUtc**; local time uses **scaleTime**. Coordinate interpolation
uses the same elapsed-millisecond arithmetic, but tick selection aligns to UTC
calendar boundaries or the runtime's local calendar respectively. Local days
may contain 23 or 25 hours across daylight-saving transitions; tick spacing can
therefore be unequal. Calendar months are also unequal in duration.

The timezone-controlled Node test uses `America/New_York` and the interval
`2026-03-07T00:00:00Z` through `2026-03-10T00:00:00Z`, requesting three ticks:

- UTC midnight ticks: March 7, 8, 9, 10 at `00:00Z`.
- Local midnight ticks: March 7/8 at `05:00Z`, March 9 at `04:00Z`.
- Local tick intervals: 24 hours then 23 hours.

UTC is predictable across hosts. Local-time ticks intentionally depend on the
host timezone and timezone database. An application needing identical server
and client ticks must use UTC or arrange matching timezone contexts; local
mode cannot guarantee cross-timezone hydration equality. Named timezone
configuration is not part of the current public contracts.

## Constant, empty, and extreme domains

Metadata separates real eligible observations from display decisions:

- `observed`: exact eligible min/max, or `null` when absent.
- `domain`: display endpoints after baseline, bounds, and any expansion.
- `origin`: `data`, `fallback`, or `override`.
- `expanded`: a zero-length domain needed display expansion.
- `zeroBaseline`: the selected family requires zero inclusion.
- `overridden.min/max`: which explicit bounds were supplied.

Zero inclusion is reported by `zeroBaseline` and the observed/display difference;
it is not the zero-length expansion flag. Overrides take origin precedence,
even on empty data; `observed: null` still identifies absent eligible values.

| Case                 | Observed         | Display domain             | Origin / expansion    |
| -------------------- | ---------------- | -------------------------- | --------------------- |
| Line constant 100    | [100, 100]       | [99, 101]                  | data / expanded       |
| Any family all zero  | [0, 0]           | [-1, 1]                    | data / expanded       |
| No eligible numbers  | null             | [0, 1]                     | fallback / unexpanded |
| Date constant 1000ms | [1000ms, 1000ms] | [999ms, 1001ms]            | data / expanded       |
| No eligible Dates    | null             | [epoch, epoch + 1 UTC day] | fallback / unexpanded |

A nonzero numerical constant expands by 1% of its absolute magnitude on each
automatic side, with `Number.MIN_VALUE` as the minimum increment. Zero expands
by one unit. Explicit bounds never move. At finite number boundaries an
overflowing expansion side stays at the observed endpoint and the other side
expands inward. A one-sided bound equal to the opposite automatic endpoint
expands only that automatic side; e.g. observed `[10, 20]` plus `min: 20` gives
`[20, 20.2]` and `origin: override`. If expansion cannot produce distinct finite
endpoints and a finite span, the domain is explicitly unusable.

A single temporal timestamp expands by one millisecond each way, bounded to
JavaScript's supported interval of ±8,640,000,000,000,000ms. At a boundary only
the inward side moves. There is no large invented calendar interval. Empty
fallbacks are documented display metadata only: the scale returns `empty`, no
map function, and no ticks. They do not fabricate points, totals, or percentages.

Finite endpoints alone do not ensure safe D3 arithmetic. A numerical span like
`[-1e308, 1e308]` overflows subtraction and returns `unsafe-domain`, rather than
collapsing meaningful coordinates. Numerical construction probes endpoints and
midpoint, every mapping checks finiteness, and every generated tick is checked.
Subnormal domains that map successfully can exceed D3's reciprocal tick-step
precision; empty/non-finite tick output or D3's tick `RangeError` uses finite
display endpoints as ticks. Temporal boundary ticks likewise use endpoints
when D3 generates no valid ticks. These ticks are axis values, not data points.

## Axis bounds, ranges, and ticks

Numeric `min`/`max` must be finite. When both are explicit, `min < max` is
required; reversed or equal bounds are rejected, never swapped. One-sided bounds
must not reverse the automatically calculated domain (including an empty
fallback). Explicit Line/linear-X bounds may exclude data; mapping is unclamped
so clipping can remain a later geometry decision. Unsafe extrapolation returns
an unusable position. Bar/Area reject `min > 0` or `max < 0` with
`zero-baseline-conflict`; they never quietly remove the required zero baseline.

Ranges require distinct finite endpoints and a finite subtraction span.
Descending ranges are valid. Zero-length ranges, overflow spans, and non-finite
endpoints are `invalid-range`; category bandwidth underflow is `unsafe-position`.
Collapsed ranges cannot supply useful spatial positions, even for empty inputs.

An omitted `tickCount` defaults to 10. Explicit counts must be integers in
`[1, 100]`; invalid requests return `invalid-tick-count`, including on empty
scales. D3 counts are approximate hints, so a request of five on `[0, 10]`
produces `[0, 2, 4, 6, 8, 10]`. Category tick metadata always contains all
eligible rows in source order; the count is validated but does not remove or
sample categories. Layout can later choose which labels to show.

Numerical ticks remain numbers; temporal ticks remain Dates; category ticks keep
raw labels and source indices. Every ready tick contains a finite coordinate.
`formatTick` is accepted through the existing axis contracts but never called
by this engine. No number/date labels, locale formatting, label collisions, or
axis rendering are implemented. Temporal/category axes do not consume numeric
min/max semantics; the approved public types do not expose those bounds there.

## Implementation techniques and alternatives

Focused files separate domains, values, categories, numeric interpolation,
temporal interpolation, tick/range validation, result types, and construction
dispatch. Generators stream eligible values into one-pass min/max scans, avoiding
sorts, large temporary flattened arrays, and spread-argument limits. Readonly
types and discriminated results guard source traceability and invalid states.
Small mutable local accumulators build fresh outputs; there are no global caches
or stores. No React or browser runtime is imported.

```ts
// Internal source usage only; these are not public package exports.
const normalized = normalizeCartesian({
  data: [
    { x: 'Jan', y: 95 },
    { x: 'Jan', y: 105 },
  ],
  xKey: 'x',
  yKey: 'y',
});
const x = createXScale(normalized, [0, 200]);
const y = createValueScale(normalized, 'line', [100, 0]);
if (x.status === 'ready' && x.kind === 'category' && y.status === 'ready') {
  x.position(1); // { status: 'mapped', position: 150 }
  y.map(105); // { status: 'mapped', position: 0 }
}
```

Label-keyed bands were rejected because duplicates would collapse. Aggregating
categories or retaining invalid-X spacing slots would impose a different data
and spacing policy. Always including zero on Lines would obscure variation.
D3's default constant-domain midpoint mapping alone would leave unusable axis
extents, so deterministic display expansion is explicit. Automatic `nice()` was
not applied because it would obscure exact policy/bound assertions and alter
explicit bounds. Rescaling extreme numbers before D3 could expand supported
arithmetic, but adds precision/translation complexity; explicit unusable results
are the present tradeoff. Using only `scaleTime` would erase UTC semantics.

## Limitations and deferred responsibilities

The helpers trust the M02-T01 normalized model, not arbitrary manually forged
states. Repeatability assumes unchanged inputs. Date/reference preservation is
not a deep snapshot; freezing a Date does not prevent application code changing
its internal timestamp. D3 closures copy domains/ranges at construction, while
observed endpoints and category labels preserve source references.

Missing-point gaps, interpolation between data, clipping, public error/empty
presentation, padding choices, baseline geometry, stacked charts, grouped bars,
tick label selection, collision avoidance, margins, orientation-specific axes,
React components, SVG/Canvas, hooks, interactions, and segment percentages are
later responsibilities. Layout and geometry must continue narrowing normalized
states before constructing points; a ready scale is not permission to plot an
invalid row. Future Development Lead decisions include presentation of diagnostics,
local-time SSR policy, precision support for unsafe extreme spans, and category
padding conventions. No new public types, exports, subpaths, CSS requirements,
dependencies, CI matrix changes, publication, or deployment are introduced.
