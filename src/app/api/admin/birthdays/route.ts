import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const BIRTHDAY_LOG_FILE = path.join(process.cwd(), 'data', 'birthday_wishes_log.json');

// GET /api/admin/birthdays
export async function GET(req: NextRequest) {
  try {
    let logs: any[] = [];
    if (fs.existsSync(BIRTHDAY_LOG_FILE)) {
      const raw = fs.readFileSync(BIRTHDAY_LOG_FILE, 'utf-8');
      logs = JSON.parse(raw);
    }

    const todayStr = new Date().toISOString().slice(0, 10);
    const sentToday = logs.filter(l => l.sent_at && l.sent_at.startsWith(todayStr));

    return NextResponse.json({
      success: true,
      total_sent_all_time: logs.length,
      sent_today_count: sentToday.length,
      recent_logs: logs.slice(0, 20),
      sent_today_student_ids: sentToday.map(l => l.student_id).filter(Boolean)
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to fetch birthday metrics'
    }, { status: 500 });
  }
}
