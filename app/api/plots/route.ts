import { NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { supabaseServer } from '@/lib/supabase/server';
import { PlotCreateSchema } from '@/lib/schemas';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
  const { data, error } = await supabaseServer()
    .from('plots')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json(
      { error: 'Failed to load plots', details: error.message },
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
    input = PlotCreateSchema.parse(body);
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
    .from('plots')
    .insert({ name: input.name })
    .select('*')
    .single();

  if (error) {
    return NextResponse.json(
      { error: 'Failed to create plot', details: error.message },
      { status: 500 },
    );
  }
  return NextResponse.json(data, { status: 201 });
}
