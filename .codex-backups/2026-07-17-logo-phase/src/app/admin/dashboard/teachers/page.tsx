'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { Plus, Trash2, Pencil, Search, Loader2 } from 'lucide-react';
import Button from '@/components/ui/Button';
import { Teacher } from '@/lib/types';
import { motion, AnimatePresence } from 'framer-motion';

export default function AdminTeachersPage() {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Teacher | null>(null);
  const [search, setSearch] = useState('');
  const [submitting, setSubmitting] = useState(false);
  
  const [form, setForm] = useState<Partial<Teacher>>({ 
    name: '', subject: '', qualification: '', experience_years: 0, bio: '', is_active: true 
  });

  const fetchTeachers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.from('teachers').select('*').order('display_order').order('name');
      if (error) throw error;
      setTeachers(data as Teacher[] || []);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load teachers');
      // Mock data fallback if Supabase is not configured
      if (!teachers.length) {
        setTeachers([
          { id: '1', name: 'Ahmed Khan', subject: 'Physics', qualification: 'M.Sc Physics', experience_years: 10, bio: '', is_active: true }
        ]);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTeachers(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    
    try {
      const payload = { ...form, experience_years: Number(form.experience_years) || 0 };
      
      if (editing) {
        const { error } = await supabase.from('teachers').update(payload).eq('id', editing.id);
        if (error) throw error;
        toast.success('Teacher updated!');
      } else {
        const { error } = await supabase.from('teachers').insert([payload]);
        if (error) throw error;
        toast.success('Teacher added!');
      }
      setShowForm(false); 
      setEditing(null);
      setForm({ name: '', subject: '', qualification: '', experience_years: 0, bio: '', is_active: true });
      fetchTeachers();
    } catch (err) {
      console.error(err);
      toast.error(editing ? 'Update failed' : 'Failed to add teacher. Make sure database is configured.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Remove this teacher?')) return;
    try {
      const { error } = await supabase.from('teachers').delete().eq('id', id);
      if (error) throw error;
      toast.success('Teacher removed');
      fetchTeachers();
    } catch (err) {
      console.error(err);
      toast.error('Failed to delete teacher');
    }
  };

  const handleEdit = (teacher: Teacher) => {
    setEditing(teacher);
    setForm({ 
      name: teacher.name, 
      subject: teacher.subject, 
      qualification: teacher.qualification || '', 
      experience_years: teacher.experience_years || 0, 
      bio: teacher.bio || '', 
      is_active: teacher.is_active 
    });
    setShowForm(true);
  };

  const filteredTeachers = teachers.filter(t => 
    t.name.toLowerCase().includes(search.toLowerCase()) || 
    t.subject.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#0a0f1e] p-6 rounded-2xl border border-white/5">
        <div>
          <h1 className="text-2xl font-display font-bold text-white">Faculty Management</h1>
          <p className="text-white/50 text-sm mt-1">Manage teachers, subjects, and profiles</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" size={16} />
            <input 
              type="text" 
              placeholder="Search faculty..." 
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9 pr-4 py-2 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#0057FF] w-full sm:w-64 transition-all"
            />
          </div>
          <Button size="sm" onClick={() => { setEditing(null); setShowForm(!showForm); setForm({ name: '', subject: '', qualification: '', experience_years: 0, bio: '', is_active: true }); }} className="bg-[#0057FF] hover:bg-blue-600">
            <Plus size={16} /> Add Teacher
          </Button>
        </div>
      </div>

      {/* Form */}
      <AnimatePresence>
        {showForm && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-[#0a0f1e] border border-[#0057FF]/20 rounded-2xl p-6 shadow-[0_0_30px_rgba(0,87,255,0.1)] mb-6">
              <h2 className="font-bold text-white mb-5 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#0057FF]"></span>
                {editing ? 'Edit Teacher Details' : 'Add New Teacher'}
              </h2>
              <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {[
                  { label: 'Full Name', key: 'name', required: true },
                  { label: 'Subject(s)', key: 'subject', required: true },
                  { label: 'Qualification', key: 'qualification' },
                  { label: 'Experience (Years)', key: 'experience_years', type: 'number' },
                ].map(({ label, key, required, type }) => (
                  <div key={key}>
                    <label className="text-sm font-medium text-white/70 block mb-1.5">{label} {required && <span className="text-red-400">*</span>}</label>
                    <input
                      required={required}
                      type={type || 'text'}
                      value={form[key as keyof Teacher] as string | number || ''}
                      onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))}
                      className="w-full px-4 py-2.5 bg-background border border-white/10 text-white rounded-xl focus:ring-2 focus:ring-[#0057FF] focus:outline-none text-sm transition-all"
                    />
                  </div>
                ))}
                <div className="sm:col-span-2 lg:col-span-3">
                  <label className="text-sm font-medium text-white/70 block mb-1.5">Bio (Optional)</label>
                  <textarea 
                    value={form.bio} 
                    onChange={e => setForm(p => ({ ...p, bio: e.target.value }))}
                    rows={3} 
                    placeholder="Short description about the teacher..."
                    className="w-full px-4 py-2.5 bg-background border border-white/10 text-white rounded-xl focus:ring-2 focus:ring-[#0057FF] focus:outline-none text-sm resize-none transition-all" 
                  />
                </div>
                <div className="sm:col-span-2 lg:col-span-3 flex gap-3 pt-2">
                  <Button type="submit" disabled={submitting} className="bg-[#0057FF] hover:bg-blue-600 min-w-[120px]">
                    {submitting ? <Loader2 size={16} className="animate-spin" /> : (editing ? 'Save Changes' : 'Add Teacher')}
                  </Button>
                  <Button type="button" variant="outline" className="border-white/10 text-white/70 hover:text-white hover:bg-white/5" onClick={() => { setShowForm(false); setEditing(null); }}>
                    Cancel
                  </Button>
                </div>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {loading ? (
          [...Array(6)].map((_, i) => <div key={i} className="h-32 rounded-2xl bg-white/5 animate-pulse border border-white/5" />)
        ) : filteredTeachers.length === 0 ? (
          <div className="col-span-full flex flex-col items-center justify-center py-20 bg-[#0a0f1e] rounded-2xl border border-white/5">
            <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4 text-white/20">
              <Search size={24} />
            </div>
            <h3 className="text-white font-medium">No teachers found</h3>
            <p className="text-white/40 text-sm mt-1">Try adjusting your search or add a new teacher.</p>
          </div>
        ) : filteredTeachers.map((t, i) => (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            key={t.id} 
            className="group bg-[#0a0f1e] border border-white/5 hover:border-[#0057FF]/30 rounded-2xl p-5 flex gap-4 transition-all hover:shadow-[0_8px_30px_rgba(0,0,0,0.3)]"
          >
            <div className="w-14 h-14 rounded-xl bg-gradient-to-tr from-[#001F54] to-[#0057FF] flex items-center justify-center text-white text-xl font-bold shrink-0 shadow-inner">
              {t.name[0]}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-white truncate group-hover:text-[#0057FF] transition-colors">{t.name}</h3>
              <p className="text-[#FFD700] text-sm font-medium">{t.subject}</p>
              {t.qualification && <p className="text-xs text-white/50 mt-1 truncate">{t.qualification}</p>}
              {t.experience_years > 0 && <p className="text-xs text-white/50">{t.experience_years} yrs experience</p>}
              
              <div className="flex gap-2 mt-4 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => handleEdit(t)} className="flex-1 h-8 bg-white/5 hover:bg-[#0057FF] text-white/70 hover:text-white rounded-lg flex items-center justify-center gap-1.5 transition-colors text-xs font-medium">
                  <Pencil size={12} /> Edit
                </button>
                <button onClick={() => handleDelete(t.id)} className="w-8 h-8 bg-white/5 hover:bg-[#D72638] text-white/70 hover:text-white rounded-lg flex items-center justify-center transition-colors">
                  <Trash2 size={12} />
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
