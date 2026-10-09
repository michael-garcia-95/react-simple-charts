# Internal rendering compatibility proof — M01-T03

This is an architecture fixture, not a public chart implementation. It draws
four fixed quarterly values with a polyline, point markers, numeric labels,
and category labels. It does not implement the LineChart contract, production
normalization, tooltips, animation, or chart navigation. M01-T02 contracts,
the public barrel, package configuration, and CI matrix remain unchanged.

## Two initial rendering paths

A finite positive numeric `width` selects explicit rendering. A finite positive
`height` is used, otherwise height defaults to 280px. SVG dimensions, viewBox,
and geometry are deterministic and complete on the server. The fixed data and
simple arithmetic use neither time nor locale-dependent formatting. Browser
APIs are absent from rendering and module initialization.

An omitted width, a CSS width such as `100%`, or an unusable numeric width selects
responsive rendering. The server and initial client render both reserve the
intended graphical height and show a named, described placeholder. No estimated
viewBox is emitted. The structured HTML table exists immediately in both paths.
Invalid numeric dimensions fall back safely; this is an internal probe policy,
not a finalized public runtime validation policy.

```tsx
// Internal source imports only; neither component nor helpers are public exports.
<RenderingProbe width={640} height={280} />
<RenderingProbe accessibility={{ label: 'Quarterly values', dataTable: 'visible' }} />
```

## Hydration and measurement lifecycle

1. `RenderingProbe` derives the height, accessible name, and `useId` references.
2. Explicit rendering computes geometry and emits SVG. Responsive rendering
   starts with `width === null` and emits the placeholder, alongside the table.
3. Hydration uses the identical component tree and deterministic initial state.
   No layout reads occur during render; no mount-time speculative SVG is used.
4. After mounting, the responsive child's effect observes its own container.
   ResizeObserver's first notification supplies the content-box width.
5. A finite positive width replaces the placeholder with SVG. Later width
   changes recompute the pure geometry; duplicate widths preserve state.
6. Zero, negative, or non-finite widths restore the placeholder. The same table
   remains mounted. Subsequent valid notifications restore SVG.
7. Cleanup marks the observer inactive before disconnecting it, so queued late
   notifications cannot update state. Strict Mode effect replay creates a fresh
   observer and retires the previous callback.

```ts
const observer = new ResizeObserver((entries) => {
  if (!active) return;
  const entry = entries.find((candidate) => candidate.target === element);
  if (!entry) return;
  const next = usableDimension(entry.contentRect.width)
    ? entry.contentRect.width
    : null;
  setWidth((previous) => (previous === next ? previous : next));
});
```

Observers are local to each mounted responsive child. The measured element is a
full-width container rather than the SVG or table, preventing their intrinsic
sizes from determining the observed width. There is no global store, resize
listener, polling, or synchronous layout read. Switching to explicit dimensions
unmounts the responsive child and cleans up its observer. Switching back mounts
a fresh child with unknown width; stale measurements are not reused. Height
changes reuse the observer and immediately update SVG geometry or reservation.

If ResizeObserver is missing, the effect does nothing. The accessible placeholder
and table remain indefinitely. There is no window-resize polyfill: it would not
reliably detect ancestor/container changes. Explicit numeric dimensions are the
available graphical fallback. Defining a broader browser policy remains open.

## Accessible markup and self-contained styling

`AccessibilityOptions` supplies `label`, optional `description`, and visible or
visually hidden table mode. A blank/missing name resolves to “Quarterly sample
values” for this fixture. SVG has `role="img"`, a referenced `<title>`, and an
optional referenced `<desc>`. The placeholder provides equivalent references.
Graphical descendants are hidden from the accessibility tree to avoid reading
every SVG label a second time; the table is a separate structured alternative
with caption, column headers, row headers, and numeric cells. Labels and point
markers convey the data independently of series color. There is no live region
or claim of complete screen-reader behavior.

`useId` keeps references stable through hydration and measurement, with unique
sibling IDs. Separate React roots must still use coordinated `identifierPrefix`
values on server and client, as React requires; this probe tests sibling instances
within one root, not a multi-root framework integration.

The table's visually hidden mode uses inline absolute positioning, a 1px box,
clipping, overflow hiding, and no `display: none`, `visibility: hidden`, or
`aria-hidden`. It remains present while measurement is pending. The table contains
no interactive controls that would need a separate focus-reveal mechanism.

SVG is a single Tab stop for this proof; it has no activation behavior or
point-by-point navigation. Focus/blur state applies a 3px inline outline with
offset. Unmounting the SVG also discards its focus state. Native outlines are not
suppressed when unfocused. This works without pseudo-selectors or stylesheet
injection, but outlines appear for pointer focus too. Production interaction and
focus-visible policy remain future work.

There is no external CSS import, provider, runtime styling dependency, or global
stylesheet injection. Essential styles live on the component's elements. The
following fixture tokens use CSS variable fallbacks:

| Token                | Internal default |
| -------------------- | ---------------- |
| `--rsc-series-color` | `#2563eb`        |
| `--rsc-text-color`   | `#182b38`        |
| `--rsc-background`   | `#fff`           |
| `--rsc-focus-color`  | `#075985`        |

```tsx
<RenderingProbe
  width={640}
  color="#a21caf"
  style={{ '--rsc-series-color': '#086b62' }}
/>
// Series stroke: explicit color > CSS variable > #2563eb fallback.
```

