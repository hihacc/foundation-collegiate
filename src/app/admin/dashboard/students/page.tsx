'use client';
export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { Users, Search, GraduationCap, Plus, Pencil, Trash2, Loader2, Upload, Filter, UserCheck, Download, Printer, Mail, X, FileSpreadsheet, RotateCcw } from 'lucide-react';
import { m, AnimatePresence } from 'framer-motion';
import Button from '@/components/ui/Button';
import { toast } from 'sonner';
import { Student } from '@/types';
import { getStoredData, setStoredData } from '@/lib/utils/storage';
import { OFFICIAL_CLASSES, matchStudentToClass } from '@/lib/utils/classes';
import Link from 'next/link';

const isUUID = (str: any) => typeof str === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);

const fallbackClassOptions = OFFICIAL_CLASSES.map(c => c.key);

const defaultStudents: Student[] = [
  { id: 's1', name: 'Asif Khan', father_name: 'Muhammad Khan', roll_number: 'FC-26-101', class_name: 'Class IX - Science / Biology', phone: '0333-1234567', email: 'asif@gmail.com', status: 'active', is_active: true, created_at: new Date().toISOString() },
  { id: 's2', name: 'Zainab Ahmed', father_name: 'Tariq Ahmed', roll_number: 'FC-26-102', class_name: 'Class XI - Pre-Medical', phone: '0321-9876543', email: 'zainab@gmail.com', status: 'active', is_active: true, created_at: new Date().toISOString() },
  { id: 's3', name: 'Bilal Hassan', father_name: 'Hassan Raza', roll_number: 'FC-26-103', class_name: 'Class XII - Pre-Engineering', phone: '0300-5554433', email: 'bilal@gmail.com', status: 'active', is_active: true, created_at: new Date().toISOString() },
  { id: 's4', name: 'Hamza Malik', father_name: 'Malik Usman', roll_number: 'FC-26-104', class_name: 'Diploma in Information Technology (DIT)', phone: '0345-2233445', email: 'hamza.malik@gmail.com', status: 'active', is_active: true, created_at: new Date().toISOString() },
  { id: 's5', name: 'Ayesha Siddiqui', father_name: 'Siddiqui Ahmed', roll_number: 'FC-26-105', class_name: 'Class XII - Computer Science', phone: '0312-7788990', email: 'ayesha.s@gmail.com', status: 'active', is_active: true, created_at: new Date().toISOString() },
  { id: 's6', name: 'Mustafa Ali', father_name: 'Ali Raza', roll_number: 'FC-26-106', class_name: 'Class X - Computer Science', phone: '0331-4455667', email: 'mustafa.ali@gmail.com', status: 'active', is_active: true, created_at: new Date().toISOString() }
];

