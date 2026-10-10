# M06-T03 — Distribution and compatibility hardening

## Scope, baseline and approved policies

Fetched `origin/main` and verified exact SHA
`2e82d0e1040228848d6b4fe269763aadb9bc5a87`. The worktree was clean before
creating `chore/m06-t03-distribution-hardening`. Read AGENTS.md, architecture,
M06 release/identity, consumer/rendering compatibility, M04 integration and open
decisions; inspected actual build configuration, generated ESM/declarations/map,
renderers, interaction handlers, dependencies and verification implementations.

Approved: separate contributor tooling from consumer Node policy, remove the
published engines constraint after inspection, retain JavaScript source maps,
add focused Chromium/Firefox/WebKit verification, and prepare a bounded Windows
NVDA plan. Package identity remains `@michael-garcia-95/react-simple-charts`,
`private: true`, version `0.0.0`. Exactly five public runtime exports and the
existing API remain unchanged. No publication, release/tag, deployment, Pages
workflow/settings change, merge or M06-T04 work is included.

## Node decision and conservative support position

Removed only the root `engines` declaration from package.json and synchronized
package-lock.json with npm tooling. No dependency version changed. The old range
`^22.22.2 || ^24.15.0 || >=26.0.0` exactly matches jsdom 30.1.2 and its
w3c-xmlserializer development dependency, not the chart runtime. tsdown 0.23.0
requires `^22.18.0 || ^24.11.0 || >=26.0.0`; Vite 8.3.4 requires
`^20.19.0 || >=22.12.0`; Vitest 5.0.3 requires
`^22.12.0 || ^24.0.0 || >=26.0.0`. Contributors retain the stricter existing
range in README because all build/test tools must run. Node 26 is admitted by
these tooling ranges but is not in the existing CI matrix.

Inspection found neutral-platform ES2022 ESM, external `react`,
`react/jsx-runtime`, `d3-scale` and `d3-shape` imports, and no Node built-ins in
the distributed entry. Browser measurement/animation access is inside effects,
not module initialization or pure calculations. Declarations reference React
and standard types, not build tools or internal imports. d3-scale 4.0.2 and
d3-shape 3.2.0 and their locked math dependencies declare Node >=12, but that
upstream metadata is **not** a tested library minimum. No material blocker to
removing the misleading installation constraint was found. The actual tarball
and fresh installed consumer manifests have no engines field.

| Dimension          | First-release compatibility position based on evidence                                                                                                                                                                                                                                                   |
| ------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| React peers        | Unchanged `^18.2.0                                                                                                                                                                                                                                                                                       |     | ^19.0.0` for React and React DOM. Executed consumer runtimes: 18.2.0 and 19.3.0. Supply/deduplicate external peers. This does not verify every patch/minor in the range. |
| TypeScript         | Tested 5.4.5 in Next 14 and 6.0.3 elsewhere. Built-in `NoInfer` requires a compiler with that feature (introduced in 5.4); older compilers are not supported by these declarations. No claim that all newer compiler versions have been tested.                                                          |
| Browser JavaScript | ES2022 ESM, SVG, Pointer Events and standard focus APIs. Responsive graphical mounting requires native ResizeObserver; without it, accessible placeholders/tables remain, and explicit dimensions are the graphical fallback. Optional opacity animation checks browser capabilities and reduced motion. |
| Browsers           | Executed Chromium 151.0.7922.173. Firefox/WebKit remain unverified due blocked binary downloads; do not advertise their support. See matrix below.                                                                                                                                                       |
| Node consumers     | Local Node 24.19.0, npm 11.9.0 for genuine SSR/consumer checks. Existing CI exercises Node 22/24 × React 18.2/19; final-head results are reported in the PR handoff. Removing engines does not verify older Node versions, and adds no consumer minimum claim.                                           |
| Frameworks         | Four pinned installed configurations below; Next App and Pages Router with Webpack. Turbopack, other frameworks/configurations and older Node SSR are unverified. Next owns some internal React implementations; installed peers do not describe every internal renderer.                                |
| Devices/CSP        | No physical mobile validation, universal browser claim or strict CSP promise. Chromium touchscreen emulation is event evidence only. Essential inline styles require a compatible host style/CSP policy.                                                                                                 |

SSR imports run without DOM globals. Positive finite explicit dimensions render
SVG and tables; responsive charts initially render stable accessible placeholders
and tables until per-container measurement. Cartesian local-time rendering starts
pending, then uses the client timezone; use UTC/consistent explicit formatting
for cross-environment consistency. Multiple React roots require matching unique
identifierPrefix values on server/client. The root carries `use client`; it is
not a public server-only helper API. Real Next client references and hydration
are checked rather than inferred from that directive.

