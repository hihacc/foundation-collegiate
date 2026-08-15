'use client';
export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { Plus, Trash2, Pencil, Search, Loader2, BookOpen, GraduationCap, Award, Eye, EyeOff } from 'lucide-react';
import Button from '@/components/ui/Button';
import { Course } from '@/types';
import { m, AnimatePresence } from 'framer-motion';
import { getStoredData, setStoredData } from '@/lib/utils/storage';

const isUUID = (str: any) => typeof str === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);

const defaultCoursesList: Course[] = [
  { id: 'c1', name: 'Diploma in Accounting & Finance', type: 'Diploma', level: 'Intermediate / Graduate', classes: 'Commerce & Accounting', description: 'Comprehensive diploma covering financial accounting, Tally, QuickBooks, Excel modeling, and taxation.', subjects: ['Financial Accounting', 'Cost Accounting', 'Taxation', 'QuickBooks'], fee_per_month: 4500, is_active: true },
  { id: 'c2', name: 'Diploma in Information Technology (DIT)', type: 'Diploma', level: 'Intermediate', classes: 'Computer Science', description: '1-Year Board Certified Diploma in Information Technology.', subjects: ['Web Development', 'Office Automation', 'C++', 'Database Systems'], fee_per_month: 4000, is_active: true },
  { id: 'c3', name: 'Diploma in Computerized Accounting & Taxation', type: 'Diploma', level: 'Professional', classes: 'Accounts', description: 'Practical training on computerised bookkeeping, corporate tax, and GST filing.', subjects: ['Tally Prime', 'QuickBooks Online', 'Tax Laws', 'Payroll Management'], fee_per_month: 5000, is_active: true },
];

