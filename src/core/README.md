# core

Shared chart infrastructure and pure calculations. M02-T01 implements internal
data normalization in `data/`; M02-T02 implements Cartesian scales and domains in
`scales/`. See [data normalization](../../docs/DATA_NORMALIZATION.md) and
[scales and domains](../../docs/SCALES_AND_DOMAINS.md). All helpers remain internal.
No geometry or public chart component has been implemented.

M02-T03 adds pure internal Cartesian layout in `layout/`: plot bounds, adaptive margins, physical axes, estimated tick-label selection, value grids, and baseline coordinates. See [layout and axes](../../docs/LAYOUT_AND_AXES.md). No public chart components or M02-T04 geometry are implemented.
