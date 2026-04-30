import { NextResponse } from 'next/server';
import { z } from 'zod';
import { supabaseServer } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const IdSchema = z.string().uuid();

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const parsed = IdSchema.safeParse(id);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid plot id' }, { status: 400 });
  }

  const { error, count } = await supabaseServer()
    .from('plots')
    .delete({ count: 'exact' })
    .eq('id', parsed.data);

  if (error) {
    return NextResponse.json(
      { error: 'Failed to delete plot', details: error.message },
      { status: 500 },
    );
  }
  if (!count) {
    return NextResponse.json({ error: 'Plot not found' }, { status: 404 });
  }
  return new NextResponse(null, { status: 204 });
}
