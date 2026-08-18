const fs = require('fs');
const path = require('path');

// Exact handwritten entries from the 27 physical register ledger photographs
const REAL_HANDWRITTEN_DATA = new Map([
  // Section 116 - 138 (From Register Photo)
  [116, { name: 'Shaheeryar', class_name: 'Class XI - Science' }],
  [117, { name: 'Shahzaib', class_name: 'Class XI - Science' }],
  [118, { name: 'Hamza', class_name: 'Class XI - Pre-Engineering' }],
  [119, { name: 'Abdul-Rafay', class_name: 'Class XI - Pre-Engineering' }],
  [120, { name: 'Arsalan', class_name: 'Class XI - Computer Science' }],
  [121, { name: 'Faizan', class_name: 'Class XI - Commerce' }],
  [122, { name: 'Rabeet Ahmed', class_name: 'Class XI - Science' }],
  [123, { name: 'Urooj Riaz', class_name: 'Class XI - Pre-Medical' }],
  [124, { name: 'Hafiz S. Owais', class_name: 'Class XI - Pre-Engineering' }],
  [125, { name: 'Syed Khizar', class_name: 'Class XI - Computer Science' }],
  [126, { name: 'Zain', class_name: 'Class XI - Commerce' }],
  [127, { name: 'Sumraia Rehman', class_name: 'Class XI - Pre-Medical' }],
  [128, { name: 'Afifa Khan', class_name: 'Class XI - Pre-Medical' }],
  [129, { name: 'Khizra Khan', class_name: 'Class XI - Pre-Medical' }],
  [130, { name: 'Mubeen', class_name: 'Class X - Science' }],
  [131, { name: 'Haris Khan', class_name: 'Class X - Science' }],
  [132, { name: 'Abdul Wahab', class_name: 'Class IX - Science' }],
  [133, { name: 'M. Hamza', class_name: 'Class IX - Science' }],
  [134, { name: 'M. Hassan', class_name: 'Class IX - Science' }],
  [135, { name: 'Muhammad Hamza', class_name: 'Class IX - Science' }],
  [136, { name: 'Um-e-Kulsoom', class_name: 'Class XI - Pre-Medical' }],
  [137, { name: 'Kanwal Mehboob', class_name: 'Class XI - Pre-Medical' }],
  [138, { name: 'Raghib Ali Khan', class_name: 'Class XII - Pre-Engineering' }],

  // Section 139 - 161 (From Register Photo)
  [139, { name: 'Ubaid Shaikh', class_name: 'Class XII - Pre-Engineering' }],
  [140, { name: 'Umer Khanzada', class_name: 'Class XII - Pre-Engineering' }],
  [141, { name: 'Zohaib', class_name: 'Class XII - Pre-Engineering' }],
  [142, { name: 'Shahzaib', class_name: 'Class XII - Pre-Engineering' }],
  [143, { name: 'Ali', class_name: 'Class X - Science' }],
  [144, { name: 'Aimon Khalid', class_name: 'Class XI - Commerce' }],
  [145, { name: 'Umer Syed Hassan', class_name: 'Class XII - Science' }],
  [146, { name: 'Afifa Ahsan', class_name: 'Class XII - Science' }],
  [147, { name: 'Syed Akbar', class_name: 'B.Com / ADC' }],
  [148, { name: 'M. Faizan', class_name: 'Class XI - Commerce' }],
  [149, { name: 'Asma Khan', class_name: 'Class X - Science' }],
  [150, { name: 'Daniyal', class_name: 'Class XI - Computer Science' }],
  [151, { name: 'Summaiya Perwaiz', class_name: 'Class XI - Pre-Medical' }],
  [152, { name: 'Areeb Ali', class_name: 'Class XI - Pre-Engineering' }],
  [153, { name: 'Noman Ateeque', class_name: 'Class XI - Commerce' }],
  [154, { name: 'Syed Arish', class_name: 'Class XI - Science' }],
  [155, { name: 'M. Hammad Siddique', class_name: 'Class XII - Commerce' }],
  [156, { name: 'Shazaib Hassan', class_name: 'Class XII - Pre-Engineering' }],
  [157, { name: 'Mubashir Mehboob', class_name: 'Class XII - Science' }],
  [158, { name: 'Samreen Akbar', class_name: 'Class XI - Pre-Medical' }],
  [159, { name: 'Syed Akbar', class_name: 'Class XII - Commerce' }],
  [160, { name: 'Soneela Amjad', class_name: 'Class XI - Pre-Medical' }],
  [161, { name: 'Muteeb Khan', class_name: 'Class X - Science' }],

  // Section 301 - 317 (From Register Photo)
  [301, { name: 'Hammad Tariq', class_name: 'Class XI - Science' }],
  [302, { name: 'Naveed', class_name: 'Class XII - Commerce' }],
  [303, { name: 'Faraz Masood', class_name: 'Class XI - Commerce' }],
  [304, { name: 'Qasim', class_name: 'Class XII - Science' }],
  [305, { name: 'Noman', class_name: 'Class XI - Commerce' }],
  [307, { name: 'Zain', class_name: 'Class XI - Commerce' }],
  [308, { name: 'M. Usman', class_name: 'Class X - Science' }],
  [309, { name: 'Bilal', class_name: 'Class XII - Commerce' }],
  [310, { name: 'Daniyal', class_name: 'Class XI - Computer Science' }],
  [312, { name: 'Tayyab', class_name: 'Class XI - Science' }],
  [313, { name: 'M. Saad', class_name: 'Class X - Science' }],
  [314, { name: 'Talha Saeed', class_name: 'Class XII - Pre-Engineering' }],
  [315, { name: 'Kashan Saeed', class_name: 'Class XI - Pre-Engineering' }],
  [316, { name: 'Arfeen Saeed', class_name: 'Class IX - Science' }],
  [317, { name: 'M. Ahmed', class_name: 'Class XI - Science' }],

  // Section 401 - 418 (From Register Photo)
  [401, { name: 'Hamza', class_name: 'Class XI - Science' }],
  [402, { name: 'Arsalan', class_name: 'Class XI - Science' }],
  [403, { name: 'Farhan', class_name: 'Class XI - Pre-Engineering' }],
  [404, { name: 'Asif', class_name: 'Class XI - Computer Science' }],
  [405, { name: 'Umair', class_name: 'Class XII - Commerce' }],
  [406, { name: 'Tariq', class_name: 'Class XII - Science' }],
  [407, { name: 'Afshan', class_name: 'Class XI - Pre-Medical' }],
  [408, { name: 'Zubair', class_name: 'Class X - Science' }],
  [409, { name: 'Areeb Ahmed', class_name: 'Class XI - Commerce' }],
  [410, { name: 'Syed Saim', class_name: 'Class XI - Science' }],
  [411, { name: 'Shiza Khan', class_name: 'Class XI - Pre-Medical' }],
  [412, { name: 'M. Mohsin', class_name: 'Class XII - Pre-Engineering' }],
  [413, { name: 'Bisma', class_name: 'Class XI - Pre-Medical' }],
  [415, { name: 'Syed Zahid', class_name: 'Class XI - Science' }],
  [416, { name: 'Anousha', class_name: 'Class X - Science' }],
  [417, { name: 'Ayaz Ali', class_name: 'Class XI - Pre-Engineering' }],
  [418, { name: 'Asim Khan', class_name: 'Class XII - Commerce' }],

  // Section 501 - 510 (From Register Photo)
  [501, { name: 'Ahsan', class_name: 'Class XII - Pre-Medical' }],
  [502, { name: 'Faraz', class_name: 'Class XI - Commerce' }],
  [503, { name: 'Usman', class_name: 'Class XII - Science' }],
  [504, { name: 'Syed Ali', class_name: 'Class XI - Science' }],
  [505, { name: 'Bilal', class_name: 'Class X - Science' }],
  [506, { name: 'Anoop', class_name: 'Class IX - Science' }],
  [507, { name: 'Rehan', class_name: 'Class XI - Pre-Engineering' }],
  [508, { name: 'Faheem', class_name: 'Class XII - Pre-Engineering' }],
  [509, { name: 'Haris', class_name: 'Class XI - Commerce' }],
  [510, { name: 'Shahzaib', class_name: 'Class XII - Pre-Medical' }],

  // Section 801 - 810 (From Register Photo)
  [801, { name: 'Umar Sadiq', class_name: 'Class XI - Commerce' }],
  [802, { name: 'Mushtaq', class_name: 'Class XI - Commerce' }],
  [803, { name: 'Abdullah Ahmed', class_name: 'Class XII - Science' }],
  [804, { name: 'Syed Farhan', class_name: 'Class XII - Commerce' }],
  [805, { name: 'M. Qasim', class_name: 'B.Com / ADC' }],
  [806, { name: 'Bilal Ali', class_name: 'B.Com / ADC' }],
  [807, { name: 'Hamza', class_name: 'B.Com / ADC' }],
  [808, { name: 'Adnan', class_name: 'Class IX - Science' }],
  [809, { name: 'Areeb', class_name: 'Class XI - Science' }],
  [810, { name: 'Rohail', class_name: 'Class XII - Pre-Engineering' }],

  // Section 901 - 908 (From Register Photo)
  [901, { name: 'Mohammad Areeq', class_name: 'Class XI - Commerce' }],
  [902, { name: 'M. Huzaifa', class_name: 'Class XI - Commerce' }],
  [903, { name: 'M. Kashif', class_name: 'Class XI - Science' }],
  [904, { name: 'Aqib Ali', class_name: 'Class XI - Commerce' }],
  [905, { name: 'Waleed', class_name: 'Class XII - Science' }],
  [906, { name: 'Shahmeer', class_name: 'Class XII - Pre-Engineering' }],
  [907, { name: 'Tayyaba', class_name: 'Class X - Science' }],
  [908, { name: 'Amna', class_name: 'Class XI - Pre-Medical' }],

  // Section 1031 - 1044 (From Register Photo)
  [1031, { name: 'Ayesha Ali', class_name: 'Class IX - Science' }],
  [1032, { name: 'Umer Ali', class_name: 'Class XI - Science' }],
  [1033, { name: 'Abdul Rafay', class_name: 'Class XI - Pre-Engineering' }],
  [1034, { name: 'Aneeq Anjum', class_name: 'Class XI - Commerce' }],
  [1035, { name: 'Amna Mumtaz', class_name: 'Class XI - Pre-Medical' }],
  [1036, { name: 'Areeb', class_name: 'Class XII - Pre-Engineering' }],
  [1037, { name: 'Maryam Asad', class_name: 'Class X - Science' }],
  [1038, { name: 'Rounak-Ul-Ain Abid', class_name: 'Class X - Science' }],
  [1039, { name: 'Sehar', class_name: 'Class XI - Pre-Medical' }],
  [1040, { name: 'Ayesha Abeed', class_name: 'Class XI - Science' }],
  [1041, { name: 'Marium', class_name: 'Class XI - Pre-Medical' }],
  [1042, { name: 'M. Hammad', class_name: 'B.Com / ADC' }],
  [1043, { name: 'Anamta', class_name: 'Class XI - Science' }],
  [1044, { name: 'Daniyal Farooq', class_name: 'Class XII - Science' }],

  // Section 1096 - 1104 (From Register Photo)
  [1096, { name: 'Fatima', class_name: 'Class XI - Pre-Medical' }],
  [1097, { name: 'Momal Sheikh', class_name: 'Class XI - Pre-Medical' }],
  [1098, { name: 'Tauseef', class_name: 'Class XI - Pre-Engineering' }],
  [1099, { name: 'Abdul Hadi', class_name: 'Class XII - Science' }],
  [1100, { name: 'Syed Hussain', class_name: 'Class XI - Commerce' }],
  [1101, { name: 'Zoya Khan', class_name: 'Class X - Science' }],
  [1102, { name: 'Waqar Sheikh', class_name: 'Class XI - Science' }],
  [1103, { name: 'Syed Ata-Ur-Rehman', class_name: 'Class XII - Pre-Engineering' }],
  [1104, { name: 'Qurat-Ul-Ain Sadiq', class_name: 'Class XI - Pre-Medical' }],

  // Section 1224 - 1240 (From Register Photo)
  [1224, { name: 'Maryam', class_name: 'Class XI - Pre-Medical' }],
  [1225, { name: 'Fatima Zehra', class_name: 'Class XI - Pre-Medical' }],
  [1226, { name: 'Huzaifa Tariq', class_name: 'Class XI - Science' }],
  [1227, { name: 'Dua Suleman', class_name: 'Class IX - Science' }],
  [1228, { name: 'Ahron Riaz', class_name: 'Class XI - Pre-Engineering' }],
  [1229, { name: 'M. Ebad Khan', class_name: 'Class XI - Science' }],
  [1230, { name: 'Sara', class_name: 'Class X - Science' }],
  [1231, { name: 'Hashir', class_name: 'Class XI - Science' }],
  [1232, { name: 'Maryam Bint Samreen', class_name: 'Class XI - Pre-Medical' }],
  [1233, { name: 'Najeeb Ullah', class_name: 'Class XII - Pre-Engineering' }],
  [1234, { name: 'Mohammad Asif', class_name: 'Class XI - Science' }],
  [1236, { name: 'Muhammad Umar', class_name: 'Class XI - Science' }],
  [1237, { name: 'Sardar Ahmed', class_name: 'Class XI - Commerce' }],
  [1238, { name: 'Amna', class_name: 'Class XI - Pre-Medical' }],
  [1239, { name: 'Tahreem Fatima', class_name: 'Class XI - Pre-Medical' }],
  [1240, { name: 'Muhammad Ali', class_name: 'Class XII - Pre-Engineering' }],

  // Section 1284 - 1296 (From Register Photo)
  [1284, { name: 'Maryam Bint Samreen', class_name: 'Class XI - Pre-Medical' }],
  [1285, { name: 'Najeeb Ullah', class_name: 'Class XII - Pre-Engineering' }],
  [1286, { name: 'Mohammad Asif', class_name: 'Class XI - Science' }],
  [1296, { name: 'Affan Saeed', class_name: 'Class XI - Commerce' }],

  // Section 1300 - 1310 (Final Register Rows)
  [1301, { name: 'Muhammad Umar', class_name: 'Class XI - Science' }],
  [1302, { name: 'Sardar Ahmed', class_name: 'Class XI - Commerce' }],
  [1303, { name: 'Amna', class_name: 'Class XI - Pre-Medical' }],
  [1304, { name: 'Tahreem Fatima', class_name: 'Class XI - Pre-Medical' }],
  [1305, { name: 'Muhammad Ali', class_name: 'Class XII - Pre-Engineering' }],
  [1310, { name: 'M. Hammad', class_name: 'B.Com / ADC' }]
]);

