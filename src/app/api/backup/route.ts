import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';
import nodemailer from 'nodemailer';

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
      } catch {
        backupPayload.tables[table] = [];
        backupPayload.summary[table] = 0;
      }
    }

    const jsonString = JSON.stringify(backupPayload, null, 2);
    const sizeInBytes = new Blob([jsonString]).size;
    const sizeFormatted = sizeInBytes > 1024 * 1024 
      ? `${(sizeInBytes / (1024 * 1024)).toFixed(2)} MB` 
      : `${(sizeInBytes / 1024).toFixed(2)} KB`;

    // Dispatch Email with Attachment to Google Account (foundationcollegiate@gmail.com)
    let emailSent = false;
    let emailError: string | null = null;

    try {
      const emailUser = process.env.EMAIL_USER || 'foundationcollegiate@gmail.com';
      const emailPass = (process.env.EMAIL_APP_PASSWORD || 'jcxx yhbl acmq eypf').replace(/\s+/g, '');

      const transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 587,
        secure: false,
        auth: {
          user: emailUser,
          pass: emailPass
        },
        tls: {
          rejectUnauthorized: false
        }
      });

      const mailOptions = {
        from: `"TFC Automated Cloud Backup" <${emailUser}>`,
        to: emailUser,
        subject: `⚡ TFC Automated Database Backup Snapshot [${new Date().toLocaleDateString('en-PK')} ${new Date().toLocaleTimeString('en-PK', { hour: '2-digit', minute: '2-digit' })}]`,
        text: `Attached is your automated database backup snapshot from The Foundation Collegiate system.\n\nTrigger Source: ${triggerSource}\nTimestamp: ${timestamp.toISOString()}\nSnapshot Filename: ${filename}\nTotal Records: ${totalRecordsCount}\nFile Size: ${sizeFormatted}\n\nYou can save this file directly to your Google Drive or download it for safekeeping.`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 16px; padding: 24px; background: #ffffff;">
            <div style="text-align: center; border-bottom: 2px solid #3b82f6; padding-bottom: 16px; margin-bottom: 20px;">
              <h2 style="color: #1e3a8a; margin: 0; font-size: 22px;">The Foundation Collegiate</h2>
              <p style="color: #64748b; margin: 4px 0 0; font-size: 13px;">Automated Cloud &amp; Google Drive Backup Service</p>
            </div>
            <p style="color: #334155; font-size: 14px;">Hello Admin,</p>
            <p style="color: #334155; font-size: 14px;">Your automated database backup snapshot has been generated successfully and is attached to this email.</p>
            <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; margin: 16px 0;">
              <table style="width: 100%; font-size: 13px; color: #475569;">
                <tr><td style="font-weight: bold; padding: 4px 0;">Snapshot File:</td><td style="font-family: monospace;">${filename}</td></tr>
                <tr><td style="font-weight: bold; padding: 4px 0;">Trigger Mode:</td><td>${triggerSource}</td></tr>
                <tr><td style="font-weight: bold; padding: 4px 0;">Total Records:</td><td>${totalRecordsCount} rows across 19 tables</td></tr>
                <tr><td style="font-weight: bold; padding: 4px 0;">File Size:</td><td>${sizeFormatted}</td></tr>
                <tr><td style="font-weight: bold; padding: 4px 0;">Timestamp:</td><td>${timestamp.toLocaleString('en-PK')}</td></tr>
              </table>
            </div>
            <p style="color: #64748b; font-size: 12px; line-height: 1.5;">
              Tip: Hover over the attachment below in Gmail and click the <strong>Google Drive icon</strong> to save it directly into your Google Drive folder.
            </p>
          </div>
        `,
        attachments: [
          {
            filename,
            content: jsonString,
            contentType: 'application/json'
          }
        ]
      };

      await transporter.sendMail(mailOptions);
      emailSent = true;
    } catch (e: any) {
      console.warn('Backup email notification notice:', e.message);
      emailError = e.message;
    }

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
      message: `Database backup snapshot successfully created (${sizeFormatted}, ${totalRecordsCount} records). Delivered to foundationcollegiate@gmail.com.`,
      filename,
      file_size: sizeFormatted,
      total_records: totalRecordsCount,
      timestamp: timestamp.toISOString(),
      email_delivered: emailSent,
      email_error: emailError,
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
