'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { Plus, Trash2, Pencil, Search, Loader2, BookOpen, Eye, EyeOff, AlertTriangle } from 'lucide-react';
import Button from '@/components/ui/Button';
import { Course } from '@/types';
import { motion, AnimatePresence } from 'framer-motion';

interface CourseForm {
  name: string;
  level: string;
  classes: string;
  description: string;
  subjects: string; // comma-separated in the form, converted to TEXT[] on save
  fee_per_month: string;
  icon: string;
  is_active: boolean;
  display_order: string;
}

const emptyForm: CourseForm = {
  name: '', level: '', classes: '', description: '', subjects: '',
  fee_per_month: '', icon: '', is_active: true, display_order: '0',
};

export default function AdminCoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Course | null>(null);
  const [search, setSearch] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState<CourseForm>(emptyForm);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      setError(null);
      const { data, error } = await supabase.from('courses').select('*').order('display_order').order('name');
      if (error) throw error;
      setCourses((data as Course[]) || []);
    } catch (err) {
      console.error(err);
      setError('Failed to load courses. Check your connection and try again.');
      toast.error('Failed to load courses');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCourses(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const payload = {
        name: form.name.trim(),
        level: form.level.trim(),
        classes: form.classes.trim(),
        description: form.description.trim() || null,
        subjects: form.subjects.split(',').map(s => s.trim()).filter(Boolean),
        fee_per_month: form.fee_per_month === '' ? null : Number(form.fee_per_month),
        icon: form.icon.trim() || null,
        is_active: form.is_active,
        display_order: Number(form.display_order) || 0,
      };

      if (editing) {
        const { error } = await supabase.from('courses').update(payload).eq('id', editing.id);
        if (error) throw error;
        toast.success('Course updated!');
      } else {
        const { error } = await supabase.from('courses').insert([payload]);
        if (error) throw error;
        toast.success('Course added!');
      }
      setShowForm(false);
      setEditing(null);
      setForm(emptyForm);
      fetchCourses();
    } catch (err) {
      console.error(err);
      toast.error(editing ? 'Update failed' : 'Failed to add course. Make sure database is configured.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (course: Course) => {
    setEditing(course);
    setForm({
      name: course.name,
      level: course.level || '',
      classes: course.classes || '',
      description: course.description || '',
      subjects: (course.subjects || []).join(', '),
      fee_per_month: course.fee_per_month != null ? String(course.fee_per_month) : '',
      icon: course.icon || '',
      is_active: course.is_active,
      display_order: String(course.display_order ?? 0),
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this course?')) return;
    try {
      const { error } = await supabase.from('courses').delete().eq('id', id);
      if (error) throw error;
      toast.success('Course deleted');
      fetchCourses();
    } catch (err) {
      console.error(err);
      toast.error('Failed to delete course');
    }
  };

  const toggleActive = async (course: Course) => {
    try {
      const { error } = await supabase.from('courses').update({ is_active: !course.is_active }).eq('id', course.id);
      if (error) throw error;
      toast.success(course.is_active ? 'Course hidden' : 'Course activated');
      fetchCourses();
    } catch (err) {
      console.error(err);
      toast.error('Failed to update course');
    }
  };

  const filteredCourses = courses.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    (c.level || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#0a0f1e] p-6 rounded-2xl border border-white/5">
        <div>
          <h1 className="text-2xl font-display font-bold text-white">Courses Management</h1>
          <p className="text-white/50 text-sm mt-1">Manage programs, subjects, and fees</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" size={16} />
            <input
              type="text"
              placeholder="Search courses..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9 pr-4 py-2 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#0057FF] w-full sm:w-64 transition-all"
            />
          </div>
          <Button size="sm" onClick={() => { setEditing(null); setShowForm(!showForm); setForm(emptyForm); }} className="bg-[#0057FF] hover:bg-blue-600">
            <Plus size={16} /> Add Course
          </Button>
        </div>
      </div>

      {/* Error banner */}
      {error && (
        <div className="flex items-center gap-3 bg-[#D72638]/10 border border-[#D72638]/30 text-red-300 rounded-2xl p-4 text-sm">
          <AlertTriangle size={18} className="shrink-0" />
          <p className="flex-1">{error}</p>
          <button onClick={fetchCourses} className="font-semibold text-white hover:underline shrink-0">Retry</button>
        </div>
      )}

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
                {editing ? 'Edit Course Details' : 'Add New Course'}
              </h2>
              <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                <div>
                  <label className="text-sm font-medium text-white/70 block mb-1.5">Title <span className="text-red-400">*</span></label>
                  <input required value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                    placeholder="e.g. Matric Science Program"
                    className="w-full px-4 py-2.5 bg-background border border-white/10 text-white rounded-xl focus:ring-2 focus:ring-[#0057FF] focus:outline-none text-sm transition-all" />
                </div>
                <div>
                  <label className="text-sm font-medium text-white/70 block mb-1.5">Level <span className="text-red-400">*</span></label>
                  <input required value={form.level} onChange={e => setForm(p => ({ ...p, level: e.target.value }))}
                    placeholder="e.g. Matric, Intermediate"
                    className="w-full px-4 py-2.5 bg-background border border-white/10 text-white rounded-xl focus:ring-2 focus:ring-[#0057FF] focus:outline-none text-sm transition-all" />
                </div>
                <div>
                  <label className="text-sm font-medium text-white/70 block mb-1.5">Classes <span className="text-red-400">*</span></label>
                  <input required value={form.classes} onChange={e => setForm(p => ({ ...p, classes: e.target.value }))}
                    placeholder="e.g. Class 9 - 10"
                    className="w-full px-4 py-2.5 bg-background border border-white/10 text-white rounded-xl focus:ring-2 focus:ring-[#0057FF] focus:outline-none text-sm transition-all" />
                </div>
                <div>
                  <label className="text-sm font-medium text-white/70 block mb-1.5">Fee / Month (PKR)</label>
                  <input type="number" min="0" value={form.fee_per_month} onChange={e => setForm(p => ({ ...p, fee_per_month: e.target.value }))}
                    placeholder="e.g. 3500"
                    className="w-full px-4 py-2.5 bg-background border border-white/10 text-white rounded-xl focus:ring-2 focus:ring-[#0057FF] focus:outline-none text-sm transition-all" />
                </div>
                <div>
                  <label className="text-sm font-medium text-white/70 block mb-1.5">Icon</label>
                  <input value={form.icon} onChange={e => setForm(p => ({ ...p, icon: e.target.value }))}
                    placeholder="e.g. book, flask, calculator"
                    className="w-full px-4 py-2.5 bg-background border border-white/10 text-white rounded-xl focus:ring-2 focus:ring-[#0057FF] focus:outline-none text-sm transition-all" />
                </div>
                <div>
                  <label className="text-sm font-medium text-white/70 block mb-1.5">Display Order</label>
                  <input type="number" value={form.display_order} onChange={e => setForm(p => ({ ...p, display_order: e.target.value }))}
                    className="w-full px-4 py-2.5 bg-background border border-white/10 text-white rounded-xl focus:ring-2 focus:ring-[#0057FF] focus:outline-none text-sm transition-all" />
                </div>
                <div className="sm:col-span-2 lg:col-span-3">
                  <label className="text-sm font-medium text-white/70 block mb-1.5">Subjects (comma-separated)</label>
                  <input value={form.subjects} onChange={e => setForm(p => ({ ...p, subjects: e.target.value }))}
                    placeholder="e.g. Physics, Chemistry, Biology, Mathematics"
                    className="w-full px-4 py-2.5 bg-background border border-white/10 text-white rounded-xl focus:ring-2 focus:ring-[#0057FF] focus:outline-none text-sm transition-all" />
                </div>
                <div className="sm:col-span-2 lg:col-span-3">
                  <label className="text-sm font-medium text-white/70 block mb-1.5">Description (Optional)</label>
                  <textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                    rows={3} placeholder="Short description of the course..."
                    className="w-full px-4 py-2.5 bg-background border border-white/10 text-white rounded-xl focus:ring-2 focus:ring-[#0057FF] focus:outline-none text-sm resize-none transition-all" />
                </div>
                <div className="sm:col-span-2 lg:col-span-3 flex items-center gap-3">
                  <input type="checkbox" id="course-active" checked={form.is_active}
                    onChange={e => setForm(p => ({ ...p, is_active: e.target.checked }))}
                    className="w-4 h-4 accent-[#0057FF]" />
                  <label htmlFor="course-active" className="text-sm text-white/70 cursor-pointer">Active (visible on the public site)</label>
                </div>
                <div className="sm:col-span-2 lg:col-span-3 flex gap-3 pt-2">
                  <Button type="submit" disabled={submitting} className="bg-[#0057FF] hover:bg-blue-600 min-w-[120px]">
                    {submitting ? <Loader2 size={16} className="animate-spin" /> : (editing ? 'Save Changes' : 'Add Course')}
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
          [...Array(6)].map((_, i) => <div key={i} className="h-44 rounded-2xl bg-white/5 animate-pulse border border-white/5" />)
        ) : filteredCourses.length === 0 ? (
          <div className="col-span-full flex flex-col items-center justify-center py-20 bg-[#0a0f1e] rounded-2xl border border-white/5">
            <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4 text-white/20">
              <BookOpen size={24} />
            </div>
            <h3 className="text-white font-medium">No courses found</h3>
            <p className="text-white/40 text-sm mt-1">Try adjusting your search or add a new course.</p>
          </div>
        ) : filteredCourses.map((c, i) => (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            key={c.id}
            className={`group bg-[#0a0f1e] border border-white/5 hover:border-[#0057FF]/30 rounded-2xl p-5 flex flex-col gap-3 transition-all hover:shadow-[0_8px_30px_rgba(0,0,0,0.3)] ${!c.is_active ? 'opacity-60' : ''}`}
          >
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-[#001F54] to-[#0057FF] flex items-center justify-center text-white shrink-0 shadow-inner">
                <BookOpen size={20} />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-white truncate group-hover:text-[#0057FF] transition-colors">{c.name}</h3>
                <p className="text-[#FFD700] text-sm font-medium">{c.level} &middot; {c.classes}</p>
              </div>
              <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full shrink-0 ${c.is_active ? 'bg-green-500/20 text-green-400' : 'bg-white/5 text-white/40'}`}>
                {c.is_active ? 'Active' : 'Hidden'}
              </span>
            </div>

            {(c.subjects || []).length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {c.subjects.slice(0, 5).map(s => (
                  <span key={s} className="text-xs bg-white/5 text-white/60 px-2 py-0.5 rounded-full">{s}</span>
                ))}
                {c.subjects.length > 5 && <span className="text-xs text-white/40 px-1">+{c.subjects.length - 5} more</span>}
              </div>
            )}

            <div className="flex items-center justify-between mt-auto pt-2">
              <p className="text-sm text-white/50">
                {c.fee_per_month != null ? <><span className="text-white font-semibold">Rs. {c.fee_per_month.toLocaleString()}</span>/month</> : 'Fee not set'}
              </p>
              <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => toggleActive(c)} title={c.is_active ? 'Hide course' : 'Activate course'}
                  className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${c.is_active ? 'bg-white/5 hover:bg-amber-500/20 text-white/70 hover:text-amber-400' : 'bg-white/5 hover:bg-green-500/20 text-white/70 hover:text-green-400'}`}>
                  {c.is_active ? <EyeOff size={12} /> : <Eye size={12} />}
                </button>
                <button onClick={() => handleEdit(c)} className="w-8 h-8 bg-white/5 hover:bg-[#0057FF] text-white/70 hover:text-white rounded-lg flex items-center justify-center transition-colors">
                  <Pencil size={12} />
                </button>
                <button onClick={() => handleDelete(c.id)} className="w-8 h-8 bg-white/5 hover:bg-[#D72638] text-white/70 hover:text-white rounded-lg flex items-center justify-center transition-colors">
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
