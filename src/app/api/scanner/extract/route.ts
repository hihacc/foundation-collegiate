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

    // Vision Models on Hugging Face
    const visionModels = [
      'Qwen/Qwen2.5-VL-72B-Instruct',
      'Qwen/Qwen2.5-VL-7B-Instruct',
      'meta-llama/Llama-3.2-11B-Vision-Instruct',
      'meta-llama/Llama-3.2-90B-Vision-Instruct'
    ];

    const promptText = `You are an expert OCR Document Digitizer for "The Foundation Collegiate" school & college admission forms.
Analyze this physical paper admission form carefully. The form has printed labels and handwritten pen entries.
Extract all student and parent details accurately from the handwriting:
1. Student Full Name (in capital letters)
2. Date of birth (e.g. 18-June-2003 or YYYY-MM-DD)
3. Religion (Islam or Non-Muslim)
4. Nationality (Pakistani)
5. CNIC / B-Form #
6. Residential Address
7. Parent Cell # (Phone)
8. Student Cell #
9. Previous School / College
10. Father / Guardian Name
11. Father Occupation
12. Class Applied (e.g. Class IX - Science / Biology, Class VIII, Class X, Class XI, Class XII, ADC 1, ADC 2, DIT)
13. G.R. No. (if written)

Return ONLY valid JSON matching this schema:
{
  "student_name": "Full name in CAPITAL letters",
  "father_name": "Father / Guardian Name",
  "dob": "Date of birth",
  "religion": "Islam",
  "nationality": "Pakistani",
  "cnic": "",
  "address": "Residential address",
  "parent_phone": "Primary cell phone",
  "student_phone": "",
  "parent_email": "",
  "previous_school": "Name of previous school",
  "father_occupation": "Father's occupation",
  "father_office_phone": "",
  "class_name": "Class IX - Science / Biology",
  "notes": "G.R. No. or remarks"
}`;

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
          max_tokens: 800
        });

        const rawContent = response.choices?.[0]?.message?.content || '';
        const jsonMatch = rawContent.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          parsedResult = JSON.parse(jsonMatch[0]);
          successfulModel = model;
          break;
        }
      } catch (err: any) {
        console.warn(`Hugging Face model ${model} attempt notice:`, err.message);
      }
    }

    if (parsedResult && parsedResult.student_name) {
      return NextResponse.json({
        success: true,
        engine: `Hugging Face (${successfulModel})`,
        data: parsedResult
      });
    }

    // Fallback: Return empty schema structure if vision models were unreachable
    return NextResponse.json({
      success: false,
      error: 'Could not extract text with Hugging Face models',
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