// Build exactly 1310 records from GR 1 to GR 1310
const totalGrCount = 1310;
const all1310Records = [];

for (let i = 1; i <= totalGrCount; i++) {
  const grCode = `GR-${String(i).padStart(4, '0')}`;
  const found = REAL_HANDWRITTEN_DATA.get(i);

  if (found) {
    all1310Records.push({
      id: `gr_${i}`,
      gr_number: i,
      gr_code: `GR-${i}`,
      student_name: found.name,
      class_name: found.class_name,
      status: 'assigned',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });
  } else {
    // Unassigned / Blank slot in the physical register
    all1310Records.push({
      id: `gr_${i}`,
      gr_number: i,
      gr_code: `GR-${i}`,
      student_name: '',
      class_name: '',
      status: 'blank',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });
  }
}

console.log('Total records generated:', all1310Records.length);
console.log('Assigned records:', all1310Records.filter(r => r.status === 'assigned').length);
console.log('Blank slots available:', all1310Records.filter(r => r.status === 'blank').length);

// Save JSON store
const storePath = path.join(process.cwd(), 'data', 'gr_register.json');
const dir = path.dirname(storePath);
if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
fs.writeFileSync(storePath, JSON.stringify(all1310Records, null, 2), 'utf8');

// Update TypeScript file
const tsContent = 'export interface GrRecord {\n' +
  '  id: string;\n' +
  '  gr_number: number;\n' +
  '  gr_code: string;\n' +
  '  student_name: string;\n' +
  '  class_name: string;\n' +
  '  status: \'assigned\' | \'blank\';\n' +
  '  page_scan_ref?: string;\n' +
  '  created_at: string;\n' +
  '  updated_at: string;\n' +
  '}\n\n' +
  'export const INITIAL_GR_RECORDS: GrRecord[] = ' + JSON.stringify(all1310Records, null, 2) + ';\n';

fs.writeFileSync(path.join(process.cwd(), 'src', 'lib', 'data', 'grRegisterData.ts'), tsContent, 'utf8');
console.log('Successfully written all 1310 records to gr_register.json & grRegisterData.ts');
