/** Fixed fixture and geometry for M01-T03 only; not data normalization. */
export const probeData = [
  { label: 'Q1', value: 12 },
  { label: 'Q2', value: 24 },
  { label: 'Q3', value: 18 },
  { label: 'Q4', value: 32 },
] as const;

export function usableDimension(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value > 0;
}

export function probeLayout(width: number, height: number) {
  const insetX = Math.min(36, width / 4);
  const insetY = Math.min(36, height / 4);
  const baseline = height - insetY;
  const points = probeData.map((datum, index) => ({
    ...datum,
    x: insetX + (index / (probeData.length - 1)) * (width - 2 * insetX),
    y: baseline - (datum.value / 40) * (height - 2 * insetY),
  }));
  return {
    baseline,
    insetX,
    points,
    polyline: points.map(({ x, y }) => `${x},${y}`).join(' '),
  };
}
