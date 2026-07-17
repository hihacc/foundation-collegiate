'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { Search, Users, ShieldAlert, GraduationCap, Phone } from 'lucide-react';
import { formatRelativeTime } from '@/lib/utils/grades';
import { Student } from '@/lib/types';
import { motion } from 'framer-motion';

export default function AdminStudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const { data, error } = await supabase.from('students').select('*').order('created_at', { ascending: false });
        if (error) throw error;
        setStudents(data as Student[] || []);
      } catch (err) {
        console.error(err);
        setError(true);
        // Premium fallback data for preview if Supabase is offline
        setStudents([
          { id: '1', name: 'Zainab Ahmed', roll_number: 'FC-26-001', class_name: 'Pre-Medical', father_name: 'Ahmed Siddiqui', phone: '0300-1234567', status: 'active', created_at: new Date().toISOString() },
          { id: '2', name: 'Saad Ali', roll_number: 'FC-26-002', class_name: 'Pre-Engineering', father_name: 'Ali Raza', phone: '0333-9876543', status: 'active', created_at: new Date(Date.now() - 86400000).toISOString() },
          { id: '3', name: 'Fatima Khan', roll_number: 'FC-26-003', class_name: 'Computer Science', father_name: 'Imran Khan', phone: '0345-5555555', status: 'inactive', created_at: new Date(Date.now() - 172800000).toISOString() },
        ]);
      } finally {
        setLoading(false);
      }
    };
    fetchStudents();
  }, []);

  const filtered = students.filter(s =>
    s.name?.toLowerCase().includes(search.toLowerCase()) ||
    s.roll_number?.toLowerCase().includes(search.toLowerCase()) ||
    s.class_name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#0a0f1e] p-6 rounded-2xl border border-white/5">
        <div>
          <h1 className="text-2xl font-display font-bold text-white">Student Directory</h1>
          <p className="text-white/50 text-sm mt-1">{students.length} registered students</p>
        </div>
        <div className="relative">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" />
          <input 
            value={search} 
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name, roll no, or class..."
            className="w-full sm:w-80 pl-11 pr-4 py-2.5 bg-background border border-white/10 text-white placeholder:text-white/30 rounded-xl focus:ring-2 focus:ring-[#0057FF] focus:outline-none transition-all text-sm"
          />
        </div>
      </div>

      {error && (
        <div className="bg-[#D72638]/10 border border-[#D72638]/20 text-[#D72638] px-4 py-3 rounded-xl flex items-center gap-3 text-sm">
          <ShieldAlert size={18} className="shrink-0" />
          <p>Database connection failed. Displaying preview data. Please check your Supabase configuration.</p>
        </div>
      )}

      {/* Table Card */}
      <div className="bg-[#0a0f1e] border border-white/5 rounded-2xl overflow-hidden shadow-[0_8px_30px_rgba(0,0,0,0.12)]">
        {loading ? (
          <div className="p-6 space-y-3">
            {[...Array(6)].map((_, i) => <div key={i} className="h-16 rounded-xl bg-white/5 animate-pulse border border-white/5" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-24 text-white/40 flex flex-col items-center">
            <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mb-4">
              <Users size={32} className="opacity-50" />
            </div>
            <p className="text-lg font-medium text-white/60">No students found</p>
            <p className="text-sm mt-1">Students registered via admissions will appear here.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10 bg-white/5">
                  <th className="text-left px-6 py-4 text-xs font-bold uppercase tracking-wider text-white/40">Student Profile</th>
                  <th className="text-left px-6 py-4 text-xs font-bold uppercase tracking-wider text-white/40">Roll No.</th>
                  <th className="text-left px-6 py-4 text-xs font-bold uppercase tracking-wider text-white/40">Class & Status</th>
                  <th className="text-left px-6 py-4 text-xs font-bold uppercase tracking-wider text-white/40">Contact</th>
                  <th className="text-right px-6 py-4 text-xs font-bold uppercase tracking-wider text-white/40">Registered</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filtered.map((s, idx) => (
                  <motion.tr 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    key={s.id} 
                    className="hover:bg-white/5 transition-colors group"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#001F54] to-[#0057FF] flex items-center justify-center text-white font-bold shrink-0 shadow-inner">
                          {s.name.charAt(0)}
                        </div>
                        <div>
                          <div className="font-bold text-white group-hover:text-[#0057FF] transition-colors">{s.name}</div>
                          <div className="text-xs text-white/50">D/O, S/O: {s.father_name}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2.5 py-1 rounded-md bg-white/10 text-white/80 font-mono text-xs border border-white/10">
                        {s.roll_number}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1.5 align-start">
                        <div className="flex items-center gap-1.5 text-white/80">
                          <GraduationCap size={14} className="text-[#FFD700]" />
                          {s.class_name}
                        </div>
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider w-fit ${
                          s.status === 'active' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 
                          s.status === 'graduated' ? 'bg-[#0057FF]/10 text-[#0057FF] border border-[#0057FF]/20' : 
                          'bg-white/10 text-white/50 border border-white/10'
                        }`}>
                          {s.status || 'Active'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-white/70">
                        <Phone size={14} className="text-white/30" />
                        {s.phone || 'N/A'}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right text-xs text-white/40">
                      {s.created_at ? formatRelativeTime(s.created_at) : 'Recently'}
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
