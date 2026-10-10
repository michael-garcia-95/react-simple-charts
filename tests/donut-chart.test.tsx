import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { DonutChart } from '../src';
import type { DonutChartProps, SegmentTooltipContext } from '../src';
import { normalizeSegments } from '../src/core/data/segments';
import { buildPolarGeometry } from '../src/core/geometry/polar';
import { indexedColor } from '../src/internal/svg/presentation';
import {
  installResizeObserver,
  latestObserver,
  TestResizeObserver,
} from './resize-observer';
const data = [
  { name: 'Same', value: 1 },
  { name: 'Zero', value: 0 },
  { name: 'Missing', value: null },
  { name: 'Same', value: 3 },
];
type Row = (typeof data)[number];
function chart(extra: Partial<DonutChartProps<Row>> = {}) {
  return (
    <DonutChart
      data={data}
      nameKey="name"
      valueKey="value"
      width={480}
      {...extra}
    />
  );
}
function controls() {
  return screen.getAllByRole('button').filter((el) => el.tagName === 'path');
}
function pointers() {
  class Pointer extends MouseEvent {
    pointerType: string;
    pointerId: number;
    constructor(type: string, init: PointerEventInit) {
      super(type, init);
      this.pointerType = init.pointerType ?? 'mouse';
      this.pointerId = init.pointerId ?? 9;
    }
  }
  vi.stubGlobal('PointerEvent', Pointer);
}
afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  vi.useRealTimers();
  delete (SVGElement.prototype as { animate?: unknown }).animate;
});
describe('public Donut presentation', () => {
  it.each(
    [[1], [1, 3], [0, 2, 0, 6], [2, 2, 2]].map((values) => [values] as const),
  )('uses exact pure engine paths and transforms for %j', (values) => {
    const rows = values.map((value) => ({ name: 'Repeated', value }));
    const props = {
      data: rows,
      nameKey: 'name',
      valueKey: 'value',
      width: 480,
      height: 280,
    } as const;
    const geometry = buildPolarGeometry({
      normalized: normalizeSegments(props),
      family: 'donut',
      width: 480,
      height: 280,
    });
    if (geometry.status !== 'ready') throw Error('Expected ready');
    const { container } = render(<DonutChart {...props} />);
    const paths = container.querySelectorAll('[data-layer=marks] path');
    expect(paths).toHaveLength(geometry.slices.length);
    geometry.slices.forEach((slice, i) => {
      expect(paths[i]).toHaveAttribute('d', slice.path);
      expect(paths[i]!.parentElement).toHaveAttribute(
        'transform',
        `translate(${slice.centerX} ${slice.centerY})`,
      );
      expect(controls()[i]).toHaveAttribute('d', slice.path);
      expect(controls()[i]).toHaveAttribute(
        'transform',
        `translate(${slice.centerX} ${slice.centerY})`,
      );
    });
    expect(geometry.slices[0]!.startAngle).toBe(0);
    if (values.length === 1)
      expect(paths[0]!.getAttribute('d')!.match(/A/g)).toHaveLength(4);
    expect(container.innerHTML).not.toMatch(/NaN|Infinity/);
  });
  it('names a group with exposed controls and hidden decorative paths', () => {
    const { container } = render(
      chart({
        accessibility: { label: 'Budget', description: 'Annual allocation' },
      }),
    );
    const svg = screen.getByRole('group', { name: 'Budget' });
    expect(svg).toHaveAccessibleDescription('Annual allocation');
    expect(controls()).toHaveLength(2);
    expect(controls().filter((el) => el.tabIndex === 0)).toHaveLength(1);
    controls().forEach((el) =>
      expect(el.closest('[aria-hidden=true]')).toBeNull(),
    );
    expect(container.querySelector('[data-layer=marks]')).toHaveAttribute(
      'aria-hidden',
      'true',
    );
    expect(screen.getByRole('table')).toBeInTheDocument();
  });
  it.each([undefined, false, true])(
    'legend %s retains duplicate entries and all source rows',
    (showLegend) => {
      render(chart(showLegend === undefined ? {} : { showLegend }));
      expect(screen.getAllByRole('row')).toHaveLength(5);
      if (showLegend === false) expect(screen.queryByRole('list')).toBeNull();
      else
        expect(
          within(screen.getByRole('list', { name: 'Chart segments' }))
            .getAllByRole('listitem')
            .map((el) => el.textContent),
        ).toEqual(['Same', 'Same']);
    },
  );
  it.each([undefined, false, true])('labels %s are opt-in', (showLabels) => {
    const { container } = render(
      chart(showLabels === undefined ? {} : { showLabels }),
    );
    expect(container.querySelectorAll('svg text')).toHaveLength(
      showLabels ? 2 : 0,
    );
  });
  it('suppresses tiny and long visual labels but exposes every positive sector', () => {
    const { container } = render(
      <DonutChart
        data={[
          { name: 'Tiny', value: 0.001 },
          { name: 'A very long segment name that cannot fit', value: 5 },
          { name: 'Fit', value: 5 },
        ]}
        nameKey="name"
        valueKey="value"
        width={320}
        showLabels
      />,
    );
    expect(container.querySelectorAll('text')).toHaveLength(1);
    expect(container.querySelector('text')).toHaveTextContent('Fit');
    expect(controls()).toHaveLength(3);
    fireEvent.focus(controls()[0]!);
    expect(screen.getByRole('tooltip')).toHaveTextContent('Tiny');
  });
  it('resolves source-index colors identically for marks legend and payload', () => {
    const colors = Object.freeze(['red', 'green', 'blue', 'purple']);
    const renderer = vi.fn<(c: SegmentTooltipContext<Row>) => null>(() => null);
    const { container } = render(chart({ colors, tooltip: renderer }));
    expect(
      [...container.querySelectorAll('[data-layer=marks] path')].map((el) =>
        el.getAttribute('fill'),
      ),
    ).toEqual(['red', 'purple']);
    expect(
      [...screen.getByRole('list').querySelectorAll('span')].map(
        (el) => el.style.background,
      ),
    ).toEqual(['red', 'purple']);
    fireEvent.focus(controls()[1]!);
    expect(renderer.mock.calls.at(-1)![0].segment.color).toBe('purple');
    expect(colors).toEqual(['red', 'green', 'blue', 'purple']);
  });
  it('defaults to the shared CSS variable palette by original index', () => {
    const { container } = render(chart());
    expect(
      container.querySelectorAll('[data-layer=marks] path')[1],
    ).toHaveAttribute('fill', indexedColor(3));
  });
  it.each(['visible', 'visually-hidden'] as const)(
    'complete semantic source table is %s',
    (dataTable) => {
      render(chart({ accessibility: { dataTable } }));
      const table = screen.getByRole('table');
      expect(table.querySelector('caption')).toHaveTextContent(
        'Donut chart — data',
      );
      expect(
        within(table)
          .getAllByRole('columnheader')
          .map((el) => el.textContent),
      ).toEqual(['Name', 'Value']);
      expect(
        within(table)
          .getAllByRole('rowheader')
          .map((el) => el.textContent),
      ).toEqual(['Same', 'Zero', 'Missing', 'Same']);
      expect(
        within(table)
          .getAllByRole('cell')
          .map((el) => el.textContent),
      ).toEqual(['1', '0', 'Missing', '3']);
      expect(table.style.position).toBe(
        dataTable === 'visible' ? '' : 'absolute',
      );
    },
  );
  it('preserves missing invalid negative and cross-realm Date classifications', () => {
    const iframe = document.createElement('iframe');
    document.body.append(iframe);
    const ForeignDate = (
      iframe.contentWindow as unknown as { Date: DateConstructor }
    ).Date;
    const rows = [
      { name: new ForeignDate('2026-01-01'), value: 2 },
      { name: 4, value: 0 },
      { name: null, value: null },
      { name: 'Invalid', value: NaN },
      { name: 'Negative', value: -3 },
      { name: undefined, value: undefined },
    ];
    render(
      <DonutChart data={rows} nameKey="name" valueKey="value" width={400} />,
    );
    expect(screen.queryByRole('group')).toBeNull();
    expect(
      screen.getAllByRole('rowheader').map((el) => el.textContent),
    ).toEqual([
      '2026-01-01T00:00:00.000Z',
      '4',
      'Missing',
      'Invalid',
      'Negative',
      'Missing',
    ]);
    expect(screen.getAllByRole('cell').map((el) => el.textContent)).toEqual([
      '2',
      '0',
      'Missing',
      'Invalid',
      '-3',
      'Missing',
    ]);
    iframe.remove();
  });
  it('uses a safe raw table when mapping configuration fails', () => {
    const props = {
      data: [{ name: 'A', value: 2 }],
      nameKey: 42,
      valueKey: 'value',
      width: 400,
    } as unknown as DonutChartProps<Row>;
    render(<DonutChart {...props} />);
    expect(
      screen.getByRole('table').querySelector('caption'),
    ).toHaveTextContent('source data');
    expect(screen.getAllByRole('columnheader')).toHaveLength(3);
  });
  it('malformed nonarray data still has a semantic table without invented columns', () => {
    render(
      <DonutChart
        {...({
          data: null,
          nameKey: 'name',
          valueKey: 'value',
          width: 400,
        } as unknown as DonutChartProps<Row>)}
      />,
    );
    expect(screen.getByRole('table')).toBeInTheDocument();
    expect(screen.getAllByRole('columnheader')).toHaveLength(1);
  });
  it.each(
    [[], [{ name: 'A', value: 0 }], [{ name: 'A', value: null }]].map(
      (rows) => [rows] as const,
    ),
  )('empty %j has no fake slice', (rows) => {
    render(
      <DonutChart
        data={rows as Row[]}
        nameKey="name"
        valueKey="value"
        width={400}
      />,
    );
    expect(screen.getByRole('img')).toHaveTextContent('No chart data');
    expect(screen.queryByRole('button')).toBeNull();
    expect(screen.getByRole('table')).toBeInTheDocument();
  });
  it.each([0, -1, NaN, Infinity, Number.MAX_SAFE_INTEGER + 1])(
    'invalid numeric width %s is unavailable',
    (width) => {
      const { container } = render(chart({ width }));
      expect(screen.getByRole('img')).toHaveTextContent('unavailable');
      expect(container.querySelector('svg')).toBeNull();
      expect(screen.getByRole('table')).toBeInTheDocument();
    },
  );
  it.each([0, 8, 16, -1, NaN, Infinity])(
    'invalid or insufficient height %s is unavailable',
    (height) => {
      render(chart({ height }));
      expect(screen.getByRole('img')).toHaveTextContent('unavailable');
      expect(screen.getByRole('table')).toBeInTheDocument();
    },
  );
});
describe('Donut inspection', () => {
  it.each([undefined, true, {}, false])(
    'tooltip form %j and exact one-decimal percentage',
    (tooltip) => {
      render(
        chart(
          tooltip === undefined
            ? { formatValue: (v: number) => `$${v.toFixed(2)}` }
            : { tooltip, formatValue: (v) => `$${v.toFixed(2)}` },
        ),
      );
      fireEvent.focus(controls()[0]!);
      if (tooltip === false) expect(screen.queryByRole('tooltip')).toBeNull();
      else {
        expect(screen.getByRole('tooltip')).toHaveTextContent('Same');
        expect(screen.getByRole('tooltip')).toHaveTextContent('$1.00 (25.0%)');
        expect(controls()[0]).toHaveAttribute(
          'aria-describedby',
          screen.getByRole('tooltip').id,
        );
      }
    },
  );
  it.each(['function', 'object'] as const)(
    'custom %s renderer receives exact source identity and geometry percentage',
    (form) => {
      const renderer = vi.fn<(c: SegmentTooltipContext<Row>) => null>(
        () => null,
      );
      render(
        chart({
          tooltip: form === 'function' ? renderer : { render: renderer },
        }),
      );
      fireEvent.focus(controls()[1]!);
      const datum = renderer.mock.calls.at(-1)![0].segment;
      expect(datum).toEqual({
        record: data[3],
        index: 3,
        segmentId: 3,
        label: 'Same',
        value: 3,
        percentage: 75,
        color: indexedColor(3),
      });
      expect(datum.record).toBe(data[3]);
      expect(screen.getByRole('tooltip')).toBeEmptyDOMElement();
    },
  );
  it.each(['A', 2, new Date('2026-01-01')])(
    'safe category %s formatting',
    (name) => {
      render(
        <DonutChart
          width={400}
          data={[{ name, value: 2 }]}
          nameKey="name"
          valueKey="value"
        />,
      );
      fireEvent.focus(controls()[0]!);
      expect(screen.getByRole('tooltip')).toHaveTextContent(
        name instanceof Date ? name.toISOString() : String(name),
      );
    },
  );
  it('formatter exceptions preserve source values and inspection', () => {
    render(
      chart({
        formatValue: () => {
          throw Error('bad');
        },
      }),
    );
    fireEvent.focus(controls()[0]!);
    expect(screen.getByRole('tooltip')).toHaveTextContent('1 (25.0%)');
    expect(screen.getAllByRole('cell')[0]).toHaveTextContent('1');
  });
  it.each(['ArrowRight', 'ArrowDown', 'End'])(
    '%s navigates forward without activation',
    (key) => {
      const callback = vi.fn();
      render(chart({ onDataActivate: callback }));
      act(() => controls()[0]!.focus());
      fireEvent.keyDown(controls()[0]!, { key });
      expect(controls()[1]).toHaveFocus();
      expect(controls()[1]).toHaveAttribute('tabindex', '0');
      expect(controls()[1]).toHaveAttribute(
        'stroke',
        'var(--rsc-focus-color, #075985)',
      );
      expect(callback).not.toHaveBeenCalled();
    },
  );
  it.each(['ArrowLeft', 'ArrowUp', 'Home'])(
    '%s navigates backward and clamps at boundary',
    (key) => {
      render(chart());
      act(() => controls()[1]!.focus());
      fireEvent.keyDown(controls()[1]!, { key });
      expect(controls()[0]).toHaveFocus();
      fireEvent.keyDown(controls()[0]!, { key });
      expect(controls()[0]).toHaveFocus();
    },
  );
  it('Escape dismisses, Tab exits without cancellation or trapping', () => {
    render(chart());
    act(() => controls()[0]!.focus());
    fireEvent.keyDown(controls()[0]!, { key: 'Escape' });
    expect(screen.queryByRole('tooltip')).toBeNull();
    const event = new KeyboardEvent('keydown', {
      key: 'Tab',
      bubbles: true,
      cancelable: true,
    });
    controls()[0]!.dispatchEvent(event);
    expect(event.defaultPrevented).toBe(false);
  });
  it.each(['Enter', ' '])(
    '%s activates once with keyboard and suppresses compatibility click',
    (key) => {
      const activate = vi.fn();
      render(chart({ onDataActivate: activate }));
      fireEvent.keyDown(controls()[0]!, { key });
      fireEvent.keyDown(controls()[0]!, { key, repeat: true });
      fireEvent.keyUp(controls()[0]!, { key });
      fireEvent.click(controls()[0]!, { detail: 0 });
      expect(activate).toHaveBeenCalledTimes(1);
      expect(activate.mock.calls[0]![0].inputMethod).toBe('keyboard');
    },
  );
  it.each(['mouse', 'pen'])(
    '%s hover inspects; release and click activate once as pointer',
    (pointerType) => {
      pointers();
      const activate = vi.fn();
      render(chart({ onDataActivate: activate }));
      fireEvent.pointerEnter(controls()[0]!, { pointerType });
      fireEvent.pointerMove(controls()[0]!, { pointerType });
      expect(screen.getByRole('tooltip')).toBeInTheDocument();
      expect(activate).not.toHaveBeenCalled();
      fireEvent.pointerDown(controls()[0]!, { pointerType });
      fireEvent.pointerUp(controls()[0]!, { pointerType });
      fireEvent.click(controls()[0]!, { detail: 0 });
      expect(activate).toHaveBeenCalledTimes(1);
      expect(activate.mock.calls[0]![0].inputMethod).toBe('pointer');
    },
  );
  it.each([0, 1])('standalone click detail %s is keyboard input', (detail) => {
    const activate = vi.fn();
    render(chart({ onDataActivate: activate }));
    fireEvent.click(controls()[0]!, { detail });
    expect(activate.mock.calls[0]![0].inputMethod).toBe('keyboard');
  });
  it('touch release deduplicates immediate compatibility click and keeps later gestures', () => {
    pointers();
    const activate = vi.fn();
    render(chart({ onDataActivate: activate }));
    fireEvent.pointerDown(controls()[0]!, { pointerType: 'touch' });
    fireEvent.pointerUp(controls()[0]!, { pointerType: 'touch' });
    fireEvent.click(controls()[0]!, { detail: 1 });
    expect(activate).toHaveBeenCalledTimes(1);
    expect(activate.mock.calls[0]![0].inputMethod).toBe('touch');
    fireEvent.pointerDown(controls()[1]!, { pointerType: 'pen' });
    fireEvent.pointerUp(controls()[1]!, { pointerType: 'pen' });
    fireEvent.click(controls()[1]!, { detail: 1 });
    expect(activate).toHaveBeenCalledTimes(2);
    expect(activate.mock.calls[1]![0].record).toBe(data[3]);
  });
  it('delayed native touch click is deduplicated by pointer ID after task expiry', () => {
    pointers();
    vi.useFakeTimers();
    const activate = vi.fn();
    render(chart({ onDataActivate: activate }));
    fireEvent.pointerDown(controls()[0]!, {
      pointerType: 'touch',
      pointerId: 9,
    });
    fireEvent.pointerUp(controls()[0]!, { pointerType: 'touch', pointerId: 9 });
    act(() => vi.runAllTimers());
    fireEvent(
      controls()[0]!,
      new PointerEvent('click', {
        bubbles: true,
        pointerType: 'touch',
        pointerId: 9,
        detail: 1,
      }),
    );
    expect(activate).toHaveBeenCalledTimes(1);
    fireEvent.click(controls()[0]!, { detail: 0 });
    expect(activate).toHaveBeenCalledTimes(2);
    expect(activate.mock.calls[1]![0].inputMethod).toBe('keyboard');
  });
  it('pointer cancellation never activates, subsequent accessibility click does', () => {
    pointers();
    const activate = vi.fn();
    render(chart({ onDataActivate: activate }));
    fireEvent.pointerDown(controls()[0]!, { pointerType: 'touch' });
    fireEvent.pointerCancel(controls()[0]!, { pointerType: 'touch' });
    fireEvent.pointerUp(controls()[0]!, { pointerType: 'touch' });
    expect(activate).not.toHaveBeenCalled();
    fireEvent.click(controls()[0]!);
    expect(activate.mock.calls[0]![0].inputMethod).toBe('keyboard');
  });
  it('parent rerender during touch release does not activate twice', () => {
    pointers();
    const activate = vi.fn();
    const { rerender } = render(chart({ onDataActivate: activate }));
    fireEvent.pointerDown(controls()[0]!, { pointerType: 'touch' });
    rerender(chart({ onDataActivate: activate }));
    fireEvent.pointerUp(controls()[0]!, { pointerType: 'touch' });
    rerender(chart({ onDataActivate: activate }));
    fireEvent.click(controls()[0]!, { detail: 1 });
    expect(activate).toHaveBeenCalledTimes(1);
  });
  it('replacement during gesture cannot release a stale record', () => {
    pointers();
    const activate = vi.fn();
    const { rerender } = render(chart({ onDataActivate: activate }));
    fireEvent.pointerDown(controls()[0]!, { pointerType: 'touch' });
    rerender(
      chart({ data: [{ name: 'New', value: 2 }], onDataActivate: activate }),
    );
    fireEvent.pointerUp(controls()[0]!, { pointerType: 'touch' });
    expect(activate).not.toHaveBeenCalled();
  });
  it('identical parent render preserves inspection; source replacement clears stale tooltip', () => {
    const { rerender } = render(chart());
    fireEvent.pointerEnter(controls()[1]!);
    expect(screen.getByRole('tooltip')).toHaveTextContent('75.0%');
    rerender(chart());
    expect(screen.getByRole('tooltip')).toHaveTextContent('75.0%');
    rerender(chart({ data: [{ name: 'Replacement', value: 4 }] }));
    expect(screen.queryByRole('tooltip')).toBeNull();
    fireEvent.click(controls()[0]!);
    expect(screen.getByRole('tooltip')).toHaveTextContent('Replacement');
  });
  it.each(['reorder', 'value', 'empty', 'negative'] as const)(
    'focused source %s transitions safely',
    (mode) => {
      const activate = vi.fn();
      const { rerender } = render(chart({ onDataActivate: activate }));
      act(() => controls()[1]!.focus());
      const rows =
        mode === 'reorder'
          ? [data[3]!, data[0]!]
          : mode === 'value'
            ? [{ name: 'Changed', value: 6 }]
            : mode === 'empty'
              ? []
              : [{ name: 'Negative', value: -1 }];
      rerender(chart({ data: rows, onDataActivate: activate }));
      expect(activate).not.toHaveBeenCalled();
      if (mode === 'empty' || mode === 'negative')
        expect(screen.queryByRole('tooltip')).toBeNull();
      else {
        expect(controls()[0]).toHaveFocus();
        fireEvent.keyDown(controls()[0]!, { key: 'Enter' });
        expect(activate.mock.calls[0]![0].record).toBe(rows[0]);
      }
    },
  );
  it('responsive resize retains record inspection and the existing table', () => {
    installResizeObserver();
    const { container } = render(chart({ width: '100%' }));
    const table = screen.getByRole('table');
    expect(screen.getByRole('img')).toHaveTextContent(
      'awaiting chart measurement',
    );
    act(() => latestObserver().emit(480));
    act(() => controls()[1]!.focus());
    act(() => latestObserver().emit(320));
    expect(controls()[1]).toHaveFocus();
    expect(screen.getByRole('tooltip')).toHaveTextContent('75.0%');
    expect(container.querySelector('svg')).toHaveAttribute('width', '320');
    expect(screen.getByRole('table')).toBe(table);
  });
  it('independent observer instances never share measurements and disconnect', () => {
    installResizeObserver();
    const { unmount } = render(
      <>
        {chart({ width: '100%' })}
        {chart({ width: '50%' })}
      </>,
    );
    act(() => TestResizeObserver.instances[0]!.emit(320));
    expect(screen.getAllByRole('group')).toHaveLength(1);
    act(() => TestResizeObserver.instances[1]!.emit(480));
    expect(
      screen.getAllByRole('group').map((el) => el.getAttribute('width')),
    ).toEqual(['320', '480']);
    unmount();
    TestResizeObserver.instances.forEach((o) =>
      expect(o.disconnect).toHaveBeenCalled(),
    );
  });
  it('no observer leaves accessible pending content and full source table', () => {
    vi.stubGlobal('ResizeObserver', undefined);
    render(chart({ width: '100%' }));
    expect(screen.getByRole('img')).toHaveTextContent('awaiting');
    expect(screen.getAllByRole('row')).toHaveLength(5);
  });
  it.each([false, true])(
    'animation opt-in %s affects only decorative opacity and cleans up',
    (animate) => {
      const cancel = vi.fn();
      const animation = vi.fn(() => ({ cancel }));
      Object.defineProperty(SVGElement.prototype, 'animate', {
        configurable: true,
        value: animation,
      });
      const media = {
        matches: false,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      };
      vi.stubGlobal('matchMedia', () => media);
      const { unmount } = render(chart({ animate }));
      expect(animation).toHaveBeenCalledTimes(animate ? 1 : 0);
      if (animate) {
        expect(animation).toHaveBeenCalledWith(
          [{ opacity: 0.65 }, { opacity: 1 }],
          { duration: 180, easing: 'ease-out' },
        );
        media.matches = true;
        media.addEventListener.mock.calls[0]![1]();
        expect(cancel).toHaveBeenCalledTimes(1);
      }
      unmount();
      if (animate) {
        expect(cancel).toHaveBeenCalledTimes(2);
        expect(media.removeEventListener).toHaveBeenCalled();
      }
    },
  );
  it('reduced motion suppresses animation', () => {
    const animation = vi.fn();
    Object.defineProperty(SVGElement.prototype, 'animate', {
      configurable: true,
      value: animation,
    });
    vi.stubGlobal('matchMedia', () => ({ matches: true }));
    render(chart({ animate: true }));
    expect(animation).not.toHaveBeenCalled();
    expect(screen.getByRole('group')).toBeVisible();
  });
});

