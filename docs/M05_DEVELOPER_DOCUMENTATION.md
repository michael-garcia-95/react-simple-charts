# M05-T03 — Developer documentation and getting started

Required base: `8e5962ab70877c0bcd89c5f1c9cc3a01107d4b40`, merged M05-T02 / PR #19.
Fetched fresh `origin/main`, verified this exact commit and a clean worktree before
creating `feat/m05-t03-developer-docs`. The fresh baseline passed **1,059 tests
across 50 files**. Only M05-T03 is implemented; merge, deployment, publication,
release tags, Pages settings and M05-T04 are excluded.

## Structure and content sources

`site/Documentation.tsx` replaces the short introduction with fourteen sections:
introduction, getting started, chart selection, typed data mapping, each of the
five chart families, common configuration, tooltips/interactions, accessibility,
responsive/server rendering, and limitations/troubleshooting. Short paragraphs,
six compact reference tables, family examples and gallery cross-links support
both reading from the start and looking up a particular behavior.

The technical sources are `src/types/contracts.ts`, the root exports and manifest,
API_TYPE_CONTRACTS, LINE_CHART, AREA_CHART, BAR_CHART, PIE_CHART, DONUT_CHART,
RENDERING_COMPATIBILITY, CONSUMER_COMPATIBILITY, the M05 design/interactive reports,
GITHUB_PAGES_PLAN and OPEN_DECISIONS. The renderers, measurement hook, color resolver,
inspection handlers and polar validation were inspected to confirm behavior.
Older source documents contain historical milestones; the site follows current
implementation rather than repeating earlier statements about unimplemented families.

The content explains exclusive yKey/series, polar nameKey/valueKey, nullable numbers,
noncoercion, source identity, ordered gaps, category versus continuous X, signed
zero-baseline areas, grouped/horizontal Bar axes, polar zero/missing/negative rules,
percentage semantics, ratio validation and constrained center content. Defaults,
color precedence, axes/grid, tooltips, original-record activation, keyboard/touch,
source tables, responsive placeholders, UTC/local-time SSR and consumer boundaries
are explained separately from environmental limitations and future decisions.

Getting started explicitly states MIT, private 0.0.0, not published to npm,
not deployed, ESM root-only and React 18.2+/19 peers. Clone/build/dev commands and
fresh tarball installation in another local application are separated from a future
public release. No public npm-install command, new API or helper export is advertised.

## Type-safe source strategy

`site/documentation-code.ts` owns ten complete authored TSX strings displayed
verbatim through CodePreview: five family examples, numerical X, UTC dates,
local-time dates, a typed Cartesian tooltip and a typed polar segment tooltip.
Small deterministic fictional datasets are declared in every source. Explicit
record interfaces illustrate nullability; other examples demonstrate inference.
Every example imports a real public component, supplies an accessible label and
has an exported React function. No undeclared variables, network data, random
values, broad any casts or runtime code execution are involved.

`scripts/verify-site-snippets.mjs` loads that same source and the existing interactive
generator through Vite's module loader. It writes ignored fixtures and compiles
against the built package root declarations. All **22 interactive variants** are
retained and counted explicitly; ten documentation sources bring the total to
**32**. Strict checking remains enabled and now also checks exact optional
properties, unchecked indexed access and unused declarations/parameters.
Public contract tests already cover invalid mappings and incompatible branches;
no redundant negative compile suite is added.

## Static navigation and anchors

The existing four static HTML entries, page selection and `sitePath` remain intact.
`documentationSections` owns the table of contents and heading names. The default
stable IDs are `docs-introduction`, `docs-getting-started`, `docs-choose-a-chart`,
`docs-data-mapping`, `docs-line-chart`, `docs-area-chart`, `docs-bar-chart`,
`docs-pie-chart`, `docs-donut-chart`, `docs-common-configuration`,
`docs-tooltips-and-interactions`, `docs-accessibility`,
`docs-responsive-and-server-rendering` and `docs-limitations-and-troubleshooting`.
Headings use tabindex=-1 for native fragment focus, without extra Tab stops.
No scrolling script, router or history fallback is added. An optional site-internal
idPrefix supports isolated embedded Documentation instances without duplicate IDs;
the public page always uses the default fragments.

