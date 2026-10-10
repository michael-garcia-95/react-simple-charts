import { useState } from 'react';
import { DonutExamples } from './DonutExamples';
import { FiveCharts } from './FiveCharts';
import { PieExamples } from './PieExamples';
import { Integration } from './Integration';
import { LineChart, AreaChart, BarChart } from '../src';
import { LinePreview } from '../src/internal/LinePreview';
import { RenderingProbe } from '../src/internal/RenderingProbe';

export function App() {
  const [activation, setActivation] = useState('No activation yet');
  return (
    <main>
      <p className="eyebrow">Development playground · M04-T04</p>
      <h1>React Simple Charts</h1>
      <p>
        A lightweight, customizable React charting library built with
        TypeScript.
      </p>
      <section aria-labelledby="status-heading">
        <h2 id="status-heading">
          Public Cartesian charts and internal rendering fixtures
        </h2>
        <p>
          LineChart is publicly importable. AreaChart and BarChart are also
          public; PieChart and DonutChart are public.
        </p>
        <p>Implemented chart families: Line, Bar, Area, Pie, and Donut.</p>
      </section>
      <FiveCharts />
      <PieExamples />
      <DonutExamples />
      <div role="region" aria-labelledby="historical-heading">
        <h2 id="historical-heading">Historical development fixtures</h2>
        <Integration />
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
            Resize the window or drag this container. The series and focus
            colors use CSS custom properties; the accessible data table is
            visually hidden.
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
        <section aria-labelledby="public-heading">
          <h2 id="public-heading">
            Public LineChart · keyboard, touch and tooltip inspection
          </h2>
          <p>
            Tab enters point inspection. Arrows, Home and End navigate;
            Enter/Space activate; Escape dismisses.
          </p>
          <LineChart
            data={[
              { month: 'Jan', actual: 10, forecast: 12 },
              { month: 'Jan', actual: 20, forecast: 22 },
              { month: 'Mar', actual: null, forecast: 18 },
            ]}
            xKey="month"
            series={[
              { key: 'actual', label: 'Actual' },
              { key: 'forecast', label: 'Forecast' },
            ]}
            accessibility={{ label: 'Public revenue', dataTable: 'visible' }}
            onDataActivate={(p) =>
              setActivation(
                `${p.seriesLabel}, source row ${p.index + 1}: ${p.value} (${p.inputMethod})`,
              )
            }
          />
          <output>{activation}</output>
          <h3>Item tooltip · opt-in animation · linear X</h3>
          <LineChart
            width={640}
            data={[
              { x: 0, y: 2 },
              { x: 2, y: 6 },
            ]}
            xScale="linear"
            xKey="x"
            yKey="y"
            tooltip={{ mode: 'item' }}
            animate
            accessibility={{ label: 'Public linear example' }}
          />
          <h3>Tooltip disabled · activation available</h3>
          <LineChart
            width={640}
            data={[{ x: 'A', y: 1 }]}
            xKey="x"
            yKey="y"
            tooltip={false}
            onDataActivate={(p) =>
              setActivation(`${p.value} (${p.inputMethod})`)
            }
            accessibility={{ label: 'Public activation only' }}
          />
        </section>
        <section aria-labelledby="area-heading">
          <h2 id="area-heading">
            Public AreaChart · independent zero-baseline fills
          </h2>
          {[
            [2, 5, 3],
            [-2, -5, -3],
            [-2, 5, -3],
            [0, 0, 0],
          ].map((values, index) => (
            <div key={index}>
              <h3>
                {['Positive', 'Negative', 'Mixed sign', 'Zero only'][index]}
              </h3>
              <AreaChart
                width={640}
                data={values.map((y, i) => ({ x: String(i + 1), y }))}
                xKey="x"
                yKey="y"
                accessibility={{
                  label: [
                    'Positive Area',
                    'Negative Area',
                    'Mixed Area',
                    'Zero Area',
                  ][index]!,
                  dataTable: 'visible',
                }}
                onDataActivate={(p) =>
                  setActivation(`${p.value} (${p.inputMethod})`)
                }
              />
            </div>
          ))}
          <h3>
            Multiple series · independent gaps · singleton · repeated categories
          </h3>
          <AreaChart
            width={640}
            data={[
              { x: 'Jan', a: 2, b: -2 },
              { x: 'Jan', a: 5, b: -4 },
              { x: 'Mar', a: null, b: -1 },
              { x: 'Apr', a: 3, b: null },
            ]}
            xKey="x"
            series={[
              { key: 'a', label: 'Above' },
              { key: 'b', label: 'Below' },
            ]}
            accessibility={{
              label: 'Area series and gaps',
              dataTable: 'visible',
            }}
          />
          <h3>Responsive Area · resize the window</h3>
          <AreaChart
            data={[
              { x: 'A', y: 2 },
              { x: 'B', y: 6 },
            ]}
            xKey="x"
            yKey="y"
            accessibility={{ label: 'Responsive Area' }}
          />
          <h3>Linear Area · bounds and clipping · item tooltip</h3>
          <AreaChart
            width={640}
            data={[
              { x: -2, y: -10 },
              { x: 4, y: 4 },
              { x: 12, y: 10 },
            ]}
            xScale="linear"
            xKey="x"
            yKey="y"
            xAxis={{ min: 0, max: 10 }}
            yAxis={{ min: -5, max: 5 }}
            tooltip={{ mode: 'item' }}
            animate
            accessibility={{ label: 'Clipped linear Area' }}
          />
          <h3>UTC Area</h3>
          <AreaChart
            width={640}
            data={dateData}
            xScale="utc"
            xKey="date"
            yKey="value"
            xAxis={{ formatTick: (date) => date.toISOString().slice(5, 10) }}
            accessibility={{ label: 'UTC Area' }}
          />
          <h3>Empty Area</h3>
          <AreaChart<{ x: string; y: number }>
            width={640}
            data={[]}
            xKey="x"
            yKey="y"
            accessibility={{ label: 'Empty Area' }}
          />
          <h3>Unavailable Area</h3>
          <AreaChart
            width={640}
            data={[{ x: 'A', y: 2 }]}
            xKey="x"
            yKey="y"
            yAxis={{ min: 5, max: 1 }}
            accessibility={{ label: 'Unavailable Area' }}
          />
        </section>
        <section aria-labelledby="bar-heading">
          <h2 id="bar-heading">Public BarChart · exact grouped rectangles</h2>
          {(['vertical', 'horizontal'] as const).map((orientation) => (
            <div key={orientation}>
              {[
                ['Positive', [2, 5, 3]],
                ['Negative', [-2, -5, -3]],
                ['Mixed and zero', [-2, 0, 3]],
              ].map(([name, values]) => (
                <div key={String(name)}>
                  <h3>
                    {String(name)} {orientation} Bars
                  </h3>
                  <BarChart
                    width={640}
                    orientation={orientation}
                    data={(values as number[]).map((y, i) => ({
                      x: String(i + 1),
                      y,
                    }))}
                    xKey="x"
                    yKey="y"
                    accessibility={{
                      label: `${name} ${orientation} Bars`,
                      dataTable: 'visible',
                    }}
                    onDataActivate={(p) =>
                      setActivation(`${p.value} (${p.inputMethod})`)
                    }
                  />
                </div>
              ))}
              <h3>
                Grouped {orientation} · missing slots · duplicate categories ·
                shared tooltip
              </h3>
              <BarChart
                width={640}
                orientation={orientation}
                data={[
                  { x: 'Jan', a: 2, b: -2 },
                  { x: 'Jan', a: null, b: 4 },
                  { x: 'Mar', a: 0, b: null },
                ]}
                xKey="x"
                series={[{ key: 'a' }, { key: 'b' }]}
                tooltip={{ mode: 'shared' }}
                accessibility={{
                  label: `Grouped ${orientation} Bars`,
                  dataTable: 'visible',
                }}
              />
            </div>
          ))}
          <h3>Dense categories</h3>
          <BarChart
            width={640}
            data={Array.from({ length: 200 }, (_, x) => ({
              x,
              y: (x % 9) - 4,
            }))}
            xKey="x"
            yKey="y"
            accessibility={{ label: 'Dense Bars' }}
          />
          <h3>Explicit bounds and clipping</h3>
          <BarChart
            width={640}
            data={[
              { x: 'A', y: -10 },
              { x: 'B', y: 10 },
              { x: 'C', y: 0 },
            ]}
            xKey="x"
            yKey="y"
            yAxis={{ min: -3, max: 3 }}
            accessibility={{ label: 'Clipped Bars' }}
          />
          <h3>Responsive Bar</h3>
          <BarChart
            data={[
              { x: 'A', y: 2 },
              { x: 'B', y: -3 },
            ]}
            xKey="x"
            yKey="y"
            accessibility={{ label: 'Responsive Bar' }}
          />
          <h3>Empty Bar</h3>
          <BarChart<{ x: string; y: number }>
            width={640}
            data={[]}
            xKey="x"
            yKey="y"
            accessibility={{ label: 'Empty Bar' }}
          />
          <h3>Unavailable Bar</h3>
          <BarChart
            width={640}
            data={[{ x: 'A', y: 2 }]}
            xKey="x"
            yKey="y"
            yAxis={{ min: 3, max: 1 }}
            accessibility={{ label: 'Unavailable Bar' }}
          />
        </section>
        <section aria-labelledby="line-heading">
          <h2 id="line-heading">Actual engine-based internal Line previews</h2>
          <p>
            Beautiful charts. Simple React. These source-internal previews
            consume supplied data through normalization and geometry. The
            historical probe above remains a fixed compatibility fixture.
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
            accessibility={{
              label: 'Actual and forecast',
              dataTable: 'visible',
            }}
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
            accessibility={{
              label: 'Empty observations',
              dataTable: 'visible',
            }}
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
      </div>
    </main>
  );
}

const dateData = [
  { date: new Date('2026-03-07T00:00:00Z'), value: 10 },
  { date: new Date('2026-03-08T00:00:00Z'), value: 18 },
  { date: new Date('2026-03-10T00:00:00Z'), value: 14 },
];
