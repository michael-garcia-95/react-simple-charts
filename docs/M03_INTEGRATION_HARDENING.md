# M03-T05 Cartesian integration hardening

## Scope and baseline

Base: `0d6c184b9b35f7bff14443da84f3187493727b0e`, retrieved by
`git fetch origin main` with shell network permission. Baseline: 649 passing
Vitest tests. This task stabilizes LineChart, AreaChart and BarChart together;
Pie/Donut, Milestone 04 and publication remain outside scope. Package stays
private 0.0.0 with unchanged public contracts, three runtime exports, external
React peers, ESM root entry and `use client`. No dependency or stylesheet added.

## Cross-family audit matrix

“Existing tests” below means suites actually rerun in this task, not new coverage.
The new browser audit uses the real playground and native ResizeObserver.

| Concern                    | Line                                         | Area                   | Bar                                                        | Evidence / interpretation                                                              |
| -------------------------- | -------------------------------------------- | ---------------------- | ---------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| Default name               | Line chart                                   | Area chart             | Bar chart                                                  | Existing rendering tests; supply meaningful application labels                         |
| Explicit dimensions        | Complete SVG                                 | Complete SVG           | Both orientations                                          | Existing geometry/Node SSR tests and installed Next consumers                          |
| Responsive dimensions      | Per-container observer                       | Same                   | Both orientations, grouped                                 | New five-container tests; browser 320/480/768/1200 → 320                               |
| Pending                    | Named placeholder/table                      | Same                   | Same                                                       | Existing SSR/hydration tests; no guessed server width                                  |
| Empty/unusable             | No marks; table retained                     | Same                   | Same                                                       | New state-transition tests, browser states and installed consumers                     |
| Source tables              | Caption, column/row headers                  | Same                   | Same                                                       | Source order, zero, signed, repeated, Missing/Invalid; existing cross-realm Date tests |
| Grid                       | Horizontal value grid                        | Same                   | Horizontal vertical-Bar grid; vertical horizontal-Bar grid | Pure layout tests and actual SVG checks                                                |
| Axes/formatters            | Category/number/date X, number Y             | Same                   | Physical numeric/category routing                          | Existing tests verify explicit formatter precedence and hidden axes                    |
| Colors/legend              | Ordered resolver                             | Same, fill opacity 0.2 | Same resolver                                              | Existing tests; actual screenshot review; no palette change                            |
| Inspection/default tooltip | Points/shared                                | Points/shared          | Rectangles/item                                            | Intentional; shared Bar remains opt-in; zero Bar controls retain true zero marks       |
| Keyboard                   | Roving source/series order                   | Same                   | Same in either orientation                                 | Real arrows/Home/End/Enter/Space/Escape/Tab/Shift+Tab; no focus activation             |
| Mouse/pen                  | Pointer classification                       | Same engine            | Same engine                                                | Existing interaction suites; real mouse, synthetic pen-compatible checks               |
| Touch                      | Touch release once                           | Same                   | Same                                                       | Packaged Chromium native touchscreen and delayed click deduplication                   |
| Assistive click            | Keyboard classification                      | Same                   | Same                                                       | Standalone synthetic click checks; not a manual screen-reader claim                    |
| Animation                  | Opt-in opacity only                          | Same                   | Same                                                       | Existing enabled/false/reduced-change/unsupported/cleanup tests; browser reduction     |
| SVG IDs/clips              | useId/exact plot clip                        | Same                   | Same                                                       | Sibling tests; three separately prefixed installed-package roots                       |
| SSR/hydration              | Explicit/UTC ready; local/responsive pending | Same                   | Categorical Date ready                                     | Browser-free SSR suites; Next App/Pages; Strict Mode independent roots                 |

The shared renderer normalizes original records, calls the pure Cartesian engine,
and dispatches exact marks. React does not generate ticks, modify numerical domains,
clamp source values or transpose horizontal Bar records. Inspection controls sit
outside decorative clipping. Tables consume classified source values, not geometry.
Source replacement invalidates old tooltip identity; an actually focused chart may
restore focus to its first eligible **new** record and show that record's tooltip.

