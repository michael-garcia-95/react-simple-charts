import { useState } from 'react';
import { DonutChart, PieChart, LineChart, AreaChart, BarChart } from '../src';
const data = [
  { name: 'Product', value: 48 },
  { name: 'Services', value: 32 },
  { name: 'Support', value: 20 },
];
export function DonutExamples() {
  const [activation, setActivation] = useState('No segment activation');
  const [count, setCount] = useState(0);
  const [details, setDetails] = useState(0);
  return (
    <section id="donut-examples" aria-labelledby="donut-heading">
      <h2 id="donut-heading">Public DonutChart</h2>
      <p>
        Source-ordered allocation with an empty hole or your own center content.
      </p>
      <output>
        {activation} · {count}
      </output>
      <div data-donut="ordinary">
        <h3>Default ratio and ring labels</h3>
        <DonutChart
          width={480}
          data={data}
          nameKey="name"
          valueKey="value"
          showLabels
          centerContent="Allocation"
          accessibility={{ label: 'Donut allocation', dataTable: 'visible' }}
          onDataActivate={(p) => {
            setActivation(`${String(p.label)}: ${p.value} (${p.inputMethod})`);
            setCount((n) => n + 1);
          }}
        />
      </div>
      <div data-donut="single">
        <h3>One full ring, empty center</h3>
        <DonutChart
          width={480}
          data={[{ name: 'Complete', value: 1 }]}
          nameKey="name"
          valueKey="value"
        />
      </div>
      <div data-donut="custom">
        <h3>Ratio 0.4, interactive center</h3>
        <DonutChart
          width={480}
          data={data}
          nameKey="name"
          valueKey="value"
          innerRadiusRatio={0.4}
          showLabels
          centerContent={
            <button
              aria-label={`Details ${details}`}
              onClick={() => setDetails((n) => n + 1)}
            >
              +
            </button>
          }
        />
      </div>
      <div data-donut="thin">
        <h3>Ratio 0.8, conservative labels</h3>
        <DonutChart
          width={480}
          data={data}
          nameKey="name"
          valueKey="value"
          innerRadiusRatio={0.8}
          showLabels
          centerContent={
            <>
              <strong>Allocation</strong>
              <div>Current quarter</div>
            </>
          }
        />
      </div>
      <div data-donut="duplicates">
        <h3>Duplicate names</h3>
        <DonutChart
          width={480}
          data={[
            { name: 'Same', value: 2 },
            { name: 'Same', value: 3 },
          ]}
          nameKey="name"
          valueKey="value"
        />
      </div>
      <div data-donut="excluded">
        <h3>Complete source rows</h3>
        <DonutChart
          width={480}
          data={[
            { name: 'Eligible', value: 3 },
            { name: 'Zero', value: 0 },
            { name: 'Missing', value: null },
          ]}
          nameKey="name"
          valueKey="value"
          accessibility={{ dataTable: 'visible' }}
        />
      </div>
      <div data-donut="negative">
        <h3>Negative unavailable</h3>
        <DonutChart
          width={480}
          data={[
            { name: 'Positive', value: 2 },
            { name: 'Negative', value: -1 },
          ]}
          nameKey="name"
          valueKey="value"
          centerContent="Hidden"
          accessibility={{ dataTable: 'visible' }}
        />
      </div>
      <div data-donut="empty">
        <h3>Empty allocation</h3>
        <DonutChart
          width={480}
          data={data.map((row) => ({ ...row, value: 0 }))}
          nameKey="name"
          valueKey="value"
          centerContent="Hidden"
        />
      </div>
      <div data-donut="narrow" style={{ maxWidth: 320, width: '100%' }}>
        <h3>Narrow responsive allocation</h3>
        <DonutChart
          data={[
            { name: 'NorthAmericaEnterpriseSubscriptions', value: 4 },
            { name: 'Other', value: 2 },
            { name: 'Tiny', value: 0.01 },
          ]}
          nameKey="name"
          valueKey="value"
          centerContent="LongCenterContentWrapsWithinTheActualHole"
          showLabels
          accessibility={{ dataTable: 'visible' }}
        />
      </div>
      <div data-donut="rectangle">
        <h3>Non-square, CSS-constrained viewport</h3>
        <DonutChart
          width={600}
          height={240}
          data={data}
          nameKey="name"
          valueKey="value"
          centerContent="Q1"
        />
      </div>
      <div data-donut="tiny">
        <h3>Tiny hole safely contains content</h3>
        <DonutChart
          width={480}
          data={data}
          nameKey="name"
          valueKey="value"
          innerRadiusRatio={0.01}
          centerContent="Contained"
        />
      </div>
      <div data-donut="paired">
        <h3>Pie and Donut, same data</h3>
        <div style={{ display: 'flex', flexWrap: 'wrap' }}>
          <PieChart width={360} data={data} nameKey="name" valueKey="value" />
          <DonutChart width={360} data={data} nameKey="name" valueKey="value" />
        </div>
      </div>
      <div data-donut="all">
        <h3>All five families</h3>
        {[LineChart, AreaChart, BarChart].map((Chart, i) => (
          <Chart
            key={i}
            width={320}
            style={{ maxWidth: '100%' }}
            data={data}
            xKey="name"
            yKey="value"
          />
        ))}
        <PieChart width={320} data={data} nameKey="name" valueKey="value" />
        <DonutChart
          width={320}
          data={data}
          nameKey="name"
          valueKey="value"
          centerContent={0}
        />
      </div>
    </section>
  );
}
