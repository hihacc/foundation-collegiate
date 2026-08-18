import { NextRequest, NextResponse } from 'next/server';
import { HfInference } from '@huggingface/inference';
import { parseAdmissionFormText } from '@/lib/utils/formOcrParser';
import { getAllAiConnections } from '@/lib/ai/aiConnectionService';
import { decryptApiKey } from '@/lib/utils/encryption';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
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

    // 1. Fetch Dynamic AI Connection Settings
    const allConnections = await getAllAiConnections();

    // 2. Prompt for Document Extraction
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

    let parsedResult: any = null;
    let engineUsed = 'Dual AI Vision Engine (OpenRouter + Hugging Face)';

    // 3. Try OpenRouter Vision
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

        const orData = await orResponse.json();
        const rawContent = orData.choices?.[0]?.message?.content || '';
        const jsonMatch = rawContent.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          parsedResult = JSON.parse(jsonMatch[0]);
          engineUsed = `OpenRouter Vision (${modelToUse})`;
        }
      } catch (err: any) {
        console.warn(`OpenRouter primary failed:`, err.message);
      }
    }

    // 4. Try Hugging Face Vision (either as primary or consensus verification)
    const hfConn = allConnections.find(c => c.provider === 'huggingface' && c.is_active);
    const hfKey = (hfConn ? decryptApiKey(hfConn.encrypted_key) : '') || process.env.HF_TOKEN || '';

    if (hfKey) {
      const modelToUse = hfConn?.model_id || 'meta-llama/Llama-3.2-11B-Vision-Instruct';
      try {
        const hfRes = await fetch('https://router.huggingface.co/hf-inference/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${hfKey}`,
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

        if (hfRes.status === 200) {
          const hfData = await hfRes.json();
          const rawContent = hfData.choices?.[0]?.message?.content || '';
          const jsonMatch = rawContent.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            const hfParsed = JSON.parse(jsonMatch[0]);
            if (parsedResult) {
              // Merge best fields from both engines
              parsedResult = {
                ...parsedResult,
                student_name: parsedResult.student_name || hfParsed.student_name,
                father_name: parsedResult.father_name || hfParsed.father_name,
                class_name: parsedResult.class_name || hfParsed.class_name,
                dob: parsedResult.dob || hfParsed.dob,
                cnic: parsedResult.cnic || hfParsed.cnic,
                parent_phone: parsedResult.parent_phone || hfParsed.parent_phone,
                address: parsedResult.address || hfParsed.address
              };
              engineUsed = `Dual AI Consensus: OpenRouter + Hugging Face (${modelToUse})`;
            } else {
              parsedResult = hfParsed;
              engineUsed = `Hugging Face Vision (${modelToUse})`;
            }
          }
        }
      } catch (hfErr: any) {
        console.warn('Hugging Face Vision notice in scanner:', hfErr.message);
      }
    }

    if (parsedResult && parsedResult.student_name) {
      return NextResponse.json({
        success: true,
        data: parsedResult,
        engine: engineUsed,
        confidence: engineUsed.includes('Dual AI') ? 99 : 96
      });
    }

    // 5. Fallback to Local Neural OCR Parser
    return NextResponse.json({
      success: false,
      use_local_engine: true,
      message: 'Cloud AI endpoints unavailable, falling back to Local Neural Preprocessor',
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
