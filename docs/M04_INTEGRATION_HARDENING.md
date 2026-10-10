# Five-chart integration and hardening — M04-T04

## Status and exact baseline

Starting main: `2c10f9b020049f11c9732b2efcae1ec49e210e3c`.
The required merged baseline was fetched, verified and rerun: **930 tests / 44 files**.
Work is isolated on `feat/m04-t04-five-chart-hardening`. No merge, release,
publication or deployment is authorized by this report.

**IMPLEMENTED:** combined public playground; focused shared-page tests; bounded
Chromium/performance runner; three narrow Cartesian presentation corrections.
Exactly five root runtime exports remain: LineChart, AreaChart, BarChart,
PieChart and DonutChart. Types, inference, callbacks, defaults, dependencies,
pure geometry, package ownership/license and client boundary are unchanged.

**VERIFIED:** automated unit, source-contract, SSR/hydration and installed-package
checks are recorded below. GitHub CI is a separate final-PR-HEAD gate; its four
job outcomes belong to the final task report, never inferred from local results.

**OBSERVED:** screenshots and development-mode timing samples describe this
container/browser run; they do not establish production performance budgets.

**UNVERIFIED:** manual screen readers, genuine Firefox/WebKit, native device
accessibility/touch and native browser zoom. Chromium touchscreen input and
forced-colors/reduced-motion media are emulations; pen and standalone clicks
are synthetic. Automated axe scans are not manual accessibility approval or
complete WCAG conformance.

**DEFERRED:** public demo website/portfolio, wider browser support policy,
performance budgets and public release. No new chart capabilities are added.

## Five-family comparison matrix

Each column describes the approved contract audited against actual source,
existing family regressions, combined tests and representative browser cases.
“Cartesian” refers only to Line/Area/Bar; differences are intentional.

| Check                        | Line                                                                                             | Area                         | Bar                                            | Pie                                                   | Donut                                      |
| ---------------------------- | ------------------------------------------------------------------------------------------------ | ---------------------------- | ---------------------------------------------- | ----------------------------------------------------- | ------------------------------------------ |
| Root import / JSX            | Generic actual component                                                                         | Same                         | Same; physical horizontal axes                 | Generic name/value                                    | Same plus ratio/center                     |
| SVG/name                     | Named interactive group, unique title/description                                                | Same                         | Same                                           | Same                                                  | Same; center separately meaningful         |
| Explicit dimensions          | Deterministic clipped paths                                                                      | Fills and visible boundaries | Rectangles, zero hit targets                   | Filled circle                                         | Ring, ratio defaults to 0.6                |
| Responsive/pending           | Local observer; named placeholder/table                                                          | Same                         | Same                                           | Same                                                  | Same; center appears only when ready       |
| Empty/unusable               | No inspection; table retained                                                                    | Same                         | Same                                           | Same; negative rejected                               | Same; no orphan center                     |
| Invalid mappings/values      | Mapping failure unavailable; missing gaps                                                        | Same, signed zero baseline   | Missing/invalid excluded; signed/zero retained | Zero/missing/invalid classified; positive proportions | Same pure engine                           |
| Source identity/table        | Original row and series order                                                                    | Same                         | Same; duplicate category slots                 | Original row IDs/order, duplicate labels              | Same                                       |
| Color/legend                 | Resolved series index; wrapped legend                                                            | Same                         | Same                                           | Original source-index color                           | Same, ring label fitting                   |
| Tooltip defaults             | Shared                                                                                           | Shared                       | Item; shared supported                         | Segment, engine percentage                            | Same, geometry-safe ring anchor            |
| Keyboard                     | One roving entry, arrows/Home/End; Enter/Space activate; Escape dismiss                          | Same                         | Same                                           | Same                                                  | Same plus legitimate center Tab stops      |
| Hover / pointer / touch      | Inspection without hover activation; exactly-once local gesture state                            | Same                         | Same                                           | Filled center can activate                            | Hole/center button cannot activate ring    |
| Source replacement           | Rebuild model, retire old selection; restore safe focus                                          | Same                         | Same                                           | Preserve a valid source slot or restore safe slot     | Same                                       |
| Animation                    | Static default; optional 180ms opacity                                                           | Same                         | Same                                           | Same                                                  | Same; ratio updates cancel old enhancement |
| SSR/hydration                | Explicit SVG; responsive matching placeholder; local-time timezone caveat                        | Same                         | Same explicit/responsive policy                | Browser-free deterministic polar SVG                  | Same with center content                   |
| Multiple siblings/roots      | Local IDs/observer/selection/animation                                                           | Same                         | Same                                           | Same                                                  | Same                                       |
| Focus / overflow / fallbacks | Focus survives sibling rerenders/hover; table/legend/tooltip wrap; inline CSS variable fallbacks | Same                         | Same                                           | Polar legend/tooltip already bounded                  | Same; circle scaling and center alignment  |

