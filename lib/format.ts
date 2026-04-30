import type { Parameter } from './types';

export function formatValue(value: number, parameter: Parameter): string {
  switch (parameter) {
    case 'moisture':
      return `${value.toFixed(1)} %`;
    case 'temperature':
      return `${value.toFixed(1)} °C`;
    case 'light':
      return `${Math.round(value)} lux`;
  }
}

export function formatRelative(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? '' : 's'} ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days === 1 ? '' : 's'} ago`;
}

export function formatLocalTime(iso: string): string {
  return new Intl.DateTimeFormat(undefined, {
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(iso));
}

export function formatLocalDateTime(iso: string): string {
  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(iso));
}

export const PARAMETER_LABELS: Record<Parameter, string> = {
  moisture: 'Soil moisture',
  temperature: 'Temperature',
  light: 'Light',
};

export const PARAMETER_UNITS: Record<Parameter, string> = {
  moisture: '%',
  temperature: '°C',
  light: 'lux',
};
