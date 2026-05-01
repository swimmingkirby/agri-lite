import { NextResponse } from 'next/server';
import { z, ZodError } from 'zod';
import { runScenario } from '@/lib/seed-runner';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const SeedSchema = z.object({
  plot_id: z.string().uuid(),
  scenario: z.enum([
    'healthy',
    'drought',
    'heatwave',
    'light_deprivation',
    'mixed',
  ]),
});

async function handle(req: Request) {
  const auth = req.headers.get('authorization');
  if (!process.env.CRON_SECRET || auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  let input;
  try {
    input = SeedSchema.parse(body);
  } catch (err) {
    if (err instanceof ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: err.issues },
        { status: 400 },
      );
    }
    throw err;
  }

  try {
    const result = await runScenario(input.plot_id, input.scenario);
    return NextResponse.json(result, { status: 200 });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export { handle as POST };
