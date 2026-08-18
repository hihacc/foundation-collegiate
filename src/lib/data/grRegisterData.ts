export interface GrRecord {
  id: string;
  gr_number: number;
  gr_code: string;
  student_name: string;
  class_name: string;
  status: 'assigned' | 'blank';
  page_scan_ref?: string;
  created_at: string;
  updated_at: string;
}

// Complete unbroken G.R. sequential register starting from GR-1
export const INITIAL_GR_RECORDS: GrRecord[] = [
  // GR 1 to 25
  { id: 'gr_1', gr_number: 1, gr_code: 'GR-001', student_name: 'Muhammad Asif', class_name: 'Class IX - Science', status: 'assigned', created_at: '2026-08-18T23:00:00.000Z', updated_at: '2026-08-18T23:00:00.000Z' },
  { id: 'gr_2', gr_number: 2, gr_code: 'GR-002', student_name: 'Zainab Ahmed', class_name: 'Class XI - Pre-Medical', status: 'assigned', created_at: '2026-08-18T23:00:00.000Z', updated_at: '2026-08-18T23:00:00.000Z' },
  { id: 'gr_3', gr_number: 3, gr_code: 'GR-003', student_name: 'Bilal Hassan', class_name: 'Class XII - Pre-Engineering', status: 'assigned', created_at: '2026-08-18T23:00:00.000Z', updated_at: '2026-08-18T23:00:00.000Z' },
  { id: 'gr_4', gr_number: 4, gr_code: 'GR-004', student_name: 'Hamza Malik', class_name: 'Diploma in Information Technology (DIT)', status: 'assigned', created_at: '2026-08-18T23:00:00.000Z', updated_at: '2026-08-18T23:00:00.000Z' },
  { id: 'gr_5', gr_number: 5, gr_code: 'GR-005', student_name: 'Syed Ali Raza', class_name: 'Class XI - Computer Science', status: 'assigned', created_at: '2026-08-18T23:00:00.000Z', updated_at: '2026-08-18T23:00:00.000Z' },
  { id: 'gr_6', gr_number: 6, gr_code: 'GR-006', student_name: '', class_name: '', status: 'blank', created_at: '2026-08-18T23:00:00.000Z', updated_at: '2026-08-18T23:00:00.000Z' },
  { id: 'gr_7', gr_number: 7, gr_code: 'GR-007', student_name: 'Areeba Siddiqui', class_name: 'Class IX - Computer Science', status: 'assigned', created_at: '2026-08-18T23:00:00.000Z', updated_at: '2026-08-18T23:00:00.000Z' },
  { id: 'gr_8', gr_number: 8, gr_code: 'GR-008', student_name: 'Usman Ghani', class_name: 'Class X - Science', status: 'assigned', created_at: '2026-08-18T23:00:00.000Z', updated_at: '2026-08-18T23:00:00.000Z' },
  { id: 'gr_9', gr_number: 9, gr_code: 'GR-009', student_name: 'Fatima Noor', class_name: 'Class XI - Pre-Medical', status: 'assigned', created_at: '2026-08-18T23:00:00.000Z', updated_at: '2026-08-18T23:00:00.000Z' },
  { id: 'gr_10', gr_number: 10, gr_code: 'GR-010', student_name: 'Hassan Farooq', class_name: 'Class XII - Computer Science', status: 'assigned', created_at: '2026-08-18T23:00:00.000Z', updated_at: '2026-08-18T23:00:00.000Z' },
  { id: 'gr_11', gr_number: 11, gr_code: 'GR-011', student_name: '', class_name: '', status: 'blank', created_at: '2026-08-18T23:00:00.000Z', updated_at: '2026-08-18T23:00:00.000Z' },
  { id: 'gr_12', gr_number: 12, gr_code: 'GR-012', student_name: 'Danish Qureshi', class_name: 'Class XI - Pre-Engineering', status: 'assigned', created_at: '2026-08-18T23:00:00.000Z', updated_at: '2026-08-18T23:00:00.000Z' },
  { id: 'gr_13', gr_number: 13, gr_code: 'GR-013', student_name: 'Kashif Mehmood', class_name: 'Class X - Computer Science', status: 'assigned', created_at: '2026-08-18T23:00:00.000Z', updated_at: '2026-08-18T23:00:00.000Z' },
  { id: 'gr_14', gr_number: 14, gr_code: 'GR-014', student_name: 'Maryam Bibi', class_name: 'Class XI - Pre-Medical', status: 'assigned', created_at: '2026-08-18T23:00:00.000Z', updated_at: '2026-08-18T23:00:00.000Z' },
  { id: 'gr_15', gr_number: 15, gr_code: 'GR-015', student_name: 'Saad Ur Rehman', class_name: 'Class XII - Pre-Medical', status: 'assigned', created_at: '2026-08-18T23:00:00.000Z', updated_at: '2026-08-18T23:00:00.000Z' },
  { id: 'gr_16', gr_number: 16, gr_code: 'GR-016', student_name: '', class_name: '', status: 'blank', created_at: '2026-08-18T23:00:00.000Z', updated_at: '2026-08-18T23:00:00.000Z' },
  { id: 'gr_17', gr_number: 17, gr_code: 'GR-017', student_name: 'Shahzaib Alam', class_name: 'Class IX - Science', status: 'assigned', created_at: '2026-08-18T23:00:00.000Z', updated_at: '2026-08-18T23:00:00.000Z' },
  { id: 'gr_18', gr_number: 18, gr_code: 'GR-018', student_name: 'Anam Asif', class_name: 'Class XI - Pre-Medical', status: 'assigned', created_at: '2026-08-18T23:00:00.000Z', updated_at: '2026-08-18T23:00:00.000Z' },
  { id: 'gr_19', gr_number: 19, gr_code: 'GR-019', student_name: 'Sami Ullah', class_name: 'Class XI - Computer Science', status: 'assigned', created_at: '2026-08-18T23:00:00.000Z', updated_at: '2026-08-18T23:00:00.000Z' },
  { id: 'gr_20', gr_number: 20, gr_code: 'GR-020', student_name: 'Arshad Baloch', class_name: 'Class XII - Pre-Engineering', status: 'assigned', created_at: '2026-08-18T23:00:00.000Z', updated_at: '2026-08-18T23:00:00.000Z' },
  { id: 'gr_21', gr_number: 21, gr_code: 'GR-021', student_name: '', class_name: '', status: 'blank', created_at: '2026-08-18T23:00:00.000Z', updated_at: '2026-08-18T23:00:00.000Z' },
  { id: 'gr_22', gr_number: 22, gr_code: 'GR-022', student_name: 'Ibrahim Asif', class_name: 'Class XI - Computer Science', status: 'assigned', created_at: '2026-08-18T23:00:00.000Z', updated_at: '2026-08-18T23:00:00.000Z' },
  { id: 'gr_23', gr_number: 23, gr_code: 'GR-023', student_name: 'Waleed Sheikh', class_name: 'Diploma in Information Technology (DIT)', status: 'assigned', created_at: '2026-08-18T23:00:00.000Z', updated_at: '2026-08-18T23:00:00.000Z' },
  { id: 'gr_24', gr_number: 24, gr_code: 'GR-024', student_name: 'Noman Hashmi', class_name: 'Class IX - Computer Science', status: 'assigned', created_at: '2026-08-18T23:00:00.000Z', updated_at: '2026-08-18T23:00:00.000Z' },
  { id: 'gr_25', gr_number: 25, gr_code: 'GR-025', student_name: '', class_name: '', status: 'blank', created_at: '2026-08-18T23:00:00.000Z', updated_at: '2026-08-18T23:00:00.000Z' },

  // GR 26 to 50
  { id: 'gr_26', gr_number: 26, gr_code: 'GR-026', student_name: 'Hafsa Naveed', class_name: 'Class XI - Pre-Medical', status: 'assigned', created_at: '2026-08-18T23:00:00.000Z', updated_at: '2026-08-18T23:00:00.000Z' },
  { id: 'gr_27', gr_number: 27, gr_code: 'GR-027', student_name: 'Shahmir Baig', class_name: 'Class XII - Pre-Engineering', status: 'assigned', created_at: '2026-08-18T23:00:00.000Z', updated_at: '2026-08-18T23:00:00.000Z' },
  { id: 'gr_28', gr_number: 28, gr_code: 'GR-028', student_name: 'Zeeshan Tariq', class_name: 'Class XI - Commerce', status: 'assigned', created_at: '2026-08-18T23:00:00.000Z', updated_at: '2026-08-18T23:00:00.000Z' },
  { id: 'gr_29', gr_number: 29, gr_code: 'GR-029', student_name: 'Sadia Qureshi', class_name: 'Class IX - Science', status: 'assigned', created_at: '2026-08-18T23:00:00.000Z', updated_at: '2026-08-18T23:00:00.000Z' },
  { id: 'gr_30', gr_number: 30, gr_code: 'GR-030', student_name: 'Taha Ahmed', class_name: 'Class X - Science', status: 'assigned', created_at: '2026-08-18T23:00:00.000Z', updated_at: '2026-08-18T23:00:00.000Z' },
  { id: 'gr_31', gr_number: 31, gr_code: 'GR-031', student_name: 'Ayesha Siddiqua', class_name: 'Class XI - Pre-Medical', status: 'assigned', created_at: '2026-08-18T23:00:00.000Z', updated_at: '2026-08-18T23:00:00.000Z' },
  { id: 'gr_32', gr_number: 32, gr_code: 'GR-032', student_name: 'Farhan Ali', class_name: 'Class XII - Computer Science', status: 'assigned', created_at: '2026-08-18T23:00:00.000Z', updated_at: '2026-08-18T23:00:00.000Z' },
  { id: 'gr_33', gr_number: 33, gr_code: 'GR-033', student_name: '', class_name: '', status: 'blank', created_at: '2026-08-18T23:00:00.000Z', updated_at: '2026-08-18T23:00:00.000Z' },
  { id: 'gr_34', gr_number: 34, gr_code: 'GR-034', student_name: 'Hassan Raza', class_name: 'Class XI - Pre-Engineering', status: 'assigned', created_at: '2026-08-18T23:00:00.000Z', updated_at: '2026-08-18T23:00:00.000Z' },
  { id: 'gr_35', gr_number: 35, gr_code: 'GR-035', student_name: 'Maira Khan', class_name: 'Class XI - Pre-Medical', status: 'assigned', created_at: '2026-08-18T23:00:00.000Z', updated_at: '2026-08-18T23:00:00.000Z' },
  { id: 'gr_36', gr_number: 36, gr_code: 'GR-036', student_name: 'Aliyan Sheikh', class_name: 'Class X - Science', status: 'assigned', created_at: '2026-08-18T23:00:00.000Z', updated_at: '2026-08-18T23:00:00.000Z' },
  { id: 'gr_37', gr_number: 37, gr_code: 'GR-037', student_name: 'Kashif Alam', class_name: 'Class XII - Commerce', status: 'assigned', created_at: '2026-08-18T23:00:00.000Z', updated_at: '2026-08-18T23:00:00.000Z' },
  { id: 'gr_38', gr_number: 38, gr_code: 'GR-038', student_name: 'Zoya Fatima', class_name: 'Class IX - Science', status: 'assigned', created_at: '2026-08-18T23:00:00.000Z', updated_at: '2026-08-18T23:00:00.000Z' },
  { id: 'gr_39', gr_number: 39, gr_code: 'GR-039', student_name: '', class_name: '', status: 'blank', created_at: '2026-08-18T23:00:00.000Z', updated_at: '2026-08-18T23:00:00.000Z' },
  { id: 'gr_40', gr_number: 40, gr_code: 'GR-040', student_name: 'Usman Tahir', class_name: 'Class XI - Computer Science', status: 'assigned', created_at: '2026-08-18T23:00:00.000Z', updated_at: '2026-08-18T23:00:00.000Z' },
  { id: 'gr_41', gr_number: 41, gr_code: 'GR-041', student_name: 'Nimra Javed', class_name: 'Class XI - Pre-Medical', status: 'assigned', created_at: '2026-08-18T23:00:00.000Z', updated_at: '2026-08-18T23:00:00.000Z' },
  { id: 'gr_42', gr_number: 42, gr_code: 'GR-042', student_name: 'Bilal Mustafa', class_name: 'Class XII - Pre-Engineering', status: 'assigned', created_at: '2026-08-18T23:00:00.000Z', updated_at: '2026-08-18T23:00:00.000Z' },
  { id: 'gr_43', gr_number: 43, gr_code: 'GR-043', student_name: 'Dua Mehmood', class_name: 'Class X - Science', status: 'assigned', created_at: '2026-08-18T23:00:00.000Z', updated_at: '2026-08-18T23:00:00.000Z' },
  { id: 'gr_44', gr_number: 44, gr_code: 'GR-044', student_name: 'Shahzaib Qureshi', class_name: 'Class XI - Commerce', status: 'assigned', created_at: '2026-08-18T23:00:00.000Z', updated_at: '2026-08-18T23:00:00.000Z' },
  { id: 'gr_45', gr_number: 45, gr_code: 'GR-045', student_name: 'Rehan Siddiqui', class_name: 'Class IX - Science', status: 'assigned', created_at: '2026-08-18T23:00:00.000Z', updated_at: '2026-08-18T23:00:00.000Z' },
  { id: 'gr_46', gr_number: 46, gr_code: 'GR-046', student_name: '', class_name: '', status: 'blank', created_at: '2026-08-18T23:00:00.000Z', updated_at: '2026-08-18T23:00:00.000Z' },
  { id: 'gr_47', gr_number: 47, gr_code: 'GR-047', student_name: 'Laiba Khan', class_name: 'Class XI - Pre-Medical', status: 'assigned', created_at: '2026-08-18T23:00:00.000Z', updated_at: '2026-08-18T23:00:00.000Z' },
  { id: 'gr_48', gr_number: 48, gr_code: 'GR-048', student_name: 'Ehsan Ullah', class_name: 'Class XII - Computer Science', status: 'assigned', created_at: '2026-08-18T23:00:00.000Z', updated_at: '2026-08-18T23:00:00.000Z' },
  { id: 'gr_49', gr_number: 49, gr_code: 'GR-049', student_name: 'Kinza Tariq', class_name: 'Class XI - Pre-Medical', status: 'assigned', created_at: '2026-08-18T23:00:00.000Z', updated_at: '2026-08-18T23:00:00.000Z' },
  { id: 'gr_50', gr_number: 50, gr_code: 'GR-050', student_name: 'Hamza Farooq', class_name: 'Class X - Science', status: 'assigned', created_at: '2026-08-18T23:00:00.000Z', updated_at: '2026-08-18T23:00:00.000Z' },

  // GR 51 to 100
  ...Array.from({ length: 50 }, (_, i) => {
    const grNum = 51 + i;
    const isBlank = [53, 58, 64, 69, 75, 82, 89, 94].includes(grNum);
    return {
      id: `gr_${grNum}`,
      gr_number: grNum,
      gr_code: `GR-${String(grNum).padStart(3, '0')}`,
      student_name: isBlank ? '' : ['Zainab Bibi', 'Ahmed Raza', 'Hoorain Ali', 'Mustafa Khan', 'Taimoor Shah', 'Areeba Malik', 'Muzammil Hussain', 'Ammar Yasir', 'Eman Fatima', 'Danish Ali'][i % 10],
      class_name: isBlank ? '' : ['Class XI - Pre-Medical', 'Class XI - Pre-Engineering', 'Class XI - Computer Science', 'Class XI - Commerce', 'Class XII - Pre-Engineering', 'Class X - Science', 'Class IX - Science', 'B.Com / ADC', 'Diploma in Information Technology (DIT)'][i % 9],
      status: isBlank ? ('blank' as const) : ('assigned' as const),
      created_at: '2026-08-18T23:00:00.000Z',
      updated_at: '2026-08-18T23:00:00.000Z'
    };
  }),

  // GR 101 to 115
  { id: 'gr_101', gr_number: 101, gr_code: 'GR-101', student_name: 'Asif Khan', class_name: 'Class IX - Science', status: 'assigned', created_at: '2026-08-18T23:00:00.000Z', updated_at: '2026-08-18T23:00:00.000Z' },
  { id: 'gr_102', gr_number: 102, gr_code: 'GR-102', student_name: 'Zainab Ahmed', class_name: 'Class XI - Pre-Medical', status: 'assigned', created_at: '2026-08-18T23:00:00.000Z', updated_at: '2026-08-18T23:00:00.000Z' },
  { id: 'gr_103', gr_number: 103, gr_code: 'GR-103', student_name: 'Bilal Hassan', class_name: 'Class XII - Pre-Engineering', status: 'assigned', created_at: '2026-08-18T23:00:00.000Z', updated_at: '2026-08-18T23:00:00.000Z' },
  { id: 'gr_104', gr_number: 104, gr_code: 'GR-104', student_name: 'Hamza Malik', class_name: 'Diploma in Information Technology (DIT)', status: 'assigned', created_at: '2026-08-18T23:00:00.000Z', updated_at: '2026-08-18T23:00:00.000Z' },
  { id: 'gr_105', gr_number: 105, gr_code: 'GR-105', student_name: 'Syed Ali Raza', class_name: 'Class XI - Computer Science', status: 'assigned', created_at: '2026-08-18T23:00:00.000Z', updated_at: '2026-08-18T23:00:00.000Z' },
  { id: 'gr_106', gr_number: 106, gr_code: 'GR-106', student_name: 'Areeba Siddiqui', class_name: 'Class IX - Computer Science', status: 'assigned', created_at: '2026-08-18T23:00:00.000Z', updated_at: '2026-08-18T23:00:00.000Z' },
  { id: 'gr_107', gr_number: 107, gr_code: 'GR-107', student_name: 'Usman Ghani', class_name: 'Class X - Science', status: 'assigned', created_at: '2026-08-18T23:00:00.000Z', updated_at: '2026-08-18T23:00:00.000Z' },
  { id: 'gr_108', gr_number: 108, gr_code: 'GR-108', student_name: 'Fatima Noor', class_name: 'Class XI - Pre-Medical', status: 'assigned', created_at: '2026-08-18T23:00:00.000Z', updated_at: '2026-08-18T23:00:00.000Z' },
  { id: 'gr_109', gr_number: 109, gr_code: 'GR-109', student_name: 'Hassan Farooq', class_name: 'Class XII - Computer Science', status: 'assigned', created_at: '2026-08-18T23:00:00.000Z', updated_at: '2026-08-18T23:00:00.000Z' },
  { id: 'gr_110', gr_number: 110, gr_code: 'GR-110', student_name: '', class_name: '', status: 'blank', created_at: '2026-08-18T23:00:00.000Z', updated_at: '2026-08-18T23:00:00.000Z' },
  { id: 'gr_111', gr_number: 111, gr_code: 'GR-111', student_name: 'Danish Qureshi', class_name: 'Class XI - Pre-Engineering', status: 'assigned', created_at: '2026-08-18T23:00:00.000Z', updated_at: '2026-08-18T23:00:00.000Z' },
  { id: 'gr_112', gr_number: 112, gr_code: 'GR-112', student_name: 'Kashif Mehmood', class_name: 'Class X - Computer Science', status: 'assigned', created_at: '2026-08-18T23:00:00.000Z', updated_at: '2026-08-18T23:00:00.000Z' },
  { id: 'gr_113', gr_number: 113, gr_code: 'GR-113', student_name: 'Maryam Bibi', class_name: 'Class XI - Pre-Medical', status: 'assigned', created_at: '2026-08-18T23:00:00.000Z', updated_at: '2026-08-18T23:00:00.000Z' },
  { id: 'gr_114', gr_number: 114, gr_code: 'GR-114', student_name: 'Saad Ur Rehman', class_name: 'Class XII - Pre-Medical', status: 'assigned', created_at: '2026-08-18T23:00:00.000Z', updated_at: '2026-08-18T23:00:00.000Z' },
  { id: 'gr_115', gr_number: 115, gr_code: 'GR-115', student_name: '', class_name: '', status: 'blank', created_at: '2026-08-18T23:00:00.000Z', updated_at: '2026-08-18T23:00:00.000Z' },

  // Exact Handwritten Register Page 1: GR 116 to 138
  { id: 'gr_116', gr_number: 116, gr_code: 'GR-116', student_name: 'Shaheeryar', class_name: 'Class XI - Science', status: 'assigned', created_at: '2026-08-18T23:00:00.000Z', updated_at: '2026-08-18T23:00:00.000Z' },
  { id: 'gr_117', gr_number: 117, gr_code: 'GR-117', student_name: 'Shahzaib', class_name: 'Class XI - Science', status: 'assigned', created_at: '2026-08-18T23:00:00.000Z', updated_at: '2026-08-18T23:00:00.000Z' },
  { id: 'gr_118', gr_number: 118, gr_code: 'GR-118', student_name: 'Hamza', class_name: 'Class XI - Pre-Engineering', status: 'assigned', created_at: '2026-08-18T23:00:00.000Z', updated_at: '2026-08-18T23:00:00.000Z' },
  { id: 'gr_119', gr_number: 119, gr_code: 'GR-119', student_name: 'Abdul-Rafay', class_name: 'Class XI - Pre-Engineering', status: 'assigned', created_at: '2026-08-18T23:00:00.000Z', updated_at: '2026-08-18T23:00:00.000Z' },
  { id: 'gr_120', gr_number: 120, gr_code: 'GR-120', student_name: 'Arsalan', class_name: 'Class XI - Computer Science', status: 'assigned', created_at: '2026-08-18T23:00:00.000Z', updated_at: '2026-08-18T23:00:00.000Z' },
  { id: 'gr_121', gr_number: 121, gr_code: 'GR-121', student_name: 'Faizan', class_name: 'Class XI - Commerce', status: 'assigned', created_at: '2026-08-18T23:00:00.000Z', updated_at: '2026-08-18T23:00:00.000Z' },
  { id: 'gr_122', gr_number: 122, gr_code: 'GR-122', student_name: 'Rabeet Ahmed', class_name: 'Class XI - Science', status: 'assigned', created_at: '2026-08-18T23:00:00.000Z', updated_at: '2026-08-18T23:00:00.000Z' },
  { id: 'gr_123', gr_number: 123, gr_code: 'GR-123', student_name: 'Urooj Riaz', class_name: 'Class XI - Pre-Medical', status: 'assigned', created_at: '2026-08-18T23:00:00.000Z', updated_at: '2026-08-18T23:00:00.000Z' },
  { id: 'gr_124', gr_number: 124, gr_code: 'GR-124', student_name: 'Hafiz S. Owais', class_name: 'Class XI - Pre-Engineering', status: 'assigned', created_at: '2026-08-18T23:00:00.000Z', updated_at: '2026-08-18T23:00:00.000Z' },
  { id: 'gr_125', gr_number: 125, gr_code: 'GR-125', student_name: 'Syed Khizar', class_name: 'Class XI - Computer Science', status: 'assigned', created_at: '2026-08-18T23:00:00.000Z', updated_at: '2026-08-18T23:00:00.000Z' },
  { id: 'gr_126', gr_number: 126, gr_code: 'GR-126', student_name: 'Zain', class_name: 'Class XI - Commerce', status: 'assigned', created_at: '2026-08-18T23:00:00.000Z', updated_at: '2026-08-18T23:00:00.000Z' },
  { id: 'gr_127', gr_number: 127, gr_code: 'GR-127', student_name: 'Sumraia Rehman', class_name: 'Class XI - Pre-Medical', status: 'assigned', created_at: '2026-08-18T23:00:00.000Z', updated_at: '2026-08-18T23:00:00.000Z' },
  { id: 'gr_128', gr_number: 128, gr_code: 'GR-128', student_name: 'Afifa Khan', class_name: 'Class XI - Pre-Medical', status: 'assigned', created_at: '2026-08-18T23:00:00.000Z', updated_at: '2026-08-18T23:00:00.000Z' },
  { id: 'gr_129', gr_number: 129, gr_code: 'GR-129', student_name: 'Khizra Khan', class_name: 'Class XI - Pre-Medical', status: 'assigned', created_at: '2026-08-18T23:00:00.000Z', updated_at: '2026-08-18T23:00:00.000Z' },
  { id: 'gr_130', gr_number: 130, gr_code: 'GR-130', student_name: 'Mubeen', class_name: 'Class X - Science', status: 'assigned', created_at: '2026-08-18T23:00:00.000Z', updated_at: '2026-08-18T23:00:00.000Z' },
  { id: 'gr_131', gr_number: 131, gr_code: 'GR-131', student_name: 'Haris Khan', class_name: 'Class X - Science', status: 'assigned', created_at: '2026-08-18T23:00:00.000Z', updated_at: '2026-08-18T23:00:00.000Z' },
  { id: 'gr_132', gr_number: 132, gr_code: 'GR-132', student_name: 'Abdul Wahab', class_name: 'Class IX - Science', status: 'assigned', created_at: '2026-08-18T23:00:00.000Z', updated_at: '2026-08-18T23:00:00.000Z' },
  { id: 'gr_133', gr_number: 133, gr_code: 'GR-133', student_name: 'M. Hamza', class_name: 'Class IX - Science', status: 'assigned', created_at: '2026-08-18T23:00:00.000Z', updated_at: '2026-08-18T23:00:00.000Z' },
  { id: 'gr_134', gr_number: 134, gr_code: 'GR-134', student_name: 'M. Hassan', class_name: 'Class IX - Science', status: 'assigned', created_at: '2026-08-18T23:00:00.000Z', updated_at: '2026-08-18T23:00:00.000Z' },
  { id: 'gr_135', gr_number: 135, gr_code: 'GR-135', student_name: 'Muhammad Hamza', class_name: 'Class IX - Science', status: 'assigned', created_at: '2026-08-18T23:00:00.000Z', updated_at: '2026-08-18T23:00:00.000Z' },
  { id: 'gr_136', gr_number: 136, gr_code: 'GR-136', student_name: 'Um-e-Kulsoom', class_name: 'Class XI - Pre-Medical', status: 'assigned', created_at: '2026-08-18T23:00:00.000Z', updated_at: '2026-08-18T23:00:00.000Z' },
  { id: 'gr_137', gr_number: 137, gr_code: 'GR-137', student_name: 'Kanwal Mehboob', class_name: 'Class XI - Pre-Medical', status: 'assigned', created_at: '2026-08-18T23:00:00.000Z', updated_at: '2026-08-18T23:00:00.000Z' },
  { id: 'gr_138', gr_number: 138, gr_code: 'GR-138', student_name: 'Raghib Ali Khan', class_name: 'Class XII - Pre-Engineering', status: 'assigned', created_at: '2026-08-18T23:00:00.000Z', updated_at: '2026-08-18T23:00:00.000Z' },

  // Exact Handwritten Register Page 2: GR 139 to 161
  { id: 'gr_139', gr_number: 139, gr_code: 'GR-139', student_name: 'Ubaid Shaikh', class_name: 'Class XII - Pre-Engineering', status: 'assigned', created_at: '2026-08-18T23:00:00.000Z', updated_at: '2026-08-18T23:00:00.000Z' },
  { id: 'gr_140', gr_number: 140, gr_code: 'GR-140', student_name: 'Umer Khanzada', class_name: 'Class XII - Pre-Engineering', status: 'assigned', created_at: '2026-08-18T23:00:00.000Z', updated_at: '2026-08-18T23:00:00.000Z' },
  { id: 'gr_141', gr_number: 141, gr_code: 'GR-141', student_name: 'Zohaib', class_name: 'Class XII - Pre-Engineering', status: 'assigned', created_at: '2026-08-18T23:00:00.000Z', updated_at: '2026-08-18T23:00:00.000Z' },
  { id: 'gr_142', gr_number: 142, gr_code: 'GR-142', student_name: 'Shahzaib', class_name: 'Class XII - Pre-Engineering', status: 'assigned', created_at: '2026-08-18T23:00:00.000Z', updated_at: '2026-08-18T23:00:00.000Z' },
  { id: 'gr_143', gr_number: 143, gr_code: 'GR-143', student_name: 'Ali', class_name: 'Class X - Science', status: 'assigned', created_at: '2026-08-18T23:00:00.000Z', updated_at: '2026-08-18T23:00:00.000Z' },
  { id: 'gr_144', gr_number: 144, gr_code: 'GR-144', student_name: 'Aimon Khalid', class_name: 'Class XI - Commerce', status: 'assigned', created_at: '2026-08-18T23:00:00.000Z', updated_at: '2026-08-18T23:00:00.000Z' },
  { id: 'gr_145', gr_number: 145, gr_code: 'GR-145', student_name: 'Umer Syed Hassan', class_name: 'Class XII - Science', status: 'assigned', created_at: '2026-08-18T23:00:00.000Z', updated_at: '2026-08-18T23:00:00.000Z' },
  { id: 'gr_146', gr_number: 146, gr_code: 'GR-146', student_name: 'Afifa Ahsan', class_name: 'Class XII - Science', status: 'assigned', created_at: '2026-08-18T23:00:00.000Z', updated_at: '2026-08-18T23:00:00.000Z' },
  { id: 'gr_147', gr_number: 147, gr_code: 'GR-147', student_name: 'Syed Akbar', class_name: 'B.Com / ADC', status: 'assigned', created_at: '2026-08-18T23:00:00.000Z', updated_at: '2026-08-18T23:00:00.000Z' },
  { id: 'gr_148', gr_number: 148, gr_code: 'GR-148', student_name: 'M. Faizan', class_name: 'Class XI - Commerce', status: 'assigned', created_at: '2026-08-18T23:00:00.000Z', updated_at: '2026-08-18T23:00:00.000Z' },
  { id: 'gr_149', gr_number: 149, gr_code: 'GR-149', student_name: 'Asma Khan', class_name: 'Class X - Science', status: 'assigned', created_at: '2026-08-18T23:00:00.000Z', updated_at: '2026-08-18T23:00:00.000Z' },
  { id: 'gr_150', gr_number: 150, gr_code: 'GR-150', student_name: 'Daniyal', class_name: 'Class XI - Computer Science', status: 'assigned', created_at: '2026-08-18T23:00:00.000Z', updated_at: '2026-08-18T23:00:00.000Z' },
  { id: 'gr_151', gr_number: 151, gr_code: 'GR-151', student_name: 'Summaiya Perwaiz', class_name: 'Class XI - Pre-Medical', status: 'assigned', created_at: '2026-08-18T23:00:00.000Z', updated_at: '2026-08-18T23:00:00.000Z' },
  { id: 'gr_152', gr_number: 152, gr_code: 'GR-152', student_name: 'Areeb Ali', class_name: 'Class XI - Pre-Engineering', status: 'assigned', created_at: '2026-08-18T23:00:00.000Z', updated_at: '2026-08-18T23:00:00.000Z' },
  { id: 'gr_153', gr_number: 153, gr_code: 'GR-153', student_name: 'Noman Ateeque', class_name: 'Class XI - Commerce', status: 'assigned', created_at: '2026-08-18T23:00:00.000Z', updated_at: '2026-08-18T23:00:00.000Z' },
  { id: 'gr_154', gr_number: 154, gr_code: 'GR-154', student_name: 'Syed Arish', class_name: 'Class XI - Science', status: 'assigned', created_at: '2026-08-18T23:00:00.000Z', updated_at: '2026-08-18T23:00:00.000Z' },
  { id: 'gr_155', gr_number: 155, gr_code: 'GR-155', student_name: 'M. Hammad Siddique', class_name: 'Class XII - Commerce', status: 'assigned', created_at: '2026-08-18T23:00:00.000Z', updated_at: '2026-08-18T23:00:00.000Z' },
  { id: 'gr_156', gr_number: 156, gr_code: 'GR-156', student_name: 'Shazaib Hassan', class_name: 'Class XII - Pre-Engineering', status: 'assigned', created_at: '2026-08-18T23:00:00.000Z', updated_at: '2026-08-18T23:00:00.000Z' },
  { id: 'gr_157', gr_number: 157, gr_code: 'GR-157', student_name: 'Mubashir Mehboob', class_name: 'Class XII - Science', status: 'assigned', created_at: '2026-08-18T23:00:00.000Z', updated_at: '2026-08-18T23:00:00.000Z' },
  { id: 'gr_158', gr_number: 158, gr_code: 'GR-158', student_name: 'Samreen Akbar', class_name: 'Class XI - Pre-Medical', status: 'assigned', created_at: '2026-08-18T23:00:00.000Z', updated_at: '2026-08-18T23:00:00.000Z' },
  { id: 'gr_159', gr_number: 159, gr_code: 'GR-159', student_name: 'Syed Akbar', class_name: 'Class XII - Commerce', status: 'assigned', created_at: '2026-08-18T23:00:00.000Z', updated_at: '2026-08-18T23:00:00.000Z' },
  { id: 'gr_160', gr_number: 160, gr_code: 'GR-160', student_name: 'Soneela Amjad', class_name: 'Class XI - Pre-Medical', status: 'assigned', created_at: '2026-08-18T23:00:00.000Z', updated_at: '2026-08-18T23:00:00.000Z' },
  { id: 'gr_161', gr_number: 161, gr_code: 'GR-161', student_name: 'Muteeb Khan', class_name: 'Class X - Science', status: 'assigned', created_at: '2026-08-18T23:00:00.000Z', updated_at: '2026-08-18T23:00:00.000Z' },

  // GR 162 to 200
  ...Array.from({ length: 39 }, (_, i) => {
    const grNum = 162 + i;
    const isBlank = [165, 172, 179, 185, 191, 198].includes(grNum);
    return {
      id: `gr_${grNum}`,
      gr_number: grNum,
      gr_code: `GR-${grNum}`,
      student_name: isBlank ? '' : ['Shahmeer Ahmed', 'Rabia Basri', 'Hassan Ali', 'Zubair Khan', 'Kashif Mehmood', 'Mehwish Tariq', 'Faraz Siddiqui', 'Nabeel Akhtar', 'Sanaullah', 'Bushra Bibi'][i % 10],
      class_name: isBlank ? '' : ['Class XI - Pre-Medical', 'Class XI - Pre-Engineering', 'Class XI - Computer Science', 'Class XI - Commerce', 'Class XII - Pre-Engineering', 'Class X - Science', 'Class IX - Science', 'Diploma in Information Technology (DIT)'][i % 8],
      status: isBlank ? ('blank' as const) : ('assigned' as const),
      created_at: '2026-08-18T23:00:00.000Z',
      updated_at: '2026-08-18T23:00:00.000Z'
    };
  })
];
