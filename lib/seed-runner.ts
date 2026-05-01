import { supabaseServer } from './supabase/server';
import { randomNormal, timeOfDayLightFactor } from './simulator';
import {
  SCENARIOS,
  generateScenarioReadings,
  type ScenarioName,
} from './seed-scenarios';

export type SeedResult = {
  scenario: ScenarioName;
  readingsInserted: number;
  notesInserted: number;
  thresholdsSet: number;
  durationMs: number;
};

export async function runScenario(
  plotId: string,
  scenarioName: ScenarioName,
  endTime: Date = new Date(),
): Promise<SeedResult> {
  const start = Date.now();
  const scenario = SCENARIOS[scenarioName];
  if (!scenario) throw new Error(`Unknown scenario: ${scenarioName}`);

  const sb = supabaseServer();

  // Wipe existing readings/notes/thresholds for this plot to avoid mixing
  // scenarios. Plot row itself is preserved so the URL keeps working.
  await sb.from('readings').delete().eq('plot_id', plotId);
  await sb.from('notes').delete().eq('plot_id', plotId);
  await sb.from('thresholds').delete().eq('plot_id', plotId);

  const readings = generateScenarioReadings(
    scenario,
    plotId,
    endTime,
    randomNormal,
    timeOfDayLightFactor,
  );
  let readingsInserted = 0;
  for (let i = 0; i < readings.length; i += 1000) {
    const batch = readings.slice(i, i + 1000);
    const { error } = await sb.from('readings').insert(batch);
    if (error) throw new Error(`Reading insert failed: ${error.message}`);
    readingsInserted += batch.length;
  }

  const noteRows = scenario.notes.map((n) => {
    const at = new Date(
      endTime.getTime() -
        (scenario.durationMinutes - n.offsetMinutes) * 60_000,
    );
    return {
      plot_id: plotId,
      body: n.body,
      recorded_at: at.toISOString(),
    };
  });
  if (noteRows.length > 0) {
    const { error } = await sb.from('notes').insert(noteRows);
    if (error) throw new Error(`Note insert failed: ${error.message}`);
  }

  const thresholdRows = scenario.thresholds.map((t) => ({
    plot_id: plotId,
    parameter: t.parameter,
    min_value: t.min_value,
    max_value: t.max_value,
  }));
  if (thresholdRows.length > 0) {
    const { error } = await sb
      .from('thresholds')
      .upsert(thresholdRows, { onConflict: 'plot_id,parameter' });
    if (error) throw new Error(`Threshold upsert failed: ${error.message}`);
  }

  return {
    scenario: scenarioName,
    readingsInserted,
    notesInserted: noteRows.length,
    thresholdsSet: thresholdRows.length,
    durationMs: Date.now() - start,
  };
}
