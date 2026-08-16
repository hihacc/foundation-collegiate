const fs = require('fs');
const { HfInference } = require('@huggingface/inference');

const token = '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';
const hf = new HfInference(token);

const imgPath = 'C:/Users/Ibrah/.gemini/antigravity/brain/85a71107-6e7c-4a77-ac31-7abf68e677e5/.user_uploaded/media_1786893228506.jpg';

async function testHuggingFace() {
  console.log('Testing Hugging Face token with admission form image...');
  const imgBuffer = fs.readFileSync(imgPath);
  const base64Img = imgBuffer.toString('base64');
  const dataUrl = `data:image/jpeg;base64,${base64Img}`;

  // 1. Test Qwen2.5-VL or Llama Vision via chatCompletion
  const visionModels = [
    'Qwen/Qwen2.5-VL-72B-Instruct',
    'Qwen/Qwen2.5-VL-7B-Instruct',
    'meta-llama/Llama-3.2-11B-Vision-Instruct',
    'meta-llama/Llama-3.2-90B-Vision-Instruct'
  ];

  for (const model of visionModels) {
    console.log(`\n--- Testing Hugging Face Model: ${model} ---`);
    try {
      const response = await hf.chatCompletion({
        model: model,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: `You are an expert OCR document digitizer for "The Foundation Collegiate" school & college admission forms.
Extract all details filled in the physical form into structured JSON:
{
  "student_name": "Name in capital letters",
  "father_name": "Father / Guardian Name",
  "dob": "Date of birth e.g. 18-June-2003",
  "religion": "Islam",
  "nationality": "Pakistani",
  "cnic": "CNIC if present",
  "address": "Residential address",
  "parent_phone": "Phone / Cell #",
  "student_phone": "Student phone",
  "previous_school": "School / College",
  "father_occupation": "Occupation",
  "class_name": "Class applied",
  "notes": "G.R. No. or remarks"
}
Return ONLY valid JSON.`
              },
              {
                type: 'image_url',
                image_url: { url: dataUrl }
              }
            ]
          }
        ],
        max_tokens: 800
      });

      console.log(`✅ SUCCESS WITH ${model}!`);
      console.log('Output:\n', response.choices[0].message.content);
      return;
    } catch (err) {
      console.log(`❌ Model ${model} error:`, err.message);
    }
  }

  // 2. Test TrOCR Handwritten model fallback
  console.log('\n--- Testing TrOCR Handwritten ---');
  try {
    const ocrRes = await hf.imageToText({
      model: 'microsoft/trocr-large-handwritten',
      data: imgBuffer
    });
    console.log('TrOCR result:', ocrRes);
  } catch (err) {
    console.log('TrOCR error:', err.message);
  }
}

testHuggingFace();
