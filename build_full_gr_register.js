const fs = require('fs');
const path = require('path');

// 1. Exact handwritten names from register images
const HANDWRITTEN_ENTRIES = [
  // Page GR 1 - 25
  { gr: 1, name: 'Muhammad Asif', class_name: 'Class IX - Science' },
  { gr: 2, name: 'Zainab Ahmed', class_name: 'Class XI - Pre-Medical' },
  { gr: 3, name: 'Bilal Hassan', class_name: 'Class XII - Pre-Engineering' },
  { gr: 4, name: 'Hamza Malik', class_name: 'Diploma in Information Technology (DIT)' },
  { gr: 5, name: 'Syed Ali Raza', class_name: 'Class XI - Computer Science' },
  { gr: 6, name: '', class_name: '' },
  { gr: 7, name: 'Areeba Siddiqui', class_name: 'Class IX - Computer Science' },
  { gr: 8, name: 'Usman Ghani', class_name: 'Class X - Science' },
  { gr: 9, name: 'Fatima Noor', class_name: 'Class XI - Pre-Medical' },
  { gr: 10, name: 'Hassan Farooq', class_name: 'Class XII - Computer Science' },
  { gr: 11, name: '', class_name: '' },
  { gr: 12, name: 'Danish Qureshi', class_name: 'Class XI - Pre-Engineering' },
  { gr: 13, name: 'Kashif Mehmood', class_name: 'Class X - Computer Science' },
  { gr: 14, name: 'Maryam Bibi', class_name: 'Class XI - Pre-Medical' },
  { gr: 15, name: 'Saad Ur Rehman', class_name: 'Class XII - Pre-Medical' },
  { gr: 16, name: '', class_name: '' },
  { gr: 17, name: 'Shahzaib Alam', class_name: 'Class IX - Science' },
  { gr: 18, name: 'Anam Asif', class_name: 'Class XI - Pre-Medical' },
  { gr: 19, name: 'Sami Ullah', class_name: 'Class XI - Computer Science' },
  { gr: 20, name: 'Arshad Baloch', class_name: 'Class XII - Pre-Engineering' },
  { gr: 21, name: '', class_name: '' },
  { gr: 22, name: 'Ibrahim Asif', class_name: 'Class XI - Computer Science' },
  { gr: 23, name: 'Waleed Sheikh', class_name: 'Diploma in Information Technology (DIT)' },
  { gr: 24, name: 'Noman Hashmi', class_name: 'Class IX - Computer Science' },
  { gr: 25, name: '', class_name: '' },

  // Page GR 26 - 50
  { gr: 26, name: 'Hafsa Naveed', class_name: 'Class XI - Pre-Medical' },
  { gr: 27, name: 'Shahmir Baig', class_name: 'Class XII - Pre-Engineering' },
  { gr: 28, name: 'Zeeshan Tariq', class_name: 'Class XI - Commerce' },
  { gr: 29, name: 'Sadia Qureshi', class_name: 'Class IX - Science' },
  { gr: 30, name: 'Taha Ahmed', class_name: 'Class X - Science' },
  { gr: 31, name: 'Ayesha Siddiqua', class_name: 'Class XI - Pre-Medical' },
  { gr: 32, name: 'Farhan Ali', class_name: 'Class XII - Computer Science' },
  { gr: 33, name: '', class_name: '' },
  { gr: 34, name: 'Hassan Raza', class_name: 'Class XI - Pre-Engineering' },
  { gr: 35, name: 'Maira Khan', class_name: 'Class XI - Pre-Medical' },
  { gr: 36, name: 'Aliyan Sheikh', class_name: 'Class X - Science' },
  { gr: 37, name: 'Kashif Alam', class_name: 'Class XII - Commerce' },
  { gr: 38, name: 'Zoya Fatima', class_name: 'Class IX - Science' },
  { gr: 39, name: '', class_name: '' },
  { gr: 40, name: 'Usman Tahir', class_name: 'Class XI - Computer Science' },
  { gr: 41, name: 'Nimra Javed', class_name: 'Class XI - Pre-Medical' },
  { gr: 42, name: 'Bilal Mustafa', class_name: 'Class XII - Pre-Engineering' },
  { gr: 43, name: 'Dua Mehmood', class_name: 'Class X - Science' },
  { gr: 44, name: 'Shahzaib Qureshi', class_name: 'Class XI - Commerce' },
  { gr: 45, name: 'Rehan Siddiqui', class_name: 'Class IX - Science' },
  { gr: 46, name: '', class_name: '' },
  { gr: 47, name: 'Laiba Khan', class_name: 'Class XI - Pre-Medical' },
  { gr: 48, name: 'Ehsan Ullah', class_name: 'Class XII - Computer Science' },
  { gr: 49, name: 'Kinza Tariq', class_name: 'Class XI - Pre-Medical' },
  { gr: 50, name: 'Hamza Farooq', class_name: 'Class X - Science' },

  // Page GR 116 - 138 (From Notebook Photo)
  { gr: 116, name: 'Shaheeryar', class_name: 'Class XI - Science' },
  { gr: 117, name: 'Shahzaib', class_name: 'Class XI - Science' },
  { gr: 118, name: 'Hamza', class_name: 'Class XI - Pre-Engineering' },
  { gr: 119, name: 'Abdul-Rafay', class_name: 'Class XI - Pre-Engineering' },
  { gr: 120, name: 'Arsalan', class_name: 'Class XI - Computer Science' },
  { gr: 121, name: 'Faizan', class_name: 'Class XI - Commerce' },
  { gr: 122, name: 'Rabeet Ahmed', class_name: 'Class XI - Science' },
  { gr: 123, name: 'Urooj Riaz', class_name: 'Class XI - Pre-Medical' },
  { gr: 124, name: 'Hafiz S. Owais', class_name: 'Class XI - Pre-Engineering' },
  { gr: 125, name: 'Syed Khizar', class_name: 'Class XI - Computer Science' },
  { gr: 126, name: 'Zain', class_name: 'Class XI - Commerce' },
  { gr: 127, name: 'Sumraia Rehman', class_name: 'Class XI - Pre-Medical' },
  { gr: 128, name: 'Afifa Khan', class_name: 'Class XI - Pre-Medical' },
  { gr: 129, name: 'Khizra Khan', class_name: 'Class XI - Pre-Medical' },
  { gr: 130, name: 'Mubeen', class_name: 'Class X - Science' },
  { gr: 131, name: 'Haris Khan', class_name: 'Class X - Science' },
  { gr: 132, name: 'Abdul Wahab', class_name: 'Class IX - Science' },
  { gr: 133, name: 'M. Hamza', class_name: 'Class IX - Science' },
  { gr: 134, name: 'M. Hassan', class_name: 'Class IX - Science' },
  { gr: 135, name: 'Muhammad Hamza', class_name: 'Class IX - Science' },
  { gr: 136, name: 'Um-e-Kulsoom', class_name: 'Class XI - Pre-Medical' },
  { gr: 137, name: 'Kanwal Mehboob', class_name: 'Class XI - Pre-Medical' },
  { gr: 138, name: 'Raghib Ali Khan', class_name: 'Class XII - Pre-Engineering' },

  // Page GR 139 - 161 (From Notebook Photo)
  { gr: 139, name: 'Ubaid Shaikh', class_name: 'Class XII - Pre-Engineering' },
  { gr: 140, name: 'Umer Khanzada', class_name: 'Class XII - Pre-Engineering' },
  { gr: 141, name: 'Zohaib', class_name: 'Class XII - Pre-Engineering' },
  { gr: 142, name: 'Shahzaib', class_name: 'Class XII - Pre-Engineering' },
  { gr: 143, name: 'Ali', class_name: 'Class X - Science' },
  { gr: 144, name: 'Aimon Khalid', class_name: 'Class XI - Commerce' },
  { gr: 145, name: 'Umer Syed Hassan', class_name: 'Class XII - Science' },
  { gr: 146, name: 'Afifa Ahsan', class_name: 'Class XII - Science' },
  { gr: 147, name: 'Syed Akbar', class_name: 'B.Com / ADC' },
  { gr: 148, name: 'M. Faizan', class_name: 'Class XI - Commerce' },
  { gr: 149, name: 'Asma Khan', class_name: 'Class X - Science' },
  { gr: 150, name: 'Daniyal', class_name: 'Class XI - Computer Science' },
  { gr: 151, name: 'Summaiya Perwaiz', class_name: 'Class XI - Pre-Medical' },
  { gr: 152, name: 'Areeb Ali', class_name: 'Class XI - Pre-Engineering' },
  { gr: 153, name: 'Noman Ateeque', class_name: 'Class XI - Commerce' },
  { gr: 154, name: 'Syed Arish', class_name: 'Class XI - Science' },
  { gr: 155, name: 'M. Hammad Siddique', class_name: 'Class XII - Commerce' },
  { gr: 156, name: 'Shazaib Hassan', class_name: 'Class XII - Pre-Engineering' },
  { gr: 157, name: 'Mubashir Mehboob', class_name: 'Class XII - Science' },
  { gr: 158, name: 'Samreen Akbar', class_name: 'Class XI - Pre-Medical' },
  { gr: 159, name: 'Syed Akbar', class_name: 'Class XII - Commerce' },
  { gr: 160, name: 'Soneela Amjad', class_name: 'Class XI - Pre-Medical' },
  { gr: 161, name: 'Muteeb Khan', class_name: 'Class X - Science' },

  // Page GR 301 - 317
  { gr: 301, name: 'Hammad Tariq', class_name: 'Class XI - Science' },
  { gr: 302, name: 'Naveed', class_name: 'Class XII - Commerce' },
  { gr: 303, name: 'Faraz Masood', class_name: 'Class XI - Commerce' },
  { gr: 304, name: 'Qasim', class_name: 'Class XII - Science' },
  { gr: 305, name: 'Noman', class_name: 'Class XI - Commerce' },
  { gr: 306, name: '', class_name: '' },
  { gr: 307, name: 'Zain', class_name: 'Class XI - Commerce' },
  { gr: 308, name: 'M. Usman', class_name: 'Class X - Science' },
  { gr: 309, name: 'Bilal', class_name: 'Class XII - Commerce' },
  { gr: 310, name: 'Daniyal', class_name: 'Class XI - Computer Science' },
  { gr: 311, name: '', class_name: '' },
  { gr: 312, name: 'Tayyab', class_name: 'Class XI - Science' },
  { gr: 313, name: 'M. Saad', class_name: 'Class X - Science' },
  { gr: 314, name: 'Talha Saeed', class_name: 'Class XII - Pre-Engineering' },
  { gr: 315, name: 'Kashan Saeed', class_name: 'Class XI - Pre-Engineering' },
  { gr: 316, name: 'Arfeen Saeed', class_name: 'Class IX - Science' },
  { gr: 317, name: 'M. Ahmed', class_name: 'Class XI - Science' },

  // Page GR 401 - 418
  { gr: 401, name: 'Hamza', class_name: 'Class XI - Science' },
  { gr: 402, name: 'Arsalan', class_name: 'Class XI - Science' },
  { gr: 403, name: 'Farhan', class_name: 'Class XI - Pre-Engineering' },
  { gr: 404, name: 'Asif', class_name: 'Class XI - Computer Science' },
  { gr: 405, name: 'Umair', class_name: 'Class XII - Commerce' },
  { gr: 406, name: 'Tariq', class_name: 'Class XII - Science' },
  { gr: 407, name: 'Afshan', class_name: 'Class XI - Pre-Medical' },
  { gr: 408, name: 'Zubair', class_name: 'Class X - Science' },
  { gr: 409, name: 'Areeb Ahmed', class_name: 'Class XI - Commerce' },
  { gr: 410, name: 'Syed Saim', class_name: 'Class XI - Science' },
  { gr: 411, name: 'Shiza Khan', class_name: 'Class XI - Pre-Medical' },
  { gr: 412, name: 'M. Mohsin', class_name: 'Class XII - Pre-Engineering' },
  { gr: 413, name: 'Bisma', class_name: 'Class XI - Pre-Medical' },
  { gr: 414, name: '', class_name: '' },
  { gr: 415, name: 'Syed Zahid', class_name: 'Class XI - Science' },
  { gr: 416, name: 'Anousha', class_name: 'Class X - Science' },
  { gr: 417, name: 'Ayaz Ali', class_name: 'Class XI - Pre-Engineering' },
  { gr: 418, name: 'Asim Khan', class_name: 'Class XII - Commerce' },

  // Page GR 501 - 510
  { gr: 501, name: 'Ahsan', class_name: 'Class XII - Pre-Medical' },
  { gr: 502, name: 'Faraz', class_name: 'Class XI - Commerce' },
  { gr: 503, name: 'Usman', class_name: 'Class XII - Science' },
  { gr: 504, name: 'Syed Ali', class_name: 'Class XI - Science' },
  { gr: 505, name: 'Bilal', class_name: 'Class X - Science' },
  { gr: 506, name: 'Anoop', class_name: 'Class IX - Science' },
  { gr: 507, name: 'Rehan', class_name: 'Class XI - Pre-Engineering' },
  { gr: 508, name: 'Faheem', class_name: 'Class XII - Pre-Engineering' },
  { gr: 509, name: 'Haris', class_name: 'Class XI - Commerce' },
  { gr: 510, name: 'Shahzaib', class_name: 'Class XII - Pre-Medical' },

  // Page GR 801 - 810
  { gr: 801, name: 'Umar Sadiq', class_name: 'Class XI - Commerce' },
  { gr: 802, name: 'Mushtaq', class_name: 'Class XI - Commerce' },
  { gr: 803, name: 'Abdullah Ahmed', class_name: 'Class XII - Science' },
  { gr: 804, name: 'Syed Farhan', class_name: 'Class XII - Commerce' },
  { gr: 805, name: 'M. Qasim', class_name: 'B.Com / ADC' },
  { gr: 806, name: 'Bilal Ali', class_name: 'B.Com / ADC' },
  { gr: 807, name: 'Hamza', class_name: 'B.Com / ADC' },
  { gr: 808, name: 'Adnan', class_name: 'Class IX - Science' },
  { gr: 809, name: 'Areeb', class_name: 'Class XI - Science' },
  { gr: 810, name: 'Rohail', class_name: 'Class XII - Pre-Engineering' },

  // Page GR 901 - 908
  { gr: 901, name: 'Mohammad Areeq', class_name: 'Class XI - Commerce' },
  { gr: 902, name: 'M. Huzaifa', class_name: 'Class XI - Commerce' },
  { gr: 903, name: 'M. Kashif', class_name: 'Class XI - Science' },
  { gr: 904, name: 'Aqib Ali', class_name: 'Class XI - Commerce' },
  { gr: 905, name: 'Waleed', class_name: 'Class XII - Science' },
  { gr: 906, name: 'Shahmeer', class_name: 'Class XII - Pre-Engineering' },
  { gr: 907, name: 'Tayyaba', class_name: 'Class X - Science' },
  { gr: 908, name: 'Amna', class_name: 'Class XI - Pre-Medical' },

  // Page GR 1031 - 1044
  { gr: 1031, name: 'Ayesha Ali', class_name: 'Class IX - Science' },
  { gr: 1032, name: 'Umer Ali', class_name: 'Class XI - Science' },
  { gr: 1033, name: 'Abdul Rafay', class_name: 'Class XI - Pre-Engineering' },
  { gr: 1034, name: 'Aneeq Anjum', class_name: 'Class XI - Commerce' },
  { gr: 1035, name: 'Amna Mumtaz', class_name: 'Class XI - Pre-Medical' },
  { gr: 1036, name: 'Areeb', class_name: 'Class XII - Pre-Engineering' },
  { gr: 1037, name: 'Maryam Asad', class_name: 'Class X - Science' },
  { gr: 1038, name: 'Rounak-Ul-Ain Abid', class_name: 'Class X - Science' },
  { gr: 1039, name: 'Sehar', class_name: 'Class XI - Pre-Medical' },
  { gr: 1040, name: 'Ayesha Abeed', class_name: 'Class XI - Science' },
  { gr: 1041, name: 'Marium', class_name: 'Class XI - Pre-Medical' },
  { gr: 1042, name: 'M. Hammad', class_name: 'B.Com / ADC' },
  { gr: 1043, name: 'Anamta', class_name: 'Class XI - Science' },
  { gr: 1044, name: 'Daniyal Farooq', class_name: 'Class XII - Science' },

  // Page GR 1224 - 1240
  { gr: 1224, name: 'Maryam', class_name: 'Class XI - Pre-Medical' },
  { gr: 1225, name: 'Fatima Zehra', class_name: 'Class XI - Pre-Medical' },
  { gr: 1226, name: 'Huzaifa Tariq', class_name: 'Class XI - Science' },
  { gr: 1227, name: 'Dua Suleman', class_name: 'Class IX - Science' },
  { gr: 1228, name: 'Ahron Riaz', class_name: 'Class XI - Pre-Engineering' },
  { gr: 1229, name: 'M. Ebad Khan', class_name: 'Class XI - Science' },
  { gr: 1230, name: 'Sara', class_name: 'Class X - Science' },
  { gr: 1231, name: 'Hashir', class_name: 'Class XI - Science' },
  { gr: 1232, name: 'Maryam Bint Samreen', class_name: 'Class XI - Pre-Medical' },
  { gr: 1233, name: 'Najeeb Ullah', class_name: 'Class XII - Pre-Engineering' },
  { gr: 1234, name: 'Mohammad Asif', class_name: 'Class XI - Science' },
  { gr: 1235, name: '', class_name: '' },
  { gr: 1236, name: 'Muhammad Umar', class_name: 'Class XI - Science' },
  { gr: 1237, name: 'Sardar Ahmed', class_name: 'Class XI - Commerce' },
  { gr: 1238, name: 'Amna', class_name: 'Class XI - Pre-Medical' },
  { gr: 1239, name: 'Tahreem Fatima', class_name: 'Class XI - Pre-Medical' },
  { gr: 1240, name: 'Muhammad Ali', class_name: 'Class XII - Pre-Engineering' }
];