## Implementation boundaries and technical walkthrough

Public wrappers normalize caller records and compose pure geometry with the
shared Cartesian or polar renderer. The complete source model drives table
rows and classifications; drawable observations drive marks and inspection.
No array is sorted or mutated in place. Category duplicates and polar excluded
rows therefore do not renumber callback/source identity.

Cartesian paths retain gaps, Area uses the established positive/negative/zero
baseline, and Bar retains grouped slots, signed rectangles and horizontal
physical-axis mapping. Existing category/linear/UTC/local-time, domain/clipping,
zero-hit-target and series-order tests remain green. Polar geometry retains
positive proportions, full circles/rings, tiny positive slices, negative-value
rejection and original source-index colors. Percentage payloads still come from
the engine, not formatted text. No pure-core or axis calculation changed.

Each component owns its useId references, selection, gesture controller,
roving focus state, ResizeObserver and optional animation. The focused key
controls the Tab entry even while another observation is hovered. Tooltip
selection can change independently of actual DOM focus; movement does not
activate records. Source replacement checks current model references and
retires old selections. Tables stay mounted during pending, empty and unusable
states. Observer cleanup ignores late notifications after unmount.

## Reproduced defects and corrections

1. **Cartesian focused entry moved during hover.** In real Chromium, focus the
   first control and hover a later control: the focused control became
   `tabindex=-1`, the hovered control became `0`, and the focus outline became
   transparent. Cartesian inspection now gives the focused key precedence,
   matching existing polar behavior, and draws its outline independently of
   tooltip input method. Three-family failing cases and five-family sibling
   tests verify the correction without changing activation/navigation rules.
2. **Long Cartesian legend overflow.** A 208px figure with long unbroken series
   names and no inherited caller wrapping produced 339px scroll width. Legend
   items now use minimum width zero, maximum width 100% and anywhere wrapping,
   matching the established polar legend containment. No palette/theme changed.
3. **Constrained fixed-SVG tooltip overflow.** With width=640 and caller CSS
   maxWidth=100% inside a 208px figure, the Cartesian tooltip started at 420px
   and ended beyond the figure. Its horizontal CSS clamp now uses the rendered
   figure width, as the existing polar presentation does. Three focused tests
   verify the bounds rule; Chromium verifies actual rendered tooltip rectangles.

The fixture's unusable datasets contain Infinity/NaN Cartesian observations
(classified Invalid in tables; no drawable chart data) and negative polar values
(unavailable rendering, original negative values retained). These expected
family-specific states are not forced into identical wording.

These are user-visible presentation corrections. Fixed SVG dimensions remain
numeric geometry inputs. CSS max-width scales their viewBox without changing
geometry; the default maxWidth=100% bounds figures. A caller overriding that constraint
(e.g. maxWidth:none) with a fixed width can intentionally exceed a narrow parent
and must provide scrolling or containment.

## Regression and browser procedures

