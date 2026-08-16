const fs = require('fs');
const path = require('path');

const testKey = 'AQ.Ab8RN6LGRQjt1c4rIVcu3La-AaVM_Eau4g8ctBDm2_D6BkFHiw';
const imgPath = 'C:/Users/Ibrah/.gemini/antigravity/brain/85a71107-6e7c-4a77-ac31-7abf68e677e5/.user_uploaded/media_1786878506064.png';

async function testPhysicalFormScan() {
  console.log('Reading user admission form image...');
  const imgBuffer = fs.readFileSync(imgPath);
  const base64Data = imgBuffer.toString('base64');
  console.log('Image read, size:', Math.round(base64Data.length / 1024), 'KB');

  const modelsToTest = ['gemini-2.5-flash-lite', 'gemini-flash-latest', 'gemini-3.7-flash', 'gemini-3.5-flash', 'gemini-pro-latest'];

  for (const model of modelsToTest) {
    console.log(`Testing model: ${model}...`);
    try {
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${testKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: `You are an expert OCR & Document Digitization assistant for "The Foundation Collegiate" school & college admissions.
Look closely at this physical paper admission form. It contains printed labels and handwritten pen entries.
Extract all details filled in pen/ink:
1. Student Full Name (e.g., AREEBA AMJAD)
2. Date of birth (e.g., 18-June-2003)
3. Religion (Islam or Non-Muslim)
4. Nationality (Pakistani)
5. CNIC / B-Form #
6. Residential Address (e.g., B-466 Sector 11/E North Karachi)
7. Parent Cell # (e.g., 0300-2415264)
8. Student Phone (e.g., 0341-2373287)
9. Parent Email
10. Previous School / College (e.g., The Muslim Generation School)
11. Father / Guardian Name (e.g., M. Amjad)
12. Father Occupation (e.g., Personal business)
13. Class Applied (e.g., Class IX - Science / Biology, Class VIII, Class X, Class XI, Class XII, ADC 1, ADC 2)
14. G.R. No. (e.g. 562)

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
  "notes": "G.R. No. 562 or any other remarks"
}`
                },
                {
                  inline_data: {
                    mime_type: 'image/png',
                    data: base64Data
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

      console.log(`Model ${model} HTTP status:`, res.status);
      if (res.ok) {
        const data = await res.json();
        const textOut = data.candidates?.[0]?.content?.parts?.[0]?.text;
        console.log(`\n🎉 SUCCESSFUL EXTRACTION FROM MODEL ${model}:\n`, textOut);
        return;
      } else {
        const errData = await res.text();
        console.log(`Model ${model} failed:`, errData.slice(0, 200));
      }
    } catch (e) {
      console.log(`Model ${model} error:`, e.message);
    }
  }
}

testPhysicalFormScan();
