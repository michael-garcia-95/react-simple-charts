# Architecture

React Simple Charts is a single TypeScript-first React component library with
SVG rendering. Its five runtime exports are **LineChart, AreaChart, BarChart,
PieChart and DonutChart**. All public components and types come from the package
root; pure helpers and internal subpaths are not public APIs.

## Module boundaries

| Location                 | Responsibility                                                      |
| ------------------------ | ------------------------------------------------------------------- |
| `src/index.ts`           | Public runtime and type exports; client boundary                    |
| `src/charts/`            | Generic component wrappers and local inspection/activation          |
| `src/core/`              | Pure normalization, scales, layout and geometry                     |
| `src/internal/`          | React orchestration, responsive measurement and shared presentation |
| `src/internal/svg/`      | SVG frames/marks/axes, hit regions, tables and formatting/styles    |
| `src/types/contracts.ts` | Public prop unions, field mappings and callback payloads            |
| `src/styles/`            | Styling conventions; no runtime stylesheet currently                |
| `playground/`            | Technical examples and repository-only compatibility fixtures       |
| `site/`                  | Public website, examples and documentation                          |
| `tests/` and `scripts/`  | Contract, rendering, package and installed-consumer verification    |

Mathematical calculations do not import React or read the DOM. Renderers consume
retained engine paths and metadata instead of recalculating values, totals or
percentages. This keeps numerical policies independently testable and shared
between browser and server execution.

## Data and geometry pipeline

`core/data/` validates mappings, classifies values and normalizes Cartesian or
segment records. Original references, indices, order, duplicate categories and
raw values are retained. Configuration errors return no model; row problems retain
classified records for complete source tables. Numeric strings are not coerced.
See [data normalization](DATA_NORMALIZATION.md).

Cartesian scales support category, linear, UTC and local-time X for Line/Area;
Bar uses categories in either orientation. Only valid-X rows occupy category bands,
and only valid-X rows with valid series values contribute value extents. Observed
extents are distinct from baseline, override, expansion and fallback domains.
Physical axis types follow orientation rather than changing the meaning of `xKey`.
See [scales](SCALES_AND_DOMAINS.md) and [layout](LAYOUT_AND_AXES.md).

Layout uses two deterministic scale passes for bounded margins, plot bounds,
estimated label fitting, ticks and grids. Unsafe arithmetic returns an explicit
unusable result. Geometry preserves independent gaps and singleton observations,
zero-baseline Area fills, grouped Bar slots and clipping metadata. Area's separate
outline follows observed data rather than stroking baseline/closing walls. Bar
slots use 80% category groups and 90% per-series occupancy. No stacking or automatic
decimation is implemented. See [Cartesian geometry](GEOMETRY_FOUNDATIONS.md).

Polar geometry reuses segment normalization. Finite positives contribute
source-ordered scaled weights, totals, angles and d3-shape arcs; zero/missing/invalid
rows remain in tables. Any finite negative rejects the entire chart. Ready, empty
and unusable states never invent partial or placeholder proportions. The center is
half the viewport dimensions, outer radius is half its smaller dimension minus 8px,
and Donut's default inner-radius ratio is 0.6. Unsafe ratios/radii/arcs return
unavailable content rather than being clamped. See [polar geometry](POLAR_GEOMETRY_FOUNDATIONS.md).

## React rendering and interaction

Line/Area/Bar share `CartesianPointRenderer` and `CartesianPointInspection`.
`LineRenderer` and `LineInspection` are internal aliases; `LinePreview` disables
interaction and `RenderingProbe` retains a fixed repository-only fixture.
Decorative marks are clipped to plot bounds; interaction controls use eligible
visible geometry while source tables retain clipped observations.

Pie/Donut share `PolarRenderer`, `PolarMarks` and `PolarSegmentInspection`.
Exact sectors are pointer targets without expansion across neighboring slices.
Donut's center content is HTML in an inscribed square derived from the actual hole,
with proportional placement under SVG scaling. Large custom content is clipped;
ordinary center controls remain focusable and do not activate slices.

