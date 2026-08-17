import { NextRequest, NextResponse } from 'next/server';
import { HfInference } from '@huggingface/inference';
import { parseAdmissionFormText } from '@/lib/utils/formOcrParser';
import { getActiveAiConnection, getAllAiConnections } from '@/lib/ai/aiConnectionService';
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
    const { connection, decryptedKey } = await getActiveAiConnection();
    const allConnections = await getAllAiConnections();

    // 2. If Local Engine is selected as default
    if (connection.provider === 'local' || connection.model_id === 'local-wasm-tesseract') {
      return NextResponse.json({
        success: false,
        use_local_engine: true,
        message: 'Unlimited Local Engine active',
        data: parseAdmissionFormText('')
      });
    }

    // 3. Prompt for Document Extraction
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
    let engineUsed = connection.name || 'AI Vision Engine';

    // 4. Try Active OpenRouter Connection
    if (connection.provider === 'openrouter' && decryptedKey) {
      const modelToUse = connection.model_id || 'google/gemini-2.0-flash-exp:free';
      try {
        const orResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${decryptedKey}`,
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
            max_tokens: 800,
            temperature: 0.1
          })
        });

        const orData = await orResponse.json();
        const rawContent = orData.choices?.[0]?.message?.content || '';
        const jsonMatch = rawContent.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          parsedResult = JSON.parse(jsonMatch[0]);
          engineUsed = `${connection.name} (${modelToUse})`;
        }
      } catch (err: any) {
        console.warn(`OpenRouter primary failed:`, err.message);
      }
    }

    // 5. Try Active Hugging Face Connection
    if (!parsedResult && connection.provider === 'huggingface' && decryptedKey) {
      const hf = new HfInference(decryptedKey);
      const modelToUse = connection.model_id || 'Qwen/Qwen2.5-VL-72B-Instruct';

      try {
        const response = await hf.chatCompletion({
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
          max_tokens: 800,
          temperature: 0.1
        });

        const rawContent = response.choices?.[0]?.message?.content || '';
        const jsonMatch = rawContent.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          parsedResult = JSON.parse(jsonMatch[0]);
          engineUsed = `${connection.name} (${modelToUse})`;
        }
      } catch (err: any) {
        console.warn(`Primary connection ${connection.name} failed:`, err.message);

        // Try Backup Hugging Face Connections if available
        const backupConns = allConnections.filter(c => c.id !== connection.id && c.is_active && c.provider === 'huggingface' && c.encrypted_key);
        for (const backup of backupConns) {
          const backupKey = decryptApiKey(backup.encrypted_key);
          if (!backupKey) continue;

          try {
            const hfBackup = new HfInference(backupKey);
            const backupModel = backup.model_id || 'Qwen/Qwen2.5-VL-7B-Instruct';
            const resBackup = await hfBackup.chatCompletion({
              model: backupModel,
              messages: [
                {
                  role: 'user',
                  content: [
                    { type: 'text', text: promptText },
                    { type: 'image_url', image_url: { url: base64DataUrl } }
                  ]
                }
              ],
              max_tokens: 800,
              temperature: 0.1
            });

            const rawB = resBackup.choices?.[0]?.message?.content || '';
            const jsonB = rawB.match(/\{[\s\S]*\}/);
            if (jsonB) {
              parsedResult = JSON.parse(jsonB[0]);
              engineUsed = `${backup.name} (Backup)`;
              break;
            }
          } catch {}
        }
      }
    }

    if (parsedResult && (parsedResult.student_name || parsedResult.father_name)) {
      return NextResponse.json({
        success: true,
        engine: engineUsed,
        data: parsedResult
      });
    }

    // 5. Automatic Fallback to Local Engine if cloud limits reached
    return NextResponse.json({
      success: false,
      quota_exceeded: true,
      use_local_engine: true,
      error: 'Cloud inference credits exhausted. Falling back to Unlimited Local Engine.',
      data: parseAdmissionFormText('')
    }, { status: 200 });

  } catch (error: any) {
    console.warn('Scanner extract route notice:', error.message);
    return NextResponse.json({
      success: false,
      quota_exceeded: true,
      use_local_engine: true,
      error: error.message || 'Switched to Unlimited Local OCR Engine',
      data: parseAdmissionFormText('')
    }, { status: 200 });
  }
}
