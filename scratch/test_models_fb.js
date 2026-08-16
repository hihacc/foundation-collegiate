const fs = require('fs');
const { HfInference } = require('@huggingface/inference');

const token = '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';
const hf = new HfInference(token);
const imgPath = 'C:/Users/Ibrah/.gemini/antigravity/brain/85a71107-6e7c-4a77-ac31-7abf68e677e5/.user_uploaded/media_1786893228506.jpg';

async function testAllHfModels() {
  const imgBuffer = fs.readFileSync(imgPath);
  const base64Img = imgBuffer.toString('base64');
  const dataUrl = `data:image/jpeg;base64,${base64Img}`;

  const models = [
    'Qwen/Qwen2.5-VL-72B-Instruct',
    'meta-llama/Llama-3.2-11B-Vision-Instruct',
    'meta-llama/Llama-3.2-90B-Vision-Instruct'
  ];

  for (const model of models) {
    console.log(`\nTesting model: ${model}...`);
    try {
      const res = await hf.chatCompletion({
        model: model,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'Extract student name, father name, dob, address, phone, and previous school from this admission form as JSON.'
              },
              { type: 'image_url', image_url: { url: dataUrl } }
            ]
          }
        ],
        max_tokens: 500
      });
      console.log(`✅ Success with ${model}:`);
      console.log(res.choices[0].message.content);
      return;
    } catch (e) {
      console.log(`❌ Failed ${model}:`, e.message);
    }
  }
}

testAllHfModels();
