# Packaged public BarChart — M03-T04

The genuine private 0.0.0 tarball now exports exactly AreaChart, BarChart and
LineChart. The final freshly packed archive passed all four consumer combinations:

| Framework             | React / DOM | TypeScript | Installed package types | Production / Chromium |
| --------------------- | ----------- | ---------- | ----------------------- | --------------------- |
| Vite 8.3.4            | 18.2.0      | 6.0.3      | Pass                    | Pass                  |
| Vite 8.3.4            | 19.3.0      | 6.0.3      | Pass                    | Pass                  |
| Next 14.2.35          | 18.2.0      | 5.4.5      | Pass                    | Pass                  |
| Next 16.4.0 (Webpack) | 19.3.0      | 6.0.3      | Pass                    | Pass                  |

Execution: Node 24.19.0, npm 11.9.0, Chromium 151.0.7922.173,
Playwright Core 1.64.0, axe 4.13.0. React 18 definitions remain 18.3.31 / DOM
18.3.7; React 19 definitions are 19.3.0 / DOM 19.3.0. Next 14 uses Node types
20.19.0; the other consumers use 24.19.1. Installed package compilation retains
skipLibCheck=false; Next application checking retains its established framework
setting. Turbopack was not tested.

Existing genuine Line/Area scenarios remain. Bar adds both orientations, grouped
signed values, duplicate categories, stable missing slots, zero observations,
clipping, default item and explicit shared inspection, keyboard/pointer/native
touch/accessibility-click activation, and parent rerender deduplication. Responsive
Bar shrinks after native measurement; horizontal explicit SSR and responsive
initial markup match hydration. Both Next App/Pages routes render all families.
All 18 source tables remain available; IDs are unique and relationships resolve.
All four focused axe runs report zero violations with no console/page/hydration
errors. Fresh consumer installations compare installed ESM bytes to the current
archive, compile actual Bar generic JSX, check root-only exports and deduplicated
React peers. No temporary package, alias or source import is used.

Source validation passes 649 tests, 106 above the required 543-test baseline.
All 106 focused Bar rendering, interaction (both orientations), SSR and hydration
tests also pass separately. The Node 22/24 × React 18.2/19 remote CI matrix remains
unchanged; its new feature-commit results could not be verified because GitHub
reports the configured token as invalid. Local framework tests do not replace CI.

| Genuine library artifact |  Bytes |
| ------------------------ | -----: |
| Tarball (six files)      | 62,379 |
| ESM                      | 76,896 |
| ESM gzip                 | 18,491 |

| Complete application JS |     Bytes | Sum of per-file gzip bytes |
| ----------------------- | --------: | -------------------------: |
| Vite / React 18.2       |   227,555 |                     73,875 |
| Vite / React 19         |   307,113 |                     96,645 |
| Next 14                 |   847,096 |                    265,647 |
| Next 16                 | 1,094,314 |                    341,695 |

Application totals include React/framework and fixture routes/chunks; they are
not isolated library transfer sizes. Reproduce with
`node scripts/verify-consumers.mjs`, using its writable work npm cache.
Results and consumer screenshots remain in ignored `work/consumers/`; playground
captures are in `work/visual/`. Actual visual inspection covered positive/negative
direction, mixed zero baselines, duplicate categories, grouped missing slots,
dense narrow bars, clipping, and zero focus/tooltip placement. Automated DOM
assertions separately verify extents and interaction outcomes.

Known inherited build warnings concern Rolldown client directives and Next 14's
outputFileTracingRoot option; actual built boundaries/manifests and browser tests
pass. No WCAG certification, screen-reader, Firefox/WebKit, forced-color, zoom or
strict CSP coverage is claimed. See [BarChart limitations](BAR_CHART.md).
No publication, deployment, merge or M03-T05 work is included.

The following sections retain historical M03-T03 and earlier evidence.

# Packaged public LineChart and AreaChart — M03-T03

The genuine private 0.0.0 tarball exports exactly AreaChart and LineChart, checked
with sorted runtime names. Every consumer deletes its generated installation and
lockfile, installs the actual npm archive, and checks installed ESM bytes against
the packed build. No aliases, workspace links, temporary exports or source imports
are used. Installed declarations compile actual generic AreaChart JSX. The built
entry retains `use client`; React/React DOM remain external peers. Root-only export
policy and private version remain unchanged.

