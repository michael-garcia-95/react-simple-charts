# Open decisions

The MIT copyright-holder decision is finalized: the Development Lead approved Michael Garcia. `LICENSE` includes Copyright (c) 2026 Michael Garcia.

- Approve publication, final package name, initial version, and release process. Package remains private at version 0.0.0.
- Define chart props, data contracts, scale semantics, accessibility behavior, and named exports in later approved tasks.
- Define explicit/responsive dimensions, SSR fallback sizing, stable IDs, and hydration integration tests. The preserved client directive is preparation only.
- Define component CSS variable names and styling delivery without a mandatory stylesheet. Current CSS is playground-only.
- Decide whether pure helpers ever become public root exports or separate server-safe entries; no public internal subpaths exist now.
- Choose a broader browser support policy and document it when components exist. Current JS target is ES2022.
- Add React 19 type-definition coverage when public components exist. Current React 18 types enforce the older supported API baseline; CI exercises both runtimes.

M01-T01 stops at tooling and repository foundation. Do not begin M01-T02 or chart implementation without approval.
