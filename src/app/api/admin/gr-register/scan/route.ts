import { NextRequest, NextResponse } from 'next/server';
import { parseGrLedgerText, ScannedGrCandidate } from '@/lib/utils/grOcrScanner';
import { getAllAiConnections } from '@/lib/ai/aiConnectionService';
import { decryptApiKey } from '@/lib/utils/encryption';
import { evaluateDualAiRecordConsensus } from '@/lib/utils/consensusEngine';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const startTime = Date.now();

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

    const promptText = `You are a forensic Document Digitizer for General Register (G.R.) school/college ledger notebooks.
Extract every row in this handwritten register photograph containing:
- GR Number (e.g. 116, 139, 301, 1229)
- Student Full Name (in Title Case, e.g. "Ubaid Shaikh", "Shaheeryar", "M. Hamza")
- Class / Academic Stream (e.g. "Class XI - Pre-Medical", "Class XI - Pre-Engineering", "Class XII - Commerce", "Class X - Science", "B.Com / ADC")

Return ONLY a valid JSON array format:
[
  { "gr": 139, "name": "Ubaid Shaikh", "class": "Class XII - Pre-Engineering" },
  { "gr": 140, "name": "Umer Khanzada", "class": "Class XII - Pre-Engineering" }
]`;

    let openRouterCandidates: ScannedGrCandidate[] = [];
    let huggingFaceCandidates: ScannedGrCandidate[] = [];
    
    const providerStatuses: {
      hugging_face: 'CONNECTED' | 'UNAVAILABLE' | 'AUTHENTICATION_FAILED' | 'NOT_CONFIGURED';
      open_router: 'CONNECTED' | 'UNAVAILABLE' | 'AUTHENTICATION_FAILED' | 'NOT_CONFIGURED';
      neural_ocr: 'READY';
    } = {
      hugging_face: 'NOT_CONFIGURED',
      open_router: 'NOT_CONFIGURED',
      neural_ocr: 'READY'
    };

    const connections = await getAllAiConnections();

    // 1. OPENROUTER VISION PASS
    if (imageBase64) {
      const orConn = connections.find(c => c.provider === 'openrouter' && c.is_active);
      const orKey = (orConn ? decryptApiKey(orConn.encrypted_key) : '') || process.env.OPENROUTER_API_KEY || '';

      if (orKey) {
        try {
          const modelToUse = (orConn?.model_id && !orConn.model_id.includes(':free')) ? orConn.model_id : 'openrouter/free';
          const orRes = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${orKey}`,
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
                    { type: 'text', text: promptText },
                    { type: 'image_url', image_url: { url: imageBase64 } }
                  ]
                }
              ],
              max_tokens: 2000
            })
          });

          if (orRes.status === 200) {
            providerStatuses.open_router = 'CONNECTED';
            const orJson = await orRes.json();
            const orContent = orJson.choices?.[0]?.message?.content || '';

            let parsed: any = null;
            const arrayMatch = orContent.match(/\[[\s\S]*\]/);
            if (arrayMatch) {
              try { parsed = JSON.parse(arrayMatch[0]); } catch {}
            }
            if (!parsed) {
              try { parsed = JSON.parse(orContent.replace(/```(?:json)?/gi, '').replace(/```/g, '').trim()); } catch {}
            }

            if (Array.isArray(parsed) && parsed.length > 0) {
              openRouterCandidates = parsed.map((item: any, idx: number) => {
                const grNum = parseInt(item.gr || item.gr_number || item.gr_no, 10);
                return {
                  id: `scan_or_${grNum || idx}_${Date.now()}`,
                  gr_number: grNum || idx + 1,
                  gr_code: `GR-${grNum || idx + 1}`,
                  student_name: (item.name || item.student_name || '').trim(),
                  class_name: item.class || item.class_name || 'Class XI - Science',
                  confidence: 90,
                  raw_line: `${grNum} | ${item.name} | ${item.class}`,
                  selected: true,
                  action_type: (item.name ? 'assign' : 'blank') as 'assign' | 'blank',
                  notes: `OpenRouter (${modelToUse})`
                };
              }).filter(c => c.gr_number > 0);
            }
          } else if (orRes.status === 401) {
            providerStatuses.open_router = 'AUTHENTICATION_FAILED';
          } else {
            providerStatuses.open_router = 'UNAVAILABLE';
          }
        } catch (orErr: any) {
          console.warn('OpenRouter Vision fetch notice:', orErr.message);
          providerStatuses.open_router = 'UNAVAILABLE';
        }
      }
    }

    // 2. HUGGING FACE ROUTER PASS
    const hfConn = connections.find(c => c.provider === 'huggingface' && c.is_active);
    const hfKey = (hfConn ? decryptApiKey(hfConn.encrypted_key) : '') || process.env.HF_TOKEN || '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';

    if (hfKey) {
      try {
        const hfModel = hfConn?.model_id || 'meta-llama/Llama-3.3-70B-Instruct-Turbo';
        const hfRes = await fetch('https://router.huggingface.co/together/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${hfKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model: hfModel,
            messages: [
              {
                role: 'system',
                content: 'You are an expert handwriting transcript extraction assistant for school registers.'
              },
              {
                role: 'user',
                content: rawText 
                  ? `${promptText}\n\nHere is the raw OCR transcript:\n${rawText}` 
                  : 'Return a clean empty JSON array: []'
              }
            ],
            max_tokens: 1500
          })
        });

        if (hfRes.status === 200) {
          providerStatuses.hugging_face = 'CONNECTED';
          const hfJson = await hfRes.json();
          const hfContent = hfJson.choices?.[0]?.message?.content || '';

          let parsed: any = null;
          const arrayMatch = hfContent.match(/\[[\s\S]*\]/);
          if (arrayMatch) {
            try { parsed = JSON.parse(arrayMatch[0]); } catch {}
          }
          if (!parsed) {
            try { parsed = JSON.parse(hfContent.replace(/```(?:json)?/gi, '').replace(/```/g, '').trim()); } catch {}
          }

          if (Array.isArray(parsed) && parsed.length > 0) {
            huggingFaceCandidates = parsed.map((item: any, idx: number) => {
              const grNum = parseInt(item.gr || item.gr_number || item.gr_no, 10);
              return {
                id: `scan_hf_${grNum || idx}_${Date.now()}`,
                gr_number: grNum || idx + 1,
                gr_code: `GR-${grNum || idx + 1}`,
                student_name: (item.name || item.student_name || '').trim(),
                class_name: item.class || item.class_name || 'Class XI - Science',
                confidence: 90,
                raw_line: `${grNum} | ${item.name} | ${item.class}`,
                selected: true,
                action_type: (item.name ? 'assign' : 'blank') as 'assign' | 'blank',
                notes: `Hugging Face (${hfModel})`
              };
            }).filter(c => c.gr_number > 0);
          }
        } else if (hfRes.status === 401) {
          providerStatuses.hugging_face = 'AUTHENTICATION_FAILED';
        } else {
          providerStatuses.hugging_face = 'UNAVAILABLE';
        }
      } catch (hfErr: any) {
        console.warn('Hugging Face fetch notice:', hfErr.message);
        providerStatuses.hugging_face = 'UNAVAILABLE';
      }
    }

    // 3. MULTI-PASS NEURAL PARSER IF REQUIRED
    let neuralCandidates: ScannedGrCandidate[] = [];
    if (rawText) {
      neuralCandidates = parseGrLedgerText(rawText);
    }

    // 4. MATHEMATICAL FIELD-LEVEL DUAL-AI CONSENSUS
    const allGrNumbers = new Set<number>([
      ...openRouterCandidates.map(c => c.gr_number),
      ...huggingFaceCandidates.map(c => c.gr_number),
      ...neuralCandidates.map(c => c.gr_number)
    ]);

    const finalCandidates: ScannedGrCandidate[] = [];

    allGrNumbers.forEach(grNum => {
      const orCand = openRouterCandidates.find(c => c.gr_number === grNum) || null;
      const hfCand = huggingFaceCandidates.find(c => c.gr_number === grNum) || null;
      const localCand = neuralCandidates.find(c => c.gr_number === grNum) || null;

      // Evaluate consensus mathematically
      const evaluation = evaluateDualAiRecordConsensus(
        hfCand || localCand,
        orCand || localCand
      );

      const resolvedName = evaluation.student_name.consensus_value || '';
      const resolvedClass = evaluation.class_name.consensus_value || 'Class XI - Science';

      finalCandidates.push({
        id: `cand_${grNum}_${Date.now()}`,
        gr_number: grNum,
        gr_code: `GR-${grNum}`,
        student_name: resolvedName,
        class_name: resolvedClass,
        confidence: evaluation.composite_confidence,
        raw_line: orCand?.raw_line || hfCand?.raw_line || localCand?.raw_line || `GR-${grNum}`,
        selected: true,
        action_type: (resolvedName ? 'assign' : 'blank') as 'assign' | 'blank',
        notes: evaluation.consensus_notes
      });
    });

    finalCandidates.sort((a, b) => a.gr_number - b.gr_number);

    const verifiedCount = finalCandidates.filter(c => c.confidence >= 90).length;
    const reviewCount = finalCandidates.filter(c => c.confidence < 90 && c.student_name).length;
    const durationMs = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      total_detected: finalCandidates.length,
      verified_count: verifiedCount,
      needs_review_count: reviewCount,
      duration_ms: durationMs,
      provider_statuses: providerStatuses,
      candidates: finalCandidates
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message || 'Scan error'
    }, { status: 500 });
  }
}
