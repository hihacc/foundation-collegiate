/**
 * Centralized Academic Classes & Curriculum Utility for The Foundation Collegiate
 */

export interface ClassDefinition {
  key: string;
  name: string;
  category: 'Matriculation (IX & X)' | 'Intermediate (XI & XII)' | 'Diplomas & Others';
  defaultSubjects: { name: string; total_marks: number }[];
}

export const OFFICIAL_CLASSES: ClassDefinition[] = [
  // Matric Class IX
  {
    key: 'Class IX - Computer Science',
    name: 'Class IX - Computer Science',
    category: 'Matriculation (IX & X)',
    defaultSubjects: [
      { name: 'English', total_marks: 100 },
      { name: 'Urdu', total_marks: 100 },
      { name: 'Mathematics', total_marks: 100 },
      { name: 'Physics', total_marks: 100 },
      { name: 'Computer Science', total_marks: 100 },
      { name: 'Islamiat', total_marks: 50 },
    ]
  },
  {
    key: 'Class IX - Science / Biology',
    name: 'Class IX - Science (Biology)',
    category: 'Matriculation (IX & X)',
    defaultSubjects: [
      { name: 'English', total_marks: 100 },
      { name: 'Urdu', total_marks: 100 },
      { name: 'Mathematics', total_marks: 100 },
      { name: 'Physics', total_marks: 100 },
      { name: 'Chemistry', total_marks: 100 },
      { name: 'Biology', total_marks: 100 },
      { name: 'Islamiat', total_marks: 50 },
    ]
  },
  // Matric Class X
  {
    key: 'Class X - Computer Science',
    name: 'Class X - Computer Science',
    category: 'Matriculation (IX & X)',
    defaultSubjects: [
      { name: 'English', total_marks: 100 },
      { name: 'Urdu', total_marks: 100 },
      { name: 'Mathematics', total_marks: 100 },
      { name: 'Physics', total_marks: 100 },
      { name: 'Computer Science', total_marks: 100 },
      { name: 'Pakistan Studies', total_marks: 50 },
    ]
  },
  {
    key: 'Class X - Science / Biology',
    name: 'Class X - Science (Biology)',
    category: 'Matriculation (IX & X)',
    defaultSubjects: [
      { name: 'English', total_marks: 100 },
      { name: 'Urdu', total_marks: 100 },
      { name: 'Mathematics', total_marks: 100 },
      { name: 'Physics', total_marks: 100 },
      { name: 'Chemistry', total_marks: 100 },
      { name: 'Biology', total_marks: 100 },
      { name: 'Pakistan Studies', total_marks: 50 },
    ]
  },
  // Inter Class XI
  {
    key: 'Class XI - Pre-Medical',
    name: 'Class XI - Pre-Medical',
    category: 'Intermediate (XI & XII)',
    defaultSubjects: [
      { name: 'English', total_marks: 100 },
      { name: 'Urdu', total_marks: 100 },
      { name: 'Physics', total_marks: 100 },
      { name: 'Chemistry', total_marks: 100 },
      { name: 'Biology', total_marks: 100 },
      { name: 'Islamiat', total_marks: 50 },
    ]
  },
  {
    key: 'Class XI - Pre-Engineering',
    name: 'Class XI - Pre-Engineering',
    category: 'Intermediate (XI & XII)',
    defaultSubjects: [
      { name: 'English', total_marks: 100 },
      { name: 'Urdu', total_marks: 100 },
      { name: 'Physics', total_marks: 100 },
      { name: 'Chemistry', total_marks: 100 },
      { name: 'Mathematics', total_marks: 100 },
      { name: 'Islamiat', total_marks: 50 },
    ]
  },
  {
    key: 'Class XI - Computer Science',
    name: 'Class XI - Computer Science',
    category: 'Intermediate (XI & XII)',
    defaultSubjects: [
      { name: 'English', total_marks: 100 },
      { name: 'Urdu', total_marks: 100 },
      { name: 'Physics', total_marks: 100 },
      { name: 'Computer Science', total_marks: 100 },
      { name: 'Mathematics', total_marks: 100 },
      { name: 'Islamiat', total_marks: 50 },
    ]
  },
  {
    key: 'Class XI - Commerce',
    name: 'Class XI - Commerce',
    category: 'Intermediate (XI & XII)',
    defaultSubjects: [
      { name: 'English', total_marks: 100 },
      { name: 'Urdu', total_marks: 100 },
      { name: 'Principles of Accounting', total_marks: 100 },
      { name: 'Principles of Commerce', total_marks: 75 },
      { name: 'Principles of Economics', total_marks: 75 },
      { name: 'Business Mathematics', total_marks: 50 },
      { name: 'Islamiat', total_marks: 50 },
    ]
  },
  // Inter Class XII
  {
    key: 'Class XII - Pre-Medical',
    name: 'Class XII - Pre-Medical',
    category: 'Intermediate (XI & XII)',
    defaultSubjects: [
      { name: 'English', total_marks: 100 },
      { name: 'Urdu', total_marks: 100 },
      { name: 'Physics', total_marks: 100 },
      { name: 'Chemistry', total_marks: 100 },
      { name: 'Biology', total_marks: 100 },
      { name: 'Pakistan Studies', total_marks: 50 },
    ]
  },
  {
    key: 'Class XII - Pre-Engineering',
    name: 'Class XII - Pre-Engineering',
    category: 'Intermediate (XI & XII)',
    defaultSubjects: [
      { name: 'English', total_marks: 100 },
      { name: 'Urdu', total_marks: 100 },
      { name: 'Physics', total_marks: 100 },
      { name: 'Chemistry', total_marks: 100 },
      { name: 'Mathematics', total_marks: 100 },
      { name: 'Pakistan Studies', total_marks: 50 },
    ]
  },
  {
    key: 'Class XII - Computer Science',
    name: 'Class XII - Computer Science',
    category: 'Intermediate (XI & XII)',
    defaultSubjects: [
      { name: 'English', total_marks: 100 },
      { name: 'Urdu', total_marks: 100 },
      { name: 'Physics', total_marks: 100 },
      { name: 'Computer Science', total_marks: 100 },
      { name: 'Mathematics', total_marks: 100 },
      { name: 'Pakistan Studies', total_marks: 50 },
    ]
  },
  {
    key: 'Class XII - Commerce',
    name: 'Class XII - Commerce',
    category: 'Intermediate (XI & XII)',
    defaultSubjects: [
      { name: 'English', total_marks: 100 },
      { name: 'Urdu', total_marks: 100 },
      { name: 'Advanced Accounting', total_marks: 100 },
      { name: 'Commercial Geography', total_marks: 75 },
      { name: 'Banking', total_marks: 75 },
      { name: 'Business Statistics', total_marks: 50 },
      { name: 'Pakistan Studies', total_marks: 50 },
    ]
  },
  // Diplomas
  {
    key: 'Diploma in Information Technology (DIT)',
    name: 'Diploma in Information Technology (DIT)',
    category: 'Diplomas & Others',
    defaultSubjects: [
      { name: 'Office Automation & IT Tools', total_marks: 100 },
      { name: 'Web Development (HTML/CSS/JS)', total_marks: 100 },
      { name: 'Programming & Logic Building', total_marks: 100 },
      { name: 'Database Management Systems', total_marks: 100 },
      { name: 'Graphic Design Basics', total_marks: 100 },
    ]
  },
  {
    key: 'Diploma in Accounting & Finance',
    name: 'Diploma in Accounting & Finance',
    category: 'Diplomas & Others',
    defaultSubjects: [
      { name: 'Financial Accounting', total_marks: 100 },
      { name: 'Computerized Accounting (QuickBooks & Excel)', total_marks: 100 },
      { name: 'Business Taxation', total_marks: 100 },
      { name: 'Cost Accounting & Auditing', total_marks: 100 },
    ]
  }
];

