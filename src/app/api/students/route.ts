import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';
import { Student } from '@/types';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const STORE_PATH = path.join(process.cwd(), 'data', 'students.json');

const defaultStudents: Student[] = [
  { id: 's1', name: 'Asif Khan', father_name: 'Muhammad Khan', roll_number: 'FC-26-101', class_name: 'Class IX - Science / Biology', phone: '0333-1234567', parent_phone: '0333-9988776', secondary_phone: '0331-5556677', email: 'asif@gmail.com', status: 'active', is_active: true, created_at: new Date().toISOString() },
  { id: 's2', name: 'Zainab Ahmed', father_name: 'Tariq Ahmed', roll_number: 'FC-26-102', class_name: 'Class XI - Pre-Medical', phone: '0321-9876543', parent_phone: '0321-7788990', secondary_phone: '0300-1122334', email: 'zainab@gmail.com', status: 'active', is_active: true, created_at: new Date().toISOString() },
  { id: 's3', name: 'Bilal Hassan', father_name: 'Hassan Raza', roll_number: 'FC-26-103', class_name: 'Class XII - Pre-Engineering', phone: '0300-5554433', parent_phone: '0300-2233445', secondary_phone: '0345-6677889', email: 'bilal@gmail.com', status: 'active', is_active: true, created_at: new Date().toISOString() },
  { id: 's4', name: 'Hamza Malik', father_name: 'Malik Usman', roll_number: 'FC-26-104', class_name: 'Diploma in Information Technology (DIT)', phone: '0345-2233445', parent_phone: '0345-1122334', secondary_phone: '0312-3344556', email: 'hamza.malik@gmail.com', status: 'active', is_active: true, created_at: new Date().toISOString() },
  { id: 's5', name: 'Ayesha Siddiqui', father_name: 'Siddiqui Ahmed', roll_number: 'FC-26-105', class_name: 'Class XII - Computer Science', phone: '0312-7788990', parent_phone: '0312-5566778', secondary_phone: '0333-8899001', email: 'ayesha.s@gmail.com', status: 'active', is_active: true, created_at: new Date().toISOString() },
  { id: 's6', name: 'Mustafa Ali', father_name: 'Ali Raza', roll_number: 'FC-26-106', class_name: 'Class X - Computer Science', phone: '0331-4455667', parent_phone: '0331-2233445', secondary_phone: '0321-9988776', email: 'mustafa.ali@gmail.com', status: 'active', is_active: true, created_at: new Date().toISOString() }
];

function getStoredStudents(): Student[] {
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
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(STORE_PATH, JSON.stringify(defaultStudents, null, 2), 'utf-8');
  return defaultStudents;
}

function saveStoredStudents(students: Student[]) {
  try {
    const dir = path.dirname(STORE_PATH);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(STORE_PATH, JSON.stringify(students, null, 2), 'utf-8');
  } catch (e: any) {
    console.error('Failed to save students to server storage:', e.message);
  }
}

// GET /api/students
export async function GET(req: NextRequest) {
  try {
    // 1. Try Supabase first
    try {
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data && data.length > 0) {
        saveStoredStudents(data as Student[]);
        return NextResponse.json({ success: true, count: data.length, students: data });
      }
    } catch {}

    // 2. Fallback to Server File Database
    const students = getStoredStudents();
    return NextResponse.json({ success: true, count: students.length, students });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// POST /api/students - Enroll new student or batch
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const students = getStoredStudents();

    if (Array.isArray(body.students)) {
      // Bulk insert
      const newItems: Student[] = body.students.map((s: any) => ({
        id: s.id || crypto.randomUUID(),
        name: (s.name || s.student_name || '').trim().toUpperCase(),
        father_name: s.father_name || 'Parent / Guardian',
        roll_number: s.roll_number || `FC-26-${Math.floor(1000 + Math.random() * 9000)}`,
        class_name: s.class_name || 'Class IX - Science',
        section: s.section || 'A',
        phone: s.phone || s.parent_phone || '',
        parent_phone: s.parent_phone || '',
        email: s.email || s.parent_email || undefined,
        date_of_birth: s.date_of_birth || undefined,
        gender: s.gender || undefined,
        address: s.address || undefined,
        status: s.status || 'active',
        is_active: s.status !== 'inactive',
        created_at: new Date().toISOString()
      }));

      // 1. Save to Supabase
      try {
        await supabase.from('students').insert(newItems);
      } catch {}

      // 2. Save to Server database
      const updated = [...newItems, ...students];
      saveStoredStudents(updated);

      return NextResponse.json({ success: true, count: newItems.length, students: newItems });
    }

    // Single student enroll
    const newStudent: Student = {
      id: body.id || crypto.randomUUID(),
      name: (body.name || body.student_name || '').trim().toUpperCase(),
      father_name: body.father_name || 'Parent / Guardian',
      roll_number: body.roll_number || `FC-26-${Math.floor(1000 + Math.random() * 9000)}`,
      class_name: body.class_name || 'Class IX - Science',
      section: body.section || 'A',
      phone: body.phone || body.parent_phone || '',
      parent_phone: body.parent_phone || '',
      email: body.email || body.parent_email || undefined,
      date_of_birth: body.date_of_birth || undefined,
      gender: body.gender || undefined,
      address: body.address || undefined,
      status: body.status || 'active',
      is_active: body.status !== 'inactive',
      created_at: new Date().toISOString()
    };

    // 1. Save to Supabase
    try {
      await supabase.from('students').insert([newStudent]);
    } catch {}

    // 2. Save to Server database
    const updated = [newStudent, ...students.filter(s => s.id !== newStudent.id)];
    saveStoredStudents(updated);

    return NextResponse.json({ success: true, student: newStudent });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// PUT /api/students - Update student
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body.id) {
      return NextResponse.json({ success: false, error: 'Student ID is required' }, { status: 400 });
    }

    const students = getStoredStudents();
    const idx = students.findIndex(s => s.id === body.id);

    if (idx === -1) {
      return NextResponse.json({ success: false, error: 'Student not found' }, { status: 404 });
    }

    const updated: Student = {
      ...students[idx],
      ...body,
      name: body.name ? body.name.trim().toUpperCase() : students[idx].name,
      is_active: body.status !== 'inactive'
    };

    students[idx] = updated;

    // 1. Update Supabase
    try {
      await supabase.from('students').update(updated).eq('id', body.id);
    } catch {}

    // 2. Update Server Database
    saveStoredStudents(students);

    return NextResponse.json({ success: true, student: updated });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// DELETE /api/students - Delete student
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, error: 'Student ID is required' }, { status: 400 });
    }

    const students = getStoredStudents();
    const filtered = students.filter(s => s.id !== id);

    // 1. Delete from Supabase
    try {
      await supabase.from('students').delete().eq('id', id);
    } catch {}

    // 2. Delete from Server Database
    saveStoredStudents(filtered);

    return NextResponse.json({ success: true, deleted_id: id });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
