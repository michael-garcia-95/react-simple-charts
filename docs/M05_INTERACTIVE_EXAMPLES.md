# M05-T02 — Interactive examples and code playground

Required and verified base: `b9aeec10a941c94b9c943506a87f41867743c7c7` (merged
M05-T01 / PR #18). The fresh baseline passed **992 tests across 48 files**.
Work is isolated on `feat/m05-t02-interactive-examples`; deployment, publication,
merge and M05-T03 remain outside this task.

## User experience and layout

Examples keeps all five chart families on one page. A native family jump list
and the Home links reach the established `#chart-line`, `#chart-area`, `#chart-bar`,
`#chart-pie` and `#chart-donut` articles. Each article contains a family/title,
short explanation, labeled controls, actual responsive chart, full source-data
alternative, selectable TSX code, Copy code and Reset.

Cards span the content width. Settings sit beside the preview above 768px and
stack at narrower sizes. Code sits underneath in the existing monospace panel,
with a language label, copy button and contained horizontal/vertical scrolling.
The panel is bounded to 26rem so all five families stay approachable without
hiding their code. The approved light palette, typography and spacing are reused.
Home, Documentation, About, static HTML metadata and the technical playground
remain intact. No dependency or design system is added to the product.

## Fictional deterministic presets

| Family | Initial preset                                  | Alternative                                   | Educational difference                                                                        |
| ------ | ----------------------------------------------- | --------------------------------------------- | --------------------------------------------------------------------------------------------- |
| Line   | Monthly revenue (month/revenue/forecast)        | Website traffic (week/visits/returning)       | Different units and mappings; missing visits form a gap, not zero; either supports two series |
| Area   | Monthly growth (month/change/target)            | Running performance (session/distance/target) | Signed percentage-point changes, including zero, versus positive km measured from zero        |
| Bar    | Actual versus forecast (month/revenue/forecast) | Category comparison (category/orders)         | Grouped series versus single categories, with zero and missing orders retained                |
| Pie    | Revenue distribution (name/value)               | Customer segments (segment/customers)         | Percent shares versus customer counts, including a zero segment                               |
| Donut  | Budget allocation (department/budget)           | Project distribution (project/hours)          | Dollar budgets versus planned hours, including an unestimated project                         |

Presets remain stable arrays; updates never generate random values or request
network data. Polar presets contain no negatives. Missing and zero observations
stay in the complete library tables even when they draw no mark.

## Controls and defaults

Every card starts with its initial dataset, legend enabled, visible source table,
animation disabled and tooltip enabled. Cartesian grids start enabled; Bar starts
vertical; polar labels start off; Donut starts at ratio 0.6. Reset replaces the
entire settings object with these defaults for that card.

Shared controls are Dataset, Show legend, Show source table, Enable animation,
Show tooltip and Reset. Table presentation routes exclusively through
`accessibility.dataTable: 'visible' | 'visually-hidden'`; the table is never removed.
The library renders Cartesian legends only with multiple series. The Line/Bar
note explains why a single-series example needs no visible key.

Line and Area add grid and single/two-series comparison. Area compares actual
changes or distances with a target; the fills remain independent and unstacked. Bar adds grid and
vertical/horizontal orientation. Pie adds slice labels. Donut adds slice labels
and 0.4/0.6/0.8 inner-radius ratios. The library may omit labels where its existing
conservative fitting rules find insufficient room; the UI explains this.

Arbitrary geometry, axis bounds, callbacks, tooltip renderers, smoothing, stacking,
colors and scale editors are omitted: they would add complexity beyond the
approved introductory experience. No public library API is added.

## State, rendering and TypeScript

Each `InteractiveExample` owns ordinary React state. Updating a native control
replaces one property on that card's settings; sibling states and chart identities
remain intact. There is no global store, persistence, custom setting URL, account
or storage. URLs identify pages and existing gallery anchors only.

`LiveExample` explicitly selects each typed dataset and passes it to the
Cartesian or polar preview. Preset mappings satisfy public key/series types for
the original records. Generic preview helpers use genuine root imports from
`react-simple-charts`; they do not spread an incompatible union of record types
into JSX or use broad casts. Bar orientation narrows to its approved branch.
TypeScript checks both the site and the real emitted package declarations.

The library owns geometry, normalization, tooltips, source/series/segment identity,
keyboard/pointer/touch behavior, responsive observation, useId and animation.
Source data references are stable across presentation updates, preserving chart
focus when possible. Source replacement follows existing library focus recovery;
Bar can focus a new valid observation and show its fresh tooltip. No stale values
are retained and no extra focus trap or forced control focus is added.

## Source strategy and accuracy

`example-code.ts` selects the same preset and reads the same state as the live
preview. Known small records are formatted one per line with deterministic JSON values;
series use deterministic JSON;
readable, explicitly authored JSX templates supply approved props. Snippets include
the component import, complete small data declaration, mappings, height, selected
controls, accessible label/description/table mode and an exported React function.
Bar orientation and Donut ratio/center content are explicit. No undeclared data or
style variable is needed in another React/TypeScript consumer.

Formatter functions pair with explicitly authored source templates. Functions
are never serialized. No eval, new Function, runtime JSX compilation, arbitrary
JavaScript entry or remote sandbox is used. Focused tests assert current code after
preset and setting changes. `verify:site:snippets` generates 22 combinations covering
all ten presets, every shared setting, multi-Line/Area, horizontal Bar, polar labels and
all three Donut ratios, then compiles them against the built public root using
TypeScript. It checks source syntax and prop types, not execution of user code.

## Clipboard and accessibility

Copy calls `navigator.clipboard.writeText` only from the button action, with the
currently visible string. Success waits for the promise to resolve. Missing or
denied Clipboard API access produces a polite, atomic status message inviting
manual selection/copying. The code remains selectable and its scrolling panel is
keyboard focusable. Feedback never moves focus. Old feedback is hidden when code
changes, and an older request cannot overwrite a newer request's result.

Controls are native labeled checkboxes/selects in a family-named fieldset. Focus
styling is inherited from the baseline, targets have at least 44px height, and
logical DOM order is settings → chart entry → copy → code. Arrow keys/Home/End,
Escape and normal Tab departure remain library behavior. SVG names track the
selected dataset; useId references remain unique. Tables and missing classifications
stay available. Reduced-motion preferences suppress the library's brief opacity
animation and site transitions. No WCAG certification is claimed.

## Base paths and builds

`site/paths.ts` is the single authority for internal links and page detection,
using Vite `BASE_URL`. It preserves external and fragment-only links. Unknown,
nested or lookalike paths fail safely. Four directory HTML entries remain; no
React Router/Next.js or SPA routing fallback is introduced.

`build:site` is root-based; `build:site:pages` uses `/react-simple-charts/` via Vite's
CLI. Both output only to `site-dist/`. All four CI jobs verify both emitted modes
and generated snippets without deploying. See [GitHub Pages plan](GITHUB_PAGES_PLAN.md)
for the approved host, expected URL and proposed inactive future workflow.

## Reproduce browser verification

```sh
npm install --prefix work/consumers/driver --cache work/npm-cache --no-audit --no-fund playwright-core@1.64.0 @axe-core/playwright@4.13.0
npm run build:site
node scripts/verify-site-build.mjs /
node scripts/serve-site.mjs
# Separate terminal:
node scripts/verify-site.mjs
```

Stop the root server before building and serving the Pages artifact:

```sh
npm run build:site:pages
node scripts/verify-site-build.mjs /react-simple-charts/
node scripts/serve-site.mjs --base=/react-simple-charts/
# Separate terminal:
node scripts/verify-site.mjs --base=/react-simple-charts/
```

The local static server mounts real built directories without root mirroring or
history fallback. Browser dependencies, generated snippet fixtures and screenshots
remain ignored in `work/`. Restricted environments require command-level network
permissions for installation, local server and Chromium; no proxy/credential
configuration is changed. Audit results are recorded below after execution.

## Known limitations and future improvements

React JavaScript is required for content; static metadata remains pre-JavaScript.
Clipboard availability depends on secure context and browser permission. Labels,
narrow-axis omission, tiny-sector pointer targets and approximate tooltip placement
retain the existing library limits. The small preset selection is intentionally
bounded. The code generator must be updated alongside any future preview prop.

Future polish includes syntax highlighting only if justified, expanded tutorials,
manual screen-reader and broader browser review, native zoom/touch-device review,
and production performance measurement. Firefox, WebKit, physical touchscreen,
manual screen-reader and native browser zoom passes are not implied by Chromium
or 200% root text enlargement. Live hosting needs separate approval and settings;
the package remains private at 0.0.0 with exactly five runtime exports.

## Executed local validation and browser findings

Local environment: Node 24.19.0, npm 11.9.0, React/React DOM 19.3.0,
TypeScript 6.0.3. All 992 baseline tests are retained. Final full suite:
**1059 tests across 50 files**, adding 67 focused tests. The site-only command
passes **84 tests across 3 files** (17 foundation, 54 interactions, 13 path checks).

| Exact command                                               | Result                                                                                           |
| ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| `npm run typecheck`                                         | Pass, real built-root declarations                                                               |
| `npm run test:types`                                        | Pass                                                                                             |
| `npm run lint`                                              | Pass                                                                                             |
| `npm run format:check`                                      | Pass                                                                                             |
| `npm test`                                                  | 1059 pass / 50 files                                                                             |
| `npm run test:site`                                         | 84 pass / 3 files                                                                                |
| `npm run verify:package`                                    | Pass: five runtime exports, root-only ESM, generic declarations, client boundary, external React |
| `npm run build:playground`                                  | Pass; technical playground intact                                                                |
| `npm run build:site`                                        | Pass; four HTML entries and built-root/source-import guard                                       |
| `node scripts/verify-site-build.mjs /`                      | Pass: root HTML and JS/CSS assets                                                                |
| `npm run build:site:pages`                                  | Pass; Vite project base, four HTML entries                                                       |
| `node scripts/verify-site-build.mjs /react-simple-charts/`  | Pass: project-base HTML and JS/CSS assets                                                        |
| `npm run verify:site:snippets`                              | 22 generated TSX variants compile against the built public root                                  |
| `npm pack --dry-run --cache work/npm-cache`                 | Six allowed files, no site source/datasets/assets/output                                         |
| `git diff --check`                                          | Pass                                                                                             |
| `node scripts/verify-site.mjs`                              | Root production Chromium audit passes                                                            |
| `node scripts/verify-site.mjs --base=/react-simple-charts/` | Actual subpath production Chromium audit passes                                                  |

Package identity stays `react-simple-charts`, private `0.0.0`, MIT, ESM-only,
root-only exports, React 18.2/19 peers and external runtime. No library source,
pure geometry, normalization, chart interaction, lockfile or technical playground
files are changed. Existing nonfatal bundler client-directive warnings remain;
the built banner and package verifier pass. No new runtime dependency is added.

Chromium **151.0.7922.173**, Playwright Core **1.64.0**, axe Playwright **4.13.0**:
each build mode passes 16 page layouts (four pages × 320/480/768/1200px),
20 family interaction runs (five families × four widths) and 20 axe scans
(default pages plus changed gallery controls), with **zero violations** and
**no console, page or resource errors**. The audit exercises keyboard preset
selection, every shared setting, Line/Area series, grid, actual Bar orientation,
polar labels, all Donut ratios, current-code synchronization, real native clipboard
write/read, unsupported/denied fallback, reset, sibling independence, complete
source alternatives, chart keyboard inspection and normal navigation.

Reduced-motion media suppresses animation requests for every family and removes
site transitions. All four pages pass 320px / 200% root text enlargement without
document overflow. Home/gallery full-page screenshots at every width, focused
Line screenshots at every width and wide Area/Bar/Pie/Donut captures were inspected.
No clipping of form controls or unintended document overflow was found. Code
intentionally scrolls inside its bounded panel; narrow-axis label omission and
polar label-fit omissions retain the library's documented behavior.

The project-path server mounts only `/react-simple-charts/`; Chromium navigates
all four native page links and every Home family deep link, validates current-page
navigation and asset requests, and confirms `/examples/` and unknown directory
paths return 404. This establishes local subpath compatibility without assuming
Pages is enabled or performing a deployment.

The four GitHub CI jobs remain Node 22 / React 18.2, Node 22 / React 19,
Node 24 / React 18.2 and Node 24 / React 19. Each now checks snippets and both
site build modes. Final-head remote outcomes are reported on the PR and in the
task handoff; local React 19 evidence alone is not claimed as matrix evidence.
The expensive independent installed Vite/Next consumer matrix was **not rerun**:
this task changes only site/QA/docs/CI, with no library contracts, peers, package
resolution or runtime changes. M04 remains that matrix's baseline; direct site
consumption and package safety are verified here.

No known unresolved implementation defect was found in the exercised scope.
Manual accessibility/broader-browser checks and future deployment prerequisites
remain the limitations described above. No merge, deployment, release or
publication occurred.

## M05-T04 integration audit follow-up

The later [website hardening audit](M05_WEBSITE_HARDENING.md) reproduces and
corrects a copy-feedback gap: source equality alone allowed an old completed or
pending result to reappear after switching datasets and Reset. Feedback now
belongs to a source revision and the latest request; focus remains unchanged.
Site CSS also contains chart/code focus outlines inside clipping boundaries.
New regressions reset every family while retaining already modified siblings.
The historical M05-T02 outcomes above are preserved; current evidence is in the
M05-T04 report.
