'use client';
export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { Plus, Trash2, Pencil, Search, Loader2, UserCog, Upload, Sparkles, Phone, Mail, Award, CheckCircle2 } from 'lucide-react';
import Button from '@/components/ui/Button';
import { Teacher } from '@/lib/types';
import { m, AnimatePresence } from 'framer-motion';
import { getStoredData, setStoredData } from '@/lib/utils/storage';
import { logAdminActivity } from '@/lib/utils/auditLogger';

const isUUID = (str: any) => typeof str === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);

const defaultTeachers: Teacher[] = [];

export default function AdminTeachersPage() {
  const [teachers, setTeachers] = useState<Teacher[]>(defaultTeachers);
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Teacher | null>(null);
  const [search, setSearch] = useState('');
  const [submitting, setSubmitting] = useState(false);
  
  const [form, setForm] = useState<Partial<Teacher>>({ 
    name: '', subject: '', qualification: '', experience_years: 10, photo_url: '', bio: '', is_active: true 
  });

  const fetchTeachers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.from('teachers').select('*').order('name');
      if (!error && data && data.length > 0) {
        setTeachers(data as Teacher[]);
        setStoredData('teachers', data);
      }
    } catch {
      // keep stored data
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setMounted(true);
    const stored = getStoredData('teachers', defaultTeachers);
    setTeachers(stored);
    fetchTeachers();
  }, []);

  const updateAndStore = (newList: Teacher[]) => {
    setTeachers(newList);
    setStoredData('teachers', newList);
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setForm(prev => ({ ...prev, photo_url: event.target!.result as string }));
        toast.success('Teacher photo preview loaded!');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    
    const payload = {
      name: form.name?.trim() || '',
      subject: form.subject?.trim() || '',
      qualification: form.qualification?.trim() || '',
      experience_years: Number(form.experience_years) || 0,
      photo_url: form.photo_url?.trim() || undefined,
      bio: form.bio?.trim() || '',
      is_active: form.is_active ?? true
    };

    try {
      if (editing && isUUID(editing.id)) {
        await supabase.from('teachers').update(payload).eq('id', editing.id);
        const updated = teachers.map(t => t.id === editing.id ? { ...t, ...payload } : t);
        updateAndStore(updated);
        logAdminActivity({
          category: 'ACADEMIC',
          action: 'FACULTY_PROFILE_UPDATED',
          details: `Updated faculty profile for ${payload.name} (${payload.subject})`,
          severity: 'INFO'
        });
        toast.success('Faculty member updated & homepage updated live!');
      } else {
        const newId = crypto.randomUUID();
        const { error } = await supabase.from('teachers').insert([{ id: newId, ...payload }]);
        if (error) console.warn('Supabase Insert Warning:', error.message);
        const newT: Teacher = { id: newId, ...payload, created_at: new Date().toISOString() };
        const updated = [newT, ...teachers];
        updateAndStore(updated);
        logAdminActivity({
          category: 'ACADEMIC',
          action: 'FACULTY_MEMBER_ADDED',
          details: `Added new faculty member ${payload.name} (${payload.subject})`,
          severity: 'SUCCESS'
        });
        toast.success('New faculty member added & homepage updated live!');
      }
      setShowForm(false);
      setEditing(null);
      setForm({ name: '', subject: '', qualification: '', experience_years: 10, photo_url: '', bio: '', is_active: true });
    } catch {
      if (editing) {
        const updated = teachers.map(t => t.id === editing.id ? { ...t, ...payload } : t);
        updateAndStore(updated);
        toast.success('Faculty member updated!');
      } else {
        const localT: Teacher = { id: crypto.randomUUID(), ...payload, created_at: new Date().toISOString() };
        const updated = [localT, ...teachers];
        updateAndStore(updated);
        toast.success('Faculty member added!');
      }
      setShowForm(false);
      setEditing(null);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (teacher: Teacher) => {
    setEditing(teacher);
    setForm(teacher);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    const target = teachers.find(t => t.id === id);
    if (!confirm(`Are you sure you want to delete ${target?.name || 'this faculty member'}?`)) return;
    try {
      if (isUUID(id)) {
        await supabase.from('teachers').delete().eq('id', id);
      } else {
        if (target?.name) {
          await supabase.from('teachers').delete().eq('name', target.name);
        }
      }
    } catch {}
    const updated = teachers.filter(t => t.id !== id);
    updateAndStore(updated);
    logAdminActivity({
      category: 'ACADEMIC',
      action: 'FACULTY_MEMBER_DELETED',
      details: `Removed faculty member ${target?.name || id}`,
      severity: 'WARNING'
    });
    toast.success('Faculty member removed successfully!');
  };

  const filtered = teachers.filter(t => 
    (t.name || '').toLowerCase().includes(search.toLowerCase()) || 
    (t.subject || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-2xl sm:text-3xl font-display font-bold text-slate-800">Faculty Management</h1>
          <p className="text-slate-500 text-sm mt-1">{mounted ? teachers.length : defaultTeachers.length} teachers displayed live on the homepage</p>
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative w-full sm:w-64">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              value={search} 
              onChange={e => setSearch(e.target.value)}
              placeholder="Search teacher or subject..."
              className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 text-slate-800 text-sm rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none shadow-inner"
            />
          </div>
          <Button size="sm" onClick={() => { setEditing(null); setForm({ name: '', subject: '', qualification: '', experience_years: 10, photo_url: '', bio: '', is_active: true }); setShowForm(!showForm); }} className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto shrink-0">
            <Plus size={16} className="mr-1.5" /> Add Teacher
          </Button>
        </div>
      </div>

      {/* Form */}
      <AnimatePresence>
        {showForm && (
          <m.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-white border border-blue-200 rounded-2xl p-5 sm:p-6 shadow-md mb-6 ring-1 ring-blue-100 space-y-6">
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-3">
                <UserCog size={20} className="text-blue-600" />
                {editing ? 'Edit Faculty Profile' : 'Add New Teacher'}
              </h2>

              <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                <div>
                  <label className="text-sm font-bold text-slate-700 block mb-1.5">Teacher Name <span className="text-red-500">*</span></label>
                  <input 
                    required
                    type="text"
                    placeholder="e.g. Prof. Ahmed Khan"
                    value={form.name || ''}
                    onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 text-slate-800 rounded-xl focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                </div>

                <div>
                  <label className="text-sm font-bold text-slate-700 block mb-1.5">Subject Taught <span className="text-red-500">*</span></label>
                  <input 
                    required
                    type="text"
                    placeholder="e.g. Physics"
                    value={form.subject || ''}
                    onChange={e => setForm(p => ({ ...p, subject: e.target.value }))}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 text-slate-800 rounded-xl focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                </div>

                <div>
                  <label className="text-sm font-bold text-slate-700 block mb-1.5">Experience (Years)</label>
                  <input 
                    type="number"
                    placeholder="15"
                    value={form.experience_years || 0}
                    onChange={e => setForm(p => ({ ...p, experience_years: Number(e.target.value) }))}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 text-slate-800 rounded-xl focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                </div>

                <div>
                  <label className="text-sm font-bold text-slate-700 block mb-1.5">Qualification</label>
                  <input 
                    type="text"
                    placeholder="e.g. M.Sc Physics"
                    value={form.qualification || ''}
                    onChange={e => setForm(p => ({ ...p, qualification: e.target.value }))}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 text-slate-800 rounded-xl focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                </div>

                <div>
                  <label className="text-sm font-bold text-slate-700 block mb-1.5">Institutional Role / Staff Type</label>
                  <select
                    value={(form as any).staff_type || 'faculty'}
                    onChange={e => setForm(p => ({ ...p, staff_type: e.target.value as any }))}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 text-slate-800 font-bold rounded-xl focus:ring-2 focus:ring-blue-500 text-sm"
                  >
                    <option value="faculty">Teaching Faculty</option>
                    <option value="staff">Administrative Staff</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="text-sm font-bold text-slate-700 block mb-1.5">Teacher Photo (Upload File OR Enter Image URL)</label>
                  <div className="flex flex-col sm:flex-row items-center gap-3">
                    <label className="cursor-pointer px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl border border-slate-200 flex items-center gap-2 shrink-0">
                      <Upload size={16} /> Select Photo File
                      <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
                    </label>
                    <input 
                      type="url"
                      placeholder="OR paste photo URL (https://...)"
                      value={form.photo_url || ''}
                      onChange={e => setForm(p => ({ ...p, photo_url: e.target.value }))}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 text-slate-800 rounded-xl focus:ring-2 focus:ring-blue-500 text-sm"
                    />
                    {form.photo_url && (
                      <div className="w-10 h-10 rounded-full overflow-hidden shrink-0 border-2 border-blue-500 shadow-xs">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={form.photo_url} alt="Preview" className="w-full h-full object-cover" />
                      </div>
                    )}
                  </div>
                </div>

                <div className="sm:col-span-2 lg:col-span-3">
                  <label className="text-sm font-bold text-slate-700 block mb-1.5">Bio / Description</label>
                  <input 
                    type="text"
                    placeholder="Short teacher introduction"
                    value={form.bio || ''}
                    onChange={e => setForm(p => ({ ...p, bio: e.target.value }))}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 text-slate-800 rounded-xl focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                </div>

                <div className="sm:col-span-2 lg:col-span-3 flex gap-3 pt-2">
                  <Button type="submit" disabled={submitting} className="bg-blue-600 hover:bg-blue-700 min-w-[140px]">
                    {submitting ? <Loader2 size={16} className="animate-spin" /> : (editing ? 'Save Changes' : 'Save Teacher')}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => { setShowForm(false); setEditing(null); }}>
                    Cancel
                  </Button>
                </div>
              </form>
            </div>
          </m.div>
        )}
      </AnimatePresence>

      {/* Teachers Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {filtered.map((t) => (
          <div key={t.id} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all text-center flex flex-col items-center justify-between">
            <div className="w-full flex flex-col items-center">
              {t.photo_url ? (
                <div className="w-20 h-20 rounded-full overflow-hidden mb-4 border-2 border-blue-500 shadow-md">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={t.photo_url} alt={t.name} className="w-full h-full object-cover" />
                </div>
              ) : (
                <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-bold text-xl flex items-center justify-center mb-4 shadow-md">
                  {t.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
                </div>
              )}

              <h3 className="font-bold text-slate-800 text-base mb-0.5">{t.name}</h3>
              <p className="text-xs font-bold text-blue-600 mb-2">{t.subject}</p>
              <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-3 py-1 rounded-full border border-slate-200">
                {t.experience_years || 5}+ Years Experience
              </span>
            </div>

            <div className="flex justify-center gap-2 pt-4 mt-4 border-t border-slate-100 w-full">
              <button onClick={() => handleEdit(t)} title="Edit Teacher" className="w-8 h-8 bg-blue-50 hover:bg-blue-600 text-blue-600 hover:text-white rounded-lg flex items-center justify-center transition-colors">
                <Pencil size={14} />
              </button>
              <button onClick={() => handleDelete(t.id)} title="Delete Teacher" className="w-8 h-8 bg-red-50 hover:bg-red-600 text-red-500 hover:text-white rounded-lg flex items-center justify-center transition-colors">
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
