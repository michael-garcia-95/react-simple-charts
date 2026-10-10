// @vitest-environment node
import { renderToString } from 'react-dom/server';
import { expect, it } from 'vitest';
import { PieChart, LineChart } from '../src';
it('explicit Pie SSR is complete deterministic and browser-free', () => {
  expect(typeof window).toBe('undefined');
  const chart = (
    <PieChart
      width={480}
      data={[{ name: new Date('2026-01-01'), value: 3 }]}
      nameKey="name"
      valueKey="value"
      animate
      showLabels
    />
  );
  const html = renderToString(chart);
  expect(renderToString(chart)).toBe(html);
  expect(html).toContain('<svg');
  expect(html).toContain('<path');
  expect(html).toContain('100.0%');
  expect(html).toContain('<table');
  expect(html).not.toMatch(/NaN|Infinity|opacity:0/);
});
it.each([undefined, '100%'])(
  'responsive %s is a deterministic named placeholder with source rows',
  (width) => {
    const html = renderToString(
      <PieChart
        {...(width === undefined ? {} : { width })}
        data={[{ name: 'Zero', value: 0 }]}
        nameKey="name"
        valueKey="value"
      />,
    );
    expect(html).not.toContain('<svg');
    expect(html).toContain('awaiting chart measurement');
    expect(html).toContain('height:280px');
    expect(html).toContain('<table');
  },
);
it.each(
  [[], [{ name: 'Zero', value: 0 }], [{ name: 'Negative', value: -2 }]].map(
    (data) => [data] as const,
  ),
)('state %j retains source table in SSR', (data) => {
  const html = renderToString(
    <PieChart width={400} data={data} nameKey="name" valueKey="value" />,
  );
  expect(html).not.toContain('<svg');
  expect(html).toContain('<table');
});
it('sibling Pie and Cartesian SSR have distinct generated relationships', () => {
  const data = [{ name: 'A', value: 2 }];
  const html = renderToString(
    <>
      <PieChart width={400} data={data} nameKey="name" valueKey="value" />
      <PieChart width={400} data={data} nameKey="name" valueKey="value" />
      <LineChart width={400} data={data} xKey="name" yKey="value" />
    </>,
  );
  const ids = [...html.matchAll(/ id="([^"]+)"/g)].map((m) => m[1]);
  expect(new Set(ids).size).toBe(ids.length);
});
