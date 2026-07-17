'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { Plus, Trash2, Pin } from 'lucide-react';
import Button from '@/components/ui/Button';
import { formatRelativeTime } from '@/lib/utils/grades';

export default function AdminNoticesPage() {
  const [notices, setNotices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', content: '', type: 'general', is_pinned: false });

  const fetch = async () => {
    setLoading(true);
    const { data } = await supabase.from('notices').select('*').order('is_pinned', { ascending: false }).order('created_at', { ascending: false });
    setNotices(data || []);
    setLoading(false);
  };

  useEffect(() => { fetch(); }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.from('notices').insert([form]);
    if (error) { toast.error('Failed to add notice'); return; }
    toast.success('Notice posted!');
    setShowForm(false);
    setForm({ title: '', content: '', type: 'general', is_pinned: false });
    fetch();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this notice?')) return;
    await supabase.from('notices').delete().eq('id', id);
    toast.success('Notice deleted');
    fetch();
  };

  const togglePin = async (id: string, pinned: boolean) => {
    await supabase.from('notices').update({ is_pinned: !pinned }).eq('id', id);
    fetch();
  };

  const typeColors: Record<string, string> = {
    general: 'bg-slate-700 text-slate-300',
    important: 'bg-red-500/20 text-red-400',
    event: 'bg-blue-500/20 text-blue-400',
    result: 'bg-green-500/20 text-green-400',
    holiday: 'bg-amber-500/20 text-amber-400',
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-white">Notice Board</h1>
          <p className="text-slate-400 text-sm mt-1">{notices.length} notices</p>
        </div>
        <Button size="sm" onClick={() => setShowForm(!showForm)}>
          <Plus size={16} /> Post Notice
        </Button>
      </div>

      {showForm && (
        <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6">
          <h2 className="font-bold text-white mb-4">Post New Notice</h2>
          <form onSubmit={handleAdd} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-slate-300 block mb-1.5">Title *</label>
                <input required value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                  placeholder="Notice title" className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 text-white rounded-xl focus:ring-2 focus:ring-primary focus:outline-none text-sm" />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-300 block mb-1.5">Type</label>
                <select value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value }))}
                  className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 text-white rounded-xl focus:ring-2 focus:ring-primary focus:outline-none text-sm">
                  {['general', 'important', 'event', 'result', 'holiday'].map(t => (
                    <option key={t} value={t} className="capitalize">{t}</option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-300 block mb-1.5">Content *</label>
              <textarea required value={form.content} onChange={e => setForm(p => ({ ...p, content: e.target.value }))}
                rows={4} placeholder="Notice content..."
                className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 text-white rounded-xl focus:ring-2 focus:ring-primary focus:outline-none text-sm resize-none" />
            </div>
            <div className="flex items-center gap-3">
              <input type="checkbox" id="pin" checked={form.is_pinned}
                onChange={e => setForm(p => ({ ...p, is_pinned: e.target.checked }))}
                className="w-4 h-4 accent-primary" />
              <label htmlFor="pin" className="text-sm text-slate-300 cursor-pointer">Pin this notice to the top</label>
            </div>
            <div className="flex gap-3">
              <Button type="submit" size="sm">Post Notice</Button>
              <Button type="button" variant="ghost" size="sm" className="text-slate-400 hover:text-white" onClick={() => setShowForm(false)}>Cancel</Button>
            </div>
          </form>
        </div>
      )}

      <div className="space-y-4">
        {loading ? (
          [...Array(4)].map((_, i) => <div key={i} className="skeleton h-24 rounded-2xl" />)
        ) : notices.length === 0 ? (
          <div className="text-center py-16 text-slate-500">No notices yet. Post your first one!</div>
        ) : notices.map(notice => (
          <div key={notice.id} className={`bg-slate-900 border rounded-2xl p-5 flex items-start gap-4 ${notice.is_pinned ? 'border-amber-500/30' : 'border-slate-800'}`}>
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-2">
                {notice.is_pinned && <span className="text-xs text-amber-400 font-bold">📌 PINNED</span>}
                <span className={`text-xs font-bold uppercase px-2 py-0.5 rounded-full ${typeColors[notice.type]}`}>{notice.type}</span>
                <span className="text-xs text-slate-500">{formatRelativeTime(notice.created_at)}</span>
              </div>
              <h3 className="font-bold text-white mb-1">{notice.title}</h3>
              <p className="text-sm text-slate-400 line-clamp-2">{notice.content}</p>
            </div>
            <div className="flex gap-2 shrink-0">
              <button onClick={() => togglePin(notice.id, notice.is_pinned)}
                className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${notice.is_pinned ? 'bg-amber-500/20 text-amber-400' : 'bg-slate-800 text-slate-500 hover:text-amber-400'}`}>
                <Pin size={16} />
              </button>
              <button onClick={() => handleDelete(notice.id)}
                className="w-9 h-9 bg-slate-800 hover:bg-red-600 text-slate-400 hover:text-white rounded-xl flex items-center justify-center transition-colors">
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
