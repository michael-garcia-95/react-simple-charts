import { fireEvent, render, screen } from '@testing-library/react';
import { expect, it, vi } from 'vitest';
import { BarChart } from '../src';
import { normalizeCartesian } from '../src/core/data/cartesian';
import { buildCartesianGeometry } from '../src/core/geometry/cartesian';

it.each(['vertical', 'horizontal'] as const)(
  'renders exact grouped %s geometry for positive, negative, mixed, zero and missing values',
  (orientation) => {
    for (const values of [
      [1, 3, 2],
      [-1, -3, -2],
      [-2, 3, 0],
      [0, 0, 0],
    ]) {
      const data = Object.freeze(
        values.map((a, i) =>
          Object.freeze({ x: 'Repeated', a, b: i === 1 ? null : -a }),
        ),
      );
      const props = {
        data,
        xKey: 'x',
        series: [{ key: 'b', color: '#123456' }, { key: 'a' }],
        width: 640,
      } as const;
      const geometry = buildCartesianGeometry({
        normalized: normalizeCartesian(props),
        family: 'bar',
        orientation,
        width: 640,
        height: 280,
      });
      if (geometry.status !== 'ready' || geometry.family !== 'bar')
        throw Error('Expected Bar');
      const { container, unmount } = render(
        <BarChart {...props} orientation={orientation} />,
      );
      const rects = container.querySelectorAll('[data-bar]');
      expect(rects).toHaveLength(geometry.bars.length);
      geometry.bars.forEach((bar, i) => {
        for (const attr of ['x', 'y', 'width', 'height'] as const)
          expect(rects[i]).toHaveAttribute(attr, String(bar[attr]));
        expect(rects[i]).toHaveAttribute(
          'data-source-index',
          String(bar.index),
        );
        expect(rects[i]).toHaveAttribute('data-series', bar.seriesKey);
        expect(bar.record).toBe(data[bar.index]);
        if (bar.value === 0)
          expect(orientation === 'vertical' ? bar.height : bar.width).toBe(0);
        expect(orientation === 'vertical' ? bar.y : bar.x).toBeLessThanOrEqual(
          bar.baseline,
        );
      });
      expect(screen.getAllByRole('button')).toHaveLength(geometry.bars.length);
      expect(screen.getAllByRole('row')).toHaveLength(4);
      expect(container.innerHTML).not.toMatch(/NaN|Infinity/);
      unmount();
    }
  },
);
it.each(['vertical', 'horizontal'] as const)(
  'routes %s formatters and explicit overrides to physical axes',
  (orientation) => {
    const data = [
      { x: 100, y: -3 },
      { x: 100, y: 3 },
    ];
    const { container, rerender } = render(
      <BarChart
        data={data}
        xKey="x"
        yKey="y"
        width={640}
        orientation={orientation}
        formatCategory={(v) => `CAT ${String(v)}`}
        formatValue={(v) => `VAL ${v}`}
      />,
    );
    const category = orientation === 'vertical' ? 'x' : 'y',
      value = orientation === 'vertical' ? 'y' : 'x';
    expect(
      container.querySelector(`[data-axis="${category}"]`),
    ).toHaveTextContent('CAT 100');
    expect(container.querySelector(`[data-axis="${value}"]`)).toHaveTextContent(
      'VAL',
    );
    const lines = container.querySelectorAll('[data-layer="grid"] line');
    for (const line of lines)
      expect(line.getAttribute(orientation === 'vertical' ? 'y1' : 'x1')).toBe(
        line.getAttribute(orientation === 'vertical' ? 'y2' : 'x2'),
      );
    rerender(
      <BarChart
        data={data}
        xKey="x"
        yKey="y"
        width={640}
        orientation={orientation}
        xAxis={{ formatTick: () => 'EXPLICIT X', label: 'X title' }}
        yAxis={{ formatTick: () => 'EXPLICIT Y', label: 'Y title' }}
        formatCategory={() => 'BAD'}
        formatValue={() => 'BAD'}
      />,
    );
    expect(container.querySelector('[data-axis="x"]')).toHaveTextContent(
      'EXPLICIT X',
    );
    expect(container.querySelector('[data-axis="y"]')).toHaveTextContent(
      'EXPLICIT Y',
    );
    expect(
      container.querySelector('[data-layer="axes"]'),
    ).not.toHaveTextContent('BAD');
    rerender(
      <BarChart
        data={data}
        xKey="x"
        yKey="y"
        width={640}
        orientation={orientation}
        xAxis={{ show: false }}
        yAxis={{ show: false }}
        showGrid={false}
      />,
    );
    expect(container.querySelector('[data-axis]')).toBeNull();
    expect(
      container.querySelector('[data-layer="grid"]'),
    ).toBeEmptyDOMElement();
  },
);
it.each([undefined, true, { mode: 'item' }] as const)(
  'defaults to item inspection with %j',
  (tooltip) => {
    render(
      <BarChart
        width={640}
        data={[{ x: 'A', a: -2, b: 3 }]}
        xKey="x"
        series={[{ key: 'a' }, { key: 'b' }]}
        {...(tooltip === undefined ? {} : { tooltip })}
      />,
    );
    fireEvent.focus(screen.getAllByRole('button')[0]!);
    expect(screen.getByRole('tooltip')).toHaveTextContent('A: -2');
    expect(screen.getByRole('tooltip')).not.toHaveTextContent('B: 3');
  },
);
it('function tooltip defaults to item and preserves negative, zero, Date and record references', () => {
  const date = new Date('2026-01-01');
  const data = [
    { x: date, y: -3 },
    { x: date, y: 0 },
  ];
  const renderTooltip = vi.fn<(context: unknown) => null>(() => null);
  const activate = vi.fn();
  render(
    <BarChart
      width={640}
      data={data}
      xKey="x"
      yKey="y"
      tooltip={renderTooltip}
      onDataActivate={activate}
    />,
  );
  const controls = screen.getAllByRole('button');
  controls.forEach((control, i) => {
    fireEvent.focus(control);
    const context = renderTooltip.mock.calls.at(-1)![0] as unknown as {
      mode: string;
      item: { record: unknown; category: unknown; value: number };
    };
    expect(context.mode).toBe('item');
    expect(context.item.record).toBe(data[i]);
    expect(context.item.category).toBe(date);
    expect(context.item.value).toBe(data[i]!.y);
    fireEvent.keyDown(control, { key: 'Enter' });
  });
  expect(activate.mock.calls.map((c) => c[0].value)).toEqual([-3, 0]);
});
it.each(['vertical', 'horizontal'] as const)(
  'keeps partially clipped %s Bars eligible, excludes wholly invisible Bars and includes clipped shared values',
  (orientation) => {
    const data = [
      { x: 'A', a: 5, b: -1 },
      { x: 'A', a: -5, b: null },
    ];
    const callback = vi.fn();
    const props = {
      data,
      xKey: 'x',
      series: [{ key: 'a' }, { key: 'b' }],
      width: 640,
      tooltip: { mode: 'shared', render: callback },
    } as const;
    const { container } = render(
      orientation === 'vertical' ? (
        <BarChart {...props} yAxis={{ min: 0, max: 4 }} />
      ) : (
        <BarChart
          {...props}
          orientation="horizontal"
          xAxis={{ min: 0, max: 4 }}
        />
      ),
    );
    expect(container.querySelectorAll('[data-bar]')).toHaveLength(3);
    const controls = screen.getAllByRole('button');
    expect(controls).toHaveLength(1);
    fireEvent.focus(controls[0]!);
    expect(
      callback.mock.calls
        .at(-1)![0]
        .items.map((i: { value: number }) => i.value),
    ).toEqual([5, -1]);
    const plot = container.querySelector('clipPath rect')!;
    const hit = controls[0]!;
    for (const [start, size] of [
      ['x', 'width'],
      ['y', 'height'],
    ] as const) {
      expect(Number(hit.getAttribute(start))).toBeGreaterThanOrEqual(
        Number(plot.getAttribute(start)),
      );
      expect(
        Number(hit.getAttribute(start)) + Number(hit.getAttribute(size)),
      ).toBeLessThanOrEqual(
        Number(plot.getAttribute(start)) + Number(plot.getAttribute(size)),
      );
    }
  },
);
it.each(['empty', 'unusable', 'pending'] as const)(
  'retains complete tables in %s',
  (state) => {
    const { container } = render(
      <BarChart<{ x: string; y: number }>
        data={state === 'empty' ? [] : [{ x: 'A', y: 0 }]}
        xKey="x"
        yKey="y"
        {...(state === 'pending' ? {} : { width: 640 })}
        {...(state === 'unusable' ? { yAxis: { min: 2, max: 1 } } : {})}
      />,
    );
    expect(container.querySelector('svg')).toBeNull();
    expect(screen.queryByRole('button')).toBeNull();
    expect(screen.getByRole('table')).toBeInTheDocument();
  },
);
it('renders subpixel slots without minimum decorative widths', () => {
  const data = Array.from({ length: 600 }, (_, i) => ({ x: i, y: 1 }));
  const { container } = render(
    <BarChart width={640} data={data} xKey="x" yKey="y" />,
  );
  const rects = container.querySelectorAll('[data-bar]');
  expect(rects).toHaveLength(600);
  for (const rect of rects)
    expect(Number(rect.getAttribute('width'))).toBeLessThan(1);
});