New tests live in `tests/five-chart-{integration,ssr,hydration}.test.tsx`:
**45 focused tests**. They exercise five ready siblings, unique IDs/tables,
immutable sources, independent focus/tooltips, all activation payloads,
mouse/pen/touch/accessibility-style sequences, delayed compatibility clicks,
source replacement during pending touch gestures, custom tooltip/color agreement,
cancellation, source replacement, empty/unusable transitions, independent
observers, parent rerenders, Donut center controls, reduced motion, animation
cancellation, Node SSR and two prefixed Strict Mode hydration roots.
Mixed explicit/responsive copies of every family are tested together.
Existing per-family tests remain the detailed geometry/malformed-input/custom
renderer/timezone/ratio/label-fitting authority rather than duplicated suites.

Reproduce from the repository:

```sh
npm ci
node scripts/verify-consumers.mjs
npm run dev -- --host 127.0.0.1
# In a second shell:
node scripts/verify-five-charts.mjs
npx vitest run tests/five-chart-integration.test.tsx tests/five-chart-ssr.test.tsx tests/five-chart-hydration.test.tsx
```

Consumer verification installs the ignored Playwright/axe driver and uses the
available `/usr/bin/chromium`; `RSC_BROWSER_PATH` overrides its executable.
`RSC_SMOKE_URL` overrides the server origin. Evidence is ignored under
`work/visual/five-charts/`, consumers under `work/consumers/`.

A compact 1200×1600 viewport capture shows all five graphics simultaneously,
with source tables toggled visually hidden but retained. The isolated
`/?five-charts` fixture runs widths 320/480/768/1200 plus repeated
shrink/grow transitions. It checks five independent measured SVGs, separate
parent widths, bounds/overlap, tables, long legends/tooltips, ordinary Tab/Shift
Tab entry/exit, all navigation keys, focus retained through hover, mouse and
native Chromium emulated-touch input, synthetic pen/accessibility clicks,
center-button exclusion and a separately hit-tested exposed ring hole, filled Pie center, independent source replacement,
empty/unusable states, constrained fixed SVGs, circular scaling/Donut alignment,
console/page errors and representative axe scans. Reduced-motion/forced-colors
media and enlarged text are emulations. Screenshots are inspected visually and
are not packaged or committed.

## Validation results

Local runtime: Node 24.19.0 / npm 11.9.0; Vitest 5.0.3. The full suite passes
**975 tests / 47 files**, adding **45 tests** to the verified 930-test baseline,
including all 657 M03 foundation regressions. The focused three-file suite passes
45/45 separately. The playground's two existing checks are updated for current
status text and five additional source tables; no baseline test is removed.

| Command                                                                                                                | Result                                                       |
| ---------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------ |
| npm run typecheck                                                                                                      | Pass                                                         |
| npm run test:types                                                                                                     | Pass                                                         |
| npm run lint                                                                                                           | Pass                                                         |
| npm run format:check                                                                                                   | Pass                                                         |
| npm test                                                                                                               | 975 pass / 47 files                                          |
| npx vitest run tests/five-chart-integration.test.tsx tests/five-chart-ssr.test.tsx tests/five-chart-hydration.test.tsx | 45 pass / 3 files                                            |
| npm run verify:package                                                                                                 | Pass; client banner/external peers/root exports/declarations |
| npm run build:playground                                                                                               | Pass                                                         |
| npm pack --dry-run                                                                                                     | Pass, six allowed files                                      |
| git diff --check                                                                                                       | Pass                                                         |
| node scripts/verify-consumers.mjs                                                                                      | All four genuine consumers pass                              |
| node scripts/verify-five-charts.mjs                                                                                    | Combined Chromium audit and bounded measurements             |

The fresh consumer matrix: Vite 8.3.4 / React 18.2.0; Vite 8.3.4 / React 19.3.0;
Next 14.2.35 / React 18.2.0; Next 16.4.0 Webpack / React 19.3.0. Every project
installs the newly packed archive independently. Installed ESM matches the built
bytes, React remains an external peer, strict installed declarations and generic
JSX inference pass, production builds run, and App/Pages Router client boundaries,
explicit SSR, responsive hydration, multiple prefixed roots, all-five interactions,
center controls, tables and tooltips pass without browser/hydration errors.
Representative consumer axe scans report zero violations. Vite's result flag for
framework SSR remains false: its separate Node SSR/prefixed-root checks execute
in the runner; it is not represented as a Next-style framework SSR route.

