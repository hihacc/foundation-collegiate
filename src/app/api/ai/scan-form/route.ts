import { NextResponse } from 'next/server';
import { parseAdmissionFormText } from '@/lib/utils/formOcrParser';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { image_base64, raw_text, custom_api_key } = body;

    const apiKey = custom_api_key || process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;

    // If we have Gemini API Key and image base64, use Gemini Vision for handwriting extraction
    if (apiKey && image_base64) {
      try {
        const cleanBase64 = image_base64.replace(/^data:image\/\w+;base64,/, '');
        const mimeMatch = image_base64.match(/^data:(image\/\w+);base64,/);
        const mimeType = mimeMatch ? mimeMatch[1] : 'image/jpeg';

        const promptText = `You are an expert OCR & Document Digitization assistant for "The Foundation Collegiate" school & college admission forms.
Look at this physical paper admission form carefully. The form has printed labels and handwritten pen entries.
Extract all details filled in pen/ink:
1. Student Full Name (e.g., AREEBA AMJAD)
2. Date of birth (e.g., 18-June-2003 or 2003-06-18)
3. Religion (Islam or Non-Muslim)
4. Nationality (Pakistani)
5. CNIC / B-Form # (if written, else empty string)
6. Residential Address (e.g., B-466 Sector 11/E North Karachi)
7. Parent Cell # (e.g., 0300-2415264)
8. Student Phone (if written)
9. Parent Email (if written)
10. Previous School / College (e.g., The Muslim Generation School)
11. Father / Guardian Name (e.g., M. Amjad)
12. Father Occupation (e.g., Personal business)
13. Class Applied (e.g., Class VIII, Class IX - Science / Biology, Class IX - Computer Science, Class X, Class XI, Class XII, ADC 1, ADC 2)
14. G.R. No. (e.g. 562 if written)

Return ONLY valid JSON with this exact schema:
{
  "student_name": "Full name in CAPITAL letters",
  "father_name": "Father / Guardian Name",
  "dob": "Date of birth string",
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
  "notes": "G.R. No. 562 or any other remarks"
}`;

        // Try gemini-1.5-flash or gemini-2.0-flash
        const models = ['gemini-1.5-flash', 'gemini-2.0-flash', 'gemini-1.5-pro'];
        let parsedJson: any = null;

        for (const model of models) {
          try {
            const geminiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                contents: [
                  {
                    parts: [
                      { text: promptText },
                      {
                        inline_data: {
                          mime_type: mimeType,
                          data: cleanBase64
                        }
                      }
                    ]
                  }
                ],
                generationConfig: {
                  response_mime_type: 'application/json',
                  temperature: 0.1
                }
              })
            });

            if (geminiRes.ok) {
              const geminiData = await geminiRes.json();
              const textOut = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;
              if (textOut) {
                parsedJson = JSON.parse(textOut);
                break;
              }
            }
          } catch (e) {
            console.warn(`Model ${model} attempt notice:`, e);
          }
        }

        if (parsedJson && parsedJson.student_name) {
          return NextResponse.json({
            success: true,
            engine: 'Gemini Vision AI',
            data: parsedJson
          });
        }
      } catch (err: any) {
        console.warn('Gemini vision fallback notice:', err.message);
      }
    }

    // Fallback: Parse raw OCR text
    const parsed = parseAdmissionFormText(raw_text || '');
    return NextResponse.json({
      success: true,
      engine: 'Built-in Form OCR Parser',
      data: parsed
    });

  } catch (error: any) {
    console.error('Scan form error:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to scan document'
    }, { status: 500 });
  }
}
