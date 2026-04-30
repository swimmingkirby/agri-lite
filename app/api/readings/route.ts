import { NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { supabaseServer } from '@/lib/supabase/server';
import { ReadingsQuerySchema } from '@/lib/schemas';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const raw = {
    plot_id: url.searchParams.get('plot_id') ?? undefined,
    since: url.searchParams.get('since') ?? undefined,
    limit: url.searchParams.get('limit') ?? undefined,
  };

  let query;
  try {
    query = ReadingsQuerySchema.parse(raw);
  } catch (err) {
    if (err instanceof ZodError) {
      return NextResponse.json(
        { error: 'Invalid query', details: err.issues },
        { status: 400 },
      );
    }
    throw err;
  }

  let q = supabaseServer()
    .from('readings')
    .select('*')
    .eq('plot_id', query.plot_id)
    .order('recorded_at', { ascending: false })
    .limit(query.limit);

  if (query.since) {
    q = q.gte('recorded_at', query.since);
  }

  const { data, error } = await q;

  if (error) {
    return NextResponse.json(
      { error: 'Failed to load readings', details: error.message },
      { status: 500 },
    );
  }
  return NextResponse.json(data ?? []);
}