## Retained source-map policy and archive integrity

Keep `dist/index.js.map` including implementation source. The repository is public;
source exposure is intentional and useful for debugging. The map contains 50
unique relative `../src/...` TypeScript/TSX entries with embedded source content.
Each entry matches a tracked repository library file byte-for-byte. No absolute
source path, sourceRoot, site/playground/test/work file, build evidence, credential
marker or private material was found. The bounded private-key/npm/GitHub/AWS-key
marker scan is defense in depth, not a comprehensive secret-detection guarantee.
The new verifier enforces the source allowlist and content match on every run.

The existing stronger M06-T02 assertions are retained: actual npm pack archive,
tar entry inventory, extracted manifest equality and exact build bytes. Added
checks enforce engines absence, unchanged peer/runtime dependency ranges, external
d3 imports, public-source map integrity and bounded credential scanning of every
archive file. All six packed files now match repository bytes, including README
and license; assertions are neither bypassed nor relaxed. The React/DOM subpath
externalization probe still builds with the real tsdown configuration.

Actual archive: `michael-garcia-95-react-simple-charts-0.0.0.tgz`.

| File              |   Bytes |
| ----------------- | ------: |
| LICENSE           |   1,071 |
| README.md         |   8,380 |
| package.json      |   3,056 |
| dist/index.js     | 106,382 |
| dist/index.d.ts   |   6,855 |
| dist/index.js.map | 228,134 |

Six files, **82,123 packed bytes / 353,878 unpacked bytes**; no bundled
dependencies. ESM gzip: 23,382 bytes (Node zlib default). SHA-1:
`78586020aef7cf054d367cb388380c1e8a638e8d`.
Only ESM root `.` with `types`/`import` conditions is exposed. Runtime exports
are exactly LineChart, AreaChart, BarChart, PieChart, DonutChart. There is no default,
CommonJS, helper or unauthorized subpath. React/DOM remain external peers;
d3-scale/d3-shape remain external runtime dependencies, not removed as supposedly
bundled code. Client banner is retained. README and MIT license are included;
lockfiles, browser drivers/binaries, local evidence, node_modules, site and
playground are excluded. Library ESM/declaration/map bytes are unchanged from
M06-T02; metadata and README account for archive differences.

## Genuine installed-consumer results

Executed `RSC_BROWSER_PATH=/usr/bin/chromium node scripts/verify-consumers.mjs`
on Node 24.19.0 / npm 11.9.0, Playwright Core 1.64.0, axe Playwright 4.13.0,
Chromium 151.0.7922.173. Every application was deleted and recreated, installed
from the actual new six-file archive, and compared to the generated ESM. No source
alias/workspace link was used. All four rows passed:

| Installed configuration | React / DOM | TypeScript | Strict installed package types | Production/browser |
| ----------------------- | ----------- | ---------- | ------------------------------ | ------------------ |
| Vite 8.3.4              | 18.2.0      | 6.0.3      | Pass                           | Pass               |
| Vite 8.3.4              | 19.3.0      | 6.0.3      | Pass                           | Pass               |
| Next 14.2.35, Webpack   | 18.2.0      | 5.4.5      | Pass                           | App and Pages pass |
| Next 16.4.0, Webpack    | 19.3.0      | 6.0.3      | Pass                           | App and Pages pass |

React 18 definitions: 18.3.31 / DOM 18.3.7; React 19 definitions: 19.3.0 /
DOM 19.3.0. Node definitions: 20.19.0 for Next 14, 24.19.1 elsewhere.
Installed package compilation uses strict checking and `skipLibCheck: false`.
Next whole-app dependency checking retains the existing framework setting
`skipLibCheck: true`; this does not weaken the independent package declaration gate.

Preserved checks include scoped root exports, forbidden subpaths, deduplicated
React peers, production builds, real SVG geometry, source tables, tooltips,
keyboard/pointer/touch interactions, responsive mounting, explicit SSR markup,
initial hydration and seven prefixed Strict Mode roots in Vite, observer cleanup,
and genuine Next App client-reference manifests and Pages Router rendering.
Vite's report `ssr: false` means it is not the Next framework fixture; separate
Node SSR/hydration roots still execute. Four representative axe scans had zero
violations, with no runner-reported console/page/hydration exceptions.

| Whole-consumer JS (includes React/framework/fixtures) | Raw bytes | Sum of per-file gzip bytes |
| ----------------------------------------------------- | --------: | -------------------------: |
| Vite / React 18                                       |   253,030 |                     79,814 |
| Vite / React 19                                       |   332,653 |                    102,588 |
| Next 14                                               |   896,919 |                    278,067 |
| Next 16                                               | 1,142,541 |                    353,759 |

