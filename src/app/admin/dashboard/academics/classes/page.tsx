'use client';
export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, Loader2, BookOpen } from 'lucide-react';
import Button from '@/components/ui/Button';
import { AcademicClass } from '@/types';

export default function AdminAcademicClassesPage() {
  const [classes, setClasses] = useState<AcademicClass[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<AcademicClass | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    name: '',
    short_name: '',
    level: 0,
    display_order: 0,
    is_active: true
  });

  const fetchClasses = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/academics/classes');
      if (!res.ok) throw new Error('Failed to fetch classes');
      const json = await res.json();
      setClasses(json.data || []);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClasses();
  }, []);

  const handleOpenForm = (item: AcademicClass | null = null) => {
    if (item) {
      setEditing(item);
      setForm({
        name: item.name,
        short_name: item.short_name || '',
        level: item.level || 0,
        display_order: item.display_order || 0,
        is_active: item.is_active
      });
    } else {
      setEditing(null);
      setForm({
        name: '',
        short_name: '',
        level: 0,
        display_order: classes.length + 1,
        is_active: true
      });
    }
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name) return toast.error('Name is required');
    setSubmitting(true);

    try {
      const method = editing ? 'PATCH' : 'POST';
      const payload = editing ? { id: editing.id, ...form } : form;
      
      const res = await fetch('/api/academics/classes', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Operation failed');
      }

      toast.success(editing ? 'Class updated successfully' : 'Class created successfully');
      setShowForm(false);
      fetchClasses();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this class? This will also delete all associated groups and subjects.')) return;
    try {
      const res = await fetch(`/api/academics/classes?id=${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Delete failed');
      toast.success('Class deleted successfully');
      fetchClasses();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-2xl sm:text-3xl font-display font-bold text-slate-800 flex items-center gap-2">
            <BookOpen className="text-blue-600" /> Academic Classes
          </h1>
          <p className="text-slate-500 text-sm mt-1">Manage core educational levels (e.g. Class IX, Class X)</p>
        </div>
        <Button onClick={() => handleOpenForm()} className="whitespace-nowrap"><Plus size={18} /> Add Class</Button>
      </div>

      <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
              <tr>
                <th className="py-4 px-6 font-bold">Class Name</th>
                <th className="py-4 px-6 font-bold">Short Name</th>
                <th className="py-4 px-6 font-bold text-center">Level</th>
                <th className="py-4 px-6 font-bold text-center">Order</th>
                <th className="py-4 px-6 font-bold text-center">Status</th>
                <th className="py-4 px-6 font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center">
                    <Loader2 className="animate-spin text-blue-600 mx-auto" size={32} />
                  </td>
                </tr>
              ) : classes.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">No classes found. Add your first class.</td>
                </tr>
              ) : classes.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                  <td className="py-4 px-6 font-bold text-slate-800">{c.name}</td>
                  <td className="py-4 px-6 text-slate-600">{c.short_name || '-'}</td>
                  <td className="py-4 px-6 text-center font-mono text-slate-600">{c.level || '-'}</td>
                  <td className="py-4 px-6 text-center font-mono text-slate-600">{c.display_order}</td>
                  <td className="py-4 px-6 text-center">
                    <span className={`px-2.5 py-1 text-xs font-bold rounded-full ${c.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                      {c.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-right">
                    <div className="flex justify-end gap-2">
                      <button onClick={() => handleOpenForm(c)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"><Pencil size={18} /></button>
                      <button onClick={() => handleDelete(c.id)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={18} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg p-6 sm:p-8 shadow-2xl overflow-y-auto max-h-[90vh]">
            <h3 className="text-2xl font-bold text-slate-800 mb-6">{editing ? 'Edit Class' : 'Add New Class'}</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-sm font-bold text-slate-700 mb-1.5">Class Name *</label>
                  <input required value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="e.g. Class XI" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1.5">Short Name</label>
                  <input value={form.short_name} onChange={e => setForm({...form, short_name: e.target.value})} placeholder="e.g. XI" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1.5">Academic Level</label>
                  <input type="number" value={form.level} onChange={e => setForm({...form, level: parseInt(e.target.value) || 0})} placeholder="e.g. 11" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1.5">Display Order</label>
                  <input type="number" value={form.display_order} onChange={e => setForm({...form, display_order: parseInt(e.target.value) || 0})} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none" />
                </div>
                <div className="flex items-center mt-6">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input type="checkbox" checked={form.is_active} onChange={e => setForm({...form, is_active: e.target.checked})} className="w-5 h-5 text-blue-600 rounded border-slate-300 focus:ring-blue-500" />
                    <span className="font-bold text-slate-700">Active</span>
                  </label>
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-6 mt-6 border-t border-slate-100">
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
                <Button type="submit" isLoading={submitting}>{editing ? 'Save Changes' : 'Create Class'}</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
