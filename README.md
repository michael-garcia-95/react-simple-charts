# react-simple-charts

A lightweight, customizable React charting library built with TypeScript.

## Status

M01-T01 establishes repository tooling only. No chart components or public APIs exist yet. The provisional package name is `react-simple-charts`; it remains private and is not ready for installation from npm.

## Development

Use Node.js 22.22.2+ on the 22.x line, 24.15+ on the 24.x line, or 26+ and npm (Node 24 recommended). These minimums match the development tools; they are not a browser runtime requirement. From the repository root:

```sh
npm ci
npm run dev
```

Vite serves the React playground and prints its local URL. The page states the foundation status; it does not simulate charts. Its CSS belongs to the playground only.

| Command                    | Purpose                                                                   |
| -------------------------- | ------------------------------------------------------------------------- |
| `npm run build`            | ESM library and TypeScript declarations in `dist/`                        |
| `npm run build:playground` | Static playground in `playground-dist/`                                   |
| `npm run preview`          | Preview the built playground locally                                      |
| `npm run typecheck`        | Strict TypeScript checking of source, playground, tests, and TS configs   |
| `npm run lint`             | ESLint, including React Hooks rules                                       |
| `npm run format:check`     | Prettier check                                                            |
| `npm run format`           | Apply Prettier                                                            |
| `npm test`                 | Vitest and React Testing Library tests                                    |
| `npm run test:watch`       | Watch tests                                                               |
| `npm run verify:package`   | Build and verify distribution contracts, including external React imports |
| `npm pack --dry-run`       | Build via prepack and inspect package contents without publishing         |

## Architecture

The library targets React 18.2+ and React 19.x. Planned Line, Bar, Area, Pie, and Donut components will share infrastructure, use SVG rendering, and use d3-scale/d3-shape for pure calculations. Consumers supply React and React DOM as peers. Distribution is ESM-only, with declarations and a single root entry; future APIs use named exports. No internal subpaths are public.

See [architecture](docs/ARCHITECTURE.md), [open decisions](docs/OPEN_DECISIONS.md), and [contributor rules](AGENTS.md). CI checks Node 22/24 with React 18.2/19. Component typing currently uses React 18 definitions to avoid inadvertently requiring React 19-only APIs.

## License

Licensed under the MIT License. Copyright (c) 2026 Michael Garcia. The copyright holder has been approved by the Development Lead; see `LICENSE` for the standard terms.