## Focused browser verification

`scripts/verify-browser-smoke.mjs` packs the library, creates a fresh independent
Vite 8.3.4 / React 19.3.0 production app, installs the real tarball and checks ESM
bytes and peers. Pinned Playwright Core 1.64.0 and axe Playwright 4.13.0 are isolated
under ignored work, requiring no new root or runtime dependencies. This focused
suite is separate from the larger four-consumer matrix and ordinary CI.

Deterministic frozen Alpha 12 / Beta 24 / Gamma 18 datasets power all five families,
each in explicit and responsive modes on the same page. Checks cover named groups,
description IDs, finite SVG geometry, dimensions, one roving Tab entry, all four
arrows/Home/End, Enter/Space exactly-once activation, Escape/tooltip relationships,
real pointer hover/click, complete visible/hidden tables, Donut center Tab order
and independent activation, empty Line/unavailable negative Pie, unique IDs,
native resize, accessible-tree tables, representative axe and no page/console/HTTP
errors. Polar clicks use a hit-tested sector interior; bounding-box centers can
legitimately fall in the Donut hole. No forced or synthetic pointer click hides
that distinction. Screenshots are diagnostic artifacts, not visual baselines.
This suite does not attempt every historical scenario in each browser or add a
new browser/SSR/API contract.

| Engine   | Executed browser version                                | Result                                                                      |
| -------- | ------------------------------------------------------- | --------------------------------------------------------------------------- |
| Chromium | 151.0.7922.173                                          | Pass — ten family/sizing cases plus five shared checks; zero axe violations |
| Firefox  | None; requested Playwright Firefox 157.0, revision 1555 | Unexecuted — binary missing, supported download denied                      |
| WebKit   | None; requested Playwright WebKit 27.2, revision 2370   | Unexecuted — binary missing, supported download denied                      |

Supported `playwright-core/cli.js install firefox webkit` was attempted, then
WebKit was attempted separately. Both installers failed with HTTP 403
`Domain forbidden` from `cdn.playwright.dev` and
`playwright.download.prss.microsoft.com` (including their fallback paths).
Firefox requested `builds/firefox/1555/firefox-debian-13.zip`; WebKit requested
`builds/webkit/2370/webkit-debian-13.zip`. Launches also confirmed missing
`firefox-1555/firefox/firefox` and `webkit-2370/pw_run.sh`. OS dependencies cannot
resolve a denied binary download. No proxy bypass, unrelated software installation
or local-PC browser installation was performed. Versions requested by installer
metadata are **not executed browser versions**. WebKit engine testing would not
establish physical Safari/macOS/iOS validation even after a passing run.

## Accessibility evidence, defects and release gates

Reviewed current family and five-chart regressions for chart roles/names,
resolved descriptions, complete source tables, roving focus, arrows/Home/End,
Enter/Space activation, Escape, tooltip relationships, focus treatment, reduced
motion, and Donut center controls. Existing tests already cover these contracts;
no redundant unit suite or new chart feature was added. Browser smoke fills the
actual engine execution gap. The package safety test now guards absent engines.

No contained library compatibility defect requiring a runtime/API correction
was identified in executed checks. An initial smoke-driver attempt targeted a
Donut bounding-box center; the corrected hit-tested interior validates the
intended ring/hole behavior. The full original consumer suite remains unchanged. The smoke runner also needed
axe's documented explicit browser-context setup; it was corrected before the final
passing Chromium run.
Known nonfatal Rolldown directive warnings and Next 14 outputFileTracingRoot
warning remain; emitted boundaries and actual manifests are independently checked.

**Manual checks pending:** Windows 10/11 NVDA + Firefox for all five families,
including source tables, announcement discoverability, focus/activation and
Donut center content. [The manual plan](M06_SCREEN_READER_TEST_PLAN.md) includes
local packed examples, settings/modes, expected outcomes, checklist and defect
reporting. Codex has not executed NVDA and marks no manual row complete.
Automated axe/accessible-tree results are not WCAG certification or evidence of
real screen-reader announcements. Tooltip descriptions are not a live-region
contract; announcement timing needs human review.

Accepted documented limitations: conservative label fitting, narrow axis text
omission with full table alternatives, tiny-segment pointer targets, clipped
oversized custom Donut center content, caller-owned custom tooltip semantics,
local-time SSR/timezone behavior, inline styles/host CSS/CSP, and proportional
DOM cost for dense datasets. Native forced colors/zoom, physical mobile and
assistive mobile devices, strict CSP, other browser versions, Turbopack and older
Node environments remain unverified. These are not represented as passing.

