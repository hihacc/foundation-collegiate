'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { Eye, Search, ClipboardList, CheckCircle2, Clock, XCircle, Award } from 'lucide-react';
import { formatRelativeTime } from '@/lib/utils/grades';
import { Admission } from '@/lib/types';
import { motion, AnimatePresence } from 'framer-motion';

export default function AdminAdmissionsPage() {
  const [admissions, setAdmissions] = useState<Admission[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Admission | null>(null);

  const fetch = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.from('admissions').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      setAdmissions(data as Admission[] || []);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load admissions. Using fallback data.');
      if (admissions.length === 0) {
        setAdmissions([
          { id: '1', student_name: 'Ahsan Khan', father_name: 'Tariq Khan', class_applied: 'Pre-Engineering', parent_phone: '03001234567', status: 'pending', address: 'Karachi' },
          { id: '2', student_name: 'Fatima Ali', father_name: 'Ali Raza', class_applied: 'Pre-Medical', parent_phone: '03339876543', status: 'approved', address: 'Lahore' },
        ] as any);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetch(); }, []);

  const updateStatus = async (id: string, status: string) => {
    try {
      const { error } = await supabase.from('admissions').update({ status }).eq('id', id);
      if (error) throw error;
      toast.success(`Status updated to ${status}`);
      fetch();
      if (selected?.id === id) setSelected({ ...selected, status } as any);
    } catch (err) {
      console.error(err);
      toast.error('Update failed');
    }
  };

  const statusColor: Record<string, { bg: string, text: string, border: string }> = {
    pending: { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/20' },
    approved: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/20' },
    rejected: { bg: 'bg-red-500/10', text: 'text-red-400', border: 'border-red-500/20' },
    interview: { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/20' },
    scholarship: { bg: 'bg-purple-500/10', text: 'text-purple-400', border: 'border-purple-500/20' },
    completed: { bg: 'bg-slate-500/10', text: 'text-slate-400', border: 'border-slate-500/20' },
  };

  const filtered = admissions.filter(a =>
    a.student_name?.toLowerCase().includes(search.toLowerCase()) ||
    a.phone?.includes(search) ||
    a.class_applied?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#0a0f1e] p-6 rounded-2xl border border-white/5">
        <div>
          <h1 className="text-2xl font-display font-bold text-white">Admissions Management</h1>
          <p className="text-white/50 text-sm mt-1">Review and manage student applications</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" size={16} />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search name, phone, program..."
              className="pl-9 pr-4 py-2 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#0057FF] w-full sm:w-64 transition-all"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Table */}
        <div className="xl:col-span-2 bg-[#0a0f1e] border border-white/5 rounded-2xl overflow-hidden shadow-[0_8px_30px_rgba(0,0,0,0.12)] h-[calc(100vh-220px)] flex flex-col">
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-[#0a0f1e] z-10 border-b border-white/10">
                <tr>
                  {['Student', 'Program', 'Status', 'Applied', 'Action'].map(h => (
                    <th key={h} className="text-left px-6 py-4 text-xs font-bold uppercase tracking-wider text-white/40">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {loading ? (
                  [...Array(6)].map((_, i) => (
                    <tr key={i}>
                      {[...Array(5)].map((_, j) => (
                        <td key={j} className="px-6 py-4"><div className="h-6 rounded-md bg-white/5 animate-pulse" /></td>
                      ))}
                    </tr>
                  ))
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-20 text-white/40">
                      <ClipboardList size={40} className="mx-auto mb-3 opacity-20" />
                      No applications found
                    </td>
                  </tr>
                ) : filtered.map((adm, idx) => {
                  const style = statusColor[adm.status] || statusColor.pending;
                  return (
                    <motion.tr
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      key={adm.id}
                      className={`hover:bg-white/5 transition-colors cursor-pointer group ${selected?.id === adm.id ? 'bg-[#0057FF]/10 border-l-2 border-l-[#0057FF]' : 'border-l-2 border-l-transparent'}`}
                      onClick={() => setSelected(adm)}
                    >
                      <td className="px-6 py-4">
                        <div className="font-bold text-white group-hover:text-[#0057FF] transition-colors">{adm.student_name}</div>
                        <div className="text-xs text-white/40 mt-1">{adm.phone}</div>
                      </td>
                      <td className="px-6 py-4 text-white/80">{adm.class_applied}</td>
                      <td className="px-6 py-4">
                        <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border uppercase tracking-wider ${style.bg} ${style.text} ${style.border}`}>
                          {adm.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs text-white/50 whitespace-nowrap">
                        {adm.created_at ? formatRelativeTime(adm.created_at) : 'N/A'}
                      </td>
                      <td className="px-6 py-4">
                        <button className="w-8 h-8 bg-white/5 group-hover:bg-[#0057FF] text-white/50 group-hover:text-white rounded-lg flex items-center justify-center transition-colors">
                          <Eye size={14} />
                        </button>
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Detail Panel */}
        <AnimatePresence mode="wait">
          {!selected ? (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="bg-[#0a0f1e] border border-white/5 rounded-2xl p-6 h-[calc(100vh-220px)] flex flex-col items-center justify-center text-center shadow-[0_8px_30px_rgba(0,0,0,0.12)]"
            >
              <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mb-6 text-white/10">
                <ClipboardList size={32} />
              </div>
              <h3 className="text-white font-bold text-lg mb-2">Application Details</h3>
              <p className="text-white/40 text-sm max-w-[200px]">Select an application from the list to view full details and manage its status.</p>
            </motion.div>
          ) : (
            <motion.div
              key={selected.id}
              initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
              className="bg-[#0a0f1e] border border-white/5 rounded-2xl p-6 shadow-[0_8px_30px_rgba(0,0,0,0.12)] h-[calc(100vh-220px)] overflow-y-auto custom-scrollbar"
            >
              <div className="flex items-start justify-between mb-8">
                <div>
                  <h2 className="text-xl font-bold text-white mb-1">{selected.student_name}</h2>
                  <p className="text-[#0057FF] font-medium text-sm">{selected.class_applied}</p>
                </div>
                <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border uppercase tracking-wider ${statusColor[selected.status]?.bg} ${statusColor[selected.status]?.text} ${statusColor[selected.status]?.border}`}>
                  {selected.status}
                </span>
              </div>

              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  {[
                    ['Father\'s Name', selected.father_name],
                    ['Phone Number', selected.phone],
                    ['Email', selected.email || 'N/A'],
                    ['Applied', selected.created_at ? new Date(selected.created_at).toLocaleDateString() : 'N/A'],
                  ].map(([label, val]) => (
                    <div key={label} className="bg-white/5 rounded-xl p-3 border border-white/5">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-white/40 mb-1">{label}</div>
                      <div className="text-sm text-white/90 font-medium truncate" title={val as string}>{val}</div>
                    </div>
                  ))}
                </div>

                <div className="bg-white/5 rounded-xl p-4 border border-white/5">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-white/40 mb-2">Previous Schooling</div>
                  <div className="text-sm text-white/90">{selected.previous_school || 'Not specified'}</div>
                  {selected.marks_percentage && (
                    <div className="mt-2 text-xs text-white/60">Marks/Grade: <span className="text-white/90 font-medium">{selected.marks_percentage}</span></div>
                  )}
                </div>

                <div className="bg-white/5 rounded-xl p-4 border border-white/5">
                </div>

                <div className="pt-4 border-t border-white/10">
                  <p className="text-xs font-bold uppercase tracking-wider text-white/40 mb-4">Update Application Status</p>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { s: 'pending', i: Clock, label: 'Pending' },
                      { s: 'interview', i: Eye, label: 'Interview' },
                      { s: 'approved', i: CheckCircle2, label: 'Approved' },
                      { s: 'scholarship', i: Award, label: 'Scholarship' },
                      { s: 'completed', i: CheckCircle2, label: 'Completed' },
                      { s: 'rejected', i: XCircle, label: 'Rejected' },
                    ].map(({ s, i: Icon, label }) => {
                      const isActive = selected.status === s;
                      const style = statusColor[s];
                      return (
                        <button
                          key={s}
                          onClick={() => updateStatus(selected.id, s)}
                          className={`flex items-center gap-2 px-3 py-2.5 text-xs font-bold rounded-xl transition-all ${isActive ? `${style.bg} ${style.text} ring-1 ring-inset ${style.border.replace('border-', 'ring-')}` : 'bg-white/5 text-white/50 hover:bg-white/10 hover:text-white'}`}
                        >
                          <Icon size={14} className={isActive ? style.text : 'text-white/30'} />
                          {label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
