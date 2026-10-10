# Open decisions

The MIT copyright-holder decision is finalized: the Development Lead approved Michael Garcia. `LICENSE` includes Copyright (c) 2026 Michael Garcia.

- Approve publication, final package name, initial version, and release process. Package remains private at version 0.0.0.
- RSC-026/RSC-027 public prop and data contracts are implemented in M01-T02; see [API type contracts](API_TYPE_CONTRACTS.md). M02-T01 implements internal normalization and classification; see [data normalization](DATA_NORMALIZATION.md). M02-T04 implements internal Cartesian missing-point gaps and zero-baseline geometry. Cartesian invalid-data presentation, accessible naming and interaction are implemented in M03; M04-T01 implements internal negative rejection and explicit empty zero-total polar geometry; M04-T02 implements public Pie presentation; Donut presentation remains deferred. M02-T02 implements internal domain/scale/tick policies; see [scales and domains](SCALES_AND_DOMAINS.md).
- M01-T03 proves explicit SVG SSR and responsive accessible placeholders with a 280px default, stable IDs, observer cleanup, and jsdom hydration. M01-T04 completes packaged Vite/Next consumer verification using a temporary probe; M03 implements positive finite explicit dimensions and accessible responsive/local-time placeholders; see [rendering compatibility](RENDERING_COMPATIBILITY.md).
- M01-T03 proves self-contained inline styles and CSS variable fallbacks, visually hidden tables, and focus outlines. Public token API approval, strict CSP support and arbitrary host-style interactions remain open; public charts currently expose an outline on focus and keyboard target stroke.
- Empty/unavailable messages and local-time client placeholders are implemented. Richer diagnostic UI, future spacing changes and safe rescaling for numerical spans that overflow D3 arithmetic remain design decisions. The M02-T02 rules for duplicate category identity, valid-X value eligibility, zero baselines, bounds, and constant/fallback domains are documented implementation choices, not unresolved engine behavior.
- Decide whether pure helpers ever become public root exports or separate server-safe entries; no public internal subpaths exist now.
- Approve a broader browser support policy for the implemented Cartesian components. Current JS target is ES2022.
- React 18/19 type-definition coverage is added for M01-T02; M01-T03 adds internal SSR, hydration, lifecycle, accessibility, and styling tests to the existing matrix. Public Cartesian runtime components have genuine consumer integration and interaction tests; real screen-reader review and broader browser validation remain open.

Milestone 01 and Milestone 02's M02-T01 through M02-T04 internal foundation tasks are complete and merged. Normalization, scales, layout, and geometry remain internal. M03-T01 provides internal SVG rendering; LineChart, AreaChart and BarChart are public; PieChart is subsequently public in M04-T02; Donut remains deferred.

M02-T03 documents bounded margin estimates, greedy tick selection, single-line formatting failures, hidden-axis title suppression, horizontal Bar mappings, and independent value grids in [layout and axes](LAYOUT_AND_AXES.md). These engine policies are explicit; future decisions concern final renderer font/title styling and fitting, diagnostic presentation, local-time SSR strategy, and final renderer visual spacing.

M02-T04 documents independent missing-point runs, singleton retention, Area baseline closure, stable grouped Bar slots (80% groups/90% slots), and unclamped out-of-plot metadata in [geometry foundations](GEOMETRY_FOUNDATIONS.md). These are implemented internal calculation policies. Development Lead review remains for final visual spacing, clipping/marker presentation, diagnostic UI, performance budgets and future extreme-number support. M03-T01 now provides internal SVG plot clipping; public Line/Area production rendering is implemented.

M03-T01 adds the internal engine-based Line preview and actual SVG plot clipping.
Its local-time policy is an initial placeholder followed by client-timezone
geometry; responsive charts reuse per-container observation. Review its documented
conservative title omission, endpoint marker clipping, internal color tokens and
empty/unavailable presentation before promoting production behavior. M03-T02 subsequently validated public LineChart tooltips, activation and point keyboard navigation; genuine packaged-consumer verification now covers all three Cartesian families.
See [SVG rendering foundation](SVG_RENDERING_FOUNDATION.md).

