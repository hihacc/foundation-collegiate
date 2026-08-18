import { NextRequest, NextResponse } from 'next/server';
import { parseGrLedgerText } from '@/lib/utils/grOcrScanner';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { raw_text } = body;

    if (!raw_text || typeof raw_text !== 'string') {
      return NextResponse.json({
        success: false,
        error: 'raw_text string is required for scanning'
      }, { status: 400 });
    }

    const candidates = parseGrLedgerText(raw_text);

    return NextResponse.json({
      success: true,
      total_detected: candidates.length,
      candidates
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message || 'Scan error'
    }, { status: 500 });
  }
}
