// src/app/api/homepage/route.ts
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';
import { revalidatePath } from 'next/cache';

// Helper to get the single homepage row
async function getHomepage() {
  const { data, error } = await supabase
    .from('homepage')
    .select('data')
    .limit(1)
    .single();
  if (error) {
    console.error('Failed to fetch homepage:', error);
    return null;
  }
  return data?.data || {};
}

export async function GET() {
  const data = await getHomepage();
  if (!data) {
    // If the homepage table is missing or empty, return an empty object
    return NextResponse.json({ data: {} }, { status: 200 });
  }
  return NextResponse.json({ data });
}

// Expect JSON body { data: { ... } }
export async function PUT(request: Request) {
  try {
    const { data: payload } = await request.json();
    if (!payload) {
      return NextResponse.json({ error: 'Missing payload' }, { status: 400 });
    }
    // Upsert the single row (assumes only one row exists)
    const { error } = await supabase
      .from('homepage')
      .upsert({ data: payload })
      .select();
    if (error) {
      console.error('Failed to upsert homepage:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    // Invalidate ISR cache for the homepage
    revalidatePath('/');
    return NextResponse.json({ data: payload });
  } catch (e) {
    console.error('Error in PUT /api/homepage', e);
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }
}

export async function PATCH(request: Request) {
  // Partial update – merge with existing data
  const existing = await getHomepage();
  if (!existing) {
    return NextResponse.json({ error: 'Homepage not found' }, { status: 404 });
  }
  try {
    const { data: patch } = await request.json();
    const merged = { ...existing, ...patch };
    const { error } = await supabase
      .from('homepage')
      .upsert({ data: merged })
      .select();
    if (error) {
      console.error('Failed to patch homepage:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    revalidatePath('/')
    return NextResponse.json({ data: merged });
  } catch (e) {
    console.error('Error in PATCH /api/homepage', e);
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }
}
