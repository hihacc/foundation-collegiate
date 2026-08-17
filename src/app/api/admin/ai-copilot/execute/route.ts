import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const isUUID = (str: any) => typeof str === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);

export async function POST(req: NextRequest) {
  try {
    const { proposal } = await req.json();
    const { action, table, record_id, changes, description } = proposal || {};

    const allowedTables = ['students', 'results', 'fee_challans', 'admissions', 'notices', 'achievers', 'teachers', 'courses'];

    if (!allowedTables.includes(table)) {
      return NextResponse.json({ error: `Table "${table}" is not allowed for AI modification.` }, { status: 400 });
    }

    if (action === 'UPDATE') {
      if (!record_id) {
        return NextResponse.json({ error: 'Record ID is required for UPDATE action.' }, { status: 400 });
      }

      let query = supabase.from(table).update(changes);
      if (isUUID(record_id)) {
        query = query.eq('id', record_id);
      } else if (table === 'students') {
        query = query.eq('roll_number', record_id);
      } else {
        query = query.eq('id', record_id);
      }

      const { data, error } = await query.select();

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        message: `Successfully updated ${table} record (${record_id}).`,
        data
      });
    }

    if (action === 'DELETE') {
      if (!record_id) {
        return NextResponse.json({ error: 'Record ID is required for DELETE action.' }, { status: 400 });
      }

      let query = supabase.from(table).delete();
      if (isUUID(record_id)) {
        query = query.eq('id', record_id);
      } else if (table === 'students') {
        query = query.eq('roll_number', record_id);
      } else {
        query = query.eq('id', record_id);
      }

      const { error } = await query;

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        message: `Successfully deleted ${table} record (${record_id}).`
      });
    }

    if (action === 'INSERT') {
      const payload = {
        id: crypto.randomUUID(),
        ...changes,
        created_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from(table)
        .insert([payload])
        .select();

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        message: `Successfully inserted new record into ${table}.`,
        data
      });
    }

    return NextResponse.json({ error: `Invalid action: ${action}` }, { status: 400 });

  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Execution error' }, { status: 500 });
  }
}
