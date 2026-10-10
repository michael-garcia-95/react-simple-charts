# Public LineChart — M03-T02

```tsx
import { LineChart } from 'react-simple-charts';

const data = [
  { month: 'Jan', actual: 10, forecast: 12 },
  { month: 'Jan', actual: 20, forecast: 22 },
  { month: 'Mar', actual: null, forecast: 18 },
];
export function Revenue() {
  return (
    <LineChart
      data={data}
      xKey="month"
      series={[
        { key: 'actual', label: 'Actual' },
        { key: 'forecast', label: 'Forecast' },
      ]}
      accessibility={{ label: 'Revenue and forecast', dataTable: 'visible' }}
      formatValue={(value) => `$${value.toFixed(2)}`}
      onDataActivate={(item) => console.log(item.record, item.inputMethod)}
    />
  );
}
```

TypeScript infers the record from `data`; `NoInfer` keeps keys and callbacks from
widening it. Use `yKey="actual"` instead of `series` for one series. Exactly one
mapping is required. AreaChart is also public; BarChart is also public; Pie and Donut remain type contracts only.

## Every public prop

| Prop                 | Behavior                                                                                                                      |
| -------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `data`               | Readonly source records, preserved by reference in callbacks; no coercion.                                                    |
| `xKey`               | Category field by default; numeric for linear; Date for UTC/time.                                                             |
| `xScale`             | `category` default, `linear`, `utc`, or client-local `time`.                                                                  |
| `yKey` / `series`    | One numeric field or ordered series with keys, labels, colors; missing/invalid values form independent gaps.                  |
| `xAxis`, `yAxis`     | Existing engine options: visibility, label, tick count and formatting; numeric axes support min/max.                          |
| `width`              | Positive finite number renders explicit geometry; omitted/string uses one container observer, default 100%.                   |
| `height`             | Positive finite pixels, default 280. Invalid dimensions show unavailable state.                                               |
| `className`, `style` | Applied to the outer figure; inline defaults and CSS variables need no stylesheet/provider. Width follows the dimension prop. |
| `colors`             | Ordered palette; explicit series color wins, then palette, then CSS variable/default colors.                                  |
| `animate`            | Static by default/false; true requests a 180ms client opacity enhancement for decorative marks only.                          |
| `formatValue`        | Numeric value labels in ticks, tables, point labels and default tooltip.                                                      |
| `formatCategory`     | Category tick fallback, source table, point labels and default tooltip.                                                       |
| `accessibility`      | Chart label (default “Line chart”), description, visible or visually hidden complete source table.                            |
| `showGrid`           | Value-axis gridlines enabled by default.                                                                                      |
| `showLegend`         | Static ordered legend by default for multiple series; false hides it.                                                         |
| `tooltip`            | Enabled shared mode by default; false hides presentation without disabling activation.                                        |
| `onDataActivate`     | One original datum plus `inputMethod` for a click/touch release/Enter/Space.                                                  |

For linear data use `xScale="linear" xKey="distance"`; for Date records use
`xScale="utc" xKey="date"` or `xScale="time"`. Repeated category values,
numbers and timestamps stay distinct by original source row and series index.
Geometry paths, axes and all coordinates come from the existing pure engine.
Singletons retain markers. Marks outside configured bounds are clipped; those
points have no inspection control, but remain in the table and valid shared row
items. Bounds do not clamp or rewrite source values.

## Tooltips and inspection

`true`, omission and a function renderer use shared mode. `{mode:'shared'}` and
`{mode:'item'}` select mode; either object accepts `render(context)`. The renderer
receives a discriminated union: narrow `context.mode` before reading `items` or
`item`. It replaces content inside the same positioned tooltip, may return null,
and must not introduce interactive controls (the tooltip does not receive focus).

```tsx
<LineChart
  data={data}
  xKey="month"
  yKey="actual"
  tooltip={{
    mode: 'item',
    render: (context) =>
      context.mode === 'item' ? (
        <span>
          {context.item.seriesLabel}: {context.item.value}
        </span>
      ) : null,
  }}
/>
```

