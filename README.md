# react-simple-charts

A lightweight, customizable React charting library built with TypeScript.

## Status

M03-T02 implements the public `LineChart` on the merged Cartesian engine.
It supports multiple series, independent gaps, category/linear/UTC/local-time X,
responsive and explicit dimensions, accessible tables, tooltips, point inspection,
activation and optional reduced-motion-aware animation. Area/Bar/Pie/Donut remain
unimplemented runtime APIs. The package stays private at 0.0.0; no npm release is
available. See [LineChart usage and every prop](docs/LINE_CHART.md).

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

Vite serves the React playground and prints its local URL. The page shows public LineChart examples alongside historical rendering fixtures. Its CSS belongs to the playground only; the prototype's essential styles are self-contained. The optional real-browser smoke workflow is documented in [rendering compatibility](docs/RENDERING_COMPATIBILITY.md).

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

The library targets React 18.2+ and React 19.x. Planned Line, Bar, Area, Pie, and Donut components will share infrastructure, use SVG rendering, and use d3-scale/d3-shape for pure calculations. Consumers supply React and React DOM as peers. Distribution is ESM-only, with declarations and a single root entry; LineChart is a named runtime export. No internal subpaths are public.

See [architecture](docs/ARCHITECTURE.md), [open decisions](docs/OPEN_DECISIONS.md), and [contributor rules](AGENTS.md). CI checks Node 22/24 with React 18.2/19. The baseline uses React 18 definitions; CI also checks matching React 19 definitions.

## License

Licensed under the MIT License. Copyright (c) 2026 Michael Garcia. The copyright holder has been approved by the Development Lead; see `LICENSE` for the standard terms.

The historical RenderingProbe and source-internal LinePreview remain available only in the repository. Genuine packaged Vite/Next validation uses the public LineChart; see [consumer compatibility](docs/CONSUMER_COMPATIBILITY.md).
