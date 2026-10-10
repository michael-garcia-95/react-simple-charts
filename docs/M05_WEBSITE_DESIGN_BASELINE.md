# M05 website design baseline — M05-T01

**APPROVED DESIGN BASELINE:** the visual identity and task scope supplied for
M05-T01. Implementation remains subject to independent Development Lead review;
this label does not imply merge, release, accessibility certification or hosting approval.

Required base: `c38f562180bbe6cee51328abbfd7ae38753371d7`.
The baseline was fetched and rerun: 975 passing tests across 47 files.

## Personality and visual system

Modern, friendly, approachable, professional, developer-focused, clean and
restrained. The independent React Simple Charts brand uses an inline SVG line
with two highlighted observations. No generated logo or portfolio identity.
The actual chart provides the landing page's visual interest.

| Role             | Initial value | CSS property |
| ---------------- | ------------- | ------------ |
| Background       | #F8FAFC       | --background |
| Surface          | #FFFFFF       | --surface    |
| Primary text     | #142B3B       | --text       |
| Primary accent   | #2563EB       | --primary    |
| Secondary accent | #0D9488       | --secondary  |
| Borders          | #E2E8F0       | --border     |
| Supporting text  | #526576       | --muted      |

The teal accent is used for chart series and the brand mark, rather than small
body text on white. Links and actions use blue. Chart colors preserve their
approved defaults unless an example supplies an approved color prop. Existing
`--rsc-text-color`, `--rsc-background` and `--rsc-focus-color` connect the site to
library presentation without changing any library token contract.

Typography uses a modern system sans stack. Technical labels and code use
ui-monospace, SFMono-Regular, Menlo and Consolas. No font download. Headings use
fluid sizes and restrained tight tracking; prose is limited to roughly 65ch.
The spacing scale follows 4/8/12/16/24/32/48/64px at the default root size,
expressed in rem. Shared cards use 16px radii, light borders and a subtle shadow
on the hero chart only. No gradients, glass, decorative blobs or entry animation.

## Information architecture and navigation

Four independently emitted HTML pages:

- `/`: Home — introduction, real revenue chart, five-family links, first API sample.
- `/examples/`: Examples — all five real components, explanatory copy and visible source tables.
- `/documentation/`: Documentation — API mapping, React compatibility, availability, local workflow, approved JSX sample and source links.
- `/about/`: About — project motivation, technical characteristics, MIT source and verification limits.

Each HTML entry has its own browser title, description, English language and
viewport metadata before JavaScript runs. The React entry selects a page from
its pathname; ordinary anchors perform navigation and gallery fragment links
resolve to actual card IDs. No routing dependency or history fallback required.
Shared Header, Navigation, Footer, Container, SectionHeading, ChartCard,
ActionLink and CodePreview remove real duplication. Mobile navigation remains
visible and wraps; there is no hidden menu or inert toggle.

## Composition and responsive layout

The homepage balances a concise headline and two actions with a white chart
surface. One six-row revenue dataset keeps the initial page modest. A compact
five-family overview links straight to gallery examples; a final API introduction
connects visual exploration to documentation.

The gallery uses two equal columns at larger widths and one below 600px. Every
card has a family label, descriptive heading, units, the real chart and its
source table. The last card uses the same dimensions as its siblings instead of
stretching the Donut. Data is explicitly fictional. Monthly revenue/forecast,
signed changes and Product/Services/Support 48/32/20 allocation adapt the M04
handoff; no random values are generated during render.

A fluid container has 16–48px gutters and a 1120px maximum width. Hero,
documentation and API introduction stack below 900px. The family grid reflows
5 → 3 → 2 columns. About stacks below 600px. Grid children use minimum width zero;
charts measure their local containers. Code scrolls within its panel, never the
whole page. Site links/actions have 44px/48px minimum heights. Responsive QA
covers 320, 480, 768 and 1200px, including enlarged text.

## Documentation and About approach

Documentation is an accurate introduction rather than a speculative search or
full API portal. The JSX uses approved LineChart props, inferred records and a
visible data table. Cartesian mappings use xKey plus yKey or series; polar
mappings use nameKey/valueKey. Donut centerContent is a short, noninteractive
label. React 18.2+ within 18 and React 19.x match the peer policy; the CI matrix
checks Node 22/24 and React 18.2/19.

The package remains private at 0.0.0 and unavailable on public npm. Local clone,
`npm ci`, `npm run dev:site`, `npm run build:site` and tarball instructions are
clearly separated from future public installation. About describes TypeScript,
SVG, responsive components, source-data alternatives and MIT licensing, with
no personal biography or performance/browser/WCAG guarantee.

## Genuine library integration and local workflow

`site/charts.tsx` imports all five components from `react-simple-charts`.
Node package self-reference resolves the repository's own root `exports` entry
to `dist/index.js`; TypeScript resolves `dist/index.d.ts`. Vite uses the same
root-export-based resolution, with no source or dist alias. React/React DOM
remain external library peers and site development dependencies. Vite dedupes
these peers at the application boundary.

`dev:site`, `build:site` and `test:site` build the real library first.
`pretypecheck` and `pretest` build declarations/runtime for clean-checkout site
checking with the existing commands. Direct `vitest`/`tsc` invocation requires
an existing library build. After editing library source, rebuild/restart site
dev to refresh dist; this task does not introduce a speculative watch coordinator.

This is genuine artifact consumption within the repository, not an independent
installed consumer. Its benefit is a simple reproducible build without another
manifest/lockfile or a public npm install. An independent application should
install a freshly packed local tarball, as the existing consumer runner does.
The production build module-graph guard verifies the site includes dist/index.js and no
source chart modules. Existing verify:package checks root exports, external
peers, declarations and the client banner. The npm files allowlist stays
`dist`/`LICENSE`; site source, assets and `site-dist` are excluded.

