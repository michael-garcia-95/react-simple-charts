# Packaged public LineChart consumers — M03-T02

The genuine private `react-simple-charts@0.0.0` tarball now exports LineChart.
The consumer runner packs the actual repository and independently installs the
archive in Vite/Next applications. There are no source aliases, workspace links,
modified roots or temporary rendering exports. Root runtime is exactly LineChart;
source/dist/internal subpaths remain blocked. The full contract suite imports the
real component and verifies generic inference through installed declarations.

## Tested versions

| Consumer | React / React DOM | Framework       | React / DOM types | TypeScript | Node types |
| -------- | ----------------- | --------------- | ----------------- | ---------- | ---------- |
| Vite 18  | 18.2.0            | Vite 8.3.4      | 18.3.31 / 18.3.7  | 6.0.3      | 24.19.1    |
| Vite 19  | 19.3.0            | Vite 8.3.4      | 19.3.0 / 19.3.0   | 6.0.3      | 24.19.1    |
| Next 14  | 18.2.0            | Next.js 14.2.35 | 18.3.31 / 18.3.7  | 5.4.5      | 20.19.0    |
| Next 16  | 19.3.0            | Next.js 16.4.0  | 19.3.0 / 19.3.0   | 6.0.3      | 24.19.1    |

Execution uses Node 24.19.0, npm 11.9.0, tsdown 0.23.0, Playwright Core 1.64.0,
axe Playwright 4.13.0, and real Chromium 151.0.7922.173. All selected npm
framework/runtime versions are stable releases. Next controls its own vendored
App Router React implementation; the consumer's installed React peer version is
not a promise about every framework-internal renderer. Node 22 remains covered
by the unchanged foundation CI matrix, not by these local framework executions.

Next 14 initially failed with TypeScript 6/Node 24 definitions: its compiled
`Headers` adapter returns `IterableIterator`, whereas modern DOM headers expect
an iterator with `Symbol.dispose`. The selected older compiler/type combination
avoids that error. A second attempt exposed Next 14's App/Pages navigation
augmentation exported-overload conflict when all framework declarations were
checked. The Next application uses the framework's usual `skipLibCheck: true`;
a separate `tsconfig.package.json` includes only the contract suite and Sample
consumer, sets `skipLibCheck: false`, and checks the installed library declarations.
No library contract was changed, no SSR disabled, and no broad type assertion was
used to suppress a package defect. Compatibility with Next 14's entire declaration
surface under strict dependency checking remains a framework gap.

## Public runtime checks

Next App Router Server Components directly import the installed LineChart without
a local client wrapper; client-reference manifests identify the genuine package.
Pages Router also renders it. Explicit category charts render complete SVG and
source tables with JavaScript disabled. Responsive charts retain the measurement
placeholder until gated native ResizeObserver delivery; initial hydrated explicit
SVG and responsive section markup match server DOM. Local time starts with its
safe server placeholder and renders with client timezone after hydration.

Vite validates public root rendering, measured responsive and independent widths,
shrinking viewport updates, observer cleanup, and separately prefixed SSR roots
hydrated in real Chromium. All applications compile installed package declarations
with strict dependency checking, build production assets, reject internal imports,
and report deduplicated React peers. No external stylesheet is needed.

Browser checks cover one roving point Tab entry, End/Arrow navigation, tooltip
inspection/Escape, keyboard and pointer activation, real touch selection and
exactly-once activation (including synthetic click suppression), and dismissal.
All title/description references resolve, IDs are unique, semantic source tables
remain accessible, and CSS variables resolve. Axe analyzes main and requires zero
violations. Console, page and hydration errors fail the suite. Public source tests
add motion, datum-reference, formatter-failure, missing-value and state-transition
coverage that the browser suite does not replace.

## Reproduction and evidence

```sh
npm ci
RSC_BROWSER_PATH=/usr/bin/chromium node scripts/verify-consumers.mjs
```

The script provisions Playwright Core 1.64.0 and axe 4.13.0 in ignored work,
uses a writable `work/consumers/npm-cache`, builds independent pinned consumers,
serves ports 4318/4319 and closes servers/browser. Native observer callbacks are
gated only to inspect pre-measurement hydration; measurements stay native.
Next 16 uses `--webpack`; Turbopack is not tested. Next dependency declarations use
framework-standard skipLibCheck; a separate package compilation keeps it false.

`work/consumers/results.json` records exact versions, completed checks and package
sizes. Each consumer's evidence folder contains server/hydrated/measured HTML,
accessibility snapshot, screenshot, and relevant bundle source/client manifests.
Vite asset totals include React and both test pages; Next totals include both
routers and framework/fallback chunks. These application totals are not isolated
library contributions. The genuine ESM now includes approved D3 engine code and
external React imports. No development React or global CSS is bundled.

