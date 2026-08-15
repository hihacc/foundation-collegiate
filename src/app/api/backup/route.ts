import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const TABLES_TO_BACKUP = [
  'settings',
  'students',
  'admissions',
  'fee_challans',
  'fee_transactions',
  'fee_structures',
  'results',
  'attendance',
  'contacts',
  'achievers',
  'downloads',
  'teachers',
  'courses',
  'notices',
  'gallery',
  'academic_classes',
  'academic_groups',
  'academic_subjects',
  'principal_profile'
];

export async function GET(req: Request) {
  return handleBackupExecution(req, 'Automated Hourly Cron');
}

export async function POST(req: Request) {
  return handleBackupExecution(req, 'Manual Admin Trigger');
}

async function handleBackupExecution(req: Request, triggerSource: string) {
  try {
    const timestamp = new Date();
    const formattedDate = timestamp.toISOString().replace(/[:.]/g, '-');
    const filename = `TFC-Backup-${formattedDate}.json`;

    let totalRecordsCount = 0;
    const backupPayload: Record<string, any> = {
      meta: {
        app_name: 'The Foundation Collegiate',
        institute_address: 'House# 1704, Sector 11-E, Muslim Town, North Karachi, Karachi, Pakistan',
        contact_phone: '0333-3439458',
        contact_email: 'foundationcollegiate@gmail.com',
        exported_at: timestamp.toISOString(),
        trigger_source: triggerSource,
        schema_version: '2026.1',
      },
      tables: {},
      summary: {}
    };

    // Extract each table
    for (const table of TABLES_TO_BACKUP) {
      try {
        const { data, error } = await supabase.from(table).select('*');
        if (!error && data) {
          backupPayload.tables[table] = data;
          backupPayload.summary[table] = data.length;
          totalRecordsCount += data.length;
        } else {
          backupPayload.tables[table] = [];
          backupPayload.summary[table] = 0;
        }
      } catch (err: any) {
        backupPayload.tables[table] = [];
        backupPayload.summary[table] = 0;
      }
    }

    const jsonString = JSON.stringify(backupPayload, null, 2);
    const sizeInBytes = new Blob([jsonString]).size;
    const sizeFormatted = sizeInBytes > 1024 * 1024 
      ? `${(sizeInBytes / (1024 * 1024)).toFixed(2)} MB` 
      : `${(sizeInBytes / 1024).toFixed(2)} KB`;

    // Attempt to log in backup_logs table if exists
    try {
      await supabase.from('backup_logs').insert([
        {
          id: crypto.randomUUID(),
          filename,
          file_size: sizeFormatted,
          total_records: totalRecordsCount,
          trigger_type: triggerSource,
          status: 'Completed',
          created_at: timestamp.toISOString()
        }
      ]);
    } catch {}

    const url = new URL(req.url);
    const isDownload = url.searchParams.get('download') === 'true';

    if (isDownload) {
      return new NextResponse(jsonString, {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Content-Disposition': `attachment; filename="${filename}"`
        }
      });
    }

    return NextResponse.json({
      success: true,
      message: `Hourly database backup successfully created (${sizeFormatted}, ${totalRecordsCount} records).`,
      filename,
      file_size: sizeFormatted,
      total_records: totalRecordsCount,
      timestamp: timestamp.toISOString(),
      summary: backupPayload.summary,
      backup_data: backupPayload
    });

  } catch (error: any) {
    console.error('Backup generation error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message || 'Failed to generate backup' 
    }, { status: 500 });
  }
}
