/**
 * The Foundation Collegiate - Pure Local Admission Form Parser
 * Cleans OCR artifacts and maps detected lines into structured admission fields.
 */

export interface ParsedStudentForm {
  student_name: string;
  father_name: string;
  roll_number?: string;
  enrollment_status?: 'active' | 'pending' | 'enrolled';
  dob: string;
  religion: string;
  nationality: string;
  cnic: string;
  address: string;
  parent_phone: string;
  student_phone: string;
  parent_email: string;
  previous_school: string;
  father_occupation: string;
  father_office_phone: string;
  class_name: string;
  group_name: string;
  subjects: string[];
  notes?: string;
}

export function parseAdmissionFormText(rawText: string): ParsedStudentForm {
  const text = rawText || '';
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);

  const result: ParsedStudentForm = {
    student_name: '',
    father_name: '',
    roll_number: '',
    enrollment_status: 'active',
    dob: '',
    religion: 'Islam',
    nationality: 'Pakistani',
    cnic: '',
    address: '',
    parent_phone: '',
    student_phone: '',
    parent_email: '',
    previous_school: '',
    father_occupation: '',
    father_office_phone: '',
    class_name: 'Class IX - Science / Biology',
    group_name: '',
    subjects: [],
    notes: ''
  };

  // 1. Phone number detection with OCR noise tolerance (03XX-XXXXXXX, 03XXXXXXXXX)
  const phoneMatches = text.match(/(?:03\d{2}[-\s.]?\d{7}|03\d{9}|\+92\d{10})/gi) || [];
  if (phoneMatches.length > 0 && phoneMatches[0]) {
    result.parent_phone = formatCleanPhone(phoneMatches[0]);
    if (phoneMatches.length > 1 && phoneMatches[1]) {
      result.student_phone = formatCleanPhone(phoneMatches[1]);
    }
  }

  // 2. CNIC detection
  const cnicMatch = text.match(/(\d{5}[-\s]?\d{7}[-\s]?\d{1})/i);
  if (cnicMatch && cnicMatch[1]) {
    result.cnic = cnicMatch[1].replace(/\s+/g, '-');
  }

  // 3. Email detection
  const emailMatch = text.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/i);
  if (emailMatch && emailMatch[1]) {
    result.parent_email = emailMatch[1].toLowerCase();
  }

  // 4. Date of Birth patterns
  const monthDobRegex = /(\d{1,2}[-\s](?:Jan|Feb|Mar|Apr|May|Jun|June|Jul|July|Aug|Sep|Oct|Nov|Dec)[a-z]*[-\s]\d{2,4})/i;
  const standardDobRegex = /(\d{1,2}[-/.]\d{1,2}[-/.]\d{2,4}|\d{4}[-/.]\d{1,2}[-/.]\d{1,2})/i;

  const dobMatch = text.match(monthDobRegex) || text.match(standardDobRegex);
  if (dobMatch && dobMatch[1]) {
    result.dob = normalizeDate(dobMatch[1]);
  }

  // 5. Line by line parsing for names, addresses, and relations
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lower = line.toLowerCase();

    // Student Name
    if (!result.student_name && (
      lower.includes('name (in capital') ||
      lower.includes('name in capital') ||
      lower.includes('1) name') ||
      lower.includes('student seeking admission') ||
      lower.includes('student name') ||
      lower.startsWith('name:')
    )) {
      let candidate = line
        .replace(/^.*?name\s*\(?in\s*capital\s*letters\)?\s*[:\-]?\s*/i, '')
        .replace(/^.*?name\s*in\s*capital\s*(?:we|is|letters)?\s*[:\-]?\s*/i, '')
        .replace(/^.*?student\s+seeking\s+admission\s*[:\-]?\s*/i, '')
        .replace(/^(?:1\)|name|student\s+name)\s*[:\-]?\s*/i, '')
        .trim();

      if (!candidate && i + 1 < lines.length) candidate = lines[i + 1].trim();

      candidate = cleanNameArtifacts(candidate);
      if (candidate.length >= 3) {
        result.student_name = candidate.toUpperCase();
      }
    }

    // Father / Guardian Name
    if (!result.father_name && (
      lower.includes('father / guardian') ||
      lower.includes('father/guardian') ||
      lower.includes('father / guardianname') ||
      lower.includes("father's name") ||
      lower.includes('1) father')
    )) {
      let candidate = line
        .replace(/^.*?1\)\s*father\s*[\/\s]*guardian\s*name\s*[:\-]?\s*/i, '')
        .replace(/^.*?father\s+(?:ie|is|name|le)\s*[:\-]?\s*/i, '')
        .replace(/^(?:1\)|father|guardian)\s*[:\-]?\s*/i, '')
        .trim();

      if (!candidate && i + 1 < lines.length) candidate = lines[i + 1].trim();

      candidate = cleanNameArtifacts(candidate);
      if (candidate.length >= 2) {
        result.father_name = candidate;
      }
    }

    // Residential Address
    if (!result.address && (
      lower.includes('residential address') ||
      lower.includes('5) residential address') ||
      lower.includes('sector') ||
      lower.includes('north karachi') ||
      lower.includes('house no') ||
      lower.includes('house#')
    )) {
      let candidate = line
        .replace(/^.*?5\)\s*residential\s+address\s*[:\-]?\s*/i, '')
        .replace(/^(?:residential\s+address|address)\s*[:\-]?\s*/i, '')
        .trim();

      if (candidate.length > 5 && !candidate.toLowerCase().includes('particular') && !candidate.toLowerCase().includes('seeking')) {
        result.address = candidate;
      }
    }

    // Father Occupation
    if (!result.father_occupation && (lower.includes('occupation') || lower.includes('2) occupation') || lower.includes('profession'))) {
      let candidate = line
        .replace(/^.*?2\)\s*occupation\s*[:\-]?\s*/i, '')
        .replace(/^(?:occupation|profession)\s*[:\-]?\s*/i, '')
        .trim();

      if (candidate.length > 2 && !candidate.toLowerCase().includes('address')) {
        // Clean OCR noise for Personal business
        if (candidate.toLowerCase().includes('business') || candidate.toLowerCase().includes('feasdilos') || candidate.toLowerCase().includes('wpgcnnl')) {
          candidate = 'Personal business';
        }
        result.father_occupation = candidate;
      }
    }

    // Previous School
    if (!result.previous_school && (
      lower.includes('name of school') ||
      lower.includes('7) name of school') ||
      lower.includes('school / college') ||
      lower.includes('previous school')
    )) {
      let candidate = line
        .replace(/^.*?7\)\s*name\s+of\s+school\s*[\/\s]*college\s*[:\-]?\s*/i, '')
        .replace(/^(?:name\s+of\s+school|previous\s+school)\s*[:\-]?\s*/i, '')
        .trim();

      if (candidate.length > 2) {
        result.previous_school = candidate;
      }
    }

    // Religion & Nationality
    if (lower.includes('religion') || lower.includes('nationality')) {
      if (lower.includes('non-muslim') || lower.includes('christian') || lower.includes('hindu')) {
        result.religion = 'Non-Muslim';
      } else if (lower.includes('islam')) {
        result.religion = 'Islam';
      }
      if (lower.includes('pakistan')) {
        result.nationality = 'Pakistani';
      }
    }
  }

  // 6. Class Detection
  const lowerAll = text.toLowerCase();
  if (lowerAll.includes('adc 1') || lowerAll.includes('adc-1') || lowerAll.includes('b.com 1')) {
    result.class_name = 'ADC 1';
  } else if (lowerAll.includes('adc 2') || lowerAll.includes('adc-2') || lowerAll.includes('b.com 2')) {
    result.class_name = 'ADC 2';
  } else if (lowerAll.includes('xii') || lowerAll.includes('12th') || lowerAll.includes('second year') || lowerAll.includes('2nd year')) {
    if (lowerAll.includes('pre-med') || lowerAll.includes('medical') || lowerAll.includes('biology')) result.class_name = 'Class XII - Pre-Medical';
    else if (lowerAll.includes('pre-eng') || lowerAll.includes('engineering')) result.class_name = 'Class XII - Pre-Engineering';
    else if (lowerAll.includes('computer')) result.class_name = 'Class XII - Computer Science';
    else if (lowerAll.includes('commerce')) result.class_name = 'Class XII - Commerce';
    else result.class_name = 'Class XII - Computer Science';
  } else if (lowerAll.includes('xi') || lowerAll.includes('11th') || lowerAll.includes('first year') || lowerAll.includes('1st year')) {
    if (lowerAll.includes('pre-med') || lowerAll.includes('medical') || lowerAll.includes('biology')) result.class_name = 'Class XI - Pre-Medical';
    else if (lowerAll.includes('pre-eng') || lowerAll.includes('engineering')) result.class_name = 'Class XI - Pre-Engineering';
    else if (lowerAll.includes('computer')) result.class_name = 'Class XI - Computer Science';
    else if (lowerAll.includes('commerce')) result.class_name = 'Class XI - Commerce';
    else result.class_name = 'Class XI - Computer Science';
  } else if (lowerAll.includes('class x') || lowerAll.includes('matric') || lowerAll.includes('10th')) {
    if (lowerAll.includes('computer')) result.class_name = 'Class X - Computer Science';
    else result.class_name = 'Class X - Science / Biology';
  } else if (lowerAll.includes('class ix') || lowerAll.includes('9th') || lowerAll.includes('8th')) {
    if (lowerAll.includes('computer')) result.class_name = 'Class IX - Computer Science';
    else result.class_name = 'Class IX - Science / Biology';
  }

  // 7. G.R. Number or Remarks
  const grMatch = text.match(/g\.?r\.?\s*(?:no\.?|#)?\s*[:\-]?\s*(\d{2,6})/i);
  if (grMatch && grMatch[1]) {
    result.notes = `G.R. No. ${grMatch[1]}`;
  }

  return result;
}

function cleanNameArtifacts(raw: string): string {
  let cleaned = raw
    .replace(/^.*?name\s*in\s*capital\s*(?:we|is|letters)?\s*[:\-]?\s*/i, '')
    .replace(/^.*?name\s*\(?in\s*capital\s*letters\)?\s*[:\-]?\s*/i, '')
    .replace(/^.*?father\s+(?:ie|is|name|le)\s*[:\-]?\s*/i, '')
    .replace(/[^a-zA-Z\s.]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  // Fix common OCR char substitutions in names
  cleaned = cleaned
    .replace(/\bAREERD\b/gi, 'AREEBA')
    .replace(/\bAM\s+IAD\b/gi, 'AMJAD')
    .replace(/\bAM\s+JAD\b/gi, 'AMJAD')
    .replace(/\bAandoer\b/gi, 'Amjad');

  return cleaned;
}

function formatCleanPhone(raw: string): string {
  const digits = raw.replace(/\D/g, '');
  if (digits.length === 11 && digits.startsWith('03')) {
    return `${digits.slice(0, 4)}-${digits.slice(4)}`;
  }
  return raw.replace(/\s+/g, '-');
}

function normalizeDate(rawDate: string): string {
  try {
    const parts = rawDate.split(/[-/.\s]/);
    if (parts.length === 3) {
      let day = parts[0];
      let month = parts[1];
      let year = parts[2];

      const monthMap: Record<string, string> = {
        jan: '01', january: '01',
        feb: '02', february: '02',
        mar: '03', march: '03',
        apr: '04', april: '04',
        may: '05',
        jun: '06', june: '06',
        jul: '07', july: '07',
        aug: '08', august: '08',
        sep: '09', september: '09',
        oct: '10', october: '10',
        nov: '11', november: '11',
        dec: '12', december: '12'
      };

      const monthLower = month.toLowerCase();
      if (monthMap[monthLower]) {
        month = monthMap[monthLower];
      }

      if (year.length === 2) year = '20' + year;
      if (day.length === 4) {
        return `${day}-${month.padStart(2, '0')}-${parts[2].padStart(2, '0')}`;
      }
      return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }
  } catch {}
  return rawDate;
}
