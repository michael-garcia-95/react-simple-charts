import { arc } from 'd3-shape';
import type { DefaultArcObject } from 'd3-shape';

/** Validate actual D3 path syntax, finite numbers, arc radii and flags. */
export function validPolarPath(path: unknown): path is string {
  if (typeof path !== 'string' || !path.startsWith('M') || !path.endsWith('Z'))
    return false;
  const number = /[-+]?(?:\d*\.\d+|\d+\.?\d*)(?:e[-+]?\d+)?/gi;
  const commands = path.match(/[MLAZ][^MLAZ]*/g);
  if (!commands || commands.join('') !== path) return false;
  let arcs = 0;
  for (const command of commands) {
    const values = command.slice(1).match(number)?.map(Number) ?? [];
    if (
      command.slice(1).replace(number, '').replace(/[,\s]/g, '') ||
      !values.every(Number.isFinite)
    )
      return false;
    const kind = command[0];
    if (values.length !== (kind === 'A' ? 7 : kind === 'Z' ? 0 : 2))
      return false;
    if (kind === 'A') {
      if (
        !(values[0]! > 0 && values[1]! > 0) ||
        ![0, 1].includes(values[3]!) ||
        ![0, 1].includes(values[4]!)
      )
        return false;
      arcs++;
    }
  }
  return arcs > 0;
}
export function polarArcPath(datum: DefaultArcObject): string | null {
  try {
    const path = arc<DefaultArcObject>().digits(null)(datum);
    if (!validPolarPath(path)) return null;
    // D3 may omit a numerically tiny inner arc; never trust a filled Pie as Donut.
    const fullCircle =
      Math.abs(datum.endAngle - datum.startAngle) > 2 * Math.PI - 1e-12;
    const requiredArcs = (fullCircle ? 2 : 1) * (datum.innerRadius > 0 ? 2 : 1);
    if ((path.match(/A/g)?.length ?? 0) < requiredArcs) return null;
    return path;
  } catch {
    return null;
  }
}
