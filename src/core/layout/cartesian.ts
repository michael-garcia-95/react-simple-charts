import type { NumericAxisConfig } from '../../types/contracts';
import { createValueScale, createXScale } from '../scales/cartesian';
import { buildAxis, formatXLabels } from './axes';
import { calculateBounds, rectangle, resolveSpacing } from './bounds';
import { placeGridlines } from './grid';
import { formatLabels } from './labels';
import type {
  AxisAssignment,
  CartesianLayoutInput,
  CartesianLayoutResult,
  LayoutDiagnostic,
  XAxisConfig,
} from './types';
import { unusableLayout } from './types';

function validAxis(config: XAxisConfig): boolean {
  return (
    typeof config === 'object' &&
    config !== null &&
    !Array.isArray(config) &&
    (config.show === undefined || typeof config.show === 'boolean') &&
    (config.label === undefined ||
      (typeof config.label === 'string' && !/[\r\n\t]/.test(config.label))) &&
    (config.formatTick === undefined || typeof config.formatTick === 'function')
  );
}

/** Internal orchestration only. No React, browser APIs, or raw D3 objects. */
export function layoutCartesian<T>(
  input: CartesianLayoutInput<T>,
): CartesianLayoutResult {
  const { width, height, normalized, family } = input;
  if (
    ![width, height].every(
      (value) =>
        Number.isFinite(value) && value > 0 && value <= Number.MAX_SAFE_INTEGER,
    )
  )
    return unusableLayout(
      'invalid-dimensions',
      'Width and height must be positive finite numbers no larger than MAX_SAFE_INTEGER.',
    );
  if (
    !['line', 'area', 'bar'].includes(family) ||
    (input.orientation !== undefined &&
      (family !== 'bar' ||
        !['horizontal', 'vertical'].includes(input.orientation))) ||
    (input.showGrid !== undefined && typeof input.showGrid !== 'boolean')
  )
    return unusableLayout(
      'invalid-configuration',
      'Invalid family, orientation, or grid setting.',
    );
  if (normalized.status === 'invalid-configuration')
    return unusableLayout(
      'invalid-normalization',
      'Fix normalization configuration before layout; retain normalization diagnostics at the caller.',
    );
  if (family === 'bar' && normalized.data.xScale !== 'category')
    return unusableLayout(
      'incompatible-x-scale',
      'Bar requires categorical normalization.',
    );
  const xConfig = input.xAxis === undefined ? {} : input.xAxis;
  const yConfig = input.yAxis === undefined ? {} : input.yAxis;
  if (!validAxis(xConfig) || !validAxis(yConfig))
    return unusableLayout(
      'invalid-configuration',
      'Axes must have valid show, label, and formatTick options.',
    );
  const spacing = resolveSpacing(input.spacing);
  if (!spacing)
    return unusableLayout(
      'invalid-spacing',
      'Spacing must contain finite nonnegative pixels, with positive fonts and minimum plot size.',
    );
  const horizontalBar = family === 'bar' && input.orientation === 'horizontal';
  const semanticConfig: XAxisConfig = {
    ...(horizontalBar ? yConfig : xConfig),
  };
  const valueConfig: NumericAxisConfig = {
    ...(horizontalBar ? xConfig : yConfig),
  } as NumericAxisConfig;
  const semanticAxis: 'x' | 'y' = horizontalBar ? 'y' : 'x';
  const valueAxis: 'x' | 'y' = horizontalBar ? 'x' : 'y';
  // First pass: domain/tick validation and formatting independent of dimensions.
  const initialX = createXScale(normalized, [0, 1], semanticConfig);
  const initialValue = createValueScale(
    normalized,
    family,
    [1, 0],
    valueConfig,
  );
  const diagnostics: LayoutDiagnostic[] = [];
  if (initialX.status === 'unusable')
    diagnostics.push(
      ...initialX.diagnostics.map((diagnostic) => ({
        ...diagnostic,
        axis: semanticAxis,
      })),
    );
  if (initialValue.status === 'unusable')
    diagnostics.push(
      ...initialValue.diagnostics.map((diagnostic) => ({
        ...diagnostic,
        axis: valueAxis,
      })),
    );
  if (initialX.status === 'unusable' || initialValue.status === 'unusable')
    return { status: 'unusable', diagnostics };
  const xLabels =
    semanticConfig.show === false
      ? { status: 'ready' as const, labels: [] }
      : formatXLabels(initialX, semanticConfig, spacing.tickFontSize);
  const valueLabels =
    valueConfig.show === false
      ? { status: 'ready' as const, labels: [] }
      : formatLabels(initialValue.ticks, valueConfig, spacing.tickFontSize);
  if (xLabels.status === 'unusable')
    diagnostics.push(
      ...xLabels.diagnostics.map((diagnostic) => ({
        ...diagnostic,
        axis: semanticAxis,
      })),
    );
  if (valueLabels.status === 'unusable')
    diagnostics.push(
      ...valueLabels.diagnostics.map((diagnostic) => ({
        ...diagnostic,
        axis: valueAxis,
      })),
    );
  if (xLabels.status === 'unusable' || valueLabels.status === 'unusable')
    return { status: 'unusable', diagnostics };
  const bounds = calculateBounds(
    width,
    height,
    spacing,
    horizontalBar ? valueLabels.labels : xLabels.labels,
    horizontalBar ? xLabels.labels : valueLabels.labels,
    xConfig.show !== false && Boolean(xConfig.label),
    yConfig.show !== false && Boolean(yConfig.label),
  );
  if (!bounds)
    return unusableLayout(
      'insufficient-space',
      'Margins cannot leave the minimum positive plot rectangle.',
    );
  const { plot, margins } = bounds;
  // Second and final pass: same domains/ticks, resolved physical ranges. Labels are reused.
  const semanticX = createXScale(
    normalized,
    horizontalBar ? [plot.top, plot.bottom] : [plot.left, plot.right],
    semanticConfig,
  );
  const value = createValueScale(
    normalized,
    family,
    horizontalBar ? [plot.left, plot.right] : [plot.bottom, plot.top],
    valueConfig,
  );
  if (semanticX.status === 'unusable')
    return {
      status: 'unusable',
      diagnostics: semanticX.diagnostics.map((diagnostic) => ({
        ...diagnostic,
        axis: semanticAxis,
      })),
    };
  if (value.status === 'unusable')
    return {
      status: 'unusable',
      diagnostics: value.diagnostics.map((diagnostic) => ({
        ...diagnostic,
        axis: valueAxis,
      })),
    };
  const assignments: { x: AxisAssignment; y: AxisAssignment } = {
    x: {
      orientation: 'horizontal',
      semantic: horizontalBar ? 'value' : 'x',
      visible: xConfig.show !== false,
    },
    y: {
      orientation: 'vertical',
      semantic: horizontalBar ? 'x' : 'value',
      visible: yConfig.show !== false,
    },
  };
  const semanticLayout =
    semanticConfig.show === false
      ? null
      : buildAxis(
          semanticX,
          xLabels.labels,
          semanticConfig,
          horizontalBar ? 'vertical' : 'horizontal',
          'x',
          plot,
          width,
          height,
          spacing,
        );
  const valueLayout =
    valueConfig.show === false
      ? null
      : buildAxis(
          { kind: 'linear', ...value },
          valueLabels.labels,
          valueConfig,
          horizontalBar ? 'horizontal' : 'vertical',
          'value',
          plot,
          width,
          height,
          spacing,
        );
  let zeroBaseline = null;
  if (family !== 'line' && value.status === 'ready') {
    const zero = value.map(0);
    if (
      zero.status !== 'mapped' ||
      zero.position < (horizontalBar ? plot.left : plot.top) ||
      zero.position > (horizontalBar ? plot.right : plot.bottom)
    )
      return unusableLayout(
        'unsafe-position',
        'Required zero baseline does not map safely inside the plot.',
      );
    zeroBaseline = { axis: valueAxis, position: zero.position };
  }
  const metadata = {
    width,
    height,
    chart: rectangle(0, 0, width, height),
    margins,
    plot,
    assignments,
    axes: {
      x: horizontalBar ? valueLayout : semanticLayout,
      y: horizontalBar ? semanticLayout : valueLayout,
    },
    gridlines: placeGridlines(
      value.ticks,
      plot,
      horizontalBar,
      input.showGrid !== false,
    ),
    zeroBaseline,
    diagnostics,
  };
  if (semanticX.status === 'ready' && value.status === 'ready')
    return { ...metadata, status: 'ready', scales: { semanticX, value } };
  return { ...metadata, status: 'empty', scales: { semanticX, value } };
}
