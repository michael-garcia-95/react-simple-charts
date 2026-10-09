# Data normalization — M02-T01

Milestone 01 is complete. M02-T01 introduces a pure, internal foundation under
`src/core/data/`. The public library still has no implemented chart components
or runtime exports. Normalization prepares traceable source data for future
scales, layout, renderers, accessibility tables, tooltips, and activation payloads.
It does not build those features.

## Internal structures

`NormalizedCartesianData<T>` contains the configured `xKey`, effective `xScale`,
ordered `NormalizedSeries` metadata, and ordered `NormalizedCartesianRow<T>` rows.
Each row has the exact original `record` reference, original `index`, an `x`
classification, and a `values` array aligned with the series array. Series retain
key, configuration index, and optional label/color strings. There are no palette
or label defaults. A yKey becomes one series with that key and index zero.

`NormalizedSegmentData<T>` contains name/value mappings and ordered
`NormalizedSegment<T>` entries. Each entry retains record, index, label state,
value state, and `segmentId` equal to the source index. Pie and Donut share this
model; no arc or percentage is computed. Index identities are stable for the
same input ordering, not persistent application IDs across insertions/reordering.

`ValueState<V>` is a discriminated union. Consumers must narrow `status` before
reading `value`; only a valid state has that property. Every state retains `raw`
and `present`, distinguishing absent fields from explicit undefined. Missing
values never masquerade as zero.

| Status      | Numerical meaning                                                       | Payload                              |
| ----------- | ----------------------------------------------------------------------- | ------------------------------------ |
| valid       | Finite JavaScript number (including zero/fractions/Cartesian negatives) | value, raw, present: true            |
| missing     | null, undefined, absent own property                                    | raw, present                         |
| invalid     | Anything else, including NaN, infinities, strings, booleans             | raw, present                         |
| unsupported | Segment-only finite negative number                                     | raw, present: true, reason: negative |

X/label states use valid/missing/invalid. Category mode accepts strings, finite
numbers, and genuine valid Dates (including cross-realm Dates). Linear mode
requires finite numbers; utc/time require valid Dates. Date references survive
unchanged; Date.prototype.getTime checks their native internal date value.
Strings are never parsed. Non-finite categorical numbers are invalid, keeping
category validation consistent with numerical classification.

## Cartesian flow and example

`normalizeCartesian` accepts the mapping subset of the approved public contracts:
readonly data, xKey, exactly one of yKey/readonly series, and optional xScale.
Line/Area can specify all four modes; Bar supplies its categorical mapping with
no xScale. Orientation affects later physical axes, not source normalization.

1. Validate configuration and copy ordered series metadata.
2. Default an omitted xScale to category while retaining utc/time distinctly.
3. Visit every source index with Array.from, reading each mapped own property.
4. Classify X, then each numerical value in series order.
5. Return the complete model plus deterministic diagnostics.

```ts
const first = { month: 'Jan', revenue: 150 };
const second = { month: 'Jan', revenue: null };
normalizeCartesian({
  data: [first, second],
  xKey: 'month',
  yKey: 'revenue',
});
// status: 'normalized'
// data.series: [{ index: 0, key: 'revenue' }]
// data.rows[0]: {
//   record: first, index: 0,
//   x: { status: 'valid', value: 'Jan', raw: 'Jan', present: true },
//   values: [{ status: 'valid', value: 150, raw: 150, present: true }]
// }
// data.rows[1].values:
//   [{ status: 'missing', raw: null, present: true }]
// diagnostics: one data warning for row 1, field revenue, seriesIndex 0
```

Repeated labels, numbers, and dates remain separate rows. Later band scales must
use source-index identities rather than deduplicating labels. Out-of-order X
values are preserved. No records are sorted, aggregated, merged, or removed.

## Segment flow and example

`normalizeSegments` validates readonly data/nameKey/valueKey, classifies labels
using category semantics, classifies values numerically, and marks finite
negatives unsupported. It retains every entry, including missing/invalid labels
and values. For `{ name: 'A', value: -2 }` at index 3, the entry retains the exact
record, index/segmentId 3, a valid label state, and:

