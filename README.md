# React Simple Charts

Five React and TypeScript chart components built with SVG: **Line, Area, Bar, Pie
and Donut**. Map fields from your own records, inspect values with a keyboard or
pointer, and provide source-data tables alongside the graphics.

[Live examples and documentation](https://michael-garcia-95.github.io/react-simple-charts/)
· [Source on GitHub](https://github.com/michael-garcia-95/react-simple-charts)

## Current availability

All five components are implemented and exported from
`@michael-garcia-95/react-simple-charts`. The library is **not published to npm**;
the local release candidate is version `0.1.0` with `private: false`. Evaluate its
reviewed commit on the candidate branch or, after a separately approved merge,
on main. A technically publishable manifest is not authorization to publish.
You can explore the live website or build a local tarball to try it in a React application.

Candidate verification and outstanding release gates are documented in
[the execution guide](docs/VERIFICATION_EXECUTION.md#first-local-release-candidate--m06-t06b3).
The owner-performed Windows NVDA + Firefox assessment **passed on October 12, 2026**
(Trinidad and Tobago local time) for the candidate recorded in
[manual accessibility evidence](docs/M06_MANUAL_ACCESSIBILITY_RESULTS.md).
This is neither WCAG certification nor universal accessibility compatibility.
Publication remains **NO-GO** pending Lead evidence and final source/package review,
account readiness, and explicit owner authorization for the exact manual 2FA
operation. That planned first publication has no automatic GitHub OIDC provenance.

## Features

- Typed field mappings inferred from your records; no index signature required.
- Category, numeric and Date-based X scales for Line and Area; grouped vertical
  and horizontal Bars; source-ordered Pie and Donut segments.
- Responsive container sizing or explicit numeric dimensions.
- Tooltips, roving keyboard inspection and data-activation callbacks.
- A complete semantic source table in every chart state, visible or visually hidden.
- Optional reduced-motion-aware opacity animation and Donut center content.
- Self-contained styles, external React peers and ESM with TypeScript declarations.

## Quick example

With the local package installed in your application:

```tsx
import { LineChart } from '@michael-garcia-95/react-simple-charts';

export function Sales() {
  return (
    <LineChart
      data={[
        { month: 'Jan', revenue: 12 },
        { month: 'Feb', revenue: 24 },
        { month: 'Mar', revenue: 18 },
      ]}
      xKey="month"
      yKey="revenue"
      height={280}
      accessibility={{
        label: 'Monthly revenue',
        description: 'Fictional revenue for January through March.',
        dataTable: 'visible',
      }}
    />
  );
}
```

Omitting `width` makes the chart measure its container. Use a positive numeric
width, such as `width={640}`, for explicit sizing and complete initial SVG during
server rendering.

## Try a local package

For local evaluation, clone the repository and check out the exact candidate commit
reviewed by the Development Lead before creating an archive. Before the planned
merge, the candidate is on `feat/m06-t06b3-release-candidate`; after an approved
merge it can be selected from main. Replace `REVIEWED_CANDIDATE_COMMIT` below
with the approved full commit SHA in either case:

```sh
git clone https://github.com/michael-garcia-95/react-simple-charts.git
cd react-simple-charts
git checkout --detach REVIEWED_CANDIDATE_COMMIT
npm ci
npm pack
```

Then, from your existing React application, install the generated file using its
actual path (quote paths containing spaces):

```sh
npm install "/path/to/react-simple-charts/michael-garcia-95-react-simple-charts-0.1.0.tgz"
```

Supply compatible React and React DOM peers and import from the scoped package
root. Internal subpaths and CommonJS are unavailable.

## API and documentation

| Guide                                                            | Use it for                                          |
| ---------------------------------------------------------------- | --------------------------------------------------- |
| [LineChart](docs/LINE_CHART.md)                                  | Trends, gaps and category/numeric/time scales       |
| [AreaChart](docs/AREA_CHART.md)                                  | Independent unstacked areas relative to zero        |
| [BarChart](docs/BAR_CHART.md)                                    | Grouped comparisons in either orientation           |
| [PieChart](docs/PIE_CHART.md)                                    | Positive values as parts of a whole                 |
| [DonutChart](docs/DONUT_CHART.md)                                | Ring geometry and optional center content           |
| [TypeScript contracts](docs/API_TYPE_CONTRACTS.md)               | Generic props, mappings and callback payloads       |
| [Architecture](docs/ARCHITECTURE.md)                             | Module boundaries and implementation decisions      |
| [Compatibility evidence](docs/M06_DISTRIBUTION_COMPATIBILITY.md) | Tested configurations, reproduction and limitations |

## Compatibility

React and React DOM peer ranges are `^18.2.0 || ^19.0.0`. Tests cover React
18.2.0 and 19.3.0, including genuine installed-tarball Vite and Next.js consumers.
Declarations use `NoInfer` (introduced in TypeScript 5.4); tested compiler versions
are 5.4.5 and 6.0.3. See the compatibility report for exact framework configurations.

The browser build targets ES2022 ESM and uses SVG, Pointer Events and focus APIs.
Responsive graphical mounting requires native ResizeObserver; without it, the
placeholder and source table remain. Focused automated tests passed Chromium
156.0.8078.4, Firefox 157.0 and Playwright WebKit 27.2 in GitHub Actions. These are
engine results, not physical Safari/iOS or universal browser validation.

Explicit finite numeric dimensions support SVG server rendering. Responsive
widths initially render stable accessible placeholders, and local-time scales
wait for the client timezone. Use UTC and deterministic formatting for predictable
temporal SSR. The package retains a `use client` boundary for Next App Router.
Consumer Node requirements are separate from contributor tooling; older Node
versions remain unverified.

## Accessibility and limitations

Provide meaningful chart names and descriptions. Tab enters one data control;
arrows and Home/End navigate, Enter/Space activate, and Escape dismisses inspection.
Source tables preserve missing, invalid and clipped observations. Optional animation
respects reduced motion.

Automated axe and accessibility-tree checks passed the focused browser suite with
zero violations, but axe left SVG text contrast and an empty-table check incomplete.
Manual NVDA testing is pending; automated results are not WCAG certification or
proof of screen-reader announcements. See the [manual test plan](docs/M06_SCREEN_READER_TEST_PLAN.md).

Large datasets add SVG/control cost; no performance budget or decimation is
promised. Tiny segments can be difficult pointer targets, labels use estimated
fitting, and oversized Donut center content is clipped. Strict CSP, arbitrary host
styles, native forced colors/zoom and physical mobile devices remain unverified.

## Local development and testing

Development tools require Node `^22.22.2 || ^24.15.0 || >=26.0.0` and npm with the
current lockfile. Node 24 is recommended. CI tests Node 22 and 24; Node 26 is allowed
by tooling but is not in that matrix. These are contributor requirements, not a
library consumer minimum.

After `npm ci`, use `npm run dev` for the technical playground or
`npm run dev:site` for the website. Both build the package first. Rebuild/restart
site development after library source changes.

| Command                                          | Purpose                                              |
| ------------------------------------------------ | ---------------------------------------------------- |
| `npm run build`                                  | ESM, declarations and source map in `dist/`          |
| `npm run typecheck` / `npm run test:types`       | Source and public API type checks                    |
| `npm run lint` / `npm run format:check`          | Lint and formatting checks                           |
| `npm run format`                                 | Apply formatting                                     |
| `npm test` / `npm run test:watch`                | Run or watch unit/component tests                    |
| `node --test scripts/tests/npm-command.test.mjs` | Portable npm invocation tests                        |
| `npm run verify:package`                         | Verify the actual archive and distribution contracts |
| `npm pack --dry-run`                             | Inspect package contents without publishing          |
| `npm run test:site`                              | Website behavior and content tests                   |
| `npm run verify:site:snippets`                   | Compile all generated website TSX examples           |
| `npm run build:playground` / `npm run preview`   | Build/preview `playground-dist/`                     |
| `npm run build:site` / `npm run preview:site`    | Build/preview root-mode `site-dist/`                 |
| `npm run build:site:pages`                       | Build locally for `/react-simple-charts/`            |
| `npm run verify:browsers`                        | Genuine installed-package browser smoke suite        |

After a site build, run `node scripts/verify-site-build.mjs /`, or pass
`/react-simple-charts/` after the Pages build. Rebuild root mode before ordinary
root preview. Local build commands do not deploy the website. Browser setup and
supported installation commands are in the compatibility report.

## Contributing

Read [the architecture](docs/ARCHITECTURE.md), [repository rules](AGENTS.md) and
[current open decisions](docs/OPEN_DECISIONS.md). Keep changes focused, preserve
public contracts and include relevant tests. Report defects with a reproducible
dataset, chart props, environment versions and expected versus observed behavior
in the [issue tracker](https://github.com/michael-garcia-95/react-simple-charts/issues).

[Engineering reports](docs/) preserve design and validation history. Use current
guides and the compatibility report for present behavior.

## License

[MIT](LICENSE). Copyright (c) 2026 Michael Garcia.
