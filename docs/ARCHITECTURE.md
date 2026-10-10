# Architecture

## Approved direction

React Simple Charts is a single npm package, a TypeScript-first React component library supporting React 18.2+ and React 19.x. Rendering is SVG-first. All five chart families—Line, Bar, Area, Pie and Donut—are implemented.

## Module responsibilities

- `src/charts/`: specialized chart renderers and family-specific orchestration.
- `src/core/`: shared chart infrastructure. Data normalization, scales, layout, and geometry must be pure calculations separated from React lifecycle and DOM access.
- `src/internal/`: implementation details unavailable through package subpaths.
- `src/styles/`: self-contained styling based on CSS variables. Future components must work without a mandatory external stylesheet.
- `src/types/`: shared TypeScript contracts. `contracts.ts` contains focused chart-family unions and shared data, axis, tooltip, activation, and accessibility types. See [API type contracts](API_TYPE_CONTRACTS.md).
- `src/index.ts`: the sole public barrel. It exports approved M01-T02 contracts as types and LineChart, AreaChart, BarChart, PieChart and DonutChart as the only runtime chart exports.
- `playground/`: a Vite React application, excluded from the npm package.
- `tests/`: foundation contract and accessible playground tests.
- `scripts/verify-package.mjs`: verifies built artifacts and probes runtime externalization using the real build configuration.

Directory README files preserve the intended structure in Git without prematurely creating abstractions.

## Build and dependencies

TypeScript uses strict checking, exact optional properties, unchecked indexed access protection, and bundler resolution. Type-only imports remain explicit through verbatim module syntax. A single no-emit configuration checks the current codebase; tsdown separately emits library declarations.

tsdown produces ESM and declarations from one entry. React and React DOM, including JSX and DOM client subpaths, stay external. They are peers for consumers and development dependencies for the playground/tests. d3-scale and d3-shape are the approved runtime math dependencies. M02-T02 uses d3-scale internally for band, linear, UTC, and local-time calculations; M02-T04 uses d3-shape internally for linear Line and zero-baseline Area path data. No animation runtime is included.

The package exposes only `.` with declaration and import conditions, and has no CommonJS output. A files allowlist excludes playground, tests, and source from packing. `sideEffects: false` is appropriate for self-contained components with no imported/global CSS; revisit it if future implementation introduces global effects or imported CSS.

## React and server rendering

The source barrel and tsdown banner preserve `"use client"` in built JavaScript. The banner also covers future shared output chunks. This prepares framework boundaries without introducing a component or DOM-dependent import. It does not prove SSR support.

M01-T03 validates dimension-aware SSR in an internal rendering fixture. Positive finite numeric dimensions produce complete SVG; unknown responsive widths produce a stable accessible 280px-height placeholder until a per-container ResizeObserver reports a valid width. Pure layout calculations do not read browser globals. Node SSR and jsdom hydration tests cover deterministic initial markup, useId references, Strict Mode, observer cleanup, and multiple instances. Headless Chromium verifies responsive layout, focus, accessible table exposure, and self-contained inline/CSS-variable styling. See [rendering compatibility](RENDERING_COMPATIBILITY.md) for evidence and limitations. M01-T04 uses separate genuine and temporary probe tarballs in independent Vite/Next consumers; see [consumer compatibility](CONSUMER_COMPATIBILITY.md) for framework results, reproduction, and limitations. No public runtime API is added.

## Validation

Vitest tests the foundation playground with React Testing Library and the package safety contract in Node. The package verification script checks actual output, typechecks generated declarations, rejects internal subpath imports, and builds a disposable React import probe because an empty entry alone cannot demonstrate externalization. CI runs formatting, linting, typechecking, tests, artifact verification, playground build, and dry-run packing for both React generations on Node 22/24.

## Public contract milestone

M01-T02 implements RSC-026/RSC-027 as types, with data-driven generic inference, exclusive single/multi-series mappings, scale-specific keys, and physical-axis typing for horizontal Bars. Compile-time tests use test-only generic declarations; they are not chart implementations. Dedicated source tests and package-root consumer verification exercise both JSX and props objects. React 18/19 type definitions now accompany the runtime CI matrix. Public Cartesian rendering, interaction and source-table accessibility are implemented in M03; polar presentation is implemented in M04-T02/T03. M02-T01 now implements internal data normalization and its mapping/value validation; see [data normalization](DATA_NORMALIZATION.md).

