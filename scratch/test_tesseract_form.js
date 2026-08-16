const fs = require('fs');
const Tesseract = require('tesseract.js');
const { parseAdmissionFormText } = require('../src/lib/utils/formOcrParser');

const imgPath = 'C:/Users/Ibrah/.gemini/antigravity/brain/85a71107-6e7c-4a77-ac31-7abf68e677e5/.user_uploaded/media_1786878506064.png';

async function testTesseract() {
  console.log('Running Tesseract OCR on physical admission form...');
  const imgBuffer = fs.readFileSync(imgPath);

  const { data: { text } } = await Tesseract.recognize(imgBuffer, 'eng', {
    logger: m => {
      if (m.status === 'recognizing text') console.log(`OCR Progress: ${Math.round(m.progress * 100)}%`);
    }
  });

  console.log('\n--- RAW OCR TEXT DETECTED ---\n');
  console.log(text);
  console.log('\n--- PARSED STRUCTURED FORM DATA ---\n');
  const parsed = parseAdmissionFormText(text);
  console.log(JSON.stringify(parsed, null, 2));
}

testTesseract();
