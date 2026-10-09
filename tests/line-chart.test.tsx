import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import type { CartesianTooltipContext, CategoryValue } from '../src';
import { LineChart } from '../src';
import { installResizeObserver, latestObserver } from './resize-observer';
const data = [
  { x: 'Jan', a: 10, b: 12 },
  { x: 'Jan', a: 20, b: null },
  { x: 'Mar', a: null, b: 30 },
];
const series = [
  { key: 'a', label: 'Actual', color: '#123456' },
  { key: 'b', label: 'Forecast', color: '#654321' },
] as const;
function chart(extra = {}) {
  return (
    <LineChart data={data} xKey="x" series={series} width={640} {...extra} />
  );
}
function points() {
  return screen.getAllByRole('button').filter((el) => el.tagName === 'circle');
}
afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});
it('exposes named group, complete table, one tab entry and unhidden controls', () => {
  render(chart());
  expect(screen.getByRole('group', { name: 'Line chart' })).toBeVisible();
  expect(screen.getByRole('table')).toBeInTheDocument();
  expect(points()).toHaveLength(4);
  expect(points().filter((p) => p.tabIndex === 0)).toHaveLength(1);
  expect(points()[0]!.closest('[aria-hidden=true]')).toBeNull();
  expect(points()[0]!.closest('[clip-path]')).toBeNull();
  expect(screen.queryByRole('tooltip')).toBeNull();
});
it.each([undefined, true, { mode: 'shared' }] as const)(
  'shared tooltip %j groups by source row and excludes missing',
  (tooltip) => {
    const renderTooltip = vi.fn<
      (context: CartesianTooltipContext<(typeof data)[number]>) => null
    >(() => null);
    render(
      chart({
        tooltip:
          typeof tooltip === 'object'
            ? { ...tooltip, render: renderTooltip }
            : tooltip,
      }),
    );
    fireEvent.focus(points()[2]!);
    if (typeof tooltip === 'object') {
      expect(renderTooltip.mock.calls[0]?.[0]).toMatchObject({
        mode: 'shared',
        items: [{ index: 1, value: 20 }],
      });
    } else {
      expect(screen.getByRole('tooltip')).toHaveTextContent('Actual: 20');
      expect(screen.getByRole('tooltip')).not.toHaveTextContent('Forecast');
    }
  },
);
it('preserves full datum identity and configured order in custom shared renderers', () => {
  const callback = vi.fn<
    (context: CartesianTooltipContext<(typeof data)[number]>) => null
  >(() => null);
  render(chart({ tooltip: callback }));
  fireEvent.focus(points()[1]!);
  const ctx = callback.mock.calls.at(-1)![0];
  expect(ctx).toEqual({
    mode: 'shared',
    category: 'Jan',
    items: [
      {
        record: data[0],
        index: 0,
        value: 10,
        seriesKey: 'a',
        seriesLabel: 'Actual',
        color: '#123456',
        category: 'Jan',
      },
      {
        record: data[0],
        index: 0,
        value: 12,
        seriesKey: 'b',
        seriesLabel: 'Forecast',
        color: '#654321',
        category: 'Jan',
      },
    ],
  });
  if (ctx?.mode !== 'shared') throw new Error('Expected shared context');
  expect(ctx.items[0]!.record).toBe(data[0]);
});
it('item renderer receives exactly the selected original item', () => {
  const callback = vi.fn<
    (context: CartesianTooltipContext<(typeof data)[number]>) => null
  >(() => null);
  render(chart({ tooltip: { mode: 'item', render: callback } }));
  fireEvent.focus(points()[1]!);
  expect(callback.mock.calls.at(-1)![0]).toEqual({
    mode: 'item',
    item: {
      record: data[0],
      index: 0,
      value: 12,
      seriesKey: 'b',
      seriesLabel: 'Forecast',
      color: '#654321',
      category: 'Jan',
    },
  });
});
it('keyboard navigation, dismissal, focus and exactly-once activation use source/series order', () => {
  const activate = vi.fn();
  render(chart({ onDataActivate: activate }));
  act(() => points()[0]!.focus());
  fireEvent.keyDown(points()[0]!, { key: 'ArrowRight' });
  expect(points()[1]).toHaveFocus();
  expect(points()[1]).toHaveAttribute(
    'stroke',
    'var(--rsc-focus-color, #075985)',
  );
  fireEvent.keyDown(points()[1]!, { key: 'Enter' });
  fireEvent.click(points()[1]!, { detail: 0 });
  expect(activate).toHaveBeenCalledTimes(1);
  expect(activate.mock.calls[0]![0]).toEqual({
    record: data[0],
    index: 0,
    value: 12,
    seriesKey: 'b',
    seriesLabel: 'Forecast',
    color: '#654321',
    category: 'Jan',
    inputMethod: 'keyboard',
  });
  expect(activate.mock.calls[0]![0].record).toBe(data[0]);
  fireEvent.keyDown(points()[1]!, { key: 'End' });
  expect(points()[3]).toHaveFocus();
  fireEvent.keyDown(points()[3]!, { key: 'Home' });
  expect(points()[0]).toHaveFocus();
  fireEvent.keyDown(points()[0]!, { key: ' ' });
  expect(activate.mock.calls[1]![0].inputMethod).toBe('keyboard');
  fireEvent.keyDown(points()[0]!, { key: 'Escape' });
  expect(screen.queryByRole('tooltip')).toBeNull();
  expect(points()[0]).not.toHaveAttribute('aria-describedby');
  const tab = new KeyboardEvent('keydown', {
    key: 'Tab',
    cancelable: true,
    bubbles: true,
  });
  points()[0]!.dispatchEvent(tab);
  expect(tab.defaultPrevented).toBe(false);
});
it.each(['mouse', 'pen'])(
  'pointer %s hover and activation remain independent of tooltip',
  (pointerType) => {
    class TestPointerEvent extends MouseEvent {
      pointerType: string;
      constructor(type: string, init: PointerEventInit) {
        super(type, init);
        this.pointerType = init.pointerType ?? 'mouse';
      }
    }
    vi.stubGlobal('PointerEvent', TestPointerEvent);
    const activate = vi.fn();
    render(chart({ tooltip: false, onDataActivate: activate }));
    fireEvent.pointerEnter(points()[0]!, { pointerType });
    expect(activate).not.toHaveBeenCalled();
    fireEvent.pointerDown(points()[0]!, { pointerType });
    fireEvent.click(points()[0]!, { detail: 1 });
    expect(activate).toHaveBeenCalledTimes(1);
    expect(activate.mock.calls[0]![0].inputMethod).toBe('pointer');
    expect(screen.queryByRole('tooltip')).toBeNull();
  },
);
it('touch selects persistently, activates once and suppresses synthesized click', () => {
  class TestPointerEvent extends MouseEvent {
    pointerType = 'touch';
  }
  vi.stubGlobal('PointerEvent', TestPointerEvent);
  const activate = vi.fn();
  render(chart({ onDataActivate: activate }));
  fireEvent.pointerDown(points()[0]!);
  fireEvent.pointerUp(points()[0]!);
  fireEvent.focus(points()[0]!);
  fireEvent.click(points()[0]!, { detail: 1 });
  fireEvent.pointerLeave(points()[0]!);
  expect(activate).toHaveBeenCalledTimes(1);
  expect(activate.mock.calls[0]![0].inputMethod).toBe('touch');
  expect(screen.getByRole('tooltip')).toBeVisible();
  fireEvent.click(screen.getByRole('button', { name: 'Dismiss inspection' }));
  expect(screen.queryByRole('tooltip')).toBeNull();
});
it('pointer leave dismisses hover inspection', () => {
  render(chart());
  fireEvent.pointerEnter(points()[0]!);
  expect(screen.getByRole('tooltip')).toBeVisible();
  fireEvent.pointerLeave(points()[0]!);
  expect(screen.queryByRole('tooltip')).toBeNull();
});
it('resize keeps inspected identity; replacement data and unusable states clear stale content', () => {
  installResizeObserver();
  const { rerender } = render(chart({ width: undefined }));
  act(() => latestObserver().emit(500));
  fireEvent.focus(points()[2]!);
  act(() => latestObserver().emit(600));
  expect(screen.getByRole('tooltip')).toHaveTextContent('20');
  rerender(
    <LineChart
      data={[{ x: 'Z', a: 7, b: 9 }]}
      xKey="x"
      series={series}
      width={640}
    />,
  );
  expect(screen.queryByRole('tooltip')).toBeNull();
  rerender(chart({ yAxis: { min: 10, max: 0 } }));
  expect(points).toThrow();
  expect(screen.getByRole('table')).toBeInTheDocument();
});
it.each(['category', 'linear', 'utc', 'time'] as const)(
  'inspects %s raw categories without mutating dates',
  (xScale) => {
    const category =
      xScale === 'category'
        ? 'A'
        : xScale === 'linear'
          ? 2
          : new Date('2026-01-01');
    const callback = vi.fn<
      (context: { mode: 'item' | 'shared'; category?: CategoryValue }) => null
    >(() => null);
    const row = { x: category, y: 2 };
    if (xScale === 'linear')
      render(
        <LineChart
          data={[{ x: 2, y: 2 }]}
          xScale="linear"
          xKey="x"
          yKey="y"
          width={640}
          tooltip={callback}
        />,
      );
    else if (typeof category === 'object')
      render(
        <LineChart
          data={[{ x: category, y: 2 }]}
          xScale={xScale === 'time' ? 'time' : 'utc'}
          xKey="x"
          yKey="y"
          width={640}
          tooltip={callback}
        />,
      );
    else
      render(
        <LineChart
          data={[row]}
          xKey="x"
          yKey="y"
          width={640}
          tooltip={callback}
        />,
      );
    fireEvent.focus(points()[0]!);
    const ctx = callback.mock.calls.at(-1)![0];
    expect(ctx.mode === 'shared' && ctx.category).toBe(category);
  },
);
it.each([false, true, 'reduce'] as const)(
  'animation policy %s is bounded and cleans up',
  (mode) => {
    const cancel = vi.fn();
    const animate = vi.fn(() => ({ cancel }));
    vi.stubGlobal('matchMedia', () => ({
      matches: mode === 'reduce',
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }));
    Object.defineProperty(SVGElement.prototype, 'animate', {
      configurable: true,
      value: animate,
    });
    const { unmount } = render(chart({ animate: mode !== false }));
    expect(animate).toHaveBeenCalledTimes(mode === true ? 1 : 0);
    unmount();
    expect(cancel).toHaveBeenCalledTimes(mode === true ? 1 : 0);
    delete (SVGElement.prototype as { animate?: unknown }).animate;
  },
);
it('Date formatter mutation is isolated and bad tooltip formatting falls back safely', () => {
  const date = new Date('2026-01-01');
  const timestamp = date.getTime();
  render(
    <LineChart
      width={640}
      data={[{ x: date, y: 7 }]}
      xKey="x"
      yKey="y"
      xAxis={{ show: false }}
      yAxis={{ show: false }}
      formatCategory={(value) => {
        if (typeof value === 'object') value.setTime(0);
        throw new Error('Bad formatter');
      }}
      formatValue={() => {
        throw new Error('Bad formatter');
      }}
    />,
  );
  fireEvent.focus(points()[0]!);
  expect(screen.getByRole('tooltip')).toHaveTextContent(
    '2026-01-01T00:00:00.000Z',
  );
  expect(screen.getByRole('tooltip')).toHaveTextContent('Y: 7');
  expect(date.getTime()).toBe(timestamp);
});
it('cross-realm repeated Dates remain distinct and retain raw references', () => {
  const frame = document.createElement('iframe');
  document.body.append(frame);
  const date = new (frame.contentWindow as Window & typeof globalThis).Date(
    '2026-01-01',
  );
  const rows = [
    { x: date, y: 3 },
    { x: date, y: 4 },
  ];
  const callback = vi.fn<
    (context: CartesianTooltipContext<(typeof rows)[number]>) => null
  >(() => null);
  render(
    <LineChart
      data={rows}
      xKey="x"
      yKey="y"
      xScale="utc"
      width={640}
      tooltip={callback}
    />,
  );
  fireEvent.focus(points()[1]!);
  const context = callback.mock.calls.at(-1)![0];
  if (context.mode !== 'shared') throw new Error('Expected shared');
  expect(context.category).toBe(date);
  expect(context.items).toHaveLength(1);
  expect(context.items[0]!.index).toBe(1);
  expect(context.items[0]!.record).toBe(rows[1]);
  frame.remove();
});
it('remapping configured series cannot retain a stale datum at the same series index', () => {
  const { rerender } = render(chart());
  fireEvent.focus(points()[0]!);
  rerender(<LineChart data={data} xKey="x" yKey="b" width={640} />);
  expect(screen.getByRole('tooltip')).toHaveTextContent('B: 12');
  expect(screen.getByRole('tooltip')).not.toHaveTextContent('Actual: 10');
});
it('empty transitions remove controls and preserve the table without stale tooltips', () => {
  const { rerender } = render(chart());
  fireEvent.focus(points()[0]!);
  rerender(
    <LineChart<{ x: string; a: number }>
      data={[]}
      xKey="x"
      yKey="a"
      width={640}
    />,
  );
  expect(screen.queryByRole('tooltip')).toBeNull();
  expect(screen.queryByRole('button')).toBeNull();
  expect(screen.getByRole('img')).toHaveTextContent('No chart data');
  expect(screen.getByRole('table')).toBeInTheDocument();
});
it('reduced-motion changes cancel a running enhancement', () => {
  const cancel = vi.fn();
  const media = {
    matches: false,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  };
  vi.stubGlobal('matchMedia', () => media);
  Object.defineProperty(SVGElement.prototype, 'animate', {
    configurable: true,
    value: vi.fn(() => ({ cancel })),
  });
  const { unmount } = render(chart({ animate: true }));
  media.matches = true;
  media.addEventListener.mock.calls[0]![1]();
  expect(cancel).toHaveBeenCalledTimes(1);
  unmount();
  expect(media.removeEventListener).toHaveBeenCalledWith(
    'change',
    media.addEventListener.mock.calls[0]![1],
  );
  delete (SVGElement.prototype as { animate?: unknown }).animate;
});
it('unsupported animation APIs preserve the fully visible chart', () => {
  render(chart({ animate: true }));
  expect(screen.getByRole('group', { name: 'Line chart' })).toBeVisible();
  expect(screen.getByRole('table')).toBeInTheDocument();
});
