import { StrictMode } from 'react';
import { act } from '@testing-library/react';
import { renderToString } from 'react-dom/server';
import { hydrateRoot } from 'react-dom/client';
import type { Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { PieChart, LineChart, AreaChart } from '../src';
import {
  installResizeObserver,
  latestObserver,
  TestResizeObserver,
} from './resize-observer';

describe.each([['Pie', PieChart]] as const)(
  '%s point chart',
  (_family, Chart) => {
    let root: Root | undefined;
    beforeEach(installResizeObserver);
    afterEach(async () => {
      if (root) await act(async () => root!.unmount());
      root = undefined;
      document.body.replaceChildren();
      vi.unstubAllGlobals();
      vi.restoreAllMocks();
    });
    it.each(['explicit', 'responsive'] as const)(
      'hydrates %s without warnings or recoverable errors',
      async (mode) => {
        const errors = vi.spyOn(console, 'error');
        const warnings = vi.spyOn(console, 'warn');
        const recoverable = vi.fn();
        const data = [
          { x: new Date('2026-03-07T00:00:00Z'), y: 1 },
          { x: new Date('2026-03-10T00:00:00Z'), y: 3 },
        ];
        const element = (
          <StrictMode>
            <Chart
              data={data}
              nameKey="x"
              valueKey="y"
              {...(mode === 'responsive' ? {} : { width: 640 })}
            />
          </StrictMode>
        );
        const container = document.createElement('div');
        container.innerHTML = renderToString(element);
        document.body.append(container);
        const initial = container.innerHTML;
        const table = container.querySelector('table');
        expect(container.querySelector('svg') !== null).toBe(
          mode === 'explicit',
        );
        await act(async () => {
          root = hydrateRoot(container, element, {
            onRecoverableError: recoverable,
          });
        });
        expect(container.innerHTML).toBe(initial);
        if (mode === 'responsive') act(() => latestObserver().emit(500));
        expect(container.querySelector('svg')).not.toBeNull();
        expect(container.querySelector('table')).toBe(table);
        expect(errors).not.toHaveBeenCalled();
        expect(warnings).not.toHaveBeenCalled();
        expect(recoverable).not.toHaveBeenCalled();
      },
    );

    it('hydrates independent sibling charts with unique title and plot references', async () => {
      const errors = vi.spyOn(console, 'error');
      const recoverable = vi.fn();
      const element = (
        <>
          <Chart
            data={[{ x: 'A', y: 1 }]}
            nameKey="x"
            valueKey="y"
            width={400}
          />
          <Chart
            data={[{ x: 'B', y: 2 }]}
            nameKey="x"
            valueKey="y"
            width={600}
          />
          <LineChart data={[{ x: 'C', y: 3 }]} xKey="x" yKey="y" width={400} />
          <AreaChart data={[{ x: 'D', y: 4 }]} xKey="x" yKey="y" width={400} />
        </>
      );
      const container = document.createElement('div');
      container.innerHTML = renderToString(element);
      document.body.append(container);
      const initial = container.innerHTML;
      await act(async () => {
        root = hydrateRoot(container, element, {
          onRecoverableError: recoverable,
        });
      });
      expect(container.innerHTML).toBe(initial);
      const ids = [...container.querySelectorAll('[id]')].map(
        (node) => node.id,
      );
      expect(new Set(ids).size).toBe(ids.length);
      for (const svg of container.querySelectorAll('svg')) {
        expect(svg.getAttribute('aria-labelledby')).toBe(
          svg.querySelector('title')!.id,
        );
      }
      expect(recoverable).not.toHaveBeenCalled();
      expect(errors).not.toHaveBeenCalled();
    });
    it('Strict Mode disconnects every observer and ignores late callbacks', async () => {
      const element = (
        <StrictMode>
          <Chart data={[{ x: 'A', y: 1 }]} nameKey="x" valueKey="y" />
        </StrictMode>
      );
      const container = document.createElement('div');
      container.innerHTML = renderToString(element);
      document.body.append(container);
      await act(async () => {
        root = hydrateRoot(container, element);
      });
      expect(TestResizeObserver.instances.length).toBeGreaterThanOrEqual(2);
      const old = TestResizeObserver.instances[0]!;
      expect(old.disconnect).toHaveBeenCalled();
      act(() => old.emit(640));
      expect(container.querySelector('svg')).toBeNull();
      act(() => latestObserver().emit(500));
      expect(container.querySelector('svg')).not.toBeNull();
      await act(async () => root!.unmount());
      root = undefined;
      for (const observer of TestResizeObserver.instances)
        expect(observer.disconnect).toHaveBeenCalled();
      act(() => latestObserver().emit(700));
      expect(container.innerHTML).toBe('');
    });
  },
);