Gallery links resolve through sitePath to the approved #chart-line/area/bar/pie/donut
anchors under both `/` and `/react-simple-charts/`. Document-local fragments do not
add a base prefix. Header, footer, Home deep links and skip-to-main remain intact.
The static documentation description now reflects the expanded reference.

## Accessibility and copying

Native headings, sections and a named ordered-list navigation establish structure.
Reference tables retain captions, column/row headers and named focusable scroll
containers. Code is selectable, labeled and keyboard scrollable. The site teaches
meaningful labels, descriptions, visible versus visually-hidden source tables,
source-order identity and missing/zero distinctions without claiming WCAG certification.
Automated axe findings do not replace manual assistive-technology review.

CodePreview is reused unchanged for ten TSX sources and two shell workflows.
Success is announced only after Clipboard writeText resolves; unsupported/denied
access retains source selection and polite manual-copy guidance. Feedback does not
move focus. A specific code-panel status color prevents prose styles from lowering
feedback contrast; the browser audit also scans visible post-copy messages. Tests cover pending resolution, fallback, source equality and an
isolated two-instance rerender that retains focus and feedback. No library
interaction logic is implemented in the documentation page.

## Design, responsiveness and tradeoffs

The established light palette (#F8FAFC / #FFFFFF / #142B3B / #2563EB / #0D9488),
system typography, rem spacing, borders and focus treatment are reused. An adjacent
15rem navigation column gives the reference readable content width above 900px;
below it, navigation and content stack. Navigation is in normal flow instead of
sticky/fixed positioning, avoiding obscured or unreachable items at enlarged text.
No active-section tracking or JavaScript scroll system is necessary.

Code panels have contained horizontal/vertical scrolling and a 32rem maximum height.
Reference tables scroll in their own containers with a 28rem readable minimum width.
Grid children have min-width zero, preventing intrinsic code/table width from
expanding the document. A single long reference avoids extra public pages and
routing complexity; native anchors provide direct access. Full-text search, syntax
highlighting and content CMS dependencies are deliberately deferred.

## Reproduce validation

```sh
npm ci --cache work/npm-cache
npm run typecheck
npm run test:types
npm run lint
npm run format:check
npm test
npm run test:site
npm run verify:package
npm run build:playground
npm run build:site
node scripts/verify-site-build.mjs /
npm run build:site:pages
node scripts/verify-site-build.mjs /react-simple-charts/
npm run verify:site:snippets
npm pack --dry-run --cache work/npm-cache
git diff --check
```

Install the optional isolated browser tools without changing the root lockfile:

```sh
npm install --prefix work/consumers/driver --cache work/npm-cache --no-audit --no-fund playwright-core@1.64.0 @axe-core/playwright@4.13.0
npm run build:site
node scripts/serve-site.mjs
# Separate terminal while the root static server runs:
node scripts/verify-site.mjs
```

Stop that server before replacing site-dist and testing the project artifact:

```sh
npm run build:site:pages
node scripts/serve-site.mjs --base=/react-simple-charts/
# Separate terminal:
node scripts/verify-site.mjs --base=/react-simple-charts/
```

The static server mounts only actual emitted assets, without root mirroring or
SPA fallback. The existing audit still exercises all four pages and twenty gallery
interaction runs per base. Documentation adds fourteen native anchor navigations
at every width, ten TSX/two shell copying checks, keyboard order, named scroll
panels, contained code/table ArrowRight scrolling, unique IDs, real gallery deep
links, clipboard fallback, mobile/desktop screenshots, and an enlarged-text axe scan.
Screenshot/result evidence is ignored under `work/visual/site/{root,pages}/`.
Use RSC_BROWSER_PATH or RSC_SITE_URL to select another local browser/server.

## Executed outcomes

Local execution used Node 24.19.0 / npm 11.9.0, React/React DOM 19.3.0 and
TypeScript 6.0.3. The complete suite passes **1,103 tests across 51 files**, adding
**44 documentation tests** while retaining all 1,059 baseline tests. The focused
site suite passes **128 tests across four files**.

| Exact command                                              | Outcome                                                                       |
| ---------------------------------------------------------- | ----------------------------------------------------------------------------- |
| `npm run typecheck`                                        | Pass; site uses built-root declarations                                       |
| `npm run test:types`                                       | Pass; existing public contract suite                                          |
| `npm run lint`                                             | Pass, zero warnings                                                           |
| `npm run format:check`                                     | Pass                                                                          |
| `npm test`                                                 | 1,103 pass / 51 files                                                         |
| `npm run test:site`                                        | 128 pass / four files                                                         |
| `npm run verify:package`                                   | Five exports, root-only declarations, client boundary and external React pass |
| `npm run build:playground`                                 | Pass; technical playground preserved                                          |
| `npm run build:site`                                       | Pass; four static HTML entries and built-package import guard                 |
| `node scripts/verify-site-build.mjs /`                     | Pass; actual root HTML and assets                                             |
| `npm run build:site:pages`                                 | Pass; project-path static build                                               |
| `node scripts/verify-site-build.mjs /react-simple-charts/` | Pass; actual project-prefixed HTML and assets                                 |
| `npm run verify:site:snippets`                             | 32 strict TSX compilations: 22 interactive + ten documentation                |
| `npm pack --dry-run --cache work/npm-cache`                | Six allowed files; no site sources/datasets/output                            |
| `git diff --check`                                         | Pass                                                                          |

Chromium **151.0.7922.173**, Playwright Core **1.64.0**, axe Playwright **4.13.0**:
both actual build modes pass **16 page layouts**, **20 gallery interaction runs**,
**four documentation runs** and **25 axe scans each**, with zero violations and
no page, console or resource errors. Documentation checks all fourteen fragments
at 320/480/768/1200px, native heading focus, twelve current-source copy actions per
width, disabled/denied clipboard fallback, table/code scrolling and correct
single/two-column layouts. All four pages pass 320px / 200% root text enlargement;
a focused enlarged-text documentation axe scan also passes under reduced motion.

All four-page navigation, existing Home deep links and five documentation-to-gallery
links stay in the proper base. The project-path server uses an independent local
port (4321 in this run), mounts only the actual prefixed artifact, and returns 404
for unprefixed /examples/ and unknown paths. No root mirror or SPA fallback is used.

Mobile (320px) and desktop (1200px) documentation overview/code screenshots from
both builds were visually reviewed, including contained scrolling and the corrected
post-copy feedback contrast. Full-page captures at all four widths and enlarged
text captures are retained in ignored work. Native focus and source-table scroll
assertions complement the screenshots; manual screen-reader and cross-browser
validation were not performed. Existing nonfatal Rolldown client-directive warnings
remain; actual artifact/client-boundary verification passes.

The four remote Node/React CI outcomes and final PR HEAD are reported in the PR
and Development Lead handoff after pushing. Local React 19 checks do not stand in
for that matrix.

## Package isolation and remaining limits

No src, public contracts, pure geometry, runtime exports, styling defaults,
playground, dependency lockfile or package resolution changes are made. The only
manifest edit includes the new focused test file in test:site. Package identity
stays private 0.0.0, MIT, ESM root-only, external React peers and exactly five runtime
exports. The unchanged client banner and files allowlist remain verified; npm
packing excludes site source, documentation datasets and site-dist.

The heavyweight independent installed Vite/Next suite was **not rerun** because
public implementation, contracts, dependency resolution and package identity are
unchanged. M04 evidence remains its baseline; this task checks built-root site
consumption, strict samples and package safety directly. The unchanged four CI
jobs check Node 22/24 × React 18.2/19 at final PR HEAD.

The website still requires React JavaScript for content. Clipboard access depends
on browser permission/secure context. Library tiny-sector, clipping, estimated
label/custom-tooltip fitting, large SVG DOM cost and host CSS/CSP limits remain.
Chromium/axe and 200% root text enlargement do not establish manual screen-reader,
Firefox/WebKit, native browser zoom, physical touchscreen or production performance
validation. Deployment, release/publication and merging require separate review.
