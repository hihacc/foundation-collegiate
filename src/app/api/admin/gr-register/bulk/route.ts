import { NextRequest, NextResponse } from 'next/server';
import { GrRecord, INITIAL_GR_RECORDS } from '@/lib/data/grRegisterData';
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

  const dir = path.dirname(STORE_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  fs.writeFileSync(STORE_PATH, JSON.stringify(INITIAL_GR_RECORDS, null, 2), 'utf-8');
  return INITIAL_GR_RECORDS;
}

function saveGrRecords(records: GrRecord[]) {
  try {
    const dir = path.dirname(STORE_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(STORE_PATH, JSON.stringify(records, null, 2), 'utf-8');
  } catch (e: any) {
    console.error('Failed to persist GR register records:', e.message);
  }
}

// POST /api/admin/gr-register/bulk - Confirm and commit multiple scanned entries
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { items, source_scan_ref } = body;

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'items array is required'
      }, { status: 400 });
    }

    const records = getGrRecords();
    let updatedCount = 0;
    let addedCount = 0;

    for (const item of items) {
      const grNum = Number(item.gr_number);
      if (!grNum || grNum <= 0) continue;

      const existingIndex = records.findIndex(r => r.gr_number === grNum);

      if (existingIndex !== -1) {
        // Update existing slot (e.g. converting blank slot to assigned)
        records[existingIndex] = {
          ...records[existingIndex],
          student_name: item.student_name ? item.student_name.trim() : records[existingIndex].student_name,
          class_name: item.class_name ? item.class_name.trim() : records[existingIndex].class_name,
          status: item.student_name?.trim() ? 'assigned' : 'blank_slot',
          confidence: item.confidence || 95,
          verification_status: 'verified',
          audit_notes: item.notes || `Scanned & confirmed via AI Scanner (${source_scan_ref || 'Ledger scan'})`,
          updated_at: new Date().toISOString()
        };
        updatedCount++;
      } else {
        // Create new record
        const newRecord: GrRecord = {
          id: `gr_${grNum}`,
          gr_number: grNum,
          gr_code: `GR-${grNum}`,
          student_name: (item.student_name || '').trim(),
          class_name: (item.class_name || '').trim(),
          status: item.student_name?.trim() ? 'assigned' : 'blank_slot',
          confidence: item.confidence || 95,
          verification_status: 'verified',
          audit_notes: item.notes || `Scanned & confirmed via AI Scanner (${source_scan_ref || 'Ledger scan'})`,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        records.push(newRecord);
        addedCount++;
      }
    }

    // Keep sorted
    records.sort((a, b) => a.gr_number - b.gr_number);
    saveGrRecords(records);

    return NextResponse.json({
      success: true,
      updated_count: updatedCount,
      added_count: addedCount,
      total_committed: updatedCount + addedCount,
      total_records: records.length
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message || 'Bulk commit error'
    }, { status: 500 });
  }
}
