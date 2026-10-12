# Core

Pure calculations shared by the five chart families. These modules do not import
React or read the DOM, and none is a public package export.

- `data/`: validate field mappings and classify/normalize records while preserving
  source references, indices, duplicates and missing/invalid values.
- `scales/`: Cartesian category, numeric and temporal domains, mappings and ticks.
- `layout/`: plot bounds, adaptive margins, physical axes, estimated tick-label
  selection, value grids and zero-baseline coordinates.
- `geometry/`: Cartesian gap runs, Line/Area paths and grouped Bar rectangles;
  polar eligibility, scaled proportions, angles, radii and Pie/Donut arc paths.

Geometry carries clipping and numerical-safety metadata; React renderers consume
these results rather than recalculating paths, totals or percentages. Area outline
paths reuse the same mapped runs as their fills. Polar negatives reject the entire
geometry instead of presenting a misleading partial chart.

References: [normalization](../../docs/DATA_NORMALIZATION.md),
[scales](../../docs/SCALES_AND_DOMAINS.md), [layout](../../docs/LAYOUT_AND_AXES.md),
[Cartesian geometry](../../docs/GEOMETRY_FOUNDATIONS.md) and
[polar geometry](../../docs/POLAR_GEOMETRY_FOUNDATIONS.md).
