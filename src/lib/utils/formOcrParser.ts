/**
 * The Foundation Collegiate - Admission Form Pure Local OCR Parser
 * Extracts structured student data purely from local Tesseract.js OCR text.
 * Contains ZERO hardcoded mock data.
 */

export interface ParsedStudentForm {
  student_name: string;
  father_name: string;
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

  // Helper patterns
  const cnicRegex = /(\d{5}[-\s]?\d{7}[-\s]?\d{1})/i;
  const allPhonesRegex = /(?:03\d{2}[-\s]?\d{7}|\+92[-\s]?\d{10}|03\d{9})/gi;
  const dobRegex = /(\d{1,2}[-/.]\d{1,2}[-/.]\d{2,4}|\d{4}[-/.]\d{1,2}[-/.]\d{1,2})/i;
  const monthDobRegex = /(\d{1,2}[-\s](?:Jan|Feb|Mar|Apr|May|Jun|June|Jul|July|Aug|Sep|Oct|Nov|Dec)[a-z]*[-\s]\d{2,4})/i;
  const emailRegex = /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/i;

  // 1. Search for CNIC / B-Form
  const cnicMatch = text.match(cnicRegex);
  if (cnicMatch && cnicMatch[1]) {
    result.cnic = cnicMatch[1].replace(/\s+/g, '-');
  }

  // 2. Search for Email
  const emailMatch = text.match(emailRegex);
  if (emailMatch && emailMatch[1]) {
    result.parent_email = emailMatch[1].toLowerCase();
  }

  // 3. Search for Phones
  const phoneMatches = text.match(allPhonesRegex) || [];
  if (phoneMatches.length > 0 && phoneMatches[0]) {
    result.parent_phone = phoneMatches[0].replace(/\s+/g, '-');
    if (phoneMatches.length > 1 && phoneMatches[1]) {
      result.student_phone = phoneMatches[1].replace(/\s+/g, '-');
    }
  }

  // 4. Line by line parsing for names, addresses, relations
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lower = line.toLowerCase();

