// Fictional, deterministic samples adapted from the M04 five-chart handoff.
export const revenue = [
  { month: 'Jan', revenue: 24, forecast: 26 },
  { month: 'Feb', revenue: 32, forecast: 30 },
  { month: 'Mar', revenue: 29, forecast: 34 },
  { month: 'Apr', revenue: 42, forecast: 38 },
  { month: 'May', revenue: 38, forecast: 42 },
  { month: 'Jun', revenue: 52, forecast: 46 },
] as const;
export const trend = [
  { month: 'Jan', change: -4 },
  { month: 'Feb', change: 0 },
  { month: 'Mar', change: 8 },
  { month: 'Apr', change: 6 },
  { month: 'May', change: -2 },
  { month: 'Jun', change: 5 },
] as const;
export const allocation = [
  { name: 'Product', value: 48 },
  { name: 'Services', value: 32 },
  { name: 'Support', value: 20 },
] as const;
export const comparison = [
  { key: 'revenue', label: 'Actual', color: '#2563EB' },
  { key: 'forecast', label: 'Forecast', color: '#0D9488' },
] as const;
export const dollars = (value: number) => `$${value}k`;
