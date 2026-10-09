/** Native Date brand check works across realms; NaN identifies an invalid Date. */
export function dateTimestamp(value: unknown): number | null {
  if (typeof value !== 'object' || value === null) return null;
  try {
    return Date.prototype.getTime.call(value);
  } catch {
    return null;
  }
}
