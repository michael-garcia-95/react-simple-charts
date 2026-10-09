# core

Shared chart infrastructure and pure calculations. M02-T01 implements internal
data normalization in `data/`; M02-T02 implements Cartesian scales and domains in
`scales/`. See [data normalization](../../docs/DATA_NORMALIZATION.md) and
[scales and domains](../../docs/SCALES_AND_DOMAINS.md). All helpers remain internal.
No public chart component has been implemented.

M02-T03 adds pure internal Cartesian layout in `layout/`: plot bounds, adaptive margins, physical axes, estimated tick-label selection, value grids, and baseline coordinates. See [layout and axes](../../docs/LAYOUT_AND_AXES.md). M02-T04 adds pure Cartesian geometry in `geometry/`: shared point mapping, independent gap runs, Line/Area path data, grouped Bar rectangles and clipping metadata. See [geometry foundations](../../docs/GEOMETRY_FOUNDATIONS.md). Milestone 02’s planned internal foundations are implemented, subject to M02-T04 PR review and merge. Public chart components remain future work.
