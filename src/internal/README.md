# internal

CartesianPointRenderer shares dimensions, normalization, family geometry dispatch,
SVG layers, legends, states and tables between public LineChart/AreaChart/BarChart and
source-internal LinePreview. LineRenderer retains its historical internal alias.
AreaMarks and LineMarks render separate decorative family marks. RenderingProbe
preserves the fixed compatibility fixture. No internal subpath is exported.

## M03-T04 public BarChart

BarChart now consumes existing grouped rectangle geometry in both orientations.
Physical formatter routing preserves semantic xKey categories; shared presentation
and corrected gesture handling also serve Line/Area. Item inspection is the Bar
default; visible rectangle intersections and in-plot zero targets determine
eligibility. Exact decorative extents, stable missing slots, source tables and
SSR policy are preserved. No public props, dependencies, core math changes or
subpaths are added. See [BarChart](../../docs/BAR_CHART.md). M03-T05 remains deferred.
