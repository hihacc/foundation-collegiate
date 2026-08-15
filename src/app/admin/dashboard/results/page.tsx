'use client';
export const dynamic = 'force-dynamic';

import { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { 
  Search, Download, GraduationCap, Loader2, 
  Key, Calendar, Save, Printer, 
  BookOpen, Users, Dice5, Eye, X, FileSpreadsheet, PlusCircle,
  LayoutGrid, Table as TableIcon, RotateCcw
} from 'lucide-react';
import Button from '@/components/ui/Button';
import { Result, Student, SubjectResult } from '@/types';
import { getStoredData, setStoredData } from '@/lib/utils/storage';
import { OFFICIAL_CLASSES, matchStudentToClass, getDefaultSubjectsForClass } from '@/lib/utils/classes';

const isUUID = (str: any) => typeof str === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);

const PRESET_MONTHS = [
  'July 2026',
  'August 2026',
  'September 2026',
  'October 2026',
  'November 2026',
  'December 2026',
  'Mid-Term 2026',
  'First Term 2026',
  'Annual 2026',
];

const getGradeBadge = (grade: string) => {
  if (!grade) return 'bg-slate-100 text-slate-700 border-slate-200';
  const g = grade.toUpperCase();
  if (g.includes('DISTINCTION') || g.includes('A-1') || g.includes('1ST') || g.includes('A+')) {
    return 'bg-emerald-100 text-emerald-800 border-emerald-300 font-black';
  }
  if (g.includes('FIRST DIVISION') || g.includes('A')) {
    return 'bg-blue-100 text-blue-800 border-blue-300 font-black';
  }
  if (g.includes('PASS') || g.includes('B') || g.includes('C')) {
    return 'bg-amber-100 text-amber-800 border-amber-300 font-black';
  }
  return 'bg-red-100 text-red-800 border-red-300 font-black';
};

interface StudentMarkRow {
  student_id: string;
  roll_number: string;
  student_name: string;
  father_name: string;
  class_name: string;
  pin: string;
  result_id?: string;
  exam_name: string;
  month: string;
  subject_marks: Record<string, number | ''>;
  total_marks: number;
  obtained_marks: number;
  percentage: number;
  grade: string;
  position: string;
  remarks: string;
  is_saved: boolean;
}