## M03-T03 verified versions and results

| Consumer | React / React DOM | Framework                | Strict package types | Production/browser |
| -------- | ----------------- | ------------------------ | -------------------- | ------------------ |
| Vite 18  | 18.2.0            | Vite 8.3.4               | Pass                 | Pass               |
| Vite 19  | 19.3.0            | Vite 8.3.4               | Pass                 | Pass               |
| Next 14  | 18.2.0            | Next.js 14.2.35          | Pass                 | Pass               |
| Next 16  | 19.3.0            | Next.js 16.4.0 (Webpack) | Pass                 | Pass               |

Node 24.19.0, npm 11.9.0, Chromium 151.0.7922.173, Playwright Core 1.64.0 and axe
4.13.0 were used. Vite/Next 16 use TypeScript 6.0.3 and Node types 24.19.1;
Next 14 retains approved TypeScript 5.4.5 and Node types 20.19.0. React 18 types
are 18.3.31 / DOM 18.3.7; React 19 types are 19.3.0 / DOM 19.3.0. Next dependency
checking retains the framework-standard skipLibCheck setting, while the independent
installed-package compilation uses false. Turbopack was not tested.

Existing Line scenarios remain. Area adds positive, negative, mixed clipped,
independent series/gaps/singleton, responsive and local-time examples. Both families
run keyboard, mouse, native touch, standalone accessibility click and exactly-once
synthetic-click checks. Real SVG assertions verify fill opacity, no closed polygon
stroke, separate data boundary, clipping, gap counts and positive/negative direction.
All 12 source tables remain available. Unique IDs and naming relationships pass.
Both Next App/Pages routes render installed-root charts; App Router server imports
retain genuine client references. Explicit Area SVG matches initial hydration;
responsive initial markup matches its SSR placeholder and local time starts pending.
Vite hydrates separate prefixed roots containing one Line and one Area, measures
responsive containers and verifies observer cleanup. All four focused axe runs
have zero violations; no console, page or hydration errors occurred.

Source validation passes 543 tests, 73 above the 470-test merged baseline. The
13 Area presentation tests passed separately; shared point/SSR/hydration suites
run both families. Core tests also validate the internal outlinePath extension.
The Node 22/24 × React 18.2/19 GitHub CI matrix is unchanged. Local heavyweight
consumer results above are independent of remote CI.

## Artifacts and reproduction

```sh
npm ci
RSC_BROWSER_PATH=/usr/bin/chromium node scripts/verify-consumers.mjs
```

The writable cache is `work/consumers/npm-cache`. Results, server/hydrated/measured
HTML, accessibility snapshots and full Chromium screenshots live in ignored
`work/consumers/`. Screenshots show visible restrained fills, negative direction,
independent gaps, singleton markers and clipping. Separate playground screenshots
cover Area examples plus keyboard focus and tooltip placement.

| Genuine package     |  Bytes |
| ------------------- | -----: |
| Tarball (six files) | 60,062 |
| ESM                 | 73,727 |
| ESM gzip            | 17,786 |

| Consumer all JS assets |     Bytes | Sum of per-file gzip bytes |
| ---------------------- | --------: | -------------------------: |
| Vite / React 18.2      |   224,760 |                     73,256 |
| Vite / React 19        |   304,314 |                     96,002 |
| Next 14                |   842,231 |                    264,594 |
| Next 16                | 1,089,532 |                    340,620 |

Application totals include React/framework and all fixture routes/chunks; they are
not isolated library transfer sizes. Existing Rolldown directive warnings remain,
but artifact and Next client-manifest checks verify the boundary. Next 14 warns
about its inherited outputFileTracingRoot option; production/browser checks pass.

Chromium/axe does not establish WCAG certification, screen-reader or Firefox/WebKit
coverage. Custom tooltip dimensions, host styles/CSP, overlapped points and large
SVG datasets retain the documented public limitations. No package publication,
deployment or M03-T04 work is included.

The following sections retain historical M03-T02/M01 evidence and are not the
M03-T03 package measurements.

# Historical packaged public LineChart consumers — M03-T02

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
