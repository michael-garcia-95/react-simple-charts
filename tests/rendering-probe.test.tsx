import { StrictMode } from 'react';
import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { RenderingProbe } from '../src/internal/RenderingProbe';
import { useContainerWidth } from '../src/internal/use-container-width';
import {
  installResizeObserver,
  latestObserver,
  TestResizeObserver,
} from './resize-observer';

beforeEach(installResizeObserver);
afterEach(() => vi.unstubAllGlobals());

describe('responsive measurement lifecycle', () => {
  it('observes its container, changes valid widths, and retains data at invalid widths', () => {
    const { container } = render(<RenderingProbe />);
    const observer = latestObserver();
    expect(observer.observe).toHaveBeenCalledTimes(1);
    expect(observer.target).toBe(container.querySelector('figure > div'));
    expect(container.querySelector('svg')).toBeNull();
    act(() => observer.emit(400));
    expect(container.querySelector('svg')).toHaveAttribute(
      'viewBox',
      '0 0 400 280',
    );
    act(() => observer.emit(500));
    expect(container.querySelector('svg')).toHaveAttribute(
      'viewBox',
      '0 0 500 280',
    );
    for (const invalid of [0, -1, NaN, Infinity]) {
      act(() => observer.emit(invalid));
      expect(container.querySelector('svg')).toBeNull();
      expect(screen.getByRole('table')).toHaveTextContent('Q432');
    }
    act(() => observer.emit(200));
    expect(container.querySelector('svg')).toHaveAttribute(
      'viewBox',
      '0 0 200 280',
    );
    act(() => observer.emit(900, document.createElement('div')));
    expect(container.querySelector('svg')).toHaveAttribute('width', '200');
  });

  it('does not render again for settled duplicate widths', () => {
    const rendered = vi.fn();
    function WidthHarness() {
      const { ref, width } = useContainerWidth();
      rendered(width);
      return <div ref={ref}>{width}</div>;
    }
    render(<WidthHarness />);
    act(() => latestObserver().emit(400));
    // React may evaluate one pending equal-state update before bailing out.
    act(() => latestObserver().emit(400));
    rendered.mockClear();
    act(() => {
      latestObserver().emit(400);
      latestObserver().emit(400);
    });
    expect(rendered).not.toHaveBeenCalled();
  });

  it('disconnects on unmount and ignores queued callbacks', () => {
    const { unmount, container } = render(<RenderingProbe />);
    const observer = latestObserver();
    unmount();
    expect(observer.disconnect).toHaveBeenCalledTimes(1);
    act(() => observer.emit(400));
    expect(container).toBeEmptyDOMElement();
  });

  it('drops graphical focus state when a zero width removes the SVG', () => {
    render(<RenderingProbe />);
    act(() => latestObserver().emit(400));
    fireEvent.focus(screen.getByRole('img'));
    expect(screen.getByRole('img')).toHaveStyle({
      outline: '3px solid var(--rsc-focus-color, #075985)',
    });
    act(() => latestObserver().emit(0));
    act(() => latestObserver().emit(400));
    expect(screen.getByRole('img').style.outline).toBe('');
  });

  it('survives Strict Mode effect replay and ignores retired observer callbacks', () => {
    const { container, unmount } = render(
      <StrictMode>
        <RenderingProbe />
      </StrictMode>,
    );
    expect(TestResizeObserver.instances).toHaveLength(2);
    const retired = TestResizeObserver.instances[0]!;
    const current = latestObserver();
    expect(retired.disconnect).toHaveBeenCalledTimes(1);
    expect(current.target).toBe(retired.target);
    act(() => retired.emit(300));
    expect(container.querySelector('svg')).toBeNull();
    act(() => current.emit(450));
    expect(container.querySelector('svg')).toHaveAttribute('width', '450');
    unmount();
    expect(current.disconnect).toHaveBeenCalledTimes(1);
  });

  it('maintains independent instances and unique referenced IDs', () => {
    const { container } = render(
      <>
        <RenderingProbe accessibility={{ label: 'First' }} />
        <RenderingProbe
          accessibility={{ label: 'Second', description: 'Second details' }}
        />
      </>,
    );
    const [first, second] = TestResizeObserver.instances;
    expect(first!.target).not.toBe(second!.target);
    act(() => first!.emit(300));
    expect(
      within(container.querySelectorAll('figure')[0]!).getByRole('img'),
    ).toHaveAttribute('width', '300');
    expect(screen.getByRole('img', { name: /Second/ }).tagName).toBe('DIV');
    act(() => second!.emit(600));
    expect(screen.getByRole('img', { name: 'Second' })).toHaveAttribute(
      'width',
      '600',
    );
    const ids = [...container.querySelectorAll('[id]')].map(
      (element) => element.id,
    );
    expect(new Set(ids).size).toBe(ids.length);
    for (const img of screen.getAllByRole('img')) {
      expect(
        document.getElementById(img.getAttribute('aria-labelledby')!),
      ).toHaveTextContent(/First|Second/);
    }
  });

  it('resets measurement and cleans up when switching dimension modes', () => {
    const { container, rerender } = render(<RenderingProbe />);
    const first = latestObserver();
    act(() => first.emit(300));
    rerender(<RenderingProbe width={640} height={320} />);
    expect(first.disconnect).toHaveBeenCalledTimes(1);
    expect(container.querySelector('svg')).toHaveAttribute(
      'viewBox',
      '0 0 640 320',
    );
    rerender(<RenderingProbe height={240} />);
    expect(container.querySelector('svg')).toBeNull();
    const second = latestObserver();
    expect(second).not.toBe(first);
    act(() => first.emit(900));
    expect(container.querySelector('svg')).toBeNull();
    act(() => second.emit(400));
    expect(container.querySelector('svg')).toHaveAttribute(
      'viewBox',
      '0 0 400 240',
    );
    rerender(<RenderingProbe height={350} />);
    expect(latestObserver()).toBe(second);
    expect(container.querySelector('svg')).toHaveAttribute('height', '350');
  });

  it('keeps an accessible fallback when ResizeObserver is unavailable', () => {
    vi.stubGlobal('ResizeObserver', undefined);
    const { container } = render(
      <RenderingProbe
        accessibility={{
          label: 'Fallback',
          description: 'All values are available',
          dataTable: 'visible',
        }}
      />,
    );
    expect(
      screen.getByRole('img', { name: /Fallback/ }),
    ).toHaveAccessibleDescription('All values are available');
    expect(
      screen.getByRole('table', { name: 'Fallback — data' }),
    ).toBeVisible();
    expect(container.querySelector('svg')).toBeNull();
    expect(TestResizeObserver.instances).toHaveLength(0);
  });
});

