import { act, fireEvent, render, within } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { StrictMode } from 'react';
import { LineChart, AreaChart, BarChart, PieChart, DonutChart } from '../src';
import type { CartesianTooltipContext, SegmentTooltipContext } from '../src';
import {
  FiveChartCollection,
  fiveFamilies,
  fiveCartesian,
  fivePolar,
} from '../playground/FiveCharts';
import type { FiveCollectionProps, FiveFamily } from '../playground/FiveCharts';
import { installResizeObserver, TestResizeObserver } from './resize-observer';
const page = (props: FiveCollectionProps = {}) => (
  <FiveChartCollection explicit {...props} />
);
function controls(host: Element) {
  return [
    ...host.querySelectorAll<SVGElement>(
      '[data-layer=inspection] [role=button]',
    ),
  ];
}
function family(host: Element, name: FiveFamily) {
  return host.querySelector(`[data-five=${name}]`)!;
}
function pointers() {
  class Pointer extends MouseEvent {
    pointerType: string;
    pointerId: number;
    constructor(type: string, init: PointerEventInit) {
      super(type, init);
      this.pointerType = init.pointerType ?? 'mouse';
      this.pointerId = init.pointerId ?? 7;
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
it('renders five independent named groups, complete source tables, unique references and immutable sources', () => {
  const source = JSON.stringify([fiveCartesian, fivePolar]);
  const { container } = render(page());
  expect(container.querySelectorAll('svg')).toHaveLength(5);
  const ids = [...container.querySelectorAll('[id]')].map((n) => n.id);
  expect(new Set(ids).size).toBe(ids.length);
  for (const name of fiveFamilies) {
    const host = family(container, name);
    expect(
      within(host as HTMLElement).getByRole('group', { name: `Five ${name}` }),
    ).toHaveAccessibleDescription(`Independent ${name} observations`);
    expect(host.querySelectorAll('table tbody tr')).toHaveLength(
      name === 'pie' || name === 'donut' ? 3 : 4,
    );
    expect(controls(host).filter((el) => el.tabIndex === 0)).toHaveLength(1);
    expect(
      host.querySelector(
        '[data-layer=marks] [aria-hidden=true], [data-layer=marks][aria-hidden=true]',
      ),
    ).not.toBeNull();
  }
  expect(JSON.stringify([fiveCartesian, fivePolar])).toBe(source);
});
it.each(fiveFamilies)(
  '%s hover cannot move a focused roving entry or erase its focus stroke',
  (name) => {
    pointers();
    const activate = vi.fn();
    const { container, rerender } = render(page({ onActivate: activate }));
    const host = family(container, name),
      targets = controls(host);
    act(() => targets[0]!.focus());
    fireEvent.pointerEnter(targets[1]!, { pointerType: 'mouse' });
    expect(targets[0]).toHaveFocus();
    expect(targets[0]).toHaveAttribute('tabindex', '0');
    expect(targets[1]).toHaveAttribute('tabindex', '-1');
    expect(targets[0]).not.toHaveAttribute('stroke', 'transparent');
    expect(activate).not.toHaveBeenCalled();
    rerender(page({ onActivate: activate }));
    expect(targets[0]).toHaveFocus();
    expect(targets[0]).toHaveAttribute('tabindex', '0');
  },
);
it('focus and tooltip relationships move between charts without activating or leaking sibling selection', () => {
  const activate = vi.fn();
  const { container } = render(page({ onActivate: activate }));
  for (const name of fiveFamilies) {
    const host = family(container, name);
    act(() => controls(host)[0]!.focus());
    expect(container.querySelectorAll('[role=tooltip]')).toHaveLength(1);
    const tooltip = host.querySelector('[role=tooltip]')!;
    expect(controls(host)[0]).toHaveAttribute('aria-describedby', tooltip.id);
    fireEvent.keyDown(controls(host)[0]!, { key: 'Escape' });
    expect(host.querySelector('[role=tooltip]')).toBeNull();
  }
  expect(activate).not.toHaveBeenCalled();
});
it.each(fiveFamilies)(
  '%s navigates clamped keys and activates the original source exactly once',
  (name) => {
    const activate = vi.fn();
    const { container } = render(page({ onActivate: activate }));
    const host = family(container, name),
      targets = controls(host);
    act(() => targets[0]!.focus());
    for (const key of ['ArrowLeft', 'ArrowUp', 'Home']) {
      fireEvent.keyDown(targets[0]!, { key });
      expect(targets[0]).toHaveFocus();
    }
    for (const key of ['ArrowRight', 'ArrowDown']) {
      fireEvent.keyDown(document.activeElement!, { key });
    }
    fireEvent.keyDown(document.activeElement!, { key: 'End' });
    expect(targets.at(-1)).toHaveFocus();
    fireEvent.keyDown(targets.at(-1)!, { key: 'ArrowRight' });
    expect(targets.at(-1)).toHaveFocus();
    for (const key of ['Enter', ' ']) {
      fireEvent.keyDown(targets.at(-1)!, { key });
      fireEvent.keyDown(targets.at(-1)!, { key, repeat: true });
      fireEvent.keyUp(targets.at(-1)!, { key });
      fireEvent.click(targets.at(-1)!, { detail: 0 });
    }
    expect(activate).toHaveBeenCalledTimes(2);
    const last =
      name === 'pie' || name === 'donut' ? fivePolar[2] : fiveCartesian[3];
    for (const [f, payload] of activate.mock.calls) {
      expect(f).toBe(name);
      expect(payload.record).toBe(last);
      expect(payload.inputMethod).toBe('keyboard');
    }
  },
);
it.each(fiveFamilies)(
  '%s scopes mouse, pen, touch and standalone click evidence independently',
  (name) => {
    pointers();
    vi.useFakeTimers();
    const activate = vi.fn();
    const { container, unmount } = render(page({ onActivate: activate }));
    const host = family(container, name),
      target = controls(host)[0]!;
    for (const pointerType of ['mouse', 'pen']) {
      fireEvent.pointerDown(target, { pointerType });
      fireEvent.pointerUp(target, { pointerType });
      fireEvent.click(target, { detail: 1 });
    }
    fireEvent.pointerDown(target, { pointerType: 'touch', pointerId: 9 });
    fireEvent.pointerUp(target, { pointerType: 'touch', pointerId: 9 });
    act(() => vi.runOnlyPendingTimers());
    target.dispatchEvent(
      new PointerEvent('click', {
        bubbles: true,
        pointerType: 'touch',
        pointerId: 9,
        detail: 1,
      }),
    );
    fireEvent.click(target, { detail: 0 });
    expect(activate.mock.calls.map(([f, p]) => [f, p.inputMethod])).toEqual([
      [name, 'pointer'],
      [name, 'pointer'],
      [name, 'touch'],
      [name, 'keyboard'],
    ]);
    fireEvent.pointerDown(target, { pointerType: 'touch' });
    fireEvent.pointerCancel(target, { pointerType: 'touch' });
    fireEvent.pointerUp(target, { pointerType: 'touch' });
    expect(activate).toHaveBeenCalledTimes(4);
    const neighbor = controls(
      family(container, fiveFamilies[(fiveFamilies.indexOf(name) + 1) % 5]!),
    )[0]!;
    fireEvent.click(neighbor, { detail: 0 });
    expect(activate).toHaveBeenCalledTimes(5);
    expect(activate.mock.calls[4]![0]).not.toBe(name);
    fireEvent.pointerDown(target, { pointerType: 'touch' });
    unmount();
    act(() => vi.runOnlyPendingTimers());
    expect(activate).toHaveBeenCalledTimes(5);
  },
);
it.each(fiveFamilies)(
  '%s replacement restores its focused source without changing other chart tables',
  (name) => {
    const activate = vi.fn();
    const { container, rerender } = render(page({ onActivate: activate }));
    const host = family(container, name);
    const others = fiveFamilies
      .filter((f) => f !== name)
      .map((f) => family(container, f).querySelector('table')!.textContent);
    act(() => controls(host).at(-1)!.focus());
    rerender(page({ states: { [name]: 'replacement' }, onActivate: activate }));
    const tooltip = host.querySelector('[role=tooltip]');
    if (tooltip) expect(tooltip).toHaveTextContent('Replacement');
    const focused = controls(host).find(
      (target) => target === document.activeElement,
    );
    expect(focused).toBeDefined();
    fireEvent.keyDown(focused!, { key: 'Enter' });
    expect(activate.mock.calls[0]![1].record.name).toMatch(/^Replacement /);
    expect(
      fiveFamilies
        .filter((f) => f !== name)
        .map((f) => family(container, f).querySelector('table')!.textContent),
    ).toEqual(others);
  },
);
it.each(['empty', 'unusable'] as const)(
  'all five %s states preserve source alternatives and remove stale controls',
  (state) => {
    const { container, rerender } = render(page());
    act(() => controls(family(container, 'donut'))[0]!.focus());
    rerender(
      page({ states: Object.fromEntries(fiveFamilies.map((f) => [f, state])) }),
    );
    expect(container.querySelector('svg')).toBeNull();
    expect(container.querySelectorAll('table')).toHaveLength(5);
    expect(container.querySelector('[role=tooltip]')).toBeNull();
    expect(container.querySelector('[data-donut-center]')).toBeNull();
    for (const name of fiveFamilies)
      expect(
        within(family(container, name) as HTMLElement).getByRole('img'),
      ).toHaveTextContent(
        state === 'empty' || !['pie', 'donut'].includes(name)
          ? 'No chart data'
          : 'unavailable',
      );
    rerender(page());
    expect(container.querySelectorAll('svg')).toHaveLength(5);
  },
);
it('measures all five observers independently and ignores late Strict Mode callbacks after unmount', () => {
  installResizeObserver();
  const { container, unmount } = render(
    <StrictMode>
      <FiveChartCollection />
    </StrictMode>,
  );
  expect(container.querySelector('svg')).toBeNull();
  expect(container.querySelectorAll('table')).toHaveLength(5);
  const live = TestResizeObserver.instances.filter(
    (o) => !o.disconnect.mock.calls.length,
  );
  expect(live).toHaveLength(5);
  for (const [i, o] of live.entries()) {
    act(() => o.emit(320 + i * 20));
    expect(
      family(container, fiveFamilies[i]!).querySelector('svg'),
    ).toHaveAttribute('width', String(320 + i * 20));
  }
  act(() => live[2]!.emit(200));
  expect(family(container, 'bar').querySelector('svg')).toHaveAttribute(
    'width',
    '200',
  );
  expect(family(container, 'line').querySelector('svg')).toHaveAttribute(
    'width',
    '320',
  );
  unmount();
  for (const o of TestResizeObserver.instances) {
    expect(o.disconnect).toHaveBeenCalled();
    act(() => o.emit(800));
  }
  expect(container.innerHTML).toBe('');
});
it('center button creates a genuine extra Tab stop and no segment activation', () => {
  const activate = vi.fn();
  const { container } = render(page({ onActivate: activate }));
  const center = within(family(container, 'donut') as HTMLElement).getByRole(
    'button',
    { name: 'Allocation details' },
  );
  fireEvent.click(center);
  expect(center).toHaveTextContent('Viewed');
  expect(activate).not.toHaveBeenCalled();
  act(() => center.focus());
  expect(center).toHaveFocus();
  expect(center.closest('[aria-hidden=true]')).toBeNull();
  expect(container.querySelectorAll('[tabindex="0"]')).toHaveLength(5);
});
it('keeps animation cancellation scoped to its own sibling and honors reduced motion at mount', () => {
  const animations: { cancel: ReturnType<typeof vi.fn> }[] = [],
    queries: { matches: boolean; listener: (() => void) | undefined }[] = [];
  Object.defineProperty(SVGElement.prototype, 'animate', {
    configurable: true,
    value: vi.fn(() => {
      const a = { cancel: vi.fn() };
      animations.push(a);
      return a;
    }),
  });
  vi.stubGlobal('matchMedia', () => {
    const q = {
      matches: false,
      addEventListener: (_name: string, listener: () => void) => {
        q.listener = listener;
      },
      removeEventListener: vi.fn(),
      listener: undefined as (() => void) | undefined,
    };
    queries.push(q);
    return q;
  });
  const { unmount } = render(page({ animate: true }));
  expect(animations).toHaveLength(5);
  queries[2]!.matches = true;
  queries[2]!.listener!();
  expect(animations.map((a) => a.cancel.mock.calls.length)).toEqual([
    0, 0, 1, 0, 0,
  ]);
  unmount();
  expect(animations.map((a) => a.cancel.mock.calls.length)).toEqual([
    1, 1, 2, 1, 1,
  ]);
  vi.stubGlobal('matchMedia', () => ({ matches: true }));
  render(page({ animate: true }));
  expect(animations).toHaveLength(5);
});
it('contains long Cartesian legends just like polar legends while preserving full text', () => {
  const { container } = render(page({ longText: true }));
  for (const name of ['line', 'area', 'bar'] as const) {
    const host = family(container, name);
    const items = host.querySelectorAll<HTMLElement>('li');
    expect(items).toHaveLength(2);
    for (const item of items) {
      expect(item.style.overflowWrap).toBe('anywhere');
      expect(item.style.maxWidth).toBe('100%');
    }
    expect(host.querySelector('ul')).toHaveTextContent(
      'NorthAmericaEnterpriseSubscriptionsActual',
    );
  }
});
it.each(['line', 'area', 'bar'] as const)(
  '%s bounds tooltips to the rendered figure instead of its fixed SVG width',
  (name) => {
    const { container } = render(page());
    const host = family(container, name);
    act(() => controls(host).at(-1)!.focus());
    const tooltip = host.querySelector<HTMLElement>('[role=tooltip]')!;
    expect(tooltip.style.left).toMatch(/^clamp\(0px,/);
    expect(tooltip.style.left).toContain('100% - 220px');
    expect(tooltip.style.maxWidth).toBe('calc(100% - 20px)');
  },
);

it('keeps custom tooltip source, defaults and colors consistent across five siblings', () => {
  const records = Object.freeze([
    Object.freeze({ name: 'Duplicate', value: 1 }),
    Object.freeze({ name: 'Duplicate', value: 2 }),
  ]);
  type Row = (typeof records)[number];
  const renderers = fiveFamilies.map(() =>
    vi.fn<
      (c: CartesianTooltipContext<Row> | SegmentTooltipContext<Row>) => string
    >(() => 'Custom inspection'),
  );
  const { container } = render(
    <>
      {[LineChart, AreaChart, BarChart].map((Chart, i) => (
        <div key={i}>
          <Chart
            width={320}
            data={records}
            xKey="name"
            yKey="value"
            colors={['#123456']}
            tooltip={renderers[i]!}
          />
        </div>
      ))}
      {[PieChart, DonutChart].map((Chart, i) => (
        <div key={i + 3}>
          <Chart
            width={320}
            data={records}
            nameKey="name"
            valueKey="value"
            colors={['#123456']}
            tooltip={renderers[i + 3]!}
          />
        </div>
      ))}
    </>,
  );
  [...container.querySelectorAll('figure')].forEach((figure, i) => {
    act(() => controls(figure).at(-1)!.focus());
    const context = renderers[i]!.mock.calls.at(-1)![0];
    const datum =
      'segment' in context
        ? context.segment
        : context.mode === 'shared'
          ? context.items[0]!
          : context.item;
    expect(datum.record).toBe(records[1]);
    expect(datum.index).toBe(1);
    expect(datum.color).toBe('#123456');
    if ('segment' in context)
      expect(context.segment.percentage).toBeCloseTo(200 / 3, 10);
    else expect(context.mode).toBe(i === 2 ? 'item' : 'shared');
    expect(
      figure.querySelector(
        '[data-layer=marks] [stroke="#123456"], [data-layer=marks] [fill="#123456"]',
      ),
    ).not.toBeNull();
    const swatches = [...figure.querySelectorAll<HTMLElement>('li span')];
    expect(swatches).toHaveLength(i < 3 ? 0 : 2);
    for (const swatch of swatches)
      expect(swatch.style.backgroundColor || swatch.style.background).toMatch(
        /rgb\(18, 52, 86\)|#123456/,
      );
    expect(within(figure).getByRole('tooltip')).toHaveTextContent(
      'Custom inspection',
    );
    fireEvent.keyDown(controls(figure).at(-1)!, { key: 'Escape' });
  });
});
it.each(fiveFamilies)(
  '%s replacement during a touch gesture cannot activate stale source data',
  (name) => {
    pointers();
    const activate = vi.fn();
    const { container, rerender } = render(page({ onActivate: activate }));
    const original = controls(family(container, name))[0]!;
    fireEvent.pointerDown(original, { pointerType: 'touch', pointerId: 33 });
    rerender(page({ onActivate: activate, states: { [name]: 'replacement' } }));
    const current = controls(family(container, name))[0]!;
    fireEvent.pointerUp(current, { pointerType: 'touch', pointerId: 33 });
    expect(activate).not.toHaveBeenCalled();
    fireEvent.click(current, { detail: 0 });
    expect(activate).toHaveBeenCalledTimes(1);
    expect(activate.mock.calls[0]![1].record.name).toMatch(/^Replacement /);
    expect(activate.mock.calls[0]![1].inputMethod).toBe('keyboard');
  },
);
