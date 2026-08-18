import { NextRequest, NextResponse } from 'next/server';
import { INITIAL_GR_RECORDS, GrRecord } from '@/lib/data/grRegisterData';
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

// GET /api/admin/gr-register
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = (searchParams.get('search') || '').toLowerCase().trim();
    const status = searchParams.get('status') || 'all';
    const className = searchParams.get('class') || 'all';

    let records = getGrRecords();

    if (search) {
      records = records.filter(r => 
        r.gr_code.toLowerCase().includes(search) ||
        String(r.gr_number).includes(search) ||
        r.student_name.toLowerCase().includes(search) ||
        r.class_name.toLowerCase().includes(search)
      );
    }

    if (status !== 'all') {
      records = records.filter(r => r.status === status);
    }

    if (className !== 'all') {
      records = records.filter(r => r.class_name.toLowerCase().includes(className.toLowerCase()));
    }

    records.sort((a, b) => a.gr_number - b.gr_number);

    return NextResponse.json({
      success: true,
      total: records.length,
      records
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// POST /api/admin/gr-register - Create / Assign new GR
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const records = getGrRecords();

    const maxGr = records.reduce((max, r) => Math.max(max, r.gr_number), 0);
    const nextGr = body.gr_number ? Number(body.gr_number) : maxGr + 1;
    const formattedCode = `GR-${nextGr}`;

    const newRecord: GrRecord = {
      id: `gr_${Date.now()}_${nextGr}`,
      gr_number: nextGr,
      gr_code: body.gr_code || formattedCode,
      student_name: body.student_name || '',
      class_name: body.class_name || '',
      status: body.student_name ? 'assigned' : 'blank',
      page_scan_ref: body.page_scan_ref || '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    records.push(newRecord);
    saveGrRecords(records);

    return NextResponse.json({ success: true, record: newRecord });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// PUT /api/admin/gr-register - Update existing GR
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body.id) {
      return NextResponse.json({ success: false, error: 'Record ID is required' }, { status: 400 });
    }

    const records = getGrRecords();
    const idx = records.findIndex(r => r.id === body.id);

    if (idx === -1) {
      return NextResponse.json({ success: false, error: 'GR record not found' }, { status: 404 });
    }

    const updated: GrRecord = {
      ...records[idx],
      ...body,
      status: body.student_name ? (body.status || 'assigned') : 'blank',
      updated_at: new Date().toISOString()
    };

    records[idx] = updated;
    saveGrRecords(records);

    return NextResponse.json({ success: true, record: updated });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// DELETE /api/admin/gr-register
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, error: 'Record ID is required' }, { status: 400 });
    }

    const records = getGrRecords();
    const filtered = records.filter(r => r.id !== id);
    saveGrRecords(filtered);

    return NextResponse.json({ success: true, deleted: id });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
