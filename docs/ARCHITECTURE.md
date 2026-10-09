# Architecture

## Approved direction

React Simple Charts is a single npm package, a TypeScript-first React component library supporting React 18.2+ and React 19.x. Rendering is SVG-first. Planned chart families are Line, Bar, Area, Pie, and Donut; none is implemented in this foundation task.

## Module responsibilities

- `src/charts/`: specialized chart renderers and family-specific orchestration.
- `src/core/`: shared chart infrastructure. Data normalization, scales, layout, and geometry must be pure calculations separated from React lifecycle and DOM access.
- `src/internal/`: implementation details unavailable through package subpaths.
- `src/styles/`: self-contained styling based on CSS variables. Future components must work without a mandatory external stylesheet.
- `src/types/`: shared TypeScript contracts. `contracts.ts` contains focused chart-family unions and shared data, axis, tooltip, activation, and accessibility types. See [API type contracts](API_TYPE_CONTRACTS.md).
- `src/index.ts`: the sole public barrel. It exports approved M01-T02 contracts using type-only named exports; no runtime chart components exist.
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

M01-T03 validates dimension-aware SSR in an internal rendering fixture. Positive finite numeric dimensions produce complete SVG; unknown responsive widths produce a stable accessible 280px-height placeholder until a per-container ResizeObserver reports a valid width. Pure layout calculations do not read browser globals. Node SSR and jsdom hydration tests cover deterministic initial markup, useId references, Strict Mode, observer cleanup, and multiple instances. Headless Chromium verifies responsive layout, focus, accessible table exposure, and self-contained inline/CSS-variable styling. See [rendering compatibility](RENDERING_COMPATIBILITY.md) for evidence and limitations. Framework and packaged-consumer integration remain M01-T04 work.

## Validation

Vitest tests the foundation playground with React Testing Library and the package safety contract in Node. The package verification script checks actual output, typechecks generated declarations, rejects internal subpath imports, and builds a disposable React import probe because an empty entry alone cannot demonstrate externalization. CI runs formatting, linting, typechecking, tests, artifact verification, playground build, and dry-run packing for both React generations on Node 22/24.

## Public contract milestone

M01-T02 implements RSC-026/RSC-027 as types, with data-driven generic inference, exclusive single/multi-series mappings, scale-specific keys, and physical-axis typing for horizontal Bars. Compile-time tests use test-only generic declarations; they are not chart implementations. Dedicated source tests and package-root consumer verification exercise both JSX and props objects. React 18/19 type definitions now accompany the runtime CI matrix. All rendering, normalization, validation, interaction, and accessibility behavior remains deferred.