describe('accessibility and self-contained styles', () => {
  it('names and describes the SVG with a structured, visually hidden table', () => {
    render(
      <RenderingProbe
        width={640}
        accessibility={{
          label: 'Quarterly revenue',
          description: 'Q4 has the highest value',
        }}
      />,
    );
    const graphic = screen.getByRole('img', { name: 'Quarterly revenue' });
    expect(graphic).toHaveAccessibleDescription('Q4 has the highest value');
    const table = screen.getByRole('table', {
      name: 'Quarterly revenue — data',
    });
    expect(table).toHaveStyle({
      position: 'absolute',
      width: '1px',
      height: '1px',
      clipPath: 'inset(50%)',
    });
    expect(table).not.toHaveAttribute('aria-hidden');
    expect(table).not.toHaveStyle({ display: 'none' });
    expect(within(table).getAllByRole('row')).toHaveLength(5);
    expect(within(table).getAllByRole('columnheader')).toHaveLength(2);
    expect(within(table).getAllByRole('rowheader')).toHaveLength(4);
    expect(graphic.querySelectorAll('text')).toHaveLength(8);
  });

  it('supports visible data and a sensible default accessible name', () => {
    render(
      <RenderingProbe
        width={640}
        accessibility={{ label: '  ', dataTable: 'visible' }}
      />,
    );
    expect(
      screen.getByRole('img', { name: 'Quarterly sample values' }),
    ).toBeVisible();
    expect(screen.getByRole('table')).not.toHaveStyle({ position: 'absolute' });
    expect(screen.getByRole('table')).toHaveStyle({
      width: '100%',
      textAlign: 'left',
    });
  });

  it('provides focus indication and CSS variable fallbacks without external styles', () => {
    const originalStyles = document.head.querySelectorAll(
      'style, link[rel="stylesheet"]',
    ).length;
    const { container } = render(
      <RenderingProbe
        width={640}
        style={{
          '--rsc-series-color': '#086b62',
          '--rsc-focus-color': '#9d174d',
        }}
      />,
    );
    const graphic = screen.getByRole('img');
    expect(graphic).toHaveAttribute('tabindex', '0');
    fireEvent.focus(graphic);
    expect(graphic).toHaveStyle({
      outline: '3px solid var(--rsc-focus-color, #075985)',
      outlineOffset: '3px',
    });
    fireEvent.blur(graphic);
    expect(graphic.style.outline).toBe('');
    expect(
      container
        .querySelector('figure')!
        .style.getPropertyValue('--rsc-series-color'),
    ).toBe('#086b62');
    expect(container.querySelector('polyline')).toHaveAttribute(
      'stroke',
      'var(--rsc-series-color, #2563eb)',
    );
    expect(container.querySelector('style, link')).toBeNull();
    expect(
      document.head.querySelectorAll('style, link[rel="stylesheet"]'),
    ).toHaveLength(originalStyles);
    expect(container.querySelector('svg')!.style.display).toBe('block');
  });

  it('gives an explicit setting precedence over a custom property', () => {
    const { container } = render(
      <RenderingProbe
        width={640}
        color="#a21caf"
        style={{ '--rsc-series-color': '#086b62' }}
      />,
    );
    expect(container.querySelector('polyline')).toHaveAttribute(
      'stroke',
      '#a21caf',
    );
    expect(container.querySelector('circle')).toHaveAttribute(
      'fill',
      '#a21caf',
    );
  });
});
