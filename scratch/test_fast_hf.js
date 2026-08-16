const fs = require('fs');
const { HfInference } = require('@huggingface/inference');

const token = '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';
const hf = new HfInference(token);
const imgPath = 'C:/Users/Ibrah/.gemini/antigravity/brain/85a71107-6e7c-4a77-ac31-7abf68e677e5/.user_uploaded/media_1786893228506.jpg';

async function testFastModel() {
  console.log('Testing fast Hugging Face Vision model Qwen2.5-VL-7B...');
  const imgBuffer = fs.readFileSync(imgPath);
  const base64Img = imgBuffer.toString('base64');
  const dataUrl = `data:image/jpeg;base64,${base64Img}`;

  const prompt = `Extract all text, student name, father name, dob, phone, address, previous school, and class from this paper admission form.
Return JSON with:
{
  "student_name": "CAPITAL LETTERS",
  "father_name": "",
  "dob": "",
  "religion": "Islam",
  "nationality": "Pakistani",
  "cnic": "",
  "address": "",
  "parent_phone": "",
  "student_phone": "",
  "parent_email": "",
  "previous_school": "",
  "father_occupation": "",
  "class_name": "",
  "notes": "G.R. No. or full text remarks"
}`;

  try {
    const res = await hf.chatCompletion({
      model: 'Qwen/Qwen2.5-VL-7B-Instruct',
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: prompt },
            { type: 'image_url', image_url: { url: dataUrl } }
          ]
        }
      ],
      max_tokens: 600
    });

    console.log('Qwen2.5-VL-7B Success!');
    console.log(res.choices[0].message.content);
  } catch (e) {
    console.error('7B error:', e.message);
  }
}

testFastModel();
