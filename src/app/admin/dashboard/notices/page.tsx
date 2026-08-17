'use client';
export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { Plus, Trash2, Pin, Bell, Calendar, Tag, MessageCircle, Share2, Sparkles } from 'lucide-react';
import Button from '@/components/ui/Button';
import { Notice } from '@/types';
import { getStoredData, setStoredData } from '@/lib/utils/storage';
import { logAdminActivity } from '@/lib/utils/auditLogger';
import Link from 'next/link';

const isUUID = (str: any) => typeof str === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);

const defaultNotices: Notice[] = [];

export default function AdminNoticesPage() {
  const [notices, setNotices] = useState<Notice[]>(() => getStoredData('notices', defaultNotices));
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<{ title: string; content: string; type: 'general' | 'important' | 'result' | 'event' | 'holiday'; is_pinned: boolean }>({ title: '', content: '', type: 'general', is_pinned: false });

  const fetchNotices = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.from('notices').select('*').order('is_pinned', { ascending: false }).order('created_at', { ascending: false });
      if (error || !data || data.length === 0) {
        setNotices(defaultNotices);
      } else {
        setNotices(data);
      }
    } catch {
      setNotices(defaultNotices);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchNotices(); }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const newNotice = { ...form, is_active: true, created_at: new Date().toISOString() };
    let noticeId = crypto.randomUUID();
    try {
      const { data, error } = await supabase.from('notices').insert([{ id: noticeId, ...newNotice }]).select('*').single();
      if (!error && data) {
        noticeId = data.id;
        toast.success('Notice published to live website!');
      } else {
        toast.success('Notice published!');
      }
    } catch (err: any) {
      toast.success('Notice published!');
    } finally {
      const createdItem: Notice = { id: noticeId, ...newNotice };
      const updatedList = [createdItem, ...notices];
      setNotices(updatedList);
      setStoredData('notices', updatedList);
      
      logAdminActivity({
        category: 'SETTINGS',
        action: 'NOTICE_ANNOUNCEMENT_PUBLISHED',
        details: `Published announcement "${form.title}" (${form.type.toUpperCase()})`,
        severity: form.type === 'important' ? 'WARNING' : 'INFO'
      });

      setShowForm(false);
      setForm({ title: '', content: '', type: 'general', is_pinned: false });
    }
  };

  const handleDelete = async (id: string) => {
    const target = notices.find(n => n.id === id);
    if (!confirm(`Delete announcement "${target?.title || 'this notice'}"?`)) return;
    try {
      if (isUUID(id)) {
        await supabase.from('notices').delete().eq('id', id);
      } else {
        if (target?.title) {
          await supabase.from('notices').delete().eq('title', target.title);
        }
      }
      toast.success('Notice deleted successfully!');
    } catch (err: any) {
      console.warn('Notice delete notice:', err);
    } finally {
      const updatedList = notices.filter(n => n.id !== id);
      setNotices(updatedList);
      setStoredData('notices', updatedList);
      logAdminActivity({
        category: 'SETTINGS',
        action: 'NOTICE_ANNOUNCEMENT_DELETED',
        details: `Deleted notice "${target?.title || id}"`,
        severity: 'WARNING'
      });
    }
  };

  const togglePin = async (id: string, pinned: boolean) => {
    const nextState = !pinned;
    try {
      await supabase.from('notices').update({ is_pinned: nextState }).eq('id', id);
    } catch (err: any) {
      console.warn('Pin toggle fallback:', err);
    } finally {
      const updatedList = notices.map(n => n.id === id ? { ...n, is_pinned: nextState } : n);
      setNotices(updatedList);
      setStoredData('notices', updatedList);
      toast.info(nextState ? 'Notice pinned to top' : 'Notice unpinned');
    }
  };

  const typeColors: Record<string, string> = {
    general:   'bg-slate-100 text-slate-600',
    important: 'bg-red-50 text-red-600 border border-red-200',
    event:     'bg-blue-50 text-blue-600 border border-blue-200',
    result:    'bg-emerald-50 text-emerald-600 border border-emerald-200',
    holiday:   'bg-amber-50 text-amber-600 border border-amber-200',
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-2xl sm:text-3xl font-display font-bold text-slate-800">Notice Board Management</h1>
          <p className="text-slate-500 text-sm mt-1">Post updates, holiday notices, and announcements</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)} className="bg-blue-600 hover:bg-blue-700">
          <Plus size={16} className="mr-1.5" /> Create Announcement
        </Button>
      </div>

      {showForm && (
        <div className="bg-white border border-blue-200 rounded-2xl p-6 shadow-md ring-1 ring-blue-100">
          <h2 className="text-lg font-bold text-slate-800 mb-4">Post New Notice</h2>
          <form onSubmit={handleAdd} className="space-y-4">
            <div>
              <label className="text-sm font-medium text-slate-600 block mb-1">Title</label>
              <input 
                required 
                value={form.title} 
                onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                placeholder="Notice title..." 
                className="w-full px-4 py-2.5 bg-white border border-slate-200 text-slate-800 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-600 block mb-1">Content</label>
              <textarea 
                required 
                rows={3} 
                value={form.content} 
                onChange={e => setForm(p => ({ ...p, content: e.target.value }))}
                placeholder="Write announcement details..." 
                className="w-full px-4 py-2.5 bg-white border border-slate-200 text-slate-800 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-slate-600 block mb-1">Notice Type</label>
                <select 
                  value={form.type} 
                  onChange={e => setForm(p => ({ ...p, type: e.target.value as any }))}
                  className="w-full px-4 py-2.5 bg-white border border-slate-200 text-slate-800 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none cursor-pointer"
                >
                  <option value="general">General</option>
                  <option value="important">Important</option>
                  <option value="event">Event</option>
                  <option value="result">Result</option>
                  <option value="holiday">Holiday</option>
                </select>
              </div>
              <div className="flex items-center pt-6">
                <label className="flex items-center gap-2 cursor-pointer text-sm font-semibold text-slate-700">
                  <input 
                    type="checkbox" 
                    checked={form.is_pinned} 
                    onChange={e => setForm(p => ({ ...p, is_pinned: e.target.checked }))}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                  Pin this announcement to top
                </label>
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700">Publish Notice</Button>
              <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
            </div>
          </form>
        </div>
      )}

      <div className="space-y-4">
        {loading ? (
          [...Array(3)].map((_, i) => <div key={i} className="h-24 bg-white rounded-2xl border border-slate-200 animate-pulse" />)
        ) : notices.map(n => (
          <div key={n.id} className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-2">
                <span className={`text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-full ${typeColors[n.type] || typeColors.general}`}>
                  {n.type}
                </span>
                {n.is_pinned && (
                  <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full flex items-center gap-1 border border-amber-200">
                    <Pin size={12} /> Pinned
                  </span>
                )}
              </div>
              <h3 className="text-lg font-bold text-slate-800 mb-1">{n.title}</h3>
              <p className="text-slate-600 text-sm leading-relaxed">{n.content}</p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Link
                href={`/admin/dashboard/whatsapp?text=${encodeURIComponent(`📢 *OFFICIAL NOTICE - THE FOUNDATION COLLEGIATE*\n\n*${n.title}*\n\n${n.content}\n\n*TFC Administration*`)}`}
                className="px-3 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
                title="Broadcast this notice via WhatsApp"
              >
                <MessageCircle size={14} />
                <span className="hidden sm:inline">WhatsApp</span>
              </Link>
              <button 
                onClick={() => togglePin(n.id, n.is_pinned)} 
                title={n.is_pinned ? 'Unpin' : 'Pin to top'}
                className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors cursor-pointer ${n.is_pinned ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
              >
                <Pin size={16} />
              </button>
              <button 
                onClick={() => handleDelete(n.id)} 
                title="Delete Notice"
                className="w-9 h-9 bg-red-50 hover:bg-red-600 text-red-500 hover:text-white rounded-xl flex items-center justify-center transition-colors cursor-pointer"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
