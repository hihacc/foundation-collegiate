import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const GALLERY_STORE_FILE = path.join(process.cwd(), 'data', 'gallery.json');

function getLocalGallery(): any[] {
  try {
    if (fs.existsSync(GALLERY_STORE_FILE)) {
      const raw = fs.readFileSync(GALLERY_STORE_FILE, 'utf-8');
      return JSON.parse(raw);
    }
  } catch {}
  return [];
}

function saveLocalGallery(data: any[]) {
  try {
    const dir = path.dirname(GALLERY_STORE_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(GALLERY_STORE_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (e: any) {
    console.error('[GALLERY_STORE] Error saving local gallery:', e.message);
  }
}

// POST /api/admin/gallery/bulk - Batch Insert
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { items } = body;

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ success: false, error: 'items array is required' }, { status: 400 });
    }

    const prepared = items.map((item, index) => {
      const newId = item.id || crypto.randomUUID();
      const now = new Date().toISOString();
      return {
        id: newId,
        title: (item.title || `Gallery Photo ${index + 1}`).trim(),
        image_url: item.image_url.trim(),
        category: item.category || 'Campus',
        description: item.description?.trim() || null,
        source: item.source || 'admin',
        source_post_id: item.source_post_id || item.postUrl?.trim() || `bulk_${newId}`,
        is_active: item.is_active !== undefined ? Boolean(item.is_active) : true,
        display_order: item.display_order !== undefined ? Number(item.display_order) : 0,
        post_date: item.post_date || now,
        created_at: item.created_at || now,
        updated_at: now
      };
    });

    // 1. Try Supabase Insert
    let dbSuccess = false;
    let dbError = null;
    try {
      const { data, error } = await supabase.from('gallery').insert(prepared);
      if (!error) {
        dbSuccess = true;
      } else {
        dbError = error.message;
      }
    } catch (err: any) {
      dbError = err.message;
    }

    // 2. Sync to Local JSON Store
    const local = getLocalGallery();
    const combined = [...prepared, ...local.filter(l => !prepared.some(p => p.id === l.id))];
    saveLocalGallery(combined);

    return NextResponse.json({
      success: true,
      inserted_count: prepared.length,
      db_status: dbSuccess ? 'SUPABASE_INSERTED' : 'LOCAL_BACKUP_SAVED',
      db_error: dbError,
      items: prepared
    });

  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message || 'Bulk insert failed'
    }, { status: 500 });
  }
}

// DELETE /api/admin/gallery/bulk - Batch Delete
export async function DELETE(req: NextRequest) {
  try {
    const body = await req.json();
    const { ids } = body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ success: false, error: 'ids array is required' }, { status: 400 });
    }

    // 1. Delete from Supabase
    try {
      await supabase.from('gallery').delete().in('id', ids);
    } catch (e: any) {
      console.warn('[GALLERY_DELETE] Supabase delete notice:', e.message);
    }

    // 2. Delete from Local Store
    const local = getLocalGallery();
    const updated = local.filter(item => !ids.includes(item.id));
    saveLocalGallery(updated);

    return NextResponse.json({
      success: true,
      deleted_count: ids.length,
      ids
    });

  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message || 'Bulk delete failed'
    }, { status: 500 });
  }
}

// PATCH /api/admin/gallery/bulk - Batch Update (Visibility, Category)
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { ids, updates } = body;

    if (!Array.isArray(ids) || ids.length === 0 || !updates) {
      return NextResponse.json({ success: false, error: 'ids and updates are required' }, { status: 400 });
    }

    const payload: any = { updated_at: new Date().toISOString() };
    if (updates.is_active !== undefined) payload.is_active = Boolean(updates.is_active);
    if (updates.category) payload.category = updates.category;

    // 1. Update in Supabase
    try {
      await supabase.from('gallery').update(payload).in('id', ids);
    } catch (e: any) {
      console.warn('[GALLERY_UPDATE] Supabase update notice:', e.message);
    }

    // 2. Update in Local Store
    const local = getLocalGallery();
    const updated = local.map(item => {
      if (ids.includes(item.id)) {
        return { ...item, ...payload };
      }
      return item;
    });
    saveLocalGallery(updated);

    return NextResponse.json({
      success: true,
      updated_count: ids.length,
      updates: payload
    });

  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message || 'Bulk update failed'
    }, { status: 500 });
  }
}