it('retains missing and invalid source rows without fabricating rectangles or values', () => {
  const data = [
    { x: 'A', a: 2, b: Infinity },
    { x: 'A', a: null, b: 0 },
    { x: null, a: 5, b: 3 },
    { x: 'D', a: NaN, b: -2 },
  ];
  const { container } = render(
    <BarChart
      width={640}
      data={data}
      xKey="x"
      series={[{ key: 'a' }, { key: 'b' }]}
      accessibility={{ dataTable: 'visible' }}
    />,
  );
  expect(container.querySelectorAll('[data-bar]')).toHaveLength(3);
  expect(screen.getAllByRole('row')).toHaveLength(5);
  expect(screen.getByRole('table')).toHaveTextContent('Missing');
  expect(screen.getByRole('table')).toHaveTextContent('Invalid');
  const controls = screen.getAllByRole('button');
  fireEvent.focus(controls[1]!);
  expect(controls[1]).toHaveAttribute(
    'stroke',
    'var(--rsc-focus-color, #075985)',
  );
  expect(screen.getByRole('tooltip')).toHaveTextContent('B: 0');
  expect(container.innerHTML).not.toMatch(/NaN|Infinity/);
});
it('keeps raw source data when the series mapping is invalid', () => {
  render(
    <BarChart width={640} data={[{ x: 'A', y: 4 }]} xKey="x" series={[]} />,
  );
  expect(screen.getByRole('img')).toHaveTextContent('unavailable');
  expect(screen.getByRole('table')).toHaveTextContent('4');
  expect(screen.queryByRole('button')).toBeNull();
});
