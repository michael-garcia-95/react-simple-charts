# Architecture

## Approved direction

React Simple Charts is a single npm package, a TypeScript-first React component library supporting React 18.2+ and React 19.x. Rendering is SVG-first. Planned chart families are Line, Bar, Area, Pie, and Donut; none is implemented in this foundation task.

## Module responsibilities

- `src/charts/`: specialized chart renderers and family-specific orchestration.
- `src/core/`: shared chart infrastructure. Data normalization, scales, layout, and geometry must be pure calculations separated from React lifecycle and DOM access.
- `src/internal/`: implementation details unavailable through package subpaths.
- `src/styles/`: self-contained styling based on CSS variables. Future components must work without a mandatory external stylesheet.
- `src/types/`: shared TypeScript contracts.
- `src/index.ts`: the sole public barrel. It currently exports nothing; approved APIs will be explicitly named exports.
- `playground/`: a Vite React application, excluded from the npm package.
- `tests/`: foundation contract and accessible playground tests.
- `scripts/verify-package.mjs`: verifies built artifacts and probes runtime externalization using the real build configuration.

Directory README files preserve the intended structure in Git without prematurely creating abstractions.

## Build and dependencies

TypeScript uses strict checking, exact optional properties, unchecked indexed access protection, and bundler resolution. Type-only imports remain explicit through verbatim module syntax. A single no-emit configuration checks the current codebase; tsdown separately emits library declarations.

tsdown produces ESM and declarations from one entry. React and React DOM, including JSX and DOM client subpaths, stay external. They are peers for consumers and development dependencies for the playground/tests. d3-scale and d3-shape are the approved runtime math dependencies, installed now but unused until chart work. No animation runtime is included.

The package exposes only `.` with declaration and import conditions, and has no CommonJS output. A files allowlist excludes playground, tests, and source from packing. `sideEffects: false` is appropriate for the current empty entry; revisit it if future implementation introduces global effects or imported CSS.

## React and server rendering

The source barrel and tsdown banner preserve `"use client"` in built JavaScript. The banner also covers future shared output chunks. This prepares framework boundaries without introducing a component or DOM-dependent import. It does not prove SSR support.

Later approved tasks must implement dimension-aware SSR and deterministic initial markup. Pure calculations must not read browser globals. Explicit dimensions and responsive measurement policies, stable identifiers, and hydration tests remain future work. A client boundary is compatible with server prerendering in frameworks, but full SSR/hydration integration has not been tested here.

## Validation

Vitest tests the foundation playground with React Testing Library and the package safety contract in Node. The package verification script checks actual output, typechecks generated declarations, rejects internal subpath imports, and builds a disposable React import probe because an empty entry alone cannot demonstrate externalization. CI runs formatting, linting, typechecking, tests, artifact verification, playground build, and dry-run packing for both React generations on Node 22/24.
