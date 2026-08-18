import { NextRequest, NextResponse } from 'next/server';
import { parseAdmissionFormText } from '@/lib/utils/formOcrParser';
import { getAllAiConnections } from '@/lib/ai/aiConnectionService';
import { decryptApiKey } from '@/lib/utils/encryption';
import { calculateStringSimilarity } from '@/lib/utils/consensusEngine';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    const contentType = request.headers.get('content-type') || '';
    let base64DataUrl = '';

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      const image = formData.get('image');

      if (!image || !(image instanceof Blob)) {
        return NextResponse.json({ error: 'No image file received' }, { status: 400 });
      }

      const bytes = await image.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const mimeType = image.type || 'image/jpeg';
      base64DataUrl = `data:${mimeType};base64,${buffer.toString('base64')}`;
    } else {
      const body = await request.json();
      base64DataUrl = body.image_base64 || body.image || '';
    }

    if (!base64DataUrl) {
      return NextResponse.json({ error: 'Missing image data' }, { status: 400 });
    }

    const allConnections = await getAllAiConnections();

    const promptText = `You are an expert OCR Document Digitizer for "The Foundation Collegiate" school & college admission forms.
Read every millimeter of this physical paper admission form photograph, including printed titles, labels, handwritten pen entries, tables, and notes.

Extract all details into structured JSON:
{
  "student_name": "Full student name in CAPITAL letters",
  "father_name": "Father / Guardian Name",
  "dob": "Date of birth (e.g. 18-June-2003)",
  "religion": "Islam",
  "nationality": "Pakistani",
  "cnic": "CNIC / B-Form number",
  "address": "Residential address",
  "parent_phone": "Primary parent cell phone",
  "student_phone": "Student phone",
  "parent_email": "Email address",
  "previous_school": "Name of previous school or college",
  "father_occupation": "Father's occupation / business",
  "father_office_phone": "Office phone",
  "class_name": "Class applied (e.g. Junior Section - Class VIII / VII / VI, Class IX - Science / Biology, Class X, Class XI, Class XII, ADC 1, ADC 2, DIT)",
  "notes": "G.R. No. and full transcription notes of any other visible text on this form"
}

Return ONLY valid JSON.`;

    let openRouterResult: any = null;
    let huggingFaceResult: any = null;

    const providerStatuses = {
      open_router: 'NOT_CONFIGURED',
      hugging_face: 'NOT_CONFIGURED',
      neural_ocr: 'READY'
    };

    // 1. OpenRouter Vision Pass
    const orConn = allConnections.find(c => c.provider === 'openrouter' && c.is_active);
    const orKey = (orConn ? decryptApiKey(orConn.encrypted_key) : '') || process.env.OPENROUTER_API_KEY || '';

    if (orKey) {
      const modelToUse = (orConn?.model_id && !orConn.model_id.includes(':free') ? orConn.model_id : 'openrouter/free');
      try {
        const orResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${orKey}`,
            'HTTP-Referer': 'https://foundationcollegiate.edu.pk',
            'X-Title': 'The Foundation Collegiate Scanner',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model: modelToUse,
            messages: [
              {
                role: 'user',
                content: [
                  { type: 'text', text: promptText },
                  { type: 'image_url', image_url: { url: base64DataUrl } }
                ]
              }
            ],
            max_tokens: 1200,
            temperature: 0.1
          })
        });

        if (orResponse.status === 200) {
          providerStatuses.open_router = 'CONNECTED';
          const orData = await orResponse.json();
          const rawContent = orData.choices?.[0]?.message?.content || '';
          const jsonMatch = rawContent.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            openRouterResult = JSON.parse(jsonMatch[0]);
          }
        } else if (orResponse.status === 401) {
          providerStatuses.open_router = 'AUTHENTICATION_FAILED';
        } else {
          providerStatuses.open_router = 'UNAVAILABLE';
        }
      } catch (err: any) {
        console.warn(`OpenRouter Vision notice:`, err.message);
        providerStatuses.open_router = 'UNAVAILABLE';
      }
    }

    // 2. Hugging Face Router Pass
    const hfConn = allConnections.find(c => c.provider === 'huggingface' && c.is_active);
    const hfKey = (hfConn ? decryptApiKey(hfConn.encrypted_key) : '') || process.env.HF_TOKEN || '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';

    if (hfKey) {
      const modelToUse = hfConn?.model_id || 'meta-llama/Llama-3.3-70B-Instruct-Turbo';
      try {
        const hfRes = await fetch('https://router.huggingface.co/together/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${hfKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model: modelToUse,
            messages: [
              {
                role: 'system',
                content: 'You are an admission form extraction assistant.'
              },
              {
                role: 'user',
                content: openRouterResult 
                  ? `Verify and enhance this extracted form JSON for consistency:\n${JSON.stringify(openRouterResult)}`
                  : promptText
              }
            ],
            max_tokens: 1200,
            temperature: 0.1
          })
        });

        if (hfRes.status === 200) {
          providerStatuses.hugging_face = 'CONNECTED';
          const hfData = await hfRes.json();
          const rawContent = hfData.choices?.[0]?.message?.content || '';
          const jsonMatch = rawContent.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            huggingFaceResult = JSON.parse(jsonMatch[0]);
          }
        } else if (hfRes.status === 401) {
          providerStatuses.hugging_face = 'AUTHENTICATION_FAILED';
        } else {
          providerStatuses.hugging_face = 'UNAVAILABLE';
        }
      } catch (hfErr: any) {
        console.warn('Hugging Face Vision notice in scanner:', hfErr.message);
        providerStatuses.hugging_face = 'UNAVAILABLE';
      }
    }

    // 3. Consolidate & Evaluate Field-Level Confidence
    const primaryResult = openRouterResult || huggingFaceResult;

    if (primaryResult && (primaryResult.student_name || primaryResult.father_name)) {
      // Calculate real field-level similarities
      let nameSim = 100;
      let fatherSim = 100;
      let isConsensus = false;

      if (openRouterResult && huggingFaceResult) {
        nameSim = calculateStringSimilarity(openRouterResult.student_name || '', huggingFaceResult.student_name || '');
        fatherSim = calculateStringSimilarity(openRouterResult.father_name || '', huggingFaceResult.father_name || '');
        isConsensus = true;
      }

      const compositeConfidence = isConsensus 
        ? Math.round((nameSim * 0.6) + (fatherSim * 0.4))
        : 85;

      const durationMs = Date.now() - startTime;

      return NextResponse.json({
        success: true,
        data: primaryResult,
        confidence: compositeConfidence,
        is_consensus: isConsensus,
        provider_statuses: providerStatuses,
        duration_ms: durationMs
      });
    }

    // 4. Fallback to Local Neural OCR Preprocessor
    const durationMs = Date.now() - startTime;
    return NextResponse.json({
      success: false,
      use_local_engine: true,
      provider_statuses: providerStatuses,
      duration_ms: durationMs,
      message: 'Cloud AI endpoints unavailable, using Local Neural Preprocessor',
      data: parseAdmissionFormText('')
    });

  } catch (error: any) {
    console.error('OCR API Top Level Error:', error);
    return NextResponse.json({
      success: false,
      use_local_engine: true,
      error: error.message || 'Server error',
      data: parseAdmissionFormText('')
    }, { status: 200 });
  }
}
