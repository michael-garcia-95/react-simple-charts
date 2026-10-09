# react-simple-charts

A lightweight, customizable React charting library built with TypeScript.

## Status

Milestone 01 is complete. M02-T02 adds internal [scales and domains](docs/SCALES_AND_DOMAINS.md), including duplicate-preserving category positions, linear/UTC/local-time scales, series-aware domains, and typed ticks. M02-T03 adds internal [layout and axes](docs/LAYOUT_AND_AXES.md): adaptive plot bounds, physical axis orientation, estimated label selection, value gridlines, and Area/Bar zero-baseline coordinates. M02-T04 adds internal [geometry foundations](docs/GEOMETRY_FOUNDATIONS.md): ordered Line/Area runs with missing-data gaps and path data, and grouped vertical/horizontal Bar rectangles with source identity and clipping metadata. Milestone 02’s planned internal foundation tasks are implemented, subject to M02-T04 PR review and merge. M02-T01 added internal, framework-independent [data normalization](docs/DATA_NORMALIZATION.md) with source preservation and structured validation. M01-T03 added an internal SVG rendering prototype to validate explicit/responsive dimensions, SSR, hydration, accessibility, and self-contained styling. No public runtime chart components exist yet. See [rendering compatibility](docs/RENDERING_COMPATIBILITY.md) and [API type contracts](docs/API_TYPE_CONTRACTS.md). M01-T04 packaged-consumer verification is documented in [consumer compatibility](docs/CONSUMER_COMPATIBILITY.md); its runtime tests use a temporary test-only distribution. The provisional package name is `react-simple-charts`; it remains private and is not ready for installation from npm.

## Development

Use Node.js 22.22.2+ on the 22.x line, 24.15+ on the 24.x line, or 26+ and npm (Node 24 recommended). These minimums match the development tools; they are not a browser runtime requirement. From the repository root:

```sh
npm ci
npm run dev
```

Vite serves the React playground and prints its local URL. The page identifies the internal architecture prototype and shows explicit/responsive examples with accessible data tables. Its CSS belongs to the playground only; the prototype's essential styles are self-contained. The optional real-browser smoke workflow is documented in [rendering compatibility](docs/RENDERING_COMPATIBILITY.md).

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

The library targets React 18.2+ and React 19.x. Planned Line, Bar, Area, Pie, and Donut components will share infrastructure, use SVG rendering, and use d3-scale/d3-shape for pure calculations. Consumers supply React and React DOM as peers. Distribution is ESM-only, with declarations and a single root entry; future APIs use named exports. No internal subpaths are public.

See [architecture](docs/ARCHITECTURE.md), [open decisions](docs/OPEN_DECISIONS.md), and [contributor rules](AGENTS.md). CI checks Node 22/24 with React 18.2/19. The baseline uses React 18 definitions; CI also checks matching React 19 definitions.

## License

Licensed under the MIT License. Copyright (c) 2026 Michael Garcia. The copyright holder has been approved by the Development Lead; see `LICENSE` for the standard terms.
