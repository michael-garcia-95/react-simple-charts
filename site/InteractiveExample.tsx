import { useState } from 'react';
import {
  LineChart,
  AreaChart,
  BarChart,
  PieChart,
  DonutChart,
} from 'react-simple-charts';
import type { Family } from './charts';
import { ChartCard, CodePreview } from './components';
import type { CartesianPreset, PolarPreset } from './example-data';
import {
  monthlyRevenue,
  websiteTraffic,
  monthlyGrowth,
  runningTrend,
  categoryOrders,
  revenueDistribution,
  customerSegments,
  budgetAllocation,
  projectDistribution,
} from './example-data';
import {
  actualForecast,
  defaultSettings,
  exampleAccessibility,
  exampleCode,
  examplePreset,
} from './example-code';
import type { ExampleSettings } from './example-code';

const descriptions = {
  line: {
    title: 'Follow a trend',
    description:
      'Explore revenue or website traffic. Compare related series, and see how missing observations remain gaps.',
  },
  area: {
    title: 'Give change context',
    description:
      'Compare signed monthly growth with a running trend. The area shows each observation in relation to zero.',
  },
  bar: {
    title: 'Compare values',
    description:
      'Compare actual revenue with a forecast, or explore categories with zero and missing observations.',
  },
  pie: {
    title: 'Show the parts',
    description:
      'Explore revenue shares or customer counts. Only positive observations create slices; every source row remains available.',
  },
  donut: {
    title: 'Frame the whole',
    description:
      'Explore budgets or project hours, and try different ring widths. The center offers a short contextual label.',
  },
};
function CartesianPreview<T extends object>({
  family,
  preset,
  state,
}: {
  family: 'line' | 'area' | 'bar';
  preset: CartesianPreset<T>;
  state: ExampleSettings;
}) {
  const shared = {
    data: preset.data,
    xKey: preset.xKey,
    height: 240,
    showLegend: state.showLegend,
    animate: state.animate,
    tooltip: state.tooltip,
    showGrid: state.showGrid,
    formatValue: preset.formatValue,
    accessibility: exampleAccessibility(family, state),
  };
  const mapping =
    preset.series && (family === 'bar' || state.multiple)
      ? { series: preset.series }
      : { yKey: preset.yKey };
  switch (family) {
    case 'line':
      return <LineChart {...shared} {...mapping} />;
    case 'area':
      return <AreaChart {...shared} {...mapping} />;
    case 'bar':
      return state.orientation === 'horizontal' ? (
        <BarChart {...shared} {...mapping} orientation="horizontal" />
      ) : (
        <BarChart {...shared} {...mapping} orientation="vertical" />
      );
  }
}
function PolarPreview<T extends object>({
  family,
  preset,
  state,
}: {
  family: 'pie' | 'donut';
  preset: PolarPreset<T>;
  state: ExampleSettings;
}) {
  const shared = {
    data: preset.data,
    nameKey: preset.nameKey,
    valueKey: preset.valueKey,
    height: 240,
    showLegend: state.showLegend,
    animate: state.animate,
    tooltip: state.tooltip,
    showLabels: state.showLabels,
    formatValue: preset.formatValue,
    accessibility: exampleAccessibility(family, state),
  };
  return family === 'pie' ? (
    <PieChart {...shared} />
  ) : (
    <DonutChart
      {...shared}
      innerRadiusRatio={state.innerRadiusRatio}
      centerContent={preset.center}
    />
  );
}
// Each branch keeps its original record type rather than spreading a union of datasets into JSX.
export function LiveExample({
  family,
  state,
}: {
  family: Family;
  state: ExampleSettings;
}) {
  const alternative = state.dataset === 'alternative';
  switch (family) {
    case 'line':
      return alternative ? (
        <CartesianPreview family="line" preset={websiteTraffic} state={state} />
      ) : (
        <CartesianPreview family="line" preset={monthlyRevenue} state={state} />
      );
    case 'area':
      return alternative ? (
        <CartesianPreview family="area" preset={runningTrend} state={state} />
      ) : (
        <CartesianPreview family="area" preset={monthlyGrowth} state={state} />
      );
    case 'bar':
      return alternative ? (
        <CartesianPreview family="bar" preset={categoryOrders} state={state} />
      ) : (
        <CartesianPreview family="bar" preset={actualForecast} state={state} />
      );
    case 'pie':
      return alternative ? (
        <PolarPreview family="pie" preset={customerSegments} state={state} />
      ) : (
        <PolarPreview family="pie" preset={revenueDistribution} state={state} />
      );
    case 'donut':
      return alternative ? (
        <PolarPreview
          family="donut"
          preset={projectDistribution}
          state={state}
        />
      ) : (
        <PolarPreview family="donut" preset={budgetAllocation} state={state} />
      );
  }
}
export function InteractiveExample({ family }: { family: Family }) {
  const [state, setState] = useState(defaultSettings);
  const preset = examplePreset(family, state.dataset);
  function update<K extends keyof ExampleSettings>(
    key: K,
    value: ExampleSettings[K],
  ) {
    setState((current) => ({ ...current, [key]: value }));
  }
  function checkbox(
    key:
      | 'showLegend'
      | 'animate'
      | 'tooltip'
      | 'showGrid'
      | 'multiple'
      | 'showLabels',
    label: string,
  ) {
    return (
      <label className="check-control">
        <input
          type="checkbox"
          checked={state[key]}
          onChange={(event) => update(key, event.target.checked)}
        />
        {label}
      </label>
    );
  }
  return (
    <ChartCard id={`chart-${family}`} {...descriptions[family]}>
      <div className="example-workspace">
        <fieldset className="example-controls">
          <legend>
            {family.charAt(0).toUpperCase() + family.slice(1)} settings
          </legend>
          <label className="select-control">
            Dataset
            <select
              value={state.dataset}
              onChange={(event) =>
                update(
                  'dataset',
                  event.target.value === 'alternative'
                    ? 'alternative'
                    : 'primary',
                )
              }
            >
              <option value="primary">
                {examplePreset(family, 'primary').label}
              </option>
              <option value="alternative">
                {examplePreset(family, 'alternative').label}
              </option>
            </select>
          </label>
          {checkbox('showLegend', 'Show legend')}
          <label className="check-control">
            <input
              type="checkbox"
              checked={state.dataTable === 'visible'}
              onChange={(event) =>
                update(
                  'dataTable',
                  event.target.checked ? 'visible' : 'visually-hidden',
                )
              }
            />
            Show source table
          </label>
          {checkbox('animate', 'Enable animation')}
          {checkbox('tooltip', 'Show tooltip')}
          {(family === 'line' || family === 'area' || family === 'bar') &&
            checkbox('showGrid', 'Show grid')}
          {(family === 'line' || family === 'area') &&
            checkbox('multiple', 'Compare two series')}
          {family === 'bar' && (
            <label className="select-control">
              Orientation
              <select
                value={state.orientation}
                onChange={(event) =>
                  update(
                    'orientation',
                    event.target.value === 'horizontal'
                      ? 'horizontal'
                      : 'vertical',
                  )
                }
              >
                <option value="vertical">Vertical</option>
                <option value="horizontal">Horizontal</option>
              </select>
            </label>
          )}
          {(family === 'pie' || family === 'donut') &&
            checkbox('showLabels', 'Show slice labels')}
          {family === 'donut' && (
            <label className="select-control">
              Inner-radius ratio
              <select
                value={state.innerRadiusRatio}
                onChange={(event) =>
                  update(
                    'innerRadiusRatio',
                    event.target.value === '0.4'
                      ? 0.4
                      : event.target.value === '0.8'
                        ? 0.8
                        : 0.6,
                  )
                }
              >
                <option value="0.4">0.4 · thick ring</option>
                <option value="0.6">0.6 · balanced ring</option>
                <option value="0.8">0.8 · thin ring</option>
              </select>
            </label>
          )}
          <button
            type="button"
            className="button button-secondary"
            onClick={() => setState(defaultSettings())}
          >
            Reset
          </button>
          <p className="control-note">
            {family === 'line' || family === 'area' || family === 'bar'
              ? 'The library shows a legend for multiple series. Single series need no key.'
              : family === 'donut' || family === 'pie'
                ? 'Labels appear only where the library finds room inside a slice.'
                : 'Animation is a brief opacity change and respects reduced motion.'}
          </p>
        </fieldset>
        <div className="example-preview">
          <p className="preview-label">{preset.label}</p>
          <p className="chart-note">{preset.note}</p>
          <LiveExample family={family} state={state} />
        </div>
      </div>
      <CodePreview
        label={`${family.charAt(0).toUpperCase() + family.slice(1)} example source`}
        language="TSX"
        copyable
      >
        {exampleCode(family, state)}
      </CodePreview>
    </ChartCard>
  );
}
