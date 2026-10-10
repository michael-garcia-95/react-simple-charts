import type { Family } from './charts';
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

export interface ExampleSettings {
  dataset: 'primary' | 'alternative';
  showLegend: boolean;
  dataTable: 'visible' | 'visually-hidden';
  animate: boolean;
  tooltip: boolean;
  showGrid: boolean;
  multiple: boolean;
  orientation: 'vertical' | 'horizontal';
  showLabels: boolean;
  innerRadiusRatio: 0.4 | 0.6 | 0.8;
}
export function defaultSettings(): ExampleSettings {
  return {
    dataset: 'primary',
    showLegend: true,
    dataTable: 'visible',
    animate: false,
    tooltip: true,
    showGrid: true,
    multiple: false,
    orientation: 'vertical',
    showLabels: false,
    innerRadiusRatio: 0.6,
  };
}
export const actualForecast = {
  ...monthlyRevenue,
  label: 'Actual versus forecast',
};
export function examplePreset(
  family: Family,
  dataset: ExampleSettings['dataset'],
) {
  const alternative = dataset === 'alternative';
  switch (family) {
    case 'line':
      return alternative ? websiteTraffic : monthlyRevenue;
    case 'area':
      return alternative ? runningTrend : monthlyGrowth;
    case 'bar':
      return alternative ? categoryOrders : actualForecast;
    case 'pie':
      return alternative ? customerSegments : revenueDistribution;
    case 'donut':
      return alternative ? projectDistribution : budgetAllocation;
  }
}
export const inspectionDescription =
  'Fictional demonstration data. Use arrow keys to inspect values; the complete source data table is always available.';
export function exampleAccessibility(family: Family, state: ExampleSettings) {
  return {
    label: `${family.charAt(0).toUpperCase() + family.slice(1)}: ${examplePreset(family, state.dataset).label}`,
    description: inspectionDescription,
    dataTable: state.dataTable,
  };
}
const componentNames = {
  line: 'LineChart',
  area: 'AreaChart',
  bar: 'BarChart',
  pie: 'PieChart',
  donut: 'DonutChart',
} as const;
function formatData(data: readonly object[]) {
  return `[\n${data
    .map(
      (row) =>
        `  { ${Object.entries(row)
          .map(([key, value]) => `${key}: ${JSON.stringify(value)}`)
          .join(', ')} },`,
    )
    .join('\n')}\n]`;
}
// Only fixed, typed presets and native control values enter these authored JSX templates.
export function exampleCode(family: Family, state: ExampleSettings): string {
  const preset = examplePreset(family, state.dataset);
  const component = componentNames[family];
  const props: string[] = ['data={data}'];
  if ('xKey' in preset) {
    props.push(`xKey=${JSON.stringify(preset.xKey)}`);
    if (
      'series' in preset &&
      (((family === 'line' || family === 'area') && state.multiple) ||
        family === 'bar')
    ) {
      props.push(`series={${JSON.stringify(preset.series)}}`);
    } else props.push(`yKey=${JSON.stringify(preset.yKey)}`);
    props.push(`showGrid={${state.showGrid}}`);
    if (family === 'bar') props.push(`orientation="${state.orientation}"`);
  } else {
    props.push(
      `nameKey=${JSON.stringify(preset.nameKey)}`,
      `valueKey=${JSON.stringify(preset.valueKey)}`,
      `showLabels={${state.showLabels}}`,
    );
    if (family === 'donut')
      props.push(
        `innerRadiusRatio={${state.innerRadiusRatio}}`,
        `centerContent=${JSON.stringify(preset.center)}`,
      );
  }
  props.push(
    'height={240}',
    `showLegend={${state.showLegend}}`,
    `animate={${state.animate}}`,
    `tooltip={${state.tooltip}}`,
    `formatValue={${preset.formatterSource}}`,
    `accessibility={{\n        label: ${JSON.stringify(exampleAccessibility(family, state).label)},\n        description: ${JSON.stringify(inspectionDescription)},\n        dataTable: '${state.dataTable}',\n      }}`,
  );
  return `import { ${component} } from 'react-simple-charts';\n\nconst data = ${formatData(preset.data)};\n\nexport function Example() {\n  return (\n    <${component}\n      ${props.join('\n      ')}\n    />\n  );\n}\n`;
}