## M03-T02 resolved LineChart policies

LineChart is the first public runtime export. Its shared tooltip groups by original
source row; item mode preserves one original datum. One roving Tab entry traverses
source/series order, with local touch selection and explicit dismissal. Static
SSR/default rendering and opt-in 180ms client opacity animation respect reduced
motion. Local time retains the M03-T01 client placeholder. Source tables remain
complete, including clipped observations. See [LineChart](LINE_CHART.md).

Release approval, screen-reader review, broader browser testing, strict CSP,
performance budgets and large-data decimation remain open. M03-T02 added no new public props. M03-T03 is implemented below.

## M03-T03 resolved AreaChart policies

Independent unstacked zero-baseline fills use internal opacity 0.2. Exact core
polygons have no stroke; pure-core outlinePath renders only actual data boundaries.
Singletons retain markers; missing runs remain separate. Point inspection reuses
the corrected Line interaction implementation. See [AreaChart](AREA_CHART.md).
Public opacity, stacking, interpolation, gradients and baseline configuration
remain future design decisions. M03-T04 subsequently implemented public BarChart.

## M03-T04 public BarChart

BarChart now consumes existing grouped rectangle geometry in both orientations.
Physical formatter routing preserves semantic xKey categories; shared presentation
and corrected gesture handling also serve Line/Area. Item inspection is the Bar
default; visible rectangle intersections and in-plot zero targets determine
eligibility. Exact decorative extents, stable missing slots, source tables and
SSR policy are preserved. No public props, dependencies, core math changes or
subpaths are added. See [BarChart](BAR_CHART.md). M03-T05 hardening is documented in [integration hardening](M03_INTEGRATION_HARDENING.md).

## M03-T05 implemented and proposed decisions

Implemented: shared text wrapping for visible source tables and tooltip content; tooltip outer box matches the existing anchor estimate. Public props and color behavior are unchanged. Proposed, requiring Development Lead review: broader browser policy and production performance budgets. Still open: native forced colors/zoom, manual screen-reader review, strict CSP and release approval. Chromium emulation is limited evidence, not complete compatibility.

## M04-T01 polar foundation

Implemented engine policies: source-order slices, exclusion of missing/invalid
rows from totals, complete rejection of negatives, explicit zero-total states,
scaled numerical weights, overflow metadata, centered circles and safe D3 arcs.
See [polar geometry foundations](POLAR_GEOMETRY_FOUNDATIONS.md). Initial eight-pixel
margin and Donut ratio 0.6 await Development Lead review as rendering policies.
Public diagnostic wording, labels, legends, center content, tiny-slice interaction,
source-table presentation, keyboard behavior and screen-reader validation remain
open. No public PieChart/DonutChart renderer is approved by this task.

## M04-T02 implemented Pie policies

PieChart is public; DonutChart remains deferred to M04-T03. The source-ordered
static legend includes drawable positive slices; zero/excluded rows remain in the
complete table. Labels default off and use conservative interior estimates without
collision detection. Colors resolve by original source index. Percentages display
one decimal but payloads preserve engine values. Keyboard navigation clamps at
boundaries with one roving entry. Exact-sector pointer targets avoid neighboring
activation; tiny slices remain keyboard reachable. Negative values reject the
entire pie; no partial chart is presented. SSR/static defaults, per-container width
measurement and reduced-motion opacity follow established presentation policies.
See [PieChart](PIE_CHART.md) for implemented decisions and limitations.

### Future review decisions

Manual screen-reader and broader browser review, host CSP/theme support, performance
budgets and improved measured label placement remain open. Donut center content,
public radius settings, interactive legends and later milestone integration are
outside M04-T02. No publication, merge or release approval is implied.
