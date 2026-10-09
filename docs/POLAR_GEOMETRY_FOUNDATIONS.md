# Polar geometry foundations — M04-T01

This source-internal pure engine will serve future PieChart and DonutChart
renderers. Neither component is implemented. Package runtime exports remain
exactly LineChart, AreaChart and BarChart; there are no new props, dependencies
or public subpaths. Cartesian calculations and presentation are unchanged.

## Pipeline and contracts

Call unchanged `normalizeSegments({ data, nameKey, valueKey })`, then pass its
complete result to `buildPolarGeometry({ normalized, family, width, height })`.
Donut alone accepts `innerRadiusRatio`. No raw data or unrelated precomputed
layout enters geometry. `polar-types.ts` defines readonly input, viewport,
slice, diagnostic and discriminated result contracts; `polar-validation.ts`
resolves dimensions/radii, `polar-arcs.ts` generates and validates paths, and
`polar.ts` composes eligibility, totals, proportions and angular layout.

Every result retains the exact normalization result and normalization diagnostics
separately from geometry diagnostics. The normalized model retains every source
record, row index, segmentId, raw field and field-presence state, including zero
and excluded rows. Slice record and category references remain original references,
including cross-realm Dates. Duplicate labels remain distinct. Source-index IDs
are stable for unchanged ordering, not persistent IDs across data insertions.
References provide provenance, not deep snapshots of later caller mutations.

## Eligibility and states

| Source state                                  | Geometry policy                                                                     |
| --------------------------------------------- | ----------------------------------------------------------------------------------- |
| Valid label and finite positive number        | Eligible for totals, percentages and slices                                         |
| Valid zero                                    | No path or angular extent; retained in normalized model for zero-percent tables     |
| Missing or invalid label/value                | Excluded from drawable geometry and totals; retained with normalization diagnostics |
| Unsupported negative, even with invalid label | Complete geometry unusable; never draw a partial positive pie                       |

Numerical strings remain invalid, never coerced. Missing/invalid values never
become zero. Normalization configuration failure returns `unusable`.

- `ready`: at least one positive slice, safe viewport, total and all slice paths.
- `empty`: valid viewport with no positive eligible value and no negative;
  `reason` distinguishes `no-source`, `all-zero` (every row has valid label and
  zero value), and `no-eligible-positive` (including missing/invalid rows).
  Slices are empty and the eligible total is finite zero. No division occurs.
- `unusable`: invalid configuration/dimensions/radii, negative values, lost
  numerical proportions/angles or failed paths. No partial slices, total or
  viewport is exposed as trusted geometry. Normalized source remains available.

Geometry diagnostics identify failure codes and descriptions; negative,
proportion and path failures include original rowIndex and segmentId. Descriptions
are internal explanations, not approved user-facing wording. Routine failures
are returned without logging or throwing.

## Numerical safety and angular layout

Divide each eligible value by the largest eligible value, then accumulate weights
with compensated summation. Percentage is `weight / scaledSum * 100`.
The raw total uses `maximum * scaledSum`: a finite result is reported through
`{ status: 'finite', value }`; an unrepresentable result uses
`{ status: 'overflow' }`, without trusted Infinity or fabricated finite totals.
Source values are never changed, including the final value. Ordinary finite
rounding applies to totals and percentages; percentages sum approximately to 100.

D3 `pie().sort(null).sortValues(null)` receives copied proportional weights.
Both sorting modes are explicitly disabled. Source order and identity survive;
no label grouping or aggregation occurs. Start angle zero corresponds to twelve
o'clock in D3's coordinate convention; angles advance clockwise through 2π.
There are no angle controls or padding. Pie and Donut share the same angles.

Scale normalization avoids overflow in D3's accumulation, unlike summing original
large values directly. Compensated accumulation reduces summation error; arbitrary
precision arithmetic would add complexity without solving SVG's double-precision
coordinate limits. D3 still accumulates angular weights in ordinary floating point.
Extremely disparate values can underflow a weight or collapse a later angular
boundary. These cause `unsafe-proportions`, rejecting the whole geometry rather
than silently dropping a positive observation. D3 and its path serializer's small-angle tolerances can also
produce a degenerate path without an arc; this causes `path-failed`. No artificial
minimum slice or redistribution is introduced. Subnormal equal values remain
meaningful after scaling, and large equal values can render despite raw-total overflow.

## Viewport, radii and paths

Width and height must be explicit finite positive numbers no larger than
MAX_SAFE_INTEGER, following the existing dimension safety bound. The circle is
centered at `(width / 2, height / 2)` with outer radius
`min(width, height) / 2 - 8`. The initial internal margin is eight pixels on the
shorter dimension; the longer dimension has additional centered space. Dimensions
at or below sixteen pixels cannot retain positive radius and are unusable.
There are no axes, label measurements, elliptical scaling or responsive APIs.

Pie inner radius is always zero; passing a ratio is rejected. Donut defaults to
0.6 only when omitted/undefined. This is an initial internal rendering policy
subject to Development Lead review. Explicit ratios must be finite and strictly
between zero and one. Inner radius is outer radius times ratio; validation requires
finite positive representable radii and a distinct inner radius below outer radius.
A tiny ratio whose hole underflows is rejected. A representable hole lost by
D3 arc/path tolerances also fails path validation; it never becomes a filled Pie.

D3 `arc().digits(null)` produces actual sectors and rings, including full circles
with two outer arc commands (and two inner arc commands for full Donuts).
Full precision avoids three-decimal coordinate rounding. Paths are local to
(0,0); a renderer translates them by the retained center metadata. Slice metadata
also retains dimensions, radii, original value/label/record/index/segmentId,
start/end angles, angular span and percentage. Renderers need not parse paths.

Path validation rejects null, exceptions, malformed command arities, nonfinite
coordinates, invalid arc radii or flags, and paths without a circular arc. Generated
paths must start with M and end with Z. Failure of any required slice rejects the
complete result. Real D3 geometry tests accompany controlled failure tests.

## Purity and future responsibilities

All work uses local arrays and accumulators. Frozen arrays, records and normalized
models are supported. There is no mutation, in-place sorting, Date mutation,
React runtime, SVG element creation, DOM, Canvas, browser measurement, global
cache, clock, random source or locale/timezone-dependent calculation. Repeated
calls with unchanged inputs produce equal results. The existing normalized model
contract is trusted; manually forged models are not a second normalization API.
Runtime is O(source rows) plus path output and allocates proportional metadata.

Future renderers must resolve responsive dimensions, translate and style paths,
choose legends/labels, implement diagnostics/empty presentation, provide complete
source tables (including zero and excluded observations), and design keyboard,
focus, tooltip and activation behavior. Visual geometry alone is not an accessible
chart. Screen-reader review and final polar accessibility design remain open.
Center content, animation, public presentation defaults and wording, tiny-slice
interaction policy and public Pie/Donut components are deferred. M04-T02 is not
started; this task ends at the internal foundation and Development Lead review.