it('fractional tooltip precision leaves the engine percentage untouched', () => {
  const renderer = vi.fn<
    (context: SegmentTooltipContext<{ name: string; value: number }>) => null
  >(() => null);
  const rows = [
    { name: 'One', value: 1 },
    { name: 'Five', value: 5 },
  ];
  const geometry = buildPolarGeometry({
    normalized: normalizeSegments({
      data: rows,
      nameKey: 'name',
      valueKey: 'value',
    }),
    family: 'donut',
    width: 400,
    height: 280,
  });
  if (geometry.status !== 'ready') throw Error('Expected ready');
  const { rerender } = render(
    <DonutChart width={400} data={rows} nameKey="name" valueKey="value" />,
  );
  fireEvent.focus(controls()[0]!);
  expect(screen.getByRole('tooltip')).toHaveTextContent('16.7%');
  rerender(
    <DonutChart
      width={400}
      data={rows}
      nameKey="name"
      valueKey="value"
      tooltip={renderer}
    />,
  );
  expect(renderer.mock.calls.at(-1)![0].segment.percentage).toBe(
    geometry.slices[0]!.percentage,
  );
  expect(renderer.mock.calls.at(-1)![0].segment.percentage).not.toBe(16.7);
});
it('cross-realm Date inspection preserves the original label and record references', () => {
  const iframe = document.createElement('iframe');
  document.body.append(iframe);
  const ForeignDate = (
    iframe.contentWindow as unknown as { Date: DateConstructor }
  ).Date;
  const name = new ForeignDate('2026-01-01');
  const rows = [{ name, value: 2 }];
  const activate = vi.fn();
  render(
    <DonutChart
      width={400}
      data={rows}
      nameKey="name"
      valueKey="value"
      onDataActivate={activate}
    />,
  );
  fireEvent.click(controls()[0]!);
  expect(screen.getByRole('tooltip')).toHaveTextContent(
    '2026-01-01T00:00:00.000Z',
  );
  expect(activate.mock.calls[0]![0].label).toBe(name);
  expect(activate.mock.calls[0]![0].record).toBe(rows[0]);
  iframe.remove();
});
it('empty to ready to unavailable preserves its full table and creates only valid controls', () => {
  const { rerender } = render(chart({ data: [] }));
  const table = screen.getByRole('table');
  rerender(chart());
  expect(controls()).toHaveLength(2);
  expect(screen.getByRole('table')).toBe(table);
  rerender(chart({ data: [{ name: 'Negative', value: -1 }] }));
  expect(screen.queryByRole('button')).toBeNull();
  expect(screen.getByRole('table')).toBe(table);
  expect(screen.getByRole('cell')).toHaveTextContent('-1');
});
it('pointer-focused sectors expose both the target and frame focus treatment', () => {
  pointers();
  render(chart());
  fireEvent.pointerDown(controls()[0]!, { pointerType: 'mouse' });
  act(() => controls()[0]!.focus());
  expect(controls()[0]).toHaveAttribute(
    'stroke',
    'var(--rsc-focus-color, #075985)',
  );
  expect(screen.getByRole('group').style.outline).toContain(
    'var(--rsc-focus-color',
  );
});
it('opacity animation cancels on geometry replacement and unmount', () => {
  const cancel = vi.fn();
  const animate = vi.fn(() => ({ cancel }));
  Object.defineProperty(SVGElement.prototype, 'animate', {
    configurable: true,
    value: animate,
  });
  vi.stubGlobal('matchMedia', () => ({
    matches: false,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  }));
  const { rerender, unmount } = render(chart({ animate: true }));
  rerender(chart({ animate: true, height: 320 }));
  expect(cancel).toHaveBeenCalledTimes(1);
  expect(animate).toHaveBeenCalledTimes(2);
  unmount();
  expect(cancel).toHaveBeenCalledTimes(2);
});

it('hover inspection keeps the roving Tab entry on the focused segment', () => {
  pointers();
  render(chart());
  act(() => controls()[0]!.focus());
  fireEvent.pointerEnter(controls()[1]!, { pointerType: 'mouse' });
  expect(controls()[0]).toHaveFocus();
  expect(controls()[0]).toHaveAttribute('tabindex', '0');
  expect(controls()[1]).toHaveAttribute('tabindex', '-1');
  expect(screen.getByRole('tooltip')).toHaveTextContent('75.0%');
});
