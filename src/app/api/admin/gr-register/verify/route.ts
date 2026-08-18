import { NextRequest, NextResponse } from 'next/server';
import { GrRecord } from '@/lib/data/grRegisterData';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const STORE_PATH = path.join(process.cwd(), 'data', 'gr_register.json');

function getGrRecords(): GrRecord[] {
  try {
    if (fs.existsSync(STORE_PATH)) {
      const data = fs.readFileSync(STORE_PATH, 'utf-8');
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch {}
  return [];
}

function saveGrRecords(records: GrRecord[]) {
  try {
    const dir = path.dirname(STORE_PATH);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(STORE_PATH, JSON.stringify(records, null, 2), 'utf-8');
  } catch (e: any) {
    console.error('Failed to persist GR register records:', e.message);
  }
}

// POST /api/admin/gr-register/verify - Update verification status of a GR record
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { 
      gr_number, 
      action, // 'verify' | 'reject' | 'edit'
      student_name, 
      class_name,
      admin_notes 
    } = body;

    const grNum = Number(gr_number);
    if (!grNum || grNum <= 0) {
      return NextResponse.json({ success: false, error: 'Valid gr_number is required' }, { status: 400 });
    }

    const records = getGrRecords();
    const existingIndex = records.findIndex(r => r.gr_number === grNum);

    if (existingIndex === -1) {
      return NextResponse.json({ success: false, error: `GR ${grNum} not found in database` }, { status: 404 });
    }

    const record = records[existingIndex];

    if (action === 'verify') {
      record.verification_status = 'verified';
      record.confidence = 100;
      record.status = record.student_name ? 'assigned' : 'blank_slot';
      record.audit_notes = admin_notes || `Verified by Admin on ${new Date().toLocaleDateString()}`;
    } else if (action === 'reject') {
      record.verification_status = 'rejected';
      record.status = 'blank_slot';
      record.audit_notes = admin_notes || `Rejected by Admin on ${new Date().toLocaleDateString()}`;
    } else if (action === 'edit') {
      if (student_name !== undefined) record.student_name = String(student_name).trim();
      if (class_name !== undefined) record.class_name = String(class_name).trim();
      record.verification_status = 'verified';
      record.confidence = 100;
      record.status = record.student_name ? 'assigned' : 'blank_slot';
      record.audit_notes = admin_notes || `Manually edited and verified on ${new Date().toLocaleDateString()}`;
    }

    record.updated_at = new Date().toISOString();
    records[existingIndex] = record;

    saveGrRecords(records);

    return NextResponse.json({
      success: true,
      data: record,
      message: `GR ${grNum} updated successfully.`
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message || 'Verification error' }, { status: 500 });
  }
}
