import { NextResponse } from 'next/server';
import { z, ZodError } from 'zod';
import { supabaseServer } from '@/lib/supabase/server';
import { NoteCreateSchema } from '@/lib/schemas';

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
    .from('notes')
    .select('*')
    .eq('plot_id', parsed.data.plot_id)
    .order('recorded_at', { ascending: false });

  if (error) {
    return NextResponse.json(
      { error: 'Failed to load notes', details: error.message },
      { status: 500 },
    );
  }
  return NextResponse.json(data ?? []);
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  let input;
  try {
    input = NoteCreateSchema.parse(body);
  } catch (err) {
    if (err instanceof ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: err.issues },
        { status: 400 },
      );
    }
    throw err;
  }

  const { data, error } = await supabaseServer()
    .from('notes')
    .insert({ plot_id: input.plot_id, body: input.body })
    .select('*')
    .single();

  if (error) {
    return NextResponse.json(
      { error: 'Failed to create note', details: error.message },
      { status: 500 },
    );
  }
  return NextResponse.json(data, { status: 201 });
}
