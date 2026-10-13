# Changelog

Human-readable changes following [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).
Versioning follows Semantic Versioning. Historical preparation and verification
records are linked from the [post-publication record](docs/M06_POST_PUBLICATION.md).

## Unreleased

No unreleased library changes are recorded.

## 0.1.0 — 2026-10-13

First public npm release of `@michael-garcia-95/react-simple-charts`, published
under `latest`. Published source: `21eef6fc6b52e9e3f9fd70f5e08c5eac648c583d`.

### Added

- Five TypeScript-first SVG component exports: LineChart, AreaChart, BarChart,
  PieChart and DonutChart. Root named ESM exports and public types retain the
  client boundary, with external React/DOM peers and d3 math dependencies.
- Typed field mappings, single/multiple Cartesian series, category/linear/UTC/
  local-time X for Line/Area, axes/grids and grouped vertical/horizontal bars.
  Pure normalization, scale, layout and geometry layers retain source provenance,
  duplicates and independent missing-value gaps; Area fills use a zero baseline.
- Source-ordered positive Pie/Donut slices; invalid/missing/zero rows remain in
  source tables, and finite negatives reject the whole polar chart. Donut offers
  inner-radius ratio and custom center content, with default ratio 0.6.
- Keyboard roving navigation, pointer/touch inspection, tooltips and source-aware
  activation callbacks with compatibility-click deduplication. Semantic source
  tables and named SVG groups are present across chart states; optional opacity
  animation respects reduced motion.
- Explicit-dimension SSR, responsive per-container measurement and stable initial
  placeholders/tables for responsive and local-time modes; Strict Mode cleanup and
  independent-root hydration checks.
- Declarations and retained public-source maps, real-tarball inventory/API checks,
  strict type tests and genuine installed Vite/Next fixtures. Focused Chromium,
  Firefox and WebKit CI verifies the installed production fixture.
- Chart guides, interactive website examples and documented limitations.

### Evidence and limitations

See [public exports](src/index.ts), [contracts](src/types/contracts.ts),
[architecture](docs/ARCHITECTURE.md), [five-family integration](docs/M04_INTEGRATION_HARDENING.md),
[distribution/consumer/browser results](docs/M06_DISTRIBUTION_COMPATIBILITY.md),
[package verifier](scripts/verify-package.mjs) and
[current decisions](docs/OPEN_DECISIONS.md). These preserve implementation and verification evidence; they do not establish
adoption or production usage.

Verified React/DOM versions are 18.2.0 and 19.3.0; tested TypeScript versions are
5.4.5 and 6.0.3. Browser evidence is focused on exact recorded builds, including
CI Chromium 156.0.8078.4, Firefox 157.0 and Playwright WebKit 27.2. Physical devices,
other browser configurations, strict CSP and broader framework support remain
unverified. Owner-performed manual NVDA testing passed for the artifact recorded in
M06_MANUAL_ACCESSIBILITY_RESULTS, not a new assessment of the published archive. Automated checks
do not establish announcements or WCAG certification. No stacking,
decimation, CommonJS or public pure-helper entry is included.
