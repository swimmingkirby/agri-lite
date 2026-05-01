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
    description:
      'A 30-day healthy growing month with gentle seasonal warming, weekly watering events and a slow soil-moisture decay between waterings.',
    durationMinutes: 30 * 24 * 60,
    intervalMinutes: 5,
    useLightCycle: true,
    curvePoints: [
      { offsetMinutes: 0,                              moisture: 58, temperature: 18, light: 0 },
      { offsetMinutes: 3 * 24 * 60,                    moisture: 52, temperature: 19, light: 0 },
      { offsetMinutes: 7 * 24 * 60,                    moisture: 45, temperature: 21, light: 0 }, // pre-watering low
      { offsetMinutes: 7 * 24 * 60 + 30,               moisture: 65, temperature: 21, light: 0 }, // watering 1
      { offsetMinutes: 10 * 24 * 60,                   moisture: 58, temperature: 22, light: 0 },
      { offsetMinutes: 14 * 24 * 60,                   moisture: 47, temperature: 24, light: 0 },
      { offsetMinutes: 14 * 24 * 60 + 30,              moisture: 66, temperature: 24, light: 0 }, // watering 2
      { offsetMinutes: 17 * 24 * 60,                   moisture: 60, temperature: 25, light: 0 },
      { offsetMinutes: 21 * 24 * 60,                   moisture: 49, temperature: 26, light: 0 },
      { offsetMinutes: 21 * 24 * 60 + 30,              moisture: 64, temperature: 26, light: 0 }, // watering 3
      { offsetMinutes: 25 * 24 * 60,                   moisture: 56, temperature: 24, light: 0 },
      { offsetMinutes: 28 * 24 * 60,                   moisture: 48, temperature: 22, light: 0 },
      { offsetMinutes: 28 * 24 * 60 + 30,              moisture: 62, temperature: 22, light: 0 }, // watering 4
      { offsetMinutes: 30 * 24 * 60,                   moisture: 58, temperature: 21, light: 0 },
    ],
    notes: [
      { offsetMinutes: 2 * 24 * 60,                    body: 'Routine inspection — leaves looking strong.' },
      { offsetMinutes: 7 * 24 * 60,                    body: 'Weekly watering, plants thriving.' },
      { offsetMinutes: 14 * 24 * 60,                   body: 'Routine watering, slightly warmer this week.' },
      { offsetMinutes: 21 * 24 * 60,                   body: 'Watered, plants doing well.' },
      { offsetMinutes: 28 * 24 * 60,                   body: 'Final watering of the month.' },
    ],
    thresholds: [
      { parameter: 'moisture',    min_value: 30, max_value: 80 },
      { parameter: 'temperature', min_value: 15, max_value: 30 },
      { parameter: 'light',       min_value: 1000, max_value: 70000 },
    ],
  },

  drought: {
    name: 'drought',
    description:
      'A 30-day month with three drought-and-recovery cycles of varying severity, each ending with a watering note.',
    durationMinutes: 30 * 24 * 60,
    intervalMinutes: 5,
    useLightCycle: true,
    curvePoints: [
      { offsetMinutes: 0,                              moisture: 60, temperature: 22, light: 0 },
      // Cycle 1: gentle decline, days 3-9
      { offsetMinutes: 3 * 24 * 60,                    moisture: 52, temperature: 23, light: 0 },
      { offsetMinutes: 6 * 24 * 60,                    moisture: 38, temperature: 25, light: 0 },
      { offsetMinutes: 9 * 24 * 60,                    moisture: 23, temperature: 27, light: 0 }, // dry peak
      { offsetMinutes: 9 * 24 * 60 + 30,               moisture: 60, temperature: 25, light: 0 }, // watered
      { offsetMinutes: 11 * 24 * 60,                   moisture: 56, temperature: 23, light: 0 },
      // Cycle 2: severe, days 14-20
      { offsetMinutes: 14 * 24 * 60,                   moisture: 48, temperature: 24, light: 0 },
      { offsetMinutes: 17 * 24 * 60,                   moisture: 33, temperature: 26, light: 0 },
      { offsetMinutes: 20 * 24 * 60,                   moisture: 21, temperature: 28, light: 0 }, // dry peak
      { offsetMinutes: 20 * 24 * 60 + 30,              moisture: 58, temperature: 26, light: 0 }, // watered
      { offsetMinutes: 22 * 24 * 60,                   moisture: 54, temperature: 23, light: 0 },
      // Cycle 3: mild, days 25-29
      { offsetMinutes: 25 * 24 * 60,                   moisture: 44, temperature: 23, light: 0 },
      { offsetMinutes: 29 * 24 * 60,                   moisture: 31, temperature: 24, light: 0 },
      { offsetMinutes: 29 * 24 * 60 + 30,              moisture: 56, temperature: 22, light: 0 }, // watered
      { offsetMinutes: 30 * 24 * 60,                   moisture: 56, temperature: 21, light: 0 },
    ],
    notes: [
      { offsetMinutes: 7 * 24 * 60,                    body: 'Soil drying, monitoring closely.' },
      { offsetMinutes: 9 * 24 * 60,                    body: 'Watered thoroughly after first dry spell.' },
      { offsetMinutes: 18 * 24 * 60,                   body: 'Second dry spell setting in, this one looks worse.' },
      { offsetMinutes: 20 * 24 * 60,                   body: 'Watered again, plants stressed.' },
      { offsetMinutes: 29 * 24 * 60,                   body: 'Mild dry stretch, watered before it got bad.' },
    ],
    thresholds: [
      { parameter: 'moisture',    min_value: 30, max_value: 80 },
      { parameter: 'temperature', min_value: 15, max_value: 30 },
      { parameter: 'light',       min_value: null, max_value: null },
    ],
  },

  heatwave: {
    name: 'heatwave',
    description:
      'A 30-day month with three heatwaves of varying intensity (moderate, severe, brief) and normal stretches between them.',
    durationMinutes: 30 * 24 * 60,
    intervalMinutes: 5,
    useLightCycle: true,
    curvePoints: [
      { offsetMinutes: 0,                              moisture: 55, temperature: 22, light: 0 },
      // Heatwave 1: day 5, moderate, ~32 °C peak
      { offsetMinutes: 5 * 24 * 60,                    moisture: 52, temperature: 24, light: 0 },
      { offsetMinutes: 5 * 24 * 60 + 4 * 60,           moisture: 50, temperature: 30, light: 0 },
      { offsetMinutes: 5 * 24 * 60 + 7 * 60,           moisture: 48, temperature: 33, light: 0 }, // peak
      { offsetMinutes: 5 * 24 * 60 + 10 * 60,          moisture: 49, temperature: 28, light: 0 },
      { offsetMinutes: 7 * 24 * 60,                    moisture: 53, temperature: 22, light: 0 },
      // Settled stretch
      { offsetMinutes: 11 * 24 * 60,                   moisture: 54, temperature: 23, light: 0 },
      // Heatwave 2: day 13, severe, ~40 °C peak
      { offsetMinutes: 13 * 24 * 60,                   moisture: 50, temperature: 28, light: 0 },
      { offsetMinutes: 13 * 24 * 60 + 5 * 60,          moisture: 47, temperature: 36, light: 0 },
      { offsetMinutes: 13 * 24 * 60 + 8 * 60,          moisture: 44, temperature: 40, light: 0 }, // peak
      { offsetMinutes: 13 * 24 * 60 + 14 * 60,         moisture: 43, temperature: 35, light: 0 },
      { offsetMinutes: 13 * 24 * 60 + 22 * 60,         moisture: 45, temperature: 28, light: 0 },
      { offsetMinutes: 15 * 24 * 60,                   moisture: 50, temperature: 23, light: 0 },
      // Settled stretch
      { offsetMinutes: 21 * 24 * 60,                   moisture: 53, temperature: 22, light: 0 },
      // Heatwave 3: day 22, brief, ~35 °C peak
      { offsetMinutes: 22 * 24 * 60,                   moisture: 52, temperature: 25, light: 0 },
      { offsetMinutes: 22 * 24 * 60 + 3 * 60,          moisture: 49, temperature: 35, light: 0 }, // peak
      { offsetMinutes: 22 * 24 * 60 + 6 * 60,          moisture: 49, temperature: 28, light: 0 },
      { offsetMinutes: 24 * 24 * 60,                   moisture: 52, temperature: 22, light: 0 },
      // Heatwave 4: day 27, moderate, ~36 °C peak — keeps an event in the
      // most-recent-7-days window so the History view's 7-day pill always
      // shows a heatwave.
      { offsetMinutes: 27 * 24 * 60,                   moisture: 51, temperature: 26, light: 0 },
      { offsetMinutes: 27 * 24 * 60 + 5 * 60,          moisture: 47, temperature: 36, light: 0 }, // peak
      { offsetMinutes: 27 * 24 * 60 + 10 * 60,         moisture: 48, temperature: 28, light: 0 },
      { offsetMinutes: 28 * 24 * 60 + 12 * 60,         moisture: 51, temperature: 23, light: 0 },
      { offsetMinutes: 30 * 24 * 60,                   moisture: 55, temperature: 21, light: 0 },
    ],
    notes: [
      { offsetMinutes: 5 * 24 * 60 + 7 * 60,           body: 'Warm spell, opened vents.' },
      { offsetMinutes: 13 * 24 * 60 + 8 * 60,          body: 'Severe heatwave — vents fully open, shade cloth deployed.' },
      { offsetMinutes: 14 * 24 * 60,                   body: 'Heatwave continued through the night, watering after dark.' },
      { offsetMinutes: 22 * 24 * 60 + 3 * 60,          body: 'Brief heat spike this afternoon.' },
      { offsetMinutes: 27 * 24 * 60 + 5 * 60,          body: 'Late-month heat returned, vents back open.' },
    ],
    thresholds: [
      { parameter: 'moisture',    min_value: 30, max_value: 80 },
      { parameter: 'temperature', min_value: 15, max_value: 30 },
      { parameter: 'light',       min_value: null, max_value: null },
    ],
  },

  light_deprivation: {
    name: 'light_deprivation',
    description:
      'A 30-day mostly-cloudy month with two short sunny breaks demonstrating the lower-bound light threshold.',
    durationMinutes: 30 * 24 * 60,
    intervalMinutes: 5,
    useLightCycle: false,
    curvePoints: [
      { offsetMinutes: 0,                              moisture: 55, temperature: 18, light: 800 },
      { offsetMinutes: 4 * 24 * 60,                    moisture: 56, temperature: 17, light: 1100 },
      // Sunny break 1: days 8-9
      { offsetMinutes: 7 * 24 * 60 + 12 * 60,          moisture: 56, temperature: 18, light: 5000 },
      { offsetMinutes: 8 * 24 * 60,                    moisture: 56, temperature: 19, light: 32000 },
      { offsetMinutes: 8 * 24 * 60 + 12 * 60,          moisture: 55, temperature: 21, light: 42000 },
      { offsetMinutes: 9 * 24 * 60 + 12 * 60,          moisture: 56, temperature: 20, light: 28000 },
      { offsetMinutes: 10 * 24 * 60,                   moisture: 56, temperature: 18, light: 1500 },
      // Cloudy stretch
      { offsetMinutes: 14 * 24 * 60,                   moisture: 57, temperature: 17, light: 900 },
      // Sunny break 2: days 18-20
      { offsetMinutes: 17 * 24 * 60 + 18 * 60,         moisture: 56, temperature: 18, light: 6000 },
      { offsetMinutes: 18 * 24 * 60,                   moisture: 56, temperature: 19, light: 30000 },
      { offsetMinutes: 19 * 24 * 60,                   moisture: 55, temperature: 21, light: 38000 },
      { offsetMinutes: 20 * 24 * 60,                   moisture: 56, temperature: 19, light: 25000 },
      { offsetMinutes: 21 * 24 * 60,                   moisture: 57, temperature: 18, light: 1800 },
      // Sunny break 3: days 26-27 — ensures the History view's 7-day pill
      // always shows at least one sunny break.
      { offsetMinutes: 25 * 24 * 60 + 18 * 60,         moisture: 56, temperature: 18, light: 4500 },
      { offsetMinutes: 26 * 24 * 60,                   moisture: 56, temperature: 19, light: 25000 },
      { offsetMinutes: 26 * 24 * 60 + 12 * 60,         moisture: 55, temperature: 21, light: 35000 },
      { offsetMinutes: 27 * 24 * 60 + 12 * 60,         moisture: 56, temperature: 19, light: 22000 },
      // Final cloudy stretch
      { offsetMinutes: 28 * 24 * 60,                   moisture: 57, temperature: 17, light: 1200 },
      { offsetMinutes: 30 * 24 * 60,                   moisture: 56, temperature: 17, light: 1100 },
    ],
    notes: [
      { offsetMinutes: 3 * 24 * 60,                    body: 'Five days of overcast skies, low natural light.' },
      { offsetMinutes: 8 * 24 * 60,                    body: 'Brief sunny break, plants soaking it in.' },
      { offsetMinutes: 14 * 24 * 60,                   body: 'Considering supplemental grow lights.' },
      { offsetMinutes: 19 * 24 * 60,                   body: 'Sun returned for a couple of days.' },
      { offsetMinutes: 26 * 24 * 60,                   body: 'Another sunny break, much-needed light.' },
      { offsetMinutes: 28 * 24 * 60 + 12 * 60,         body: 'Cloudy spell back, supplemental lights ordered.' },
    ],
    thresholds: [
      { parameter: 'moisture',    min_value: 30, max_value: 80 },
      { parameter: 'temperature', min_value: 10, max_value: 30 },
      { parameter: 'light',       min_value: 2000, max_value: 70000 },
    ],
  },

  mixed: {
    name: 'mixed',
    description:
      'A 30-day representative growing month combining drought, heatwaves, cloudy stretches and recoveries — the marketing-shot scenario.',
    durationMinutes: 30 * 24 * 60,
    intervalMinutes: 5,
    useLightCycle: true,
    curvePoints: [
      { offsetMinutes: 0,                              moisture: 58, temperature: 21, light: 0 },
      // Week 1: settled, light watering on day 5
      { offsetMinutes: 5 * 24 * 60,                    moisture: 48, temperature: 22, light: 0 },
      { offsetMinutes: 5 * 24 * 60 + 30,               moisture: 62, temperature: 22, light: 0 },
      // Week 2: drought peaking day 12, then watered
      { offsetMinutes: 8 * 24 * 60,                    moisture: 50, temperature: 24, light: 0 },
      { offsetMinutes: 12 * 24 * 60,                   moisture: 27, temperature: 26, light: 0 }, // drought peak
      { offsetMinutes: 12 * 24 * 60 + 30,              moisture: 58, temperature: 25, light: 0 }, // watered
      // Week 3: heatwave starting day 14
      { offsetMinutes: 14 * 24 * 60,                   moisture: 53, temperature: 28, light: 0 },
      { offsetMinutes: 14 * 24 * 60 + 5 * 60,          moisture: 50, temperature: 38, light: 0 }, // heatwave peak
      { offsetMinutes: 14 * 24 * 60 + 12 * 60,         moisture: 47, temperature: 32, light: 0 },
      { offsetMinutes: 16 * 24 * 60,                   moisture: 51, temperature: 24, light: 0 },
      // Week 3-4: cloudy + cool stretch
      { offsetMinutes: 19 * 24 * 60,                   moisture: 54, temperature: 19, light: 0 },
      { offsetMinutes: 22 * 24 * 60,                   moisture: 56, temperature: 18, light: 0 },
      // Week 4: small heatwave + recovery
      { offsetMinutes: 25 * 24 * 60,                   moisture: 52, temperature: 26, light: 0 },
      { offsetMinutes: 25 * 24 * 60 + 4 * 60,          moisture: 49, temperature: 33, light: 0 }, // small peak
      { offsetMinutes: 26 * 24 * 60,                   moisture: 51, temperature: 24, light: 0 },
      { offsetMinutes: 28 * 24 * 60,                   moisture: 53, temperature: 22, light: 0 },
      { offsetMinutes: 30 * 24 * 60,                   moisture: 56, temperature: 21, light: 0 },
    ],
    notes: [
      { offsetMinutes: 5 * 24 * 60,                    body: 'Settled in nicely, light watering.' },
      { offsetMinutes: 11 * 24 * 60,                   body: 'Soil drying, monitoring.' },
      { offsetMinutes: 12 * 24 * 60,                   body: 'Watered after the dry spell.' },
      { offsetMinutes: 14 * 24 * 60 + 5 * 60,          body: 'Heatwave hit hard — vents and shade cloth deployed.' },
      { offsetMinutes: 19 * 24 * 60,                   body: 'Cooled off, cloudy days ahead.' },
      { offsetMinutes: 25 * 24 * 60,                   body: 'Another warm afternoon, opening vents.' },
      { offsetMinutes: 28 * 24 * 60,                   body: 'Settled back to normal heading into next month.' },
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
  // Higher drift than the live simulator's 1-minute interval so the seeded
  // random walk shows more visible variation between adjacent points across
  // a 30-day window. The underlying scenario shape stays dominant.
  const DRIFT = { moisture: 1.5, temperature: 0.6, light: 700 };

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
