'use client';
export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, Loader2, Users } from 'lucide-react';
import Button from '@/components/ui/Button';
import { AcademicGroup, AcademicClass } from '@/types';

export default function AdminAcademicGroupsPage() {
  const [groups, setGroups] = useState<AcademicGroup[]>([]);
  const [classes, setClasses] = useState<AcademicClass[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<AcademicGroup | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [selectedClassFilter, setSelectedClassFilter] = useState<string>('all');

  const [form, setForm] = useState({
    class_id: '',
    name: '',
    description: '',
    display_order: 0,
    is_active: true
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [clsRes, grpRes] = await Promise.all([
        fetch('/api/academics/classes'),
        fetch('/api/academics/groups')
      ]);
      if (!clsRes.ok || !grpRes.ok) throw new Error('Failed to fetch data');
      
      const clsJson = await clsRes.json();
      const grpJson = await grpRes.json();
      
      setClasses(clsJson.data || []);
      setGroups(grpJson.data || []);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenForm = (item: AcademicGroup | null = null) => {
    if (item) {
      setEditing(item);
      setForm({
        class_id: item.class_id,
        name: item.name,
        description: item.description || '',
        display_order: item.display_order || 0,
        is_active: item.is_active
      });
    } else {
      setEditing(null);
      setForm({
        class_id: selectedClassFilter !== 'all' ? selectedClassFilter : (classes[0]?.id || ''),
        name: '',
        description: '',
        display_order: groups.length + 1,
        is_active: true
      });
    }
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.class_id) return toast.error('Class and Name are required');
    setSubmitting(true);

    try {
      const method = editing ? 'PATCH' : 'POST';
      const payload = editing ? { id: editing.id, ...form } : form;
      
      const res = await fetch('/api/academics/groups', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Operation failed');
      }

      toast.success(editing ? 'Group updated successfully' : 'Group created successfully');
      setShowForm(false);
      fetchData();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this group? All associated subjects will be deleted.')) return;
    try {
      const res = await fetch(`/api/academics/groups?id=${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Delete failed');
      toast.success('Group deleted successfully');
      fetchData();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const filteredGroups = selectedClassFilter === 'all' 
    ? groups 
    : groups.filter(g => g.class_id === selectedClassFilter);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-2xl sm:text-3xl font-display font-bold text-slate-800 flex items-center gap-2">
            <Users className="text-blue-600" /> Academic Groups
          </h1>
          <p className="text-slate-500 text-sm mt-1">Manage academic streams and programs (e.g. Pre-Medical, Commerce)</p>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <select 
            value={selectedClassFilter} 
            onChange={(e) => setSelectedClassFilter(e.target.value)}
            className="w-full md:w-48 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-semibold text-slate-700"
          >
            <option value="all">All Classes</option>
            {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <Button onClick={() => handleOpenForm()} className="whitespace-nowrap"><Plus size={18} /> Add Group</Button>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
              <tr>
                <th className="py-4 px-6 font-bold">Group / Program Name</th>
                <th className="py-4 px-6 font-bold">Class Assignment</th>
                <th className="py-4 px-6 font-bold text-center">Order</th>
                <th className="py-4 px-6 font-bold text-center">Status</th>
                <th className="py-4 px-6 font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center">
                    <Loader2 className="animate-spin text-blue-600 mx-auto" size={32} />
                  </td>
                </tr>
              ) : filteredGroups.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-500">No groups found for the selected filter.</td>
                </tr>
              ) : filteredGroups.map((g) => (
                <tr key={g.id} className="hover:bg-slate-50 transition-colors">
                  <td className="py-4 px-6 font-bold text-slate-800">{g.name}</td>
                  <td className="py-4 px-6">
                    <span className="bg-blue-50 text-blue-700 px-2.5 py-1 rounded-md text-xs font-bold border border-blue-100">
                      {g.academic_classes?.name || 'Unknown Class'}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-center font-mono text-slate-600">{g.display_order}</td>
                  <td className="py-4 px-6 text-center">
                    <span className={`px-2.5 py-1 text-xs font-bold rounded-full ${g.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                      {g.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-right">
                    <div className="flex justify-end gap-2">
                      <button onClick={() => handleOpenForm(g)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"><Pencil size={18} /></button>
                      <button onClick={() => handleDelete(g.id)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={18} /></button>
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
            <h3 className="text-2xl font-bold text-slate-800 mb-6">{editing ? 'Edit Group' : 'Add New Group'}</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1.5">Assign to Class *</label>
                  <select required value={form.class_id} onChange={e => setForm({...form, class_id: e.target.value})} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none">
                    <option value="">Select a Class</option>
                    {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1.5">Group / Program Name *</label>
                  <input required value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="e.g. Pre-Medical" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1.5">Description (Optional)</label>
                  <input value={form.description} onChange={e => setForm({...form, description: e.target.value})} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none" />
                </div>
                <div className="grid grid-cols-2 gap-4">
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
              </div>
              <div className="flex justify-end gap-3 pt-6 mt-6 border-t border-slate-100">
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
                <Button type="submit" isLoading={submitting}>{editing ? 'Save Changes' : 'Create Group'}</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
