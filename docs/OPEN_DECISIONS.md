# Open decisions

The MIT copyright-holder decision is finalized: the Development Lead approved Michael Garcia. `LICENSE` includes Copyright (c) 2026 Michael Garcia.

- Approve publication, final package name, initial version, and release process. Package remains private at version 0.0.0.
- RSC-026/RSC-027 public prop and data contracts are implemented in M01-T02; see [API type contracts](API_TYPE_CONTRACTS.md). M02-T01 implements internal normalization and classification; see [data normalization](DATA_NORMALIZATION.md). Rendering policies for gaps, invalid categories, negative segments, and zero-total geometry, plus accessible naming and interaction behavior remain deferred. M02-T02 implements internal domain/scale/tick policies; see [scales and domains](SCALES_AND_DOMAINS.md).
- M01-T03 proves explicit SVG SSR and responsive accessible placeholders with a 280px default, stable IDs, observer cleanup, and jsdom hydration. M01-T04 completes packaged Vite/Next consumer verification using a temporary probe; final public dimension validation remains open; see [rendering compatibility](RENDERING_COMPATIBILITY.md).
- M01-T03 proves self-contained inline styles and CSS variable fallbacks, visually hidden tables, and focus outlines. Final public token names, strict CSP support, host-style interactions, and production focus-visible behavior remain open.
- Decide user-facing presentation of scale diagnostics/empty states, local-time SSR timezone consistency, category band padding, and whether safe rescaling should eventually support numerical spans that overflow D3 arithmetic. The M02-T02 rules for duplicate category identity, valid-X value eligibility, zero baselines, bounds, and constant/fallback domains are documented implementation choices, not unresolved engine behavior.
- Decide whether pure helpers ever become public root exports or separate server-safe entries; no public internal subpaths exist now.
- Choose a broader browser support policy and document it when components exist. Current JS target is ES2022.
- React 18/19 type-definition coverage is added for M01-T02; M01-T03 adds internal SSR, hydration, lifecycle, accessibility, and styling tests to the existing matrix. Future public runtime components still need consumer integration and interaction testing, real screen-reader review, and cross-browser validation.

Milestone 01 and M02-T01 through M02-T03 are implemented. Normalization, scales, and layout remain internal. M02-T04 and production chart implementation have not begun. The public library still has no implemented chart components.

M02-T03 documents bounded margin estimates, greedy tick selection, single-line formatting failures, hidden-axis title suppression, horizontal Bar mappings, and independent value grids in [layout and axes](LAYOUT_AND_AXES.md). These engine policies are explicit; future decisions concern final renderer font/title styling and fitting, diagnostic presentation, local-time SSR strategy, and grouped/category geometry spacing.
