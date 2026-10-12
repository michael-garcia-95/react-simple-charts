# Internal rendering

React orchestration and presentation shared by the public chart wrappers. No
internal subpath is exported from the package.

`CartesianPointRenderer` coordinates Line, Area and Bar dimensions, normalization,
geometry, SVG layers, legends, states and source tables. `PolarRenderer` shares
Pie/Donut normalization, polar geometry, presentation and inspection; Donut adds a
contained HTML center region derived from the ring's inner radius.

`svg/` contains frames, decorative marks, axes, hit regions, data tables, formatting
and presentation styles. `use-container-width` manages per-instance responsive
measurement and observer cleanup. Inspection components in `charts/` own local
interaction state; mathematical calculations stay in `core/`.

`LineRenderer` is an internal alias. `LinePreview` and `RenderingProbe` are
repository-only compatibility fixtures, not consumer APIs. See the
[architecture](../../docs/ARCHITECTURE.md) for boundaries and SSR behavior.
