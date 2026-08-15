'use client';
export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, Loader2, FileText } from 'lucide-react';
import Button from '@/components/ui/Button';
import { AcademicSubject, AcademicGroup, AcademicClass } from '@/types';

export default function AdminAcademicSubjectsPage() {
  const [subjects, setSubjects] = useState<AcademicSubject[]>([]);
  const [groups, setGroups] = useState<AcademicGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<AcademicSubject | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [selectedGroupFilter, setSelectedGroupFilter] = useState<string>('all');

  const [form, setForm] = useState({
    group_id: '',
    name: '',
    code: '',
    is_compulsory: false,
    display_order: 0,
    is_active: true
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [grpRes, subRes] = await Promise.all([
        fetch('/api/academics/groups'),
        fetch('/api/academics/subjects')
      ]);
      if (!grpRes.ok || !subRes.ok) throw new Error('Failed to fetch data');
      
      const grpJson = await grpRes.json();
      const subJson = await subRes.json();
      
      setGroups(grpJson.data || []);
      setSubjects(subJson.data || []);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenForm = (item: AcademicSubject | null = null) => {
    if (item) {
      setEditing(item);
      setForm({
        group_id: item.group_id,
        name: item.name,
        code: item.code || '',
        is_compulsory: item.is_compulsory,
        display_order: item.display_order || 0,
        is_active: item.is_active
      });
    } else {
      setEditing(null);
      setForm({
        group_id: selectedGroupFilter !== 'all' ? selectedGroupFilter : (groups[0]?.id || ''),
        name: '',
        code: '',
        is_compulsory: false,
        display_order: subjects.length + 1,
        is_active: true
      });
    }
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.group_id) return toast.error('Group and Name are required');
    setSubmitting(true);

    try {
      const method = editing ? 'PATCH' : 'POST';
      const payload = editing ? { id: editing.id, ...form } : form;
      
      const res = await fetch('/api/academics/subjects', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Operation failed');
      }

      toast.success(editing ? 'Subject updated successfully' : 'Subject created successfully');
      setShowForm(false);
      fetchData();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this subject?')) return;
    try {
      const res = await fetch(`/api/academics/subjects?id=${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Delete failed');
      toast.success('Subject deleted successfully');
      fetchData();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const filteredSubjects = selectedGroupFilter === 'all' 
    ? subjects 
    : subjects.filter(s => s.group_id === selectedGroupFilter);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-2xl sm:text-3xl font-display font-bold text-slate-800 flex items-center gap-2">
            <FileText className="text-blue-600" /> Academic Subjects
          </h1>
          <p className="text-slate-500 text-sm mt-1">Manage individual subjects and their assignments to programs</p>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <select 
            value={selectedGroupFilter} 
            onChange={(e) => setSelectedGroupFilter(e.target.value)}
            className="w-full md:w-64 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-semibold text-slate-700"
          >
            <option value="all">All Groups / Programs</option>
            {groups.map(g => (
              <option key={g.id} value={g.id}>
                {g.academic_classes?.name ? `${g.academic_classes.name} - ` : ''}{g.name}
              </option>
            ))}
          </select>
          <Button onClick={() => handleOpenForm()} className="whitespace-nowrap"><Plus size={18} /> Add Subject</Button>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
              <tr>
                <th className="py-4 px-6 font-bold">Subject Name</th>
                <th className="py-4 px-6 font-bold">Code</th>
                <th className="py-4 px-6 font-bold">Assigned Group</th>
                <th className="py-4 px-6 font-bold text-center">Type</th>
                <th className="py-4 px-6 font-bold text-center">Order</th>
                <th className="py-4 px-6 font-bold text-center">Status</th>
                <th className="py-4 px-6 font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center">
                    <Loader2 className="animate-spin text-blue-600 mx-auto" size={32} />
                  </td>
                </tr>
              ) : filteredSubjects.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">No subjects found.</td>
                </tr>
              ) : filteredSubjects.map((s) => (
                <tr key={s.id} className="hover:bg-slate-50 transition-colors">
                  <td className="py-4 px-6 font-bold text-slate-800">{s.name}</td>
                  <td className="py-4 px-6 font-mono text-slate-500">{s.code || '-'}</td>
                  <td className="py-4 px-6">
                    <span className="bg-blue-50 text-blue-700 px-2.5 py-1 rounded-md text-xs font-bold border border-blue-100">
                      {s.academic_groups?.academic_classes?.name ? `${s.academic_groups.academic_classes.name} - ` : ''}
                      {s.academic_groups?.name || 'Unknown Group'}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-center">
                    <span className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded ${s.is_compulsory ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'}`}>
                      {s.is_compulsory ? 'Compulsory' : 'Optional'}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-center font-mono text-slate-600">{s.display_order}</td>
                  <td className="py-4 px-6 text-center">
                    <span className={`px-2.5 py-1 text-xs font-bold rounded-full ${s.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                      {s.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-right">
                    <div className="flex justify-end gap-2">
                      <button onClick={() => handleOpenForm(s)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"><Pencil size={18} /></button>
                      <button onClick={() => handleDelete(s.id)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={18} /></button>
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
            <h3 className="text-2xl font-bold text-slate-800 mb-6">{editing ? 'Edit Subject' : 'Add New Subject'}</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-sm font-bold text-slate-700 mb-1.5">Assign to Group / Program *</label>
                  <select required value={form.group_id} onChange={e => setForm({...form, group_id: e.target.value})} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none">
                    <option value="">Select a Group</option>
                    {groups.map(g => (
                      <option key={g.id} value={g.id}>
                        {g.academic_classes?.name ? `${g.academic_classes.name} - ` : ''}{g.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-bold text-slate-700 mb-1.5">Subject Name *</label>
                  <input required value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="e.g. Physics" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1.5">Subject Code (Optional)</label>
                  <input value={form.code} onChange={e => setForm({...form, code: e.target.value})} placeholder="e.g. PHY-11" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1.5">Display Order</label>
                  <input type="number" value={form.display_order} onChange={e => setForm({...form, display_order: parseInt(e.target.value) || 0})} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none" />
                </div>
                
                <div className="sm:col-span-2 flex flex-col sm:flex-row gap-6 mt-4 p-4 bg-slate-50 rounded-xl border border-slate-100">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input type="checkbox" checked={form.is_compulsory} onChange={e => setForm({...form, is_compulsory: e.target.checked})} className="w-5 h-5 text-blue-600 rounded border-slate-300 focus:ring-blue-500" />
                    <div>
                      <span className="font-bold text-slate-700 block">Compulsory Subject</span>
                      <span className="text-xs text-slate-500">Must be taken by all students in this group</span>
                    </div>
                  </label>
                  
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input type="checkbox" checked={form.is_active} onChange={e => setForm({...form, is_active: e.target.checked})} className="w-5 h-5 text-blue-600 rounded border-slate-300 focus:ring-blue-500" />
                    <span className="font-bold text-slate-700">Active</span>
                  </label>
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-6 mt-6 border-t border-slate-100">
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
                <Button type="submit" isLoading={submitting}>{editing ? 'Save Changes' : 'Create Subject'}</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