The existing Vite playground configuration and all src/playground files remain
intact. `vite.site.config.ts` has root `site`, four HTML inputs and output
`site-dist`, independently of library `dist` and `playground-dist`.

```sh
npm ci
npm run dev:site
npm run build:site
npm run preview:site -- --host 127.0.0.1 --port 4320
npm run test:site
```

## Hosting proposal

Cloudflare Pages is preferred: repository-root build command
`npm run build:site`, output `site-dist`, supported Node 22 or 24. Static
HTML directory routes need no SPA rewrite. Links currently assume origin-root
hosting; subdirectory hosting requires a deliberate base-path adaptation.
No Cloudflare project, production publishing configuration, domain, analytics,
tracking or deployment is created by this task. Assets require a CSP compatible
with the library's existing inline styles; no new runtime policy is invented.

## Accessibility and motion goals

Semantic header/nav/main/footer, one h1 per page, ordered section headings,
descriptive links, current-page navigation, a skip link and visible focus.
All gallery charts have descriptive accessible labels, data units, keyboard
inspection and visible library source tables. Home/About tables remain visually
hidden but exposed to assistive technologies. Navigation uses native anchors;
code panels can receive keyboard focus for contained scrolling.

Only restrained hover color/border transitions are added. Reduced-motion media
removes animation/transitions; chart examples explicitly disable optional
animation without changing library defaults. Automated axe and Chromium checks
are evidence, not complete accessibility certification.

## Known limits and deferred decisions

- Content renders with React JavaScript; metadata and page routes are static,
  but full content prerendering is deferred. No no-JavaScript content guarantee.
- Root-hosted URLs are intentional; deployment, canonical URLs, social metadata,
  richer social assets and base-path decisions await hosting/design review.
- The single application bundle contains all four pages; code splitting can be
  considered after measuring actual site needs, with no package size claim.
- No manual screen-reader review, native browser zoom, native touch device,
  Firefox/WebKit or production performance guarantee is established here.
- Existing narrow-axis/tiny-sector/custom-content/dense-DOM limits from M04 apply.
- M05-T02 will expand examples with multiple datasets, controls and copyable
  source switching. Full documentation/search, theme refinement and broader
  browser/assistive-technology review are later work.

No core geometry, public contracts, default behavior, runtime exports, peer
policy, package identity/version/privacy/license or release state changes.

## M05-T01 local validation and reproduction

Executed with Node 24.19.0 / npm 11.9.0 and React 19.3.0:

| Command                    | Result                                                                                  |
| -------------------------- | --------------------------------------------------------------------------------------- |
| `npm run typecheck`        | Pass, including built-root site declarations                                            |
| `npm run test:types`       | Pass                                                                                    |
| `npm run lint`             | Pass                                                                                    |
| `npm run format:check`     | Pass                                                                                    |
| `npm test`                 | 992 passing tests / 48 files; all 975 baseline tests retained                           |
| `npm run test:site`        | 17 passing tests / 1 file                                                               |
| `npm run verify:package`   | Root contracts, declarations, client boundary and React externalization pass            |
| `npm run build:playground` | Pass                                                                                    |
| `npm run build:site`       | Four production HTML entries; built-artifact module-graph guard passes                  |
| `npm pack --dry-run`       | Six files: LICENSE, README, package.json and three dist artifacts; no site files/assets |
| `git diff --check`         | Pass                                                                                    |

The existing nonfatal Rolldown client-directive warnings remain; the unchanged
production banner and package verifier still validate the library client boundary.
No library src files, playground files or dependency lockfile are changed.
GitHub's four Node/React matrix outcomes must be checked separately on final PR
HEAD; local React 19 results do not establish those outcomes.

Browser QA uses the same isolated Playwright/axe driver approach as M04:

```sh
npm install --prefix work/consumers/driver --no-audit --no-fund \
  playwright-core@1.64.0 @axe-core/playwright@4.13.0
npm run build:site
npm run preview:site -- --host 127.0.0.1 --port 4320
# In a second shell, with Chromium available:
node scripts/verify-site.mjs
```

In restricted environments use a writable npm cache, e.g.
`npm_config_cache="$PWD/work/npm-cache"`, and command-level network access.
Do not change proxy or credentials. Browser dependencies and evidence stay in
ignored work/, without permanent package dependencies or committed screenshots.
The browser runner checks four pages × four widths, native navigation and chart
keyboard inspection, source tables, metadata, link responses, reduced motion,
200% root text enlargement, console/resource errors and axe. It saves full-page
Home/Examples screenshots for visual inspection. Native browser zoom is distinct
from text enlargement and is not claimed. The expensive independent Vite/Next
consumer matrix is not rerun for this site-only task; M04 evidence remains its
baseline, while the site's genuine built-root integration is verified directly.

Final Chromium 151.0.7922.173 results: **16 layouts, 16 axe scans with zero
violations, no console/page/resource errors**. Four widths passed correct chart
bounds and no document overflow. Keyboard navigation, all-five chart inspection,
reduced-motion removal and all-four-page 320px/200% root text enlargement passed.
Home and Examples screenshots at 320/480/768/1200px were inspected. Browser QA
found and corrected a code-label contrast inheritance issue, a missing arrow
glyph, clipped-table intrinsic overflow during text enlargement and the implicit
favicon request. All corrections remain in site presentation; library runtime
and defaults remain untouched. A simple inline SVG favicon uses the in-code mark.
Zero axe violations do not establish complete WCAG conformance.
