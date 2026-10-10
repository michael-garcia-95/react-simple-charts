# Five-family packaged integration — M04-T04

The four genuine installed-tarball consumers were rerun for M04-T04 with all
five runtime exports and unchanged strict declarations. Cartesian focused entry
is now also checked during hover in every consumer, alongside the existing
polar check. Vite 8.3.4 with React 18.2.0/19.3.0 and Next 14.2.35/16.4.0 Webpack
with their corresponding React versions passed production, SSR/hydration,
App/Pages Router, real-browser interactions and representative axe scans.
See [M04 integration evidence](M04_INTEGRATION_HARDENING.md) for current
measurements and limits. Reports below preserve their historical milestone results.

# Packaged public DonutChart — M04-T03

The genuine private 0.0.0 tarball now exposes exactly LineChart, AreaChart,
BarChart, PieChart and DonutChart. The public Donut interface and all approved type
exports remain unchanged. No runtime dependency or subpath is added. Fresh actual
archives are independently installed, and installed ESM bytes are compared to
the packed build; no source aliases or workspace links substitute for the package.

| Consumer            | React / DOM | Strict package types | Production / Chromium | Axe          |
| ------------------- | ----------- | -------------------- | --------------------- | ------------ |
| Vite 8.3.4          | 18.2.0      | Pass                 | Pass                  | 0 violations |
| Vite 8.3.4          | 19.3.0      | Pass                 | Pass                  | 0 violations |
| Next 14.2.35        | 18.2.0      | Pass                 | App and Pages pass    | 0 violations |
| Next 16.4.0 Webpack | 19.3.0      | Pass                 | App and Pages pass    | 0 violations |

Executed versions: Node 24.19.0, npm 11.9.0, Chromium 151.0.7922.173,
Playwright Core 1.64.0 and axe Playwright 4.13.0. TypeScript is 6.0.3 except
Next 14 (5.4.5). React 18 types are 18.3.31 / DOM 18.3.7; React 19 types are
19.3.0 / DOM 19.3.0. Node types are 24.19.1 except Next 14 (20.19.0).
Next uses its standard skipLibCheck for application dependencies; the separate
installed-package declaration compilation keeps skipLibCheck=false. No library
contract is weakened to hide framework declaration conflicts.

The runner preserves all Line/Area/Bar/Pie scenarios. New Donut cases include
true full rings, default/custom ratios, visible/hidden complete tables, zero/missing
rows, negative unavailable states, numeric-zero/static/interactive center content,
explicit SSR and responsive hydration. Both Next App and Pages routes use the
actual installed package; App Router server code references the genuine Donut
client export. Main fixtures contain 31 tables. Vite adds two Donut hydration
roots, bringing the separate prefixed Strict Mode roots to seven across all five
families. Initial server/client DOM matches before native responsive measurement;
IDs and description relationships are unique and resolved.

Browser assertions cover ring keyboard, mouse and native touch activation,
compatibility-click deduplication, standalone accessibility clicks, hover/focus
roving entry, actual center bounds, resize alignment, center-button keyboard order
and nonactivation, and empty-hole clicks. Console/page/hydration errors fail the
suite; none occurred. Four representative main-page axe scans reported zero
violations. These are executed Chromium checks, not full WCAG certification.

Source validation retains all 810 baseline tests plus 120 new Donut tests:
**930 passing tests across 44 files**. All 120 Donut tests also pass separately.
The existing 89 Pie tests run unchanged. Typecheck, public type contracts, lint,
formatting, package verification, playground build, dry-run pack and diff checks
pass locally. The Node 22/24 × React 18.2/19 GitHub matrix is a separate final-HEAD
review gate; local results do not establish its outcome.

| Genuine artifact    |   Bytes |
| ------------------- | ------: |
| Tarball (six files) |  80,124 |
| ESM                 | 106,242 |
| ESM gzip            |  23,451 |

The real-playground `node scripts/verify-donut.mjs` audit separately checks
320/480/1200px layouts, ordinary/full-ring/custom-ratio/duplicate/excluded/negative/
empty/narrow/non-square/tiny-hole/paired/all-five examples. Actual browser bounds
establish center alignment and containment after resizing and CSS shrinking;
ring hit tests and empty-center clicks establish hole nonactivation. It also
executes native Chromium touch, synthetic pen, keyboard and standalone
assistive-style clicks, and center-button Tab/Shift+Tab navigation. Three focused
axe scans report zero violations; console/page errors are absent. Captured
screenshots were inspected for shapes, empty holes, center placement, button
exposure, thin-ring label omission, visible ring labels at ratio 0.4, wrapping,
focus, tooltip, negative state and matched Pie/Donut shares.

Evidence and npm cache remain ignored under `work/consumers/` and
`work/visual/donut/`; generated screenshots are excluded from the package.
Reproduce with `node scripts/verify-consumers.mjs`, then a running Vite playground
and `node scripts/verify-donut.mjs`. Optional RSC_BROWSER_PATH selects Chromium;
RSC_SMOKE_URL selects the audit's playground URL.

