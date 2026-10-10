import type {
  CategoricalFieldKey,
  NumericFieldKey,
  SeriesConfig,
  ValueFormatter,
} from 'react-simple-charts';
import { allocation, comparison, dollars, revenue, trend } from './data';

interface Preset<T extends object> {
  label: string;
  note: string;
  data: readonly T[];
  formatValue: ValueFormatter;
  // Authored source, never serialization of a function.
  formatterSource: string;
}
export interface CartesianPreset<T extends object> extends Preset<T> {
  xKey: CategoricalFieldKey<T>;
  yKey: NumericFieldKey<T>;
  series?: readonly SeriesConfig<T>[];
}
export interface PolarPreset<T extends object> extends Preset<T> {
  nameKey: CategoricalFieldKey<T>;
  valueKey: NumericFieldKey<T>;
  center: string;
}
const dollarSource = '(value) => `$${value}k`';
export const monthlyRevenue = {
  label: 'Monthly revenue',
  note: 'January–June · USD, thousands. Compare actual revenue with its forecast.',
  data: revenue,
  xKey: 'month',
  yKey: 'revenue',
  series: comparison,
  formatValue: dollars,
  formatterSource: dollarSource,
} satisfies CartesianPreset<(typeof revenue)[number]>;
interface Traffic {
  week: string;
  visits: number | null;
  returning: number;
}
export const websiteTraffic = {
  label: 'Website traffic',
  note: 'Weekly visits · one missing observation is a gap, not zero.',
  data: [
    { week: 'W1', visits: 1200, returning: 320 },
    { week: 'W2', visits: 1800, returning: 470 },
    { week: 'W3', visits: null, returning: 510 },
    { week: 'W4', visits: 2200, returning: 640 },
  ],
  xKey: 'week',
  yKey: 'visits',
  series: [
    { key: 'visits', label: 'All visits', color: '#2563EB' },
    { key: 'returning', label: 'Returning', color: '#0D9488' },
  ],
  formatValue: (value) => `${value} visits`,
  formatterSource: '(value) => `${value} visits`',
} satisfies CartesianPreset<Traffic>;
const growthWithTarget = trend.map((row) => ({ ...row, target: 3 }));
export const monthlyGrowth = {
  label: 'Monthly growth',
  note: 'Percentage points · signed changes cross zero; February is a real zero.',
  data: growthWithTarget,
  xKey: 'month',
  yKey: 'change',
  series: [
    { key: 'change', label: 'Actual', color: '#2563EB' },
    { key: 'target', label: 'Target', color: '#0D9488' },
  ],
  formatValue: (value) => `${value} pp`,
  formatterSource: '(value) => `${value} pp`',
} satisfies CartesianPreset<(typeof growthWithTarget)[number]>;
interface Run {
  session: string;
  distance: number;
  target: number;
}
export const runningTrend = {
  label: 'Running performance',
  note: 'Distance in km · a training trend, measured from zero; compare with target distances.',
  data: [
    { session: 'Run 1', distance: 3, target: 4 },
    { session: 'Run 2', distance: 4.5, target: 4.5 },
    { session: 'Run 3', distance: 4, target: 5 },
    { session: 'Run 4', distance: 6, target: 5.5 },
  ],
  xKey: 'session',
  yKey: 'distance',
  series: [
    { key: 'distance', label: 'Distance', color: '#2563EB' },
    { key: 'target', label: 'Target', color: '#0D9488' },
  ],
  formatValue: (value) => `${value} km`,
  formatterSource: '(value) => `${value} km`',
} satisfies CartesianPreset<Run>;
interface Category {
  category: string;
  orders: number | null;
}
export const categoryOrders = {
  label: 'Category comparison',
  note: 'Orders · a zero and an unreported category stay in the source table.',
  data: [
    { category: 'Books', orders: 32 },
    { category: 'Games', orders: 48 },
    { category: 'Music', orders: 0 },
    { category: 'Art', orders: null },
  ],
  xKey: 'category',
  yKey: 'orders',
  formatValue: (value) => `${value} orders`,
  formatterSource: '(value) => `${value} orders`',
} satisfies CartesianPreset<Category>;
export const revenueDistribution = {
  label: 'Revenue distribution',
  note: 'Revenue share · percent of the fictional total.',
  data: allocation,
  nameKey: 'name',
  valueKey: 'value',
  center: 'Revenue',
  formatValue: (value) => `${value}%`,
  formatterSource: '(value) => `${value}%`',
} satisfies PolarPreset<(typeof allocation)[number]>;
interface Customer {
  segment: string;
  customers: number;
}
export const customerSegments = {
  label: 'Customer segments',
  note: 'Customer counts · the trial segment has no customers yet.',
  data: [
    { segment: 'New', customers: 120 },
    { segment: 'Returning', customers: 240 },
    { segment: 'Trial', customers: 0 },
  ],
  nameKey: 'segment',
  valueKey: 'customers',
  center: 'Customers',
  formatValue: (value) => `${value} customers`,
  formatterSource: '(value) => `${value} customers`',
} satisfies PolarPreset<Customer>;
interface Budget {
  department: string;
  budget: number;
}
export const budgetAllocation = {
  label: 'Budget allocation',
  note: 'Department budget · USD, thousands.',
  data: [
    { department: 'Build', budget: 60 },
    { department: 'Care', budget: 25 },
    { department: 'Ops', budget: 15 },
  ],
  nameKey: 'department',
  valueKey: 'budget',
  center: 'Budget',
  formatValue: dollars,
  formatterSource: dollarSource,
} satisfies PolarPreset<Budget>;
interface Project {
  project: string;
  hours: number | null;
}
export const projectDistribution = {
  label: 'Project distribution',
  note: 'Planned hours · an unestimated project remains in the source table.',
  data: [
    { project: 'Atlas', hours: 80 },
    { project: 'Beacon', hours: 160 },
    { project: 'Cedar', hours: 40 },
    { project: 'Delta', hours: null },
  ],
  nameKey: 'project',
  valueKey: 'hours',
  center: 'Projects',
  formatValue: (value) => `${value} hours`,
  formatterSource: '(value) => `${value} hours`',
} satisfies PolarPreset<Project>;