export default function AdminStudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [dynamicClasses, setDynamicClasses] = useState<string[]>(fallbackClassOptions);
  const [mounted, setMounted] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedClass, setSelectedClass] = useState('All');
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Student | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [printStudent, setPrintStudent] = useState<Student | null>(null);

  // Bulk Student Import State
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkInputText, setBulkInputText] = useState('');
  const [parsedBulk, setParsedBulk] = useState<Partial<Student>[]>([]);
  const [bulkImporting, setBulkImporting] = useState(false);

  const handleDownloadSampleCSV = () => {
    const sampleHeaders = ['Roll Number', 'Student Name', 'Father Name', 'Class Name', 'Section', 'Phone', 'Email', 'Gender', 'Address'];
    const sampleRows = [
      ['FC-2026-201', 'Muhammad Ali', 'Tariq Ali', 'Class IX', 'A', '0333-1112233', 'ali@gmail.com', 'Male', 'Sector 11-B, North Karachi'],
      ['FC-2026-202', 'Fatima Raza', 'Raza Hussain', 'Class X', 'A', '0321-4445566', 'fatima@gmail.com', 'Female', 'North Karachi'],
      ['FC-2026-203', 'Hamza Sheikh', 'Kamran Sheikh', 'XI Pre-Medical', 'A', '0300-7778899', 'hamza@gmail.com', 'Male', 'Karachi']
    ];
    const csvContent = 'data:text/csv;charset=utf-8,' + [sampleHeaders.join(','), ...sampleRows.map(r => r.map(c => `"${c}"`).join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'TFC_Student_Bulk_Import_Sample.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Downloaded sample CSV import template!');
  };

  const parseBulkInputText = (text: string) => {
    setBulkInputText(text);
    if (!text.trim()) {
      setParsedBulk([]);
      return;
    }

    const lines = text.split(/\r?\n/).filter(line => line.trim().length > 0);
    if (lines.length === 0) {
      setParsedBulk([]);
      return;
    }

    const firstLine = lines[0];
    const delimiter = firstLine.includes('\t') ? '\t' : ',';

    const splitRow = (row: string) => {
      const result: string[] = [];
      let current = '';
      let inQuotes = false;
      for (let i = 0; i < row.length; i++) {
        const char = row[i];
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === delimiter && !inQuotes) {
          result.push(current.trim().replace(/^"|"$/g, ''));
          current = '';
        } else {
          current += char;
        }
      }
      result.push(current.trim().replace(/^"|"$/g, ''));
      return result;
    };

    const firstRowCols = splitRow(lines[0]);
    const isHeader = firstRowCols.some(c => 
      c.toLowerCase().includes('name') || 
      c.toLowerCase().includes('roll') || 
      c.toLowerCase().includes('father') ||
      c.toLowerCase().includes('class')
    );

    const dataRows = isHeader ? lines.slice(1) : lines;
    const items: Partial<Student>[] = [];

    dataRows.forEach((line, index) => {
      const cols = splitRow(line);
      if (cols.length === 0) return;

      const roll = cols[0] || `FC-2026-B${100 + index}`;
      const name = cols[1] || '';
      const father = cols[2] || 'Parent / Guardian';
      const className = cols[3] || fallbackClassOptions[0];
      const section = cols[4] || 'A';
      const phone = cols[5] || '';
      const email = cols[6] || '';
      const gender = cols[7] || '';
      const address = cols[8] || '';

      if (name.trim()) {
        items.push({
          roll_number: roll.trim(),
          name: name.trim(),
          father_name: father.trim(),
          class_name: className.trim(),
          section: section.trim(),
          phone: phone.trim(),
          email: email.trim(),
          gender: gender.trim(),
          address: address.trim(),
          status: 'active',
          is_active: true,
        });
      }
    });

    setParsedBulk(items);
  };

  const handleBulkFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        parseBulkInputText(content);
        toast.success(`Loaded file: ${file.name}`);
      }
    };
    reader.readAsText(file);
  };

  const handleExecuteBulkImport = async () => {
    if (parsedBulk.length === 0) {
      return toast.error('No valid student rows to import.');
    }

    setBulkImporting(true);

    try {
      const newRecords = parsedBulk.map((s, idx) => ({
        id: crypto.randomUUID(),
        name: s.name!,
        father_name: s.father_name || 'Parent / Guardian',
        roll_number: s.roll_number || `FC-2026-${Math.floor(100 + idx)}`,
        class_name: s.class_name || fallbackClassOptions[0],
        section: s.section || 'A',
        phone: s.phone || '',
        email: s.email || '',
        gender: s.gender || '',
        address: s.address || '',
        status: 'active',
        is_active: true,
        created_at: new Date().toISOString()
      }));

      // Insert batch into Supabase
      const { error } = await supabase.from('students').insert(newRecords);
      if (error) console.warn('Supabase bulk insert notice:', error.message);

      // Merge with current state and store locally
      const updatedList = [...newRecords as Student[], ...students];
      updateAndStore(updatedList);

      toast.success(`Successfully imported ${newRecords.length} students into the directory!`);
      setShowBulkModal(false);
      setBulkInputText('');
      setParsedBulk([]);
    } catch (err: any) {
      toast.error(`Bulk import error: ${err.message || 'Operation failed'}`);
    } finally {
      setBulkImporting(false);
    }
  };

  const [form, setForm] = useState({
    name: '', 
    father_name: '', 
    roll_number: '', 
    academic_class: 'Class XII - Computer Science',
    diploma_program: 'None',
    class_name: 'Class XII - Computer Science', 
    section: 'A',
    phone: '', 
    email: '',
    photo_url: '', 
    status: 'active',
    date_of_birth: '',
    gender: 'Male',
    religion: 'Islam',
    nationality: 'Pakistani',
    cnic: '',
    address: '',
    parent_phone: '',
    father_occupation: '',
    previous_school: '',
  });

  const fetchClassesAndStudents = async () => {
    try {
      setLoading(true);
      const dynamicList: string[] = [];

      try {
        const { data: grpData } = await supabase.from('academic_groups').select('name, academic_classes(name)');
        if (grpData && grpData.length > 0) {
          grpData.forEach((g: any) => {
            const clsName = g.academic_classes?.name || '';
            const grpName = g.name || '';
            if (clsName && grpName) dynamicList.push(`${clsName} - ${grpName}`);
            else if (grpName) dynamicList.push(grpName);
          });
        }
      } catch {}

      try {
        const { data: stcData } = await supabase.from('fee_structures').select('class_name');
        if (stcData && stcData.length > 0) {
          stcData.forEach((s: any) => dynamicList.push(String(s.class_name)));
        }
      } catch {}

      try {
        const { data: crsData } = await supabase.from('courses').select('name');
        if (crsData && crsData.length > 0) {
          crsData.forEach((c: any) => dynamicList.push(String(c.name)));
        }
      } catch {}

      const mergedClasses = Array.from(new Set([...fallbackClassOptions, ...dynamicList]));
      setDynamicClasses(mergedClasses);

      try {
        const { data, error } = await supabase.from('students').select('*').order('created_at', { ascending: false });
        if (!error && data && data.length > 0) {
          setStudents(data as Student[]);
          setStoredData('students', data);
        } else if (!error && data && data.length === 0) {
          const stored = getStoredData('students', defaultStudents);
          setStudents(stored);
        } else {
          const stored = getStoredData('students', defaultStudents);
          setStudents(stored);
        }
      } catch {
        const stored = getStoredData('students', defaultStudents);
        setStudents(stored);
      }
    } catch {
      const stored = getStoredData('students', defaultStudents);
      setStudents(stored);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setMounted(true);
    fetchClassesAndStudents();
  }, []);

  const updateAndStore = (newStudents: Student[]) => {
    setStudents(newStudents);
    setStoredData('students', newStudents);
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setForm(prev => ({ ...prev, photo_url: event.target!.result as string }));
        toast.success('Student photo preview loaded!');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleOpenForm = (s: Student | null = null) => {
    if (s) {
      setEditing(s);
      const fullStr = s.class_name || '';
      let ac = 'None';
      let dp = 'None';

      if (fullStr.includes(' | ')) {
        const parts = fullStr.split(' | ');
        ac = parts[0] || 'None';
        dp = parts[1] || 'None';
      } else if (fullStr.includes('Diploma')) {
        dp = fullStr;
        ac = 'None';
      } else {
        ac = fullStr || 'Class XII - Computer Science';
        dp = 'None';
      }

      setForm({
        name: s.name || '',
        father_name: s.father_name || '',
        roll_number: s.roll_number || '',
        academic_class: ac,
        diploma_program: dp,
        class_name: s.class_name || dynamicClasses[0],
        section: s.section || 'A',
        phone: s.phone || '',
        email: s.email || '',
        photo_url: s.photo_url || '',
        status: s.status || 'active',
        date_of_birth: s.date_of_birth || '',
        gender: s.gender || 'Male',
        religion: s.religion || 'Islam',
        nationality: s.nationality || 'Pakistani',
        cnic: s.cnic || s.cnic_number || '',
        address: s.address || '',
        parent_phone: s.parent_phone || '',
        father_occupation: s.father_occupation || '',
        previous_school: s.previous_school || '',
      });
    } else {
      setEditing(null);
      const nextNum = 100 + (students.length || 0) + 1;
      const autoRoll = `FC-26-${nextNum}`;
      setForm({
        name: '',
        father_name: '',
        roll_number: autoRoll,
        academic_class: 'Class XII - Computer Science',
        diploma_program: 'None',
        class_name: 'Class XII - Computer Science',
        section: 'A',
        phone: '',
        email: '',
        photo_url: '',
        status: 'active',
        date_of_birth: '',
        gender: 'Male',
        religion: 'Islam',
        nationality: 'Pakistani',
        cnic: '',
        address: '',
        parent_phone: '',
        father_occupation: '',
        previous_school: '',
      });
    }
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    const targetRoll = form.roll_number.trim().toUpperCase();
    const duplicate = students.find(s => s.id !== editing?.id && (s.roll_number || '').trim().toUpperCase() === targetRoll);
    if (duplicate) {
      setSubmitting(false);
      return toast.error(`Roll Number "${targetRoll}" is already assigned to ${duplicate.name}! Roll numbers must be unique.`);
    }

    const payload = {
      name: form.name.trim(),
      father_name: form.father_name.trim(),
      roll_number: form.roll_number.trim().toUpperCase(),
      class_name: form.class_name.trim(),
      section: form.section.trim() || 'A',
      phone: form.phone.trim() || null,
      email: form.email.trim() || null,
      photo_url: form.photo_url.trim() || null,
      status: form.status || 'active',
      date_of_birth: form.date_of_birth || null,
      gender: form.gender || 'Male',
      religion: form.religion || 'Islam',
      nationality: form.nationality || 'Pakistani',
      cnic: form.cnic.trim() || null,
      address: form.address.trim() || null,
      parent_phone: form.parent_phone.trim() || null,
      father_occupation: form.father_occupation.trim() || null,
      previous_school: form.previous_school.trim() || null,
      is_active: true,
    };

    const corePayload = {
      name: payload.name,
      father_name: payload.father_name,
      roll_number: payload.roll_number,
      class_name: payload.class_name,
      section: payload.section,
      phone: payload.phone,
      email: payload.email,
      photo_url: payload.photo_url,
      gender: payload.gender,
      date_of_birth: payload.date_of_birth,
      address: payload.address,
      status: payload.status,
      is_active: payload.is_active,
    };

    try {
      if (editing && editing.id) {
        if (isUUID(editing.id)) {
          let { error } = await supabase.from('students').update(payload).eq('id', editing.id);
          if (error) {
            await supabase.from('students').update(corePayload).eq('id', editing.id);
          }
        }
        const updated = students.map(s => s.id === editing.id ? { ...s, ...payload } : s);
        updateAndStore(updated);
        toast.success('Student profile updated successfully!');
      } else {
        const newId = crypto.randomUUID();
        let { error } = await supabase.from('students').insert([{ id: newId, ...payload }]);
        if (error) {
          console.warn('Full payload insert failed, retriving core columns insert:', error.message);
          const retry = await supabase.from('students').insert([{ id: newId, ...corePayload }]);
          if (retry.error) {
            console.error('Supabase DB Insert Error:', retry.error.message);
          }
        }
        const newStd: Student = { id: newId, ...payload, created_at: new Date().toISOString() };
        const updated = [newStd, ...students];
        updateAndStore(updated);
        
        if (payload.email) {
          fetch('/api/send-email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              type: 'welcome',
              payload: {
                student_name: payload.name,
                roll_number: payload.roll_number,
                class_name: payload.class_name,
                parent_email: payload.email,
              }
            })
          }).catch(() => {});
        }
        toast.success('New student registered & synced to Supabase!');
      }
      setShowForm(false);
      setEditing(null);
    } catch (err: any) {
      toast.error(`Error saving student: ${err.message || 'Operation failed'}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this student record?')) return;
    try {
      const targetStudent = students.find(s => s.id === id);
      const targetRoll = targetStudent?.roll_number;

      if (isUUID(id)) {
        const { error } = await supabase.from('students').delete().eq('id', id);
        if (error) console.warn('Supabase DB Delete Notice:', error.message);
      } else if (targetRoll) {
        const { error } = await supabase.from('students').delete().eq('roll_number', targetRoll);
        if (error) console.warn('Supabase DB Delete Notice:', error.message);
      }

      if (targetRoll) {
        try { await supabase.from('results').delete().eq('roll_number', targetRoll); } catch {}
        try { await supabase.from('pins').delete().eq('roll_number', targetRoll); } catch {}
      }

      const updated = students.filter(s => s.id !== id && (targetRoll ? s.roll_number !== targetRoll : true));
      updateAndStore(updated);
      toast.success('Student record deleted successfully!');
    } catch (err: any) {
      const updated = students.filter(s => s.id !== id);
      updateAndStore(updated);
      toast.success('Student record deleted successfully!');
    }
  };

  const handleExportCSV = () => {
    if (filtered.length === 0) return toast.info('No student data to export.');
    const headers = ['Roll Number', 'Student Name', 'Father Name', 'Class Name', 'Email', 'Phone', 'Status'];
    const rows = filtered.map(s => [
      `"${s.roll_number || ''}"`,
      `"${s.name || ''}"`,
      `"${s.father_name || ''}"`,
      `"${s.class_name || ''}"`,
      `"${s.email || ''}"`,
      `"${s.phone || ''}"`,
      `"${s.status || 'Active'}"`
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Student_Directory_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Exported Student Directory CSV file!');
  };

  const filtered = students.filter(s => {
    const matchesSearch =
      !search ||
      (s.name || '').toLowerCase().includes(search.toLowerCase()) ||
      (s.roll_number || '').toLowerCase().includes(search.toLowerCase()) ||
      (s.father_name || '').toLowerCase().includes(search.toLowerCase()) ||
      (s.email || '').toLowerCase().includes(search.toLowerCase()) ||
      (s.phone || '').toLowerCase().includes(search.toLowerCase());

    const matchesClass = matchStudentToClass(s.class_name, selectedClass);

    return matchesSearch && matchesClass;
  });

  const activeCount = students.filter(s => !s.status || String(s.status).toLowerCase() === 'active').length;
  const emailCount = students.filter(s => s.email).length;

  if (!mounted) return null;

  return (
    <div className="space-y-6 max-w-7xl mx-auto hide-on-print">
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          body * { visibility: hidden; }
          .print-id-card-portal, .print-id-card-portal * { visibility: visible; }
          .print-id-card-portal { position: absolute; left: 0; top: 0; width: 100%; display: block !important; }
          .hide-on-print { display: none !important; }
        }
      `}} />

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-semibold text-slate-500">Active Directory</span>
            <span className="text-slate-400">/</span>
            <Link href="/admin/dashboard/students/old" className="text-sm font-semibold text-blue-600 hover:underline">View Archive (Old Students)</Link>
          </div>
          <h1 className="text-2xl sm:text-3xl font-display font-bold text-slate-800">Student Directory</h1>
          <p className="text-slate-500 text-sm mt-1">Manage currently enrolled active students</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => {
              toast.loading('Fetching live students from database...', { id: 'sync-db' });
              fetchClassesAndStudents().then(() => toast.success('Synced live data from database!', { id: 'sync-db' }));
            }}
            title="Sync Live from Database"
            className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 px-3.5 py-2.5 rounded-xl font-bold text-xs border border-slate-200 transition-all cursor-pointer"
          >
            <RotateCcw size={15} className={loading ? 'animate-spin text-blue-600' : 'text-slate-600'} /> Live Sync
          </button>
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl font-bold text-xs shadow-md shadow-emerald-500/20 transition-all active:scale-95 cursor-pointer"
          >
            <FileSpreadsheet size={16} /> Export CSV
          </button>
          <button
            onClick={() => setShowBulkModal(true)}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl font-bold text-xs shadow-md shadow-indigo-500/20 transition-all active:scale-95"
          >
            <Upload size={16} /> Bulk Import Students
          </button>
          <button
            onClick={() => handleOpenForm()}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-bold text-xs shadow-md shadow-blue-500/20 transition-all active:scale-95"
          >
            <Plus size={16} /> Register New Student
          </button>
        </div>
      </div>

      {/* Quick Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs text-slate-500 uppercase tracking-wider font-bold block">Total Enrolled</span>
          <span className="text-2xl font-bold text-slate-800">{students.length}</span>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs text-emerald-600 uppercase tracking-wider font-bold block">Active Students</span>
          <span className="text-2xl font-bold text-emerald-700">{activeCount}</span>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs text-blue-600 uppercase tracking-wider font-bold block">Email Verified</span>
          <span className="text-2xl font-bold text-blue-700">{emailCount}</span>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs text-amber-600 uppercase tracking-wider font-bold block">Active Classes</span>
          <span className="text-2xl font-bold text-amber-700">{dynamicClasses.length}</span>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="sm:col-span-2 relative">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by student name, roll number, father name, or email..."
            className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 text-slate-800 placeholder:text-slate-400 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm shadow-xs"
          />
        </div>

        <div className="relative">
          <Filter size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <select
            value={selectedClass}
            onChange={e => setSelectedClass(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 text-slate-800 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm shadow-xs cursor-pointer font-medium"
          >
            <option value="All">All Classes ({students.length} Total)</option>
            {OFFICIAL_CLASSES.map(cls => {
              const count = students.filter(s => matchStudentToClass(s.class_name, cls.key)).length;
              return (
                <option key={cls.key} value={cls.key}>
                  {cls.name} {count > 0 ? `(${count} Enrolled)` : ''}
                </option>
              );
            })}
          </select>
        </div>
      </div>

      {/* Form Drawer / Modal */}
      <AnimatePresence>
        {showForm && (
          <m.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-white border border-blue-100 rounded-3xl p-6 shadow-md overflow-hidden"
          >
            <div className="flex justify-between items-center pb-4 border-b border-slate-100 mb-5">
              <div>
                <h3 className="font-bold text-lg text-slate-800">
                  {editing ? `Edit Student: ${editing.name}` : 'Register New Student Profile'}
                </h3>
                <p className="text-xs text-slate-500">Provide full student contact details including email for instant portal notifications.</p>
              </div>
              <button
                onClick={() => { setShowForm(false); setEditing(null); }}
                className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-full transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6 text-sm">
              {/* Section 1: Academic & Student Identity */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-600 border-b border-slate-100 pb-1">
                  <span>1. Student Identity & Personal Information</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">Student Full Name <span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      required
                      value={form.name}
                      onChange={e => setForm(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="e.g. Muhammad Ali"
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 text-slate-800 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-semibold text-xs"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">Roll Number <span className="text-red-500">*</span></label>
                      <button
                        type="button"
                        onClick={() => {
                          const nextNum = 100 + (students.length || 0) + 1;
                          setForm(prev => ({ ...prev, roll_number: `FC-26-${nextNum}` }));
                          toast.success(`Generated Roll No: FC-26-${nextNum}`);
                        }}
                        className="text-[11px] font-bold text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
                      >
                        ⚡ Auto-Generate Next
                      </button>
                    </div>
                    <input
                      type="text"
                      required
                      value={form.roll_number}
                      onChange={e => setForm(prev => ({ ...prev, roll_number: e.target.value }))}
                      placeholder="e.g. FC-26-101"
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 text-blue-900 font-mono font-bold rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none uppercase text-xs"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">Primary Academic Class <span className="text-red-500">*</span></label>
                    <select
                      value={form.academic_class}
                      onChange={e => {
                        const newAc = e.target.value;
                        let newFullStr = '';
                        if (newAc !== 'None' && form.diploma_program !== 'None') {
                          newFullStr = `${newAc} | ${form.diploma_program}`;
                        } else if (newAc !== 'None') {
                          newFullStr = newAc;
                        } else {
                          newFullStr = form.diploma_program;
                        }
                        setForm(prev => ({ ...prev, academic_class: newAc, class_name: newFullStr }));
                      }}
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 text-slate-800 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-semibold cursor-pointer text-xs"
                    >
                      <option value="None">None (Diploma Student Only)</option>
                      <option value="Class IX - Science / Biology">Class IX - Science / Biology</option>
                      <option value="Class IX - Computer Science">Class IX - Computer Science</option>
                      <option value="Class X - Science / Biology">Class X - Science / Biology</option>
                      <option value="Class X - Computer Science">Class X - Computer Science</option>
                      <option value="Class XI - Pre-Medical">Class XI - Pre-Medical</option>
                      <option value="Class XI - Pre-Engineering">Class XI - Pre-Engineering</option>
                      <option value="Class XI - Computer Science">Class XI - Computer Science</option>
                      <option value="Class XI - Commerce">Class XI - Commerce</option>
                      <option value="Class XI - Arts">Class XI - Arts</option>
                      <option value="Class XII - Pre-Medical">Class XII - Pre-Medical</option>
                      <option value="Class XII - Pre-Engineering">Class XII - Pre-Engineering</option>
                      <option value="Class XII - Computer Science">Class XII - Computer Science</option>
                      <option value="Class XII - Commerce">Class XII - Commerce</option>
                      <option value="Class XII - Arts">Class XII - Arts</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">Professional Diploma (Dual Enrollment)</label>
                    <select
                      value={form.diploma_program}
                      onChange={e => {
                        const newDp = e.target.value;
                        let newFullStr = '';
                        if (form.academic_class !== 'None' && newDp !== 'None') {
                          newFullStr = `${form.academic_class} | ${newDp}`;
                        } else if (newDp !== 'None') {
                          newFullStr = newDp;
                        } else {
                          newFullStr = form.academic_class;
                        }
                        setForm(prev => ({ ...prev, diploma_program: newDp, class_name: newFullStr }));
                      }}
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 text-slate-800 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-semibold cursor-pointer text-xs"
                    >
                      <option value="None">None (Academic Student Only)</option>
                      <option value="Diploma in Accounting & Finance">💼 Diploma in Accounting &amp; Finance</option>
                      <option value="Diploma in Information Technology (DIT)">💻 Diploma in Information Technology (DIT)</option>
                      <option value="Diploma in Computerized Accounting & Taxation">📊 Diploma in Computerized Accounting &amp; Taxation</option>
                      <option value="Diploma in Graphic Design & Web Development">🎨 Diploma in Graphic Design &amp; Web Development</option>
                      <option value="Diploma in Business Administration (DBA)">🏢 Diploma in Business Administration (DBA)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">Section</label>
                    <input
                      type="text"
                      value={form.section}
                      onChange={e => setForm(prev => ({ ...prev, section: e.target.value }))}
                      placeholder="e.g. A"
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 text-slate-800 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-xs"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">Date of Birth</label>
                    <input
                      type="date"
                      value={form.date_of_birth}
                      onChange={e => setForm(prev => ({ ...prev, date_of_birth: e.target.value }))}
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 text-slate-800 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-xs"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">Gender</label>
                    <select
                      value={form.gender}
                      onChange={e => setForm(prev => ({ ...prev, gender: e.target.value }))}
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 text-slate-800 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-xs"
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">Religion</label>
                    <input
                      type="text"
                      value={form.religion}
                      onChange={e => setForm(prev => ({ ...prev, religion: e.target.value }))}
                      placeholder="e.g. Islam"
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 text-slate-800 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-xs"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">Nationality</label>
                    <input
                      type="text"
                      value={form.nationality}
                      onChange={e => setForm(prev => ({ ...prev, nationality: e.target.value }))}
                      placeholder="e.g. Pakistani"
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 text-slate-800 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-xs"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">CNIC / B-Form Number</label>
                    <input
                      type="text"
                      value={form.cnic}
                      onChange={e => setForm(prev => ({ ...prev, cnic: e.target.value }))}
                      placeholder="e.g. 42101-1234567-1"
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 text-slate-800 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-mono text-xs"
                    />
                  </div>

                  <div className="sm:col-span-2 lg:col-span-3">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">Previous School / College Name</label>
                    <input
                      type="text"
                      value={form.previous_school}
                      onChange={e => setForm(prev => ({ ...prev, previous_school: e.target.value }))}
                      placeholder="Name of previous school or academy"
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 text-slate-800 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* Section 2: Parent & Guardian Info */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-600 border-b border-slate-100 pb-1">
                  <span>2. Parent / Guardian Contact Details</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">Father / Guardian Name <span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      required
                      value={form.father_name}
                      onChange={e => setForm(prev => ({ ...prev, father_name: e.target.value }))}
                      placeholder="e.g. Tariq Ali"
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 text-slate-800 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-semibold text-xs"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">Father Occupation</label>
                    <input
                      type="text"
                      value={form.father_occupation}
                      onChange={e => setForm(prev => ({ ...prev, father_occupation: e.target.value }))}
                      placeholder="e.g. Businessman / Engineer"
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 text-slate-800 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-xs"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">Parent Cell Number <span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      required
                      value={form.parent_phone}
                      onChange={e => setForm(prev => ({ ...prev, parent_phone: e.target.value }))}
                      placeholder="e.g. 0333-1112233"
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 text-slate-800 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-mono text-xs"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">Student Cell Phone</label>
                    <input
                      type="text"
                      value={form.phone}
                      onChange={e => setForm(prev => ({ ...prev, phone: e.target.value }))}
                      placeholder="e.g. 0321-4445566"
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 text-slate-800 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-mono text-xs"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">Email Address</label>
                    <div className="relative">
                      <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="email"
                        value={form.email}
                        onChange={e => setForm(prev => ({ ...prev, email: e.target.value }))}
                        placeholder="student@gmail.com"
                        className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 text-slate-800 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-xs"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">Enrolled Status</label>
                    <select
                      value={form.status}
                      onChange={e => setForm(prev => ({ ...prev, status: e.target.value }))}
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 text-slate-800 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer text-xs"
                    >
                      <option value="active">Active Student</option>
                      <option value="graduated">Graduated / Alumni</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>

                  <div className="sm:col-span-2 lg:col-span-3">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">Complete Residential Address</label>
                    <textarea
                      rows={2}
                      value={form.address}
                      onChange={e => setForm(prev => ({ ...prev, address: e.target.value }))}
                      placeholder="Sector, Street, House number, City..."
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 text-slate-800 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* Section 3: Photo Upload */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-indigo-600 border-b border-slate-100 pb-1">
                  <span>3. Student Photograph</span>
                </div>
                <div className="flex flex-col sm:flex-row items-center gap-3">
                  <label className="cursor-pointer px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl border border-slate-200 flex items-center gap-2 shrink-0">
                    <Upload size={15} /> Select Photo File
                    <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
                  </label>
                  <input
                    type="url"
                    placeholder="OR paste photo URL (https://...)"
                    value={form.photo_url}
                    onChange={e => setForm(prev => ({ ...prev, photo_url: e.target.value }))}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 text-slate-800 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-xs"
                  />
                  {form.photo_url && (
                    <div className="w-9 h-9 rounded-full overflow-hidden shrink-0 border-2 border-blue-500 shadow-xs">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={form.photo_url} alt="Preview" className="w-full h-full object-cover" />
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t border-slate-100">
                <Button type="submit" disabled={submitting} className="bg-blue-600 hover:bg-blue-700 min-w-[140px]">
                  {submitting ? <Loader2 size={16} className="animate-spin" /> : (editing ? 'Save Student Changes' : 'Register Student')}
                </Button>
                <Button type="button" variant="outline" className="border-slate-200 text-slate-600 hover:bg-slate-50" onClick={() => { setShowForm(false); setEditing(null); }}>
                  Cancel
                </Button>
              </div>
            </form>
          </m.div>
        )}
      </AnimatePresence>

      {/* Table Card */}
      <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-xs">
        {loading ? (
          <div className="p-6 space-y-3">
            {[...Array(5)].map((_, i) => <div key={i} className="h-16 rounded-xl bg-slate-100 animate-pulse" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 flex flex-col items-center">
            <div className="w-16 h-16 rounded-2xl bg-slate-50 flex items-center justify-center mb-4">
              <Users size={28} className="text-slate-300" />
            </div>
            <p className="text-lg font-medium text-slate-600">No students found matching your criteria</p>
            <p className="text-sm text-slate-400 mt-1 mb-4">Click &quot;Register New Student&quot; above to add a profile or reset search filters.</p>
            <button
              onClick={() => {
                setSearch('');
                setSelectedClass('All');
                const resetData = defaultStudents;
                setStudents(resetData);
                setStoredData('students', resetData);
                toast.success('Filters reset & student directory restored!');
              }}
              className="px-4 py-2 bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white font-bold text-xs rounded-xl transition-all shadow-xs"
            >
              Reset Filters &amp; Restore Directory
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="admin-table w-full text-sm">
              <thead>
                <tr className="bg-slate-50 text-slate-600 border-b border-slate-200">
                  <th className="py-3.5 px-4 font-bold text-left">Student Profile</th>
                  <th className="py-3.5 px-4 font-bold text-left">Roll No.</th>
                  <th className="py-3.5 px-4 font-bold text-left">Assigned Class</th>
                  <th className="py-3.5 px-4 font-bold text-left">Email & Phone</th>
                  <th className="py-3.5 px-4 font-bold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((s) => (
                  <tr key={s.id} className="group hover:bg-slate-50/80 transition-colors">
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        {s.photo_url ? (
                          <div className="w-10 h-10 rounded-full overflow-hidden border border-slate-200 shrink-0 shadow-xs">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={s.photo_url}
                              alt={s.name}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                (e.target as HTMLElement).style.display = 'none';
                              }}
                            />
                          </div>
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-600 to-blue-800 flex items-center justify-center text-white font-bold shrink-0 shadow-xs">
                            {s.name ? s.name.charAt(0) : 'S'}
                          </div>
                        )}
                        <div>
                          <div className="font-bold text-slate-800 group-hover:text-blue-600 transition-colors">{s.name}</div>
                          <div className="text-xs text-slate-500">Father: {s.father_name || 'N/A'}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <span className="px-2.5 py-1 rounded-md bg-slate-100 text-blue-900 font-mono text-xs border border-slate-200 font-bold">
                        {s.roll_number}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex flex-col gap-1 items-start">
                        <div className="flex items-center gap-1.5 text-slate-800 font-bold text-xs bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200">
                          <GraduationCap size={14} className="text-blue-600 shrink-0" />
                          {s.class_name}
                        </div>
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          s.status === 'active' || !s.status ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' : 
                          s.status === 'graduated' ? 'bg-blue-50 text-blue-600 border border-blue-200' : 
                          'bg-slate-100 text-slate-500 border border-slate-200'
                        }`}>
                          {s.status || 'Active'}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex flex-col text-xs space-y-0.5">
                        <div className="font-medium text-slate-800 flex items-center gap-1">
                          <Mail size={12} className="text-slate-400 shrink-0" /> {s.email || 'No email set'}
                        </div>
                        <div className="text-slate-500 font-mono">
                          {s.phone || 'No phone set'}
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex justify-end gap-2">
                        <button onClick={() => setPrintStudent(s)} title="Print Student ID Card" className="w-8 h-8 bg-slate-100 hover:bg-slate-800 text-slate-600 hover:text-white rounded-lg flex items-center justify-center transition-colors">
                          <Printer size={14} />
                        </button>
                        <button onClick={() => handleOpenForm(s)} title="Edit Student" className="w-8 h-8 bg-blue-50 hover:bg-blue-600 text-blue-600 hover:text-white rounded-lg flex items-center justify-center transition-colors">
                          <Pencil size={14} />
                        </button>
                        <button onClick={() => handleDelete(s.id)} title="Delete Student" className="w-8 h-8 bg-red-50 hover:bg-red-600 text-red-500 hover:text-white rounded-lg flex items-center justify-center transition-colors">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Student ID Card Print Modal */}
      {printStudent && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 text-center space-y-6">
            <div className="flex justify-between items-center hide-on-print border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-800 text-sm">Official Student ID Card</h3>
              <div className="flex gap-2">
                <button onClick={() => window.print()} className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl flex items-center gap-1">
                  <Printer size={14} /> Print
                </button>
                <button onClick={() => setPrintStudent(null)} className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl">
                  Close
                </button>
              </div>
            </div>

            {/* Printable ID Card Container */}
            <div className="print-id-card-portal border-2 border-blue-900 rounded-2xl p-6 bg-white text-slate-900 relative overflow-hidden shadow-lg max-w-sm mx-auto">
              <div className="bg-blue-900 text-white py-3 px-4 -mx-6 -mt-6 mb-4 text-center">
                <h4 className="font-serif font-bold text-sm uppercase tracking-wider">The Foundation Collegiate</h4>
                <p className="text-[9px] text-blue-200 uppercase tracking-widest">Student Identity Card</p>
              </div>

              <div className="flex flex-col items-center space-y-3">
                <div className="w-24 h-24 rounded-2xl overflow-hidden border-2 border-blue-900 shadow-md bg-slate-100">
                  {printStudent.photo_url ? (
                    <img src={printStudent.photo_url} alt={printStudent.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-blue-600 text-white flex items-center justify-center font-bold text-2xl">
                      {printStudent.name.charAt(0)}
                    </div>
                  )}
                </div>

                <div className="space-y-1">
                  <h3 className="font-bold text-lg text-slate-900 leading-tight">{printStudent.name}</h3>
                  <p className="text-xs text-slate-500 font-medium">S/O: {printStudent.father_name || 'N/A'}</p>
                </div>

                <div className="w-full bg-blue-50 border border-blue-100 rounded-xl p-3 text-xs space-y-1 text-left">
                  <div className="flex justify-between"><span className="text-slate-500 font-medium">Roll Number:</span> <span className="font-mono font-bold text-blue-900">{printStudent.roll_number}</span></div>
                  <div className="flex justify-between"><span className="text-slate-500 font-medium">Class / Group:</span> <span className="font-bold text-slate-800">{printStudent.class_name}</span></div>
                  <div className="flex justify-between"><span className="text-slate-500 font-medium">Email:</span> <span className="font-medium text-slate-800">{printStudent.email || 'N/A'}</span></div>
                  <div className="flex justify-between"><span className="text-slate-500 font-medium">Contact:</span> <span className="font-mono text-slate-800">{printStudent.phone || 'N/A'}</span></div>
                </div>

                <div className="w-full pt-2 flex justify-between items-end text-[9px] text-slate-500 border-t border-slate-200">
                  <div className="text-left space-y-0.5">
                    <span className="font-mono text-blue-950 font-bold block">{printStudent.roll_number}</span>
                    <span className="text-[7px] text-slate-400 block font-mono">SHA256: VERIFIED</span>
                  </div>
                  <div className="text-center">
                    <span className="font-serif italic font-bold text-blue-900 text-xs block">Dr. Asif Iqbal</span>
                    <span className="text-[8px] font-bold text-slate-800 border-t border-slate-800 px-2 pt-0.5 block">Director &amp; Principal Sign</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Bulk Student Import Modal */}
      {showBulkModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-3xl w-full p-6 sm:p-8 space-y-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                  <Upload size={24} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-xl">Bulk Student Import Wizard</h3>
                  <p className="text-xs text-slate-500">Import multiple student records from CSV files or Excel paste</p>
                </div>
              </div>
              <button 
                onClick={() => setShowBulkModal(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
              <div className="text-xs text-slate-600 space-y-1">
                <p className="font-bold text-slate-800">Need the correct column format?</p>
                <p>Download our sample CSV template or upload your spreadsheet.</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleDownloadSampleCSV}
                  className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs border border-slate-200 shadow-xs flex items-center gap-1.5 transition-colors"
                >
                  <FileSpreadsheet size={15} className="text-emerald-600" /> Download Sample CSV
                </button>
                <label className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs flex items-center gap-1.5 cursor-pointer transition-colors">
                  <Upload size={15} /> Upload CSV File
                  <input 
                    type="file" 
                    accept=".csv, .txt" 
                    onChange={handleBulkFileUpload} 
                    className="hidden" 
                  />
                </label>
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Paste CSV or Tab-Separated Data
              </label>
              <textarea
                rows={6}
                value={bulkInputText}
                onChange={(e) => parseBulkInputText(e.target.value)}
                placeholder={`Roll Number, Student Name, Father Name, Class Name, Section, Phone, Email\nFC-2026-201, Muhammad Ali, Tariq Ali, Class IX, A, 0333-1112233, ali@gmail.com\nFC-2026-202, Fatima Raza, Raza Hussain, Class X, A, 0321-4445566, fatima@gmail.com`}
                className="w-full font-mono text-xs p-3.5 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-slate-50/50"
              />
              <p className="text-[11px] text-slate-400">Columns order: Roll Number, Student Name, Father Name, Class Name, Section, Phone, Email, Gender, Address</p>
            </div>

            {/* Preview Table */}
            {parsedBulk.length > 0 && (
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                  <span>Detected Records Preview ({parsedBulk.length} Students)</span>
                  <span className="text-emerald-600 font-semibold">✓ Ready for Batch Import</span>
                </div>

                <div className="border border-slate-200 rounded-2xl overflow-hidden max-h-48 overflow-y-auto">
                  <table className="w-full text-left text-xs divide-y divide-slate-100">
                    <thead className="bg-slate-50 font-bold text-slate-500 uppercase tracking-wider text-[10px]">
                      <tr>
                        <th className="p-2.5">#</th>
                        <th className="p-2.5">Roll No.</th>
                        <th className="p-2.5">Student Name</th>
                        <th className="p-2.5">Father Name</th>
                        <th className="p-2.5">Class Name</th>
                        <th className="p-2.5">Phone</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {parsedBulk.slice(0, 15).map((row, idx) => (
                        <tr key={idx} className="hover:bg-slate-50">
                          <td className="p-2.5 text-slate-400 font-mono">{idx + 1}</td>
                          <td className="p-2.5 font-mono font-bold text-indigo-600">{row.roll_number}</td>
                          <td className="p-2.5 font-bold text-slate-800">{row.name}</td>
                          <td className="p-2.5 text-slate-500">{row.father_name}</td>
                          <td className="p-2.5 font-semibold text-slate-700">{row.class_name}</td>
                          <td className="p-2.5 font-mono text-slate-500">{row.phone || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {parsedBulk.length > 15 && (
                    <div className="p-2 bg-slate-50 text-center text-[11px] text-slate-400 font-medium">
                      + {parsedBulk.length - 15} more records ready to import...
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Modal Buttons */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowBulkModal(false)}
                className="px-5 py-2.5 rounded-xl text-slate-600 font-bold text-xs hover:bg-slate-100 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecuteBulkImport}
                disabled={parsedBulk.length === 0 || bulkImporting}
                className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-xs shadow-md shadow-indigo-500/20 flex items-center gap-2 transition-all"
              >
                {bulkImporting ? (
                  <>
                    <Loader2 size={16} className="animate-spin" /> Importing Batch...
                  </>
                ) : (
                  <>
                    <UserCheck size={16} /> Import {parsedBulk.length} Students Now
                  </>
                )}
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
