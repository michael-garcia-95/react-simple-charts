# Changelog

Human-readable changes following [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).
Versioning conventions are [approved for planning](docs/RELEASE_POLICY.md). **No npm release is recorded here.** The separate candidate branch prepares `0.1.0` / `private: false`; main remains unchanged and the candidate is unpublished and undated.

## Unreleased

### Added

- Authorized local 0.1.0 candidate preparation, explicit candidate CI selection,
  lockfile consistency checks and read-only candidate readiness (M06-T06B3).
  No publication, distribution, deployment or merge approval is granted.
- Explicit development/future-candidate verification policies and read-only release
  preparation assessment (M06-T06B2 historical scope). That task left version/private
  state unchanged; T06B3 now authorizes local preparation only.
- Proposed release/maintenance policy and this draft initial changelog (M06-T05).
  Documentation only; version, security setup and publication are not approved.

## 0.1.0 — Unpublished candidate

This candidate summarizes already implemented capabilities at baseline
`a3a03ef32767bf333fbb54bfd9596587fe702bf0`; it is not a published version or final release approval. Local candidate preparation
is authorized only on the feature branch; no release date has been assigned.

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
[current decisions](docs/OPEN_DECISIONS.md). These describe implemented behavior,
not adoption, production usage or registry publication.

Verified React/DOM versions are 18.2.0 and 19.3.0; tested TypeScript versions are
5.4.5 and 6.0.3. Browser evidence is focused on exact recorded builds, including
CI Chromium 156.0.8078.4, Firefox 157.0 and Playwright WebKit 27.2. Physical devices,
other browser configurations, strict CSP and broader framework support remain
unverified. Manual NVDA and human accessibility review remain pending; automated
checks do not establish announcements or WCAG certification. No stacking,
decimation, CommonJS or public pure-helper entry is included.
