import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const ALLOWED_MIME_TYPES = new Set([
  // Images
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  // Documents
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/plain',
  'text/csv',
  'application/zip',
  // Audio
  'audio/mpeg',
  'audio/mp3',
  'audio/ogg',
  'audio/wav',
  'audio/aac',
  'audio/mp4',
  // Video
  'video/mp4',
  'video/quicktime',
  'video/webm'
]);

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ success: false, error: 'No file provided' }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ success: false, error: 'File exceeds maximum size of 50MB' }, { status: 400 });
    }

    const mimeType = file.type || 'application/octet-stream';
    const originalName = file.name || `upload_${Date.now()}.dat`;
    const cleanFilename = originalName.replace(/[^a-zA-Z0-9.-]/g, '_');
    const uniqueFilename = `${Date.now()}_${cleanFilename}`;

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Save to public/uploads/whatsapp directory
    const uploadDir = join(process.cwd(), 'public', 'uploads', 'whatsapp');
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true });
    }

    const filePath = join(uploadDir, uniqueFilename);
    await writeFile(filePath, buffer);

    const publicUrl = `/uploads/whatsapp/${uniqueFilename}`;

    // Determine category
    let mediaCategory = 'document';
    if (mimeType.startsWith('image/')) mediaCategory = 'image';
    else if (mimeType.startsWith('audio/')) mediaCategory = 'audio';
    else if (mimeType.startsWith('video/')) mediaCategory = 'video';
    else if (mimeType === 'application/pdf') mediaCategory = 'document';

    return NextResponse.json({
      success: true,
      file: {
        filename: originalName,
        savedName: uniqueFilename,
        mimeType: mimeType,
        size: file.size,
        url: publicUrl,
        category: mediaCategory
      }
    });

  } catch (error: any) {
    console.error('File Upload Error:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'File upload failed'
    }, { status: 500 });
  }
}
