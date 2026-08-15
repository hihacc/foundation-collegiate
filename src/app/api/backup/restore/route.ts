import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { backup_data, overwrite = false } = body;

    if (!backup_data || !backup_data.tables) {
      return NextResponse.json({ 
        success: false, 
        error: 'Invalid backup file format. Missing tables object.' 
      }, { status: 400 });
    }

    const restoreSummary: Record<string, number> = {};
    let totalRestored = 0;

    for (const [tableName, rows] of Object.entries(backup_data.tables)) {
      if (Array.isArray(rows) && rows.length > 0) {
        try {
          if (overwrite) {
            // Optional clear
            await supabase.from(tableName).delete().neq('id', '00000000-0000-0000-0000-000000000000');
          }
          
          const { data, error } = await supabase.from(tableName).upsert(rows);
          if (!error) {
            restoreSummary[tableName] = rows.length;
            totalRestored += rows.length;
          } else {
            console.warn(`Restore warning for ${tableName}:`, error.message);
            restoreSummary[tableName] = 0;
          }
        } catch (e: any) {
          console.warn(`Exception restoring table ${tableName}:`, e.message);
          restoreSummary[tableName] = 0;
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: `Database successfully restored ${totalRestored} records across ${Object.keys(restoreSummary).length} tables.`,
      restored_count: totalRestored,
      summary: restoreSummary
    });

  } catch (error: any) {
    console.error('Database restore error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message || 'Failed to restore database from backup.' 
    }, { status: 500 });
  }
}
