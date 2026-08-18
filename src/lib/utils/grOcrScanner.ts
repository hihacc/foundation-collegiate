import { OFFICIAL_CLASSES } from './classes';

export interface ScannedGrCandidate {
  id: string;
  gr_number: number;
  gr_code: string;
  student_name: string;
  class_name: string;
  confidence: number;
  raw_line: string;
  selected: boolean;
  action_type: 'assign' | 'update' | 'blank';
  notes?: string;
  column_source?: 'left_page' | 'right_page' | 'full';
}

// Common name fixes for OCR misreads on Pakistani academic ledgers
const NAME_CORRECTIONS: Array<[RegExp, string]> = [
  [/\bM(?:ohd|oham+ad|uham+ad|uhmd|uhmd\.)\b/gi, 'Muhammad'],
  [/\bM\.\s*/gi, 'M. '],
  [/\bSy(?:cd|ed|od)\b/gi, 'Syed'],
  [/\bHaf(?:iz|tz|z)\b/gi, 'Hafiz'],
  [/\bAbdu[l1][\-\s]+Rafay\b/gi, 'Abdul-Rafay'],
  [/\bAbdu[l1][\-\s]+Wahab\b/gi, 'Abdul Wahab'],
  [/\bAbdu[l1][\-\s]+Hadi\b/gi, 'Abdul Hadi'],
  [/\bShah(?:eeryar|coryar|iryar)\b/gi, 'Shaheeryar'],
  [/\bShah(?:zaib|zab)\b/gi, 'Shahzaib'],
  [/\bSha(?:hzaib|zaib)\s+Hassan\b/gi, 'Shazaib Hassan'],
  [/\bRab(?:eet|eed|it)\s+Ahmed\b/gi, 'Rabeet Ahmed'],
  [/\bUrooj\s+Ria[z|s]\b/gi, 'Urooj Riaz'],
  [/\bKanwa[l1]\s+Mehboob\b/gi, 'Kanwal Mehboob'],
  [/\bMubash[i1]r\s+Mehboob\b/gi, 'Mubashir Mehboob'],
  [/\bUm[\-\s]*e[\-\s]*Kulsoom\b/gi, 'Um-e-Kulsoom'],
  [/\bUba[i1]d\s+Sha[i1]kh\b/gi, 'Ubaid Shaikh'],
  [/\bUmer\s+Khanzada\b/gi, 'Umer Khanzada'],
  [/\bA[i1]mon\s+Khal[i1]d\b/gi, 'Aimon Khalid'],
  [/\bAf[i1]fa\s+Ahsan\b/gi, 'Afifa Ahsan'],
  [/\bAf[i1]fa\s+Khan\b/gi, 'Afifa Khan'],
  [/\bKh[i1]zra\s+Khan\b/gi, 'Khizra Khan'],
  [/\bSum+a[i1]ya\s+Perwa[i1]z\b/gi, 'Summaiya Perwaiz'],
  [/\bSumra[i1]a\s+Rehman\b/gi, 'Sumraia Rehman'],
  [/\bNoman\s+Ateeque\b/gi, 'Noman Ateeque'],
  [/\bSoneela\s+Amjad\b/gi, 'Soneela Amjad'],
  [/\bSamreen\s+Akbar\b/gi, 'Samreen Akbar'],
  [/\bMuteeb\s+Khan\b/gi, 'Muteeb Khan'],
  [/\bHammad\s+Tar[i1]q\b/gi, 'Hammad Tariq'],
  [/\bFaraz\s+Masood\b/gi, 'Faraz Masood'],
  [/\bTa[l1]ha\s+Saeed\b/gi, 'Talha Saeed'],
  [/\bKashan\s+Saeed\b/gi, 'Kashan Saeed'],
  [/\bArfeen\s+Saeed\b/gi, 'Arfeen Saeed'],
  [/\bSh[i1]za\s+Khan\b/gi, 'Shiza Khan'],
  [/\bMomal\s+She[i1]kh\b/gi, 'Momal Sheikh'],
  [/\bWaqar\s+She[i1]kh\b/gi, 'Waqar Sheikh'],
  [/\bQurat[\-\s]*Ul[\-\s]*A[i1]n\b/gi, 'Qurat-Ul-Ain'],
  [/\bRounak[\-\s]*Ul[\-\s]*A[i1]n\b/gi, 'Rounak-Ul-Ain'],
  [/\bFat[i1]ma\s+Zehra\b/gi, 'Fatima Zehra'],
  [/\bHuza[i1]fa\s+Tar[i1]q\b/gi, 'Huzaifa Tariq'],
  [/\bDua\s+Suleman\b/gi, 'Dua Suleman'],
  [/\bAhron\s+R[i1]az\b/gi, 'Ahron Riaz'],
  [/\bEbad\s+Khan\b/gi, 'Ebad Khan'],
  [/\bMaryam\s+B[i1]nt\s+Samreen\b/gi, 'Maryam Bint Samreen'],
  [/\bNajeeb\s+Ullah\b/gi, 'Najeeb Ullah'],
  [/\bSardar\s+Ahmed\b/gi, 'Sardar Ahmed'],
  [/\bTahreem\s+Fat[i1]ma\b/gi, 'Tahreem Fatima'],
  [/\bAffan\s+Saeed\b/gi, 'Affan Saeed']
];

