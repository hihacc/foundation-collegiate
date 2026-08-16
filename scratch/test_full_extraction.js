const fs = require('fs');
const { HfInference } = require('@huggingface/inference');

const token = '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';
const hf = new HfInference(token);

const imgPath = 'C:/Users/Ibrah/.gemini/antigravity/brain/85a71107-6e7c-4a77-ac31-7abf68e677e5/.user_uploaded/media_1786893228506.jpg';

async function testFullTextExtraction() {
  console.log('Testing Ultra-Deep Full Document Transcription & Extraction on Hugging Face...');
  const imgBuffer = fs.readFileSync(imgPath);
  const base64Img = imgBuffer.toString('base64');
  const dataUrl = `data:image/jpeg;base64,${base64Img}`;

  const prompt = `You are the chief document digitization and OCR AI for "The Foundation Collegiate".
Analyze every millimeter of this admission form photograph. Read all printed headings, field labels, printed instructions, handwritten blue/black ballpoint pen notes, table grids, checkboxes, and fee details.

Perform two tasks:
1. FULL DOCUMENT TRANSCRIPTION: Transcribe every single line of text on this paper form verbatim from top to bottom.
2. COMPREHENSIVE STRUCTURED EXTRACTION: Extract all particulars into detailed JSON.

Return ONLY a JSON object with this exact structure:
{
  "full_transcription": "Verbatim line-by-line full text transcript of the entire paper form from top to bottom...",
  "structured_data": {
    "gr_number": "G.R. number if present",
    "form_number": "Form #",
    "admission_date": "Date of admission",
    "student_name": "Full student name in CAPITAL letters",
    "father_name": "Father / Guardian Name",
    "dob": "Date of birth (e.g. 18-June-2003)",
    "dob_words": "Date of birth in words if present",
    "religion": "Islam / Non-Muslim",
    "nationality": "Pakistani",
    "cnic": "Student CNIC or B-Form #",
    "address": "Residential address",
    "permanent_address": "Permanent address",
    "parent_phone": "Primary cell phone / WhatsApp",
    "student_phone": "Student phone / Alt phone",
    "parent_email": "Email address",
    "father_occupation": "Father occupation / business",
    "father_office_address": "Office address / work details",
    "father_cnic": "Father CNIC",
    "previous_school": "Name of previous school / college",
    "last_exam_passed": "Last class / exam passed",
    "class_applied": "Class applied (e.g. Class IX - Science / Biology, Class X, Class XI, Class XII, ADC 1, ADC 2, DIT)",
    "faculty_group": "Science / Computer Science / Commerce / Arts / Medical / Engineering / ADC / DIT",
    "selected_subjects": ["Subject 1", "Subject 2", "Subject 3"],
    "fee_details": {
      "admission_fee": "",
      "monthly_tuition": "",
      "total_fee": "",
      "receipt_number": ""
    },
    "remarks": "Any additional handwritten notes, serial numbers or signatures"
  }
}`;

  try {
    const response = await hf.chatCompletion({
      model: 'Qwen/Qwen2.5-VL-72B-Instruct',
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: prompt },
            { type: 'image_url', image_url: { url: dataUrl } }
          ]
        }
      ],
      max_tokens: 1800,
      temperature: 0.1
    });

    const output = response.choices[0].message.content;
    console.log('✅ ULTRA-DEEP EXTRACTION RESPONSE:\n', output);
  } catch (err) {
    console.error('Error:', err.message);
  }
}

testFullTextExtraction();
