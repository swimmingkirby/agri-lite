import type { Parameter, Reading } from './types';

export type ScenarioName =
  | 'healthy'
  | 'drought'
  | 'heatwave'
  | 'light_deprivation'
  | 'mixed';

type TargetCurvePoint = {
  offsetMinutes: number;
  moisture: number;
  temperature: number;
  light: number;
};

type ScenarioNote = {
  offsetMinutes: number;
  body: string;
};

type ScenarioThreshold = {
  parameter: Parameter;
  min_value: number | null;
  max_value: number | null;
};

export type Scenario = {
  name: ScenarioName;
  description: string;
  durationMinutes: number;
  intervalMinutes: number;
  useLightCycle: boolean;
  curvePoints: TargetCurvePoint[];
  notes: ScenarioNote[];
  thresholds: ScenarioThreshold[];
};

export const SCENARIOS: Record<ScenarioName, Scenario> = {
  healthy: {
    name: 'healthy',
    description: 'A typical week with all values inside healthy ranges.',
    durationMinutes: 7 * 24 * 60,
    intervalMinutes: 5,
    useLightCycle: true,
    curvePoints: [
      { offsetMinutes: 0,           moisture: 58, temperature: 22, light: 0 },
      { offsetMinutes: 7 * 24 * 60, moisture: 55, temperature: 23, light: 0 },
    ],
    notes: [
      { offsetMinutes: 2 * 24 * 60, body: 'Routine inspection, all looks good.' },
      { offsetMinutes: 5 * 24 * 60, body: 'Light watering.' },
    ],
    thresholds: [
      { parameter: 'moisture',    min_value: 30, max_value: 80 },
      { parameter: 'temperature', min_value: 15, max_value: 30 },
      { parameter: 'light',       min_value: 1000, max_value: 70000 },
    ],
  },

  drought: {
    name: 'drought',
    description: 'Moisture drops from 60% to 25% over three days, then recovers after watering.',
    durationMinutes: 4 * 24 * 60,
    intervalMinutes: 5,
    useLightCycle: true,
    curvePoints: [
      { offsetMinutes: 0,                 moisture: 60, temperature: 23, light: 0 },
      { offsetMinutes: 24 * 60,           moisture: 48, temperature: 24, light: 0 },
      { offsetMinutes: 2 * 24 * 60,       moisture: 35, temperature: 25, light: 0 },
      { offsetMinutes: 3 * 24 * 60,       moisture: 25, temperature: 26, light: 0 },
      { offsetMinutes: 3 * 24 * 60 + 1,   moisture: 55, temperature: 24, light: 0 },
      { offsetMinutes: 4 * 24 * 60,       moisture: 58, temperature: 23, light: 0 },
    ],
    notes: [
      { offsetMinutes: 2 * 24 * 60 + 6 * 60, body: 'Soil looking dry, monitoring.' },
      { offsetMinutes: 3 * 24 * 60,           body: 'Watered the plot thoroughly.' },
    ],
    thresholds: [
      { parameter: 'moisture',    min_value: 30, max_value: 80 },
      { parameter: 'temperature', min_value: 15, max_value: 30 },
      { parameter: 'light',       min_value: null, max_value: null },
    ],
  },

  heatwave: {
    name: 'heatwave',
    description: 'A two-day window with a 6-hour temperature spike to 38°C.',
    durationMinutes: 2 * 24 * 60,
    intervalMinutes: 5,
    useLightCycle: true,
    curvePoints: [
      { offsetMinutes: 0,           moisture: 50, temperature: 22, light: 0 },
      { offsetMinutes: 24 * 60,     moisture: 48, temperature: 23, light: 0 },
      { offsetMinutes: 30 * 60,     moisture: 45, temperature: 35, light: 0 },
      { offsetMinutes: 33 * 60,     moisture: 42, temperature: 38, light: 0 },
      { offsetMinutes: 36 * 60,     moisture: 44, temperature: 32, light: 0 },
      { offsetMinutes: 2 * 24 * 60, moisture: 47, temperature: 23, light: 0 },
    ],
    notes: [
      { offsetMinutes: 33 * 60, body: 'Opened greenhouse vents.' },
    ],
    thresholds: [
      { parameter: 'moisture',    min_value: 30, max_value: 80 },
      { parameter: 'temperature', min_value: 15, max_value: 30 },
      { parameter: 'light',       min_value: null, max_value: null },
    ],
  },

  light_deprivation: {
    name: 'light_deprivation',
    description: 'A five-day cloudy spell where light stays below the minimum threshold.',
    durationMinutes: 5 * 24 * 60,
    intervalMinutes: 5,
    useLightCycle: false,
    curvePoints: [
      { offsetMinutes: 0,           moisture: 55, temperature: 19, light: 800 },
      { offsetMinutes: 5 * 24 * 60, moisture: 56, temperature: 18, light: 1200 },
    ],
    notes: [
      { offsetMinutes: 24 * 60,     body: 'Overcast all day, low natural light.' },
      { offsetMinutes: 4 * 24 * 60, body: 'Considering supplemental grow lights.' },
    ],
    thresholds: [
      { parameter: 'moisture',    min_value: 30, max_value: 80 },
      { parameter: 'temperature', min_value: 10, max_value: 30 },
      { parameter: 'light',       min_value: 2000, max_value: 70000 },
    ],
  },

  mixed: {
    name: 'mixed',
    description: 'A representative week with a drought, recovery, heatwave and cloudy days.',
    durationMinutes: 7 * 24 * 60,
    intervalMinutes: 5,
    useLightCycle: true,
    curvePoints: [
      { offsetMinutes: 0,                       moisture: 58, temperature: 22, light: 0 },
      { offsetMinutes: 24 * 60,                 moisture: 45, temperature: 23, light: 0 },
      { offsetMinutes: 2 * 24 * 60,             moisture: 30, temperature: 24, light: 0 },
      { offsetMinutes: 2 * 24 * 60 + 1,         moisture: 55, temperature: 23, light: 0 },
      { offsetMinutes: 4 * 24 * 60,             moisture: 50, temperature: 35, light: 0 },
      { offsetMinutes: 4 * 24 * 60 + 4 * 60,    moisture: 45, temperature: 37, light: 0 },
      { offsetMinutes: 4 * 24 * 60 + 8 * 60,    moisture: 47, temperature: 28, light: 0 },
      { offsetMinutes: 6 * 24 * 60,             moisture: 53, temperature: 21, light: 0 },
      { offsetMinutes: 7 * 24 * 60,             moisture: 56, temperature: 20, light: 0 },
    ],
    notes: [
      { offsetMinutes: 36 * 60,                body: 'Dry spell starting.' },
      { offsetMinutes: 2 * 24 * 60,            body: 'Watered the plot.' },
      { offsetMinutes: 4 * 24 * 60 + 2 * 60,   body: 'Hot afternoon, vents open.' },
      { offsetMinutes: 6 * 24 * 60,            body: 'Cloudy and cool, expected through tomorrow.' },
    ],
    thresholds: [
      { parameter: 'moisture',    min_value: 35, max_value: 75 },
      { parameter: 'temperature', min_value: 15, max_value: 30 },
      { parameter: 'light',       min_value: 1000, max_value: 70000 },
    ],
  },
};

