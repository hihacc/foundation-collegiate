const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

const env = dotenv.parse(fs.readFileSync('.env.local'));
const hfToken = env.HF_TOKEN;

const newImages = JSON.parse(fs.readFileSync('data/new_gr_images_inventory.json', 'utf8'));

console.log('--- RUNNING DUAL-AI OCR ON 13 NEW PICTURES ---');

async function processImages() {
  const Tesseract = (await import('tesseract.js')).default;
  const results = [];

  for (let i = 0; i < newImages.length; i++) {
    const img = newImages[i];
    const imgPath = path.join(process.cwd(), 'public', 'picture', img.filename);
    console.log(`[${i + 1}/13] Running OCR on ${img.filename}...`);

    try {
      const ocrRes = await Tesseract.recognize(imgPath, 'eng');
      const rawText = ocrRes.data.text;

      // Ask HF to parse raw transcript
      let hfParsed = [];
      try {
        const hfRes = await fetch('https://router.huggingface.co/together/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': 'Bearer ' + hfToken,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model: 'meta-llama/Llama-3.3-70B-Instruct-Turbo',
            messages: [
              {
                role: 'system',
                content: 'You are an expert school ledger extractor. Extract handwritten G.R. entries into JSON.'
              },
              {
                role: 'user',
                content: 'Extract all G.R. entries from this OCR text into JSON array [{ "gr": 123, "name": "STUDENT NAME", "class": "CLASS STREAM" }]. Do NOT invent records. Raw text:\n\n' + rawText
              }
            ],
            max_tokens: 1500
          })
        });

        if (hfRes.status === 200) {
          const hfJson = await hfRes.json();
          const content = hfJson.choices?.[0]?.message?.content || '';
          const match = content.match(/\[[\s\S]*\]/);
          if (match) {
            hfParsed = JSON.parse(match[0]);
          }
        }
      } catch (hfErr) {
        console.warn(`HF notice for ${img.filename}: ${hfErr.message}`);
      }

      console.log(`  -> Detected ${hfParsed.length} rows via HF from ${img.filename}`);
      results.push({
        image: img,
        rawOcrText: rawText,
        detectedRows: hfParsed
      });
    } catch (err) {
      console.error(`Error scanning ${img.filename}: ${err.message}`);
    }
  }

  fs.writeFileSync('data/new_gr_ocr_results.json', JSON.stringify(results, null, 2));
  console.log('Finished processing all 13 new images. Saved to data/new_gr_ocr_results.json');
}

processImages();
