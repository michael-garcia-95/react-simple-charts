import { useMemo, useState } from 'react';
import { LineChart, AreaChart, BarChart, PieChart, DonutChart } from '../src';
function AllocationDetails() {
  const [viewed, setViewed] = useState(false);
  return (
    <button
      type="button"
      aria-label="Allocation details"
      onClick={() => setViewed(true)}
    >
      {viewed ? 'Viewed' : 'Details'}
    </button>
  );
}
export const fiveFamilies = ['line', 'area', 'bar', 'pie', 'donut'] as const;
export type FiveFamily = (typeof fiveFamilies)[number];
export type FiveState = 'ready' | 'replacement' | 'empty' | 'unusable';
export const fiveCartesian = Object.freeze([
  Object.freeze({ name: 'January', actual: -4, forecast: 3 }),
  Object.freeze({ name: 'February', actual: 0, forecast: null }),
  Object.freeze({ name: 'March', actual: 8, forecast: 5 }),
  Object.freeze({ name: 'March', actual: 6, forecast: 4 }),
]);
export const fivePolar = Object.freeze([
  Object.freeze({ name: 'Product', value: 48 }),
  Object.freeze({ name: 'Services', value: 32 }),
  Object.freeze({ name: 'Support', value: 20 }),
]);
const unusableCartesian = fiveCartesian.map((row) => ({
  ...row,
  actual: Infinity,
  forecast: NaN,
}));
const unusablePolar = fivePolar.map((row) => ({ ...row, value: -row.value }));
export const fiveSeries = [
  { key: 'actual', label: 'Actual' },
  { key: 'forecast', label: 'Forecast' },
] as const;
const replacements = {
  cartesian: fiveCartesian.map((row, i) => ({
    ...row,
    name: `Replacement ${i}`,
    actual: row.actual + 2,
  })),
  polar: fivePolar.map((row, i) => ({
    ...row,
    name: `Replacement ${i}`,
    value: row.value + 2,
  })),
};
export interface FiveCollectionProps {
  states?: Partial<Record<FiveFamily, FiveState>>;
  widths?: Partial<Record<FiveFamily, number>>;
  explicit?: boolean;
  visible?: boolean;
  animate?: boolean;
  rows?: number;
  revision?: number;
  longText?: boolean;
  onActivate?: (
    family: FiveFamily,
    payload: { record: object; index: number; inputMethod: string },
  ) => void;
}
export function FiveChartCollection({
  states = {},
  widths = {},
  explicit = false,
  visible = true,
  animate = false,
  rows = 0,
  revision = 0,
  longText = false,
  onActivate,
}: FiveCollectionProps) {
  const dense = useMemo(
    () => ({
      cartesian: Array.from({ length: rows }, (_, i) => ({
        name: `Period ${i}`,
        actual: ((i + revision) % 17) - 8,
        forecast: i % 11 === 0 ? null : ((i + revision) % 13) - 6,
      })),
      polar: Array.from({ length: rows }, (_, i) => ({
        name: `Allocation ${i}`,
        value: 1 + ((i + revision) % 7),
      })),
    }),
    [rows, revision],
  );
  const series = longText
    ? ([
        { key: 'actual', label: 'NorthAmericaEnterpriseSubscriptionsActual' },
        { key: 'forecast', label: 'EuropeEnterpriseSubscriptionsForecast' },
      ] as const)
    : fiveSeries;
  return (
    <div className="five-grid" data-five-collection data-revision={revision}>
      {fiveFamilies.map((family) => {
        const state = states[family] ?? 'ready';
        const cartesian =
          state === 'empty'
            ? []
            : state === 'unusable'
              ? unusableCartesian
              : state === 'replacement'
                ? replacements.cartesian
                : rows
                  ? dense.cartesian
                  : fiveCartesian;
        const polar =
          state === 'empty'
            ? []
            : state === 'unusable'
              ? unusablePolar
              : state === 'replacement'
                ? replacements.polar
                : rows
                  ? dense.polar
                  : fivePolar;
        const accessibility = {
          label: `Five ${family}`,
          description: `Independent ${family} observations`,
          dataTable: visible
            ? ('visible' as const)
            : ('visually-hidden' as const),
        };
        const width = widths[family] ?? 320;
        const shared = {
          height: 200,
          animate,
          accessibility,
          ...(explicit ? { width: 640, style: { maxWidth: '100%' } } : {}),
        };
        const activate = (payload: {
          record: object;
          index: number;
          inputMethod: string;
        }) => onActivate?.(family, payload);
        return (
          <article
            key={family}
            data-five={family}
            style={{
              width,
              maxWidth: '100%',
              minWidth: 0,
              overflowWrap: 'anywhere',
            }}
          >
            <h3>{family.charAt(0).toUpperCase() + family.slice(1)} chart</h3>
            {family === 'line' ? (
              <LineChart
                {...shared}
                data={cartesian}
                xKey="name"
                series={series}
                onDataActivate={activate}
              />
            ) : family === 'area' ? (
              <AreaChart
                {...shared}
                data={cartesian}
                xKey="name"
                series={series}
                onDataActivate={activate}
              />
            ) : family === 'bar' ? (
              <BarChart
                {...shared}
                data={cartesian}
                xKey="name"
                series={series}
                onDataActivate={activate}
              />
            ) : family === 'pie' ? (
              <PieChart
                {...shared}
                data={polar}
                nameKey="name"
                valueKey="value"
                onDataActivate={activate}
              />
            ) : (
              <DonutChart
                {...shared}
                data={polar}
                nameKey="name"
                valueKey="value"
                centerContent={<AllocationDetails />}
                onDataActivate={activate}
              />
            )}
          </article>
        );
      })}
    </div>
  );
}
export function FiveCharts() {
  const [states, setStates] = useState<Partial<Record<FiveFamily, FiveState>>>(
    {},
  );
  const [widths, setWidths] = useState<Partial<Record<FiveFamily, number>>>({});
  const [visible, setVisible] = useState(true),
    [animate, setAnimate] = useState(false),
    [explicit, setExplicit] = useState(false),
    [mounted, setMounted] = useState(true),
    [longText, setLongText] = useState(false);
  const [rows, setRows] = useState(0),
    [revision, setRevision] = useState(0);
  const [events, setEvents] = useState<
    { family: FiveFamily; index: number; method: string; name: string }[]
  >([]);
  return (
    <section id="five-charts" aria-labelledby="five-title">
      <h2 id="five-title">Five public charts together</h2>
      <p>
        Monthly actuals and forecasts, signed comparisons, grouped bars and
        allocation shares. Each chart measures and inspects its own source data.
      </p>
      <div className="five-controls">
        <button id="five-reset" onClick={() => setEvents([])}>
          Reset activations
        </button>
        {fiveFamilies.map((family) => (
          <div key={family}>
            <label>
              {family} width{' '}
              <select
                id={`five-width-${family}`}
                value={widths[family] ?? 320}
                onChange={(e) =>
                  setWidths((w) => ({ ...w, [family]: Number(e.target.value) }))
                }
              >
                {[200, 320, 480, 768, 1200].map((w) => (
                  <option key={w}>{w}</option>
                ))}
              </select>
            </label>
            <label>
              {family} data{' '}
              <select
                id={`five-state-${family}`}
                value={states[family] ?? 'ready'}
                onChange={(e) => {
                  const value = e.target.value as FiveState;
                  setStates((s) => ({ ...s, [family]: value }));
                }}
              >
                {['ready', 'replacement', 'empty', 'unusable'].map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </label>
          </div>
        ))}
        <label>
          <input
            id="five-visible"
            type="checkbox"
            checked={visible}
            onChange={(e) => setVisible(e.target.checked)}
          />
          Visible source tables
        </label>
        <label>
          <input
            id="five-animate"
            type="checkbox"
            checked={animate}
            onChange={(e) => setAnimate(e.target.checked)}
          />
          Decorative animation
        </label>
        <label>
          <input
            id="five-explicit"
            type="checkbox"
            checked={explicit}
            onChange={(e) => setExplicit(e.target.checked)}
          />
          Constrained explicit SVGs
        </label>
        <label>
          <input
            id="five-long"
            type="checkbox"
            checked={longText}
            onChange={(e) => setLongText(e.target.checked)}
          />
          Long series names
        </label>
        <label>
          Rows per chart{' '}
          <select
            id="five-rows"
            value={rows}
            onChange={(e) => setRows(Number(e.target.value))}
          >
            {[0, 100, 1000].map((n) => (
              <option key={n}>{n}</option>
            ))}
          </select>
        </label>
        <button id="five-update" onClick={() => setRevision((n) => n + 1)}>
          Update observations
        </button>
        <label>
          <input
            id="five-mounted"
            type="checkbox"
            checked={mounted}
            onChange={(e) => setMounted(e.target.checked)}
          />
          Show charts
        </label>
      </div>
      <button id="five-before">Before chart collection</button>
      {mounted && (
        <FiveChartCollection
          states={states}
          widths={widths}
          visible={visible}
          animate={animate}
          explicit={explicit}
          longText={longText}
          rows={rows}
          revision={revision}
          onActivate={(family, payload) =>
            setEvents((items) => [
              ...items,
              {
                family,
                index: payload.index,
                method: payload.inputMethod,
                name: String(
                  'name' in payload.record ? payload.record.name : '',
                ),
              },
            ])
          }
        />
      )}
      <button id="five-after">After chart collection</button>
      <output id="five-events" data-count={events.length}>
        {events.length ? JSON.stringify(events.at(-1)) : 'No activations'}
      </output>
    </section>
  );
}
