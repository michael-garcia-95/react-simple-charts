# internal

CartesianPointRenderer shares dimensions, normalization, family geometry dispatch,
SVG layers, legends, states and tables between public LineChart/AreaChart and
source-internal LinePreview. LineRenderer retains its historical internal alias.
AreaMarks and LineMarks render separate decorative family marks. RenderingProbe
preserves the fixed compatibility fixture. No internal subpath is exported.
