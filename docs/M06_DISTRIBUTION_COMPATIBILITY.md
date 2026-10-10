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
| React peers        | Unchanged `^18.2.0 \|\| ^19.0.0` for React and React DOM. Executed consumer runtimes: 18.2.0 and 19.3.0. Supply/deduplicate external peers. This does not verify every patch/minor in the range.                                                                                                         |
| TypeScript         | Tested 5.4.5 in Next 14 and 6.0.3 elsewhere. Built-in `NoInfer` requires a compiler with that feature (introduced in 5.4); older compilers are not supported by these declarations. No claim that all newer compiler versions have been tested.                                                          |
| Browser JavaScript | ES2022 ESM, SVG, Pointer Events and standard focus APIs. Responsive graphical mounting requires native ResizeObserver; without it, accessible placeholders/tables remain, and explicit dimensions are the graphical fallback. Optional opacity animation checks browser capabilities and reduced motion. |
| Browsers           | Local Chromium 151.0.7922.173; GitHub Actions Chromium 156.0.8078.4, Firefox 157.0 and WebKit 27.2 passed the focused installed-package suite. See M06-T03B evidence below. Other versions and physical Safari/iOS remain unverified.                                                                    |
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
suite is separate from the larger four-consumer matrix and ordinary Node/React
CI; M06-T03B below adds its own dedicated browser workflow.

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

The following matrix records the original **local M06-T03 execution**. The later
M06-T03B GitHub Actions matrix below supersedes its browser verification gap.

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
gate; material barriers require fixes or an explicit Lead decision. M06-T03B
subsequently closes the three-engine smoke execution gap in GitHub Actions, as
recorded below; local download restrictions remain. This evidence does not promise
universal browser support. Later release documentation, version/changelog/
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

## PR #25 targeted review corrections

Continued from reviewed commit `800e94ed655ccd158b941f69425c02085805d13c`
on the same branch and PR. Escaped the peer-range pipe characters in the Markdown
cell. Parsing with the existing Prettier GFM parser confirms two cells in the
React row and the rendered inline-code value `^18.2.0 || ^19.0.0`.