## Internal data foundation — M02-T01

`src/core/data/` separates mapping validation, value classification, structured diagnostics, Cartesian normalization, and shared Pie/Donut segment normalization. Results preserve source references, indices, order, and raw values. Configuration errors return no model; row issues retain classified records. No React runtime, DOM, scales, geometry, or public runtime exports are introduced. Milestone 01 and M02-T01 are complete.

## Internal scales foundation — M02-T02

`src/core/scales/` consumes the normalization result union and separates domain policies, category identity, numerical and temporal interpolation, tick/range validation, and internal result types. Only valid-X rows occupy category bands; only valid-X rows with valid series values contribute value extents. Category indices preserve duplicate labels; continuous domains preserve exact observed extents separately from baseline, override, expansion, and fallback metadata. Empty scales expose no mapping, and unsafe arithmetic returns explicit diagnostics. No layout, geometry, rendering, or public exports are added. See [scales and domains](SCALES_AND_DOMAINS.md). M02-T03 now connects these results to physical dimensions; see below.

## Internal layout foundation — M02-T03

`src/core/layout/` separates internal input/result types, estimated label formatting, bounded margins and plot bounds, physical axis dispatch, linear tick selection, value gridlines, and Cartesian composition. Two deterministic scale-construction passes reuse the existing domain policies and preserve duplicate category bands. Horizontal Bar maps semantic categories vertically and values horizontally without transposing records. Ready/empty/unusable results expose safe scales and finite metadata, with hidden axes omitted and required zero-baseline coordinates retained. Formatting has no browser measurement or additional timezone-sensitive defaults; local-time ticks still require consistent execution timezone for SSR. See [layout and axes](LAYOUT_AND_AXES.md). The public LineChart now consumes this internal engine. M02-T04 now adds the geometry layer below.

## Internal geometry foundation — M02-T04

`src/core/geometry/` separates readonly result types, shared datum mapping and gap runs, d3-shape Line/Area paths, grouped Bar slots/rectangles, numerical diagnostics, and orchestration. `buildCartesianGeometry` calls layout internally from the same normalized input, preventing unrelated model/layout pairs. It preserves source and series references, handles independent gaps and singleton points, uses physical zero baselines, and flags finite geometry outside explicit bounds for future plot clipping. Unsafe mappings/slots/paths expose no partial marks. See [geometry foundations](GEOMETRY_FOUNDATIONS.md). Milestone 02 is complete and merged. Public Line/Area rendering now consumes this foundation; stacking remains future work; polar geometry follows in M04-T01.

## Internal SVG rendering — M03-T01

Milestone 02 is merged. The source-internal `LinePreview` now consumes actual
normalization and Cartesian geometry, using focused shared frame, axes/grid,
color and table modules under `src/internal/svg/`. React/DOM presentation stays
outside the pure core. Explicit category/linear/UTC dimensions support SSR;
responsive widths and local-time mode use accessible initial placeholders.
See [SVG rendering foundation](SVG_RENDERING_FOUNDATION.md). The historical preview remains internal; tooltip/activation/animation are excluded from the internal
contract. M03-T02 adds public LineChart below.

## Public LineChart — M03-T02

`src/charts/LineChart.tsx` preserves the approved generic contract and delegates
shared dimensions, geometry assembly, axes, legend and source table to
`src/internal/LineRenderer.tsx`. LinePreview delegates to the same renderer with
interaction disabled. `LineInspection.tsx` consumes exact engine results and
adds source-row/series lookup maps, roving SVG buttons, tooltips, activation and
optional client opacity animation. Interactive SvgFrame is a named group;
noninteractive fixtures remain named images. Decorative layers are hidden,
point controls are exposed. Root imports now contain exactly LineChart, AreaChart and BarChart plus existing
type exports. Genuine consumer verification now installs that real tarball.
See [LineChart](LINE_CHART.md) for behavioral defaults and limitations.

## Public AreaChart — M03-T03

AreaChart uses the unchanged approved generic contract. CartesianPointRenderer
shares sizing, normalization, family dispatch, states, tables, legends and SSR
policy. CartesianPointInspection shares corrected point interaction, tooltips,
activation and animation for both families. Historical LineRenderer/LineInspection
names delegate to these modules; LinePreview and RenderingProbe remain internal.
AreaMarks presents exact core fills at 0.2 opacity without polygon stroke and
separate pure-core `outlinePath` boundaries. Core derives that Area-only optional
run field from the existing linePath using the same mapped points, without new
mapping/segmentation. Singletons have null fill and outline paths. No public
contract, dependency, subpath or future-family abstraction is added.
See [AreaChart](AREA_CHART.md).