    // Student Name
    if (!result.student_name && (
      lower.includes('name (in capital') ||
      lower.includes('student seeking admission') ||
      lower.includes('1) name') ||
      lower.includes('student name') || 
      lower.includes('name of student') ||
      lower.startsWith('name:') ||
      lower.startsWith('name -')
    )) {
      let candidate = line
        .replace(/.*?1\)\s*name\s*\(in\s*capital\s*letters\)\s*[:\-]?\s*/i, '')
        .replace(/^(?:1\)|name|student\s+name|name\s+of\s+student|name\s*\(.*?\))\s*[:\-]?\s*/i, '')
        .trim();
      if (!candidate && i + 1 < lines.length) candidate = lines[i + 1].trim();
      candidate = candidate.replace(/[^a-zA-Z\s.]/g, '').trim();
      if (candidate.length >= 3 && !candidate.toLowerCase().includes('particular') && !candidate.toLowerCase().includes('seeking') && !candidate.toLowerCase().includes('admission')) {
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
        .replace(/.*?1\)\s*father\s*[\/\s]*guardian\s*name\s*[:\-]?\s*/i, '')
        .replace(/^(?:1\)|father|guardian|father['s]*\s+name|father\s*\/.*?\s*name)\s*[:\-]?\s*/i, '')
        .trim();
      if (!candidate && i + 1 < lines.length) candidate = lines[i + 1].trim();
      candidate = candidate.replace(/[^a-zA-Z\s.]/g, '').trim();
      if (candidate.length >= 2 && !candidate.toLowerCase().includes('occupation') && !candidate.toLowerCase().includes('parent') && !candidate.toLowerCase().includes('guardian')) {
        result.father_name = candidate;
      }
    }

    // Date of Birth
    if (!result.dob && (lower.includes('date of birth') || lower.includes('dob') || lower.includes('d.o.b') || lower.includes('2) date of birth'))) {
      const match = line.match(monthDobRegex) || line.match(dobRegex);
      if (match && match[1]) {
        result.dob = normalizeDate(match[1]);
      } else if (i + 1 < lines.length) {
        const nextMatch = lines[i + 1].match(monthDobRegex) || lines[i + 1].match(dobRegex);
        if (nextMatch && nextMatch[1]) result.dob = normalizeDate(nextMatch[1]);
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

    // Residential Address
    if (!result.address && (
      lower.includes('residential address') || 
      lower.includes('permanent address') || 
      lower.includes('5) residential address') ||
      lower.includes('sector') ||
      lower.includes('karachi') ||
      lower.includes('address:')
    )) {
      let candidate = line
        .replace(/.*?5\)\s*residential\s+address\s*[:\-]?\s*/i, '')
        .replace(/^(?:residential\s+address|address|permanent\s+address)\s*[:\-]?\s*/i, '')
        .trim();
      if (candidate.length > 5 && !candidate.toLowerCase().includes('cell') && !candidate.toLowerCase().includes('particular')) {
        result.address = candidate;
      }
    }

    // Father Occupation
    if (!result.father_occupation && (lower.includes('occupation') || lower.includes('2) occupation') || lower.includes('profession'))) {
      let candidate = line
        .replace(/.*?2\)\s*occupation\s*[:\-]?\s*/i, '')
        .replace(/^(?:occupation|profession|father['s]*\s+occupation)\s*[:\-]?\s*/i, '')
        .trim();
      if (candidate.length > 2 && !candidate.toLowerCase().includes('address')) {
        result.father_occupation = candidate;
      }
    }

    // Previous School
    if (!result.previous_school && (
      lower.includes('name of school') || 
      lower.includes('previous school') || 
      lower.includes('7) name of school') ||
      lower.includes('school / college') ||
      lower.includes('institution')
    )) {
      let candidate = line
        .replace(/.*?7\)\s*name\s+of\s+school\s*[\/\s]*college\s*[:\-]?\s*/i, '')
        .replace(/^(?:name\s+of\s+school|previous\s+school|school\s*\/.*?\s*college|institution)\s*[:\-]?\s*/i, '')
        .trim();
      if (candidate.length > 2) result.previous_school = candidate;
    }
  }

  // 5. Class Detection from Form
  const lowerAll = text.toLowerCase();
  if (lowerAll.includes('adc 1') || lowerAll.includes('adc-1') || lowerAll.includes('adc part 1') || lowerAll.includes('associate degree 1') || lowerAll.includes('b.com 1')) {
    result.class_name = 'ADC 1';
  } else if (lowerAll.includes('adc 2') || lowerAll.includes('adc-2') || lowerAll.includes('adc part 2') || lowerAll.includes('associate degree 2') || lowerAll.includes('b.com 2')) {
    result.class_name = 'ADC 2';
  } else if (lowerAll.includes('xii') || lowerAll.includes('12th') || lowerAll.includes('second year') || lowerAll.includes('2nd year')) {
    if (lowerAll.includes('pre-med') || lowerAll.includes('medical') || lowerAll.includes('biology')) result.class_name = 'Class XII - Pre-Medical';
    else if (lowerAll.includes('pre-eng') || lowerAll.includes('engineering')) result.class_name = 'Class XII - Pre-Engineering';
    else if (lowerAll.includes('computer')) result.class_name = 'Class XII - Computer Science';
    else if (lowerAll.includes('commerce')) result.class_name = 'Class XII - Commerce';
    else if (lowerAll.includes('arts') || lowerAll.includes('humanities')) result.class_name = 'Class XII - Arts';
    else result.class_name = 'Class XII - Computer Science';
  } else if (lowerAll.includes('xi') || lowerAll.includes('11th') || lowerAll.includes('first year') || lowerAll.includes('1st year')) {
    if (lowerAll.includes('pre-med') || lowerAll.includes('medical') || lowerAll.includes('biology')) result.class_name = 'Class XI - Pre-Medical';
    else if (lowerAll.includes('pre-eng') || lowerAll.includes('engineering')) result.class_name = 'Class XI - Pre-Engineering';
    else if (lowerAll.includes('computer')) result.class_name = 'Class XI - Computer Science';
    else if (lowerAll.includes('commerce')) result.class_name = 'Class XI - Commerce';
    else if (lowerAll.includes('arts') || lowerAll.includes('humanities')) result.class_name = 'Class XI - Arts';
    else result.class_name = 'Class XI - Computer Science';
  } else if (lowerAll.includes('class x') || lowerAll.includes('matric') || lowerAll.includes('10th')) {
    if (lowerAll.includes('computer')) result.class_name = 'Class X - Computer Science';
    else result.class_name = 'Class X - Science / Biology';
  } else if (lowerAll.includes('class ix') || lowerAll.includes('9th') || lowerAll.includes('8th')) {
    if (lowerAll.includes('computer')) result.class_name = 'Class IX - Computer Science';
    else result.class_name = 'Class IX - Science / Biology';
  } else if (lowerAll.includes('dit') || lowerAll.includes('diploma in information technology')) {
    result.class_name = 'Diploma in Information Technology (DIT)';
  }

  // 6. G.R. Number or Remarks Detection
  const grMatch = text.match(/g\.?r\.?\s*(?:no\.?|#)?\s*[:\-]?\s*(\d{2,6})/i);
  if (grMatch && grMatch[1]) {
    result.notes = `G.R. No. ${grMatch[1]}`;
  }

  return result;
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