function interpolateTarget(
  curvePoints: TargetCurvePoint[],
  offsetMinutes: number,
  parameter: Parameter,
): number {
  for (let i = 0; i < curvePoints.length - 1; i++) {
    const a = curvePoints[i];
    const b = curvePoints[i + 1];
    if (offsetMinutes >= a.offsetMinutes && offsetMinutes <= b.offsetMinutes) {
      const span = b.offsetMinutes - a.offsetMinutes;
      const t = span === 0 ? 0 : (offsetMinutes - a.offsetMinutes) / span;
      return a[parameter] + (b[parameter] - a[parameter]) * t;
    }
  }
  return curvePoints[curvePoints.length - 1][parameter];
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function round(n: number, dp: number) {
  return Math.round(n * 10 ** dp) / 10 ** dp;
}

export function generateScenarioReadings(
  scenario: Scenario,
  plotId: string,
  endTime: Date,
  randomNormal: (mean: number, std: number) => number,
  timeOfDayLightFactor: (date: Date) => number,
): Omit<Reading, 'id'>[] {
  const readings: Omit<Reading, 'id'>[] = [];
  const startTime = new Date(
    endTime.getTime() - scenario.durationMinutes * 60_000,
  );
  const DRIFT = { moisture: 0.8, temperature: 0.3, light: 400 };

  for (
    let offset = 0;
    offset <= scenario.durationMinutes;
    offset += scenario.intervalMinutes
  ) {
    const at = new Date(startTime.getTime() + offset * 60_000);

    const targetMoisture = interpolateTarget(
      scenario.curvePoints,
      offset,
      'moisture',
    );
    const targetTemperature = interpolateTarget(
      scenario.curvePoints,
      offset,
      'temperature',
    );
    const targetLight = interpolateTarget(
      scenario.curvePoints,
      offset,
      'light',
    );

    const moisture = clamp(
      targetMoisture + randomNormal(0, DRIFT.moisture),
      0,
      100,
    );
    const temperature = clamp(
      targetTemperature + randomNormal(0, DRIFT.temperature),
      -20,
      60,
    );

    const light = scenario.useLightCycle
      ? clamp(
          80000 * timeOfDayLightFactor(at) + randomNormal(0, DRIFT.light),
          0,
          120000,
        )
      : clamp(targetLight + randomNormal(0, DRIFT.light), 0, 120000);

    readings.push({
      plot_id: plotId,
      moisture: round(moisture, 2),
      temperature: round(temperature, 2),
      light: round(light, 2),
      recorded_at: at.toISOString(),
    });
  }

  return readings;
}
