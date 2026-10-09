import { useEffect, useRef, useState } from 'react';
import { usableDimension } from './probe-layout';

/** Per mounted responsive container. Browser access is confined to the effect. */
export function useContainerWidth() {
  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState<number | null>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element || typeof ResizeObserver === 'undefined') return;

    let active = true;
    const observer = new ResizeObserver((entries) => {
      if (!active) return;
      const entry = entries.find((candidate) => candidate.target === element);
      if (!entry) return;
      const next = usableDimension(entry.contentRect.width)
        ? entry.contentRect.width
        : null;
      setWidth((previous) => (previous === next ? previous : next));
    });
    observer.observe(element);
    return () => {
      active = false;
      observer.disconnect();
    };
  }, []);

  return { ref, width };
}
