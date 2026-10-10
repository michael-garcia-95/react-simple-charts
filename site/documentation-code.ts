// These complete TSX sources are displayed verbatim and compiled by verify:site:snippets.
// They use fictional fixed records and only the public package root.
export const documentationCode = {
  line: {
    label: 'LineChart · monthly revenue',
    source: `import { LineChart } from 'react-simple-charts';

interface Revenue {
  month: string;
  revenue: number | null;
}
const data: readonly Revenue[] = [
  { month: 'Jan', revenue: 24 },
  { month: 'Feb', revenue: 32 },
  { month: 'Mar', revenue: null },
  { month: 'Apr', revenue: 29 },
];

export function RevenueChart() {
  return (
    <LineChart
      data={data}
      xKey="month"
      yKey="revenue"
      formatValue={(value) => \`$\${value}k\`}
      xAxis={{ label: 'Month' }}
      yAxis={{ label: 'Revenue (USD, thousands)' }}
      accessibility={{
        label: 'Monthly revenue',
        description: 'Fictional revenue; March is unreported.',
        dataTable: 'visible',
      }}
    />
  );
}
`,
  },
  area: {
    label: 'AreaChart · independent activity series',
    source: `import { AreaChart } from 'react-simple-charts';

interface Activity {
  week: string;
  change: number | null;
  target: number;
}
const data: readonly Activity[] = [
  { week: 'W1', change: -2, target: 1 },
  { week: 'W2', change: 5, target: 3 },
  { week: 'W3', change: null, target: 2 },
  { week: 'W4', change: 0, target: 2 },
];

export function ActivityChart() {
  return (
    <AreaChart
      data={data}
      xKey="week"
      series={[
        { key: 'change', label: 'Change', color: '#2563EB' },
        { key: 'target', label: 'Target', color: '#0D9488' },
      ]}
      yAxis={{ min: -4, max: 8, label: 'Activity change' }}
      accessibility={{
        label: 'Weekly activity change and target',
        dataTable: 'visible',
      }}
    />
  );
}
`,
  },
  bar: {
    label: 'BarChart · horizontal grouped balances',
    source: `import { BarChart } from 'react-simple-charts';

interface Balance {
  department: string;
  actual: number;
  planned: number | null;
}
const data: readonly Balance[] = [
  { department: 'Build', actual: 12, planned: 15 },
  { department: 'Care', actual: -3, planned: 8 },
  { department: 'Ops', actual: 0, planned: null },
];

export function BalanceChart() {
  return (
    <BarChart
      data={data}
      xKey="department"
      series={[
        { key: 'actual', label: 'Actual' },
        { key: 'planned', label: 'Planned' },
      ]}
      orientation="horizontal"
      xAxis={{
        min: -5,
        max: 20,
        label: 'Balance (USD, thousands)',
        formatTick: (value) => \`$\${value}k\`,
      }}
      yAxis={{ label: 'Department' }}
      tooltip={{ mode: 'shared' }}
      accessibility={{
        label: 'Department balances and plans',
        dataTable: 'visible',
      }}
    />
  );
}
`,
  },
  pie: {
    label: 'PieChart · category counts',
    source: `import { PieChart } from 'react-simple-charts';

interface CategoryCount {
  category: string;
  count: number | null;
}
const data: readonly CategoryCount[] = [
  { category: 'Books', count: 48 },
  { category: 'Games', count: 32 },
  { category: 'Music', count: 0 },
  { category: 'Art', count: null },
];

export function CategoryChart() {
  return (
    <PieChart
      data={data}
      nameKey="category"
      valueKey="count"
      showLabels={true}
      showLegend={true}
      accessibility={{
        label: 'Category share of reported counts',
        dataTable: 'visible',
      }}
    />
  );
}
`,
  },
  donut: {
    label: 'DonutChart · budget allocation',
    source: `import { DonutChart } from 'react-simple-charts';

interface Budget {
  department: string;
  amount: number;
}
const data: readonly Budget[] = [
  { department: 'Build', amount: 60 },
  { department: 'Care', amount: 25 },
  { department: 'Ops', amount: 15 },
];

export function BudgetChart() {
  return (
    <DonutChart
      data={data}
      nameKey="department"
      valueKey="amount"
      innerRadiusRatio={0.6}
      centerContent={<strong>Budget</strong>}
      showLabels={false}
      formatValue={(value) => \`$\${value}k\`}
      accessibility={{
        label: 'Department budget allocation',
        dataTable: 'visible',
      }}
    />
  );
}
`,
  },
  linear: {
    label: 'LineChart · numerical X',
    source: `import { LineChart } from 'react-simple-charts';

const data = [
  { distance: 0, activity: 12 },
  { distance: 2, activity: 18 },
  { distance: 7, activity: 15 },
];

export function DistanceChart() {
  return (
    <LineChart
      data={data}
      xScale="linear"
      xKey="distance"
      yKey="activity"
      xAxis={{ label: 'Distance (km)', min: 0, max: 8 }}
      showGrid={true}
      tooltip={{ mode: 'item' }}
      accessibility={{ label: 'Activity by distance' }}
    />
  );
}
`,
  },
  utc: {
    label: 'LineChart · UTC dates',
    source: `import { LineChart } from 'react-simple-charts';

const data = [
  { date: new Date('2026-01-01T00:00:00Z'), activity: 12 },
  { date: new Date('2026-01-03T00:00:00Z'), activity: 18 },
  { date: new Date('2026-01-08T00:00:00Z'), activity: 15 },
];

export function DailyChart() {
  return (
    <LineChart
      data={data}
      xScale="utc"
      xKey="date"
      yKey="activity"
      width={640}
      xAxis={{ formatTick: (date) => date.toISOString().slice(0, 10) }}
      accessibility={{ label: 'Daily activity in UTC' }}
    />
  );
}
`,
  },
  time: {
    label: 'LineChart · local-time dates',
    source: `import { LineChart } from 'react-simple-charts';

const data = [
  { date: new Date('2026-01-01T12:00:00Z'), activity: 12 },
  { date: new Date('2026-01-02T12:00:00Z'), activity: 18 },
];

export function LocalActivityChart() {
  return (
    <LineChart
      data={data}
      xScale="time"
      xKey="date"
      yKey="activity"
      xAxis={{
        formatTick: (date) =>
          \`\${date.getMonth() + 1}/\${date.getDate()}\`,
      }}
      accessibility={{ label: 'Activity by local calendar date' }}
    />
  );
}
`,
  },
  cartesianTooltip: {
    label: 'Custom tooltip · Cartesian context',
    source: `import { LineChart } from 'react-simple-charts';
import type { CartesianTooltipContext } from 'react-simple-charts';

interface Revenue {
  month: string;
  actual: number;
  planned: number;
}
const data: readonly Revenue[] = [
  { month: 'Jan', actual: 24, planned: 26 },
  { month: 'Feb', actual: 32, planned: 30 },
];

function revenueTooltip(context: CartesianTooltipContext<Revenue>) {
  const items = context.mode === 'shared'
    ? context.items
    : [context.item];
  return (
    <span>
      {items.map((item) =>
        \`\${item.seriesLabel}: $\${item.value}k\`
      ).join(' · ')}
    </span>
  );
}

export function RevenueInspection() {
  return (
    <LineChart
      data={data}
      xKey="month"
      series={[{ key: 'actual' }, { key: 'planned' }]}
      tooltip={{ mode: 'shared', render: revenueTooltip }}
      onDataActivate={(datum) => {
        console.log(datum.record, datum.index, datum.inputMethod);
      }}
      accessibility={{ label: 'Actual and planned monthly revenue' }}
    />
  );
}
`,
  },
  segmentTooltip: {
    label: 'Custom tooltip · polar segment context',
    source: `import { PieChart } from 'react-simple-charts';
import type { SegmentTooltipContext } from 'react-simple-charts';

interface Budget {
  department: string;
  amount: number;
}
const data: readonly Budget[] = [
  { department: 'Build', amount: 60 },
  { department: 'Care', amount: 40 },
];

function budgetTooltip({ segment }: SegmentTooltipContext<Budget>) {
  return (
    <span>
      {segment.record.department}: {segment.percentage.toFixed(2)}%
    </span>
  );
}

export function BudgetInspection() {
  return (
    <PieChart
      data={data}
      nameKey="department"
      valueKey="amount"
      tooltip={budgetTooltip}
      onDataActivate={(segment) => {
        console.log(segment.record, segment.segmentId, segment.inputMethod);
      }}
      accessibility={{ label: 'Budget shares' }}
    />
  );
}
`,
  },
} as const;
export type DocumentationExample = keyof typeof documentationCode;
