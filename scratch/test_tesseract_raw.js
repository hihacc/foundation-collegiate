const fs = require('fs');
const Tesseract = require('tesseract.js');

const imgPath = 'C:/Users/Ibrah/.gemini/antigravity/brain/85a71107-6e7c-4a77-ac31-7abf68e677e5/.user_uploaded/media_1786878506064.png';

async function testTesseractRaw() {
  console.log('Running Tesseract OCR on physical admission form image...');
  const imgBuffer = fs.readFileSync(imgPath);

  const { data: { text } } = await Tesseract.recognize(imgBuffer, 'eng');
  console.log('\n--- RAW OCR TEXT DETECTED ---\n');
  console.log(text);
}

testTesseractRaw();