## Limits

This heavyweight suite stays separate from unchanged Node 22/24 × React 18/19 CI.
Real Chromium checks and axe do not establish WCAG conformance or screen-reader,
Firefox/WebKit, forced-colors, browser-zoom, strict CSP, or arbitrary host-style
compatibility. Custom tooltip content and large datasets have the limits in
[LineChart](LINE_CHART.md). Transitive dependency resolution may vary on future
runs despite pinned direct versions. Existing Rolldown directive warnings remain;
actual artifact and Next manifest checks establish the client boundary.

## M03-T02 verified outcomes

All four genuine public consumers passed installed-root/type checks, production
builds, native browser interactions, accessibility checks and ID validation.
Both Next App/Pages routes passed; App Router explicit/responsive SSR initial
hydration comparisons passed. Local-time SSR remained a placeholder. Both Vite
consumers passed separate-root hydration and observer cleanup. Real Chromium
151.0.7922.173 recorded zero axe violations and no console/page/hydration errors.
Every installed ESM file matched the packed build bytes.

| Genuine public package |  Bytes |
| ---------------------- | -----: |
| Tarball (six files)    | 57,480 |
| ESM                    | 68,867 |
| ESM gzip               | 17,003 |

| Consumer (all JS assets) |     Bytes | Sum of per-file gzip bytes |
| ------------------------ | --------: | -------------------------: |
| Vite / React 18.2.0      |   220,932 |                     72,421 |
| Vite / React 19.3.0      |   300,481 |                     95,158 |
| Next 14.2.35             |   835,414 |                    263,041 |
| Next 16.4.0              | 1,083,046 |                    339,136 |

The source suite passed 451 tests (417 baseline plus 34 new public tests).
Typecheck, public type tests, lint, formatting, package verification, playground
build, dry-run packing with writable cache, and diff checks passed on Node
24.19.0 / React 19.3.0. The focused public suite passed all 34 tests separately.

Repeated same-version consumer runs now delete generated application installations
and lockfiles before installing, then compare installed ESM bytes to the packed
build. This prevents stale `0.0.0` archives from masquerading as current tests.
Strict Vite ports prevent verification against another running server. Real touch
checks exposed fractional endpoint clipping and delayed synthetic-click focus;
unclipped point controls and tracked pointer focus intent fixed both, with source
regression tests. Earlier failed checks were rerun and are not reported as passes.
The default npm cache was unwritable; dry-run packing passed with the documented
writable task cache. Browser source and consumer artifacts remain in ignored work.

## Historical M01-T04 evidence

The earlier contracts-only/probe measurements below are retained as historical
evidence. They concern a temporary RenderingProbe archive and cannot be used as
public LineChart runtime results. M03-T02 has removed that archive from the runner.

## Local outcomes

All four consumers passed installation, installed-root ESM/export checks,
full public contract compilation, production build, and Chromium smoke checks.
Both Next App and Pages routes passed; App routes additionally passed initial
SSR/hydration structural comparisons. Both Vite consumers passed two-root
hydration and observer unmount cleanup. Focused axe returned zero violations in
each main page. No console errors, page errors, unresolved ID references, duplicate
IDs, hydration errors, or duplicate-instance failures occurred in the final run.
Both complete Vite app typechecks also passed.

| Package                   | npm tarball |   ESM | ESM gzip |
| ------------------------- | ----------: | ----: | -------: |
| Genuine contracts-only    |       4,633 |    28 |       37 |
| Temporary rendering probe |       8,765 | 6,995 |    2,346 |

| Consumer (all static JS assets) |   Bytes | Sum of per-file gzip bytes |
| ------------------------------- | ------: | -------------------------: |
| Vite / React 18                 | 145,556 |                     47,384 |
| Vite / React 19                 | 225,038 |                     70,222 |
| Next 14                         | 682,434 |                    211,797 |
| Next 16                         | 932,342 |                    288,461 |

The genuine archive has five files (LICENSE, README, package.json, index.js,
index.d.ts); the test archive has six (adding index.js.map). Package sizes were
measured with this task's updated README. Next totals include both routers and
all emitted framework chunks, including build-generated fallback routes; they
are not transfer sizes for a single page. No isolated consumer-bundle contribution
measurement was made. Neither package measurement estimates final chart size.

The client-reference manifests for both Next versions name the installed
`node_modules/rsc-rendering-test-only/dist/index.js` as a client module.
Next 14's entry CSS lists are empty; neither fixture supplies a stylesheet.
Vite sourcemaps identify one installed React family per consumer and the installed
probe. Framework-owned server/browser React modules are expected in Next; the
package adds no bundled React and npm shows deduplicated peer instances.
