import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
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

function getDbClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://qiqpqmumkevhwqqfgchz.supabase.co';
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false }
  });
}

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

  try {
    const dir = path.dirname(STORE_PATH);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(STORE_PATH, JSON.stringify(defaultStudents, null, 2), 'utf-8');
  } catch {}
  return defaultStudents;
}

function saveStoredStudents(students: Student[]) {
  try {
    const dir = path.dirname(STORE_PATH);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(STORE_PATH, JSON.stringify(students, null, 2), 'utf-8');
  } catch (e: any) {
    // Silently continue if running on serverless read-only filesystem
  }
}

// GET /api/students
export async function GET(req: NextRequest) {
  try {
    const db = getDbClient();
    if (db) {
      try {
        const { data, error } = await db
          .from('students')
          .select('*')
          .order('created_at', { ascending: false });

        if (!error && data && data.length > 0) {
          saveStoredStudents(data as Student[]);
          return NextResponse.json({ success: true, count: data.length, students: data });
        }
      } catch (e: any) {
        console.warn('GET /api/students db error:', e.message);
      }
    }

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
    const db = getDbClient();

    if (Array.isArray(body.students)) {
      const rawStudents = body.students;
      if (rawStudents.length === 0) {
        return NextResponse.json({ success: false, error: 'No student records provided' }, { status: 400 });
      }

      const preparedItems = rawStudents.map((s: any, idx: number) => {
        const roll = (s.roll_number || `FC-2026-${Math.floor(100 + idx)}`).toString().trim().toUpperCase();
        const name = (s.name || s.student_name || '').toString().trim();
        const father = (s.father_name || 'Parent / Guardian').toString().trim();
        const className = (s.class_name || 'Class IX - Science').toString().trim();
        const section = (s.section || 'A').toString().trim();
        const dob = s.date_of_birth ? s.date_of_birth.toString().trim() : null;
        const phone = s.phone ? s.phone.toString().trim() : null;
        const parentPhone = s.parent_phone ? s.parent_phone.toString().trim() : phone;
        const email = s.email ? s.email.toString().trim() : null;
        const gender = s.gender ? s.gender.toString().trim() : 'Male';
        const address = s.address ? s.address.toString().trim() : null;
        const status = s.status || 'active';

        return {
          id: s.id && typeof s.id === 'string' && /^[0-9a-f-]{36}$/i.test(s.id) ? s.id : crypto.randomUUID(),
          name,
          father_name: father,
          roll_number: roll,
          class_name: className,
          section,
          date_of_birth: dob,
          phone,
          parent_phone: parentPhone,
          email,
          gender,
          address,
          status,
          is_active: status !== 'inactive',
          created_at: s.created_at || new Date().toISOString()
        };
      });

      let dbInserted = 0;
      let dbError: string | null = null;

      if (db) {
        // Step 1: Batch upsert with roll_number conflict handling
        const { data, error } = await db
          .from('students')
          .upsert(preparedItems, { onConflict: 'roll_number', ignoreDuplicates: false })
          .select('id, roll_number');

        if (!error && data) {
          dbInserted = data.length;
        } else {
          if (error) {
            console.warn('[API Bulk Students] Batch upsert warning:', error.message);
            dbError = error.message;
          }

          // Step 2: Row-by-row fallback if batch was rejected (e.g. schema or constraint mismatch)
          let successCount = 0;
          for (const item of preparedItems) {
            const { error: itemErr } = await db
              .from('students')
              .upsert(item, { onConflict: 'roll_number' });

            if (!itemErr) {
              successCount++;
            } else {
              // Retry with core database columns only
              const coreItem = {
                name: item.name,
                father_name: item.father_name,
                roll_number: item.roll_number,
                class_name: item.class_name,
                section: item.section,
                date_of_birth: item.date_of_birth,
                phone: item.phone,
                email: item.email,
                gender: item.gender,
                address: item.address,
                status: item.status,
                is_active: item.is_active
              };
              const { error: coreErr } = await db
                .from('students')
                .upsert(coreItem, { onConflict: 'roll_number' });

              if (!coreErr) {
                successCount++;
              } else {
                console.error(`[API Student Upsert Failed for ${item.roll_number}]:`, coreErr.message);
                dbError = coreErr.message;
              }
            }
          }
          dbInserted = successCount;
        }
      }

      // Sync local server file cache if supported
      try {
        const current = getStoredStudents();
        const updated = [...preparedItems, ...current.filter(c => !preparedItems.some((p: { roll_number: string }) => p.roll_number === c.roll_number))];
        saveStoredStudents(updated);
      } catch {}

      if (dbInserted === 0 && dbError) {
        return NextResponse.json({
          success: false,
          error: `Database insertion failed: ${dbError}`,
          count: 0
        }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        count: dbInserted || preparedItems.length,
        students: preparedItems
      });
    }

    // Single student enroll
    const roll = (body.roll_number || `FC-26-${Math.floor(1000 + Math.random() * 9000)}`).toString().trim().toUpperCase();
    const newStudent: Student = {
      id: body.id && typeof body.id === 'string' && /^[0-9a-f-]{36}$/i.test(body.id) ? body.id : crypto.randomUUID(),
      name: (body.name || body.student_name || '').toString().trim().toUpperCase(),
      father_name: (body.father_name || 'Parent / Guardian').toString().trim(),
      roll_number: roll,
      class_name: (body.class_name || 'Class IX - Science').toString().trim(),
      section: (body.section || 'A').toString().trim(),
      phone: body.phone ? body.phone.toString().trim() : null,
      parent_phone: body.parent_phone ? body.parent_phone.toString().trim() : (body.phone ? body.phone.toString().trim() : null),
      email: body.email ? body.email.toString().trim() : null,
      date_of_birth: body.date_of_birth ? body.date_of_birth.toString().trim() : null,
      gender: body.gender || 'Male',
      address: body.address ? body.address.toString().trim() : null,
      status: body.status || 'active',
      is_active: body.status !== 'inactive',
      created_at: new Date().toISOString()
    };

    let singleDbError = null;
    if (db) {
      const { error: insertErr } = await db
        .from('students')
        .upsert(newStudent, { onConflict: 'roll_number' });

      if (insertErr) {
        const coreItem = {
          name: newStudent.name,
          father_name: newStudent.father_name,
          roll_number: newStudent.roll_number,
          class_name: newStudent.class_name,
          section: newStudent.section,
          date_of_birth: newStudent.date_of_birth,
          phone: newStudent.phone,
          email: newStudent.email,
          gender: newStudent.gender,
          address: newStudent.address,
          status: newStudent.status,
          is_active: newStudent.is_active
        };
        const { error: coreErr } = await db.from('students').upsert(coreItem, { onConflict: 'roll_number' });
        if (coreErr) singleDbError = coreErr.message;
      }
    }

    try {
      const current = getStoredStudents();
      const updated = [newStudent, ...current.filter(s => s.id !== newStudent.id && s.roll_number !== newStudent.roll_number)];
      saveStoredStudents(updated);
    } catch {}

    if (singleDbError) {
      return NextResponse.json({ success: false, error: singleDbError }, { status: 500 });
    }

    return NextResponse.json({ success: true, student: newStudent });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// PUT /api/students - Update student
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body.id && !body.roll_number) {
      return NextResponse.json({ success: false, error: 'Student ID or roll_number is required' }, { status: 400 });
    }

    const db = getDbClient();
    if (db) {
      if (body.id) {
        await db.from('students').update(body).eq('id', body.id);
      } else if (body.roll_number) {
        await db.from('students').update(body).eq('roll_number', body.roll_number);
      }
    }

    const students = getStoredStudents();
    const idx = students.findIndex(s => s.id === body.id || (body.roll_number && s.roll_number === body.roll_number));

    if (idx !== -1) {
      students[idx] = {
        ...students[idx],
        ...body,
        name: body.name ? body.name.trim().toUpperCase() : students[idx].name,
        is_active: body.status !== 'inactive'
      };
      saveStoredStudents(students);
    }

    return NextResponse.json({ success: true, student: body });
  } catch (error: any) {
        return {
          id: s.id && typeof s.id === 'string' && /^[0-9a-f-]{36}$/i.test(s.id) ? s.id : crypto.randomUUID(),
          name,
          father_name: father,
          roll_number: roll,
          class_name: className,
          section,
          date_of_birth: dob,
          phone,
          parent_phone: parentPhone,
          email,
          gender,
          address,
          status,
          is_active: status !== 'inactive',
          created_at: s.created_at || new Date().toISOString()
        };
      });

      let dbInserted = 0;
      let dbError: string | null = null;

      if (db) {
        // Step 1: Batch upsert with roll_number conflict handling
        const { data, error } = await db
          .from('students')
          .upsert(preparedItems, { onConflict: 'roll_number', ignoreDuplicates: false })
          .select('id, roll_number');

        if (!error && data) {
          dbInserted = data.length;
        } else {
          if (error) {
            console.warn('[API Bulk Students] Batch upsert warning:', error.message);
            dbError = error.message;
          }

          // Step 2: Row-by-row fallback if batch was rejected (e.g. schema or constraint mismatch)
          let successCount = 0;
          for (const item of preparedItems) {
            const { error: itemErr } = await db
              .from('students')
              .upsert(item, { onConflict: 'roll_number' });

            if (!itemErr) {
              successCount++;
            } else {
              // Retry with core database columns only
              const coreItem = {
                name: item.name,
                father_name: item.father_name,
                roll_number: item.roll_number,
                class_name: item.class_name,
                section: item.section,
                date_of_birth: item.date_of_birth,
                phone: item.phone,
                email: item.email,
                gender: item.gender,
                address: item.address,
                status: item.status,
                is_active: item.is_active
              };
              const { error: coreErr } = await db
                .from('students')
                .upsert(coreItem, { onConflict: 'roll_number' });

              if (!coreErr) {
                successCount++;
              } else {
                console.error(`[API Student Upsert Failed for ${item.roll_number}]:`, coreErr.message);
                dbError = coreErr.message;
              }
            }
          }
          dbInserted = successCount;
        }
      }

      // Sync local server file cache if supported
      try {
        const current = getStoredStudents();
        const updated = [...preparedItems, ...current.filter(c => !preparedItems.some((p: { roll_number: string }) => p.roll_number === c.roll_number))];
        saveStoredStudents(updated);
      } catch {}

      if (dbInserted === 0 && dbError) {
        return NextResponse.json({
          success: false,
          error: `Database insertion failed: ${dbError}`,
          count: 0
        }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        count: dbInserted || preparedItems.length,
        students: preparedItems
      });
    }

    // Single student enroll
    const roll = (body.roll_number || `FC-26-${Math.floor(1000 + Math.random() * 9000)}`).toString().trim().toUpperCase();
    const newStudent: Student = {
      id: body.id && typeof body.id === 'string' && /^[0-9a-f-]{36}$/i.test(body.id) ? body.id : crypto.randomUUID(),
      name: (body.name || body.student_name || '').toString().trim().toUpperCase(),
      father_name: (body.father_name || 'Parent / Guardian').toString().trim(),
      roll_number: roll,
      class_name: (body.class_name || 'Class IX - Science').toString().trim(),
      section: (body.section || 'A').toString().trim(),
      phone: body.phone ? body.phone.toString().trim() : null,
      parent_phone: body.parent_phone ? body.parent_phone.toString().trim() : (body.phone ? body.phone.toString().trim() : null),
      email: body.email ? body.email.toString().trim() : null,
      date_of_birth: body.date_of_birth ? body.date_of_birth.toString().trim() : null,
      gender: body.gender || 'Male',
      address: body.address ? body.address.toString().trim() : null,
      status: body.status || 'active',
      is_active: body.status !== 'inactive',
      created_at: new Date().toISOString()
    };

    let singleDbError = null;
    if (db) {
      const { error: insertErr } = await db
        .from('students')
        .upsert(newStudent, { onConflict: 'roll_number' });

      if (insertErr) {
        const coreItem = {
          name: newStudent.name,
          father_name: newStudent.father_name,
          roll_number: newStudent.roll_number,
          class_name: newStudent.class_name,
          section: newStudent.section,
          date_of_birth: newStudent.date_of_birth,
          phone: newStudent.phone,
          email: newStudent.email,
          gender: newStudent.gender,
          address: newStudent.address,
          status: newStudent.status,
          is_active: newStudent.is_active
        };
        const { error: coreErr } = await db.from('students').upsert(coreItem, { onConflict: 'roll_number' });
        if (coreErr) singleDbError = coreErr.message;
      }
    }

    try {
      const current = getStoredStudents();
      const updated = [newStudent, ...current.filter(s => s.id !== newStudent.id && s.roll_number !== newStudent.roll_number)];
      saveStoredStudents(updated);
    } catch {}

    if (singleDbError) {
      return NextResponse.json({ success: false, error: singleDbError }, { status: 500 });
    }

    return NextResponse.json({ success: true, student: newStudent });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// PUT /api/students - Update student
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body.id && !body.roll_number) {
      return NextResponse.json({ success: false, error: 'Student ID or roll_number is required' }, { status: 400 });
    }

    const db = getDbClient();
    if (db) {
      if (body.id) {
        await db.from('students').update(body).eq('id', body.id);
      } else if (body.roll_number) {
        await db.from('students').update(body).eq('roll_number', body.roll_number);
      }
    }

    const students = getStoredStudents();
    const idx = students.findIndex(s => s.id === body.id || (body.roll_number && s.roll_number === body.roll_number));

    if (idx !== -1) {
      students[idx] = {
        ...students[idx],
        ...body,
        name: body.name ? body.name.trim().toUpperCase() : students[idx].name,
        is_active: body.status !== 'inactive'
      };
      saveStoredStudents(students);
    }

    return NextResponse.json({ success: true, student: body });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// DELETE /api/students - Delete student
