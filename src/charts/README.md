# charts

LineChart, AreaChart and BarChart are the only public runtime components.
CartesianPointInspection owns shared point controls, tooltips, corrected activation
and conservative client animation. Pure math stays in core; shared orchestration
stays in internal/CartesianPointRenderer. Area polygon inspection is out of scope.
See [LineChart](../../docs/LINE_CHART.md) and [AreaChart](../../docs/AREA_CHART.md).

## M03-T04 public BarChart

BarChart now consumes existing grouped rectangle geometry in both orientations.
Physical formatter routing preserves semantic xKey categories; shared presentation
and corrected gesture handling also serve Line/Area. Item inspection is the Bar
default; visible rectangle intersections and in-plot zero targets determine
eligibility. Exact decorative extents, stable missing slots, source tables and
SSR policy are preserved. No public props, dependencies, core math changes or
subpaths are added. See [BarChart](../../docs/BAR_CHART.md). M03-T05 remains deferred.
