const Tesseract = require('tesseract.js');
const fs = require('fs');
const path = require('path');

const grDir = path.join(process.cwd(), 'gr');
const files = fs.readdirSync(grDir).sort();

async function runOcr() {
  console.log('Starting OCR extraction on ' + files.length + ' images...');
  const results = {};

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const filePath = path.join(grDir, file);
    try {
      console.log('[' + (i + 1) + '/' + files.length + '] Processing ' + file + '...');
      const { data: { text } } = await Tesseract.recognize(filePath, 'eng');
      results[file] = text;
      console.log('Done ' + file + ' (' + text.length + ' chars)');
    } catch (e) {
      console.error('Error on ' + file + ':', e.message);
      results[file] = '';
    }
  }

  fs.writeFileSync('extracted_gr_ocr.json', JSON.stringify(results, null, 2), 'utf8');
  console.log('Saved all OCR results to extracted_gr_ocr.json');
}

runOcr();