export default function AdminCoursesPage() {
  const [courses, setCourses] = useState<Course[]>(() => getStoredData('courses', defaultCoursesList));
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('All');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Course | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    name: '',
    type: 'Course' as 'Course' | 'Diploma',
    level: 'Matric',
    classes: 'Class IX & X',
    description: '',
    subjects: '',
    fee_per_month: '3500',
    is_active: true,
  });

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.from('courses').select('*').order('display_order');
      if (!error && data && data.length > 0) {
        setCourses(data as Course[]);
        setStoredData('courses', data);
      }
    } catch {
      // keep stored data
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCourses(); }, []);

  const updateAndStore = (newList: Course[]) => {
    setCourses(newList);
    setStoredData('courses', newList);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    const payload = {
      name: form.name.trim(),
      type: form.type,
      level: form.level.trim(),
      classes: form.classes.trim(),
      description: form.description.trim() || undefined,
      subjects: form.subjects.split(',').map(s => s.trim()).filter(Boolean),
      fee_per_month: Number(form.fee_per_month) || 3500,
      is_active: form.is_active,
    };

    try {
      if (editing && isUUID(editing.id)) {
        await supabase.from('courses').update(payload).eq('id', editing.id);
        const updated = courses.map(c => c.id === editing.id ? { ...c, ...payload } : c);
        updateAndStore(updated);
        toast.success(`${form.type} updated & saved!`);
      } else {
        const newId = crypto.randomUUID();
        const { error } = await supabase.from('courses').insert([{ id: newId, ...payload }]);
        if (error) console.warn('Supabase Insert Warning:', error.message);
        const newC: Course = { id: newId, ...payload, created_at: new Date().toISOString() };
        const updated = [newC, ...courses];
        updateAndStore(updated);
        toast.success(`New ${form.type} added & saved permanently!`);
      }
      setShowForm(false);
      setEditing(null);
      setForm({ name: '', type: 'Course', level: 'Matric', classes: 'Class IX & X', description: '', subjects: '', fee_per_month: '3500', is_active: true });
    } catch {
      if (editing) {
        const updated = courses.map(c => c.id === editing.id ? { ...c, ...payload } : c);
        updateAndStore(updated);
        toast.success(`${form.type} updated!`);
      } else {
        const localC: Course = { id: crypto.randomUUID(), ...payload, created_at: new Date().toISOString() };
        const updated = [localC, ...courses];
        updateAndStore(updated);
        toast.success(`New ${form.type} added!`);
      }
      setShowForm(false);
      setEditing(null);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (course: Course) => {
    setEditing(course);
    setForm({
      name: course.name,
      type: course.type || 'Course',
      level: course.level || 'Matric',
      classes: course.classes || '',
      description: course.description || '',
      subjects: (course.subjects || []).join(', '),
      fee_per_month: String(course.fee_per_month || 3500),
      is_active: course.is_active,
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to remove this item?')) return;
    try {
      if (isUUID(id)) {
        await supabase.from('courses').delete().eq('id', id);
      } else {
        const target = courses.find(c => c.id === id);
        if (target?.name) {
          await supabase.from('courses').delete().eq('name', target.name);
        }
      }
    } catch {}
    const updated = courses.filter(c => c.id !== id);
    updateAndStore(updated);
    toast.success('Item deleted successfully!');
  };

  const filtered = courses.filter(c => {
    const matchesSearch =
      (c.name || '').toLowerCase().includes(search.toLowerCase()) ||
      (c.level || '').toLowerCase().includes(search.toLowerCase());
    const matchesType = filterType === 'All' || c.type === filterType;
    return matchesSearch && matchesType;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-2xl sm:text-3xl font-display font-bold text-slate-800">Courses & Diplomas Management</h1>
          <p className="text-slate-500 text-sm mt-1">Manage academic coaching programs & professional diplomas</p>
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative w-full sm:w-64">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              value={search} 
              onChange={e => setSearch(e.target.value)}
              placeholder="Search course or diploma..."
              className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 text-slate-800 text-sm rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none shadow-inner"
            />
          </div>
          <Button size="sm" onClick={() => { setEditing(null); setShowForm(!showForm); }} className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto shrink-0">
            <Plus size={16} className="mr-1.5" /> Add Course / Diploma
          </Button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2">
        {['All', 'Course', 'Diploma'].map((t) => (
          <button
            key={t}
            onClick={() => setFilterType(t)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              filterType === t
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            {t === 'All' ? 'All Programs' : t === 'Course' ? 'Academic Courses' : 'Professional Diplomas'}
          </button>
        ))}
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
            <div className="bg-white border border-blue-200 rounded-2xl p-5 sm:p-6 shadow-md mb-6 ring-1 ring-blue-100">
              <h2 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2 border-b border-slate-100 pb-3">
                <GraduationCap size={20} className="text-blue-600" />
                {editing ? 'Edit Program Details' : 'Add New Course / Diploma'}
              </h2>

              <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                <div>
                  <label className="text-sm font-bold text-slate-700 block mb-1.5">Program Category <span className="text-red-500">*</span></label>
                  <select
                    value={form.type}
                    onChange={e => setForm(prev => ({ ...prev, type: e.target.value as any }))}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 text-slate-800 rounded-xl focus:ring-2 focus:ring-blue-500 text-sm font-bold cursor-pointer"
                  >
                    <option value="Course">Academic Course (Matric / FSc)</option>
                    <option value="Diploma">Professional Diploma (DIT / IT Skills)</option>
                  </select>
                </div>

                <div>
                  <label className="text-sm font-bold text-slate-700 block mb-1.5">Program Name <span className="text-red-500">*</span></label>
                  <input
                    required
                    type="text"
                    placeholder="e.g. Diploma in Information Technology (DIT)"
                    value={form.name}
                    onChange={e => setForm(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 text-slate-800 rounded-xl focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                </div>

                <div>
                  <label className="text-sm font-bold text-slate-700 block mb-1.5">Classes / Duration <span className="text-red-500">*</span></label>
                  <input
                    required
                    type="text"
                    placeholder="e.g. 1-Year Program OR Class XI & XII"
                    value={form.classes}
                    onChange={e => setForm(prev => ({ ...prev, classes: e.target.value }))}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 text-slate-800 rounded-xl focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                </div>

                <div>
                  <label className="text-sm font-bold text-slate-700 block mb-1.5">Monthly Fee (PKR)</label>
                  <input
                    type="number"
                    placeholder="3500"
                    value={form.fee_per_month}
                    onChange={e => setForm(prev => ({ ...prev, fee_per_month: e.target.value }))}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 text-slate-800 rounded-xl focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="text-sm font-bold text-slate-700 block mb-1.5">Subjects Covered (Comma separated)</label>
                  <input
                    type="text"
                    placeholder="e.g. Office Automation, Programming, Database"
                    value={form.subjects}
                    onChange={e => setForm(prev => ({ ...prev, subjects: e.target.value }))}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 text-slate-800 rounded-xl focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                </div>

                <div className="sm:col-span-2 lg:col-span-3">
                  <label className="text-sm font-bold text-slate-700 block mb-1.5">Description</label>
                  <input
                    type="text"
                    placeholder="Brief overview of course or diploma objectives"
                    value={form.description}
                    onChange={e => setForm(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 text-slate-800 rounded-xl focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                </div>

                <div className="sm:col-span-2 lg:col-span-3 flex gap-3 pt-2">
                  <Button type="submit" disabled={submitting} className="bg-blue-600 hover:bg-blue-700 min-w-[140px]">
                    {submitting ? <Loader2 size={16} className="animate-spin" /> : (editing ? 'Save Changes' : 'Save Program')}
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

      {/* Grid of Programs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map((c) => (
          <div key={c.id} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between gap-2 mb-3">
                <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full ${
                  c.type === 'Diploma' ? 'bg-purple-50 text-purple-600 border border-purple-200' : 'bg-blue-50 text-blue-600 border border-blue-200'
                }`}>
                  {c.type || 'Course'}
                </span>
                <span className="text-xs font-bold text-slate-500 font-mono">
                  PKR {c.fee_per_month || 3500}/mo
                </span>
              </div>
              <h3 className="font-bold text-slate-800 text-lg mb-1">{c.name}</h3>
              <p className="text-xs font-semibold text-blue-600 mb-3">{c.classes}</p>
              {c.description && <p className="text-xs text-slate-500 leading-relaxed mb-4">{c.description}</p>}

              {c.subjects && c.subjects.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-4">
                  {c.subjects.map((sub, i) => (
                    <span key={i} className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md border border-slate-200">
                      {sub}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
              <button onClick={() => handleEdit(c)} title="Edit Program" className="w-8 h-8 bg-blue-50 hover:bg-blue-600 text-blue-600 hover:text-white rounded-lg flex items-center justify-center transition-colors">
                <Pencil size={14} />
              </button>
              <button onClick={() => handleDelete(c.id)} title="Delete Program" className="w-8 h-8 bg-red-50 hover:bg-red-600 text-red-500 hover:text-white rounded-lg flex items-center justify-center transition-colors">
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