export function parseGrLedgerText(rawText: string, columnSource: 'left_page' | 'right_page' | 'full' = 'full'): ScannedGrCandidate[] {
  if (!rawText || typeof rawText !== 'string') return [];

  const lines = rawText
    .split('\n')
    .map(l => l.trim())
    .filter(l => l.length > 0);

  const results: ScannedGrCandidate[] = [];
  const seenGr = new Set<number>();

  const ignoreKeywords = [
    'serial', 's.no', 'sr.no', 'g.r. no', 'gr no', 'gr.no', 'name of student', 
    'student name', 'father name', 'class', 'section', 'remarks', 'date of admission',
    'ledger', 'collegiate', 'foundation', 'page', 'signature', 'signature of student',
    'signature of principal', 'admitted to', 'receipt no', 'fee remarks'
  ];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lower = line.toLowerCase();

    // Skip pure header lines
    if (ignoreKeywords.some(kw => lower === kw || (lower.includes('gr no') && lower.includes('name')))) {
      continue;
    }

    // Pattern 1: Leading GR Number e.g. "116 Shaheeryar XI-Sci", "GR-139 Ubaid Shaikh XII-Eng", "1229 M. Ebad Khan XI-Sci"
    const grLeadingMatch = line.match(/^(?:GR[-\s\.]*|G\.R\.[-\s]*|#\s*)?(\d{1,5})[\s\.\:\-\)\|\/\,]+(.*)$/i);
    
    if (grLeadingMatch) {
      const grNum = parseInt(grLeadingMatch[1], 10);
      const rest = grLeadingMatch[2].trim();

      if (grNum > 0 && grNum <= 5000 && !seenGr.has(grNum)) {
        seenGr.add(grNum);

        const { name, className, confidence } = extractNameAndClass(rest);

        results.push({
          id: `scan_${grNum}_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
          gr_number: grNum,
          gr_code: `GR-${grNum}`,
          student_name: name,
          class_name: className,
          confidence: confidence,
          raw_line: line,
          selected: true,
          action_type: name ? 'assign' : 'blank',
          column_source: columnSource,
          notes: name ? `Detected handwritten entry (${confidence}% conf)` : 'Detected blank ledger line'
        });
        continue;
      }
    }

    // Pattern 2: Trailing or Middle GR Match e.g. "Shaheeryar 116 XI-Sci" or "Shaheeryar | 116 | XI-Sci"
    const middleGrMatch = line.match(/(.*?)(?:[\s\|\:\-\,]+)(?:GR[-\s\.]*)?(\d{1,5})(?:[\s\|\:\-\,]+)(.*)/i);
    if (middleGrMatch) {
      const grNum = parseInt(middleGrMatch[2], 10);
      const part1 = middleGrMatch[1].trim();
      const part2 = middleGrMatch[3].trim();

      // Only accept if part1 is not empty and does not look like a date
      if (grNum > 0 && grNum <= 5000 && !seenGr.has(grNum) && !part1.match(/^\d{1,4}$/)) {
        seenGr.add(grNum);
        const combined = `${part1} ${part2}`.trim();
        const { name, className, confidence } = extractNameAndClass(combined);

        if (name) {
          results.push({
            id: `scan_${grNum}_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
            gr_number: grNum,
            gr_code: `GR-${grNum}`,
            student_name: name,
            class_name: className,
            confidence: Math.max(confidence - 5, 65),
            raw_line: line,
            selected: true,
            action_type: 'assign',
            column_source: columnSource,
            notes: 'Detected from middle-column ledger format'
          });
        }
      }
    }
  }

  return results.sort((a, b) => a.gr_number - b.gr_number);
}

