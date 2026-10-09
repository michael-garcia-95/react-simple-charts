import type { AxisConfig, CategoryValue } from '../../types/contracts';
import type { ContinuousTick } from '../scales/types';
import { formatLabels } from './labels';
import type { EstimatedLabel } from './labels';
import type { ResolvedSpacing } from './bounds';
import { selectTicks } from './selection';
import type {
  AxisLayout,
  Bounds,
  LayoutTick,
  PhysicalOrientation,
  SemanticAxis,
  UsableXScale,
  XAxisConfig,
} from './types';

/** Dispatch narrows the raw tick type; the input axis union follows normalized X mode. */
export function formatXLabels(
  scale: UsableXScale,
  config: XAxisConfig,
  fontSize: number,
) {
  switch (scale.kind) {
    case 'category':
      return formatLabels(
        scale.ticks,
        config as AxisConfig<CategoryValue>,
        fontSize,
      );
    case 'linear':
      return formatLabels(scale.ticks, config as AxisConfig<number>, fontSize);
    case 'utc':
    case 'time':
      return formatLabels(scale.ticks, config as AxisConfig<Date>, fontSize);
  }
}

export function buildTicks<V>(
  ticks: readonly (ContinuousTick<V> & { readonly index?: number })[],
  labels: readonly EstimatedLabel[],
  orientation: PhysicalOrientation,
  plot: Bounds,
  width: number,
  height: number,
  spacing: ResolvedSpacing,
): readonly LayoutTick<V>[] {
  const candidates = ticks.map((tick, index) => ({
    value: tick.value,
    position: tick.position,
    ...(tick.index === undefined ? {} : { index: tick.index }),
    ...labels[index]!,
    orientation,
    selected: false,
  }));
  const horizontal = orientation === 'horizontal';
  return selectTicks(
    candidates,
    orientation,
    spacing.padding,
    (horizontal ? width : height) - spacing.padding,
    horizontal ? spacing.tickFontSize * 1.2 : spacing.maxLabelWidth,
    spacing.collisionGap,
  ).map((tick) => ({
    ...tick,
    selected:
      tick.selected &&
      tick.position >= (horizontal ? plot.left : plot.top) &&
      tick.position <= (horizontal ? plot.right : plot.bottom),
  }));
}

export function buildAxis(
  scale: UsableXScale,
  labels: readonly EstimatedLabel[],
  config: XAxisConfig,
  orientation: PhysicalOrientation,
  semantic: SemanticAxis,
  plot: Bounds,
  width: number,
  height: number,
  spacing: ResolvedSpacing,
): AxisLayout {
  const base = {
    orientation,
    semantic,
    coordinate: orientation === 'horizontal' ? plot.bottom : plot.left,
    ...(config.label === undefined ? {} : { label: config.label }),
  };
  switch (scale.kind) {
    case 'category': {
      const candidates = buildTicks(
        scale.ticks,
        labels,
        orientation,
        plot,
        width,
        height,
        spacing,
      );
      return {
        ...base,
        kind: 'category',
        candidates,
        visibleTicks: candidates.filter((tick) => tick.selected),
      };
    }
    case 'linear': {
      const candidates = buildTicks(
        scale.ticks,
        labels,
        orientation,
        plot,
        width,
        height,
        spacing,
      );
      return {
        ...base,
        kind: 'linear',
        candidates,
        visibleTicks: candidates.filter((tick) => tick.selected),
      };
    }
    case 'utc':
    case 'time': {
      const candidates = buildTicks(
        scale.ticks,
        labels,
        orientation,
        plot,
        width,
        height,
        spacing,
      );
      return {
        ...base,
        kind: scale.kind,
        candidates,
        visibleTicks: candidates.filter((tick) => tick.selected),
      };
    }
  }
}