/**
 * Smart class matching helper to ensure students in all class variations match reliably and distinctively
 */
export function matchStudentToClass(studentClass: string | null | undefined, targetClassKey: string): boolean {
  if (!targetClassKey || targetClassKey === 'ALL_STUDENTS' || targetClassKey === 'All' || targetClassKey === 'all') {
    return true;
  }
  if (!studentClass) return false;

  const s = studentClass.trim().toLowerCase();
  const t = targetClassKey.trim().toLowerCase();

  // 1. Exact Direct match
  if (s === t) return true;

  // 2. Class IX distinct matches
  const isTargetClass9 = t.includes('class ix') || t.startsWith('ix');
  const isStudentClass9 = s.includes('class ix') || s.startsWith('ix');

  if (isTargetClass9) {
    if (!isStudentClass9) return false;

    // Distinguish Computer Science vs Science (Biology)
    if (t.includes('computer')) {
      return s.includes('computer');
    }
    if (t.includes('bio') || t.includes('science')) {
      return (s.includes('bio') || s.includes('medical')) || (s.includes('science') && !s.includes('computer'));
    }
    return true;
  }

  // 3. Class X distinct matches
  const isTargetClass10 = t.includes('class x') && !t.includes('class xi') && !t.includes('class xii');
  const isStudentClass10 = s.includes('class x') && !s.includes('class xi') && !s.includes('class xii');

  if (isTargetClass10) {
    if (!isStudentClass10) return false;

    // Distinguish Computer Science vs Science (Biology)
    if (t.includes('computer')) {
      return s.includes('computer');
    }
    if (t.includes('bio') || t.includes('science')) {
      return (s.includes('bio') || s.includes('medical')) || (s.includes('science') && !s.includes('computer'));
    }
    return true;
  }

  // 4. Class XI distinct matches
  const isTargetClass11 = t.includes('class xi') && !t.includes('class xii');
  const isStudentClass11 = s.includes('class xi') && !s.includes('class xii');

  if (isTargetClass11) {
    if (!isStudentClass11) return false;

    if (t.includes('commerce')) return s.includes('commerce');
    if (t.includes('computer')) return s.includes('computer');
    if (t.includes('pre-med') || t.includes('medical')) return s.includes('pre-med') || s.includes('medical') || s.includes('bio');
    if (t.includes('pre-eng') || t.includes('engineering')) return s.includes('pre-eng') || s.includes('engineering');
    return true;
  }

  // 5. Class XII distinct matches
  const isTargetClass12 = t.includes('class xii');
  const isStudentClass12 = s.includes('class xii');

  if (isTargetClass12) {
    if (!isStudentClass12) return false;

    if (t.includes('commerce')) return s.includes('commerce');
    if (t.includes('computer')) return s.includes('computer');
    if (t.includes('pre-med') || t.includes('medical')) return s.includes('pre-med') || s.includes('medical') || s.includes('bio');
    if (t.includes('pre-eng') || t.includes('engineering')) return s.includes('pre-eng') || s.includes('engineering');
    return true;
  }

  // 6. Professional Diploma matches
  if (t.includes('dit') || t.includes('information technology')) {
    return s.includes('dit') || s.includes('information technology');
  }
  if (t.includes('accounting') || t.includes('finance')) {
    return s.includes('accounting') || s.includes('finance');
  }

  // 7. General inclusion
  return s.includes(t) || t.includes(s);
}

/**
 * Returns default subjects for any class
 */
export function getDefaultSubjectsForClass(classKey: string) {
  const found = OFFICIAL_CLASSES.find(c => c.key === classKey);
  if (found) return found.defaultSubjects;

  if (classKey.toLowerCase().includes('commerce')) {
    return [
      { name: 'English', total_marks: 100 },
      { name: 'Urdu', total_marks: 100 },
      { name: 'Accounting', total_marks: 100 },
      { name: 'Economics', total_marks: 75 },
      { name: 'Commerce / Geography', total_marks: 75 },
      { name: 'Business Math', total_marks: 50 },
    ];
  }

  return [
    { name: 'English', total_marks: 100 },
    { name: 'Urdu', total_marks: 100 },
    { name: 'Mathematics', total_marks: 100 },
    { name: 'Physics', total_marks: 100 },
    { name: 'Computer Science', total_marks: 100 },
    { name: 'Islamiat', total_marks: 50 },
  ];
}
