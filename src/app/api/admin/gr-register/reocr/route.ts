import { NextRequest, NextResponse } from 'next/server';
import { getAllAiConnections } from '@/lib/ai/aiConnectionService';
import { decryptApiKey } from '@/lib/utils/encryption';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// POST /api/admin/gr-register/reocr - Re-run single image / crop Dual-AI scan
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { image_base64, image_path, raw_line } = body;

    const connections = await getAllAiConnections();
    const hfConn = connections.find(c => c.provider === 'huggingface' && c.is_active);
    const hfKey = (hfConn ? decryptApiKey(hfConn.encrypted_key) : '') || process.env.HF_TOKEN || '';

    if (!hfKey && !raw_line) {
      return NextResponse.json({ success: false, error: 'AI key not available for re-OCR' }, { status: 400 });
    }

    // Fast AI parse
    const res = await fetch('https://router.huggingface.co/together/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${hfKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'meta-llama/Llama-3.3-70B-Instruct-Turbo',
        messages: [
          {
            role: 'system',
            content: 'You are an accurate school register parser. Output strict JSON array ONLY.'
          },
          {
            role: 'user',
            content: `Re-evaluate this handwriting line or segment into JSON: [{\"gr\": 123, \"name\": \"...\", \"class\": \"...\"}]:\n\n${raw_line || ''}`
          }
        ],
        max_tokens: 300
      })
    });

    if (res.status === 200) {
      const json = await res.json();
      const content = json.choices?.[0]?.message?.content || '';
      const match = content.match(/\[[\s\S]*\]/);
      const parsed = match ? JSON.parse(match[0]) : [];

      return NextResponse.json({
        success: true,
        reocr_results: parsed,
        raw_response: content
      });
    }

    return NextResponse.json({ success: false, error: 'Re-OCR failed with status ' + res.status }, { status: 502 });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message || 'Re-OCR error' }, { status: 500 });
  }
}
