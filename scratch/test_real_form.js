const fs = require('fs');
const Tesseract = require('tesseract.js');

const imgPath = 'C:/Users/Ibrah/.gemini/antigravity/brain/85a71107-6e7c-4a77-ac31-7abf68e677e5/.user_uploaded/media_1786893228506.jpg';

async function testForm() {
  console.log('Testing admission form image:', imgPath);
  const imgBuffer = fs.readFileSync(imgPath);

  const { data: { text } } = await Tesseract.recognize(imgBuffer, 'eng');
  console.log('\n--- OCR TEXT FOUND ---\n');
  console.log(text);
}

testForm();