```ts
{ status: 'unsupported', reason: 'negative', raw: -2, present: true }
```

Zero-only datasets return valid zero states. No total, division, percentage,
filtering, or final rendering policy is implied.

## Configuration and diagnostics

`NormalizationResult<D>` has two branches:

- `invalid-configuration`: error diagnostics and **no data model**. Invalid
  configuration is never silently repaired or partially exposed.
- `normalized`: a complete data model and data warnings (possibly none).
  This includes empty datasets and entirely missing/invalid datasets. Consumers
  inspect array lengths and states to distinguish empty, valid, and partial data.

Configuration checks reject non-object options, non-array data, non-string
mapped keys, conflicting/missing yKey/series, empty/non-array series, malformed
series entries, non-string optional labels/colors, duplicate keys, and unknown
scale modes. Undefined optional configuration values count as omitted; null does
not. String keys include the legal empty-string property name. Field existence
is not tested globally: empty and sparse datasets must remain usable. Runtime
cannot infer a field's declared TypeScript type from an empty dataset.

Diagnostics include code, description, configuration/data scope, error/warning
severity, and relevant field, rowIndex, and seriesIndex. Configuration order is
base checks, series checks in configuration order, then scale checks. Data order
is row order, X/label first, then series/value order. There is no automatic console
logging and no exception for ordinary missing/invalid values.

## Techniques and tradeoffs

Pure functions construct fresh arrays and metadata objects, with readonly input
and output types. They never freeze developer objects, sort in place, deep-copy
records, or cache globally. Preserving references makes future callbacks accurate
and avoids copying application metadata. It also means later developer mutation
is visible through record/raw Date references: this is traceability, not a deep
snapshot. Repeatability assumes unchanged inputs.

Aligned value arrays keep row/series traversal simple without maps or a rendering
framework. Discriminated unions prevent accidentally treating invalid/missing
values as usable numbers. A result union makes configuration failures explicit
without exception-driven ordinary validation. Warnings retain all questionable
source values for later policy decisions and accessibility alternatives.

Only own mapped properties are source fields; inherited prototype members are
missing. Sparse array holes are retained as undefined source entries with missing
fields, and malformed non-object row entries likewise have missing mapped fields.
This defensive behavior handles untyped callers without dropping indices.
Ordinary record data is expected: getters/proxies can execute user code or throw
when read, and such exceptions are not swallowed. Normalization cannot guarantee
purity of caller-defined accessors. No browser globals or React runtime are used.

## Scale integration and deferred responsibilities

M02-T02 now implements internal domains, scales, and typed ticks; see
[scales and domains](SCALES_AND_DOMAINS.md). Category positions include valid-X
rows only, retaining source-index identity and order; invalid-X rows remain in
this model but occupy no bands. A value contributes to a renderable numerical
domain only when both its X and its series value are explicitly valid.

M02-T03 implements internal layout; M02-T04 implements Cartesian paths and
missing-point gaps in [geometry foundations](GEOMETRY_FOUNDATIONS.md).
Renderer timezone strategy, polar arcs, percentages and zero-total polar geometry policy,
colors, CSS, tooltips, animations, hooks, keyboard navigation, accessible names,
and construction of public callback payloads remain later work. Negative
segments are identified here; final user-visible fallback behavior needs later
Development Lead decisions. No public contracts, package subpaths, client
boundary, dependencies, or packaged consumer strategy change in this task.

## M04-T01 polar integration

Unchanged segment normalization now feeds the internal polar engine. Valid labels
with positive values alone contribute to totals; zero/missing/invalid entries stay
traceable in the retained normalized model. Any unsupported negative makes the
complete geometry unusable. See [polar geometry foundations](POLAR_GEOMETRY_FOUNDATIONS.md)
for implemented calculation policies and deferred presentation decisions.
