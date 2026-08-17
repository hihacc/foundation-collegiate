import { supabase } from '@/lib/supabase/client';
import { getStoredData, setStoredData } from '@/lib/utils/storage';
import { StudentInquiry, InquiryStats, InquiryStatus } from '@/types/inquiry';

const STORAGE_KEY = 'tfc_inquiries_data';

export const INITIAL_REGISTER_INQUIRIES: StudentInquiry[] = [
  { id: 'inq-645', sr_no: '645', date: '17/9/24', name: 'Areeba', class_name: 'Eng Lang', contact: '0345-3957551', institute: '', ref: 'New', status: 'PENDING', remarks: 'Inquired about English Language evening batch' },
  { id: 'inq-646', sr_no: '646', date: '17/9/24', name: 'Wasim', class_name: 'Computer + Eng Lang', contact: '0313-2128521', institute: '', ref: 'Near', status: 'PENDING', remarks: 'Needs Computer Basics and Spoken English' },
  { id: 'inq-647', sr_no: '647', date: '17/9/24', name: 'Wali Khan', class_name: 'Computer + Accounting', contact: '0345-3137562', institute: '', ref: 'Near', status: 'PENDING', remarks: '' },
  { id: 'inq-648', sr_no: '648', date: '18/9/24', name: 'Iqra Rabia', class_name: 'IX', contact: '0300-2528923', institute: '', ref: 'Near', status: 'PENDING', remarks: 'Class 9th Science regular coaching' },
  { id: 'inq-649', sr_no: '649', date: '18/9/24', name: 'Yusra', class_name: 'XI-Sc', contact: '0310-2911752', institute: '', ref: 'Near', status: 'PENDING', remarks: 'Pre-Medical XI Section' },
  { id: 'inq-650', sr_no: '650', date: '18/9/24', name: 'Abdul Basit', class_name: 'IX', contact: '0315-8337257', institute: '', ref: 'Near', status: 'PENDING', remarks: '' },
  { id: 'inq-651', sr_no: '651', date: '18/9/24', name: 'Fahad', class_name: 'Eng Lang', contact: '0342-8002007', institute: '', ref: 'Near', status: 'PENDING', remarks: '' },
  { id: 'inq-652', sr_no: '652', date: '18/9/24', name: 'M. Rehan', class_name: 'X-Science', contact: '0344-2387902', institute: '', ref: 'Near', status: 'PENDING', remarks: '' },
  { id: 'inq-653', sr_no: '653', date: '19/9/24', name: 'Hamza', class_name: 'X-Science', contact: '0324-2586521', institute: '', ref: 'Near', status: 'PENDING', remarks: '' },
  { id: 'inq-654', sr_no: '654', date: '19/9/24', name: 'Bazil Ali', class_name: 'Eng Lang', contact: '0321-2202852', institute: '', ref: 'Near', status: 'PENDING', remarks: '' },
  { id: 'inq-655', sr_no: '655', date: '19/9/24', name: 'Ali Ahmed', class_name: 'Eng Lang', contact: '0341-2958384', institute: '', ref: 'Near', status: 'PENDING', remarks: '' },
  { id: 'inq-656', sr_no: '656', date: '19/9/24', name: 'Saba Khan', class_name: 'Computer (Eng+Sci)', contact: '0300-2599367', institute: '', ref: 'Near', status: 'CONFIRMED', remarks: 'OK - Confirmed fee payment' },
  { id: 'inq-657', sr_no: '657', date: '19/9/24', name: 'Umair', class_name: 'XI-Eng', contact: '0346-2647489', institute: '', ref: 'Near', status: 'CONFIRMED', remarks: 'OK - Pre-Engineering admission confirmed' },
  { id: 'inq-658', sr_no: '658', date: '19/9/24', name: 'Rumaisa', class_name: 'B.Com I', contact: '0345-2409646', institute: '', ref: 'Near', status: 'PENDING', remarks: 'B.Com Part 1' },
  { id: 'inq-659', sr_no: '659', date: '19/9/24', name: 'Ubaid', class_name: 'XI-Com', contact: '0345-2178914', institute: '', ref: 'Near', status: 'CONFIRMED', remarks: 'OK - Commerce Batch confirmed' },
  { id: 'inq-660', sr_no: '660', date: '20/9/24', name: 'Taimoor Khan', class_name: 'XII-Sci', contact: '0341-2000468', institute: '', ref: 'Near', status: 'PENDING', remarks: 'XII Pre-Engineering' },
  { id: 'inq-661', sr_no: '661', date: '20/9/24', name: 'Tahir', class_name: 'X', contact: '0312-2384614', institute: '', ref: 'Near', status: 'PENDING', remarks: '' },
  { id: 'inq-662', sr_no: '662', date: '20/9/24', name: 'Faizan', class_name: 'XI-Sci', contact: '0320-0203423', institute: '', ref: 'Near', status: 'PENDING', remarks: '' },
  { id: 'inq-663', sr_no: '663', date: '20/9/24', name: 'Akbar Naeem', class_name: 'X Supply', contact: '0331-2193008', institute: '', ref: 'Near', status: 'PENDING', remarks: 'Supplementary Exam coaching' },
  { id: 'inq-664', sr_no: '664', date: '23/9/24', name: 'Bisma', class_name: 'B.Com + XII', contact: '0300-3674853', institute: '', ref: 'Near', status: 'PENDING', remarks: '' },
];

