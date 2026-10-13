# React Simple Charts v0.1.0

## First public release — October 13, 2026

React Simple Charts provides five SVG components for React and TypeScript:
**LineChart, AreaChart, BarChart, PieChart and DonutChart**. Map fields directly
from your records and inspect values with a pointer or keyboard.

- Typed mappings, single/multiple Cartesian series, category/numeric/UTC/local-time
  Line and Area scales, axes and grids, and grouped vertical/horizontal Bars.
- Source-ordered positive Pie/Donut segments and optional Donut center content.
- Responsive sizing or explicit dimensions, tooltips and data-activation callbacks.
- Named graphics, roving keyboard navigation, semantic source tables in every
  chart state and optional animation that respects reduced motion.
- ESM root named exports, TypeScript declarations, external React/DOM peers and
  a retained Next.js client boundary. Explicit dimensions support SVG SSR;
  responsive/local-time charts initially use stable placeholders and tables.

## Install

```sh
npm install @michael-garcia-95/react-simple-charts@0.1.0
```

Supply React and React DOM `^18.2.0 || ^19.0.0`.
[Package on npm](https://www.npmjs.com/package/@michael-garcia-95/react-simple-charts/v/0.1.0)
· [Live examples and documentation](https://michael-garcia-95.github.io/react-simple-charts/)
· [Chart guides](https://github.com/michael-garcia-95/react-simple-charts/tree/main/docs)

## Tested compatibility and limitations

Tested React/DOM versions are 18.2.0 and 19.3.0, with genuine installed-package
Vite and Next.js consumers (Next App/Pages Router with Webpack). Declarations
require TypeScript's `NoInfer`, introduced in 5.4; tested compilers are 5.4.5 and
6.0.3. Focused engine tests passed Chromium 156.0.8078.4, Firefox 157.0 and
Playwright WebKit 27.2. This does not verify every peer version, physical Safari/iOS,
other frameworks, Turbopack, strict CSP or older consumer Node versions.

Browser output targets ES2022 ESM and uses SVG, Pointer Events and focus APIs.
Responsive graphical mounting requires native ResizeObserver; otherwise
placeholders/source tables remain, with explicit dimensions as a graphical fallback.
Use UTC and deterministic formatting for predictable temporal SSR. CommonJS,
stacking, decimation and public pure-helper subpaths are not included. Large
SVG datasets and tiny pointer targets remain practical limitations.

Automated axe/accessibility-tree checks passed the focused suite; SVG text contrast
and an empty-table check were incomplete.

The owner reported **PASS / ALL PASSED** for the Windows assessment using
**NVDA 2026.2 with Firefox 157.0.1** on **October 12, 2026** (Trinidad and Tobago
local time). Coverage included all five chart components in both explicit and
responsive layouts. NVDA Focus Mode was required for chart keyboard navigation.

The [original assessment](https://github.com/michael-garcia-95/react-simple-charts/blob/21eef6fc6b52e9e3f9fd70f5e08c5eac648c583d/docs/M06_MANUAL_ACCESSIBILITY_RESULTS.md)
remains evidence for the original manually tested candidate archive, which is
distinct from the published npm 0.1.0 archive. The result is not reassigned to the
published archive, and no new manual assessment is claimed. This owner-reported
assessment is not an independently witnessed test, WCAG certification, a formal
audit or universal browser/screen-reader compatibility. Native forced colors/zoom
and physical mobile devices remain unverified. See the
[compatibility report](https://github.com/michael-garcia-95/react-simple-charts/blob/21eef6fc6b52e9e3f9fd70f5e08c5eac648c583d/docs/M06_DISTRIBUTION_COMPATIBILITY.md)
for exact configurations and evidence.

## Published identity and provenance

- Package: `@michael-garcia-95/react-simple-charts@0.1.0`; public, dist-tag `latest`.
- Exact published source: `21eef6fc6b52e9e3f9fd70f5e08c5eac648c583d`.
- Archive: 82,958 bytes.
- Archive SHA-256: `88c4d6319b1eb6c8567538e45766166a88ab2a6ec5cb7285e1bfb152bf346632`.

The owner reports successful publication and matching post-publication registry
version, dist-tag and downloaded archive digest. The three post-merge GitHub
Actions workflows were independently confirmed successful at the source above.
First publication followed the manual owner-controlled npm/2FA path and has no
automatic GitHub OIDC build provenance; these records are not an attestation.
