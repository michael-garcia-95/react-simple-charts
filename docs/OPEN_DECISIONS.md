# Open decisions

The MIT copyright-holder decision is finalized: the Development Lead approved Michael Garcia. `LICENSE` includes Copyright (c) 2026 Michael Garcia.

- Approve publication, final package name, initial version, and release process. Package remains private at version 0.0.0.
- RSC-026/RSC-027 public prop and data contracts are implemented in M01-T02; see [API type contracts](API_TYPE_CONTRACTS.md). Runtime scale semantics, normalization, invalid/missing-value policies, accessible naming, and interaction behavior remain to be implemented.
- M01-T03 proves explicit SVG SSR and responsive accessible placeholders with a 280px default, stable IDs, observer cleanup, and jsdom hydration. Final public dimension validation and framework/packaged-consumer integration remain open; see [rendering compatibility](RENDERING_COMPATIBILITY.md).
- M01-T03 proves self-contained inline styles and CSS variable fallbacks, visually hidden tables, and focus outlines. Final public token names, strict CSP support, host-style interactions, and production focus-visible behavior remain open.
- Decide whether pure helpers ever become public root exports or separate server-safe entries; no public internal subpaths exist now.
- Choose a broader browser support policy and document it when components exist. Current JS target is ES2022.
- React 18/19 type-definition coverage is added for M01-T02; M01-T03 adds internal SSR, hydration, lifecycle, accessibility, and styling tests to the existing matrix. Future public runtime components still need consumer integration and interaction testing, real screen-reader review, and cross-browser validation.

M01-T03 stops at an internal rendering proof. Do not begin M01-T04 or production chart implementation without approval.
