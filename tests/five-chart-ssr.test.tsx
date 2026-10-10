// @vitest-environment node
import { renderToString } from 'react-dom/server';
import { expect, it } from 'vitest';
import { FiveChartCollection, fiveFamilies } from '../playground/FiveCharts';
it('renders five explicit siblings deterministically without browser globals', () => {
  expect(typeof window).toBe('undefined');
  const element = <FiveChartCollection explicit animate />;
  const html = renderToString(element);
  expect(renderToString(element)).toBe(html);
  expect(html.match(/<svg /g)).toHaveLength(5);
  expect(html.match(/<table/g)).toHaveLength(5);
  const ids = [...html.matchAll(/ id="([^"]+)"/g)].map((m) => m[1]);
  expect(new Set(ids).size).toBe(ids.length);
  expect(html).toContain('Allocation details');
  expect(html).not.toMatch(/NaN|Infinity|opacity:0/);
});
it('renders all five responsive pending states with complete accessible source alternatives', () => {
  const html = renderToString(<FiveChartCollection />);
  expect(html).not.toContain('<svg');
  expect(html.match(/<table/g)).toHaveLength(5);
  expect(html.match(/awaiting chart measurement/g)).toHaveLength(5);
  expect(html).toContain('February');
  expect(html).toContain('Services');
});
it.each(['empty', 'unusable'] as const)(
  'preserves all five source alternatives in %s SSR',
  (state) => {
    const states = Object.fromEntries(fiveFamilies.map((f) => [f, state]));
    const html = renderToString(
      <FiveChartCollection explicit states={states} />,
    );
    expect(html).not.toContain('<svg');
    expect(html.match(/<table/g)).toHaveLength(5);
    if (state === 'unusable') expect(html).toContain('February');
  },
);
it('keeps explicit and pending copies of all families separate in the same SSR tree', () => {
  const html = renderToString(
    <>
      <FiveChartCollection explicit />
      <FiveChartCollection />
    </>,
  );
  expect(html.match(/<svg /g)).toHaveLength(5);
  expect(html.match(/<table/g)).toHaveLength(10);
  expect(html.match(/awaiting chart measurement/g)).toHaveLength(5);
  const ids = [...html.matchAll(/ id="([^"]+)"/g)].map((m) => m[1]);
  expect(new Set(ids).size).toBe(ids.length);
});
