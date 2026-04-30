import { NextResponse } from 'next/server';
import { z, ZodError } from 'zod';
import { supabaseServer } from '@/lib/supabase/server';
import { ThresholdUpsertSchema } from '@/lib/schemas';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const QuerySchema = z.object({ plot_id: z.string().uuid() });

export async function GET(request: Request) {
  const url = new URL(request.url);
  const parsed = QuerySchema.safeParse({
    plot_id: url.searchParams.get('plot_id') ?? undefined,
  });
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid query', details: parsed.error.issues },
      { status: 400 },
    );
  }

  const { data, error } = await supabaseServer()
    .from('thresholds')
    .select('*')
    .eq('plot_id', parsed.data.plot_id);

  if (error) {
    return NextResponse.json(
      { error: 'Failed to load thresholds', details: error.message },
      { status: 500 },
    );
  }
  return NextResponse.json(data ?? []);
}

export async function PUT(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  let input;
  try {
    input = ThresholdUpsertSchema.parse(body);
  } catch (err) {
    if (err instanceof ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: err.issues },
        { status: 400 },
      );
    }
    throw err;
  }

  if (
    input.min_value !== null &&
    input.max_value !== null &&
    input.min_value > input.max_value
  ) {
    return NextResponse.json(
      { error: 'min_value must be less than or equal to max_value' },
      { status: 400 },
    );
  }

  const { data, error } = await supabaseServer()
    .from('thresholds')
    .upsert(
      {
        plot_id: input.plot_id,
        parameter: input.parameter,
        min_value: input.min_value,
        max_value: input.max_value,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'plot_id,parameter' },
    )
    .select('*')
    .single();

  if (error) {
    return NextResponse.json(
      { error: 'Failed to save threshold', details: error.message },
      { status: 500 },
    );
  }
  return NextResponse.json(data);
}
