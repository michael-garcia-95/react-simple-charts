import { StrictMode } from 'react';
import { act } from '@testing-library/react';
import { renderToString } from 'react-dom/server';
import { hydrateRoot } from 'react-dom/client';
import type { Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { RenderingProbe } from '../src/internal/RenderingProbe';
import {
  installResizeObserver,
  latestObserver,
  TestResizeObserver,
} from './resize-observer';

let root: Root | undefined;
beforeEach(installResizeObserver);
afterEach(async () => {
  if (root) await act(async () => root!.unmount());
  root = undefined;
  document.body.replaceChildren();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('server markup followed by jsdom hydration', () => {
  it.each([false, true])(
    'hydrates explicit SVG without mismatches (Strict Mode: %s)',
    async (strict) => {
      const errors = vi.spyOn(console, 'error');
      const warnings = vi.spyOn(console, 'warn');
      const recoverable = vi.fn();
      const probes = (
        <>
          <RenderingProbe
            width={640}
            accessibility={{ label: 'One', description: 'Details' }}
          />
          <RenderingProbe width={400} accessibility={{ label: 'Two' }} />
        </>
      );
      const element = strict ? <StrictMode>{probes}</StrictMode> : probes;
      const container = document.createElement('div');
      container.innerHTML = renderToString(element);
      document.body.append(container);
      const initial = container.innerHTML;
      expect(container.querySelectorAll('svg')).toHaveLength(2);
      await act(async () => {
        root = hydrateRoot(container, element, {
          onRecoverableError: recoverable,
        });
      });
      expect(container.innerHTML).toBe(initial);
      expect(TestResizeObserver.instances).toHaveLength(0);
      expect(recoverable).not.toHaveBeenCalled();
      expect(errors).not.toHaveBeenCalled();
      expect(warnings).not.toHaveBeenCalled();
    },
  );

  it.each([false, true])(
    'hydrates a placeholder before measurement (Strict Mode: %s)',
    async (strict) => {
      const errors = vi.spyOn(console, 'error');
      const warnings = vi.spyOn(console, 'warn');
      const recoverable = vi.fn();
      const probe = (
        <RenderingProbe
          accessibility={{ label: 'Responsive', description: 'Quarterly data' }}
        />
      );
      const element = strict ? <StrictMode>{probe}</StrictMode> : probe;
      const container = document.createElement('div');
      container.innerHTML = renderToString(element);
      document.body.append(container);
      const initial = container.innerHTML;
      const table = container.querySelector('table');
      const titleId = container
        .querySelector('[role="img"]')!
        .getAttribute('aria-labelledby');
      expect(container.querySelector('svg')).toBeNull();
      expect(TestResizeObserver.instances).toHaveLength(0);
      await act(async () => {
        root = hydrateRoot(container, element, {
          onRecoverableError: recoverable,
        });
      });
      expect(container.innerHTML).toBe(initial);
      act(() => latestObserver().emit(0));
      expect(container.querySelector('svg')).toBeNull();
      act(() => latestObserver().emit(512));
      expect(container.querySelector('svg')).toHaveAttribute(
        'viewBox',
        '0 0 512 280',
      );
      expect(container.querySelector('svg')).toHaveAttribute(
        'aria-labelledby',
        titleId,
      );
      expect(container.querySelector('table')).toBe(table);
      expect(table).toHaveTextContent('Q432');
      expect(recoverable).not.toHaveBeenCalled();
      expect(errors).not.toHaveBeenCalled();
      expect(warnings).not.toHaveBeenCalled();
    },
  );
});