export async function DELETE(req: NextRequest) {
  try {
    const db = getDbClient();
    const contentType = req.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      const { ids } = await req.json();
      if (!Array.isArray(ids) || ids.length === 0) {
        return NextResponse.json({ success: false, error: 'No IDs provided' }, { status: 400 });
      }
      const { error: deleteError } = await db?.from('students').delete().in('id', ids) ?? {};
      // Delete students in batch
      const { error: deleteError } = await db?.from('students').delete().in('id', ids) ?? {};
      if (deleteError) {
        console.error('Batch delete error:', deleteError);
        return NextResponse.json({ success: false, error: deleteError.message }, { status: 500 });
      }
      // Log deletions
      const logs = ids.map((id: string) => ({ student_id: id, deleted_by: 'system', reason: 'Batch deletion via admin UI' }));
      await db?.from('deletion_logs').insert(logs).catch(() => {});
      // Update local cache
      try {
        const current = getStoredStudents();
        const filtered = current.filter(s => !ids.includes(s.id));
        saveStoredStudents(filtered);
      } catch {}
      return NextResponse.json({ success: true, count: ids.length });
    }
    // Fallback: single deletion via query param
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ success: false, error: 'Student ID is required' }, { status: 400 });
    }
    if (db) {
      await db.from('students').delete().eq('id', id);
    }
    // Update local cache
    try {
      const current = getStoredStudents();
      const filtered = current.filter(s => s.id !== id);
      saveStoredStudents(filtered);
    } catch {}
    return NextResponse.json({ success: true, deleted_id: id });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