## M03-T04 public BarChart

BarChart now consumes existing grouped rectangle geometry in both orientations.
Physical formatter routing preserves semantic xKey categories; shared presentation
and corrected gesture handling also serve Line/Area. Item inspection is the Bar
default; visible rectangle intersections and in-plot zero targets determine
eligibility. Exact decorative extents, stable missing slots, source tables and
SSR policy are preserved. No public props, dependencies, core math changes or
subpaths are added. See [BarChart](BAR_CHART.md). M03-T05 integration hardening is documented below.

## M03-T05 integration hardening

The shared inspection tooltip uses a 220px border-box matching its positioning estimate and wraps long text. Visible normalized/raw source tables wrap long fields without changing semantic data or hidden-table exposure. Cross-family tests and the playground/browser matrix verify independent lifecycle and state transitions. Genuine consumers add narrow text and three separately hydrated Strict Mode roots. No pure-core math or public contract changes. See [integration hardening](M03_INTEGRATION_HARDENING.md).

## Internal polar geometry — M04-T01

`src/core/geometry/polar*.ts` consumes the existing segment normalization result
for pure Pie/Donut eligibility, scaled proportions, source-ordered d3-shape angles,
centered radii and validated arc paths. Ready/empty/unusable results preserve
normalization provenance; negatives reject the complete chart. Public Pie/Donut
renderers remained deferred as of M04-T01. See [polar geometry foundations](POLAR_GEOMETRY_FOUNDATIONS.md).

## Public PieChart — M04-T02

As of M04-T02, PieChart was the fourth public runtime export and DonutChart remained type-only; M04-T03 implements Donut.
`src/charts/PieChart.tsx` preserves the approved generic props and delegates to
`src/internal/PolarRenderer.tsx`. The renderer normalizes source segments, resolves
explicit/responsive dimensions and invokes `buildPolarGeometry` with family pie.
It retains the normalization result for complete source tables. No Cartesian axes
or layout are involved. `PolarMarks.tsx` renders exact translated engine paths,
shared source-index colors and optional conservatively fitted interior labels.
`PolarSegmentInspection.tsx` keeps independent source-provenance selection,
roving controls, tooltip presentation, gesture evidence and decorative opacity
animation. Its gesture model follows the tested Cartesian source-scoped policy;
segmentId replaces series identity. No totals, percentages or paths are recalculated.

`indexedColor` shares the unchanged Cartesian palette/variable precedence.
`SegmentDataTable` preserves all normalized rows and negative raw values; the
existing raw fallback now retains an empty semantic table for malformed nonarray
data. No dependency, public contract or subpath is added. See [PieChart](PIE_CHART.md).
Earlier sections above record historical milestone state.

## Public DonutChart — M04-T03

DonutChart is the fifth runtime export. The approved generic contract is unchanged.
PolarRenderer accepts a discriminated family/props union; public wrappers select
pie or donut without unsafe prop casts. Normalization, source tables, legend,
colors, roving controls, tooltips, gesture evidence and opacity lifecycle are shared.
The unchanged pure engine validates the default/custom ratio and generates true
ring paths. Labels and tooltip anchors use ring midpoint; Pie keeps its original
60%-radius label position and fitting.

A Donut-only SVG frame contains an accessible HTML center region sized as an
inscribed square from engine inner radius. Percentage positions and proportional
SVG scaling preserve alignment under CSS constraints and non-square dimensions.
Legend and tables sit outside that frame. Interactive user content remains exposed
and confined to the actual hole. No default totals, portals, dependencies, public
props or Cartesian behavior changes. See [DonutChart](DONUT_CHART.md).

## Five-family integration — M04-T04

All five public families now have a reusable combined playground and shared-page
regressions. Focused Cartesian controls retain their Tab entry/outline during
hover, legends wrap long labels, and tooltip bounds follow the rendered figure.
No pure geometry, API, export or dependency changes are introduced. See
[five-chart integration and demo handoff](M04_INTEGRATION_HARDENING.md) for
actual browser/consumer evidence and remaining limitations.