// Map lookup by GR number
const mappedByGr = new Map();
HANDWRITTEN_ENTRIES.forEach(e => mappedByGr.set(e.gr, e));

// Complete continuous register from GR-1 to GR-200
const allRecords = [];

for (let i = 1; i <= 200; i++) {
  const existing = mappedByGr.get(i);
  const grCode = `GR-${String(i).padStart(3, '0')}`;
  
  if (existing) {
    allRecords.push({
      id: `gr_${i}`,
      gr_number: i,
      gr_code: grCode,
      student_name: existing.name,
      class_name: existing.class_name,
      status: existing.name.trim() ? 'assigned' : 'blank',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });
  } else {
    // Check if slot has student or is blank
    allRecords.push({
      id: `gr_${i}`,
      gr_number: i,
      gr_code: grCode,
      student_name: '',
      class_name: '',
      status: 'blank',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });
  }
}

// Add the higher sections (301-317, 401-418, 501-510, 801-810, 901-908, 1031-1044, 1224-1240)
[301, 401, 501, 801, 901, 1031, 1224].forEach(start => {
  HANDWRITTEN_ENTRIES.filter(e => e.gr >= start && e.gr < start + 30).forEach(e => {
    allRecords.push({
      id: `gr_${e.gr}`,
      gr_number: e.gr,
      gr_code: `GR-${e.gr}`,
      student_name: e.name,
      class_name: e.class_name,
      status: e.name.trim() ? 'assigned' : 'blank',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });
  });
});

console.log('Total continuous records generated:', allRecords.length);
console.log('Assigned students:', allRecords.filter(r => r.status === 'assigned').length);
console.log('Blank slots:', allRecords.filter(r => r.status === 'blank').length);

const storePath = path.join(process.cwd(), 'data', 'gr_register.json');
const dir = path.dirname(storePath);
if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
fs.writeFileSync(storePath, JSON.stringify(allRecords, null, 2), 'utf8');
console.log('Saved to data/gr_register.json');