export class InquiryService {
  /**
   * Fetch all inquiries from Supabase with localStorage backup
   */
  static async getAllInquiries(): Promise<StudentInquiry[]> {
    try {
      const { data, error } = await supabase
        .from('inquiries')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data && data.length > 0) {
        setStoredData(STORAGE_KEY, data);
        return data;
      }
    } catch (e) {
      console.warn('Supabase inquiries fetch fallback:', e);
    }

    // Fallback to localStorage or sample data
    const local = getStoredData<StudentInquiry[]>(STORAGE_KEY, []);
    if (local && local.length > 0) {
      return local;
    }

    // Initialize with ledger samples if completely empty
    setStoredData(STORAGE_KEY, INITIAL_REGISTER_INQUIRIES);
    return INITIAL_REGISTER_INQUIRIES;
  }

  /**
   * Add a new inquiry record
   */
  static async addInquiry(inquiry: Omit<StudentInquiry, 'id' | 'created_at' | 'updated_at'>): Promise<StudentInquiry> {
    const newId = `inq-${Date.now()}`;
    const timestamp = new Date().toISOString();

    const record: StudentInquiry = {
      id: newId,
      ...inquiry,
      created_at: timestamp,
      updated_at: timestamp
    };

    // Save to Supabase
    try {
      await supabase.from('inquiries').insert([{
        sr_no: record.sr_no ? String(record.sr_no) : null,
        date: record.date,
        name: record.name,
        class_name: record.class_name,
        contact: record.contact,
        institute: record.institute || '',
        ref: record.ref || '',
        status: record.status,
        remarks: record.remarks || ''
      }]);
    } catch (e) {
      console.warn('Supabase insert warning:', e);
    }

    // Update Local Storage
    const current = getStoredData<StudentInquiry[]>(STORAGE_KEY, INITIAL_REGISTER_INQUIRIES);
    const updated = [record, ...current];
    setStoredData(STORAGE_KEY, updated);

    return record;
  }

  /**
   * Batch insert scanned inquiries
   */
  static async batchAddInquiries(inquiries: Array<Omit<StudentInquiry, 'id'>>): Promise<StudentInquiry[]> {
    const timestamp = new Date().toISOString();
    const createdRecords: StudentInquiry[] = inquiries.map((inq, idx) => ({
      id: `inq-${Date.now()}-${idx}`,
      ...inq,
      created_at: timestamp,
      updated_at: timestamp
    }));

    try {
      const dbPayload = createdRecords.map(r => ({
        sr_no: r.sr_no ? String(r.sr_no) : null,
        date: r.date,
        name: r.name,
        class_name: r.class_name,
        contact: r.contact,
        institute: r.institute || '',
        ref: r.ref || '',
        status: r.status,
        remarks: r.remarks || ''
      }));
      await supabase.from('inquiries').insert(dbPayload);
    } catch (e) {
      console.warn('Supabase batch insert warning:', e);
    }

    const current = getStoredData<StudentInquiry[]>(STORAGE_KEY, INITIAL_REGISTER_INQUIRIES);
    const updated = [...createdRecords, ...current];
    setStoredData(STORAGE_KEY, updated);

    return createdRecords;
  }

  /**
   * Update inquiry details or status
   */
  static async updateInquiry(id: string, updates: Partial<StudentInquiry>): Promise<void> {
    try {
      await supabase.from('inquiries').update({
        ...updates,
        updated_at: new Date().toISOString()
      }).eq('id', id);
    } catch (e) {
      console.warn('Supabase update warning:', e);
    }

    const current = getStoredData<StudentInquiry[]>(STORAGE_KEY, INITIAL_REGISTER_INQUIRIES);
    const updated = current.map(item => item.id === id ? { ...item, ...updates, updated_at: new Date().toISOString() } : item);
    setStoredData(STORAGE_KEY, updated);
  }

  /**
   * Delete an inquiry
   */
  static async deleteInquiry(id: string): Promise<void> {
    try {
      await supabase.from('inquiries').delete().eq('id', id);
    } catch (e) {
      console.warn('Supabase delete warning:', e);
    }

    const current = getStoredData<StudentInquiry[]>(STORAGE_KEY, INITIAL_REGISTER_INQUIRIES);
    const updated = current.filter(item => item.id !== id);
    setStoredData(STORAGE_KEY, updated);
  }

  /**
   * Compute live analytical statistics
   */
  static computeStats(inquiries: StudentInquiry[]): InquiryStats {
    const total = inquiries.length;
    const todayStr = new Date().toLocaleDateString('en-GB'); // DD/MM/YYYY
    
    let today = 0;
    let pending = 0;
    let followUp = 0;
    let confirmed = 0;

    inquiries.forEach(inq => {
      if (inq.status === 'PENDING') pending++;
      else if (inq.status === 'FOLLOW_UP') followUp++;
      else if (inq.status === 'CONFIRMED' || inq.status === 'ADMITTED') confirmed++;

      if (inq.date && (inq.date === todayStr || inq.date.startsWith(todayStr.slice(0, 5)))) {
        today++;
      }
    });

    const conversionRate = total > 0 ? Math.round((confirmed / total) * 100) : 0;

    return {
      total,
      today,
      pending,
      followUp,
      confirmed,
      conversionRate
    };
  }
}