Consumer artifact measurements (bytes, development task run; Next totals include
framework chunks, not library-only cost):

| Artifact                |       Raw |               gzip |
| ----------------------- | --------: | -----------------: |
| Genuine tarball         |    80,252 | Already compressed |
| Installed ESM           |   106,382 |             23,382 |
| Vite / React 18 app JS  |   253,030 |             79,814 |
| Vite / React 19 app JS  |   332,653 |            102,588 |
| Next 14 static JS total |   896,921 |            278,065 |
| Next 16 static JS total | 1,142,537 |            353,752 |

Executed browser tools: Chromium 151.0.7922.173, Playwright Core 1.64.0,
axe-core / axe Playwright 4.13.0. The combined audit includes eight axe scans
(ready narrow/wide repeated transitions, empty, unusable and forced-colors with
reduced motion), with zero violations. Automated scans check their supported DOM
rules only. Screenshot inspection confirms wrapped source fields and legends,
visible focus/tooltips and circular polar graphics. Long table fields wrap heavily
at narrow widths; constrained fixed geometry intentionally appears smaller.
The isolated fixture wraps its heading and bounds spacing by viewport width so
200% text does not create horizontal page overflow. Historical fixture layout
is retained through an unstyled labeled region.

## Performance characterization

The browser runner uses deterministic 100 and 1000-row datasets, two Cartesian
series (including missing forecast observations), grouped Bar and positive polar
allocations. Three repetitions measure mount, parent data update and independent
width change through at least two animation frames and a gate requiring ready
SVGs with current measured widths. Every sample changes the selected width;
requested source-row counts are asserted. Cases include all five together and
one ready family with other families empty. It records median/min/max elapsed
milliseconds and per-family SVG-control/mark/table-row counts.

These are Vite development/React Strict Mode measurements including React,
layout, paint scheduling and fixture overhead, not isolated pure-engine CPU
benchmarks or production budgets. Dense tables remain unvirtualized. Other
empty siblings retain accessibility scaffolding in individual cases. No reliable
browser-memory method is used; host/container memory metadata is context only.
No caching, grouping, decimation or virtualization was added to the library.

Execution context: Linux x64, exposed AMD EPYC 9V74 processor model, three
reported logical CPUs, cgroup CPU quota 200000/100000 (two CPU equivalents),
10,452,496,384 bytes reported host memory. This describes the exposed container
context, not dedicated physical hardware. Firefox/WebKit driver executable paths
were absent; no additional browser downloads were attempted.

### Observed bounded run

Times below are milliseconds: median [minimum–maximum], three repeats.

| Rows | Ready families |                  Mount |            Data update |                 Resize |
| ---: | -------------- | ---------------------: | ---------------------: | ---------------------: |
|  100 | all            |    110.9 [106.1–136.5] |    109.9 [100.3–118.6] |    539.6 [452.4–597.3] |
|  100 | line           |       34.1 [31.9–34.8] |       25.3 [23.9–31.3] |       38.6 [34.5–41.5] |
|  100 | area           |       34.5 [33.9–70.7] |       25.2 [24.5–56.5] |       46.0 [39.0–86.3] |
|  100 | bar            |       39.1 [35.7–68.5] |       32.6 [25.4–52.8] |       44.6 [39.4–87.6] |
|  100 | pie            |       30.9 [29.6–35.9] |       23.8 [21.6–24.2] |       32.0 [29.5–32.5] |
|  100 | donut          |       31.0 [30.6–59.2] |       31.6 [23.4–42.7] |       32.7 [25.2–89.0] |
| 1000 | all            | 1143.6 [1081.0–1198.5] | 1120.4 [1030.8–1135.6] | 4051.6 [3987.0–4126.1] |
| 1000 | line           |    205.4 [190.7–213.9] |    206.2 [186.4–292.8] |    377.9 [256.6–408.1] |
| 1000 | area           |    323.0 [202.9–349.2] |    202.6 [196.1–300.0] |    287.0 [271.7–292.8] |
| 1000 | bar            |    198.2 [187.0–348.1] |    204.0 [201.1–227.9] |    293.9 [265.7–360.3] |
| 1000 | pie            |    158.0 [153.3–165.5] |    147.0 [143.9–258.3] |    195.6 [184.5–310.1] |
| 1000 | donut          |    204.6 [180.7–308.4] |    147.1 [140.5–293.7] |    252.6 [229.5–334.1] |

