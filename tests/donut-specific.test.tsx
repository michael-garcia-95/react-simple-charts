import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { StrictMode } from 'react';
import { renderToString } from 'react-dom/server';
import { hydrateRoot } from 'react-dom/client';
import { afterEach, expect, it, vi } from 'vitest';
import { DonutChart, PieChart } from '../src';
import type { DonutChartProps } from '../src';
import { normalizeSegments } from '../src/core/data/segments';
import { buildPolarGeometry } from '../src/core/geometry/polar';
import { labelPosition } from '../src/internal/svg/PolarMarks';
import { installResizeObserver, latestObserver } from './resize-observer';
const data = [
  { name: 'A', value: 1 },
  { name: 'Zero', value: 0 },
  { name: 'A', value: 3 },
];
function chart(props: Partial<DonutChartProps<(typeof data)[number]>> = {}) {
  return (
    <DonutChart
      width={480}
      data={data}
      nameKey="name"
      valueKey="value"
      {...props}
    />
  );
}
afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  delete (SVGElement.prototype as { animate?: unknown }).animate;
});
it.each([undefined, 0.25, 0.5, 0.8, 1e-5, 1 - 1e-8])(
  'ratio %s uses exact engine radii and paths in rectangular viewports',
  (innerRadiusRatio) => {
    const props = {
      data,
      nameKey: 'name',
      valueKey: 'value',
      width: 600,
      height: 240,
      ...(innerRadiusRatio === undefined ? {} : { innerRadiusRatio }),
    } as const;
    const geometry = buildPolarGeometry({
      normalized: normalizeSegments(props),
      family: 'donut',
      width: 600,
      height: 240,
      ...(innerRadiusRatio === undefined ? {} : { innerRadiusRatio }),
    });
    if (geometry.status !== 'ready') throw Error('Expected ready');
    const { container } = render(
      <DonutChart {...props} centerContent="Center" />,
    );
    const paths = container.querySelectorAll('[data-layer=marks] path');
    expect(geometry.viewport.innerRadius).toBe(112 * (innerRadiusRatio ?? 0.6));
    geometry.slices.forEach((slice, i) => {
      expect(paths[i]).toHaveAttribute('d', slice.path);
      expect(paths[i]!.parentElement).toHaveAttribute(
        'transform',
        'translate(300 120)',
      );
    });
    const center = container.querySelector<HTMLElement>('[data-donut-center]')!;
    expect(center.style.width).toBe(
      `${((Math.SQRT2 * geometry.viewport.innerRadius) / 600) * 100}%`,
    );
    expect(center.style.height).toBe(
      `${((Math.SQRT2 * geometry.viewport.innerRadius) / 240) * 100}%`,
    );
    expect(center.style.left).toBe('50%');
    expect(center.style.top).toBe('50%');
  },
);
it.each([
  0,
  -0.1,
  1,
  2,
  NaN,
  Infinity,
  Number.MIN_VALUE,
  1e-16,
  '0.6',
  null,
  {},
])(
  'invalid runtime ratio %j is unavailable without default substitution',
  (ratio) => {
    const { container } = render(
      chart({ innerRadiusRatio: ratio as number, centerContent: 'Hidden' }),
    );
    expect(screen.getByRole('img')).toHaveTextContent('unavailable');
    expect(container.querySelector('svg')).toBeNull();
    expect(screen.queryByText('Hidden')).toBeNull();
    expect(screen.getAllByRole('row')).toHaveLength(4);
  },
);
it.each([
  undefined,
  0,
  'Allocation',
  <>
    <strong>Total</strong>
    <span>Balance</span>
  </>,
  <article>
    <em>Custom content</em>
  </article>,
])('accepts ReactNode center content %j', (centerContent) => {
  const { container } = render(chart({ centerContent }));
  const center = container.querySelector('[data-donut-center]');
  if (centerContent === undefined) expect(center).toBeNull();
  else {
    expect(center).not.toHaveAttribute('aria-hidden');
    expect(center!.closest('[aria-hidden=true]')).toBeNull();
    if (centerContent === 0) expect(center).toHaveTextContent('0');
  }
});
it('center button is exposed and does not activate slices; wrapper adds no Tab entry', () => {
  const activate = vi.fn(),
    action = vi.fn();
  const { container } = render(
    chart({
      onDataActivate: activate,
      centerContent: <button onClick={action}>Details</button>,
    }),
  );
  const button = screen.getByRole('button', { name: 'Details' });
  fireEvent.click(button);
  expect(action).toHaveBeenCalledTimes(1);
  expect(activate).not.toHaveBeenCalled();
  act(() => button.focus());
  expect(button).toHaveFocus();
  expect(button.closest('[aria-hidden=true]')).toBeNull();
  expect([...container.querySelectorAll('[tabindex="0"]')]).toHaveLength(1);
  expect(container.querySelector('[data-donut-center]')).not.toHaveAttribute(
    'tabindex',
  );
  fireEvent.click(container.querySelector('svg')!);
  expect(activate).not.toHaveBeenCalled();
});
it.each(
  [[], [{ name: 'Zero', value: 0 }], [{ name: 'Negative', value: -1 }]].map(
    (rows) => [rows] as const,
  ),
)('center content is absent for nonready source %j', (rows) => {
  render(chart({ data: rows, centerContent: 'Hidden' }));
  expect(screen.queryByText('Hidden')).toBeNull();
  expect(screen.getByRole('table')).toBeInTheDocument();
});
it('responsive placeholder omits center, then positions and resizes it within the graphic only', () => {
  installResizeObserver();
  const { container } = render(
    chart({
      width: '100%',
      centerContent: 'Total',
      accessibility: { dataTable: 'visible' },
    }),
  );
  expect(screen.queryByText('Total')).toBeNull();
  act(() => latestObserver().emit(320));
  const center = container.querySelector<HTMLElement>('[data-donut-center]')!;
  expect(center.parentElement).toBe(
    container.querySelector('[data-donut-frame]'),
  );
  expect(center.parentElement!.querySelector('table')).toBeNull();
  expect(center.style.width).toBe(`${((Math.SQRT2 * 79.2) / 320) * 100}%`);
  act(() => latestObserver().emit(200));
  expect(center.style.width).toBe(
    `${((Math.SQRT2 * 55.199999999999996) / 200) * 100}%`,
  );
});
it('ring labels and tooltip anchors remain between engine radii; thin rings omit labels', () => {
  const geometry = buildPolarGeometry({
    normalized: normalizeSegments({ data, nameKey: 'name', valueKey: 'value' }),
    family: 'donut',
    width: 480,
    height: 280,
    innerRadiusRatio: 0.8,
  });
  if (geometry.status !== 'ready') throw Error('Expected ready');
  geometry.slices.forEach((slice) => {
    const point = labelPosition(slice);
    expect(Math.hypot(point.x, point.y)).toBeCloseTo(
      (slice.innerRadius + slice.outerRadius) / 2,
    );
  });
  const { container, rerender } = render(
    chart({ innerRadiusRatio: 0.8, showLabels: true }),
  );
  for (const text of container.querySelectorAll('svg text')) {
    const radius = Math.hypot(
      Number(text.getAttribute('x')),
      Number(text.getAttribute('y')),
    );
    expect(radius).toBeGreaterThan(105.6);
    expect(radius).toBeLessThan(132);
  }
  fireEvent.focus(screen.getAllByRole('button')[0]!);
  const point = labelPosition(geometry.slices[0]!);
  expect(screen.getByRole('tooltip').style.left).toContain(
    `${((240 + point.x) / 480) * 100}%`,
  );
  rerender(chart({ innerRadiusRatio: 0.99, showLabels: true }));
  expect(container.querySelectorAll('svg text')).toHaveLength(0);
});
it('Pie and Donut share source tables, colors, records and percentages while paths differ', () => {
  const pie = vi.fn(),
    donut = vi.fn();
  const props = {
    data,
    nameKey: 'name',
    valueKey: 'value',
    width: 480,
    accessibility: { label: 'Allocation', dataTable: 'visible' },
  } as const;
  const { container } = render(
    <>
      <PieChart {...props} onDataActivate={pie} />
      <DonutChart {...props} onDataActivate={donut} />
    </>,
  );
  const figures = container.querySelectorAll('figure');
  expect(figures[0]!.querySelector('table')!.outerHTML).toBe(
    figures[1]!.querySelector('table')!.outerHTML,
  );
  const paths = [...figures].map((f) => [
    ...f.querySelectorAll('[data-layer=marks] path'),
  ]);
  paths[0]!.forEach((p, i) => {
    expect(p.getAttribute('fill')).toBe(paths[1]![i]!.getAttribute('fill'));
    expect(p.getAttribute('d')).not.toBe(paths[1]![i]!.getAttribute('d'));
    expect(p.parentElement!.getAttribute('transform')).toBe(
      paths[1]![i]!.parentElement!.getAttribute('transform'),
    );
  });
  const buttons = [...figures].map((f) => within(f).getAllByRole('button'));
  buttons[0]!.forEach((b, i) => {
    expect(b.getAttribute('aria-label')).toBe(
      buttons[1]![i]!.getAttribute('aria-label'),
    );
    fireEvent.click(b);
    fireEvent.click(buttons[1]![i]!);
    expect(pie.mock.calls[i]![0]).toEqual(donut.mock.calls[i]![0]);
    expect(donut.mock.calls[i]![0].record).toBe(data[i === 0 ? 0 : 2]);
  });
});
it('ratio changes preserve source selection and cancel the previous decorative animation', () => {
  const cancel = vi.fn(),
    animate = vi.fn(() => ({ cancel }));
  Object.defineProperty(SVGElement.prototype, 'animate', {
    configurable: true,
    value: animate,
  });
  vi.stubGlobal('matchMedia', () => ({
    matches: false,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  }));
  const { rerender } = render(chart({ animate: true, centerContent: 'Total' }));
  act(() => screen.getAllByRole('button')[1]!.focus());
  rerender(
    chart({ animate: true, innerRadiusRatio: 0.8, centerContent: 'Total' }),
  );
  expect(cancel).toHaveBeenCalledTimes(1);
  expect(screen.getByRole('tooltip')).toHaveTextContent('75.0%');
  expect(screen.getAllByRole('button')[1]).toHaveFocus();
});
it('hydrates separate prefixed Donut roots with center content and unique references', async () => {
  const errors = vi.spyOn(console, 'error'),
    recoverable = vi.fn();
  const roots = [];
  for (const prefix of ['donut-alpha-', 'donut-beta-']) {
    const element = (
      <StrictMode>
        {chart({ centerContent: <button>Details</button> })}
      </StrictMode>
    );
    const host = document.createElement('div');
    host.innerHTML = renderToString(element, { identifierPrefix: prefix });
    document.body.append(host);
    const html = host.innerHTML;
    let root;
    await act(async () => {
      root = hydrateRoot(host, element, {
        identifierPrefix: prefix,
        onRecoverableError: recoverable,
      });
    });
    roots.push(root!);
    expect(host.innerHTML).toBe(html);
  }
  const ids = [...document.querySelectorAll('[id]')].map((n) => n.id);
  expect(new Set(ids).size).toBe(ids.length);
  expect(recoverable).not.toHaveBeenCalled();
  expect(errors).not.toHaveBeenCalled();
  for (const root of roots) await act(async () => root.unmount());
  document.body.replaceChildren();
});
