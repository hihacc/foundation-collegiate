import { NextRequest, NextResponse } from 'next/server';
import { HfInference } from '@huggingface/inference';
import { parseAdmissionFormText } from '@/lib/utils/formOcrParser';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const HF_TOKEN = process.env.HF_TOKEN || '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';
const hf = new HfInference(HF_TOKEN);

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

    const visionModels = [
      'Qwen/Qwen2.5-VL-72B-Instruct',
      'meta-llama/Llama-3.2-11B-Vision-Instruct',
      'meta-llama/Llama-3.2-90B-Vision-Instruct'
    ];

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
  "class_name": "Class applied (e.g. Class IX - Science / Biology, Class X, Class XI, Class XII, ADC 1, ADC 2, DIT)",
  "notes": "G.R. No. and full transcription notes of any other visible text on this form"
}

Return ONLY valid JSON.`;

    let parsedResult: any = null;
    let successfulModel = '';

    for (const model of visionModels) {
      try {
        const response = await hf.chatCompletion({
          model: model,
          messages: [
            {
              role: 'user',
              content: [
                { type: 'text', text: promptText },
                {
                  type: 'image_url',
                  image_url: { url: base64DataUrl }
                }
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
          successfulModel = model;
          break;
        }
      } catch (err: any) {
        console.warn(`Hugging Face model ${model} notice:`, err.message);
      }
    }

    if (parsedResult && (parsedResult.student_name || parsedResult.father_name)) {
      return NextResponse.json({
        success: true,
        engine: `Hugging Face (${successfulModel})`,
        data: parsedResult
      });
    }

    // Fallback if vision models temporarily busy
    return NextResponse.json({
      success: false,
      error: 'Vision models busy, falling back to local OCR',
      data: parseAdmissionFormText('')
    }, { status: 422 });

  } catch (error: any) {
    console.error('Hugging Face extract API error:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Image processing failed'
    }, { status: 500 });
  }
}
