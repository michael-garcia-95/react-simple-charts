import { RenderingProbe } from '../src/internal/RenderingProbe';

export function App() {
  return (
    <main>
      <p className="eyebrow">Development playground · M01-T03</p>
      <h1>React Simple Charts</h1>
      <p>
        A lightweight, customizable React charting library built with
        TypeScript.
      </p>
      <section aria-labelledby="status-heading">
        <h2 id="status-heading">Internal rendering prototype</h2>
        <p>
          Architecture proof only. Public chart components have not been
          implemented yet.
        </p>
        <p>Planned chart families: Line, Bar, Area, Pie, and Donut.</p>
      </section>
      <section aria-labelledby="explicit-heading">
        <h2 id="explicit-heading">Explicit dimensions · 640 × 280</h2>
        <p>
          Complete SVG during server rendering. Tab to the graphic to inspect
          its focus indicator.
        </p>
        <div style={{ overflowX: 'auto', padding: 8 }}>
          <RenderingProbe
            width={640}
            height={280}
            accessibility={{
              label: 'Explicit quarterly sample',
              description: 'Four quarterly values; Q4 is highest.',
              dataTable: 'visible',
            }}
          />
        </div>
      </section>
      <section aria-labelledby="responsive-heading">
        <h2 id="responsive-heading">
          Responsive dimensions · default 280px height
        </h2>
        <p>
          Resize the window or drag this container. The series and focus colors
          use CSS custom properties; the accessible data table is visually
          hidden.
        </p>
        <div
          style={{
            resize: 'horizontal',
            overflow: 'auto',
            maxWidth: '100%',
            minWidth: 200,
            padding: 8,
          }}
        >
          <RenderingProbe
            style={{
              '--rsc-series-color': '#086b62',
              '--rsc-focus-color': '#9d174d',
            }}
            accessibility={{
              label: 'Responsive quarterly sample',
              description: 'The same four values in a measured container.',
            }}
          />
        </div>
      </section>
    </main>
  );
}
