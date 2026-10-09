import type { EstimatedLabel } from './labels';
import type { Bounds, LayoutSpacing, Margins } from './types';

export const DEFAULT_SPACING = {
  padding: 8,
  tickFontSize: 12,
  titleFontSize: 14,
  gap: 6,
  tickLength: 4,
  collisionGap: 6,
  maxLabelWidth: 160,
  maxEndpointPadding: 80,
  minPlotSize: 16,
} as const;
export type ResolvedSpacing = {
  readonly [K in keyof typeof DEFAULT_SPACING]: number;
} & { readonly minimumMargins: Margins };

export function resolveSpacing(
  input: LayoutSpacing = {},
): ResolvedSpacing | null {
  if (typeof input !== 'object' || input === null || Array.isArray(input))
    return null;
  const values = { ...DEFAULT_SPACING, ...input };
  for (const key of Object.keys(
    DEFAULT_SPACING,
  ) as (keyof typeof DEFAULT_SPACING)[]) {
    // Explicit undefined has the same meaning as omission.
    const value = input[key] === undefined ? DEFAULT_SPACING[key] : input[key];
    if (!Number.isFinite(value) || value < 0 || value > Number.MAX_SAFE_INTEGER)
      return null;
    if (
      (key === 'tickFontSize' ||
        key === 'titleFontSize' ||
        key === 'minPlotSize') &&
      value === 0
    )
      return null;
    values[key] = value;
  }
  const minimumMargins = {
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    ...input.minimumMargins,
  };
  if (
    input.minimumMargins !== undefined &&
    (typeof input.minimumMargins !== 'object' ||
      input.minimumMargins === null ||
      Array.isArray(input.minimumMargins))
  )
    return null;
  for (const value of Object.values(minimumMargins))
    if (!Number.isFinite(value) || value < 0 || value > Number.MAX_SAFE_INTEGER)
      return null;
  return { ...values, minimumMargins };
}
export function rectangle(
  left: number,
  top: number,
  right: number,
  bottom: number,
): Bounds {
  return {
    left,
    top,
    right,
    bottom,
    width: right - left,
    height: bottom - top,
  };
}
export function calculateBounds(
  width: number,
  height: number,
  spacing: ResolvedSpacing,
  horizontal: readonly EstimatedLabel[],
  vertical: readonly EstimatedLabel[],
  horizontalTitle: boolean,
  verticalTitle: boolean,
): { margins: Margins; plot: Bounds } | null {
  let horizontalWidth = 0;
  let verticalWidth = 0;
  for (const label of horizontal)
    horizontalWidth = Math.max(horizontalWidth, label.estimatedWidth);
  for (const label of vertical)
    verticalWidth = Math.max(verticalWidth, label.estimatedWidth);
  const lineHeight = spacing.tickFontSize * 1.2;
  const titleSpace = spacing.titleFontSize * 1.2 + spacing.gap;
  const endpoint = Math.min(horizontalWidth / 2, spacing.maxEndpointPadding);
  const verticalSpace = vertical.length
    ? Math.min(verticalWidth, spacing.maxLabelWidth) +
      spacing.tickLength +
      spacing.gap
    : 0;
  const margins: Margins = {
    left: Math.max(
      spacing.minimumMargins.left,
      spacing.padding +
        Math.max(endpoint, verticalSpace + (verticalTitle ? titleSpace : 0)),
    ),
    right: Math.max(spacing.minimumMargins.right, spacing.padding + endpoint),
    top: Math.max(
      spacing.minimumMargins.top,
      spacing.padding + (vertical.length ? lineHeight / 2 : 0),
    ),
    bottom: Math.max(
      spacing.minimumMargins.bottom,
      spacing.padding +
        (horizontal.length
          ? lineHeight + spacing.tickLength + spacing.gap
          : 0) +
        (horizontalTitle ? titleSpace : 0) +
        (vertical.length ? lineHeight / 2 : 0),
    ),
  };
  const plot = rectangle(
    margins.left,
    margins.top,
    width - margins.right,
    height - margins.bottom,
  );
  if (
    ![...Object.values(margins), ...Object.values(plot)].every(
      Number.isFinite,
    ) ||
    plot.width < spacing.minPlotSize ||
    plot.height < spacing.minPlotSize ||
    plot.left < 0 ||
    plot.top < 0 ||
    plot.right > width ||
    plot.bottom > height
  )
    return null;
  return { margins, plot };
}
