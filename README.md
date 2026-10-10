# react-simple-charts

A lightweight, customizable React charting library built with TypeScript.

## Status

M05-T03 expands the Documentation page into a developer reference with anchored
navigation, local onboarding, all five typed chart examples, tooltips, accessibility,
responsive rendering and SSR guidance. See [developer documentation](docs/M05_DEVELOPER_DOCUMENTATION.md).
The package remains private at 0.0.0; deployment and publication remain separate.

M05-T02 expands the public Examples page with two deterministic presets per chart,
independent controls, synchronized runnable TSX, accessible copying and reset.
Root and GitHub Pages project-path builds are supported; no site is deployed.
See [interactive examples](docs/M05_INTERACTIVE_EXAMPLES.md) and the
[approved GitHub Pages plan](docs/GITHUB_PAGES_PLAN.md).

M04-T04 audits the five families together, adds a reusable combined playground
fixture and corrects Cartesian focus, legend wrapping and constrained tooltip
placement. See [integration evidence and public demo handoff](docs/M04_INTEGRATION_HARDENING.md).

M04-T03 adds public `DonutChart` with genuine ring geometry, a default 0.6
inner-radius ratio, optional accessible center content, ring labels and shared
polar inspection. LineChart, AreaChart, BarChart and PieChart remain public.
The package stays private at 0.0.0. See [DonutChart usage](docs/DONUT_CHART.md),
[PieChart](docs/PIE_CHART.md), [BarChart](docs/BAR_CHART.md),
[LineChart](docs/LINE_CHART.md) and [AreaChart](docs/AREA_CHART.md).

```tsx
import { LineChart } from 'react-simple-charts';

export function Sales() {
  return (
    <LineChart
      data={[
        { month: 'Jan', revenue: 12 },
        { month: 'Feb', revenue: 24 },
      ]}
      xKey="month"
      yKey="revenue"
      accessibility={{ label: 'Monthly revenue' }}
    />
  );
}
```

## Development

Use Node.js 22.22.2+ on the 22.x line, 24.15+ on the 24.x line, or 26+ and npm (Node 24 recommended). These minimums match the development tools; they are not a browser runtime requirement. From the repository root:

```sh
npm ci
npm run dev
```

Vite serves the React playground and prints its local URL. The page shows public LineChart, AreaChart, BarChart, PieChart and DonutChart examples alongside historical rendering fixtures. Its CSS belongs to the playground only; the prototype's essential styles are self-contained. The optional real-browser smoke workflow is documented in [rendering compatibility](docs/RENDERING_COMPATIBILITY.md).

| Command                    | Purpose                                                                   |
| -------------------------- | ------------------------------------------------------------------------- |
| `npm run build`            | ESM library and TypeScript declarations in `dist/`                        |
| `npm run build:playground` | Static playground in `playground-dist/`                                   |
| `npm run preview`          | Preview the built playground locally                                      |
| `npm run typecheck`        | Strict TypeScript checking of source, playground, tests, and TS configs   |
| `npm run test:types`       | Compile-time public API and JSX inference tests                           |
| `npm run lint`             | ESLint, including React Hooks rules                                       |
| `npm run format:check`     | Prettier check                                                            |
| `npm run format`           | Apply Prettier                                                            |
| `npm test`                 | Vitest and React Testing Library tests                                    |
| `npm run test:watch`       | Watch tests                                                               |
| `npm run verify:package`   | Build and verify distribution contracts, including external React imports |
| `npm pack --dry-run`       | Build via prepack and inspect package contents without publishing         |

## Architecture

The library targets React 18.2+ and React 19.x. Line, Bar and Area share SVG rendering infrastructure and d3-scale/d3-shape pure calculations; Pie and Donut share the pure polar engine and presentation. Consumers supply React and React DOM as peers. Distribution is ESM-only, with declarations and a single root entry; LineChart, AreaChart, BarChart, PieChart and DonutChart are the only named runtime exports. No internal subpaths are public.

See [architecture](docs/ARCHITECTURE.md), [open decisions](docs/OPEN_DECISIONS.md), and [contributor rules](AGENTS.md). CI checks Node 22/24 with React 18.2/19. The baseline uses React 18 definitions; CI also checks matching React 19 definitions.

## License

Licensed under the MIT License. Copyright (c) 2026 Michael Garcia. The copyright holder has been approved by the Development Lead; see `LICENSE` for the standard terms.

The historical RenderingProbe and source-internal LinePreview remain available only in the repository. Genuine packaged Vite/Next validation uses all five public charts; see [consumer compatibility](docs/CONSUMER_COMPATIBILITY.md).

See [M03 integration hardening](docs/M03_INTEGRATION_HARDENING.md) for the cross-family audit, reproducible browser matrix, fixes and remaining risks.

## Public website foundation

The dedicated `site/` application is separate from the technical playground.
It contains Home, Examples, Documentation and About, using the five actual
components through the built package root. The package is not published to npm.

```sh
npm ci
npm run dev:site
npm run build:site
# Build for the approved future GitHub Pages project URL (no deployment)
npm run build:site:pages
# Rebuild root mode before ordinary root preview
npm run build:site
npm run preview:site
npm run test:site
```

Site commands build the library before consuming its root exports; production
output is `site-dist/`. Normal typecheck and test commands also build the library
first for clean-checkout artifact resolution. After library source changes,
rebuild/restart the site dev command. No source alias or new React peer policy
is used. See [the approved website design baseline](docs/M05_WEBSITE_DESIGN_BASELINE.md)
for architecture, design and local-build tradeoffs. The GitHub Pages plan
supersedes the historical Cloudflare Pages proposal.
No website deployment is configured.

`npm run test:site` covers the foundation, all interactive families and base paths.
`npm run verify:site:snippets` compiles 32 TSX samples (22 interactive variants and
10 documentation examples) against the real built package declarations. `node scripts/verify-site-build.mjs /` checks root
HTML/assets; pass `/react-simple-charts/` after the Pages build. Both modes emit
only `site-dist/`; the library package and technical playground are unchanged.
Browser reproduction and ignored evidence locations are in the interactive report.
