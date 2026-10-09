import { vi } from 'vitest';

/** Delivers notifications only when requested, including deliberately late ones. */
export class TestResizeObserver {
  static instances: TestResizeObserver[] = [];
  target: Element | undefined;
  observe = vi.fn((element: Element) => {
    this.target = element;
  });
  disconnect = vi.fn();
  constructor(private readonly callback: ResizeObserverCallback) {
    TestResizeObserver.instances.push(this);
  }
  emit(width: number, target = this.target) {
    if (!target) throw new Error('Observer has no target');
    this.callback(
      [{ target, contentRect: { width } } as ResizeObserverEntry],
      this as unknown as ResizeObserver,
    );
  }
}

export function installResizeObserver() {
  TestResizeObserver.instances = [];
  vi.stubGlobal('ResizeObserver', TestResizeObserver);
}

export function latestObserver() {
  const observer = TestResizeObserver.instances.at(-1);
  if (!observer) throw new Error('Expected a mounted observer');
  return observer;
}