Shared mode includes valid series values from the same original source row in
configured order. Equal labels/timestamps never merge rows. Payloads contain the
original `record`, `index`, raw `category` and `value`, configured `seriesKey`,
displayed `seriesLabel`, and resolved `color`. Native and cross-realm Date
references survive; formatter callbacks receive copies of Dates. Tooltip/table
formatting failures use deterministic raw text; invalid axis formatting follows
the engine's safe unavailable-state policy.

Mouse/pen enter or movement inspects a point; leave dismisses unless keyboard
focus remains. A 10px transparent hit radius leaves coordinates unchanged. Controls and focus
rings sit outside the decorative plot clip so endpoint rounding does not lose hits.
Touch release selects and activates once; synthesized clicks are suppressed.
Standalone accessibility-style clicks without mouse/pen gesture evidence are
classified as `keyboard`, using the unchanged InputMethod union. Tracked pointer
gestures remain `pointer` even with `detail=0`; native click pointer metadata is
also honored. Duplicate-click evidence is scoped to the source observation,
consumed once, and expires after the event task. Cancellation, blur, Escape and
new gestures clear stale evidence. A delayed native touch compatibility click
is deduplicated by its released pointer ID even if activation rerenders data, without
suppressing unrelated accessibility clicks.

Touch inspection persists until another selection, Escape, the local Dismiss
inspection button, or data replacement. Hover/focus/resize never activate.

There is one Tab entry among eligible point controls. ArrowRight/Down move forward,
ArrowLeft/Up backward in source-row/series order, Home/End select endpoints.
Enter/Space activate once (held-key repeats are ignored). Escape dismisses;
Tab/Shift+Tab leave normally. Focus has a ring independent of color and a named
SVG group exposes actual button roles, with no hidden ancestor. Stable tooltip
IDs provide `aria-describedby` only while visible. No live region or focus trap
is used. Changing data clears stale inspection; resizing retains eligible identity.

## Animation, SSR and hydration

The chart is fully visible during SSR, before hydration and without animation
support. `animate=true` uses the Web Animations API after mounting only when
`matchMedia` supports a non-reduced-motion preference. Reduction disables/cancels
motion. Cleanup cancels animation and preference subscriptions; geometry and axes
never move. No dependency, stylesheet or global style injection is required.

Explicit category/linear/UTC dimensions render complete browser-free SVG on the
server. Responsive widths initially render matching accessible placeholders,
then measure after mounting; tables always remain. Missing ResizeObserver keeps
the placeholder. Local time always uses the existing initial placeholder then
client timezone layout, avoiding assumptions about host timezone. UTC is the
predictable temporal choice. Locale-dependent custom formatters still require
matching server/client behavior. React useId supports sibling charts; independent
hydrated roots need coordinated `identifierPrefix` values.

Empty or unusable results retain their data alternative and expose no phantom
controls, NaN or Infinity coordinates. The package has only an ESM root entry,
retains a built `use client` boundary, and externalizes React peers (18.2/19).

## Limits

No nearest-path search, decimation, zoom, pan, interactive legend, portals or
Pie/Donut public charts are included. Rendering and lookup construction scale with
valid points; each point has an SVG marker/control, so large datasets incur DOM
and sorting costs. Pointer handlers use precomputed identities rather than
normalization or DOM measurements. Overlapping points can obscure pointer targets;
keyboard traversal and the source table preserve all eligible observations.
Tooltip placement is bounded approximately, without measuring arbitrary custom
content. Inline styles may conflict with strict CSP/host styles. Chromium/automated
accessibility checks do not establish screen-reader or all-browser conformance.
See [consumer compatibility](CONSUMER_COMPATIBILITY.md) for exact tested versions
and evidence. The package remains private 0.0.0; no release is claimed.

M03-T05 adds shared long-text wrapping and cross-family validation; see [integration hardening](M03_INTEGRATION_HARDENING.md).

## M04-T04 combined-page hardening

See [five-chart integration](M04_INTEGRATION_HARDENING.md) for the shared-page
audit, reproducible browser checks and demo handoff. The public contract and
pure geometry are unchanged.
Focused controls retain their roving entry and outline during pointer hover.
Legend labels wrap, and tooltips use the rendered figure width even when an
explicit SVG width is constrained by caller CSS.
