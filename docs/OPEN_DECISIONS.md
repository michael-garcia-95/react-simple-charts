# Open decisions

The MIT copyright-holder decision is finalized: the Development Lead approved Michael Garcia. `LICENSE` includes Copyright (c) 2026 Michael Garcia.

- Approve publication, final package name, initial version, and release process. Package remains private at version 0.0.0.
- RSC-026/RSC-027 public prop and data contracts are implemented in M01-T02; see [API type contracts](API_TYPE_CONTRACTS.md). M02-T01 implements internal normalization and classification; see [data normalization](DATA_NORMALIZATION.md). M02-T04 implements internal Cartesian missing-point gaps and zero-baseline geometry. User-facing invalid-data presentation, negative segments and zero-total polar geometry, accessible naming and interaction behavior remain deferred. M02-T02 implements internal domain/scale/tick policies; see [scales and domains](SCALES_AND_DOMAINS.md).
- M01-T03 proves explicit SVG SSR and responsive accessible placeholders with a 280px default, stable IDs, observer cleanup, and jsdom hydration. M01-T04 completes packaged Vite/Next consumer verification using a temporary probe; final public dimension validation remains open; see [rendering compatibility](RENDERING_COMPATIBILITY.md).
- M01-T03 proves self-contained inline styles and CSS variable fallbacks, visually hidden tables, and focus outlines. Final public token names, strict CSP support, host-style interactions, and production focus-visible behavior remain open.
- Decide user-facing presentation of scale diagnostics/empty states, local-time SSR timezone consistency, final renderer category/group spacing, and whether safe rescaling should eventually support numerical spans that overflow D3 arithmetic. The M02-T02 rules for duplicate category identity, valid-X value eligibility, zero baselines, bounds, and constant/fallback domains are documented implementation choices, not unresolved engine behavior.
- Decide whether pure helpers ever become public root exports or separate server-safe entries; no public internal subpaths exist now.
- Choose a broader browser support policy and document it when components exist. Current JS target is ES2022.
- React 18/19 type-definition coverage is added for M01-T02; M01-T03 adds internal SSR, hydration, lifecycle, accessibility, and styling tests to the existing matrix. Future public runtime components still need consumer integration and interaction testing, real screen-reader review, and cross-browser validation.

Milestone 01 and Milestone 02's M02-T01 through M02-T04 internal foundation tasks are complete and merged. Normalization, scales, layout, and geometry remain internal. M03-T01 provides internal SVG rendering; LineChart and AreaChart are public; Pie/Donut remain deferred.

M02-T03 documents bounded margin estimates, greedy tick selection, single-line formatting failures, hidden-axis title suppression, horizontal Bar mappings, and independent value grids in [layout and axes](LAYOUT_AND_AXES.md). These engine policies are explicit; future decisions concern final renderer font/title styling and fitting, diagnostic presentation, local-time SSR strategy, and final renderer visual spacing.

M02-T04 documents independent missing-point runs, singleton retention, Area baseline closure, stable grouped Bar slots (80% groups/90% slots), and unclamped out-of-plot metadata in [geometry foundations](GEOMETRY_FOUNDATIONS.md). These are implemented internal calculation policies. Development Lead review remains for final visual spacing, clipping/marker presentation, diagnostic UI, performance budgets and future extreme-number support. M03-T01 now provides internal SVG plot clipping; public Line/Area production rendering is implemented.

M03-T01 adds the internal engine-based Line preview and actual SVG plot clipping.
Its local-time policy is an initial placeholder followed by client-timezone
geometry; responsive charts reuse per-container observation. Review its documented
conservative title omission, endpoint marker clipping, internal color tokens and
empty/unavailable presentation before promoting production behavior. M03-T02 must
validate tooltips, activation and point keyboard navigation before public LineChart,
and repeat genuine packaged-consumer verification when runtime exports change.
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
remain future design decisions. No M03-T04 implementation is included.

## M03-T04 public BarChart

BarChart now consumes existing grouped rectangle geometry in both orientations.
Physical formatter routing preserves semantic xKey categories; shared presentation
and corrected gesture handling also serve Line/Area. Item inspection is the Bar
default; visible rectangle intersections and in-plot zero targets determine
eligibility. Exact decorative extents, stable missing slots, source tables and
SSR policy are preserved. No public props, dependencies, core math changes or
subpaths are added. See [BarChart](BAR_CHART.md). M03-T05 remains deferred.
