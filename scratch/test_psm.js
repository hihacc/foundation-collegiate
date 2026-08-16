const fs = require('fs');
const Tesseract = require('tesseract.js');

// Let's create a pure JS pixel processor to test contrast stretching and binarization on the raw JPEG
function processImageBuffer(inputBuffer) {
  // Let's test Tesseract with OEM and PSM modes
  return inputBuffer;
}

async function testTesseractModes() {
  const imgPath = 'C:/Users/Ibrah/.gemini/antigravity/brain/85a71107-6e7c-4a77-ac31-7abf68e677e5/.user_uploaded/media_1786893228506.jpg';
  const imgBuffer = fs.readFileSync(imgPath);

  console.log('Testing Tesseract OCR with different page segmentation modes...');
  
  // PSM 1 = Automatic page segmentation with OSD
  // PSM 3 = Fully automatic page segmentation (default)
  // PSM 4 = Assume a single column of text of variable sizes
  // PSM 6 = Assume a single uniform block of text
  // PSM 11 = Sparse text
  // PSM 12 = Sparse text with OSD

  for (const psm of [3, 4, 6, 11]) {
    console.log(`\n--- Testing PSM mode: ${psm} ---`);
    const worker = await Tesseract.createWorker('eng');
    await worker.setParameters({
      tessedit_pageseg_mode: psm,
    });
    const ret = await worker.recognize(imgBuffer);
    console.log(`PSM ${psm} confidence: ${ret.data.confidence}%`);
    console.log(`PSM ${psm} text snippet:\n`, ret.data.text.slice(0, 400));
    await worker.terminate();
  }
}

testTesseractModes();