DOM counts after the last repeat (controls / decorative marks / table rows):

| Rows | Family | Controls | Marks | Table rows |
| ---: | ------ | -------: | ----: | ---------: |
|  100 | line   |      190 |   200 |        100 |
|  100 | area   |      190 |   210 |        100 |
|  100 | bar    |      190 |   190 |        100 |
|  100 | pie    |      100 |   100 |        100 |
|  100 | donut  |      100 |   100 |        100 |
| 1000 | line   |     1909 |  2001 |       1000 |
| 1000 | area   |     1909 |  2093 |       1000 |
| 1000 | bar    |     1909 |  1909 |       1000 |
| 1000 | pie    |     1000 |  1000 |       1000 |
| 1000 | donut  |     1000 |  1000 |       1000 |

The combined 1000-row case exposes substantial development-mode mount/update/resize
cost. Individual cases retain empty siblings and shared fixture overhead. Wide
ranges include browser scheduling; results justify disclosure and a future
production benchmark, not a new optimization or a claimed budget.

## Accessibility and accepted limits

Meaningful default names, caller labels/descriptions, unique title/description
references, semantic row/column headers, complete source alternatives,
decorative mark hiding, visible focus and noninteractive tooltip panels are
covered automatically. Tables retain zero/missing/invalid/negative information.
Invalid mapping cannot invent values but retains appropriate source alternatives.
A caller may provide extra legitimate controls in Donut center content.

Very narrow Cartesian plots omit some axis text according to existing estimates;
source tables remain the complete alternative. Long fields wrap heavily at narrow
widths. Tiny polar slices remain in controls/table but can be difficult to hit.
Arbitrary custom tooltip/center content may exceed its allotted space; callers
own their content semantics and sizing. Local-time Line/Area SSR requires matching
server/client timezone or UTC/explicit formatting. Inline styles require compatible
host CSS/CSP. Dense SVG/controls/tables have proportional DOM cost. None of these
is silently replaced with grouping, portals, measurement libraries or API changes.

## Public demo handoff checklist

- Reuse `playground/FiveCharts.tsx`: frozen monthly actual/forecast and allocation
  datasets; deterministic dense cases; independently controlled state/width,
  tables, animation and before/after controls. Entry: `/?five-charts`; full
  playground keeps all historical selectors under a labeled historical section.
- Five showcase examples: multi-series Line with missing forecast; signed Area;
  grouped actual/forecast Bar; Product/Services/Support Pie; allocation Donut with
  a meaningful center button. Additional examples remain in PieExamples,
  DonutExamples and the historical Cartesian Integration fixture.
- Import only from `react-simple-charts`:
  `import { LineChart, AreaChart, BarChart, PieChart, DonutChart } from 'react-simple-charts'`.
  Preserve generic inference and existing props. No internal/subpath imports.
- Reuse existing `--rsc-*` text/background/series/focus/axis/grid fallback tokens
  documented in family documents; no required stylesheet or new token contract.
- Private 0.0.0 is **not available on public npm**. Demo consumers must install a
  freshly built local tarball. React/DOM are external peers; ESM root-only exports
  and the real `use client` boundary are already verified with App/Pages Router.
- Run typecheck, type tests, lint, formatting, all tests, verify:package,
  build:playground, pack dry-run and genuine consumer/browser audits before demo
  integration. Next 16 uses Webpack in the established matrix.
- Disclose tiny-sector hit limitations, custom-content sizing, dense DOM cost,
  timezone requirements and unverified manual/browser environments. Do not claim
  WCAG certification, public registry availability or production performance budgets.
- No hosting configuration/deployment was added. A future demo lead must decide
  static versus framework hosting, base path, compatible inline-style CSP,
  accessibility review and browser policy. Deployment/release need separate scope.