## Demonstrated defects and focused corrections

1. At 320px, `NorthAmericaEnterpriseSubscriptions` exceeded the default tooltip's
   content width: client width 220px, scroll width 315px. The before screenshot
   shows text extending past the panel and chart. The content-box panel also added
   padding/borders beyond the 220px anchoring estimate. Use a 220px border-box panel
   and `overflow-wrap: anywhere`. Its outer size now matches the existing estimate;
   default long category/value text wraps without truncating source values.
2. The same category forced a visible semantic table wider than its container.
   Apply `overflow-wrap: anywhere` to both normalized and raw fallback visible
   tables. Automatic column layout and complete text remain; the hidden-table
   accessibility presentation is unchanged. This deliberately permits breaking
   long words, including narrow headers, rather than hiding data or adding scrolling.

Corrections apply through shared components to all three families. Tests assert
style policy and semantic content; real-browser checks independently assert actual
text and table bounds. No geometry, event classification, public tooltip context,
color token or core calculation changed. Arbitrary custom tooltip DOM may impose
its own width and still overflow; this is not a universal content-fitting promise.

## Exact new scenarios

`tests/cartesian-integration.test.tsx`: eight tests covering three simultaneous
families, stable unique clip/title IDs, independent tooltip selection and roving
entries, keyboard/synthetic-click deduplication, original activation identity,
parent rerenders, replacement records, empty → ready → unusable → ready, visible
normalized/raw tables, long content, five independent observers, repeated shrink/
grow, invalid measurements, table DOM retention, disconnect and late callbacks.
Existing tests retain animation/reduced-motion, formatter safety, dates, geometrical
paths/rectangles, partial clipping, source identity, interaction and hydration coverage.

`playground/Integration.tsx` adds five adjacent examples: Line, Area, vertical Bar,
horizontal Bar and grouped Bar. Shared signed data includes a zero, a missing
forecast and long category names. Controls select container widths, data counts,
empty/unusable states and reset the activation count; ordinary buttons surround
the charts. Existing playground examples retain gaps, singleton points, bounds,
Date/UTC/local-time and historical rendering probes.

`scripts/verify-integration.mjs` executes Chromium against that page. It verifies
five widths independently at 320, 480, 768, 1200 and back to 320; SVG dimensions,
visible tables, tooltip wrapping, focus strokes, actual keyboard navigation and
normal forward/backward Tab exits. Additional real-browser sequences verify hover without activation, mouse click, native touchscreen tap, synthetic pen PointerEvents, delayed touch compatibility clicks, standalone accessibility-style clicks, pointer cancellation and subsequent unrelated gestures, with exactly-once counts and explicit input-method assertions. It captures all five families with focus and
visible tooltips, full empty/unusable/ready states, forced colors and enlarged text.
Focused axe scans of ready, empty and unusable integration states: zero violations.
Console/page errors: zero. Reduced-motion emulation yields no running enhancements
following resize. Existing tests verify preference-change cancellation/cleanup.

`scripts/verify-consumers.mjs` preserves all prior Line/Area/Bar scenarios and adds
three narrow installed-package charts, actual overflow assertions, replacement/
empty/unusable transitions and a third independent prefixed hydration root for Bar.
All three roots use Strict Mode and categorical Dates. Both Next routers remain.
No consumer uses a source alias or workspace package link.

## Visual evidence and review

Ignored evidence: `work/visual/long-tooltip-before.png`,
`work/visual/integration/`, and `work/consumers/*/evidence/`.
Screenshots are intentionally excluded from commits and the npm files allowlist.
The browser script is the compact reproducible visual matrix:

| Capture pattern                                                                | Contents                                                                       |
| ------------------------------------------------------------------------------ | ------------------------------------------------------------------------------ |
| `{line,area,vertical,horizontal,grouped}-{320,480,768,1200}-focus-tooltip.png` | Signed geometry, zero baseline, narrow/wide layout, focus and wrapping tooltip |
| `state-{ready,empty,unusable}.png`                                             | All five families, data alternatives and state transitions                     |
| `forced-colors.png`                                                            | Chromium active forced-colors emulation                                        |
| `text-200-percent.png`                                                         | 200% inherited text on the fixture                                             |
| `results.json`                                                                 | Browser version, checks and three-repeat measurements                          |

