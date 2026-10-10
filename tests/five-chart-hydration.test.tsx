import { StrictMode } from 'react';
import { act } from '@testing-library/react';
import { renderToString } from 'react-dom/server';
import { hydrateRoot, type Root } from 'react-dom/client';
import { afterEach, expect, it, vi } from 'vitest';
import { FiveChartCollection } from '../playground/FiveCharts';
import { installResizeObserver, TestResizeObserver } from './resize-observer';
const roots: Root[] = [];
afterEach(async () => {
  await act(async () => roots.splice(0).forEach((root) => root.unmount()));
  document.body.replaceChildren();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});
it.each([false, true])(
  'hydrates two independent prefixed five-family roots (explicit=%s) without mismatches',
  async (explicit) => {
    installResizeObserver();
    const errors = vi.spyOn(console, 'error'),
      warnings = vi.spyOn(console, 'warn'),
      recoverable = vi.fn();
    for (const prefix of ['five-a-', 'five-b-']) {
      const element = (
        <StrictMode>
          <FiveChartCollection explicit={explicit} />
        </StrictMode>
      );
      const host = document.createElement('div');
      host.innerHTML = renderToString(element, { identifierPrefix: prefix });
      document.body.append(host);
      const initial = host.innerHTML;
      const tables = [...host.querySelectorAll('table')];
      await act(async () => {
        roots.push(
          hydrateRoot(host, element, {
            identifierPrefix: prefix,
            onRecoverableError: recoverable,
          }),
        );
      });
      expect(host.innerHTML).toBe(initial);
      expect([...host.querySelectorAll('table')]).toEqual(tables);
    }
    if (!explicit)
      act(() =>
        TestResizeObserver.instances
          .filter((o) => o.disconnect.mock.calls.length === 0)
          .forEach((o, i) => o.emit(240 + i * 10)),
      );
    expect(document.querySelectorAll('svg')).toHaveLength(10);
    const ids = [...document.querySelectorAll('[id]')].map((el) => el.id);
    expect(new Set(ids).size).toBe(ids.length);
    const observer = TestResizeObserver.instances.at(-1);
    await act(async () => roots.splice(0).forEach((root) => root.unmount()));
    if (observer) act(() => observer.emit(900));
    expect(document.querySelectorAll('svg')).toHaveLength(0);
    expect(errors).not.toHaveBeenCalled();
    expect(warnings).not.toHaveBeenCalled();
    expect(recoverable).not.toHaveBeenCalled();
  },
);
it('hydrates mixed explicit and responsive copies of every family with independent observers', async () => {
  installResizeObserver();
  const errors = vi.spyOn(console, 'error'),
    recoverable = vi.fn();
  const element = (
    <StrictMode>
      <FiveChartCollection explicit />
      <FiveChartCollection />
    </StrictMode>
  );
  const host = document.createElement('div');
  host.innerHTML = renderToString(element);
  document.body.append(host);
  const tables = [...host.querySelectorAll('table')];
  await act(async () =>
    roots.push(hydrateRoot(host, element, { onRecoverableError: recoverable })),
  );
  expect(host.querySelectorAll('svg')).toHaveLength(5);
  const observers = TestResizeObserver.instances.filter(
    (o) => o.disconnect.mock.calls.length === 0,
  );
  expect(observers).toHaveLength(5);
  act(() => observers.forEach((o, i) => o.emit(220 + i * 20)));
  expect(host.querySelectorAll('svg')).toHaveLength(10);
  expect([...host.querySelectorAll('table')]).toEqual(tables);
  expect(errors).not.toHaveBeenCalled();
  expect(recoverable).not.toHaveBeenCalled();
});
