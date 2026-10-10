# M05-T04 — Website integration hardening and launch readiness

## Verified baseline and task boundary

Fetched fresh `origin/main` with authorized command-level network access. Both
`git rev-parse origin/main` and GitHub identify
`18903e820f8978b40296a94d0955c507506626fc` (M05-T03 / PR #20).
`git cat-file -t` returned `commit`; `git status --short` was empty before
`git switch -c feat/m05-t04-website-hardening origin/main`.
The untouched baseline passed **1,103 tests across 51 files**. The previous
M05-T01 checkout was not edited. Proxy settings and credentials were not changed.

This is the final M05 website audit. No M06 work, redesign, new product feature,
chart API change, deployment, package publication, release, tag or merge is included.

## Methodology and static build modes

Read AGENTS, architecture, the M05 design/interactive/documentation reports,
GitHub Pages plan, open decisions and M04 integration report. Reviewed all site
components, styles, metadata, generated examples, four site test files, static
server, artifact/snippet/browser verifiers, Vite configuration and CI matrix.
Consulted public contracts and existing chart renderers/inspection handlers to
verify claims without changing library behavior.

The baseline production root build and existing Chromium audit were executed
before fixes: **16 layouts, 20 gallery runs, 25 axe scans, zero violations and
zero console/page/resource errors**. Additional tests reproduced clipboard races;
a Chromium geometry probe and focused screenshots reproduced focus clipping.
Before-fix evidence is ignored under `work/visual/site/baseline-root/`,
`work/copy-reproduction.log`, `work/probe-before.json`, `work/focus-before.png`
and `work/chart-focus-before.png`.

Both final modes build four real HTML pages using the real package root:

```sh
npm run build:site
node scripts/verify-site-build.mjs /
node scripts/serve-site.mjs
# In another terminal:
node scripts/verify-site.mjs

# Stop the root server before replacing site-dist:
npm run build:site:pages
node scripts/verify-site-build.mjs /react-simple-charts/
node scripts/serve-site.mjs --base=/react-simple-charts/
# In another terminal:
node scripts/verify-site.mjs --base=/react-simple-charts/
```

The isolated server serves only emitted files. The project artifact is mounted
only at `/react-simple-charts/`, without a root mirror or SPA fallback.
The verifier now checks metadata, referenced assets and the complete emitted-file
inventory, including matching JS source maps. Size measurements are recorded
without adding a performance budget or a dependency.

## Reproduced defects, corrections and regressions

### Stale clipboard feedback after source changes and reset

Reproduction: copy Line's initial source, switch Dataset to Website traffic,
then Reset. The previous `Code copied.` message reappeared because CodePreview
associated feedback only with source-string equality. The same sequence while
the write promise was pending also announced the old operation after resolution.
Two new real-article tests failed before the correction, with `Code copied.`
where an empty status was required.

CodePreview now tracks a monotonically increasing source revision. Every source
transition clears feedback and invalidates pending results, even when Reset later
restores identical text. The existing request counter still prevents earlier
requests from overwriting the latest result. Conditional adjustment of this
component's state preserves the existing DOM and focus; no keyed remount or focus
management is needed. Success still waits for `writeText` to resolve.

Four new tests cover completed and pending reset races plus repeated requests
settling in reverse order with either latest success or latest denial. Five more
integration tests reset each family after all siblings have changed, asserting
their source, settings and existing source-table identity remain intact.
Existing pending-copy, unsupported API, denied write and source equality tests
are preserved. Production QA also controls promise resolution and verifies
manual-copy status/focus. Native write/read checks remain separate from those
mocked failure/race scenarios.

### Keyboard focus outlines clipped by site containers

Reproduction: at 375px, Tab/focus a Documentation code panel and ArrowRight to
scroll. Its 3px outline with 4px offset extends past both sides of its
`overflow: hidden` parent; screenshot and bounding rectangles showed only the
top/bottom edges. Gallery chart frames similarly had a 3px outline/3px offset
extending past `overflow: clip` preview boundaries.

The smallest correction is in site CSS: place code-panel and scoped chart-frame
outlines inside their own bounds with a -3px offset. The chart rule overrides
only the library's inline offset in these site containers. Outline color/width,
individual chart target strokes, library rendering and hidden-table containment
remain intact. Removing containment would reintroduce enlarged-text overflow;
changing library focus defaults would exceed this task's scope.

Browser regressions focus all twelve documentation panels at seven widths and
all five gallery frames, asserting a solid outline entirely inside the clipping
boundary. Before/after screenshots confirm four visible edges. No outline,
source data or accessibility content is removed.

## Cross-page, content and documentation findings

Home, Examples, Documentation and About retain the approved light palette,
system typography, headings, restrained spacing, branding, metadata and footer.
No additional demonstrated presentation defect required a redesign.
All seven widths check hero/chart containment, gallery links, settings, footer
and page overflow. Code/reference tables intentionally scroll in their named
containers. Three narrow widths additionally check every page at 200% root
text enlargement, including form/link bounds. Chart resize transitions verify
each of the five independent measured SVGs reaches its new figure width.

Native header navigation, Home family links, gallery anchors, all fourteen
Documentation headings and five documentation-to-gallery links remain valid in
both bases. Added checks cover nested-page refresh and browser back/forward.
Unknown and nested unknown static paths return 404; unprefixed project-mode
routes return 404. The existing not-found component/path tests are preserved.
Skip links, current-page links, English language, viewport, per-page titles and
descriptions, inline SVG favicon and external repository URLs are checked.

All fourteen Documentation sections were compared with current contracts and
behavior: categorical versus continuous X, physical horizontal Bar axes,
missing versus zero, unstacked zero-baseline Area, complete polar negative
rejection, shared Line/Area versus item Bar tooltips, keyboard controls,
source tables, UTC/local-time SSR, and private/unpublished package availability.
No inaccurate claim requiring a content correction was found. Documentation
keeps its single authored source for ten complete TSX examples; the interactive
generator retains synchronized state and all 22 combinations. No unsupported
API, public npm install, live hosting, browser certification or performance
guarantee is advertised. No third-party script/tracking is introduced.

## Interaction, accessibility and runtime evidence

All shared and family-specific controls are exercised at seven widths, including
complete reset, independent state, code synchronization, source-table retention,
zero/missing observations, both Bar orientations and all three Donut ratios.
Actual source tables retain names, captions and row/column headers; hidden
tables remain accessible. Small Donut holes retain the library's documented
center-content limits; the preset's context and units also appear outside it.

Additional Chromium checks cover all four arrows, Home/End and boundary
clamping, one roving Tab entry, Enter/Space, Escape, normal Tab/Shift+Tab departure,
tooltip enable/disable, focus through a settings update, simultaneous independent
chart inspection, hit-tested pointer hover/click, and emulated touch inspection
and local dismissal for every family. The gallery has no activation callback;
its native operations do not navigate or change sibling source. Exact activation
counts, held-key suppression and payload semantics remain covered by the retained
library interaction tests, rather than adding product instrumentation or
duplicating the implementation.

Changed settings, visible keyboard tooltips, copy fallback status, enlarged text
and reduced motion are included in axe checks. Repeated ID checks cover every
page; no duplicated SVG/DOM IDs, missing assets, responsive observer errors,
console errors or page exceptions are accepted by the audit. The static site
uses createRoot, not hydration; existing library SSR/hydration regressions run
in the full suite. Reduced-motion emulation suppresses all five animation
requests and site transitions.

Automated axe results and screenshot review are limited evidence, not WCAG
certification. No manual screen reader, physical touchscreen, native browser
zoom or live-host audit was performed. Touch is Chromium emulation; 200% root
text enlargement is distinct from browser zoom. Firefox/WebKit executable paths
reported by the installed driver do not exist, and no disruptive browser
installation was attempted.

## Local versions, validation and performance

Node **24.19.0**, npm **11.9.0**, React/React DOM **19.3.0**, TypeScript **6.0.3**,
Vitest **5.0.3**, Chromium **151.0.7922.173**, Playwright Core **1.64.0**,
axe Playwright/axe-core **4.13.0**.

The full suite passes **1,112 tests / 51 files**, adding **9** and retaining all
1,103 baseline tests. The site suite passes **137 / four files**.

| Exact command                               | Outcome                                                         |
| ------------------------------------------- | --------------------------------------------------------------- |
| `npm run typecheck`                         | Pass                                                            |
| `npm run test:types`                        | Pass                                                            |
| `npm run lint`                              | Pass; zero warnings                                             |
| `npm run format:check`                      | Pass                                                            |
| `npm test`                                  | 1,112 pass / 51 files                                           |
| `npm run test:site`                         | 137 pass / four files                                           |
| `npm run verify:package`                    | Pass; exports, declarations, external peers and client boundary |
| `npm run verify:site:snippets`              | 32 strict compilations: 22 interactive + 10 documentation       |
| `npm run build:playground`                  | Pass                                                            |
| `npm pack --dry-run --cache work/npm-cache` | Six allowed files; no site files                                |
| `git diff --check`                          | Pass                                                            |

Both `npm run build:site` / `node scripts/verify-site-build.mjs /` and
`npm run build:site:pages` / `node scripts/verify-site-build.mjs /react-simple-charts/`
pass, with four real HTML entries and every referenced asset verified.

The two complete final production audits each pass **28 page layouts** (four
pages × 320/375/480/768/900/1200/1440px), **35 family control runs**, **seven
documentation runs** and **61 axe scans**, with **zero violations and zero
console/page/resource errors**. There are five additional keyboard/pointer and
five emulated-touch family runs per base, twelve enlarged-text page checks
(four pages × 320/375/480px), five resize transitions and twelve timing samples.
The original M05-T02/T03 checks remain; one intermediate audit exposed a new
QA locator error (exact label text included native select options). It was
corrected to use the combobox's accessible name, and the full audit was rerun.
This was a verifier failure, not a site defect. Focused exploratory runs are
not counted as complete final production audits.

Evidence is ignored under `work/visual/site/{root,pages}/`: `results.json`,
`artifact.json`, mobile/desktop Home/gallery/Documentation captures, all seven
layout widths, `code-focus.png`, `chart-focus.png` and enlarged-text captures.
Root Home at 375/1440, Line at 375, Documentation overview at 1200 and code/chart
focus before/after screenshots were visually reviewed. Project-mode mobile and
desktop captures are reviewed separately; screenshots do not imply assistive
technology testing.

Measurements use emitted production assets, a local loopback
server, a 1200×900 viewport and three sequential navigations per page in one
browser context. Readiness is sampled after the expected SVG count and two
animation frames; elapsed time includes driver scheduling/rendering and is not
an isolated CPU benchmark. DOMContentLoaded and resource timings come from the
browser performance API. The five-chart gallery additionally repeats independent
viewport shrink/grow transitions. Artifact gzip/Brotli sizes use Node zlib.
Source maps are disclosed separately; they are emitted diagnostics, not an
additional application script. These are local laboratory observations, not
real-world Core Web Vitals, memory measurements or production guarantees.

Execution context: Linux x64, reported AMD EPYC 9V74 processor, three exposed
logical CPUs, cgroup quota `200000 100000` (two CPU equivalents), and
10,452,496,384 bytes reported host memory. This is container context, not a
dedicated physical test device.

Each artifact emits **seven files**: four HTML entries, one application JS,
one CSS and one JS source map. Only JS/CSS are requested by the application.
The four root HTML files total 3,489 raw bytes; project HTML totals 3,649 bytes.

| Asset                       | Raw bytes | gzip bytes | Brotli bytes |
| --------------------------- | --------: | ---------: | -----------: |
| Root main application JS    |   385,918 |    118,861 |      101,895 |
| Project main application JS |   385,958 |    118,865 |      101,908 |
| CSS (both modes)            |    11,702 |      2,896 |        2,506 |
| Root JS source map          | 1,574,250 |    357,561 |      295,190 |
| Project JS source map       | 1,574,252 |    357,561 |      295,260 |

The baseline Vite inventory reported approximately 385.78kB JS / 11.54kB CSS;
final root output is approximately 385.92kB / 11.70kB. The focused corrections
add little raw bundle size; no optimization or performance improvement is
claimed. `npm ls react react-dom --all` shows deduped 19.3.0 peers, and emitted
source-map inventory identifies one shared React/React DOM package root.

Readiness, milliseconds, median [minimum–maximum] of three samples:

| Page          |      Root readiness |   Project readiness | DOM nodes | SVG inspection controls |
| ------------- | ------------------: | ------------------: | --------: | ----------------------: |
| Home          | 112.3 [111.8–114.2] | 113.1 [112.3–113.3] |       214 |                       6 |
| Examples      | 128.9 [111.4–129.4] | 142.9 [129.4–147.6] |       679 |                      30 |
| Documentation | 111.3 [110.9–129.4] | 111.6 [110.8–112.3] |       552 |                       0 |
| About         |  107.6 [97.5–127.7] | 125.5 [115.9–128.8] |       115 |                       3 |

Root gallery resize readiness was 119.6ms at 1440px, 66.1ms at 320px,
66.7ms at 900px, 66.6ms at 375px and 66.9ms at 1200px. All five SVGs were
measured independently before recording readiness.
Project gallery resize readiness was 105.5 / 65.6 / 66.6 / 66.6 / 66.7ms
for the same viewport sequence. Per-sample DOMContentLoaded and resource
bytes/timings, readiness and resize samples are retained
in the machine-readable results. No load/resource errors occurred, and the
large Documentation page's anchors, copy controls and contained scrolling
remain usable. No virtualization or speculative performance budget is added.

No measured behavior justifies speculative code splitting, caching, framework
migration or new dependencies in this bounded website. The existing shared
application chunk serves all pages; large-data library DOM costs remain the
documented M04 limitation. Future production budgets require separate review.

## Package isolation, Pages readiness and remaining prerequisites

No library source, public props, geometry/scales/normalization, defaults,
playground source, manifest, dependency lockfile, peer policy, Vite resolution
or CI permissions are changed. Runtime exports remain exactly LineChart,
AreaChart, BarChart, PieChart and DonutChart. Private 0.0.0, MIT, ESM root-only
exports, external React peers, `use client` and the dist/LICENSE allowlist pass
the package verifier. Packing emits LICENSE, README, package.json and three
dist artifacts; no site source, dataset, asset or site-dist file is included.
Library `dist/`, `playground-dist/` and `site-dist/` remain separate.

The independent installed Vite/Next consumer matrix is not rerun: the public
library and package contracts are byte-for-byte unchanged in Git. M04 consumer
evidence remains the baseline; built-root site integration, package verification
and strict snippets directly cover this task's boundary. Existing Node 22/24 ×
React 18.2/19 CI jobs and their full checks are preserved, without browser
downloads added to the matrix.

The local project-path artifact is the proposed future Pages payload at
https://michael-garcia-95.github.io/react-simple-charts/. Pages settings are not
assumed enabled. After review and explicit approval, a future deployment owner
must select the approved SHA, enable/configure the authorized Pages source,
implement the separately reviewed upload/deploy workflow and permissions,
upload only site-dist, and validate live routes/assets/fragments. Canonical
URLs, social previews, custom domains/DNS and npm publication remain separate.
See [the inactive Pages plan](GITHUB_PAGES_PLAN.md).

GitHub API access currently returns `Forbidden` through `gh`, including after
authorized network permission escalation. Git transport works, but that does
not establish REST/GraphQL access. PR creation and final-head remote CI review
must be verified before a positive deployment-readiness assessment. No proxy,
credential or security-policy bypass is used.

| Required final-head GitHub job | Remote outcome                                       |
| ------------------------------ | ---------------------------------------------------- |
| Node 22 / React 18.2           | Unverified; GitHub API access blocked                |
| Node 22 / React 19             | Unverified; GitHub API access blocked                |
| Node 24 / React 18.2           | Unverified; GitHub API access blocked                |
| Node 24 / React 19             | Unverified remotely; local Node 24 / React 19 passes |

Local checks are not represented as remote CI outcomes. The next reviewer must
open the one requested PR targeting main and verify all four jobs on its final
HEAD once GitHub API access is available. The branch remains unmerged.

**NOT READY — BLOCKERS REMAIN** until the required PR/final-head CI evidence is
available. This assessment is not deployment or merge authorization; await
Development Lead review and explicit squash-merge approval.