Windows preparation had a real portability gap: `spawn('npm', args)` without a
shell cannot directly execute the usual npm.cmd launcher. Confirmed against
[Node's Windows child-process guidance](https://github.com/nodejs/node/blob/v24.19.0/doc/api/child_process.md#spawning-bat-and-cmd-files-on-windows)
and [npm 11.9.0's launcher](https://github.com/npm/cli/blob/v11.9.0/bin/npm.cmd).
The launcher ultimately invokes node.exe with npm-cli.js.

The private script helper `scripts/npm-command.mjs` now locates npm-cli.js on
Windows, preferring npm_execpath when invoked through npm, then searching Windows
PATH directories (including user-prefix installations), then the Node installation
directory. It recognizes case-insensitive Path keys and quoted directories.
Missing installations fail with a clear setup message. The runner executes that
JavaScript CLI with process.execPath and a separate argument array, explicitly
without a shell; paths with spaces and shell metacharacters are not interpolated.
Other Node children use the same running executable. Linux retains its existing
npm PATH invocation. Preparation output identifies the fixture directory separately
instead of emitting an unquoted cd command.

**Native Windows execution remains unverified.** Only a Linux executor was
available; the existing four CI jobs also run Ubuntu. No Windows/NVDA success is
claimed. Instead, seven focused Node tests cover Linux preservation, Windows CLI
discovery next to Node, npm-run selection, Path casing/quotes/spaces, stale or
npm.cmd fallbacks, missing installations, and a real shell-free Node subprocess
with spaces in its script path/cwd and literal metacharacter arguments. Windows
path discovery is simulated using win32 path semantics; the real process test
runs on Linux. These tests now run in every existing Node/React CI job.

The documented `node scripts/verify-browser-smoke.mjs --prepare-only` command
also passed end to end from a copied Linux checkout under
`work/m06-t03-review/checkout with spaces`. Development tools reused the original
node_modules, but the consumer was freshly installed from the genuine six-file
archive, with no library source alias or workspace link. npm packing, installation,
peer checks and production Vite build succeeded. No browser driver or binary was
provisioned in prepare-only mode. The manual Windows plan records these limits
and includes a quoted PowerShell Set-Location example. Human NVDA checks remain
pending.

Review validation uses Node 24.19.0 / npm 11.9.0. All required commands in the
local validation table above were rerun successfully: 1,115 Vitest tests / 52
files and 32 compiled snippets. Additionally:

```sh
node --test scripts/tests/npm-command.test.mjs
# Seven focused tests pass; also run by all four CI jobs.
node scripts/verify-browser-smoke.mjs --prepare-only
# Executed with the checkout containing spaces as the working directory.
```

The preserved genuine four-consumer matrix was also rerun: all Vite 8.3.4 / React
18.2.0 and 19.3.0, Next 14.2.35 / React 18.2.0, and Next 16.4.0 Webpack / React
19.3.0 rows passed, including strict installed types, production, SSR/hydration,
both routers and zero representative axe violations. The updated focused runner
passed all 15 Chromium 151.0.7922.173 checks with zero axe violations. Firefox and
WebKit launch attempts still reported missing binaries; their checks remain
unexecuted and the default three-engine run exited 1. Prior download-policy limits
remain unchanged. Native Windows/NVDA and wider-browser support are not inferred
from these Linux/Chromium checks.

No package metadata, peer range, private/version safeguard, public API, source-map
policy, browser assertion or Pages deployment workflow changed. The six-file
archive inventory and local sizes remain 82,123 packed / 353,878 unpacked bytes.
Detailed correction logs are ignored under work/m06-t03-review. Final pushed SHA
and all four final-head CI outcomes are recorded in the review handoff. No new PR,
merge, publication, release/tag or deployment is authorized or performed.

## M06-T03B — Isolated cross-browser CI verification

Verified clean baseline `715bcd46001910bef72daf931c199cfc069befd7` after fetching
origin/main. The dedicated `Browser verification` pull-request/manual workflow
uses Ubuntu 24.04 and pinned Node 24.19.0, independently of the existing four
Node/React jobs. It runs npm ci, installs the existing Playwright Core 1.64.0 /
axe Playwright 4.13.0 driver under ignored work via `--install-driver-only`, then
uses that driver's supported `install --with-deps chromium firefox webkit` command.
No root dependency, package metadata, source map, chart API or Pages workflow changes.

`npm run verify:browsers` explicitly requests all three engines. It still packs
and installs the genuine six-file archive into a fresh Vite/React production
fixture, compares installed ESM bytes and executes every existing assertion.
There are no source aliases, forced clicks, assertion retries or browser fallbacks.
A separate report gate requires all three engine results to pass with 15 recorded
checks and zero axe violations each. Installation or unexecuted engines fail the job.

The job uploads narrowly selected logs, results, screenshots, accessibility
snapshots, complete axe analysis and driver manifests for 14 days, even on failure.
Failure screenshots/snapshots are attempted before closing the browser; diagnostic
capture failures are recorded without replacing the original assertion failure.
Browser binaries, npm caches and node_modules are excluded from these artifacts
and from the distributed archive. Exact executed browser versions come from
browser.version(), not installation metadata.

### Actual GitHub Actions results

[PR #26](https://github.com/michael-garcia-95/react-simple-charts/pull/26), branch
`chore/m06-t03b-browser-ci`. On 2026-10-10,
[Browser verification run 38088441939](https://github.com/michael-garcia-95/react-simple-charts/actions/runs/38088441939)
passed on head `c2377062ef5f72a33510c6c48ba3342a779a7b5f` (PR merge ref
`5f520b8e5a5e626cdbaf8902a692db0b9b93a17b`). Installation, actual smoke execution,
complete-report gate and artifact upload all succeeded. Downloaded and inspected
the 14-file, 1,010,781-byte evidence ZIP (artifact 11683205655), including
results.json, all three axe analyses and accessibility snapshots; job logs
independently report the same executed versions and results.

| Environment                 | Engine   | Actually executed version | Result                                        | Recorded scenario groups | Axe violations | Console/page/HTTP errors |
| --------------------------- | -------- | ------------------------- | --------------------------------------------- | -----------------------: | -------------: | -----------------------: |
| Local Linux                 | Chromium | 151.0.7922.173            | Pass                                          |                       15 |              0 |                        0 |
| Local Linux                 | Firefox  | None                      | Not executed; existing CDN policy restriction |                        0 |   Not executed |             Not executed |
| Local Linux                 | WebKit   | None                      | Not executed; existing CDN policy restriction |                        0 |   Not executed |             Not executed |
| GitHub Actions Ubuntu 24.04 | Chromium | 156.0.8078.4              | Pass                                          |                       15 |              0 |                        0 |
| GitHub Actions Ubuntu 24.04 | Firefox  | 157.0                     | Pass                                          |                       15 |              0 |                        0 |
| GitHub Actions Ubuntu 24.04 | WebKit   | 27.2                      | Pass                                          |                       15 |              0 |                        0 |

Each engine executed ten family/sizing scenario groups plus five shared groups
(45 groups total, each containing multiple assertions). All existing keyboard,
pointer, SVG, tooltip/focus, table, resize, empty/unavailable and error assertions
passed without modification. This is the focused Vite 8.3.4 / React 19.3.0 fixture,
not a Firefox/WebKit rerun of the historical four-framework consumer matrix.
The separate [Node/React CI run 38088441809](https://github.com/michael-garcia-95/react-simple-charts/actions/runs/38088441809)
also passed all four jobs on that head. The final documentation commit's CI is
reported separately in the task handoff; browser workflow/driver/assertion code
is unchanged by that evidence update.

Axe-core 4.13.0 reported 30 passing rules, zero violations, two incomplete rules
and 58 inapplicable rules in each engine. **Incomplete does not mean passing:**
color-contrast could not determine backgrounds for 60 SVG text nodes; the empty
Line table's header has no data cells (`th-has-data-cells`, one node), matching the
intentional empty dataset. These remain explicit human review items, not suppressed
rules or proof of a defect. All five visually hidden responsive source-table
names were present in each accessibility snapshot. Screenshots are diagnostics,
not visual baseline assertions. No library compatibility defect or test-driver
assumption failure was discovered; no rendering, geometry or interaction fix was
needed.

The three-engine smoke verification gate is complete for these exact executed
builds. This does not establish physical Safari/macOS/iOS, Windows/NVDA, mobile
devices, strict CSP, every supported React patch or real screen-reader announcements.
Manual NVDA checks remain pending; automated axe is not WCAG certification.
First publication remains NO-GO pending manual accessibility evidence and the
separate release-policy/security/documentation/authorization gates.

Reproduce on a Linux machine with permitted Playwright downloads:

```sh
npm ci
node scripts/verify-browser-smoke.mjs --install-driver-only
export PLAYWRIGHT_BROWSERS_PATH="$PWD/work/browser-smoke/binaries"
node work/browser-smoke/driver/node_modules/playwright-core/cli.js install --with-deps chromium firefox webkit
RSC_SMOKE_BROWSERS=chromium,firefox,webkit npm run verify:browsers
```

`--prepare-only` retains the independent Windows manual-fixture workflow and does
not provision browser drivers. `--install-driver-only` provisions only the driver,
without packing the library or building a consumer. Normal browser verification
continues to perform both preparation and driver setup.

M06-T03B local validation on Node 24.19.0 / npm 11.9.0 passed: npm ci (274
packages), typecheck, test:types, lint, format:check, 1,115 Vitest tests / 52 files,
seven npm-command tests, verify:package (six files, 82,123 packed / 353,878 unpacked
bytes), verify:site:snippets (32 samples), both site builds and base checks,
build:playground, npm pack --dry-run and git diff --check. Isolated driver-only
provisioning also passed. Exact commands match the local validation table above;
focused command: `node --test scripts/tests/npm-command.test.mjs`. These are local
results, not substitutes for GitHub Actions engine execution.
