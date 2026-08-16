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

        const geminiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text: `You are an expert OCR & Document Digitization assistant for "The Foundation Collegiate" school & college admissions.
Analyze this physical admission form and extract all student and parent details accurately into JSON.
Return ONLY valid JSON matching this schema:
{
  "student_name": "Full name in CAPITAL letters",
  "father_name": "Father / Guardian Name",
  "dob": "Date of birth in YYYY-MM-DD or DD-MM-YYYY format",
  "religion": "Islam or Non-Muslim",
  "nationality": "Pakistani or other",
  "cnic": "CNIC or B-Form number e.g. 42101-1234567-1",
  "address": "Residential address",
  "parent_phone": "Primary cell / phone number",
  "student_phone": "Student phone if present",
  "parent_email": "Email address if present",
  "previous_school": "Name of previous school / college attended",
  "father_occupation": "Father's occupation / profession",
  "father_office_phone": "Office phone if present",
  "class_name": "Exact class e.g. Class IX - Computer Science, Class XI - Pre-Medical, Class XII - Commerce, ADC 1, ADC 2, Diploma in Information Technology (DIT)",
  "notes": "Any other relevant remarks on the form"
}`
                  },
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
            const parsedJson = JSON.parse(textOut);
            return NextResponse.json({
              success: true,
              engine: 'Gemini Vision AI',
              data: parsedJson
            });
          }
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