Accepted limitations: conservative estimated label fitting, difficult tiny-slice
pointer targets, approximate tooltip vertical placement, clipped oversized center
content, host CSS/CSP interactions and large SVG DOM cost. No manual screen-reader,
physical-device, Firefox/WebKit, Turbopack or full WCAG coverage is claimed.
Existing Rolldown client-directive and Next 14 configuration warnings remain;
actual emitted boundaries, builds and browser checks pass. No publication,
deployment, release, merge or M04-T04 work is included.

The following sections preserve historical evidence.

# Packaged public PieChart — M04-T02

The genuine private 0.0.0 tarball exports exactly LineChart, AreaChart, BarChart
and PieChart. As of M04-T02, DonutChart remained type-only. Fresh independent installations compare
packed ESM bytes, compile installed declarations and actual generic Pie JSX,
reject unauthorized subpaths, verify external/deduplicated React peers, and build
production applications. Existing Line/Area/Bar scenarios remain intact.

| Consumer            | React / DOM | Installed strict types | Production / Chromium | Axe          |
| ------------------- | ----------- | ---------------------- | --------------------- | ------------ |
| Vite 8.3.4          | 18.2.0      | Pass                   | Pass                  | 0 violations |
| Vite 8.3.4          | 19.3.0      | Pass                   | Pass                  | 0 violations |
| Next 14.2.35        | 18.2.0      | Pass                   | App and Pages pass    | 0 violations |
| Next 16.4.0 Webpack | 19.3.0      | Pass                   | App and Pages pass    | 0 violations |

Executed with Node 24.19.0, npm 11.9.0, Chromium 151.0.7922.173,
Playwright Core 1.64.0 and axe 4.13.0. TypeScript 6.0.3 is used except Next 14
(5.4.5). React 18 definitions are 18.3.31 / DOM 18.3.7; React 19 definitions are
19.3.0 / DOM 19.3.0. Node definitions are 24.19.1 except Next 14 (20.19.0).
These are executed versions, not blanket framework/browser compatibility claims.

Pie scenarios add explicit SVG SSR, full circle, duplicate labels, zero/missing
source rows, negative unavailable presentation, optional labels, complete tables,
responsive shrinking, focus/tooltip inspection, keyboard and pointer activation,
real Chromium touchscreen taps, compatibility-click deduplication and standalone
accessibility clicks. Hover retains the Tab entry on an already focused sector.
The main fixtures retain 26 source tables. Vite adds two Pie roots alongside the
three existing Cartesian roots, with distinct matching identifierPrefix values;
responsive initial markup matches before native measurement. All browser runs
fail on console/page/hydration errors; none occurred. Next's manifest registers
client modules using a namespace `*`; the compiled App Router server page proves
the actual named Pie reference (`dist/index.js#PieChart` in Next 14, or the named
registerClientReference call in Next 16). No local wrapper substitutes for the
actual package client boundary.

Source validation retains the verified 721-test baseline with 89 new Pie tests
(**810 total**, 40 files). All 89 focused rendering, interaction, Node SSR and
hydration tests pass separately. Typecheck, type contracts, lint, formatting,
package verification, playground build, dry-run packing and diff checks pass.
The remote Node 22/24 × React 18.2/19 matrix remains a separate PR gate; local
consumer results do not establish its outcome.

| Genuine artifact    |   Bytes |
| ------------------- | ------: |
| Tarball (six files) |  78,439 |
| ESM                 | 103,397 |
| ESM gzip            |  22,921 |

Reproduce with `node scripts/verify-consumers.mjs`. Its writable npm cache,
results, HTML, client-reference artifacts and screenshots remain in ignored
`work/consumers/`. No generated screenshots enter committed source or the package.

The real Vite playground audit, `node scripts/verify-pie.mjs`, uses the same
Chromium driver and captures ordinary/full-circle/duplicate/excluded/negative/
custom/narrow/many/empty examples at 320, 480 and 1200px viewports, plus focused
small-slice tooltips, visible tables and several charts together. Three focused
axe scans report zero violations with no console/page errors. Actual screenshots
were inspected: shapes, source ordering, full-circle closure, wrapped duplicate
legends, conservative label fitting and unavailable messages are correct. The
review fixed hidden-table intrinsic overflow, reserved numeric column space,
container-relative tooltip bounds and visible tiny-slice focus treatment.
Evidence stays in ignored `work/visual/pie/`.

Accepted limits include exact-sector tiny pointer targets, estimated label fitting
without collision detection, approximate tooltip placement and arbitrary custom
content sizing. No full WCAG, manual screen-reader, physical touchscreen hardware,
Firefox/WebKit or Turbopack validation is claimed. Chromium native touch input is
executed through its emulated touchscreen. Existing Rolldown directive warnings
and Next 14's outputFileTracingRoot warning remain; emitted client boundaries,
production builds and browser behavior pass. No dependencies, public prop/type
contracts, package subpaths, publication or deployment are added. See
[PieChart](PIE_CHART.md) for behavior and limitations.

