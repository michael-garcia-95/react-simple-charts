import { useState } from 'react';
import { LineChart, AreaChart, BarChart } from '../src';

const samples = [
  { category: 'NorthAmericaEnterpriseSubscriptions', actual: -4, forecast: 3 },
  { category: 'EuropeEnterpriseSubscriptions', actual: 0, forecast: null },
  { category: 'AsiaPacificEnterpriseSubscriptions', actual: 8, forecast: 5 },
];
const series = [
  { key: 'actual', label: 'Actual' },
  { key: 'forecast', label: 'Forecast' },
] as const;
export function Integration() {
  const [width, setWidth] = useState(480);
  const [state, setState] = useState('ready');
  const [count, setCount] = useState(0);
  const [method, setMethod] = useState('none');
  const [dense, setDense] = useState(0);
  const data =
    state === 'empty'
      ? []
      : dense
        ? Array.from({ length: dense }, (_, i) => ({
            category: `Category ${i}`,
            actual: (i % 17) - 8,
            forecast: (i % 13) - 6,
          }))
        : samples;
  return (
    <section id="integration" aria-labelledby="integration-title">
      <h2 id="integration-title">Cartesian integration matrix</h2>
      <p>
        Signed subscriptions; long category labels, missing forecast and zero
        actual.
      </p>
      <button id="integration-before" onClick={() => setCount(0)}>
        Reset activations
      </button>
      <label>
        Container width
        <select
          id="integration-width"
          value={width}
          onChange={(e) => setWidth(Number(e.target.value))}
        >
          {[320, 480, 768, 1200].map((w) => (
            <option key={w}>{w}</option>
          ))}
        </select>
      </label>
      <label>
        State
        <select
          id="integration-state"
          value={state}
          onChange={(e) => setState(e.target.value)}
        >
          {['ready', 'empty', 'unusable'].map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
      </label>
      <label>
        Rows
        <select
          id="integration-rows"
          value={dense}
          onChange={(e) => setDense(Number(e.target.value))}
        >
          {[0, 10, 100, 1000].map((n) => (
            <option key={n}>{n}</option>
          ))}
        </select>
      </label>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 24 }}>
        {(['line', 'area', 'vertical', 'horizontal', 'grouped'] as const).map(
          (family) => {
            const Chart =
              family === 'line'
                ? LineChart
                : family === 'area'
                  ? AreaChart
                  : BarChart;
            return (
              <div
                key={family}
                data-integration={family}
                style={{ width, maxWidth: '100%', minWidth: 0 }}
              >
                <h3>{family}</h3>
                <Chart
                  data={data}
                  xKey="category"
                  {...(family === 'grouped'
                    ? { series }
                    : { yKey: 'actual' as const })}
                  {...(family === 'horizontal'
                    ? { orientation: 'horizontal' as const }
                    : {})}
                  {...(state === 'unusable' ? { height: 0 } : {})}
                  animate
                  onDataActivate={(datum) => {
                    setCount((n) => n + 1);
                    setMethod(datum.inputMethod);
                  }}
                  accessibility={{
                    label: `Integration ${family}`,
                    dataTable: 'visible',
                  }}
                />
              </div>
            );
          },
        )}
      </div>
      <button id="integration-after">After charts</button>
      <output id="integration-activations">{count}</output>
      <output id="integration-method">{method}</output>
    </section>
  );
}
