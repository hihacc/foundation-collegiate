'use client';
export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';
import { getStoredData, setStoredData } from '@/lib/utils/storage';
import { ArrowLeft, Search, Archive, RotateCcw, Trash2, Users, Download } from 'lucide-react';
import { toast } from 'sonner';
import { Student } from '@/types';

export default function ArchivedStudentsPage() {
  const [archivedStudents, setArchivedStudents] = useState<Student[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchArchived = async () => {
    setLoading(true);
    try {
      const { data } = await supabase
        .from('students')
        .select('*')
        .eq('status', 'archived')
        .order('name', { ascending: true });

      if (data && data.length > 0) {
        setArchivedStudents(data as Student[]);
      } else {
        const local = getStoredData('students_archived', []);
        setArchivedStudents(local);
      }
    } catch {
      const local = getStoredData('students_archived', []);
      setArchivedStudents(local);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchArchived();
  }, []);

  const handleRestore = async (st: Student) => {
    try {
      await supabase.from('students').update({ status: 'active', is_active: true }).eq('id', st.id);
      
      const allActive = getStoredData('students', []);
      setStoredData('students', [{ ...st, status: 'active', is_active: true }, ...allActive]);

      const remaining = archivedStudents.filter(s => s.id !== st.id);
      setArchivedStudents(remaining);
      setStoredData('students_archived', remaining);

      toast.success(`${st.name} restored to active student roster!`);
    } catch (err: any) {
      toast.error('Failed to restore student: ' + err.message);
    }
  };

  const handleDelete = async (st: Student) => {
    if (!confirm(`Permanently remove ${st.name} from archive?`)) return;
    try {
      await supabase.from('students').delete().eq('id', st.id);
      const remaining = archivedStudents.filter(s => s.id !== st.id);
      setArchivedStudents(remaining);
      setStoredData('students_archived', remaining);
      toast.success('Archived student record deleted.');
    } catch (err: any) {
      toast.error('Failed to delete: ' + err.message);
    }
  };

  const filtered = archivedStudents.filter(s =>
    s.name?.toLowerCase().includes(search.toLowerCase()) ||
    s.roll_number?.toLowerCase().includes(search.toLowerCase()) ||
    s.class_name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto font-sans p-2 sm:p-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
        <div className="space-y-1">
          <Link
            href="/admin/dashboard/students"
            className="inline-flex items-center gap-2 text-xs font-bold text-blue-600 hover:text-blue-700 mb-1"
          >
            <ArrowLeft size={14} /> Back to Active Students
          </Link>
          <div className="flex items-center gap-2">
            <Archive className="text-slate-700" size={26} />
            <h1 className="text-2xl sm:text-3xl font-display font-bold text-slate-900">
              Archived &amp; Alumni Students
            </h1>
          </div>
          <p className="text-slate-500 text-xs sm:text-sm">
            Records of past graduated batches and archived student enrollments.
          </p>
        </div>

        <div className="relative w-full sm:w-72">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search archived students..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 text-slate-800 rounded-xl text-xs font-medium focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-900 text-white font-bold uppercase text-[10px]">
                <th className="py-3.5 px-4 pl-6">Roll Number</th>
                <th className="py-3.5 px-4">Student Full Name</th>
                <th className="py-3.5 px-4">Last Class / Program</th>
                <th className="py-3.5 px-4">Father / Guardian</th>
                <th className="py-3.5 px-4 text-center">Status</th>
                <th className="py-3.5 px-4 pr-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400 font-medium">
                    Loading archived students...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center text-slate-400">
                    <Archive size={36} className="mx-auto mb-2 text-slate-300" />
                    <p className="font-semibold text-slate-600 text-sm">No archived student records found.</p>
                    <p className="text-xs text-slate-400 mt-1">Students marked as inactive or archived will appear in this repository.</p>
                  </td>
                </tr>
              ) : (
                filtered.map((st) => (
                  <tr key={st.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 pl-6 font-mono font-bold text-slate-700">{st.roll_number}</td>
                    <td className="py-3.5 px-4 font-bold text-slate-900">{st.name}</td>
                    <td className="py-3.5 px-4 text-slate-600 font-medium">{st.class_name}</td>
                    <td className="py-3.5 px-4 text-slate-500">{st.father_name || '—'}</td>
                    <td className="py-3.5 px-4 text-center">
                      <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200 font-bold text-[10px] uppercase">
                        Archived
                      </span>
                    </td>
                    <td className="py-3.5 px-4 pr-6 text-right space-x-2">
                      <button
                        onClick={() => handleRestore(st)}
                        title="Restore Student"
                        className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-600 hover:text-white border border-emerald-200 font-bold text-[11px] transition-colors cursor-pointer inline-flex items-center gap-1"
                      >
                        <RotateCcw size={12} /> Restore
                      </button>
                      <button
                        onClick={() => handleDelete(st)}
                        title="Delete Permanently"
                        className="px-2.5 py-1 rounded-lg bg-red-50 text-red-600 hover:bg-red-600 hover:text-white border border-red-200 font-bold text-[11px] transition-colors cursor-pointer inline-flex items-center gap-1"
                      >
                        <Trash2 size={12} /> Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