The following sections preserve historical results for earlier milestones.

# M03-T05 packaged integration validation

The corrected private 0.0.0 package retains exactly AreaChart, BarChart and
LineChart runtime exports. The complete genuine consumer suite passed again:

| Installed consumer                       | Package declarations        | Production build/browser | Focused axe  |
| ---------------------------------------- | --------------------------- | ------------------------ | ------------ |
| Vite 8.3.4 / React & DOM 18.2.0          | Pass (strict)               | Pass                     | 0 violations |
| Vite 8.3.4 / React & DOM 19.3.0          | Pass (strict)               | Pass                     | 0 violations |
| Next 14.2.35 / React & DOM 18.2.0        | Pass (strict package check) | App and Pages pass       | 0 violations |
| Next 16.4.0 Webpack / React & DOM 19.3.0 | Pass (strict package check) | App and Pages pass       | 0 violations |

Node 24.19.0, npm 11.9.0, Chromium 151.0.7922.173, Playwright Core 1.64.0,
axe 4.13.0. TypeScript is 6.0.3 except Next 14 (5.4.5). React 18 types are
18.3.31 / DOM 18.3.7; React 19 types are 19.3.0 / DOM 19.3.0. Node types are
24.19.1 except Next 14 (20.19.0). These are executed versions, not a promise for
all versions. Next Turbopack, Firefox and WebKit were not executed.

Each generated application reinstalls the current packed archive, compares its
installed ESM bytes to the build, compiles public declarations with
skipLibCheck=false, and builds for production. Existing Line/Area/Bar interaction,
source-table, SVG geometry, SSR/hydration and observer-cleanup scenarios remain.
New narrow installed-package examples verify default tooltip/table wrapping and
empty/unusable/replacement transitions across all three families. Total source
tables increase from 18 to 21. Vite's independently hydrated roots now include
all three charts under Strict Mode with matching distinct identifierPrefix values
and categorical Dates; initial markup and IDs match without recoverable errors.
Both Next App and Pages Router retain real installed root imports. Browser checks
fail on console/page/hydration errors; all four completed without such errors.

The new real-playground matrix separately covers five responsive configurations,
320/480/768/1200px shrink/grow, keyboard exits, signed values/zero, focus/tooltip
captures, three state-specific axe scans (zero violations), reduced motion,
forced-colors emulation, CSS text enlargement and bounded performance samples.
See [integration hardening](M03_INTEGRATION_HARDENING.md) for methodology,
actual visual observations, source validation, evidence locations and limitations.
No manual screen-reader, native zoom, native OS forced-colors or WCAG certification
claim is made. The full 649-test baseline is retained with eight new integration
tests (657 total). Playground assertions reflect its five additional tables.

| Genuine corrected artifact |  Bytes |
| -------------------------- | -----: |
| ESM                        | 77,013 |
| ESM gzip                   | 18,524 |

Final genuine tarball: **62,540 bytes**, six files. The tarball byte count depends on the included README; final packed measurements
are retained in ignored `work/consumers/results.json`. No runtime dependency,
public type, root export, license or publication configuration changed.

GitHub CLI Actions reads returned `Forbidden`; connected GitHub tools are used
for PR/CI verification when available. The four Node 22/24 × React 18.2/19 jobs
are a separate merge gate: local Node 24 and framework results do not establish
remote CI success. Publication, merge and Milestone 04 are not authorized here.

## M03-T05 GitHub CI evidence

Implementation commit `a0b723f1a7625ec9521f1a84c8a46b62d8874ff7` passed
[GitHub CI run 37998172096](https://github.com/michael-garcia-95/react-simple-charts/actions/runs/37998172096).
Connected GitHub tools returned completed/success for all four jobs, and decoded
job logs confirmed 657 passing tests in each job with these resolved versions:

| CI job              | Node    | React / DOM | React types / DOM types | Result |
| ------------------- | ------- | ----------- | ----------------------- | ------ |
| checks (22, 18.2.0) | 22.23.3 | 18.2.0      | 18.3.31 / 18.3.7        | Pass   |
| checks (22, 19)     | 22.23.3 | 19.3.0      | 19.3.0 / 19.3.0         | Pass   |
| checks (24, 18.2.0) | 24.21.0 | 18.2.0      | 18.3.31 / 18.3.7        | Pass   |
| checks (24, 19)     | 24.21.0 | 19.3.0      | 19.3.0 / 19.3.0         | Pass   |

Each job passed typecheck, type contracts, lint, formatting, all tests, actual
package verification, playground production build and dry-run packing. This
section is a subsequent documentation-only record of the tested implementation;
any later commit still requires its own green CI before merge review. The PR
remains open and unmerged for Development Lead review.

The sections below preserve historical M03-T04 and earlier evidence; their test
counts, sizes and limitations describe those runs, not current M03-T05 results.

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