The `style` prop controls the fixture wrapper and tokens; dimension props control
its width and graphical height. Table hiding and focus styling are kept on the
specific elements. Consumers can still override inline styles through aggressive
global CSS or choose inaccessible colors; this proof does not guarantee resistance
to arbitrary host styling. Token names are prototype choices, not added public
contracts. Inline styles also require consideration under a strict CSP policy.

## Tests and browser verification

Node-environment SSR tests import and render with `window`, `document`, and
`ResizeObserver` absent. They cover both paths, deterministic markup, invalid
dimensions, tables, and unique sibling IDs. jsdom hydration tests run both paths
with and without Strict Mode, compare the initial DOM exactly, capture console
warnings/errors and `onRecoverableError`, and explicitly deliver measurements
after hydration. They do not claim real layout or browser hydration coverage.

Deterministic observer tests cover target selection, first observation, repeated
and duplicate widths, invalid measurements, late callbacks, unmount cleanup,
Strict Mode replay, independent instances, mode/height changes, and focus-state
reset. Accessibility/style tests cover name/description references, structured
tables, both table modes, focus indication, token fallbacks, explicit color
precedence, and absence of stylesheet injection.

A real headless Chromium 151.0.7922.173 smoke test passed using the native
ResizeObserver and a temporary Playwright Core driver. It verified initial SVGs,
shrinking/growing viewport widths, real Tab focus outlines, resolved token colors,
unique IDs, Chromium accessibility snapshots including the hidden table,
essential behavior after removing all playground styles, missing-observer fallback,
and no console/page errors. A missing favicon initially caused a browser 404;
the playground now uses an empty data favicon. The browser smoke is a Vite client
rendering check, not a framework or packaged-consumer hydration test.

To repeat the optional smoke test with a locally installed Chromium:

```sh
npm install --prefix work/browser-smoke --no-save --package-lock=false playwright-core
npm run dev -- --host 127.0.0.1
# In another terminal:
RSC_BROWSER_PATH=/usr/bin/chromium node scripts/smoke-rendering.mjs
```

`RSC_SMOKE_URL` can select another playground URL. The script saves a scratch
screenshot to ignored `work/rendering-smoke.png` and a no-CSS snapshot to
`work/rendering-smoke-without-css.png`. The driver is installed under
ignored `work/`, and no package/lockfile dependency or CI browser job is added.
Maintaining browser CI would require browser installation, system dependencies,
driver version management, and extra execution time. Those costs are deferred.
The `--no-sandbox` launch flag is intended for this isolated cloud smoke runner;
review it before adopting the script in a different environment.

This task uses APIs shared by React 18 and 19: `useId`, `useState`, `useRef`,
`useEffect`, and React DOM hydration. Local validation used Node 24.19.0 and
TypeScript 6.0.3. React/React DOM 18.2.0 with React types 18.3.31 / DOM types
18.3.7 and React/React DOM 19.3.0 with both type packages 19.3.0 passed the
following checks. Both runtimes also passed the real Chromium smoke test.
The unchanged Node 22/24 × React 18.2/19 CI matrix runs all new Vitest tests;
local Node 24 results do not by themselves establish Node 22 results.

| Command                                                         | Local result for both React generations                                           |
| --------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| `npm run typecheck`                                             | Pass, no diagnostics                                                              |
| `npm run test:types`                                            | Pass, public contracts unchanged                                                  |
| `npm run lint`                                                  | Pass, zero warnings                                                               |
| `npm run format:check`                                          | Pass                                                                              |
| `npm test`                                                      | Pass, 28 tests in 5 files                                                         |
| `npm run verify:package`                                        | Pass: declarations, ESM/root-only exports, client boundary, React externalization |
| `npm run build:playground`                                      | Pass                                                                              |
| `npm_config_cache=/workspace/work/npm-cache npm pack --dry-run` | Pass, 5 files; probe/tests/scripts excluded                                       |
| `git diff --check`                                              | Pass                                                                              |
| `node scripts/smoke-rendering.mjs`                              | Pass, 8 real Chromium smoke checks                                                |

The npm cache override is specific to this cloud environment: its default cache
location was not writable under the sandbox. An initial unmodified dry-run pack
failed with a cache-directory error; retrying with the writable cache passed.
The build retains its existing Rolldown module-directive warning; artifact
verification confirms the configured banner actually preserves `"use client"`.
Test assertions were corrected for React SSR text-separator comments, jsdom's
outline shorthand representation, and caption styling before the final passing
runs. No runtime hydration compatibility defect was found.

## Remaining risks and M01-T04 checks

- The internal fixture is excluded from the distribution. This proves source
  rendering behavior; it does not prove a packaged runtime component or framework
  server-component boundary. M01-T04 must validate actual consumer integration.
- Repeat real-browser hydration from served SSR markup and packaged imports when
  a suitable runtime entry exists. Confirm identifier prefixes in multiple roots.
- Review announcements and table navigation with real screen readers (for example
  NVDA/Firefox and VoiceOver/Safari). Chromium's accessibility tree is evidence of
  semantic exposure, not proof of announcements or full WCAG compliance.
- Check Firefox/WebKit, forced colors, focus contrast under themes, browser zoom,
  narrow containers, hidden-to-visible containers, and host CSP/style policies.
  Very small dimensions remain finite but labels can overlap; collision handling
  and production dimension validation are outside M01-T03.
- Approve final token names, accessible naming, validation policy, browser support,
  and production keyboard interactions before implementing chart families.

No public API compatibility issue or required M01-T02 contract change was found.
M01-T03 ends with this proof; M01-T04 is not begun.
