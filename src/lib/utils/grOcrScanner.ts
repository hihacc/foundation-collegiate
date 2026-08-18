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
}

export function parseGrLedgerText(rawText: string): ScannedGrCandidate[] {
  if (!rawText || typeof rawText !== 'string') return [];

  const lines = rawText
    .split('\n')
    .map(l => l.trim())
    .filter(l => l.length > 0);

  const results: ScannedGrCandidate[] = [];
  const seenGr = new Set<number>();

  // Filter out header words
  const ignoreKeywords = [
    'serial', 's.no', 'sr.no', 'g.r. no', 'gr no', 'gr.no', 'name of student', 
    'student name', 'father name', 'class', 'section', 'remarks', 'date of admission',
    'ledger', 'collegiate', 'foundation', 'page', 'signature'
  ];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lower = line.toLowerCase();

    // Skip pure header lines
    if (ignoreKeywords.some(kw => lower === kw || (lower.includes('gr no') && lower.includes('name')))) {
      continue;
    }

    // Pattern 1: Starts with a number (GR Number) e.g., "116 Shaheeryar XI-Sci" or "GR-139 Ubaid Shaikh XII-Eng"
    const grMatch = line.match(/^(?:GR[-\s\.]*)?(\d{1,5})[\s\.\:\-\)\|\/]+(.*)$/i);
    
    if (grMatch) {
      const grNum = parseInt(grMatch[1], 10);
      const rest = grMatch[2].trim();

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
          notes: name ? 'Detected handwritten entry' : 'Detected blank ledger line'
        });
        continue;
      }
    }

    // Pattern 2: Middle GR Match e.g. "Shaheeryar | 116 | XI-Sci"
    const middleGrMatch = line.match(/(.*?)(?:[\s\|\:\-]+)(?:GR[-\s\.]*)?(\d{1,5})(?:[\s\|\:\-]+)(.*)/i);
    if (middleGrMatch) {
      const grNum = parseInt(middleGrMatch[2], 10);
      const part1 = middleGrMatch[1].trim();
      const part2 = middleGrMatch[3].trim();

      if (grNum > 0 && grNum <= 5000 && !seenGr.has(grNum)) {
        seenGr.add(grNum);
        const combined = `${part1} ${part2}`.trim();
        const { name, className, confidence } = extractNameAndClass(combined);

        results.push({
          id: `scan_${grNum}_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
          gr_number: grNum,
          gr_code: `GR-${grNum}`,
          student_name: name,
          class_name: className,
          confidence: Math.max(confidence - 5, 60),
          raw_line: line,
          selected: true,
          action_type: name ? 'assign' : 'blank',
          notes: 'Detected from middle-column format'
        });
      }
    }
  }

  return results.sort((a, b) => a.gr_number - b.gr_number);
}

function extractNameAndClass(text: string): { name: string; className: string; confidence: number } {
  let cleaned = text
    .replace(/[\|\[\]\{\}\(\)\<\>]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  let detectedClass = '';
  let confidence = 85;

  // Class detection patterns
  const classPatterns: Array<{ regex: RegExp; class_name: string }> = [
    { regex: /\b(xii[\s\-]*(?:pre[\s\-]*)?med(?:ical)?|12[\s\-]*(?:pre[\s\-]*)?med)\b/i, class_name: 'Class XII - Pre-Medical' },
    { regex: /\b(xii[\s\-]*(?:pre[\s\-]*)?eng(?:ineering)?|12[\s\-]*(?:pre[\s\-]*)?eng)\b/i, class_name: 'Class XII - Pre-Engineering' },
    { regex: /\b(xii[\s\-]*(?:comp|cs)|12[\s\-]*(?:comp|cs))\b/i, class_name: 'Class XII - Computer Science' },
    { regex: /\b(xii[\s\-]*(?:com|commerce)|12[\s\-]*(?:com|commerce)|xii[\s\-]*(?:sci|science)|12[\s\-]*(?:sci|science))\b/i, class_name: 'Class XII - Commerce' },
    { regex: /\b(xi[\s\-]*(?:pre[\s\-]*)?med(?:ical)?|11[\s\-]*(?:pre[\s\-]*)?med)\b/i, class_name: 'Class XI - Pre-Medical' },
    { regex: /\b(xi[\s\-]*(?:pre[\s\-]*)?eng(?:ineering)?|11[\s\-]*(?:pre[\s\-]*)?eng)\b/i, class_name: 'Class XI - Pre-Engineering' },
    { regex: /\b(xi[\s\-]*(?:comp|cs)|11[\s\-]*(?:comp|cs))\b/i, class_name: 'Class XI - Computer Science' },
    { regex: /\b(xi[\s\-]*(?:com|commerce)|11[\s\-]*(?:com|commerce))\b/i, class_name: 'Class XI - Commerce' },
    { regex: /\b(xi[\s\-]*(?:sci|science)|11[\s\-]*(?:sci|science))\b/i, class_name: 'Class XI - Science' },
    { regex: /\b(x[\s\-]*(?:sci|science|general)|10[\s\-]*(?:sci|science)|matric)\b/i, class_name: 'Class X - Science' },
    { regex: /\b(ix[\s\-]*(?:sci|science|general)|9[\s\-]*(?:sci|science))\b/i, class_name: 'Class IX - Science' },
    { regex: /\b(b\.?com|adc|bachelor)\b/i, class_name: 'B.Com / ADC' },
    { regex: /\b(dit|diploma)\b/i, class_name: 'DIT (Diploma in IT)' },
    { regex: /\b(xii|12th|class 12)\b/i, class_name: 'Class XII - General' },
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

  // Clean remaining name
  let name = cleaned
    .replace(/[^a-zA-Z\s\.\-]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  // If name is too short or weird
  if (name.length < 2) {
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
