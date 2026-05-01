import type { Parameter } from './types';

type Range = { min: number; max: number; starting: number; drift: number };

const RANGES: Record<Parameter, Range> = {
  moisture: { min: 20, max: 90, starting: 55, drift: 1.5 }, // %
  temperature: { min: 5, max: 35, starting: 22, drift: 0.4 }, // °C
  light: { min: 0, max: 80000, starting: 5000, drift: 800 }, // lux
};

// Box–Muller transform for a normal distribution.
export function randomNormal(mean: number, std: number): number {
  const u1 = Math.random() || 1e-9;
  const u2 = Math.random();
  const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  return mean + std * z;
}

export function nextValue(prev: number, range: Range): number {
  const next = prev + randomNormal(0, range.drift);
  return Math.max(range.min, Math.min(range.max, next));
}

function round(n: number, dp: number): number {
  return Math.round(n * 10 ** dp) / 10 ** dp;
}

// Modulate light by hour-of-day so it tracks a daily cycle.
export function timeOfDayLightFactor(date: Date): number {
  const hour = date.getUTCHours() + date.getUTCMinutes() / 60;
  return Math.max(0, Math.sin(((hour - 6) / 12) * Math.PI));
}

export type PreviousReading = {
  moisture: number;
  temperature: number;
  light: number;
};

export type GeneratedReading = {
  plot_id: string;
  moisture: number;
  temperature: number;
  light: number;
};

export function generateReadingForPlot(
  plotId: string,
  previous: PreviousReading | null,
  now: Date = new Date(),
): GeneratedReading {
  const start = previous ?? {
    moisture: RANGES.moisture.starting,
    temperature: RANGES.temperature.starting,
    light: RANGES.light.starting,
  };
  const rawLight = nextValue(start.light, RANGES.light);
  const light = rawLight * timeOfDayLightFactor(now);
  return {
    plot_id: plotId,
    moisture: round(nextValue(start.moisture, RANGES.moisture), 2),
    temperature: round(nextValue(start.temperature, RANGES.temperature), 2),
    light: round(light, 2),
  };
}

export { RANGES };