Actual inspected images include before/fixed Line, fixed Area, vertical, horizontal and grouped Bar at 320px, Line at 1200px, empty/unusable states, forced colors and enlarged text. Required controls, signs,
Area boundary/fill and grouped series treatment are consistent. Tables and tooltip
text now wrap. Secondary gridlines remain light, typography matches across families,
and focused SVG boundaries remain visible. Long category ticks can be omitted by
existing conservative tick fitting; the complete names remain in the table/tooltip.
Narrow table headers can break within words, accepted in exchange for no overflow.

Forced colors is an **emulated feature of Chromium**, not another executed browser.
Text/tooltip use black on white in this run; horizontal focus outline resolves to
`rgb(7, 89, 133)`. Marks retain ordinary SVG colors while legend swatches disappear
under forced-color adjustment. Labels/tables persist, but series differentiation
is not proven for arbitrary user palettes or operating-system themes. No change
was made to the approved color behavior on this limited evidence; native Windows
high-contrast evaluation remains necessary before claiming support.

Text enlargement used `#integration { font-size: 200% }`: table text resolved to
32px, tooltip outer width remained 220px in a 480px figure. Text wraps and remains
readable, but the taller tooltip can overlap the table below. SVG tick sizes remain
explicit pixel sizes. This technique does **not** reproduce native browser zoom,
os accessibility text scaling or 200% WCAG reflow; those remain unverified.

## Performance characterization

Same Chromium page, Vite development React 19 build, five responsive charts and
visible tables, three repeated measurements for each row count. Final recorded run was performed after local tests and consumer builds finished, without concurrent validation workloads. Line/Area and
single Bars have one series; grouped Bar has two. Update timing spans changing
three source records to N records and two animation frames; resize timing spans
a 480↔768 container change and three frames. These include React, layout, painting,
observer delivery and frame scheduling, not isolated component CPU time or a
production benchmark. No baseline performance improvement/regression is claimed.

| Rows per chart | Update samples (ms)   | Resize samples (ms)      | Decorative marks by Line / Area / single Bar / grouped Bar | Controls across five charts |
| -------------- | --------------------- | ------------------------ | ---------------------------------------------------------- | --------------------------- |
| 10             | 46.9 / 55.9 / 32.5    | 81.2 / 53.6 / 39.4       | 11 / 12 / 10 / 20                                          | 60                          |
| 100            | 87.0 / 74.7 / 79.5    | 250.7 / 138.6 / 137.0    | 101 / 102 / 100 / 200                                      | 600                         |
| 1000           | 682.2 / 790.4 / 646.7 | 1307.5 / 1244.9 / 1148.5 | 1001 / 1002 / 1000 / 2000                                  | 6000                        |

Large cases have roughly 6000 decorative marks plus 6000 SVG controls and thousands
of table cells. Normalization/layout/geometry and lookup arrays/maps scale with
rows × series; source renderer recomputes geometry on rerender. No heap profiler
or allocation count was collected. Dense development-page costs warrant a future
production profiling budget, not speculative caching or decimation in this task.
Proposed: benchmark 100/1000 observations per production chart on agreed hardware,
record median/p95 update and resize plus DOM/heap cost, then approve budgets and
prioritize safe recomputation reductions. No pass threshold is imposed here.

## Reproduction and validation

```sh
npm run typecheck
npm run test:types
npm run lint
npm run format:check
npm test
npx vitest run tests/cartesian-integration.test.tsx
npm run verify:package
npm run build:playground
npm_config_cache=work/consumers/npm-cache npm pack --dry-run
git diff --check
node scripts/verify-consumers.mjs
# After consumer suite installs its optional driver under ignored work/:
npm run dev -- --host 127.0.0.1
# Another terminal:
node scripts/verify-integration.mjs
```

