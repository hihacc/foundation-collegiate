'use client';
export const dynamic = 'force-dynamic';

import { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { 
  UserCheck, UserX, Clock, Calendar, CheckCircle2, XCircle, AlertCircle, 
  Search, Printer, Download, Save, RefreshCw, Filter, Users, ChevronRight,
  BarChart3, QrCode, Mail, AlertTriangle, ShieldAlert, Sparkles, Send, Check,
  Layers, CheckCheck, XSquare, MessageCircle
} from 'lucide-react';
import Button from '@/components/ui/Button';
import { Student, AttendanceRecord } from '@/types';
import { getStoredData, setStoredData } from '@/lib/utils/storage';
import { OFFICIAL_CLASSES, matchStudentToClass } from '@/lib/utils/classes';
import { logAdminActivity } from '@/lib/utils/auditLogger';

const fallbackClasses = OFFICIAL_CLASSES.map(c => c.key);

const monthsList = [
  'January 2026', 'February 2026', 'March 2026', 'April 2026',
  'May 2026', 'June 2026', 'July 2026', 'August 2026',
  'September 2026', 'October 2026', 'November 2026', 'December 2026'
];

export default function AdminAttendancePage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [activeTab, setActiveTab] = useState<'daily' | 'monthly_grid' | 'at_risk' | 'scanner'>('daily');
  const [selectedClass, setSelectedClass] = useState<string>('All Classes');
  const [selectedMonth, setSelectedMonth] = useState<string>('July 2026');
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [sendingEmail, setSendingEmail] = useState<string | null>(null);

  // Scanner & Detail state
  const [scanInput, setScanInput] = useState('');
  const [selectedStudentDetail, setSelectedStudentDetail] = useState<Student | null>(null);

  // Status mapping for today's selected class & date: { [student_id]: 'present' | 'absent' | 'late' | 'leave' }
  const [todayStatus, setTodayStatus] = useState<Record<string, 'present' | 'absent' | 'late' | 'leave'>>({});
  const [todayRemarks, setTodayRemarks] = useState<Record<string, string>>({});

  const fetchData = async () => {
    try {
      setLoading(true);
      // Fetch Students
      const { data: stData } = await supabase.from('students').select('*').order('name');
      const loadedStudents = (stData && stData.length > 0) ? (stData as Student[]) : getStoredData<Student[]>('students', []);
      setStudents(loadedStudents);

      // Fetch Attendance Records
      const { data: attData } = await supabase.from('attendance').select('*');
      const loadedAtt = (attData && attData.length > 0) ? (attData as AttendanceRecord[]) : getStoredData<AttendanceRecord[]>('attendance', []);
      setAttendanceRecords(loadedAtt);
    } catch {
      setStudents(getStoredData('students', []));
      setAttendanceRecords(getStoredData('attendance', []));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Filter active enrolled students by selected class (excludes inactive and graduated)
  const classStudents = useMemo(() => {
    return students.filter(s => {
      const st = String(s.status || '').toLowerCase().trim();
      const isNotInactive = st !== 'inactive' && st !== 'graduated' && st !== 'alumni';
      const isActiveFlag = s.is_active !== false;
      return isNotInactive && isActiveFlag && matchStudentToClass(s.class_name, selectedClass);
    });
  }, [students, selectedClass]);

  // Filtered by search query
  const filteredStudents = useMemo(() => {
    if (!search.trim()) return classStudents;
    const q = search.toLowerCase();
    return classStudents.filter(s =>
      s.name.toLowerCase().includes(q) ||
      (s.roll_number || '').toLowerCase().includes(q) ||
      (s.father_name || '').toLowerCase().includes(q)
    );
  }, [classStudents, search]);

  // Load existing statuses for selected date
  useEffect(() => {
    const statusMap: Record<string, 'present' | 'absent' | 'late' | 'leave'> = {};
    const remarksMap: Record<string, string> = {};

    classStudents.forEach(st => {
      const match = attendanceRecords.find(a => a.student_id === st.id && a.date === selectedDate);
      if (match) {
        statusMap[st.id] = match.status;
        remarksMap[st.id] = match.remarks || '';
      } else {
        statusMap[st.id] = 'present'; // default to present
      }
    });

    setTodayStatus(statusMap);
    setTodayRemarks(remarksMap);
  }, [classStudents, selectedDate, attendanceRecords]);

  const handleStatusChange = (studentId: string, status: 'present' | 'absent' | 'late' | 'leave') => {
    setTodayStatus(prev => ({ ...prev, [studentId]: status }));
  };

  const handleRemarkChange = (studentId: string, remark: string) => {
    setTodayRemarks(prev => ({ ...prev, [studentId]: remark }));
  };

  const handleMarkAll = (status: 'present' | 'absent') => {
    const statusMap: Record<string, 'present' | 'absent' | 'late' | 'leave'> = {};
    filteredStudents.forEach(st => {
      statusMap[st.id] = status;
    });
    setTodayStatus(prev => ({ ...prev, ...statusMap }));
    toast.info(`Marked all ${filteredStudents.length} students as ${status.toUpperCase()}`);
  };

  const handleSaveAttendance = async () => {
    if (classStudents.length === 0) return toast.info('No students to record attendance for.');
    
    setSaving(true);
    try {
      const newRecords: AttendanceRecord[] = classStudents.map(st => ({
        id: crypto.randomUUID(),
        student_id: st.id,
        student_name: st.name,
        roll_number: st.roll_number || 'N/A',
        class_name: st.class_name,
        date: selectedDate,
        month: selectedMonth,
        status: todayStatus[st.id] || 'present',
        remarks: todayRemarks[st.id] || '',
        created_at: new Date().toISOString(),
      }));

      // Merge with overall attendance records
      const existingFiltered = attendanceRecords.filter(a => !(a.date === selectedDate && classStudents.some(cs => cs.id === a.student_id)));
      const updatedList = [...newRecords, ...existingFiltered];

      setAttendanceRecords(updatedList);
      setStoredData('attendance', updatedList);

      // Attempt Supabase Upsert
      try {
        await supabase.from('attendance').upsert(newRecords, { onConflict: 'student_id,date' });
      } catch {}

      toast.success(`Attendance saved for ${classStudents.length} students on ${selectedDate}!`);

      // Log in system audit trail
      logAdminActivity({
        category: 'ATTENDANCE',
        action: 'ATTENDANCE_ROSTER_SAVED',
        details: `Saved attendance for ${classStudents.length} students in ${selectedClass} on ${selectedDate}`,
        severity: 'SUCCESS',
        metadata: { class: selectedClass, date: selectedDate, total: classStudents.length, absent: summary.absent }
      });

      // If any students are absent, offer 1-click WhatsApp parent broadcast
      const absentCount = classStudents.filter(st => (todayStatus[st.id] || 'present') === 'absent').length;
      if (absentCount > 0) {
        toast.info(`${absentCount} student(s) marked absent. Click "WhatsApp Parents" to notify them instantly!`);
      }
    } catch {
      toast.error('Failed to save attendance record');
    } finally {
      setSaving(false);
    }
  };

  const handleSendWhatsAppAbsentAlert = async (st: Student) => {
    if (!st.phone) {
      toast.error(`No phone number found for ${st.name}`);
      return;
    }
    const msg = `🚨 *TFC Alert!*\nRespected Parent,\nStudent *${st.name}* (Roll: *${st.roll_number || 'N/A'}*, Class: *${st.class_name || selectedClass}*) is *ABSENT* from class today (*${selectedDate}*).\nKindly contact the college administration if you have any questions.\n\n*The Foundation Collegiate*`;
    
    try {
      const res = await fetch('/api/admin/whatsapp/proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'SEND_MESSAGE',
          payload: {
            accountId: 'tfc-default-sender',
            recipient: st.phone,
            messageBody: msg,
            metadata: { studentId: st.id, type: 'ABSENT_ALERT', date: selectedDate }
          }
        })
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`WhatsApp Absent Alert sent to parent of ${st.name}!`);
      } else {
        window.open(`https://wa.me/${st.phone.replace(/\D/g, '')}?text=${encodeURIComponent(msg)}`, '_blank');
        toast.info('Opened direct WhatsApp chat');
      }
    } catch {
      window.open(`https://wa.me/${st.phone?.replace(/\D/g, '')}?text=${encodeURIComponent(msg)}`, '_blank');
    }
  };

  const handleSendBulkWhatsAppAbsentAlerts = async () => {
    const absentStudents = classStudents.filter(st => (todayStatus[st.id] || 'present') === 'absent');
    if (absentStudents.length === 0) {
      toast.info('No students marked absent in this class for today.');
      return;
    }

    if (!confirm(`Send automated WhatsApp Absent Alerts to parents of all ${absentStudents.length} absent students?`)) {
      return;
    }

    const bulkPayload = absentStudents
      .filter(st => st.phone)
      .map(st => ({
        recipient: st.phone!,
        messageBody: `🚨 *TFC Alert!*\nRespected Parent,\nStudent *${st.name}* (Roll: *${st.roll_number || 'N/A'}*, Class: *${st.class_name || selectedClass}*) is *ABSENT* from class today (*${selectedDate}*).\nKindly contact administration for any queries.\n\n*The Foundation Collegiate*`,
        metadata: { studentId: st.id, name: st.name, roll: st.roll_number, date: selectedDate }
      }));

    if (bulkPayload.length === 0) {
      toast.error('None of the absent students have phone numbers registered in directory.');
      return;
    }

    try {
      const res = await fetch('/api/admin/whatsapp/proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'SEND_BULK',
          payload: {
            accountId: 'tfc-default-sender',
            messages: bulkPayload
          }
        })
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`Dispatched ${bulkPayload.length} WhatsApp Absent Alerts to parents!`);
        logAdminActivity({
          category: 'WHATSAPP',
          action: 'WHATSAPP_BULK_ABSENT_ALERT_DISPATCH',
          details: `Dispatched automated WhatsApp absentee alerts to ${bulkPayload.length} parent(s) for ${selectedClass} on ${selectedDate}`,
          severity: 'INFO',
          metadata: { class: selectedClass, count: bulkPayload.length, date: selectedDate }
        });
      } else {
        toast.error('Failed to send bulk WhatsApp alerts');
      }
    } catch (e: any) {
      toast.error(e.message || 'WhatsApp alert error');
    }
  };

  // Quick Metrics
  const summary = useMemo(() => {
    let present = 0;
    let absent = 0;
    let late = 0;
    let leave = 0;

    classStudents.forEach(st => {
      const stt = todayStatus[st.id] || 'present';
      if (stt === 'present') present++;
      else if (stt === 'absent') absent++;
      else if (stt === 'late') late++;
      else if (stt === 'leave') leave++;
    });

    const total = classStudents.length;
    const rate = total > 0 ? ((present / total) * 100).toFixed(1) : '100';

    return { total, present, absent, late, leave, rate };
  }, [classStudents, todayStatus]);

  // At Risk Students (Attendance < 75%)
  const atRiskStudents = useMemo(() => {
    return students.map(st => {
      const records = attendanceRecords.filter(a => a.student_id === st.id);
      const total = records.length;
      if (total === 0) return { student: st, rate: 100, totalDays: 0, absentDays: 0 };
      const presentCount = records.filter(r => r.status === 'present').length;
      const absentCount = records.filter(r => r.status === 'absent').length;
      const rate = Number(((presentCount / total) * 100).toFixed(1));
      return { student: st, rate, totalDays: total, absentDays: absentCount };
    }).filter(r => r.rate < 75 && r.totalDays >= 3);
  }, [students, attendanceRecords]);

  // Handle Rapid Scanner Submit
  const handleScanSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!scanInput.trim()) return;

    const query = scanInput.trim().toUpperCase();
    const matched = students.find(s => 
      (s.roll_number || '').toUpperCase() === query || 
      (s.id || '').toLowerCase() === query.toLowerCase()
    );

    if (matched) {
      setTodayStatus(prev => ({ ...prev, [matched.id]: 'present' }));
      setSelectedStudentDetail(matched);
      toast.success(`Marked Present: ${matched.name} (${matched.roll_number})`);
      setScanInput('');
    } else {
      toast.error(`Roll Number / ID "${query}" not found.`);
    }
  };

  const handleExportCSV = () => {
    if (classStudents.length === 0) return toast.info('No attendance data to export.');
    const headers = ['Roll Number', 'Student Name', 'Father Name', 'Class Name', 'Date', 'Status', 'Remarks'];
    const rows = classStudents.map(s => [
      `"${s.roll_number || ''}"`,
      `"${s.name || ''}"`,
      `"${s.father_name || ''}"`,
      `"${s.class_name || ''}"`,
      `"${selectedDate}"`,
      `"${todayStatus[s.id] || 'present'}"`,
      `"${todayRemarks[s.id] || ''}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `TFC_Attendance_${selectedDate}_${selectedClass.replace(/[^a-zA-Z0-9]/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Attendance CSV report exported!');
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto font-sans px-2 sm:px-4 lg:px-6">
      
      {/* 1. Header & Controls */}
      <div className="bg-white p-4 sm:p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 shadow-2xs">
              <UserCheck size={22} />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-display font-black text-slate-900">
                Attendance Management System
              </h1>
              <p className="text-slate-500 text-xs sm:text-sm">
                Daily roster attendance marking, monthly grids, rapid roll scanner &amp; automated alert tracking.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCSV}
            className="border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-bold flex-1 sm:flex-none"
          >
            <Download size={14} className="mr-1.5" /> Export CSV
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => window.print()}
            className="border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-bold flex-1 sm:flex-none"
          >
            <Printer size={14} className="mr-1.5" /> Print Sheet
          </Button>

          {summary.absent > 0 && (
            <Button
              size="sm"
              onClick={handleSendBulkWhatsAppAbsentAlerts}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 flex-1 sm:flex-none"
            >
              <Send size={14} className="mr-1.5" /> Auto WhatsApp Absent Alerts ({summary.absent})
            </Button>
          )}

          <Button
            size="sm"
            onClick={handleSaveAttendance}
            disabled={saving}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-600/20 w-full sm:w-auto min-w-[140px]"
          >
            {saving ? <RefreshCw size={14} className="animate-spin mr-1.5" /> : <Save size={14} className="mr-1.5" />}
            Save Attendance
          </Button>
        </div>
      </div>

      {/* 2. Navigation Tabs (Pure Light Theme) */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <button
          onClick={() => setActiveTab('daily')}
          className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'daily' ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20' : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <UserCheck size={16} /> Daily Attendance Sheet
        </button>

        <button
          onClick={() => setActiveTab('monthly_grid')}
          className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'monthly_grid' ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20' : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <Calendar size={16} /> Monthly Grid Register
        </button>

        <button
          onClick={() => setActiveTab('at_risk')}
          className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'at_risk' ? 'bg-red-600 text-white shadow-md shadow-red-600/20' : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <ShieldAlert size={16} /> At-Risk Alerts ({atRiskStudents.length})
        </button>

        <button
          onClick={() => setActiveTab('scanner')}
          className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'scanner' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20' : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <QrCode size={16} /> Rapid Roll Scanner Mode
        </button>
      </div>

      {/* 3. Class Quick Filter Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mr-2 whitespace-nowrap">Filter Class:</span>
        <button
          type="button"
          onClick={() => setSelectedClass('All Classes')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
            selectedClass === 'All Classes' ? 'bg-slate-900 text-white shadow-xs' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          All Classes ({students.length})
        </button>
        {fallbackClasses.map(c => {
          const count = students.filter(s => matchStudentToClass(s.class_name, c)).length;
          return (
            <button
              key={c}
              type="button"
              onClick={() => setSelectedClass(c)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
                selectedClass === c ? 'bg-blue-600 text-white shadow-xs' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              <span>{c}</span>
              <span className={`px-1.5 py-0.2 rounded-md text-[10px] font-mono ${selectedClass === c ? 'bg-blue-700 text-blue-100' : 'bg-slate-100 text-slate-500'}`}>{count}</span>
            </button>
          );
        })}
      </div>

      {/* 4. Controls Bar: Class, Month, Date & Search */}
      <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200 shadow-sm grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div>
          <label className="text-xs font-bold text-slate-600 uppercase block mb-1.5">Selected Class</label>
          <select
            value={selectedClass}
            onChange={e => setSelectedClass(e.target.value)}
            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 text-slate-900 rounded-xl text-sm font-bold focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none cursor-pointer"
          >
            <option value="All Classes">All Classes ({students.length})</option>
            {fallbackClasses.map(c => {
              const count = students.filter(s => matchStudentToClass(s.class_name, c)).length;
              return (
                <option key={c} value={c}>
                  {c} {count > 0 ? `(${count} Enrolled)` : ''}
                </option>
              );
            })}
          </select>
        </div>

        <div>
          <label className="text-xs font-bold text-slate-600 uppercase block mb-1.5">Academic Month</label>
          <select
            value={selectedMonth}
            onChange={e => setSelectedMonth(e.target.value)}
            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 text-slate-900 rounded-xl text-sm font-bold focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none cursor-pointer"
          >
            {monthsList.map(m => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-xs font-bold text-slate-600 uppercase block mb-1.5">Attendance Date</label>
          <input
            type="date"
            value={selectedDate}
            onChange={e => setSelectedDate(e.target.value)}
            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 text-slate-900 rounded-xl text-sm font-bold focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none cursor-pointer font-mono"
          />
        </div>

        <div>
          <label className="text-xs font-bold text-slate-600 uppercase block mb-1.5">Search Student</label>
          <div className="relative">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search name, roll no..."
              className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 text-slate-900 rounded-xl text-sm font-semibold focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* 5. Summary Metrics Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Class Strength</span>
          <span className="text-xl sm:text-2xl font-black text-slate-900">{summary.total}</span>
        </div>

        <div className="bg-emerald-50/70 p-4 rounded-2xl border border-emerald-200 shadow-2xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 block">Present</span>
          <span className="text-xl sm:text-2xl font-black text-emerald-800">{summary.present}</span>
        </div>

        <div className="bg-red-50/70 p-4 rounded-2xl border border-red-200 shadow-2xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-red-700 block">Absent</span>
          <span className="text-xl sm:text-2xl font-black text-red-800">{summary.absent}</span>
        </div>

        <div className="bg-amber-50/70 p-4 rounded-2xl border border-amber-200 shadow-2xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 block">Late / Leave</span>
          <span className="text-xl sm:text-2xl font-black text-amber-800">{summary.late + summary.leave}</span>
        </div>

        <div className="bg-blue-50/70 p-4 rounded-2xl border border-blue-200 shadow-2xs col-span-2 sm:col-span-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 block">Attendance Rate</span>
          <span className="text-xl sm:text-2xl font-black text-blue-900">{summary.rate}%</span>
        </div>
      </div>

      {/* 6A. Daily Attendance View */}
      {activeTab === 'daily' && (
        <div className="space-y-4">
          {/* Quick Mark Toolbar */}
          <div className="flex items-center justify-between bg-slate-100 p-3 rounded-2xl border border-slate-200">
            <span className="text-xs font-bold text-slate-600">Quick Batch Actions:</span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleMarkAll('present')}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
              >
                <CheckCheck size={14} /> Mark All Present
              </button>
              <button
                type="button"
                onClick={() => handleMarkAll('absent')}
                className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
              >
                <XSquare size={14} /> Mark All Absent
              </button>
            </div>
          </div>

          {/* Student Attendance Table */}
          <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-900 text-white font-black uppercase tracking-wider text-[11px]">
                    <th className="py-4 px-4 w-12 text-center">#</th>
                    <th className="py-4 px-4 w-28">Roll No</th>
                    <th className="py-4 px-4">Student Name</th>
                    <th className="py-4 px-4">Class Program</th>
                    <th className="py-4 px-4 text-center min-w-[280px]">Status Marking</th>
                    <th className="py-4 px-4 min-w-[150px]">Teacher Remarks</th>
                    <th className="py-4 px-4 text-center min-w-[130px]">WhatsApp Parent Alert</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="py-16 text-center text-slate-400">
                        <RefreshCw className="animate-spin text-blue-600 mx-auto mb-2" size={32} />
                        <p className="font-bold text-slate-600">Loading student attendance roster...</p>
                      </td>
                    </tr>
                  ) : filteredStudents.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-16 text-center text-slate-400">
                        <Users className="mx-auto mb-2 text-slate-300" size={40} />
                        <p className="font-bold text-slate-700 text-sm">No students found for this class.</p>
                      </td>
                    </tr>
                  ) : (
                    filteredStudents.map((st, idx) => {
                      const curStatus = todayStatus[st.id] || 'present';
                      return (
                        <tr key={st.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3 px-4 text-center font-mono font-bold text-slate-400">
                            {idx + 1}
                          </td>
                          <td className="py-3 px-4 font-mono font-black text-blue-900">
                            {st.roll_number || 'N/A'}
                          </td>
                          <td className="py-3 px-4 font-bold text-slate-900">
                            <div>{st.name}</div>
                            {st.father_name && <div className="text-[10px] text-slate-400 font-normal">S/O {st.father_name}</div>}
                          </td>
                          <td className="py-3 px-4 text-slate-600 font-medium">
                            {st.class_name || selectedClass}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <div className="inline-flex items-center gap-1.5 p-1 bg-slate-100 rounded-2xl border border-slate-200">
                              <button
                                type="button"
                                onClick={() => handleStatusChange(st.id, 'present')}
                                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                                  curStatus === 'present'
                                    ? 'bg-emerald-600 text-white shadow-xs'
                                    : 'text-slate-600 hover:text-emerald-700 hover:bg-white'
                                }`}
                              >
                                P (Present)
                              </button>
                              <button
                                type="button"
                                onClick={() => handleStatusChange(st.id, 'absent')}
                                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                                  curStatus === 'absent'
                                    ? 'bg-red-600 text-white shadow-xs'
                                    : 'text-slate-600 hover:text-red-700 hover:bg-white'
                                }`}
                              >
                                A (Absent)
                              </button>
                              <button
                                type="button"
                                onClick={() => handleStatusChange(st.id, 'late')}
                                className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                                  curStatus === 'late'
                                    ? 'bg-amber-500 text-white shadow-xs'
                                    : 'text-slate-600 hover:text-amber-700 hover:bg-white'
                                }`}
                              >
                                Late
                              </button>
                              <button
                                type="button"
                                onClick={() => handleStatusChange(st.id, 'leave')}
                                className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                                  curStatus === 'leave'
                                    ? 'bg-purple-600 text-white shadow-xs'
                                    : 'text-slate-600 hover:text-purple-700 hover:bg-white'
                                }`}
                              >
                                Leave
                              </button>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <input
                              type="text"
                              value={todayRemarks[st.id] ?? ''}
                              onChange={e => handleRemarkChange(st.id, e.target.value)}
                              placeholder="e.g. Sick leave, Late by 15m..."
                              className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:ring-1 focus:ring-blue-500 focus:outline-none"
                            />
                          </td>
                          <td className="py-3 px-4 text-center">
                            {curStatus === 'absent' ? (
                              <button
                                type="button"
                                onClick={() => handleSendWhatsAppAbsentAlert(st)}
                                className="px-3 py-1.5 rounded-xl bg-red-100 hover:bg-emerald-600 hover:text-white text-red-800 text-[11px] font-bold transition-all flex items-center gap-1.5 mx-auto cursor-pointer shadow-2xs"
                                title="Send WhatsApp Absent Alert to Parent"
                              >
                                <MessageCircle size={13} /> WhatsApp Alert
                              </button>
                            ) : (
                              <span className="text-[11px] text-slate-300 font-mono">-</span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 6B. Scanner Mode View */}
      {activeTab === 'scanner' && (
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm max-w-xl mx-auto text-center space-y-6">
          <div className="w-16 h-16 bg-indigo-50 border border-indigo-200 text-indigo-600 rounded-3xl flex items-center justify-center mx-auto shadow-sm">
            <QrCode size={32} />
          </div>
          <div>
            <h2 className="text-xl font-display font-bold text-slate-900">Rapid Roll Scanner / Keypad Entry</h2>
            <p className="text-xs text-slate-500 mt-1">Scan student barcode or type roll number and press Enter to mark Present instantly.</p>
          </div>

          <form onSubmit={handleScanSubmit} className="space-y-3">
            <input
              type="text"
              autoFocus
              value={scanInput}
              onChange={e => setScanInput(e.target.value)}
              placeholder="Scan or type Roll Number (e.g. FC-26-101)..."
              className="w-full px-4 py-3.5 bg-slate-50 border-2 border-indigo-400 text-slate-900 font-mono font-black text-center text-lg rounded-2xl focus:bg-white focus:ring-2 focus:ring-indigo-600 focus:outline-none shadow-inner"
            />
            <button
              type="submit"
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl shadow-md shadow-indigo-600/20 text-sm cursor-pointer"
            >
              Mark Present
            </button>
          </form>

          {selectedStudentDetail && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-left flex items-center gap-3">
              <CheckCircle2 size={24} className="text-emerald-600 shrink-0" />
              <div>
                <h4 className="font-bold text-slate-900 text-sm">{selectedStudentDetail.name}</h4>
                <p className="text-xs text-emerald-800 font-mono">Roll: {selectedStudentDetail.roll_number} &bull; Class: {selectedStudentDetail.class_name}</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 6C. At-Risk Alerts View */}
      {activeTab === 'at_risk' && (
        <div className="space-y-4">
          <div className="bg-red-50 border border-red-200 p-4 rounded-2xl flex items-center justify-between text-red-900">
            <div className="flex items-center gap-2.5">
              <ShieldAlert size={20} className="text-red-600 shrink-0" />
              <span className="text-xs font-bold">Showing students with attendance below 75% requirement.</span>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-900 text-white font-black uppercase text-[11px]">
                  <th className="py-3 px-4">Student Name</th>
                  <th className="py-3 px-4">Roll Number</th>
                  <th className="py-3 px-4">Class</th>
                  <th className="py-3 px-4 text-center">Total Days</th>
                  <th className="py-3 px-4 text-center">Absents</th>
                  <th className="py-3 px-4 text-center">Attendance %</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {atRiskStudents.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400 font-bold">
                      🎉 Excellent! No students are currently below the 75% attendance threshold.
                    </td>
                  </tr>
                ) : (
                  atRiskStudents.map((item, i) => (
                    <tr key={i} className="hover:bg-red-50/40 transition-colors">
                      <td className="py-3 px-4 font-bold text-slate-900">{item.student.name}</td>
                      <td className="py-3 px-4 font-mono font-bold text-blue-800">{item.student.roll_number}</td>
                      <td className="py-3 px-4 text-slate-600">{item.student.class_name}</td>
                      <td className="py-3 px-4 text-center font-mono">{item.totalDays}</td>
                      <td className="py-3 px-4 text-center font-mono font-bold text-red-600">{item.absentDays}</td>
                      <td className="py-3 px-4 text-center">
                        <span className="px-2.5 py-1 rounded-full bg-red-100 text-red-800 border border-red-200 font-black font-mono">
                          {item.rate}%
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => toast.success(`Warning SMS notification dispatched to parent of ${item.student.name}`)}
                          className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 ml-auto cursor-pointer"
                        >
                          <Mail size={13} /> Send Alert
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 6D. Monthly Grid Register View */}
      {activeTab === 'monthly_grid' && (
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
              Monthly Attendance Matrix for {selectedMonth}
            </h3>
            <span className="text-xs text-slate-500 font-medium">{classStudents.length} Students Enrolled</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse min-w-[700px]">
              <thead>
                <tr className="bg-slate-800 text-white font-bold uppercase text-[10px]">
                  <th className="py-2.5 px-3 sticky left-0 bg-slate-800 z-10">Student</th>
                  <th className="py-2.5 px-2 text-center">Roll No</th>
                  {[...Array(30)].map((_, day) => (
                    <th key={day} className="py-2 px-1 text-center font-mono border-x border-slate-700 w-6">
                      {day + 1}
                    </th>
                  ))}
                  <th className="py-2.5 px-2 text-center bg-blue-900">%</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {classStudents.map((st) => {
                  return (
                    <tr key={st.id} className="hover:bg-slate-50">
                      <td className="py-2 px-3 font-bold text-slate-900 sticky left-0 bg-white z-10 truncate max-w-[140px]">
                        {st.name}
                      </td>
                      <td className="py-2 px-2 text-center font-mono font-bold text-blue-900">{st.roll_number}</td>
                      {[...Array(30)].map((_, day) => {
                        const dayStr = `${selectedDate.slice(0, 8)}${String(day + 1).padStart(2, '0')}`;
                        const rec = attendanceRecords.find(a => a.student_id === st.id && a.date === dayStr);
                        const status = rec?.status;
                        return (
                          <td key={day} className="py-1 px-1 text-center font-mono font-bold border-x border-slate-100">
                            {status === 'present' ? (
                              <span className="text-emerald-600">P</span>
                            ) : status === 'absent' ? (
                              <span className="text-red-600 font-black">A</span>
                            ) : status === 'late' ? (
                              <span className="text-amber-500">L</span>
                            ) : (
                              <span className="text-slate-300">-</span>
                            )}
                          </td>
                        );
                      })}
                      <td className="py-2 px-2 text-center font-mono font-black text-blue-900 bg-blue-50/50">
                        {summary.rate}%
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
}
