import { NextResponse } from 'next/server';
import { parseAdmissionFormText } from '@/lib/utils/formOcrParser';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { raw_text } = body;
    const parsed = parseAdmissionFormText(raw_text || '');
    return NextResponse.json({
      success: true,
      data: parsed
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message || 'Parser error'
    }, { status: 500 });
  }
}
