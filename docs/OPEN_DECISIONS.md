# Open decisions

The MIT copyright-holder decision is finalized: the Development Lead approved Michael Garcia. `LICENSE` includes Copyright (c) 2026 Michael Garcia.

- Approve publication, final package name, initial version, and release process. Package remains private at version 0.0.0.
- RSC-026/RSC-027 public prop and data contracts are implemented in M01-T02; see [API type contracts](API_TYPE_CONTRACTS.md). Runtime scale semantics, normalization, invalid/missing-value policies, accessible naming, and interaction behavior remain to be implemented.
- Define explicit/responsive dimensions, SSR fallback sizing, stable IDs, and hydration integration tests. The preserved client directive is preparation only.
- Define component CSS variable names and styling delivery without a mandatory stylesheet. Current CSS is playground-only.
- Decide whether pure helpers ever become public root exports or separate server-safe entries; no public internal subpaths exist now.
- Choose a broader browser support policy and document it when components exist. Current JS target is ES2022.
- React 18/19 type-definition coverage is added for M01-T02. Future runtime components still need SSR, hydration, interaction, and accessibility testing.

M01-T02 stops at public TypeScript contracts. Do not begin M01-T03, rendering, or runtime normalization without approval.