**Release remains NO-GO.** Manual screen-reader evidence remains a first-release
gate; material barriers require fixes or an explicit Lead decision. Firefox/WebKit
execution needs download access or a separately approved conservative deferral;
no support promise is added. Later release documentation, version/changelog/
maintenance policy, secure bootstrap/provenance/trusted publisher preparation and
explicit publication approval remain separate gates/tasks. M06-T03 implementation
can be reviewed with these limitations; it does not authorize starting M06-T04.

## Reproduction and local validation

Use a contributor-compatible Node environment and writable npm cache if required.
The managed sandbox initially failed to connect to its proxy; supported command
permissions allowed Git/npm access. A sandbox archive-verifier attempt returned
empty npm pack JSON; rerunning with supported command permissions passed without
changing assertions. Browser downloads remained denied under those permissions.
The npm lock synchronization command was:
`npm install --package-lock-only --ignore-scripts --offline --cache /workspace/work/npm-cache`.

All local required commands were executed (Node 24.19.0 / npm 11.9.0):

| Command                                                       | Result                                                         |
| ------------------------------------------------------------- | -------------------------------------------------------------- |
| `npm ci --fetch-retries=0 --cache /workspace/work/npm-cache`  | Pass; 274 packages                                             |
| `npm run typecheck`                                           | Pass                                                           |
| `npm run test:types`                                          | Pass                                                           |
| `npm run lint`                                                | Pass                                                           |
| `npm run format:check`                                        | Pass; final documentation rechecked before commit              |
| `npm test`                                                    | 1,115 pass / 52 files; Vitest 5.0.3                            |
| `npm run verify:package`                                      | Pass; actual six-file archive and stronger assertions          |
| `npm run verify:site:snippets`                                | Pass; 32 compiled snippets (22 interactive + 10 documentation) |
| `npm run build:site`                                          | Pass                                                           |
| `node scripts/verify-site-build.mjs /`                        | Pass                                                           |
| `npm run build:site:pages`                                    | Pass                                                           |
| `node scripts/verify-site-build.mjs /react-simple-charts/`    | Pass                                                           |
| `npm run build:playground`                                    | Pass                                                           |
| `npm pack --dry-run --json --cache /workspace/work/npm-cache` | Pass; six files                                                |
| `git diff --check`                                            | Pass                                                           |

Network/driver checks, from the repository root:

```sh
RSC_BROWSER_PATH=/usr/bin/chromium node scripts/verify-consumers.mjs
# First smoke invocation installs the isolated driver and records missing browsers:
PLAYWRIGHT_BROWSERS_PATH="$PWD/work/browser-smoke/binaries" RSC_BROWSER_PATH=/usr/bin/chromium npm run verify:browsers
# In an environment with permitted Playwright downloads:
PLAYWRIGHT_BROWSERS_PATH="$PWD/work/browser-smoke/binaries" node work/browser-smoke/driver/node_modules/playwright-core/cli.js install firefox webkit
# On Linux, install only required browser OS dependencies if the installer reports them:
node work/browser-smoke/driver/node_modules/playwright-core/cli.js install-deps firefox webkit
PLAYWRIGHT_BROWSERS_PATH="$PWD/work/browser-smoke/binaries" RSC_BROWSER_PATH=/usr/bin/chromium npm run verify:browsers
```

Use an existing Chromium binary via `RSC_BROWSER_PATH`/`RSC_CHROMIUM_PATH`, or
install the matching Chromium using the same Playwright CLI. Optional
`RSC_FIREFOX_PATH`/`RSC_WEBKIT_PATH` require Playwright-compatible engine builds;
ordinary Firefox is not a replacement for Playwright's patched Firefox.
`RSC_SMOKE_BROWSERS=chromium` executes only that engine and makes no claim about
omitted engines. The executed default three-engine run exited 1 because Firefox/WebKit were
unexecuted; Chromium passed all 15 recorded checks with zero axe violations.
The default three-engine run exits nonzero on failed/unexecuted
engines and writes per-engine results. `--prepare-only` builds the same fixture
without drivers for human NVDA testing; see its plan for Windows commands.

Ignored evidence: work/m06-t03 command logs, work/consumers/results.json and
consumer HTML/manifests/screenshots, work/browser-smoke/results.json,
accessibility snapshots/screenshots, driver/cache/binaries. Final actual pack and
extraction were inspected separately; none of that evidence is published. Final
commit, PR and four final-head Node/React CI outcomes are in the task handoff;
local consumer evidence is not substituted for remote CI.
