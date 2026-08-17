'use client';
export const dynamic = 'force-dynamic';

import { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/lib/supabase/client';
import { 
  Search, Save, Download, Eye, Plus, Trash2, Key, CheckCircle2, 
  AlertCircle, ChevronRight, GraduationCap, BookOpen, Layers, 
  Calendar, Printer, Loader2, Sparkles, Filter, Check, Award,
  LayoutGrid, Table as TableIcon, RefreshCw, X, MessageSquare,
  TrendingUp, BarChart3, Trophy, Share2, HelpCircle
} from 'lucide-react';
import { toast } from 'sonner';
import { Result, Student, SubjectResult } from '@/lib/types';
import { OFFICIAL_CLASSES, matchStudentToClass } from '@/lib/utils/classes';
import { getStoredData, setStoredData } from '@/lib/utils/storage';

const isUUID = (str?: string | null): boolean => {
  if (!str) return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(str);
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
  subject_marks: Record<string, number | '' | 'A'>;
  total_marks: number;
  obtained_marks: number;
  percentage: number;
  grade: string;
  position: string;
  remarks: string;
  is_saved: boolean;
}

const EXAM_TYPES = [
  'Monthly Assessment Test',
  'First Term Examination',
  'Midterm Examination',
  'Pre-Board Mock Examination',
  'Final Annual Examination',
  'Weekly Class Quiz'
];

export default function AdminResultsPage() {
  const [results, setResults] = useState<Result[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [pinMap, setPinMap] = useState<Record<string, string>>({});
  
  // Selection State - defaults to Class IX - Computer Science
  const [selectedClassKey, setSelectedClassKey] = useState<string>(OFFICIAL_CLASSES[0].key);
  const [selectedExamType, setSelectedExamType] = useState<string>('Monthly Assessment Test');
  const [selectedMonth, setSelectedMonth] = useState<string>('August 2026');
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
  const [showTabulationPrint, setShowTabulationPrint] = useState(false);

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
      try {
        const { data: pinData } = await supabase.from('pins').select('roll_number, pin_hash');
        const pMap: Record<string, string> = {};
        if (pinData && pinData.length > 0) {
          pinData.forEach((p: any) => {
            if (p.roll_number && p.pin_hash) {
              pMap[p.roll_number.toUpperCase()] = p.pin_hash;
            }
          });
          setPinMap(pMap);
        } else {
          const storedPins = localStorage.getItem('tfc_admin_pins');
          if (storedPins) setPinMap(JSON.parse(storedPins));
        }
      } catch {
        const storedPins = localStorage.getItem('tfc_admin_pins');
        if (storedPins) setPinMap(JSON.parse(storedPins));
      }

    } catch (err) {
      console.warn('Fallback loading applied:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // 2. Load / Configure Default Subjects whenever Class changes
  useEffect(() => {
    const classDef = OFFICIAL_CLASSES.find(c => c.key === selectedClassKey);
    const savedCustom = localStorage.getItem(`tfc_class_subjects_${selectedClassKey}`);
    
    if (savedCustom) {
      try {
        setClassSubjects(JSON.parse(savedCustom));
        return;
      } catch {}
    }

    if (classDef && classDef.defaultSubjects) {
      setClassSubjects(classDef.defaultSubjects);
    } else {
      setClassSubjects([
        { name: 'English', total_marks: 100 },
        { name: 'Urdu', total_marks: 100 },
        { name: 'Mathematics', total_marks: 100 },
        { name: 'Science / Computer', total_marks: 100 }
      ]);
    }
  }, [selectedClassKey]);

  // 3. Filter Students Enrolled in the Active Class
  const classStudents = useMemo(() => {
    return students.filter(s => {
      const st = String(s.status || '').toLowerCase().trim();
      const isNotInactive = st !== 'inactive' && st !== 'graduated' && st !== 'alumni';
      const isActiveFlag = s.is_active !== false;
      return isNotInactive && isActiveFlag && matchStudentToClass(s.class_name, selectedClassKey);
    });
  }, [students, selectedClassKey]);

  // Helper for metrics
  const calculateMetrics = (subjectMarks: Record<string, number | '' | 'A'>, subjects: { name: string; total_marks: number }[]) => {
    let obtainedSum = 0;
    let totalSum = 0;
    let hasFailed = false;
    let hasAbsent = false;
    let allAbsent = true;

    subjects.forEach(sub => {
      const max = sub.total_marks || 100;
      totalSum += max;

      const rawVal = subjectMarks[sub.name];
      if (rawVal === 'A' || (rawVal as any) === 'AB') {
        hasAbsent = true;
        hasFailed = true;
      } else {
        allAbsent = false;
        const marks = typeof rawVal === 'number' ? Math.min(max, Math.max(0, rawVal)) : 0;
        obtainedSum += marks;

        if (typeof rawVal === 'number' && marks < (max * 0.33)) {
          hasFailed = true;
        }
      }
    });

    const t = totalSum > 0 ? totalSum : 100;
    const pct = Number(((obtainedSum / t) * 100).toFixed(1));

    let grade = 'PASS';
    if (allAbsent && subjects.length > 0) grade = 'ABSENT';
    else if (hasAbsent) grade = 'FAIL (AB)';
    else if (hasFailed || pct < 40) grade = 'F';
    else if (pct >= 85) grade = 'DISTINCTION';
    else if (pct >= 80) grade = 'A-1';
    else if (pct >= 60) grade = 'A';
    else if (pct >= 50) grade = 'B';
    else grade = 'PASS';

    return { total_marks: totalSum, obtained_marks: obtainedSum, percentage: pct, grade, hasAbsent, allAbsent };
  };

  // 4. Synchronize Mark Rows for all students in class
  useEffect(() => {
    if (loading) return;

    const newRows: Record<string, StudentMarkRow> = {};

    classStudents.forEach(student => {
      const existingResult = results.find(
        r => r.roll_number?.trim().toUpperCase() === student.roll_number?.trim().toUpperCase() &&
             (r.month || 'August 2026') === activeMonthName
      );

      const subjectMarks: Record<string, number | ''> = {};
      classSubjects.forEach(sub => {
        if (existingResult && Array.isArray(existingResult.subjects)) {
          const matchedSub = existingResult.subjects.find(
            (s: any) => (s.name || s.subject_name)?.toLowerCase().trim() === sub.name.toLowerCase().trim()
          );
          if (matchedSub && typeof matchedSub.marks === 'number') {
            subjectMarks[sub.name] = matchedSub.marks;
          } else {
            subjectMarks[sub.name] = '';
          }
        } else {
          subjectMarks[sub.name] = '';
        }
      });

      const metrics = calculateMetrics(subjectMarks, classSubjects);
      const assignedPin = pinMap[student.roll_number?.toUpperCase()] || generateRandomPin();

      newRows[student.id] = {
        student_id: student.id,
        roll_number: student.roll_number || '',
        student_name: student.name || '',
        father_name: student.father_name || '',
        class_name: student.class_name || selectedClassKey,
        pin: assignedPin,
        result_id: existingResult?.id,
        exam_name: existingResult?.exam_name || selectedExamType,
        month: activeMonthName,
        subject_marks: subjectMarks,
        total_marks: existingResult?.total_marks || metrics.total_marks,
        obtained_marks: existingResult?.obtained_marks || metrics.obtained_marks,
        percentage: existingResult?.percentage !== undefined ? existingResult.percentage : metrics.percentage,
        grade: existingResult?.grade || metrics.grade,
        position: existingResult?.position || '',
        remarks: existingResult?.remarks || (metrics.percentage >= 80 ? 'Outstanding academic excellence!' : metrics.percentage >= 60 ? 'Good overall performance.' : 'Needs focused attention in weak areas.'),
        is_saved: !!existingResult
      };
    });

    setMarkRows(newRows);
  }, [classStudents, classSubjects, activeMonthName, selectedClassKey, selectedExamType, results, loading]);

  // Handle Mark Input (Supports numeric score, 'A', or 'AB')
  const handleMarkChange = (studentId: string, subjectName: string, maxMarks: number, valueStr: string) => {
    let numVal: number | '' | 'A' = '';
    const clean = valueStr.trim().toUpperCase();
    if (clean === 'A' || clean === 'AB' || clean === 'ABSENT') {
      numVal = 'A';
    } else if (clean !== '') {
      const parsed = parseInt(clean, 10);
      if (!isNaN(parsed)) {
        numVal = Math.min(maxMarks, Math.max(0, parsed));
      }
    }

    setMarkRows(prev => {
      const currentRow = prev[studentId];
      if (!currentRow) return prev;

      const newSubjectMarks = { ...currentRow.subject_marks, [subjectName]: numVal };
      const metrics = calculateMetrics(newSubjectMarks, classSubjects);

      return {
        ...prev,
        [studentId]: {
          ...currentRow,
          subject_marks: newSubjectMarks,
          total_marks: metrics.total_marks,
          obtained_marks: metrics.obtained_marks,
          percentage: metrics.percentage,
          grade: metrics.grade,
          is_saved: false
        }
      };
    });
  };

  // Toggle single subject absent status
  const handleToggleSubjectAbsent = (studentId: string, subjectName: string) => {
    const current = markRows[studentId]?.subject_marks?.[subjectName];
    const newVal = current === 'A' ? '' : 'A';
    handleMarkChange(studentId, subjectName, 100, newVal);
  };

  // Mark/Unmark all subjects absent for this student
  const handleToggleAllAbsent = (studentId: string) => {
    const currentRow = markRows[studentId];
    if (!currentRow) return;

    const isCurrentlyAllAbsent = classSubjects.every(s => currentRow.subject_marks?.[s.name] === 'A');
    const newSubjectMarks: Record<string, number | '' | 'A'> = {};
    classSubjects.forEach(s => {
      newSubjectMarks[s.name] = isCurrentlyAllAbsent ? '' : 'A';
    });

    const metrics = calculateMetrics(newSubjectMarks, classSubjects);
    setMarkRows(prev => ({
      ...prev,
      [studentId]: {
        ...currentRow,
        subject_marks: newSubjectMarks,
        total_marks: metrics.total_marks,
        obtained_marks: metrics.obtained_marks,
        percentage: metrics.percentage,
        grade: metrics.grade,
        remarks: isCurrentlyAllAbsent ? '' : 'Absent in examination',
        is_saved: false
      }
    }));
    toast.info(isCurrentlyAllAbsent ? 'Cleared absent status' : 'Marked all exam papers Absent (AB)');
  };

  // Add Custom Subject Column
  const handleAddSubjectColumn = () => {
    if (!newSubName.trim()) {
      return toast.error('Subject name is required');
    }
    const cleanName = newSubName.trim();
    if (classSubjects.some(s => s.name.toLowerCase() === cleanName.toLowerCase())) {
      return toast.error(`Subject "${cleanName}" is already in this marksheet!`);
    }

    const updated = [...classSubjects, { name: cleanName, total_marks: Number(newSubTotal) || 100 }];
    setClassSubjects(updated);
    localStorage.setItem(`tfc_class_subjects_${selectedClassKey}`, JSON.stringify(updated));

    setNewSubName('');
    setNewSubTotal(100);
    setShowAddSubjectBar(false);
    toast.success(`Added subject "${cleanName}" (${newSubTotal} Marks) to class.`);
  };

  // Remove Subject Column
  const handleRemoveSubjectColumn = (subNameToRemove: string) => {
    if (classSubjects.length <= 1) {
      return toast.error('Class marksheet must have at least one subject.');
    }
    const updated = classSubjects.filter(s => s.name !== subNameToRemove);
    setClassSubjects(updated);
    localStorage.setItem(`tfc_class_subjects_${selectedClassKey}`, JSON.stringify(updated));
    toast.info(`Removed subject "${subNameToRemove}".`);
  };

  // Auto PINs for all
  const handleAutoGenerateAllPins = () => {
    const updatedRows: Record<string, StudentMarkRow> = {};
    const newPins: Record<string, string> = { ...pinMap };

    Object.keys(markRows).forEach(stId => {
      const current = markRows[stId];
      const roll = current.roll_number?.toUpperCase();
      let assignedPin = current.pin;
      if (!assignedPin || assignedPin === '1234' || assignedPin.length < 4) {
        assignedPin = generateRandomPin();
        if (roll) newPins[roll] = assignedPin;
      }

      updatedRows[stId] = {
        ...current,
        pin: assignedPin,
        is_saved: false
      };
    });

    setMarkRows(updatedRows);
    setPinMap(newPins);
    localStorage.setItem('tfc_admin_pins', JSON.stringify(newPins));
    toast.success('Generated 4-Digit Security PINs for all students in this class.');
  };

  // Auto-Calculate Class Positions (1st, 2nd, 3rd, etc.)
  const handleAutoCalculatePositions = () => {
    const list = Object.values(markRows);
    if (list.length === 0) return toast.error('No students enrolled in this class roster.');

    const sorted = [...list].sort((a, b) => (b.percentage || 0) - (a.percentage || 0));
    const updated: Record<string, StudentMarkRow> = { ...markRows };
    let currentRank = 1;

    sorted.forEach((row) => {
      let suffix = 'th';
      if (currentRank === 1) suffix = 'st';
      else if (currentRank === 2) suffix = 'nd';
      else if (currentRank === 3) suffix = 'rd';

      const posStr = row.obtained_marks > 0 ? `${currentRank}${suffix}` : '-';
      const stId = Object.keys(markRows).find(id => markRows[id].roll_number === row.roll_number);
      if (stId && updated[stId]) {
        updated[stId] = {
          ...updated[stId],
          position: posStr,
          is_saved: false
        };
      }
      currentRank++;
    });

    setMarkRows(updated);
    toast.success('✨ Calculated class positions (1st, 2nd, 3rd) for all students!');
  };

  // Quick Auto-Fill Passing Marks Helper
  const handleAutoFillPassing = () => {
    const updated: Record<string, StudentMarkRow> = {};
    Object.keys(markRows).forEach(stId => {
      const row = markRows[stId];
      const newSubjectMarks: Record<string, number | '' | 'A'> = {};
      classSubjects.forEach(sub => {
        const passMark = Math.round(sub.total_marks * 0.65);
        newSubjectMarks[sub.name] = typeof row.subject_marks[sub.name] === 'number' ? row.subject_marks[sub.name] : passMark;
      });
      const metrics = calculateMetrics(newSubjectMarks, classSubjects);
      updated[stId] = {
        ...row,
        subject_marks: newSubjectMarks,
        total_marks: metrics.total_marks,
        obtained_marks: metrics.obtained_marks,
        percentage: metrics.percentage,
        grade: metrics.grade,
        is_saved: false
      };
    });
    setMarkRows(updated);
    toast.info('Auto-filled passing marks baseline across unpopulated subjects.');
  };

  // WhatsApp Parent Notification
  const handleSendWhatsAppNotification = (row: StudentMarkRow) => {
    const msg = `*THE FOUNDATION COLLEGIATE*
*Official Examination Result Notification*

👤 *Student Name:* ${row.student_name}
🆔 *Roll Number:* ${row.roll_number}
📚 *Class / Group:* ${row.class_name}
📋 *Exam:* ${row.exam_name} (${activeMonthName})

📊 *Marks Obtained:* ${row.obtained_marks} / ${row.total_marks}
📈 *Percentage:* ${row.percentage}%
🏅 *Grade:* ${row.grade} ${row.position ? `| Position: ${row.position}` : ''}
🔑 *Online Portal Security PIN:* ${row.pin}

💬 *Remarks:* ${row.remarks || 'Keep up the consistent effort!'}

_Check complete detailed transcripts online at https://foundationcollegiate.edu.pk/results_`;

    const encoded = encodeURIComponent(msg);
    window.open(`https://wa.me/?text=${encoded}`, '_blank');
  };

  // Save Single Row
  const handleSaveSingleRow = async (studentId: string) => {
    const row = markRows[studentId];
    if (!row) return;

    try {
      setSavingRowId(studentId);
      const rollUpper = (row.roll_number || '').trim().toUpperCase();

      const structuredSubjects: SubjectResult[] = classSubjects.map(sub => {
        const rawVal = row.subject_marks?.[sub.name];
        const isAbsent = rawVal === 'A' || (rawVal as any) === 'AB';
        const m = typeof rawVal === 'number' ? rawVal : 0;
        const pct = (m / sub.total_marks) * 100;
        let g = 'PASS';
        if (isAbsent) g = 'ABSENT';
        else if (m < sub.total_marks * 0.33) g = 'F';
        else if (pct >= 80) g = 'A-1';
        else if (pct >= 60) g = 'A';
        else if (pct >= 50) g = 'B';

        return {
          name: sub.name,
          total_marks: sub.total_marks,
          marks: m,
          grade: g,
          is_absent: isAbsent
        };
      });

      const resultPayload: Result = {
        id: row.result_id && isUUID(row.result_id) ? row.result_id : crypto.randomUUID(),
        student_id: row.student_id,
        roll_number: rollUpper,
        student_name: (row.student_name || '').trim(),
        father_name: (row.father_name || '').trim(),
        class_name: (row.class_name || '').trim(),
        exam_name: (row.exam_name || '').trim() || selectedExamType,
        month: activeMonthName,
        total_marks: row.total_marks,
        obtained_marks: row.obtained_marks,
        percentage: row.percentage,
        grade: row.grade,
        position: (row.position || '').trim() || null,
        remarks: (row.remarks || '').trim() || null,
        subjects: structuredSubjects,
        is_active: true,
        created_at: new Date().toISOString()
      };

      // 1. Supabase Upsert
      try {
        await supabase.from('results').upsert(resultPayload);
        if (rollUpper && row.pin) {
          await supabase.from('pins').upsert({
            roll_number: rollUpper,
            pin_hash: row.pin.trim(),
            is_active: true
          }, { onConflict: 'roll_number' });
        }
      } catch (e) {
        console.warn('DB upsert fallback notice:', e);
      }

      // 2. Local Storage Sync
      const remainingResults = results.filter(r => !(r.roll_number?.toUpperCase() === rollUpper && (r.month || 'August 2026') === activeMonthName));
      const updatedTotalResults = [resultPayload, ...remainingResults];
      setResults(updatedTotalResults);
      setStoredData('results', updatedTotalResults);

      const newPinMap = { ...pinMap, [rollUpper]: row.pin.trim() };
      setPinMap(newPinMap);
      localStorage.setItem('tfc_admin_pins', JSON.stringify(newPinMap));

      setMarkRows(prev => ({
        ...prev,
        [studentId]: {
          ...prev[studentId],
          result_id: resultPayload.id,
          is_saved: true
        }
      }));

      toast.success(`Saved marks & PIN for ${row.student_name} (${row.roll_number})`);
    } catch (err: any) {
      toast.error(`Save error: ${err.message}`);
    } finally {
      setSavingRowId(null);
    }
  };

  // Save All Class Results
  const handleSaveAllClassResults = async () => {
    const rowList = Object.values(markRows);
    if (rowList.length === 0) return toast.error('No students to save.');

    try {
      setSavingAll(true);

      const resultsToUpsert: Result[] = rowList.map(row => {
        const rollUpper = (row.roll_number || '').trim().toUpperCase();
        const structuredSubjects: SubjectResult[] = classSubjects.map(sub => {
          const rawVal = row.subject_marks?.[sub.name];
          const isAbsent = rawVal === 'A' || (rawVal as any) === 'AB';
          const m = typeof rawVal === 'number' ? rawVal : 0;
          const pct = (m / sub.total_marks) * 100;
          let g = 'PASS';
          if (isAbsent) g = 'ABSENT';
          else if (m < sub.total_marks * 0.33) g = 'F';
          else if (pct >= 80) g = 'A-1';
          else if (pct >= 60) g = 'A';
          else if (pct >= 50) g = 'B';

          return {
            name: sub.name,
            total_marks: sub.total_marks,
            marks: m,
            grade: g,
            is_absent: isAbsent
          };
        });

        return {
          id: row.result_id && isUUID(row.result_id) ? row.result_id : crypto.randomUUID(),
          student_id: row.student_id,
          roll_number: rollUpper,
          student_name: (row.student_name || '').trim(),
          father_name: (row.father_name || '').trim(),
          class_name: (row.class_name || '').trim(),
          exam_name: (row.exam_name || '').trim() || selectedExamType,
          month: activeMonthName,
          total_marks: row.total_marks,
          obtained_marks: row.obtained_marks,
          percentage: row.percentage,
          grade: row.grade,
          position: (row.position || '').trim() || null,
          remarks: (row.remarks || '').trim() || null,
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
      const remainingResults = results.filter(r => !(activeRolls.has(r.roll_number.toUpperCase()) && (r.month || 'August 2026') === activeMonthName));
      const updatedTotalResults = [...resultsToUpsert, ...remainingResults];
      
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
    const passCount = list.filter(r => r.obtained_marks > 0 && r.grade !== 'F').length;
    const passRate = enteredCount > 0 ? ((passCount / enteredCount) * 100).toFixed(0) : '100';
    const totalPct = list.reduce((sum, r) => sum + (r.percentage || 0), 0);
    const avgPct = totalCount > 0 ? (totalPct / totalCount).toFixed(1) : '0';
    const topScorer = list.reduce((prev, curr) => (curr.obtained_marks > (prev?.obtained_marks || 0) ? curr : prev), list[0]);

    return { 
      totalCount, 
      enteredCount, 
      passRate,
      avgPct, 
      topScorerName: topScorer?.obtained_marks > 0 ? `${topScorer.student_name} (${topScorer.percentage}%)` : 'Pending Entry' 
    };
  }, [markRows]);

  const handleExportCSV = () => {
    const list = Object.values(markRows);
    if (list.length === 0) return toast.error('No students to export.');
    
    const subjectHeaders = classSubjects.map(s => `"${s.name} (${s.total_marks})"`);
    const headers = ['Serial', 'Roll Number', 'Student Name', 'Father Name', 'Class', 'Security PIN', ...subjectHeaders, 'Grand Total', 'Obtained Marks', 'Percentage', 'Grade', 'Position'];
    
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
        `"${r.grade || ''}"`,
        `"${r.position || ''}"`
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

  const getGradeBadge = (grade: string) => {
    switch (grade) {
      case 'DISTINCTION':
      case 'A-1': return 'bg-emerald-50 text-emerald-700 border-emerald-300 font-black';
      case 'A': return 'bg-blue-50 text-blue-700 border-blue-300 font-bold';
      case 'B': return 'bg-cyan-50 text-cyan-700 border-cyan-300 font-bold';
      case 'PASS': return 'bg-slate-100 text-slate-700 border-slate-300 font-semibold';
      case 'F': return 'bg-rose-50 text-rose-700 border-rose-300 font-black';
      default: return 'bg-slate-100 text-slate-700 border-slate-300';
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto font-sans px-2 sm:px-4 lg:px-6">
      
      {/* 1. Header & Quick Controls */}
      <div className="bg-white p-4 sm:p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 shadow-xs">
              <GraduationCap size={22} />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-display font-black text-slate-800">
                Examination &amp; Results Management
              </h1>
              <p className="text-slate-500 text-xs sm:text-sm mt-0.5">
                Digital Marksheets &bull; Auto Positions &bull; Parent WhatsApp Alerts &bull; Official Tabulations
              </p>
            </div>
          </div>
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

          <button
            onClick={() => setShowTabulationPrint(true)}
            className="px-3 py-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Printer size={14} /> Print Tabulation
          </button>

          <button
            onClick={handleExportCSV}
            className="px-3 py-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Download size={14} /> Export CSV
          </button>

          <button
            onClick={handleAutoCalculatePositions}
            className="px-3 py-2 rounded-xl border border-indigo-200 bg-indigo-50 text-indigo-800 hover:bg-indigo-100 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Trophy size={14} className="text-indigo-600" /> Rank Positions
          </button>

          <button
            onClick={handleAutoGenerateAllPins}
            className="px-3 py-2 rounded-xl border border-amber-200 bg-amber-50 text-amber-900 hover:bg-amber-100 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Key size={14} className="text-amber-600" /> Auto PINs
          </button>

          <button
            onClick={handleSaveAllClassResults}
            disabled={savingAll}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-600/20 flex items-center justify-center gap-1.5 min-w-[140px] transition-all active:scale-95 cursor-pointer"
          >
            {savingAll ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
            Save All Marks
          </button>
        </div>
      </div>

      {/* 2. Step 1 (Class), Step 2 (Exam Term), Step 3 (Month) */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 bg-white p-4 sm:p-5 rounded-3xl border border-slate-200 shadow-sm">
        
        {/* Class Selection Dropdown */}
        <div className="md:col-span-5 space-y-1.5">
          <label className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
            <BookOpen size={14} className="text-blue-600 shrink-0" /> 1. Academic Class / Program *
          </label>
          
          <select
            value={selectedClassKey}
            onChange={e => setSelectedClassKey(e.target.value)}
            className="w-full bg-slate-50 border-2 border-blue-500 text-slate-900 font-bold text-xs sm:text-sm rounded-2xl py-3 px-3 sm:px-4 focus:ring-2 focus:ring-blue-600 focus:outline-none transition-all shadow-inner cursor-pointer"
          >
            <optgroup label="🌱 Junior Section (Classes I to VIII)">
              {OFFICIAL_CLASSES.filter(c => c.category === 'Junior Section (I to VIII)').map(cls => {
                const count = students.filter(s => matchStudentToClass(s.class_name, cls.key)).length;
                return (
                  <option key={cls.key} value={cls.key}>
                    {cls.name} {count > 0 ? `(${count} Enrolled)` : ''}
                  </option>
                );
              })}
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

            <optgroup label="💻 Professional Diplomas & Others">
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

        {/* Examination Type Selection */}
        <div className="md:col-span-4 space-y-1.5">
          <label className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
            <Award size={14} className="text-indigo-600 shrink-0" /> 2. Examination Session *
          </label>
          <select
            value={selectedExamType}
            onChange={e => setSelectedExamType(e.target.value)}
            className="w-full bg-slate-50 border border-slate-300 text-slate-800 font-semibold text-xs sm:text-sm rounded-2xl py-3 px-3 sm:px-4 focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all cursor-pointer"
          >
            {EXAM_TYPES.map(exam => (
              <option key={exam} value={exam}>{exam}</option>
            ))}
          </select>
        </div>

        {/* Month Selection */}
        <div className="md:col-span-3 space-y-1.5">
          <label className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
            <Calendar size={14} className="text-amber-600 shrink-0" /> 3. Month &amp; Year *
          </label>
          <div className="flex gap-2">
            <select
              value={selectedMonth}
              onChange={e => { setSelectedMonth(e.target.value); setCustomMonthInput(''); }}
              className="w-full bg-slate-50 border border-slate-300 text-slate-800 font-semibold text-xs sm:text-sm rounded-2xl py-3 px-3 sm:px-4 focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all cursor-pointer"
            >
              <option value="August 2026">August 2026</option>
              <option value="September 2026">September 2026</option>
              <option value="October 2026">October 2026</option>
              <option value="November 2026">November 2026</option>
              <option value="December 2026">December 2026</option>
              <option value="January 2026">January 2026</option>
              <option value="February 2026">February 2026</option>
              <option value="March 2026">March 2026</option>
              <option value="April 2026">April 2026</option>
              <option value="May 2026">May 2026</option>
              <option value="June 2026">June 2026</option>
              <option value="July 2026">July 2026</option>
            </select>
          </div>
        </div>

      </div>

      {/* 3. Class Performance Analytics Summary Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Class Roster</span>
            <GraduationCap size={16} className="text-blue-500" />
          </div>
          <div className="text-2xl font-black text-slate-800 mt-1">{statsSummary.totalCount} Students</div>
          <span className="text-[11px] font-semibold text-emerald-600 block mt-0.5">
            {statsSummary.enteredCount} Graded ({statsSummary.totalCount - statsSummary.enteredCount} Pending)
          </span>
        </div>

        <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Class Average</span>
            <TrendingUp size={16} className="text-indigo-500" />
          </div>
          <div className="text-2xl font-black text-indigo-700 mt-1">{statsSummary.avgPct}%</div>
          <span className="text-[11px] font-semibold text-slate-500 block mt-0.5">Overall Marks Ratio</span>
        </div>

        <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Passing Rate</span>
            <BarChart3 size={16} className="text-emerald-500" />
          </div>
          <div className="text-2xl font-black text-emerald-700 mt-1">{statsSummary.passRate}%</div>
          <span className="text-[11px] font-semibold text-emerald-600 block mt-0.5">Met Passing Threshold</span>
        </div>

        <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">1st Position</span>
            <Trophy size={16} className="text-amber-500" />
          </div>
          <div className="text-sm font-black text-slate-800 mt-2 truncate" title={statsSummary.topScorerName}>
            {statsSummary.topScorerName}
          </div>
          <span className="text-[11px] font-semibold text-amber-600 block mt-0.5">Highest Class Score</span>
        </div>
      </div>

      {/* 4. Subject Columns Configuration Bar */}
      <div className="bg-gradient-to-r from-blue-900 to-indigo-950 text-white p-4 sm:p-5 rounded-3xl shadow-md space-y-3">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Layers size={18} className="text-blue-400 shrink-0" />
            <h3 className="font-bold text-sm sm:text-base">
              Configured Subject Columns for {selectedClassKey}
            </h3>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={handleAutoFillPassing}
              className="text-xs font-bold bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 rounded-xl transition-colors cursor-pointer"
            >
              Fill Passing Baseline
            </button>
            <button
              onClick={() => setShowAddSubjectBar(prev => !prev)}
              className="text-xs font-bold bg-blue-500 hover:bg-blue-600 text-white px-3 py-1.5 rounded-xl transition-colors flex items-center gap-1 cursor-pointer"
            >
              <Plus size={14} /> Add Subject Column
            </button>
          </div>
        </div>

        {/* Current Active Subjects Badges */}
        <div className="flex flex-wrap gap-2 pt-1">
          {classSubjects.map((sub) => (
            <div
              key={sub.name}
              className="bg-white/10 border border-white/20 text-white px-3 py-1.5 rounded-2xl flex items-center gap-2 text-xs font-bold shadow-2xs backdrop-blur-xs"
            >
              <span>{sub.name}</span>
              <span className="bg-blue-600/80 px-2 py-0.5 rounded-full text-[10px] text-blue-100 font-mono">
                {sub.total_marks} Marks
              </span>
              <button
                onClick={() => handleRemoveSubjectColumn(sub.name)}
                title={`Remove ${sub.name}`}
                className="text-white/60 hover:text-rose-400 p-0.5 rounded-full transition-colors cursor-pointer"
              >
                <Trash2 size={12} />
              </button>
            </div>
          ))}
        </div>

        {/* Add Subject Drawer */}
        {showAddSubjectBar && (
          <div className="bg-white/10 p-3 rounded-2xl border border-white/20 flex flex-wrap items-center gap-3 mt-3 animate-in fade-in">
            <div className="flex-1 min-w-[200px]">
              <input
                type="text"
                placeholder="e.g. Computer Practical or General Science"
                value={newSubName}
                onChange={e => setNewSubName(e.target.value)}
                className="w-full bg-white text-slate-900 px-3.5 py-2 rounded-xl text-xs font-bold placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>
            <div className="w-32">
              <input
                type="number"
                placeholder="Total Marks"
                value={newSubTotal}
                onChange={e => setNewSubTotal(Number(e.target.value))}
                className="w-full bg-white text-slate-900 px-3.5 py-2 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-blue-400 text-center"
              />
            </div>
            <button
              onClick={handleAddSubjectColumn}
              className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs px-4 py-2 rounded-xl transition-colors cursor-pointer"
            >
              Confirm Subject
            </button>
          </div>
        )}
      </div>

      {/* 5. Marksheet Spreadsheet Table */}
      <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
        
        {/* Search inside class */}
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search student or roll number..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 text-slate-800 placeholder:text-slate-400 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none font-medium"
            />
          </div>

          <span className="text-xs text-slate-500 font-semibold">
            Showing {displayedRows.length} active students in roster
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse min-w-[850px]">
            <thead>
              <tr className="bg-slate-900 text-white text-[11px] uppercase tracking-wider font-bold">
                <th className="py-3.5 px-3 text-center w-12">#</th>
                <th className="py-3.5 px-3 min-w-[100px]">Roll No</th>
                <th className="py-3.5 px-4 min-w-[180px]">Student Details</th>
                <th className="py-3.5 px-3 min-w-[85px] text-center">PIN</th>

                {/* Dynamic Subject Columns */}
                {classSubjects.map((sub) => (
                  <th key={sub.name} className="py-3.5 px-2 text-center min-w-[95px] bg-slate-800 border-l border-slate-700">
                    <div className="font-bold text-slate-100">{sub.name}</div>
                    <div className="text-[10px] text-blue-300 font-normal font-mono">Max: {sub.total_marks}</div>
                  </th>
                ))}

                <th className="py-3.5 px-2 text-center w-16 bg-slate-950 border-l border-slate-700">Total</th>
                <th className="py-3.5 px-2 text-center w-16 bg-slate-950">Obt.</th>
                <th className="py-3.5 px-2 text-center w-16 bg-slate-950">%</th>
                <th className="py-3.5 px-2 text-center w-16 bg-slate-950">Pos</th>
                <th className="py-3.5 px-3 text-center w-20 bg-slate-950">Grade</th>
                <th className="py-3.5 px-4 text-right min-w-[130px]">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {displayedRows.length === 0 ? (
                <tr>
                  <td colSpan={classSubjects.length + 8} className="text-center py-16 text-slate-400">
                    <GraduationCap size={36} className="mx-auto mb-2 opacity-40 text-slate-400" />
                    <p className="font-bold text-sm text-slate-600">No active students found in {selectedClassKey}</p>
                    <p className="text-xs text-slate-400 mt-1">Register students or select a different academic class above.</p>
                  </td>
                </tr>
              ) : (
                displayedRows.map((row, idx) => {
                  const isRowSaving = savingRowId === row.student_id;

                  return (
                    <tr 
                      key={row.student_id} 
                      className={`hover:bg-blue-50/40 transition-colors ${!row.is_saved ? 'bg-amber-50/20' : ''}`}
                    >
                      {/* 1. Serial */}
                      <td className="py-3 px-3 text-center text-slate-400 font-mono font-bold">
                        {idx + 1}
                      </td>

                      {/* 2. Roll Number */}
                      <td className="py-3 px-3 font-mono font-bold text-blue-900">
                        <span className="bg-slate-100 px-2 py-1 rounded-lg border border-slate-200">
                          {row.roll_number}
                        </span>
                      </td>

                      {/* 3. Student Details */}
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">{row.student_name}</div>
                        <div className="text-[11px] text-slate-400">Father: {row.father_name || 'N/A'}</div>
                      </td>

                      {/* 4. PIN input */}
                      <td className="py-3 px-3 text-center">
                        <input
                          type="text"
                          maxLength={6}
                          value={row.pin || ''}
                          onChange={e => {
                            const val = e.target.value.trim();
                            setMarkRows(prev => ({
                              ...prev,
                              [row.student_id]: { ...prev[row.student_id], pin: val, is_saved: false }
                            }));
                          }}
                          className="w-16 text-center font-mono font-bold text-xs bg-slate-50 border border-slate-200 rounded-lg py-1 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        />
                      </td>

                      {/* 5. Dynamic Subject Marks Inputs with Absent (AB) Option */}
                      {classSubjects.map((sub) => {
                        const curVal = row.subject_marks?.[sub.name] ?? '';
                        const isAbsent = curVal === 'A' || (curVal as any) === 'AB';
                        const numVal = typeof curVal === 'number' ? curVal : 0;
                        const isFailing = isAbsent || (typeof curVal === 'number' && numVal < (sub.total_marks * 0.33));

                        return (
                          <td key={sub.name} className="py-2.5 px-2 text-center border-l border-slate-100">
                            <div className="flex flex-col items-center gap-1">
                              <input
                                type="text"
                                value={isAbsent ? 'AB' : curVal}
                                placeholder="0"
                                onChange={e => handleMarkChange(row.student_id, sub.name, sub.total_marks, e.target.value)}
                                className={`w-16 text-center font-mono font-bold text-xs rounded-xl py-1.5 px-1 border transition-all focus:outline-none focus:ring-2 ${
                                  isAbsent
                                    ? 'bg-rose-100 border-rose-300 text-rose-800 font-black focus:ring-rose-500'
                                    : isFailing
                                    ? 'bg-amber-50 border-amber-300 text-amber-800 focus:ring-amber-500'
                                    : 'bg-white border-slate-200 text-slate-800 focus:ring-blue-500'
                                }`}
                              />
                              <button
                                type="button"
                                onClick={() => handleToggleSubjectAbsent(row.student_id, sub.name)}
                                className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase transition-all cursor-pointer ${
                                  isAbsent
                                    ? 'bg-rose-600 text-white shadow-2xs'
                                    : 'bg-slate-100 hover:bg-rose-50 text-slate-400 hover:text-rose-600'
                                }`}
                                title={isAbsent ? "Student Absent in this exam" : "Click to mark Absent"}
                              >
                                {isAbsent ? 'Absent' : 'AB'}
                              </button>
                            </div>
                          </td>
                        );
                      })}

                      {/* 6. Grand Total */}
                      <td className="py-3 px-2 text-center font-mono font-bold text-slate-500 bg-slate-50/50">
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

                      {/* 9. Position */}
                      <td className="py-3 px-2 text-center font-mono font-extrabold text-indigo-700">
                        {row.position || '-'}
                      </td>

                      {/* 10. Grade */}
                      <td className="py-3 px-3 text-center">
                        <span className={`inline-block px-2 py-0.5 rounded-lg text-[10px] uppercase border ${getGradeBadge(row.grade)}`}>
                          {row.grade || 'PASS'}
                        </span>
                      </td>

                      {/* 11. Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Row Save Button */}
                          <button
                            type="button"
                            onClick={() => handleSaveSingleRow(row.student_id)}
                            disabled={isRowSaving}
                            title="Save this student's marks"
                            className={`p-1.5 rounded-xl text-xs font-bold flex items-center gap-1 transition-all cursor-pointer ${
                              row.is_saved
                                ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-600 hover:text-white border border-emerald-200'
                                : 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm animate-pulse'
                            }`}
                          >
                            {isRowSaving ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
                          </button>

                          {/* Toggle All Absent */}
                          <button
                            type="button"
                            onClick={() => handleToggleAllAbsent(row.student_id)}
                            title="Mark/Unmark all papers Absent (AB)"
                            className="p-1.5 bg-slate-100 hover:bg-rose-100 text-slate-500 hover:text-rose-700 rounded-xl text-[11px] font-bold transition-colors cursor-pointer border border-slate-200"
                          >
                            AB
                          </button>

                          {/* WhatsApp Parent Alert */}
                          <button
                            type="button"
                            onClick={() => handleSendWhatsAppNotification(row)}
                            title="Send WhatsApp Result to Parent"
                            className="p-1.5 bg-emerald-50 hover:bg-emerald-600 text-emerald-600 hover:text-white rounded-xl transition-colors border border-emerald-200 cursor-pointer"
                          >
                            <Share2 size={13} />
                          </button>

                          {/* View Certificate */}
                          <button
                            type="button"
                            onClick={() => setPreviewStudent(row)}
                            title="View Official Certificate"
                            className="p-1.5 bg-slate-100 hover:bg-slate-800 text-slate-700 hover:text-white rounded-xl transition-colors border border-slate-200 cursor-pointer"
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
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-3xl w-full p-4 sm:p-8 space-y-6 shadow-2xl border border-slate-200 max-h-[95vh] overflow-y-auto">
            
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <span className="text-xs font-bold uppercase text-slate-500">Official Student Result Certificate</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-bold flex items-center gap-1 cursor-pointer"
                >
                  <Printer size={14} /> Print Report Card
                </button>
                <button onClick={() => setPreviewStudent(null)} className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer">
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

      {/* 7. Class Tabulation Print Sheet Modal */}
      {showTabulationPrint && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-2 sm:p-6 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-5xl w-full p-6 space-y-6 shadow-2xl border border-slate-200 max-h-[95vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <span className="text-xs font-bold uppercase text-slate-500">Official Class Tabulation Marksheet</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-3 py-1.5 rounded-xl bg-blue-600 text-white hover:bg-blue-700 text-xs font-bold flex items-center gap-1 cursor-pointer"
                >
                  <Printer size={14} /> Print Tabulation
                </button>
                <button onClick={() => setShowTabulationPrint(false)} className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer">
                  <X size={20} />
                </button>
              </div>
            </div>

            <div className="p-6 border-2 border-slate-800 rounded-2xl space-y-4 bg-white">
              <div className="text-center border-b-2 border-slate-800 pb-3">
                <h2 className="text-2xl font-display font-black text-slate-900">THE FOUNDATION COLLEGIATE</h2>
                <p className="text-xs font-bold text-blue-600 uppercase tracking-wider">OFFICIAL CLASS TABULATION SHEET</p>
                <p className="text-xs font-semibold text-slate-600 mt-1">
                  Class: <span className="font-bold text-slate-900">{selectedClassKey}</span> &bull; Exam: <span className="font-bold text-slate-900">{selectedExamType}</span> &bull; Month: <span className="font-bold text-slate-900">{activeMonthName}</span>
                </p>
              </div>

              <table className="w-full text-[11px] text-left border border-slate-300">
                <thead className="bg-slate-900 text-white font-bold uppercase text-[10px]">
                  <tr>
                    <th className="py-2 px-2 text-center">#</th>
                    <th className="py-2 px-2">Roll No</th>
                    <th className="py-2 px-3">Student Name</th>
                    {classSubjects.map(s => (
                      <th key={s.name} className="py-2 px-2 text-center">{s.name} ({s.total_marks})</th>
                    ))}
                    <th className="py-2 px-2 text-center">Total</th>
                    <th className="py-2 px-2 text-center">Obt.</th>
                    <th className="py-2 px-2 text-center">%</th>
                    <th className="py-2 px-2 text-center">Pos</th>
                    <th className="py-2 px-2 text-center">Grade</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {displayedRows.map((r, i) => (
                    <tr key={r.student_id}>
                      <td className="py-1.5 px-2 text-center font-mono">{i + 1}</td>
                      <td className="py-1.5 px-2 font-mono font-bold">{r.roll_number}</td>
                      <td className="py-1.5 px-3 font-semibold">{r.student_name}</td>
                      {classSubjects.map(s => (
                        <td key={s.name} className="py-1.5 px-2 text-center font-mono">
                          {r.subject_marks?.[s.name] !== '' ? r.subject_marks?.[s.name] : '-'}
                        </td>
                      ))}
                      <td className="py-1.5 px-2 text-center font-mono">{r.total_marks}</td>
                      <td className="py-1.5 px-2 text-center font-mono font-bold text-blue-700">{r.obtained_marks}</td>
                      <td className="py-1.5 px-2 text-center font-mono">{r.percentage}%</td>
                      <td className="py-1.5 px-2 text-center font-bold text-indigo-700">{r.position || '-'}</td>
                      <td className="py-1.5 px-2 text-center font-bold">{r.grade}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="pt-6 flex justify-between items-center text-xs font-bold text-slate-800">
                <div>Tabulated By: __________________</div>
                <div>Checked By: __________________</div>
                <div>Principal: __________________</div>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