Each chart owns its inspection and gesture state. One roving SVG Tab entry,
arrows/Home/End, Enter/Space and Escape provide navigation, activation and dismissal.
Pointer/touch evidence is source-scoped to prevent delayed compatibility clicks
from activating twice. Payloads preserve source provenance. Tooltip defaults are
shared for Line/Area and item-based for Bar; polar contexts describe one segment.
Selection invalidates when source identity/value changes. Geometry does not live
in event handlers. See the five chart guides for exact contracts.

Interactive SVGs are named groups with exposed controls and hidden decorative
layers. React useId connects names, descriptions, tooltips and tables. Every chart
state includes a semantic source table, visible or visually hidden. Custom tooltip
semantics remain the caller's responsibility. Optional 180ms decorative opacity
animation respects reduced motion; geometry/controls remain static.

Essential styles are inline with CSS-variable palette fallbacks, so no external
stylesheet is required. Legends and visible tables wrap long text. The shared
220px tooltip panel uses bounded approximate positioning without portals or
arbitrary-content measurement. Strict CSP, host styling and measured collision
handling are documented limitations, not guaranteed contracts.

## Server rendering and responsive dimensions

Explicit finite positive numeric dimensions render deterministic category/linear/
UTC SVG in Node. Responsive widths initially render stable accessible placeholders
and tables until per-container ResizeObserver supplies a valid width. Without the
observer, that alternative remains; no server width is guessed. Local-time scales
wait for client timezone layout. Prefer UTC and deterministic custom formatters
when server/client consistency matters.

Effects own browser measurement/animation and clean up under Strict Mode. Imports
and pure calculations do not access browser globals. Independent hydrated roots
require matching, distinct `identifierPrefix` values on server and client.
The built `use client` banner preserves Next App Router boundaries; it does not
make pure helpers publicly server-importable. Genuine Next fixtures verify client
references and hydration rather than inferring behavior from the directive.

## Build and distribution

Strict TypeScript checking includes exact optional properties, unchecked indexed
access protection, explicit type imports and bundler resolution. Generic inference
comes from `data`; `NoInfer` and discriminated unions constrain mappings, axes and
exclusive single/multi-series props. See [type contracts](API_TYPE_CONTRACTS.md).

tsdown emits ES2022 ESM, declarations and a retained public-source map from one
entry. React/React DOM and their subpaths are external peers; d3-scale/d3-shape are
external runtime math dependencies. The package has only a root types/import
entry, no CommonJS or default export, and `sideEffects: false` with no global CSS.
Revisit that flag if global effects or imported styles are introduced.

The six-file archive includes the ESM, declarations, map, manifest, README and MIT
license. Site, playground, sources, tests, drivers and local evidence are excluded.
The package remains private `0.0.0` and unpublished. Contributor Node requirements
come from build/test tools; the package has no engines declaration.

## Validation and historical evidence

Unit/component tests cover engine policies, interactions, SSR, hydration, lifecycle
and accessibility relationships. Type tests and package verification compile the
real declarations, reject internal imports, inspect the actual archive and probe
React externalization. Installed Vite/Next consumers use genuine tarballs.

CI checks Node 22/24 × React 18.2/19. A separate three-engine job validates the
installed production fixture in Chromium, Firefox and WebKit. Exact tested versions,
axe incomplete checks and pending human/device verification are recorded in
[distribution compatibility](M06_DISTRIBUTION_COMPATIBILITY.md).

Historical reports remain available: [SVG foundation](SVG_RENDERING_FOUNDATION.md),
[Cartesian integration](M03_INTEGRATION_HARDENING.md),
[five-family integration](M04_INTEGRATION_HARDENING.md),
[consumer verification](CONSUMER_COMPATIBILITY.md) and
[website hardening](M05_WEBSITE_HARDENING.md). Their earlier export/availability
statements describe their original stage and are superseded by this current overview.
The [previous architecture chronology](https://github.com/michael-garcia-95/react-simple-charts/blob/261285f3a74c7eae5f34174d50f6f648af841a93/docs/ARCHITECTURE.md)
is retained in repository history.
