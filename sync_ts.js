const fs = require('fs');
const data = JSON.parse(fs.readFileSync('data/gr_register.json', 'utf8'));

const fileContent = 'export interface GrRecord {\n' +
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
  'export const INITIAL_GR_RECORDS: GrRecord[] = ' + JSON.stringify(data, null, 2) + ';\n';

fs.writeFileSync('src/lib/data/grRegisterData.ts', fileContent, 'utf8');
console.log('Successfully synced all ' + data.length + ' records into src/lib/data/grRegisterData.ts');
