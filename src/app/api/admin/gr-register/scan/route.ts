import { NextRequest, NextResponse } from 'next/server';
import { parseGrLedgerText, ScannedGrCandidate } from '@/lib/utils/grOcrScanner';
import { getActiveAiConnection } from '@/lib/ai/aiConnectionService';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get('content-type') || '';
    let rawText = '';
    let imageBase64 = '';

    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      const image = formData.get('image');
      if (image && image instanceof Blob) {
        const bytes = await image.arrayBuffer();
        const buffer = Buffer.from(bytes);
        const mimeType = image.type || 'image/jpeg';
        imageBase64 = `data:${mimeType};base64,${buffer.toString('base64')}`;
      }
      rawText = (formData.get('raw_text') as string) || '';
    } else {
      const body = await req.json();
      rawText = body.raw_text || '';
      imageBase64 = body.image_base64 || body.image || '';
    }

    let candidates: ScannedGrCandidate[] = [];
    let engineUsed = 'Neural OCR Parser';

    // 1. If Image is provided and Cloud AI is active, run Cloud Vision
    if (imageBase64) {
      try {
        const { connection, decryptedKey } = await getActiveAiConnection();

        if (connection.provider === 'openrouter' && decryptedKey) {
          const modelToUse = (connection.model_id && !connection.model_id.includes(':free') ? connection.model_id : 'openrouter/free');
          const prompt = `You are an expert Document Digitizer for school/college General Register (G.R.) ledger notebooks.
Extract every row in this handwritten register photograph containing:
- GR Number (e.g. 116, 139, 301, 1229)
- Student Full Name (in Title Case, e.g. "Ubaid Shaikh", "Shaheeryar", "M. Hamza")
- Class / Academic Stream (e.g. "Class XI - Pre-Medical", "Class XI - Pre-Engineering", "Class XII - Commerce", "Class X - Science", "B.Com / ADC")

Return ONLY valid JSON array format:
[
  { "gr": 139, "name": "Ubaid Shaikh", "class": "Class XII - Pre-Engineering" },
  { "gr": 140, "name": "Umer Khanzada", "class": "Class XII - Pre-Engineering" }
]`;

          const aiRes = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${decryptedKey}`,
              'HTTP-Referer': 'https://foundationcollegiate.edu.pk',
              'X-Title': 'TFC G.R. Ledger Scanner',
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              model: modelToUse,
              messages: [
                {
                  role: 'user',
                  content: [
                    { type: 'text', text: prompt },
                    { type: 'image_url', image_url: { url: imageBase64 } }
                  ]
                }
              ],
              max_tokens: 2000
            })
          });

          const json = await aiRes.json();
          const content = json.choices?.[0]?.message?.content || '';
          
          // Parse JSON from code fences if present
          const cleanJson = content.replace(/```(?:json)?/gi, '').replace(/```/g, '').trim();
          const parsed = JSON.parse(cleanJson);

          if (Array.isArray(parsed) && parsed.length > 0) {
            candidates = parsed.map((item: any, idx: number) => {
              const grNum = parseInt(item.gr || item.gr_number || item.gr_no, 10);
              return {
                id: `scan_ai_${grNum || idx}_${Date.now()}`,
                gr_number: grNum || idx + 1,
                gr_code: `GR-${grNum || idx + 1}`,
                student_name: (item.name || item.student_name || '').trim(),
                class_name: item.class || item.class_name || 'Class XI - Science',
                confidence: 96,
                raw_line: `${grNum} | ${item.name} | ${item.class}`,
                selected: true,
                action_type: (item.name ? 'assign' : 'blank') as 'assign' | 'blank',
                notes: `AI Cloud Vision extraction (${modelToUse})`
              };
            }).filter(c => c.gr_number > 0);

            engineUsed = `Cloud Vision AI (${modelToUse})`;
          }
        }
      } catch (aiErr: any) {
        console.warn('Cloud vision notice for GR scanner:', aiErr.message);
      }
    }

    // 2. If candidates not yet generated or rawText provided, run neural OCR text parser
    if (candidates.length === 0 && rawText) {
      candidates = parseGrLedgerText(rawText);
      engineUsed = 'Neural OCR Parser';
    }

    return NextResponse.json({
      success: true,
      total_detected: candidates.length,
      engine_used: engineUsed,
      candidates
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message || 'Scan error'
    }, { status: 500 });
  }
}
