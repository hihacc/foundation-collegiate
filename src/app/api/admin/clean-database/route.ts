import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

function getDbClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://qiqpqmumkevhwqqfgchz.supabase.co';
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false }
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { confirmation, tablesToClean } = body;

    if (confirmation !== 'CLEAN') {
      return NextResponse.json({
        success: false,
        error: 'Confirmation string "CLEAN" is required to wipe database records.'
      }, { status: 400 });
    }

    const db = getDbClient();
    const cleanedTables: string[] = [];
    const errors: Record<string, string> = {};

    // Operational tables allowed to be wiped when starting from new
    const operationalTables = [
      'results',
      'pins',
      'attendance',
      'fee_transactions',
      'fee_challans',
      'student_fee_profiles',
      'admissions',
      'inquiries',
      'contacts',
      'whatsapp_messages',
      'whatsapp_conversations',
      'deletion_logs',
      'students'
    ];

    const targetTables = Array.isArray(tablesToClean) && tablesToClean.length > 0
      ? operationalTables.filter(t => tablesToClean.includes(t))
      : operationalTables;

    if (db) {
      for (const table of targetTables) {
        try {
          // Delete rows from table
          const { error } = await db
            .from(table)
            .delete()
            .not('created_at', 'is', null);

          if (!error) {
            cleanedTables.push(table);
          } else {
            // Fallback: delete using id not null or roll_number not null
            const { error: retryError } = await db
              .from(table)
              .delete()
              .not('id', 'is', null);

            if (!retryError) {
              cleanedTables.push(table);
            } else {
              errors[table] = error.message || retryError.message;
            }
          }
        } catch (tblErr: any) {
          errors[table] = tblErr.message;
        }
      }

      // Record audit log for clean database event
      try {
        await db.from('audit_logs').insert({
          id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          category: 'SETTINGS',
          action: 'DATABASE_CLEAN_RESET',
          actor_email: 'foundationcollegiate@gmail.com',
          actor_role: 'Super Administrator',
          details: `Administrator performed clean database reset to start from new. Wiped tables: ${cleanedTables.join(', ')}`,
          severity: 'CRITICAL',
          metadata: { cleaned_tables: cleanedTables, errors },
          created_at: new Date().toISOString()
        });
      } catch {}
    }

    // Reset local server storage file: data/students.json
    try {
      const storePath = path.join(process.cwd(), 'data', 'students.json');
      if (fs.existsSync(storePath)) {
        fs.writeFileSync(storePath, JSON.stringify([], null, 2), 'utf-8');
      }
    } catch {}

    return NextResponse.json({
      success: true,
      message: `Database cleaned successfully! Wiped ${cleanedTables.length} tables so you can start fresh.`,
      cleaned_tables: cleanedTables,
      errors: Object.keys(errors).length > 0 ? errors : undefined
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}