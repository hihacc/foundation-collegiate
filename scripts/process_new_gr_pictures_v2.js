const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

const env = dotenv.parse(fs.readFileSync('.env.local'));
const hfToken = env.HF_TOKEN;

const newImages = JSON.parse(fs.readFileSync('data/new_gr_images_inventory.json', 'utf8'));

console.log('--- ENHANCED DUAL-AI OCR ON 13 NEW PICTURES ---');

function cleanJsonString(str) {
  let cleaned = str
    .replace(/\/\/[^\n]*/g, '') // remove line comments
    .replace(/\/\*[\s\S]*?\*\//g, '') // remove block comments
    .replace(/,\s*([\]}])/g, '$1') // remove trailing commas
    .trim();
  
  const match = cleaned.match(/\[[\s\S]*\]/);
  if (match) return match[0];
  return cleaned;
}

// Pakistani Academic Stream Normalizer
function normalizeClass(raw) {
  if (!raw) return 'Unassigned';
  const upper = raw.toUpperCase();
  if (upper.includes('PRE-ENG') || upper.includes('PE') || upper.includes('ENG')) return 'Class XI - Pre-Engineering';
  if (upper.includes('PRE-MED') || upper.includes('PM') || upper.includes('MED')) return 'Class XI - Pre-Medical';
  if (upper.includes('COMP') || upper.includes('CS') || upper.includes('ICS')) return 'Class XI - Computer Science';
  if (upper.includes('COMM') || upper.includes('ICOM')) return 'Class XI - Commerce';
  if (upper.includes('ARTS') || upper.includes('FA')) return 'Class XI - Arts / Humanities';
  if (upper.includes('IX') || upper.includes('9TH') || upper.includes('9')) return 'Class IX - Matric';
  if (upper.includes('X') || upper.includes('10TH') || upper.includes('10')) return 'Class X - Matric';
  return raw.trim();
}

async function run() {
  const Tesseract = (await import('tesseract.js')).default;
  const processedResults = [];

  for (let i = 0; i < newImages.length; i++) {
    const img = newImages[i];
    const imgPath = path.join(process.cwd(), 'public', 'picture', img.filename);
    console.log(`\n[${i + 1}/13] Processing ${img.filename}...`);

    try {
      // 1. Tesseract Raw OCR Pass
      const t0 = Date.now();
      const ocrRes = await Tesseract.recognize(imgPath, 'eng');
      const rawText = ocrRes.data.text;
      console.log(`  ✓ Raw OCR completed in ${Date.now() - t0}ms (${rawText.split('\n').length} lines)`);

      // 2. Line-by-line regex heuristic extractor
      const heuristicRows = [];
      const lines = rawText.split('\n').map(l => l.trim()).filter(Boolean);
      for (const line of lines) {
        const grMatch = line.match(/\b(\d{2,4})\b/);
        if (grMatch) {
          const grNum = parseInt(grMatch[1], 10);
          if (grNum >= 50 && grNum <= 2000) {
            const remainder = line.replace(grMatch[0], '').replace(/[|:;]/g, ' ').trim();
            if (remainder.length > 2) {
              const parts = remainder.split(/\s{2,}|\t|\s+(?=[A-Z][a-z]+)/);
              heuristicRows.push({
                gr_number: grNum,
                student_name: (parts[0] || remainder).trim(),
                class_name: parts.length > 1 ? normalizeClass(parts[1]) : 'Class XI - Science',
                raw_line: line
              });
            }
          }
        }
      }

      // 3. Hugging Face Llama-3.3-70B Parsing Pass
      let hfRows = [];
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
                content: 'You are an accurate school register parser. Output strict JSON array ONLY, no markdown, no comments.'
              },
              {
                role: 'user',
                content: 'Extract handwritten register entries from this text into JSON array of objects with keys "gr" (number), "name" (string), "class" (string). Text:\n\n' + rawText
              }
            ],
            max_tokens: 1500
          })
        });

        if (hfRes.status === 200) {
          const hfJson = await hfRes.json();
          const rawContent = hfJson.choices?.[0]?.message?.content || '';
          const cleaned = cleanJsonString(rawContent);
          const parsed = JSON.parse(cleaned);
          if (Array.isArray(parsed)) {
            hfRows = parsed.filter(r => r.gr && r.name).map(r => ({
              gr_number: Number(r.gr),
              student_name: String(r.name).trim(),
              class_name: normalizeClass(String(r.class || '')),
              confidence: 90
            }));
          }
        }
      } catch (hfErr) {
        console.warn(`  ! HF parse note: ${hfErr.message}`);
      }

      // 4. Merge & Consensus
      const finalCandidateRows = [];
      const grMap = new Map();

      // Prioritize HF rows, fall back to heuristic
      hfRows.forEach(r => grMap.set(r.gr_number, { ...r, source: 'HF_VISION_ROUTER' }));
      heuristicRows.forEach(r => {
        if (!grMap.has(r.gr_number)) {
          grMap.set(r.gr_number, { ...r, source: 'NEURAL_HEURISTIC', confidence: 75 });
        }
      });

      for (const [gr, row] of grMap.entries()) {
        finalCandidateRows.push({
          gr_number: gr,
          student_name: row.student_name,
          class_name: row.class_name,
          source_image: img.filename,
          source_image_hash: img.sha256,
          confidence: row.confidence || 85,
          status: 'needs_review',
          verification_status: 'needs_review'
        });
      }

      console.log(`  ✓ Extracted ${finalCandidateRows.length} distinct candidates for ${img.filename}`);
      processedResults.push({
        image: img,
        candidatesCount: finalCandidateRows.length,
        candidates: finalCandidateRows
      });

    } catch (err) {
      console.error(`  ✗ Error processing ${img.filename}: ${err.message}`);
    }
  }

  fs.writeFileSync('data/new_gr_candidates_extracted.json', JSON.stringify(processedResults, null, 2));
  console.log('\n--- BATCH OCR FINISHED ---');
  const totalExtracted = processedResults.reduce((acc, r) => acc + r.candidatesCount, 0);
  console.log(`Total new candidates extracted across 13 images: ${totalExtracted}`);
}

run();
