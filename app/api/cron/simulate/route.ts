import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';
import { generateReadingForPlot, type PreviousReading } from '@/lib/simulator';
import type { Plot, Reading } from '@/lib/types';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

async function handle(request: Request) {
  const authHeader = request.headers.get('authorization');
  const expected = `Bearer ${process.env.CRON_SECRET}`;
  if (!process.env.CRON_SECRET || authHeader !== expected) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: plots, error: plotsError } = await supabaseServer()
    .from('plots')
    .select('id');

  if (plotsError) {
    return NextResponse.json(
      { error: 'Failed to load plots', details: plotsError.message },
      { status: 500 },
    );
  }

  let inserted = 0;
  const errors: { plot_id: string; message: string }[] = [];
  const now = new Date();

  for (const plot of (plots ?? []) as Pick<Plot, 'id'>[]) {
    try {
      const { data: lastRows } = await supabaseServer()
        .from('readings')
        .select('moisture, temperature, light')
        .eq('plot_id', plot.id)
        .order('recorded_at', { ascending: false })
        .limit(1);

      const previous: PreviousReading | null =
        lastRows && lastRows.length > 0
          ? {
              moisture: Number((lastRows[0] as Reading).moisture),
              temperature: Number((lastRows[0] as Reading).temperature),
              light: Number((lastRows[0] as Reading).light),
            }
          : null;

      const reading = generateReadingForPlot(plot.id, previous, now);
      const { error: insertError } = await supabaseServer()
        .from('readings')
        .insert(reading);

      if (insertError) throw new Error(insertError.message);
      inserted += 1;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      console.error(`Failed to insert reading for plot ${plot.id}:`, message);
      errors.push({ plot_id: plot.id, message });
    }
  }

  return NextResponse.json({ inserted, errors });
}

export { handle as GET, handle as POST };
