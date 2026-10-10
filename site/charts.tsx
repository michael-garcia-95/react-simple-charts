import {
  LineChart,
  AreaChart,
  BarChart,
  PieChart,
  DonutChart,
} from 'react-simple-charts';
import { allocation, comparison, dollars, revenue, trend } from './data';

export const families = ['line', 'area', 'bar', 'pie', 'donut'] as const;
export type Family = (typeof families)[number];
export const chartDescriptions = {
  line: {
    title: 'Revenue over time',
    description:
      'Follow monthly revenue and see how a trend develops. Values are in thousands of dollars.',
  },
  area: {
    title: 'Growth has its ups and downs',
    description:
      'See positive and negative monthly changes around a clear zero baseline. Values are percentage points.',
  },
  bar: {
    title: 'Actual versus forecast',
    description:
      'Compare observed revenue with a forecast, side by side for each month. Values are in thousands of dollars.',
  },
  pie: {
    title: 'Every category has a share',
    description:
      'Compare the relative contributions of Product, Services and Support to a fictional revenue total.',
  },
  donut: {
    title: 'The same story, with room to breathe',
    description:
      'Show revenue allocation as a ring, with a short contextual label in the center.',
  },
};
export function ShowcaseChart({
  family,
  visible = true,
  hero = false,
}: {
  family: Family;
  visible?: boolean;
  hero?: boolean;
}) {
  const shared = {
    height: hero ? 260 : 240,
    animate: false,
    accessibility: {
      label: `${family.charAt(0).toUpperCase() + family.slice(1)}: ${chartDescriptions[family].title}`,
      description:
        'Fictional demonstration data. Use arrow keys to inspect values; the source data table follows the chart.',
      dataTable: visible ? ('visible' as const) : ('visually-hidden' as const),
    },
  };
  switch (family) {
    case 'line':
      return (
        <LineChart
          {...shared}
          data={revenue}
          xKey="month"
          yKey="revenue"
          formatValue={dollars}
        />
      );
    case 'area':
      return (
        <AreaChart
          {...shared}
          data={trend}
          xKey="month"
          yKey="change"
          colors={['#0D9488']}
          formatValue={(value) => `${value} pp`}
        />
      );
    case 'bar':
      return (
        <BarChart
          {...shared}
          data={revenue}
          xKey="month"
          series={comparison}
          formatValue={dollars}
        />
      );
    case 'pie':
      return (
        <PieChart
          {...shared}
          data={allocation}
          nameKey="name"
          valueKey="value"
          formatValue={(value) => `${value}%`}
        />
      );
    case 'donut':
      return (
        <DonutChart
          {...shared}
          data={allocation}
          nameKey="name"
          valueKey="value"
          formatValue={(value) => `${value}%`}
          centerContent={
            <span className="donut-center">
              Revenue
              <br />
              <strong>100%</strong>
            </span>
          }
        />
      );
  }
}