function extractNameAndClass(text: string): { name: string; className: string; confidence: number } {
  let cleaned = text
    .replace(/[\|\[\]\{\}\<\>]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  let detectedClass = '';
  let confidence = 85;

  // Class detection patterns
  const classPatterns: Array<{ regex: RegExp; class_name: string }> = [
    { regex: /\b(xii[\s\-]*(?:pre[\s\-]*)?med(?:ical)?|12[\s\-]*(?:pre[\s\-]*)?med)\b/i, class_name: 'Class XII - Pre-Medical' },
    { regex: /\b(xii[\s\-]*(?:pre[\s\-]*)?eng(?:ineering)?|12[\s\-]*(?:pre[\s\-]*)?eng)\b/i, class_name: 'Class XII - Pre-Engineering' },
    { regex: /\b(xii[\s\-]*(?:comp|cs)|12[\s\-]*(?:comp|cs))\b/i, class_name: 'Class XII - Computer Science' },
    { regex: /\b(xii[\s\-]*(?:com|commerce)|12[\s\-]*(?:com|commerce))\b/i, class_name: 'Class XII - Commerce' },
    { regex: /\b(xii[\s\-]*(?:sci|science)|12[\s\-]*(?:sci|science))\b/i, class_name: 'Class XII - Science' },
    { regex: /\b(xi[\s\-]*(?:pre[\s\-]*)?med(?:ical)?|11[\s\-]*(?:pre[\s\-]*)?med)\b/i, class_name: 'Class XI - Pre-Medical' },
    { regex: /\b(xi[\s\-]*(?:pre[\s\-]*)?eng(?:ineering)?|11[\s\-]*(?:pre[\s\-]*)?eng)\b/i, class_name: 'Class XI - Pre-Engineering' },
    { regex: /\b(xi[\s\-]*(?:comp|cs)|11[\s\-]*(?:comp|cs))\b/i, class_name: 'Class XI - Computer Science' },
    { regex: /\b(xi[\s\-]*(?:com|commerce)|11[\s\-]*(?:com|commerce))\b/i, class_name: 'Class XI - Commerce' },
    { regex: /\b(xi[\s\-]*(?:sci|science)|11[\s\-]*(?:sci|science))\b/i, class_name: 'Class XI - Science' },
    { regex: /\b(x[\s\-]*(?:sci|science|general)|10[\s\-]*(?:sci|science)|matric)\b/i, class_name: 'Class X - Science' },
    { regex: /\b(ix[\s\-]*(?:sci|science|general)|9[\s\-]*(?:sci|science))\b/i, class_name: 'Class IX - Science' },
    { regex: /\b(b\.?com|adc|bachelor)\b/i, class_name: 'B.Com / ADC' },
    { regex: /\b(dit|diploma)\b/i, class_name: 'DIT (Diploma in IT)' },
    { regex: /\b(xii|12th|class 12)\b/i, class_name: 'Class XII - Pre-Engineering' },
    { regex: /\b(xi|11th|class 11)\b/i, class_name: 'Class XI - Science' },
    { regex: /\b(x|10th|class 10)\b/i, class_name: 'Class X - Science' },
    { regex: /\b(ix|9th|class 9)\b/i, class_name: 'Class IX - Science' }
  ];

  for (const item of classPatterns) {
    if (item.regex.test(cleaned)) {
      detectedClass = item.class_name;
      cleaned = cleaned.replace(item.regex, '').trim();
      confidence += 5;
      break;
    }
  }

  // Clean name string
  let name = cleaned
    .replace(/[^a-zA-Z\s\.\-]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  // Apply intelligent name corrections
  for (const [pattern, replacement] of NAME_CORRECTIONS) {
    if (pattern.test(name)) {
      name = name.replace(pattern, replacement);
      confidence += 3;
    }
  }

  // Final validation
  if (name.length < 2 || /^[-.\s]+$/.test(name)) {
    name = '';
    confidence = 60;
  } else {
    confidence = Math.min(confidence, 98);
  }

  return {
    name,
    className: detectedClass || 'Class XI - Science',
    confidence
  };
}
