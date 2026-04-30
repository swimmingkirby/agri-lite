import type { Parameter, Threshold } from './types';

export type Status = 'ok' | 'warn' | 'alert';

export function computeStatus(
  value: number | null | undefined,
  threshold: Pick<Threshold, 'min_value' | 'max_value'> | null | undefined,
): Status {
  if (value == null || !threshold) return 'ok';
  const { min_value, max_value } = threshold;
  if (min_value == null && max_value == null) return 'ok';
  if (min_value != null && value < min_value) return 'alert';
  if (max_value != null && value > max_value) return 'alert';
  if (min_value != null && max_value != null) {
    const margin = (max_value - min_value) * 0.1;
    if (value - min_value < margin || max_value - value < margin) return 'warn';
  }
  return 'ok';
}

export function findThreshold(
  thresholds: Threshold[] | null | undefined,
  parameter: Parameter,
): Threshold | null {
  return (
    (thresholds ?? []).find((t) => t.parameter === parameter) ?? null
  );
}

export const STATUS_BADGE: Record<Status, string> = {
  ok: 'bg-green-50 text-green-700 ring-1 ring-green-200',
  warn: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200',
  alert: 'bg-red-50 text-red-700 ring-1 ring-red-200',
};

export const STATUS_LABEL: Record<Status, string> = {
  ok: 'Within range',
  warn: 'Approaching limit',
  alert: 'Out of range',
};