export default function AdminResultsPage() {
  const [results, setResults] = useState<Result[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [pinMap, setPinMap] = useState<Record<string, string>>({});
  
  // Selection State - defaults to Class IX - Computer Science which has active students
  const [selectedClassKey, setSelectedClassKey] = useState<string>(OFFICIAL_CLASSES[0].key);
  const [selectedMonth, setSelectedMonth] = useState<string>('July 2026');
  const [customMonthInput, setCustomMonthInput] = useState<string>('');
  const [search, setSearch] = useState('');
  
  // Responsive View Mode: 'table' vs 'cards'
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');

  // Class-level configured subject columns
  const [classSubjects, setClassSubjects] = useState<{ name: string; total_marks: number }[]>([]);
  
  // New subject column input modal/popover
  const [newSubName, setNewSubName] = useState('');
  const [newSubTotal, setNewSubTotal] = useState(100);
  const [showAddSubjectBar, setShowAddSubjectBar] = useState(false);

  const [loading, setLoading] = useState(true);
  const [savingAll, setSavingAll] = useState(false);
  const [savingRowId, setSavingRowId] = useState<string | null>(null);
  const [previewStudent, setPreviewStudent] = useState<StudentMarkRow | null>(null);

  // Mark rows map: studentId -> StudentMarkRow
  const [markRows, setMarkRows] = useState<Record<string, StudentMarkRow>>({});

  const generateRandomPin = () => Math.floor(1000 + Math.random() * 9000).toString();

  const activeMonthName = customMonthInput.trim() || selectedMonth;

  // 1. Fetch Students, Results, and PINs
  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch Students
      const { data: stdData } = await supabase.from('students').select('*').order('name');
      const loadedStudents = stdData && stdData.length > 0 ? (stdData as Student[]) : getStoredData<Student[]>('students', []);
      setStudents(loadedStudents);

      // Fetch Results
      const { data: resData } = await supabase.from('results').select('*').order('created_at', { ascending: false });
      const loadedResults = resData && resData.length > 0 ? (resData as Result[]) : getStoredData<Result[]>('results', []);
      setResults(loadedResults);

      // Fetch PINs
      const { data: pinData } = await supabase.from('pins').select('*');
      const map: Record<string, string> = {};
      if (pinData) {
        pinData.forEach((p: any) => {
          if (p.roll_number && p.pin_hash) map[p.roll_number.toUpperCase()] = p.pin_hash;
        });
      } else {
        const localPins = JSON.parse(localStorage.getItem('tfc_admin_pins') || '{}');
        Object.keys(localPins).forEach(k => {
          map[k.toUpperCase()] = localPins[k].pin_hash || localPins[k];
        });
      }
      setPinMap(map);
    } catch (err) {
      console.error('Fetch error:', err);
      setStudents(getStoredData('students', []));
      setResults(getStoredData('results', []));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // 2. Compute Class Subject List whenever selectedClassKey changes
  useEffect(() => {
    const defaultSubs = getDefaultSubjectsForClass(selectedClassKey);

    const savedCustomSubjects = localStorage.getItem(`tfc_class_subjects_${selectedClassKey}`);
    if (savedCustomSubjects) {
      try {
        const parsed = JSON.parse(savedCustomSubjects);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setClassSubjects(parsed);
          return;
        }
      } catch {}
    }

    setClassSubjects(defaultSubs);
  }, [selectedClassKey]);

  // 3. Filter Enrolled Students for Selected Class using Canonical matcher
  const classStudents = useMemo(() => {
    return students.filter(s => matchStudentToClass(s.class_name, selectedClassKey));
  }, [students, selectedClassKey]);

  // Helper for metrics
  const calculateMetrics = (subjectMarks: Record<string, number | ''>, subjects: { name: string; total_marks: number }[]) => {
    let obtainedSum = 0;
    let totalSum = 0;
    let hasFailed = false;

    subjects.forEach(sub => {
      const max = sub.total_marks || 100;
      totalSum += max;

      const rawVal = subjectMarks[sub.name];
      const marks = typeof rawVal === 'number' ? Math.min(max, Math.max(0, rawVal)) : 0;
      obtainedSum += marks;

      if (typeof rawVal === 'number' && marks < (max * 0.33)) {
        hasFailed = true;
      }
    });

    const t = totalSum > 0 ? totalSum : 100;
    const pct = Number(((obtainedSum / t) * 100).toFixed(1));

    let grade = 'PASS';
    if (hasFailed || pct < 40) grade = 'F';
    else if (pct >= 85) grade = 'DISTINCTION';
    else if (pct >= 80) grade = 'A-1';
    else if (pct >= 60) grade = 'A';
    else if (pct >= 50) grade = 'B';
    else grade = 'PASS';

    return { total_marks: totalSum, obtained_marks: obtainedSum, percentage: pct, grade };
  };

  // 4. Synchronize Mark Rows for all students in class
  useEffect(() => {
    const rows: Record<string, StudentMarkRow> = {};

    classStudents.forEach(st => {
      const rollUpper = (st.roll_number || '').trim().toUpperCase();
      const existingRes = results.find(r => 
        (r.roll_number || '').trim().toUpperCase() === rollUpper && 
        (r.month || 'July 2026').toLowerCase() === activeMonthName.toLowerCase()
      );

      const existingPin = pinMap[rollUpper] || '';

      const subjectMarks: Record<string, number | ''> = {};
      classSubjects.forEach(sub => {
        subjectMarks[sub.name] = '';
      });

      if (existingRes) {
        if (existingRes.subjects && Array.isArray(existingRes.subjects)) {
          existingRes.subjects.forEach(s => {
            if (s.name) {
              const parsedVal = typeof s.marks === 'number' ? s.marks : Number(s.marks);
              subjectMarks[s.name] = !isNaN(parsedVal) ? parsedVal : 0;
            }
          });
        }

        const metrics = calculateMetrics(subjectMarks, classSubjects);

        rows[st.id] = {
          student_id: st.id,
          roll_number: st.roll_number || existingRes.roll_number || '',
          student_name: st.name || existingRes.student_name || '',
          father_name: st.father_name || existingRes.father_name || '',
          class_name: st.class_name || existingRes.class_name || selectedClassKey || '',
          pin: existingPin || generateRandomPin(),
          result_id: existingRes.id,
          exam_name: existingRes.exam_name || 'Monthly Assessment Test',
          month: activeMonthName,
          subject_marks: subjectMarks,
          total_marks: existingRes.total_marks || metrics.total_marks,
          obtained_marks: existingRes.obtained_marks || metrics.obtained_marks,
          percentage: existingRes.percentage || metrics.percentage,
          grade: existingRes.grade || metrics.grade,
          position: existingRes.position || '',
          remarks: existingRes.remarks || '',
          is_saved: true,
        };
      } else {
        const metrics = calculateMetrics(subjectMarks, classSubjects);

        rows[st.id] = {
          student_id: st.id,
          roll_number: st.roll_number || `FC-26-${st.id.slice(0, 4)}`,
          student_name: st.name || '',
          father_name: st.father_name || '',
          class_name: st.class_name || selectedClassKey || '',
          pin: existingPin || generateRandomPin(),
          exam_name: 'Monthly Assessment Test',
          month: activeMonthName,
          subject_marks: subjectMarks,
          total_marks: metrics.total_marks,
          obtained_marks: 0,
          percentage: 0,
          grade: 'PASS',
          position: '',
          remarks: '',
          is_saved: false,
        };
      }
    });

    setMarkRows(rows);
  }, [classStudents, classSubjects, activeMonthName, results, pinMap, selectedClassKey]);

  // Handle Direct Numeric Mark Change in Cell WITH STRICT MAX CLAMPING
  const handleMarkCellChange = (studentId: string, subjectName: string, valueStr: string) => {
    setMarkRows(prev => {
      const current = prev[studentId];
      if (!current) return prev;

      const targetSubject = classSubjects.find(s => s.name === subjectName);
      const maxAllowed = targetSubject ? targetSubject.total_marks : 100;

      let num: number | '' = '';
      if (valueStr !== '') {
        const parsed = Number(valueStr);
        if (!isNaN(parsed)) {
          if (parsed > maxAllowed) {
            toast.warning(`Maximum marks for ${subjectName} is ${maxAllowed}. Automatically set to ${maxAllowed}.`);
            num = maxAllowed;
          } else if (parsed < 0) {
            num = 0;
          } else {
            num = parsed;
          }
        }
      }

      const updatedSubjectMarks: Record<string, number | ''> = {
        ...(current.subject_marks || {}),
        [subjectName]: num
      };

      const { total_marks, obtained_marks, percentage, grade } = calculateMetrics(updatedSubjectMarks, classSubjects);

      return {
        ...prev,
        [studentId]: {
          ...current,
          subject_marks: updatedSubjectMarks,
          total_marks,
          obtained_marks,
          percentage,
          grade,
          is_saved: false,
        }
      };
    });
  };

  const handleRowPinChange = (studentId: string, pin: string) => {
    setMarkRows(prev => {
      const current = prev[studentId];
      if (!current) return prev;
      return {
        ...prev,
        [studentId]: {
          ...current,
          pin: (pin || '').replace(/\D/g, '').slice(0, 4),
          is_saved: false,
        }
      };
    });
  };

  const handleRegeneratePin = (studentId: string) => {
    const newPin = generateRandomPin();
    handleRowPinChange(studentId, newPin);
    toast.info(`PIN generated: ${newPin}`);
  };

  // Add Subject Column for entire class
  const handleAddSubjectColumn = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = (newSubName || '').trim();
    if (!cleanName) return;

    if (classSubjects.some(s => s.name.toLowerCase() === cleanName.toLowerCase())) {
      return toast.error(`Subject "${cleanName}" already exists in table!`);
    }

    const updatedSubjects = [...classSubjects, { name: cleanName, total_marks: Math.max(1, Number(newSubTotal) || 100) }];
    setClassSubjects(updatedSubjects);
    localStorage.setItem(`tfc_class_subjects_${selectedClassKey}`, JSON.stringify(updatedSubjects));

    setNewSubName('');
    setNewSubTotal(100);
    setShowAddSubjectBar(false);
    toast.success(`Subject column "${cleanName}" added for all students in ${selectedClassKey}!`);
  };

  // Remove Subject Column for entire class
  const handleRemoveSubjectColumn = (subjectName: string) => {
    if (!confirm(`Remove subject column "${subjectName}" for all students in ${selectedClassKey}?`)) return;
    const updatedSubjects = classSubjects.filter(s => s.name !== subjectName);
    setClassSubjects(updatedSubjects);
    localStorage.setItem(`tfc_class_subjects_${selectedClassKey}`, JSON.stringify(updatedSubjects));
    toast.success(`Subject "${subjectName}" removed from ${selectedClassKey}.`);
  };

  // Reset to default subjects for selected class
  const handleResetClassSubjects = () => {
    if (!confirm(`Reset subjects for "${selectedClassKey}" back to standard Board curriculum?`)) return;
    localStorage.removeItem(`tfc_class_subjects_${selectedClassKey}`);
    const defaultSubs = getDefaultSubjectsForClass(selectedClassKey);
    setClassSubjects(defaultSubs);
    toast.success(`Restored official curriculum subjects for ${selectedClassKey}!`);
  };

  // Auto Generate PINs for All in class
  const handleAutoGenerateAllPins = () => {
    setMarkRows(prev => {
      const updated: Record<string, StudentMarkRow> = {};
      Object.keys(prev).forEach(stId => {
        const row = prev[stId];
        const newPin = row.pin && row.pin.length === 4 ? row.pin : generateRandomPin();
        updated[stId] = { ...row, pin: newPin, is_saved: false };
      });
      return updated;
    });
    toast.success('4-Digit Security PINs generated for all students in this class!');
  };

  // Save Single Student Row
  const handleSaveSingleRow = async (studentId: string) => {
    const row = markRows[studentId];
    if (!row) return;

    setSavingRowId(studentId);
    try {
      const rollUpper = (row.roll_number || '').trim().toUpperCase();
      const pinCode = (row.pin || '').trim() || '1234';

      const structuredSubjects: SubjectResult[] = classSubjects.map(sub => {
        const raw = row.subject_marks?.[sub.name];
        const max = sub.total_marks || 100;
        const m = typeof raw === 'number' ? Math.min(max, Math.max(0, raw)) : 0;
        const pct = (m / max) * 100;
        let g = 'PASS';
        if (pct >= 80) g = 'A-1';
        else if (pct >= 60) g = 'A';
        else if (pct >= 40) g = 'B';
        else g = 'F';

        return {
          name: sub.name,
          total_marks: max,
          marks: m,
          grade: g,
        };
      });

      const payload = {
        roll_number: rollUpper,
        student_name: (row.student_name || '').trim(),
        father_name: (row.father_name || '').trim(),
        class_name: (row.class_name || '').trim(),
        exam_name: (row.exam_name || '').trim() || 'Monthly Assessment Test',
        month: activeMonthName,
        total_marks: row.total_marks,
        obtained_marks: row.obtained_marks,
        percentage: row.percentage,
        grade: row.grade,
        position: (row.position || '').trim(),
        remarks: (row.remarks || '').trim(),
        subjects: structuredSubjects,
        is_active: true,
      };

      let resultId = row.result_id || crypto.randomUUID();

      if (row.result_id && isUUID(row.result_id)) {
        await supabase.from('results').update(payload).eq('id', row.result_id);
      } else {
        const { data } = await supabase.from('results').upsert([{ id: resultId, ...payload }]).select().single();
        if (data?.id) resultId = data.id;
      }

      await supabase.from('pins').upsert({ roll_number: rollUpper, pin_hash: pinCode, is_active: true }, { onConflict: 'roll_number' });

      setPinMap(prev => ({ ...prev, [rollUpper]: pinCode }));

      const existingFiltered = results.filter(r => !(r.roll_number.toUpperCase() === rollUpper && (r.month || 'July 2026') === activeMonthName));
      const newResultRecord: Result = { id: resultId, ...payload, created_at: new Date().toISOString() };
      const updatedResults = [newResultRecord, ...existingFiltered];
      setResults(updatedResults);
      setStoredData('results', updatedResults);

      setMarkRows(prev => ({
        ...prev,
        [studentId]: { ...row, result_id: resultId, is_saved: true }
      }));

      toast.success(`Marks & PIN saved for ${row.student_name} (${rollUpper})!`);
    } catch (err: any) {
      toast.error(`Save error: ${err.message || 'Failed'}`);
    } finally {
      setSavingRowId(null);
    }
  };

  // Bulk Save All Students in Class
  const handleSaveAllClassResults = async () => {
    const rowList = Object.values(markRows);
    if (rowList.length === 0) return toast.info('No students in this class.');

    setSavingAll(true);
    try {
      const resultsToUpsert = rowList.map(row => {
        const rollUpper = (row.roll_number || '').trim().toUpperCase();
        const structuredSubjects: SubjectResult[] = classSubjects.map(sub => {
          const raw = row.subject_marks?.[sub.name];
          const max = sub.total_marks || 100;
          const m = typeof raw === 'number' ? Math.min(max, Math.max(0, raw)) : 0;
          const pct = (m / max) * 100;
          let g = 'PASS';
          if (pct >= 80) g = 'A-1';
          else if (pct >= 60) g = 'A';
          else if (pct >= 40) g = 'B';
          else g = 'F';

          return {
            name: sub.name,
            total_marks: max,
            marks: m,
            grade: g,
          };
        });

        return {
          id: row.result_id && isUUID(row.result_id) ? row.result_id : crypto.randomUUID(),
          roll_number: rollUpper,
          student_name: (row.student_name || '').trim(),
          father_name: (row.father_name || '').trim(),
          class_name: (row.class_name || '').trim(),
          exam_name: (row.exam_name || '').trim() || 'Monthly Assessment Test',
          month: activeMonthName,
          total_marks: row.total_marks,
          obtained_marks: row.obtained_marks,
          percentage: row.percentage,
          grade: row.grade,
          position: (row.position || '').trim(),
          remarks: (row.remarks || '').trim(),
          subjects: structuredSubjects,
          is_active: true,
          created_at: new Date().toISOString()
        };
      });

      const pinsToUpsert = rowList.map(row => ({
        roll_number: (row.roll_number || '').trim().toUpperCase(),
        pin_hash: (row.pin || '').trim() || '1234',
        is_active: true
      }));

      // Supabase batch upsert
      try {
        await supabase.from('results').upsert(resultsToUpsert);
        await supabase.from('pins').upsert(pinsToUpsert, { onConflict: 'roll_number' });
      } catch (e) {
        console.warn('DB upsert fallback notice:', e);
      }

      // Local storage update
      const activeRolls = new Set(resultsToUpsert.map(r => r.roll_number));
      const remainingResults = results.filter(r => !(activeRolls.has(r.roll_number.toUpperCase()) && (r.month || 'July 2026') === activeMonthName));
      const updatedTotalResults = [...resultsToUpsert as Result[], ...remainingResults];
      
      setResults(updatedTotalResults);
      setStoredData('results', updatedTotalResults);

      const newPinMap = { ...pinMap };
      pinsToUpsert.forEach(p => { newPinMap[p.roll_number] = p.pin_hash; });
      setPinMap(newPinMap);

      setMarkRows(prev => {
        const updated: Record<string, StudentMarkRow> = {};
        Object.keys(prev).forEach(stId => {
          updated[stId] = { ...prev[stId], is_saved: true };
        });
        return updated;
      });

      toast.success(`Successfully saved marks and security PINs for all ${resultsToUpsert.length} students in ${selectedClassKey}!`);
    } catch (err: any) {
      toast.error('Bulk save encountered an error');
    } finally {
      setSavingAll(false);
    }
  };

  // Filtered rows by search
  const displayedRows = useMemo(() => {
    const list = Object.values(markRows);
    if (!search.trim()) return list;
    const q = search.toLowerCase();
    return list.filter(r => 
      (r.student_name || '').toLowerCase().includes(q) ||
      (r.roll_number || '').toLowerCase().includes(q) ||
      (r.father_name || '').toLowerCase().includes(q)
    );
  }, [markRows, search]);

  const statsSummary = useMemo(() => {
    const list = Object.values(markRows);
    const totalCount = list.length;
    const enteredCount = list.filter(r => r.obtained_marks > 0).length;
    const totalPct = list.reduce((sum, r) => sum + (r.percentage || 0), 0);
    const avgPct = totalCount > 0 ? (totalPct / totalCount).toFixed(1) : '0';
    const topScorer = list.reduce((prev, curr) => (curr.obtained_marks > prev.obtained_marks ? curr : prev), list[0]);

    return { totalCount, enteredCount, avgPct, topScorerName: topScorer?.obtained_marks > 0 ? `${topScorer.student_name} (${topScorer.percentage}%)` : 'None' };
  }, [markRows]);

  const handleExportCSV = () => {
    const list = Object.values(markRows);
    if (list.length === 0) return toast.error('No students to export.');
    
    const subjectHeaders = classSubjects.map(s => `"${s.name} (${s.total_marks})"`);
    const headers = ['Serial', 'Roll Number', 'Student Name', 'Father Name', 'Class', 'Security PIN', ...subjectHeaders, 'Grand Total', 'Obtained Marks', 'Percentage', 'Grade'];
    
    const rows = list.map((r, i) => {
      const subVals = classSubjects.map(s => {
        const val = r.subject_marks?.[s.name];
        return val === '' || val === undefined ? 0 : val;
      });
      return [
        i + 1,
        `"${r.roll_number || ''}"`,
        `"${r.student_name || ''}"`,
        `"${r.father_name || ''}"`,
        `"${r.class_name || ''}"`,
        `"${r.pin || ''}"`,
        ...subVals,
        r.total_marks || 0,
        r.obtained_marks || 0,
        `"${r.percentage || 0}%"`,
        `"${r.grade || ''}"`
      ];
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `TFC_${selectedClassKey.replace(/[^a-zA-Z0-9]/g, '_')}_${activeMonthName.replace(/\s+/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Spreadsheet exported to CSV!');
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto font-sans px-2 sm:px-4 lg:px-6">
      
      {/* 1. Header & Quick Controls */}
      <div className="bg-white p-4 sm:p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <GraduationCap className="text-blue-600 shrink-0" size={28} />
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-display font-black text-slate-800">
              Class Examination Marksheet &amp; Results
            </h1>
          </div>
          <p className="text-slate-500 text-xs sm:text-sm mt-1">
            Excel-style direct marks entry. Maximum marks validation automatically prevents marks exceeding subject limits.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
          {/* View Mode Toggle for Small Screens */}
          <div className="flex items-center bg-slate-100 p-1 rounded-2xl border border-slate-200 md:hidden">
            <button
              onClick={() => setViewMode('table')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 transition-all ${
                viewMode === 'table' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-600'
              }`}
            >
              <TableIcon size={14} /> Table
            </button>
            <button
              onClick={() => setViewMode('cards')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 transition-all ${
                viewMode === 'cards' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-600'
              }`}
            >
              <LayoutGrid size={14} /> Cards
            </button>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCSV}
            className="border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-bold flex-1 sm:flex-none"
          >
            <Download size={14} className="mr-1.5" /> CSV
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleAutoGenerateAllPins}
            className="border-amber-200 bg-amber-50/70 text-amber-900 hover:bg-amber-100 text-xs font-bold flex-1 sm:flex-none"
          >
            <Key size={14} className="mr-1.5 text-amber-600" /> Auto PINs
          </Button>

          <Button
            size="sm"
            onClick={handleSaveAllClassResults}
            disabled={savingAll}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-600/20 w-full sm:w-auto min-w-[140px]"
          >
            {savingAll ? <Loader2 size={14} className="animate-spin mr-1.5" /> : <Save size={14} className="mr-1.5" />}
            Save All Class Marks
          </Button>
        </div>
      </div>

      {/* 2. Step 1 (Class) & Step 2 (Month) Selectors */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 bg-white p-4 sm:p-5 rounded-3xl border border-slate-200 shadow-sm">
        
        {/* Class Selection Dropdown (Standardized & Accurate) */}
        <div className="md:col-span-6 space-y-1.5">
          <label className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
            <BookOpen size={14} className="text-blue-600 shrink-0" /> Step 1: Select Academic Class / Program *
          </label>
          
          <select
            value={selectedClassKey}
            onChange={e => setSelectedClassKey(e.target.value)}
            className="w-full bg-slate-50 border-2 border-blue-500 text-slate-900 font-bold text-xs sm:text-sm rounded-2xl py-3 px-3 sm:px-4 focus:ring-2 focus:ring-blue-600 focus:outline-none transition-all shadow-inner cursor-pointer"
          >
            <optgroup label="✨ Quick View">
              <option value="ALL_STUDENTS">
                All Enrolled Students ({students.length} Total Students)
              </option>
            </optgroup>

            <optgroup label="📚 Matriculation (Classes IX & X)">
              {OFFICIAL_CLASSES.filter(c => c.category === 'Matriculation (IX & X)').map(cls => {
                const count = students.filter(s => matchStudentToClass(s.class_name, cls.key)).length;
                return (
                  <option key={cls.key} value={cls.key}>
                    {cls.name} {count > 0 ? `(${count} Enrolled)` : ''}
                  </option>
                );
              })}
            </optgroup>

            <optgroup label="🎓 Intermediate (Classes XI & XII)">
              {OFFICIAL_CLASSES.filter(c => c.category === 'Intermediate (XI & XII)').map(cls => {
                const count = students.filter(s => matchStudentToClass(s.class_name, cls.key)).length;
                return (
                  <option key={cls.key} value={cls.key}>
                    {cls.name} {count > 0 ? `(${count} Enrolled)` : ''}
                  </option>
                );
              })}
            </optgroup>

            <optgroup label="💻 Professional Diplomas">
              {OFFICIAL_CLASSES.filter(c => c.category === 'Diplomas & Others').map(cls => {
                const count = students.filter(s => matchStudentToClass(s.class_name, cls.key)).length;
                return (
                  <option key={cls.key} value={cls.key}>
                    {cls.name} {count > 0 ? `(${count} Enrolled)` : ''}
                  </option>
                );
              })}
            </optgroup>
          </select>
        </div>

        {/* Month Selection Dropdown */}
        <div className="md:col-span-4 space-y-1.5">
          <label className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
            <Calendar size={14} className="text-blue-600 shrink-0" /> Step 2: Select Exam Month / Session *
          </label>
          <select
            value={selectedMonth || 'July 2026'}
            onChange={e => {
              setSelectedMonth(e.target.value);
              if (e.target.value !== 'CUSTOM') setCustomMonthInput('');
            }}
            className="w-full bg-slate-50 border-2 border-blue-500 text-slate-900 font-bold text-xs sm:text-sm rounded-2xl py-3 px-3 sm:px-4 focus:ring-2 focus:ring-blue-600 focus:outline-none transition-all shadow-inner cursor-pointer"
          >
            {PRESET_MONTHS.map(m => (
              <option key={m} value={m}>{m}</option>
            ))}
            <option value="CUSTOM">-- Custom Month Session --</option>
          </select>

          {selectedMonth === 'CUSTOM' && (
            <input
              type="text"
              required
              placeholder="e.g. October 2026 or Mid-Term Assessment"
              value={customMonthInput ?? ''}
              onChange={e => setCustomMonthInput(e.target.value)}
              className="w-full mt-2 px-4 py-2 text-xs font-bold border border-blue-300 rounded-xl bg-blue-50/50 text-blue-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          )}
        </div>

        {/* Filter Search */}
        <div className="md:col-span-2 space-y-1.5">
          <label className="text-xs font-black uppercase tracking-wider text-slate-700 block">
            Filter Roster
          </label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
            <input
              type="text"
              placeholder="Search..."
              value={search ?? ''}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-inner"
            />
          </div>
        </div>
      </div>

      {/* 3. Class Subjects Toolbar (Isolated strictly to selected class) */}
      <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2 flex-wrap">
            <FileSpreadsheet className="text-blue-600 shrink-0" size={18} />
            <h2 className="text-xs sm:text-sm font-black text-slate-800 uppercase tracking-wider">
              {selectedClassKey} Subjects ({classSubjects.length} Active Columns)
            </h2>
            <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
              Isolated to {selectedClassKey}
            </span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Button
              size="sm"
              variant="outline"
              onClick={handleResetClassSubjects}
              title="Reset subjects for this class to standard board curriculum"
              className="border-slate-200 text-slate-600 hover:bg-slate-100 font-bold text-xs flex-1 sm:flex-none"
            >
              <RotateCcw size={13} className="mr-1.5 text-slate-500" />
              Reset Curriculum
            </Button>

            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowAddSubjectBar(!showAddSubjectBar)}
              className="border-blue-200 text-blue-700 bg-blue-50 hover:bg-blue-100 font-bold text-xs flex-1 sm:flex-none"
            >
              <PlusCircle size={14} className="mr-1.5 text-blue-600" />
              {showAddSubjectBar ? 'Close Add' : '+ Add Subject'}
            </Button>
          </div>
        </div>

        {/* Add Subject Inline Form */}
        {showAddSubjectBar && (
          <form onSubmit={handleAddSubjectColumn} className="flex flex-wrap items-center gap-3 bg-blue-50/70 p-3.5 rounded-2xl border border-blue-200 animate-in fade-in duration-200">
            <div className="flex-1 min-w-[180px]">
              <input
                type="text"
                required
                placeholder={`Subject Name for ${selectedClassKey} (e.g. Zoology, Statistics, POC)`}
                value={newSubName ?? ''}
                onChange={e => setNewSubName(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-blue-300 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="w-full sm:w-32">
              <input
                type="number"
                required
                min={1}
                placeholder="Total Marks"
                value={newSubTotal ?? 100}
                onChange={e => setNewSubTotal(Number(e.target.value))}
                className="w-full px-3 py-2 bg-white border border-blue-300 rounded-xl text-xs font-bold text-slate-800 text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <Button type="submit" size="sm" className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs py-2 w-full sm:w-auto cursor-pointer">
              Add to {selectedClassKey}
            </Button>
          </form>
        )}

        {/* Active Subject Badges with Remove Option */}
        <div className="flex flex-wrap items-center gap-2">
          {classSubjects.map((sub, idx) => (
            <div 
              key={idx}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 border border-slate-200 text-xs font-bold text-slate-800 shadow-2xs group"
            >
              <span>{sub.name}</span>
              <span className="text-[10px] font-mono text-blue-700 bg-blue-100/70 px-1.5 py-0.5 rounded-md font-black">
                Max: {sub.total_marks}
              </span>
              <button
                type="button"
                onClick={() => handleRemoveSubjectColumn(sub.name)}
                title={`Remove ${sub.name} column from ${selectedClassKey}`}
                className="text-slate-400 hover:text-red-600 transition-colors ml-1 cursor-pointer"
              >
                <X size={13} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* 4. Quick Metrics Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-gradient-to-r from-blue-50 via-indigo-50 to-slate-50 p-3 sm:p-4 rounded-2xl border border-blue-100 text-slate-800">
        <div>
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Class Enrolled</span>
          <div className="text-lg sm:text-xl font-black text-blue-700">{statsSummary.totalCount} Students</div>
        </div>

        <div>
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Exam Month</span>
          <div className="text-xs sm:text-sm font-bold text-slate-800 truncate">{activeMonthName}</div>
        </div>

        <div>
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Class Average</span>
          <div className="text-lg sm:text-xl font-black text-emerald-600">{statsSummary.avgPct}%</div>
        </div>

        <div>
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Top Scorer</span>
          <div className="text-xs font-bold text-indigo-900 truncate">{statsSummary.topScorerName}</div>
        </div>
      </div>

      {/* 5A. Mobile Cards View */}
      {viewMode === 'cards' && (
        <div className="space-y-4 md:hidden">
          {displayedRows.length === 0 ? (
            <div className="bg-white p-8 rounded-3xl border border-slate-200 text-center text-slate-400">
              <Users className="mx-auto mb-2 text-slate-300" size={36} />
              <p className="font-bold text-slate-700 text-sm">No students found.</p>
            </div>
          ) : (
            displayedRows.map((row, idx) => {
              const isRowSaving = savingRowId === row.student_id;

              return (
                <div 
                  key={row.student_id} 
                  className={`p-4 rounded-3xl border transition-all space-y-4 shadow-sm ${
                    row.is_saved ? 'bg-white border-slate-200' : 'bg-amber-50/40 border-amber-300'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">
                          #{idx + 1}
                        </span>
                        <span className="font-mono font-black text-xs text-blue-900">{row.roll_number}</span>
                      </div>
                      <h3 className="font-bold text-slate-900 text-sm mt-0.5">{row.student_name}</h3>
                      {row.father_name && <p className="text-[11px] text-slate-500">S/O {row.father_name}</p>}
                    </div>

                    <div className="flex items-center gap-1 bg-amber-50 border border-amber-200 rounded-xl px-2 py-1">
                      <Key size={11} className="text-amber-600" />
                      <input
                        type="text"
                        maxLength={4}
                        value={row.pin ?? ''}
                        onChange={e => handleRowPinChange(row.student_id, e.target.value)}
                        placeholder="1234"
                        className="w-8 bg-transparent text-center font-mono font-black text-amber-950 text-xs focus:outline-none"
                      />
                      <button type="button" onClick={() => handleRegeneratePin(row.student_id)} className="text-amber-600">
                        <Dice5 size={11} />
                      </button>
                    </div>
                  </div>

                  {/* Subject Inputs Grid with Max validation */}
                  <div className="grid grid-cols-2 gap-2">
                    {classSubjects.map((sub, sIdx) => {
                      const rawVal = row.subject_marks?.[sub.name];
                      const val = (rawVal === undefined || rawVal === null) ? '' : rawVal;
                      const isFail = typeof rawVal === 'number' && rawVal < (sub.total_marks * 0.33);

                      return (
                        <div key={sIdx} className="bg-slate-50 p-2 rounded-2xl border border-slate-200 flex flex-col justify-between gap-1">
                          <div className="flex items-center justify-between text-[11px] font-bold text-slate-700">
                            <span className="truncate">{sub.name}</span>
                            <span className="text-[9px] text-slate-400 font-mono">/{sub.total_marks}</span>
                          </div>
                          <input
                            type="number"
                            min={0}
                            max={sub.total_marks}
                            value={val}
                            onChange={e => handleMarkCellChange(row.student_id, sub.name, e.target.value)}
                            placeholder="0"
                            className={`w-full text-center font-mono font-black py-1.5 px-2 rounded-xl border text-xs focus:outline-none focus:ring-2 ${
                              isFail
                                ? 'bg-red-50 text-red-700 border-red-300 focus:ring-red-500'
                                : val !== ''
                                ? 'bg-blue-50/90 text-blue-950 border-blue-300 font-bold focus:ring-blue-500'
                                : 'bg-white text-slate-700 border-slate-200 focus:ring-blue-500'
                            }`}
                          />
                        </div>
                      );
                    })}
                  </div>

                  {/* Card Summary & Actions */}
                  <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                    <div className="flex items-center gap-2 text-xs">
                      <span className="font-bold text-slate-500">
                        {row.obtained_marks}/{row.total_marks} ({row.percentage}%)
                      </span>
                      <span className={`px-2 py-0.5 rounded-md text-[10px] uppercase border ${getGradeBadge(row.grade)}`}>
                        {row.grade}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleSaveSingleRow(row.student_id)}
                        disabled={isRowSaving}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 transition-all ${
                          row.is_saved
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-blue-600 text-white shadow-sm'
                        }`}
                      >
                        {isRowSaving ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
                        Save
                      </button>
                      <button
                        type="button"
                        onClick={() => setPreviewStudent(row)}
                        className="p-1.5 bg-slate-100 text-slate-700 rounded-xl border border-slate-200"
                      >
                        <Eye size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* 5B. Spreadsheet Grid Table: Rows and Columns */}
      <div className={`bg-white border-2 border-slate-200 rounded-3xl overflow-hidden shadow-lg ${viewMode === 'cards' ? 'hidden md:block' : 'block'}`}>
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left text-xs border-collapse min-w-[700px]">
            <thead>
              <tr className="bg-slate-900 text-white font-black uppercase tracking-wider text-[11px]">
                <th className="py-4 px-3 text-center w-10 sticky left-0 bg-slate-900 z-20">#</th>
                <th className="py-4 px-3 min-w-[110px] sticky left-10 bg-slate-900 z-20">Roll No</th>
                <th className="py-4 px-4 min-w-[150px] sticky left-[150px] bg-slate-900 z-20">Student Name</th>
                <th className="py-4 px-3 text-center min-w-[100px]">PIN Code</th>
                
                {/* Dynamic Subject Column Headers */}
                {classSubjects.map((sub, i) => (
                  <th key={i} className="py-4 px-2 text-center min-w-[90px] bg-slate-800 border-x border-slate-700">
                    <div className="truncate font-black">{sub.name}</div>
                    <div className="text-[9px] text-blue-300 font-mono font-normal">Max: {sub.total_marks}</div>
                  </th>
                ))}

                <th className="py-4 px-2 text-center w-20 bg-slate-800/80">Total</th>
                <th className="py-4 px-2 text-center w-20 bg-blue-900">Obtained</th>
                <th className="py-4 px-2 text-center w-16 bg-slate-800/80">%</th>
                <th className="py-4 px-3 text-center min-w-[100px]">Grade</th>
                <th className="py-4 px-4 text-right min-w-[110px]">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-200">
              {loading ? (
                <tr>
                  <td colSpan={9 + classSubjects.length} className="py-16 text-center text-slate-400">
                    <Loader2 className="animate-spin text-blue-600 mx-auto mb-2" size={32} />
                    <p className="font-bold text-slate-600">Loading student roster and result marks...</p>
                  </td>
                </tr>
              ) : displayedRows.length === 0 ? (
                <tr>
                  <td colSpan={9 + classSubjects.length} className="py-16 text-center text-slate-400">
                    <Users className="mx-auto mb-2 text-slate-300" size={40} />
                    <p className="font-bold text-slate-700 text-sm">No students found for &quot;{selectedClassKey}&quot;</p>
                    <p className="text-xs text-slate-400 mt-1">Select another class or add students from the Students tab.</p>
                  </td>
                </tr>
              ) : (
                displayedRows.map((row, idx) => {
                  const isRowSaving = savingRowId === row.student_id;

                  return (
                    <tr 
                      key={row.student_id}
                      className={`hover:bg-blue-50/50 transition-colors ${row.is_saved ? 'bg-white' : 'bg-amber-50/20'}`}
                    >
                      {/* 1. Index */}
                      <td className="py-3 px-3 text-center font-mono font-bold text-slate-400 sticky left-0 bg-white group-hover:bg-blue-50/50 z-10">
                        {idx + 1}
                      </td>

                      {/* 2. Roll Number */}
                      <td className="py-3 px-3 font-mono font-black text-blue-950 text-xs sticky left-10 bg-white group-hover:bg-blue-50/50 z-10">
                        {row.roll_number || ''}
                      </td>

                      {/* 3. Student Name */}
                      <td className="py-3 px-4 font-bold text-slate-900 sticky left-[150px] bg-white group-hover:bg-blue-50/50 z-10">
                        <div className="truncate max-w-[140px] sm:max-w-none">{row.student_name || ''}</div>
                        {row.father_name && <div className="text-[10px] font-normal text-slate-400 truncate">S/O {row.father_name}</div>}
                      </td>

                      {/* 4. PIN Code */}
                      <td className="py-3 px-3 text-center">
                        <div className="inline-flex items-center gap-1 bg-amber-50 border border-amber-200 rounded-xl px-2 py-1">
                          <input
                            type="text"
                            maxLength={4}
                            value={row.pin ?? ''}
                            onChange={e => handleRowPinChange(row.student_id, e.target.value)}
                            placeholder="1234"
                            className="w-10 bg-transparent text-center font-mono font-black text-amber-950 text-xs focus:outline-none"
                          />
                          <button
                            type="button"
                            onClick={() => handleRegeneratePin(row.student_id)}
                            title="Regenerate Random PIN"
                            className="text-amber-600 hover:text-amber-800"
                          >
                            <Dice5 size={12} />
                          </button>
                        </div>
                      </td>

                      {/* 5. Dynamic Subject Marks Cells (Direct Entry with MAX Marks Enforcement) */}
                      {classSubjects.map((sub, sIdx) => {
                        const rawVal = row.subject_marks?.[sub.name];
                        const val = (rawVal === undefined || rawVal === null) ? '' : rawVal;
                        const isFail = typeof rawVal === 'number' && rawVal < (sub.total_marks * 0.33);

                        return (
                          <td key={sIdx} className="py-2 px-2 text-center border-x border-slate-100">
                            <input
                              type="number"
                              min={0}
                              max={sub.total_marks}
                              value={val}
                              onChange={e => handleMarkCellChange(row.student_id, sub.name, e.target.value)}
                              placeholder="-"
                              className={`w-16 text-center font-mono font-black py-1.5 px-1 rounded-xl border transition-all text-xs focus:outline-none focus:ring-2 ${
                                isFail 
                                  ? 'bg-red-50 text-red-700 border-red-300 focus:ring-red-500' 
                                  : val !== '' 
                                  ? 'bg-blue-50/80 text-blue-900 border-blue-200 focus:ring-blue-500 font-bold'
                                  : 'bg-slate-50 text-slate-700 border-slate-200 focus:ring-blue-500'
                              }`}
                            />
                          </td>
                        );
                      })}

                      {/* 6. Grand Total */}
                      <td className="py-3 px-2 text-center font-mono font-bold text-slate-500">
                        {row.total_marks || 0}
                      </td>

                      {/* 7. Obtained Marks */}
                      <td className="py-3 px-2 text-center font-mono font-black text-blue-900 text-sm bg-blue-50/40">
                        {row.obtained_marks || 0}
                      </td>

                      {/* 8. Percentage */}
                      <td className="py-3 px-2 text-center font-mono font-bold text-slate-800">
                        {row.percentage || 0}%
                      </td>

                      {/* 9. Grade */}
                      <td className="py-3 px-3 text-center">
                        <span className={`inline-block px-2.5 py-1 rounded-lg text-[10px] uppercase border ${getGradeBadge(row.grade)}`}>
                          {row.grade || 'PASS'}
                        </span>
                      </td>

                      {/* 10. Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Row Save Button */}
                          <button
                            type="button"
                            onClick={() => handleSaveSingleRow(row.student_id)}
                            disabled={isRowSaving}
                            title="Save this Student Marksheet"
                            className={`p-1.5 rounded-xl text-xs font-bold flex items-center gap-1 transition-all ${
                              row.is_saved
                                ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-600 hover:text-white border border-emerald-200'
                                : 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm animate-pulse'
                            }`}
                          >
                            {isRowSaving ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
                          </button>

                          {/* Print / View Certificate */}
                          <button
                            type="button"
                            onClick={() => setPreviewStudent(row)}
                            title="View Official Certificate"
                            className="p-1.5 bg-slate-100 hover:bg-slate-800 text-slate-700 hover:text-white rounded-xl transition-colors border border-slate-200"
                          >
                            <Eye size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 6. Marksheet Certificate Modal */}
      {previewStudent && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4">
          <div className="bg-white rounded-3xl max-w-3xl w-full p-4 sm:p-8 space-y-6 shadow-2xl border border-slate-200 max-h-[95vh] overflow-y-auto">
            
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <span className="text-xs font-bold uppercase text-slate-500">Official Mark Sheet Preview</span>
              <div className="flex items-center gap-2">
                <Button size="sm" variant="outline" onClick={() => window.print()} className="text-xs font-bold">
                  <Printer size={14} className="mr-1" /> Print Certificate
                </Button>
                <button onClick={() => setPreviewStudent(null)} className="text-slate-400 hover:text-slate-600 p-1">
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Printable Mark Sheet Frame */}
            <div className="p-4 sm:p-8 border-2 sm:border-4 border-slate-800 rounded-2xl sm:rounded-3xl space-y-4 sm:space-y-6 bg-white shadow-inner">
              <div className="text-center border-b-2 border-slate-800 pb-4">
                <div className="text-xl sm:text-2xl font-display font-black text-slate-900">THE FOUNDATION COLLEGIATE</div>
                <div className="text-[10px] sm:text-xs font-bold text-blue-600 uppercase tracking-widest">We Know and Deliver Quality Education</div>
                <div className="inline-block mt-2 sm:mt-3 px-3 sm:px-4 py-1 bg-blue-50 border border-blue-200 rounded-full font-black text-xs sm:text-sm text-blue-900 uppercase">
                  Official Examination Marksheet
                </div>
                <p className="text-[11px] sm:text-xs font-bold text-slate-500 uppercase mt-1">
                  {previewStudent.exam_name} &bull; {activeMonthName}
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 text-xs bg-slate-50 p-3 sm:p-4 rounded-xl border border-slate-200">
                <div>
                  <span className="text-slate-400 font-bold uppercase block text-[10px]">Student Name</span>
                  <span className="font-bold text-slate-900">{previewStudent.student_name}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-bold uppercase block text-[10px]">Father Name</span>
                  <span className="font-bold text-slate-800">{previewStudent.father_name || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-bold uppercase block text-[10px]">Roll Number</span>
                  <span className="font-mono font-bold text-blue-700">{previewStudent.roll_number}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-bold uppercase block text-[10px]">Security PIN</span>
                  <span className="font-mono font-bold text-amber-700">{previewStudent.pin}</span>
                </div>
              </div>

              {/* Subject Breakdown Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left border border-slate-200 rounded-xl overflow-hidden min-w-[320px]">
                  <thead className="bg-slate-800 text-white font-bold uppercase text-[10px] sm:text-xs">
                    <tr>
                      <th className="py-2.5 px-3">Subject Name</th>
                      <th className="py-2.5 px-3 text-center">Max Marks</th>
                      <th className="py-2.5 px-3 text-center">Marks Obtained</th>
                      <th className="py-2.5 px-3 text-center">Grade</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {classSubjects.map((sub, i) => {
                      const marksVal = previewStudent.subject_marks?.[sub.name];
                      const m = typeof marksVal === 'number' ? Math.min(sub.total_marks, Math.max(0, marksVal)) : 0;
                      const pct = (m / sub.total_marks) * 100;
                      const isPass = m >= (sub.total_marks * 0.33);

                      return (
                        <tr key={i}>
                          <td className="py-2 px-3 font-bold text-slate-800">{sub.name}</td>
                          <td className="py-2 px-3 text-center font-mono">{sub.total_marks}</td>
                          <td className="py-2 px-3 text-center font-mono font-bold text-blue-700">{m}</td>
                          <td className={`py-2 px-3 text-center font-bold ${isPass ? 'text-emerald-600' : 'text-red-600'}`}>
                            {pct >= 80 ? 'A-1' : pct >= 60 ? 'A' : pct >= 40 ? 'B' : 'F'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot className="bg-slate-50 font-bold border-t-2 border-slate-800 text-[11px] sm:text-xs">
                    <tr>
                      <td className="py-2.5 px-3 uppercase font-black">GRAND TOTAL</td>
                      <td className="py-2.5 px-3 text-center font-mono">{previewStudent.total_marks}</td>
                      <td className="py-2.5 px-3 text-center font-mono font-black text-blue-800">{previewStudent.obtained_marks}</td>
                      <td className="py-2.5 px-3 text-center font-black text-emerald-700">{previewStudent.percentage}% ({previewStudent.grade})</td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              <div className="pt-4 border-t border-slate-200 flex justify-between items-center text-xs">
                <div>
                  <div className="font-bold text-slate-800">DIRECTOR &amp; PRINCIPAL</div>
                  <div className="font-extrabold text-blue-600">Dr. Asif Iqbal, Ph.D.</div>
                </div>
                <div className="text-right">
                  <div className="font-serif italic font-bold text-slate-800 text-sm">Dr. Asif Iqbal</div>
                  <div className="text-[10px] text-slate-500 uppercase">Controller of Examinations</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