The managed environment needs `sandbox_permissions: with_additional_permissions`
with `additional_permissions.network.enabled: true` on Git/network/browser-server
shell calls. No Git configuration, proxy variables or credentials were changed.
The default network context failed at the proxy; explicitly permitted Git fetch
and local server/browser execution work. The consumer script uses its writable
`work/consumers/npm-cache` and installs the freshly packed genuine archive.

| Command                                                        | Result                                                                  |
| -------------------------------------------------------------- | ----------------------------------------------------------------------- |
| `npm run typecheck`                                            | Pass                                                                    |
| `npm run test:types`                                           | Pass                                                                    |
| `npm run lint`                                                 | Pass, zero warnings                                                     |
| `npm run format:check`                                         | Pass                                                                    |
| `npm test`                                                     | 657 tests pass, 35 files; 649 retained + 8 new                          |
| `npx vitest run tests/cartesian-integration.test.tsx`          | 8 pass separately; integration + playground combined run: 10 pass       |
| `npm run verify:package`                                       | Pass: actual exports, declarations, ESM/client boundary, external React |
| `npm run build:playground`                                     | Pass                                                                    |
| `npm_config_cache=work/consumers/npm-cache npm pack --dry-run` | Pass, six allowed files                                                 |
| `git diff --check`                                             | Pass                                                                    |
| `node scripts/verify-consumers.mjs`                            | Four genuine combinations pass, including both Next routers             |
| `node scripts/verify-integration.mjs`                          | Chromium browser assertions and three state-specific axe scans pass     |

Final validation and artifact results are recorded in
[consumer compatibility](CONSUMER_COMPATIBILITY.md). GitHub CLI REST access returned
`Forbidden`; the connected GitHub tool remains the supported route for PR/CI reads.
All four Node 22/24 × React 18.2/19 jobs passed on implementation commit `a0b723f1a7625ec9521f1a84c8a46b62d8874ff7`; exact resolved versions and CI run evidence are recorded in consumer compatibility. Subsequent commits still require their own green CI before merge review.

## Remaining risk register and proposed support policy

| Status                    | Risk / next action                                                                                                                                                                               |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Fixed                     | Long default tooltip text, tooltip content-box mismatch and visible source-table overflow                                                                                                        |
| Accepted current contract | Estimated tick/title omission, clipped endpoint markers, overlapped targets, dense tiny Bars, arbitrary custom tooltip height/width, locale-sensitive custom formatters                          |
| Accepted current contract | Explicit dimensions are caller sizing instructions; responsive SSR does not guess widths; absent ResizeObserver keeps accessible placeholders                                                    |
| Unverified                | Manual NVDA/JAWS/VoiceOver/Orca announcements and table navigation; no operable supported screen reader available here; axe/DOM is not manual testing or WCAG certification                      |
| Unverified                | Firefox/WebKit executable environments absent; no additional large binaries installed                                                                                                            |
| Unverified                | Native browser zoom, OS text scaling, real Windows forced-color themes, arbitrary host styles and strict CSP                                                                                     |
| Proposed                  | Chromium is the executed reference browser; propose current stable Chromium/Firefox/Safari with required ResizeObserver, SVG and ES2022 support, pending execution and Development Lead approval |
| Proposed                  | Production performance budgets and real-device dense-data investigation before considering future decimation/virtualization                                                                      |
| Requires approval         | Broader support policy, any color-token/theme changes, publication/versioning, future-family APIs and Milestone 04                                                                               |

Manual cross-browser checklist: open the integration playground, visit every width
and shrink/grow again, inspect all five shapes/signed baselines and visible tables;
Tab through before/after controls, arrows/Home/End, Enter/Space/Escape and Shift+Tab;
mouse/pen click and touchscreen tap once, then an unrelated keyboard action; switch
empty/unusable/ready and data; resize while inspecting; test reduced motion and
preference changes; run the packed Vite/Next fixture with explicit/responsive/Date
SSR and independently prefixed roots; inspect hydration console, unique references,
CSS variables, forced colors on the real OS and native 200% zoom. Record browser,
OS, input device and actual screen reader separately. Do not infer passes from
Chromium results. No merge, release, publication or production-readiness claim.
