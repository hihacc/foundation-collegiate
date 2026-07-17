'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { Check, X, Eye, Search, MessageSquare } from 'lucide-react';
import { formatRelativeTime } from '@/lib/utils/grades';

export default function AdminAdmissionsPage() {
  const [admissions, setAdmissions] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<any | null>(null);

  const fetch = async () => {
    setLoading(true);
    const { data } = await supabase.from('admissions').select('*').order('created_at', { ascending: false });
    setAdmissions(data || []);
    setLoading(false);
  };

  useEffect(() => { fetch(); }, []);

  const updateStatus = async (id: string, status: string) => {
    const { error } = await supabase.from('admissions').update({ status }).eq('id', id);
    if (error) { toast.error('Update failed'); return; }
    toast.success(`Status updated to ${status}`);
    fetch();
    if (selected?.id === id) setSelected({ ...selected, status });
  };

  const statusColor: Record<string, string> = {
    pending: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    approved: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    rejected: 'bg-red-500/20 text-red-400 border-red-500/30',
    interview: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    scholarship: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    completed: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
  };

  const filtered = admissions.filter(a =>
    a.student_name?.toLowerCase().includes(search.toLowerCase()) ||
    a.parent_phone?.includes(search)
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-white">Admissions Management</h1>
          <p className="text-slate-400 text-sm mt-1">{admissions.length} total applications</p>
        </div>
      </div>

      <div className="relative">
        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search by student name or phone..."
          className="w-full pl-11 pr-4 py-3 bg-slate-900 border border-slate-800 text-white placeholder:text-slate-500 rounded-xl focus:ring-2 focus:ring-primary focus:outline-none"
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Table */}
        <div className="xl:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-800">
                  {['Student', 'Program', 'Phone', 'Status', 'Applied', 'Action'].map(h => (
                    <th key={h} className="text-left px-4 py-4 text-xs font-bold uppercase tracking-wider text-slate-400">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {loading ? (
                  [...Array(6)].map((_, i) => (
                    <tr key={i}>{[...Array(6)].map((_, j) => (<td key={j} className="px-4 py-4"><div className="skeleton h-5 rounded w-20" /></td>))}</tr>
                  ))
                ) : filtered.length === 0 ? (
                  <tr><td colSpan={6} className="text-center py-12 text-slate-500">No applications found</td></tr>
                ) : filtered.map(adm => (
                  <tr key={adm.id} className={`hover:bg-slate-800/50 transition-colors cursor-pointer ${selected?.id === adm.id ? 'bg-slate-800/70' : ''}`}
                    onClick={() => setSelected(adm)}>
                    <td className="px-4 py-3">
                      <div className="font-medium text-white">{adm.student_name}</div>
                      <div className="text-xs text-slate-400">{adm.father_name}</div>
                    </td>
                    <td className="px-4 py-3 text-slate-300 text-xs">{adm.class_applied}</td>
                    <td className="px-4 py-3 text-slate-300 text-xs">{adm.parent_phone}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${statusColor[adm.status] || statusColor.pending}`}>{adm.status}</span>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500">{formatRelativeTime(adm.created_at)}</td>
                    <td className="px-4 py-3">
                      <button className="w-8 h-8 bg-slate-800 hover:bg-primary text-slate-400 hover:text-white rounded-lg flex items-center justify-center transition-colors">
                        <Eye size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Detail Panel */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
          {!selected ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-600 text-center py-10">
              <Eye size={40} className="mb-3 opacity-30" />
              <p>Click a row to view details</p>
            </div>
          ) : (
            <div className="space-y-5">
              <div>
                <h2 className="text-lg font-bold text-white">{selected.student_name}</h2>
                <p className="text-slate-400 text-sm">{selected.class_applied}</p>
              </div>

              <div className="space-y-3 text-sm">
                {[
                  ['Father', selected.father_name],
                  ['Phone', selected.parent_phone],
                  ['Email', selected.parent_email || 'N/A'],
                  ['Address', selected.address],
                  ['Previous School', selected.previous_school || 'N/A'],
                  ['Applied', new Date(selected.created_at).toLocaleDateString()],
                ].map(([label, val]) => (
                  <div key={label} className="flex flex-col">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500">{label}</span>
                    <span className="text-slate-300 mt-0.5">{val}</span>
                  </div>
                ))}
              </div>

              <div className="pt-4 border-t border-slate-800">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">Update Status</p>
                <div className="grid grid-cols-2 gap-2">
                  {['approved', 'rejected', 'interview', 'pending'].map(status => (
                    <button key={status}
                      onClick={() => updateStatus(selected.id, status)}
                      className={`px-3 py-2 text-xs font-bold rounded-xl capitalize border transition-all hover:-translate-y-0.5 ${statusColor[status]}`}
                    >
                      {status}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
