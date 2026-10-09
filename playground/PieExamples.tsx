import { useState } from 'react';
import { PieChart } from '../src';
const ordinary = [
  { name: 'Product', value: 48 },
  { name: 'Services', value: 32 },
  { name: 'Support', value: 20 },
];
export function PieExamples() {
  const [activation, setActivation] = useState('Inspect or activate a segment');
  return (
    <section aria-labelledby="pie-heading" id="pie-examples">
      <h2 id="pie-heading">Public PieChart</h2>
      <p>
        Source-ordered shares. Arrow keys inspect slices; Enter or a tap
        activates. Every chart retains its complete source table.
      </p>
      <output>{activation}</output>
      <div data-pie="ordinary">
        <h3>Allocation with optional labels</h3>
        <PieChart
          width={480}
          data={ordinary}
          nameKey="name"
          valueKey="value"
          showLabels
          accessibility={{ label: 'Allocation', dataTable: 'visible' }}
          onDataActivate={(p) =>
            setActivation(`${String(p.label)}: ${p.value} (${p.inputMethod})`)
          }
        />
      </div>
      <div data-pie="single">
        <h3>One full circle</h3>
        <PieChart
          width={480}
          data={[{ name: 'Complete', value: 1 }]}
          nameKey="name"
          valueKey="value"
          accessibility={{ label: 'Complete share' }}
        />
      </div>
      <div data-pie="duplicates">
        <h3>Duplicate labels stay separate</h3>
        <PieChart
          width={480}
          data={[
            { name: 'Same', value: 2 },
            { name: 'Same', value: 3 },
          ]}
          nameKey="name"
          valueKey="value"
          accessibility={{ label: 'Separate repeated labels' }}
        />
      </div>
      <div data-pie="excluded">
        <h3>Zero and missing source rows</h3>
        <PieChart
          width={480}
          data={[
            { name: 'Eligible', value: 2 },
            { name: 'Zero', value: 0 },
            { name: 'Missing', value: null },
            { name: null, value: 3 },
          ]}
          nameKey="name"
          valueKey="value"
          accessibility={{ label: 'Zero and missing', dataTable: 'visible' }}
        />
      </div>
      <div data-pie="negative">
        <h3>Unsupported negative value</h3>
        <PieChart
          width={480}
          data={[
            { name: 'Positive', value: 3 },
            { name: 'Negative', value: -1 },
          ]}
          nameKey="name"
          valueKey="value"
          accessibility={{
            label: 'Negative unavailable',
            dataTable: 'visible',
          }}
        />
      </div>
      <div data-pie="custom">
        <h3>Custom tooltip</h3>
        <PieChart
          width={480}
          data={ordinary}
          nameKey="name"
          valueKey="value"
          tooltip={{
            render: ({ segment }) => (
              <span>
                {String(segment.label)} accounts for{' '}
                {segment.percentage.toFixed(1)}% of the allocation.
              </span>
            ),
          }}
          accessibility={{ label: 'Custom allocation' }}
        />
      </div>
      <div data-pie="narrow" style={{ width: '100%', maxWidth: 320 }}>
        <h3>Narrow responsive chart</h3>
        <PieChart
          data={[
            { name: 'NorthAmericaEnterpriseSubscriptions', value: 4 },
            { name: 'Other', value: 2 },
            { name: 'Tiny', value: 0.01 },
          ]}
          nameKey="name"
          valueKey="value"
          showLabels
          accessibility={{ label: 'Narrow shares', dataTable: 'visible' }}
        />
      </div>
      <div data-pie="many">
        <h3>Many segments</h3>
        <PieChart
          width={480}
          data={Array.from({ length: 12 }, (_, i) => ({
            name: `Segment ${i + 1}`,
            value: i + 1,
          }))}
          nameKey="name"
          valueKey="value"
          accessibility={{ label: 'Many shares' }}
        />
      </div>
      <div data-pie="empty">
        <h3>All zero</h3>
        <PieChart
          width={480}
          data={[{ name: 'Zero', value: 0 }]}
          nameKey="name"
          valueKey="value"
          accessibility={{ label: 'All zero' }}
        />
      </div>
    </section>
  );
}
