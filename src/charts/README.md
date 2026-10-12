# Charts

The five public components are LineChart, AreaChart, BarChart, PieChart and
DonutChart, exported through `src/index.ts`. Their generic props come from
`types/contracts.ts`; each wrapper delegates sizing and rendering to `internal/`.

`CartesianPointInspection` provides Line/Area point and Bar item/shared inspection,
keyboard navigation, tooltips, activation and optional opacity animation.
`PolarSegmentInspection` provides the corresponding source-ordered slice controls
for Pie/Donut. `LineInspection` is an internal alias of CartesianPointInspection.
Pure normalization, layout and geometry stay in `core/`.

See the [Line](../../docs/LINE_CHART.md), [Area](../../docs/AREA_CHART.md),
[Bar](../../docs/BAR_CHART.md), [Pie](../../docs/PIE_CHART.md) and
[Donut](../../docs/DONUT_CHART.md) guides for behavior and limitations.
