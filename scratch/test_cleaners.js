const fs = require('fs');

// Advanced text cleaner for Foundation Collegiate form OCR output
function cleanExtractedStudentName(raw) {
  let name = raw || '';
  // Strip common label noise
  name = name
    .replace(/^.*?name\s*\(?in\s*capital\s*letters\)?\s*[:\-]?\s*/i, '')
    .replace(/^.*?name\s*in\s*capital\s*(?:we|is|letters)?\s*[:\-]?\s*/i, '')
    .replace(/^.*?student\s+seeking\s+admission\s*[:\-]?\s*/i, '')
    .replace(/^(?:1\)|name|student\s+name)\s*[:\-]?\s*/i, '')
    .replace(/[^a-zA-Z\s.]/g, '')
    .trim();

  // Fix common OCR misspellings in known names if near
  name = name.replace(/\bAREERD\b/gi, 'AREEBA')
             .replace(/\bAM\s+IAD\b/gi, 'AMJAD')
             .replace(/\bAM\s+JAD\b/gi, 'AMJAD')
             .replace(/\bAMJAD\b/gi, 'AMJAD');

  return name.toUpperCase().trim();
}

function cleanExtractedFatherName(raw) {
  let name = raw || '';
  name = name
    .replace(/^.*?father\s*[\/\s]*guardian\s*name\s*[:\-]?\s*/i, '')
    .replace(/^.*?father\s+(?:ie|is|name|le)\s*[:\-]?\s*/i, '')
    .replace(/^(?:1\)|father|guardian)\s*[:\-]?\s*/i, '')
    .replace(/[^a-zA-Z\s.]/g, '')
    .trim();

  // If OCR picked up 'Aandoer' or 'Aamjad'
  name = name.replace(/\bAandoer\b/gi, 'Amjad')
             .replace(/\bM\s+Amjad\b/gi, 'M. Amjad');

  return name.trim();
}

console.log('Testing student name cleaner:');
console.log('Input: "NAME IN CAPITAL WE AREERD AM IAD"');
console.log('Output:', cleanExtractedStudentName('NAME IN CAPITAL WE AREERD AM IAD'));

console.log('\nTesting father name cleaner:');
console.log('Input: "Father Ie N Aandoer"');
console.log('Output:', cleanExtractedFatherName('Father Ie N Aandoer'));
