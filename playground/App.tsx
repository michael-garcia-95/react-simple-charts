import { LinePreview } from '../src/internal/LinePreview';
import { RenderingProbe } from '../src/internal/RenderingProbe';

export function App() {
  return (
    <main>
      <p className="eyebrow">Development playground · M03-T01</p>
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
      <section aria-labelledby="line-heading">
        <h2 id="line-heading">Actual engine-based internal Line previews</h2>
        <p>
          Beautiful charts. Simple React. These source-internal previews consume
          supplied data through normalization and geometry. The historical probe
          above remains a fixed compatibility fixture.
        </p>
        <h3>One series · categories</h3>
        <LinePreview
          width={640}
          data={[
            { month: 'Jan', revenue: 12 },
            { month: 'Feb', revenue: 24 },
            { month: 'Mar', revenue: 18 },
          ]}
          xKey="month"
          yKey="revenue"
          accessibility={{ label: 'Monthly revenue', dataTable: 'visible' }}
        />
        <h3>Multiple series · independent gaps · repeated categories</h3>
        <LinePreview
          width={640}
          data={[
            { month: 'Jan', actual: 12, forecast: 14 },
            { month: 'Jan', actual: null, forecast: 20 },
            { month: 'Mar', actual: 18, forecast: null },
            { month: 'Apr', actual: 26, forecast: 28 },
          ]}
          xKey="month"
          series={[
            { key: 'actual', label: 'Actual' },
            { key: 'forecast', label: 'Forecast' },
          ]}
          accessibility={{ label: 'Actual and forecast', dataTable: 'visible' }}
        />
        <h3>Linear X · explicit bounds and plot clipping</h3>
        <LinePreview
          width={640}
          data={[
            { distance: -2, value: 5 },
            { distance: 4, value: 18 },
            { distance: 12, value: 8 },
          ]}
          xScale="linear"
          xKey="distance"
          yKey="value"
          xAxis={{ min: 0, max: 10, label: 'Distance' }}
          yAxis={{ label: 'Value' }}
          accessibility={{ label: 'Linear measurements' }}
        />
        <h3>UTC dates</h3>
        <LinePreview
          width={640}
          data={dateData}
          xScale="utc"
          xKey="date"
          yKey="value"
          xAxis={{ formatTick: (date) => date.toISOString().slice(5, 10) }}
          accessibility={{ label: 'UTC observations' }}
        />
        <h3>Local time · client timezone after mounting</h3>
        <LinePreview
          width={640}
          data={dateData}
          xScale="time"
          xKey="date"
          yKey="value"
          xAxis={{ formatTick: (date) => date.toISOString().slice(5, 10) }}
          accessibility={{ label: 'Local-time observations' }}
        />
        <h3>Responsive engine preview</h3>
        <div
          style={{
            resize: 'horizontal',
            overflow: 'auto',
            minWidth: 200,
            maxWidth: '100%',
            padding: 8,
          }}
        >
          <LinePreview
            data={[
              { x: 'A', y: 5 },
              { x: 'B', y: 12 },
              { x: 'C', y: 8 },
            ]}
            xKey="x"
            yKey="y"
            accessibility={{ label: 'Responsive engine preview' }}
          />
        </div>
        <h3>Empty data</h3>
        <LinePreview<{ x: string; y: number }>
          width={640}
          data={[]}
          xKey="x"
          yKey="y"
          accessibility={{ label: 'Empty observations', dataTable: 'visible' }}
        />
        <h3>Unavailable rendering · invalid axis bounds</h3>
        <LinePreview
          width={640}
          data={[{ x: 'A', y: 5 }]}
          xKey="x"
          yKey="y"
          yAxis={{ min: 10, max: 0 }}
          accessibility={{
            label: 'Unavailable observations',
            dataTable: 'visible',
          }}
        />
      </section>
    </main>
  );
}

const dateData = [
  { date: new Date('2026-03-07T00:00:00Z'), value: 10 },
  { date: new Date('2026-03-08T00:00:00Z'), value: 18 },
  { date: new Date('2026-03-10T00:00:00Z'), value: 14 },
];
