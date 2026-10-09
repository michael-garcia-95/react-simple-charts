'use client';
import { LineRenderer } from './LineRenderer';
import type { LinePreviewProps } from './LineRenderer';
export type { LinePreviewProps } from './LineRenderer';
export function LinePreview<T extends object>(props: LinePreviewProps<T>) {
  return <LineRenderer {...props} />;
}
