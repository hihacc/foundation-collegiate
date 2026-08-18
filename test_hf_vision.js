const fs = require('fs');
const path = require('path');

const apiKey = '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';

async function testVisionChat() {
  const filePath = path.join(process.cwd(), 'gr', 'WhatsApp Image 2026-08-18 at 10.01.30 PM (1).jpeg');
  const base64Image = fs.readFileSync(filePath).toString('base64');
  const dataUrl = 'data:image/jpeg;base64,' + base64Image;

  const models = [
    'Qwen/Qwen2.5-VL-7B-Instruct',
    'meta-llama/Llama-3.2-11B-Vision-Instruct'
  ];

  for (const model of models) {
    console.log('Testing model:', model);
    try {
      const res = await fetch('https://router.huggingface.co/hf-inference/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer ' + apiKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: model,
          messages: [
            {
              role: 'user',
              content: [
                { type: 'text', text: 'Transcribe the handwritten table of GR Number, Student Name, and Class into JSON array: [{"gr": 123, "name": "...", "class": "..."}]' },
                { type: 'image_url', image_url: { url: dataUrl } }
              ]
            }
          ],
          max_tokens: 1500
        })
      });

      console.log('Status for ' + model + ': ' + res.status);
      const json = await res.json();
      if (res.status === 200) {
        console.log('SUCCESS with ' + model);
        console.log(json.choices?.[0]?.message?.content);
        return;
      } else {
        console.log('Response:', JSON.stringify(json));
      }
    } catch (e) {
      console.log('Fetch error:', e.message);
    }
  }
}

testVisionChat();
