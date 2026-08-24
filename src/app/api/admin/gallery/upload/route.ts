import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/svg+xml',
  'image/avif'
]);

const MAX_FILE_SIZE = 15 * 1024 * 1024; // 15MB per image

// POST /api/admin/gallery/upload - Multi-file image uploader for bulk gallery
export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const files = formData.getAll('files') as File[];

    if (!files || files.length === 0) {
      // Check if single file was sent as 'file'
      const singleFile = formData.get('file') as File | null;
      if (singleFile) {
        files.push(singleFile);
      }
    }

    if (files.length === 0) {
      return NextResponse.json({ success: false, error: 'No files provided' }, { status: 400 });
    }

    const uploadDir = join(process.cwd(), 'public', 'uploads', 'gallery');
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true });
    }

    const uploadedResults = [];
    const errors = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      if (file.size > MAX_FILE_SIZE) {
        errors.push({ filename: file.name, error: `File exceeds 15MB size limit (${(file.size / (1024 * 1024)).toFixed(1)}MB)` });
        continue;
      }

      const mimeType = file.type || 'image/jpeg';
      if (!ALLOWED_MIME_TYPES.has(mimeType) && !mimeType.startsWith('image/')) {
        errors.push({ filename: file.name, error: 'Unsupported file format. Please upload JPG, PNG, WEBP, or GIF.' });
        continue;
      }

      const originalName = file.name || `photo_${Date.now()}_${i}.jpg`;
      const cleanName = originalName.replace(/[^a-zA-Z0-9.-]/g, '_');
      const uniqueFilename = `${Date.now()}_${Math.random().toString(36).slice(2, 7)}_${cleanName}`;

      try {
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        const filePath = join(uploadDir, uniqueFilename);
        await writeFile(filePath, buffer);

        const publicUrl = `/uploads/gallery/${uniqueFilename}`;

        uploadedResults.push({
          originalName,
          filename: uniqueFilename,
          url: publicUrl,
          size: file.size,
          mimeType
        });
      } catch (err: any) {
        errors.push({ filename: file.name, error: err.message || 'Write failed' });
      }
    }

    return NextResponse.json({
      success: uploadedResults.length > 0,
      total_received: files.length,
      uploaded_count: uploadedResults.length,
      failed_count: errors.length,
      files: uploadedResults,
      errors: errors.length > 0 ? errors : undefined
    });

  } catch (error: any) {
    console.error('Gallery Upload Error:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Bulk upload failed'
    }, { status: 500 });
  }
}
