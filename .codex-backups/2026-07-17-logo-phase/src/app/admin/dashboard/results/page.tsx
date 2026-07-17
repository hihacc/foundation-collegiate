'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { Plus, Search, Pencil, Trash2, Download, Upload, ShieldAlert, GraduationCap, Loader2 } from 'lucide-react';
import Button from '@/components/ui/Button';
import { Result } from '@/lib/types';
import { motion, AnimatePresence } from 'framer-motion';

const getGradeColor = (grade: string) => {
  if (grade.includes('A')) return 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
  if (grade.includes('B')) return 'bg-blue-500/10 text-blue-400 border border-blue-500/20';
  if (grade.includes('C')) return 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20';
  if (grade.includes('D')) return 'bg-orange-500/10 text-orange-400 border border-orange-500/20';
  return 'bg-red-500/10 text-red-400 border border-red-500/20';
};

export default function AdminResultsPage() {
  const [results, setResults] = useState<Result[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Result | null>(null);
  const [error, setError] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [form, setForm] = useState({
    student_id: '', roll_number: '', pin: '', exam_name: 'Monthly Test', 
    total_marks: 0, marks_obtained: 0, grade: '', position: '', remarks: '',
  });

  const fetchResults = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.from('results').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      setResults(data as Result[] || []);
    } catch (err) {
      console.error(err);
      setError(true);
      // Fallback data
      setResults([
        { id: '1', roll_number: 'FC-26-001', pin: '1234', exam_name: 'Mid Term', marks_obtained: 450, total_marks: 500, grade: 'A+', position: '1st', remarks: 'Excellent performance' },
        { id: '2', roll_number: 'FC-26-002', pin: '5678', exam_name: 'Mid Term', marks_obtained: 380, total_marks: 500, grade: 'A', position: '', remarks: 'Good work' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchResults(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const payload = {
      ...form,
      total_marks: Number(form.total_marks),
      marks_obtained: Number(form.marks_obtained),
    };

    try {
      if (editing) {
        const { error } = await supabase.from('results').update(payload).eq('id', editing.id);
        if (error) throw error;
        toast.success('Result updated!');
      } else {
        const { error } = await supabase.from('results').insert([payload]);
        if (error) throw error;
        toast.success('Result added successfully!');
      }
      setShowForm(false);
      setEditing(null);
      setForm({ student_id: '', roll_number: '', pin: '', exam_name: 'Monthly Test', total_marks: 0, marks_obtained: 0, grade: '', position: '', remarks: '' });
      fetchResults();
    } catch (err) {
      console.error(err);
      toast.error('Failed to save result. Check database connection.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this result?')) return;
    try {
      const { error } = await supabase.from('results').delete().eq('id', id);
      if (error) throw error;
      toast.success('Result deleted');
      fetchResults();
    } catch (err) {
      console.error(err);
      toast.error('Delete failed');
    }
  };

  const handleEdit = (result: Result) => {
    setEditing(result);
    setForm({
      student_id: result.student_id || '', roll_number: result.roll_number,
      pin: result.pin, exam_name: result.exam_name,
      total_marks: result.total_marks, marks_obtained: result.marks_obtained,
      grade: result.grade, position: result.position || '', remarks: result.remarks || '',
    });
    setShowForm(true);
  };

  const filtered = results.filter(r =>
    r.roll_number.toLowerCase().includes(search.toLowerCase()) ||
    r.exam_name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-[#0a0f1e] p-6 rounded-2xl border border-white/5">
        <div>
          <h1 className="text-2xl font-display font-bold text-white">Results Management</h1>
          <p className="text-white/50 text-sm mt-1">Manage exam marks, pins, and grading</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" size={16} />
            <input 
              type="text" 
              placeholder="Search roll no..." 
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9 pr-4 py-2 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#0057FF] w-full sm:w-48 transition-all"
            />
          </div>
          <Button variant="outline" className="border-white/10 text-white/70 hover:bg-white/5" size="sm">
            <Upload size={16} className="mr-1.5" /> Import
          </Button>
          <Button variant="outline" className="border-white/10 text-white/70 hover:bg-white/5" size="sm">
            <Download size={16} className="mr-1.5" /> Export
          </Button>
          <Button size="sm" onClick={() => { setEditing(null); setShowForm(!showForm); }} className="bg-[#0057FF] hover:bg-blue-600">
            <Plus size={16} className="mr-1.5" /> Add Result
          </Button>
        </div>
      </div>

      {error && (
        <div className="bg-[#D72638]/10 border border-[#D72638]/20 text-[#D72638] px-4 py-3 rounded-xl flex items-center gap-3 text-sm">
          <ShieldAlert size={18} className="shrink-0" />
          <p>Database connection failed. Displaying preview data. Please configure Supabase to save results.</p>
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
              <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#0057FF]"></span>
                {editing ? 'Edit Result' : 'Add New Result'}
              </h2>
              <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {[
                  { label: 'Roll Number', key: 'roll_number', placeholder: 'e.g. FC-26-001', required: true },
                  { label: 'Secret PIN (For Portal)', key: 'pin', placeholder: 'e.g. 1234', required: true },
                  { label: 'Exam Name', key: 'exam_name', placeholder: 'e.g. Mid Term', required: true },
                  { label: 'Total Marks', key: 'total_marks', placeholder: '500', type: 'number', required: true },
                  { label: 'Marks Obtained', key: 'marks_obtained', placeholder: '450', type: 'number', required: true },
                  { label: 'Grade', key: 'grade', placeholder: 'A+', required: true },
                  { label: 'Position (Optional)', key: 'position', placeholder: '1st, 2nd...' },
                  { label: 'Remarks (Optional)', key: 'remarks', placeholder: 'Excellent!' },
                ].map(({ label, key, placeholder, type, required }) => (
                  <div key={key}>
                    <label className="text-sm font-medium text-white/70 block mb-1.5">{label} {required && <span className="text-red-400">*</span>}</label>
                    <input
                      required={required}
                      type={type || 'text'}
                      value={form[key as keyof typeof form] as string | number || ''}
                      onChange={e => setForm(prev => ({ ...prev, [key]: e.target.value }))}
                      placeholder={placeholder}
                      className="w-full px-4 py-2.5 bg-background border border-white/10 text-white placeholder:text-white/20 rounded-xl focus:ring-2 focus:ring-[#0057FF] focus:outline-none text-sm transition-all"
                    />
                  </div>
                ))}
                <div className="sm:col-span-2 lg:col-span-3 flex gap-3 pt-2">
                  <Button type="submit" disabled={submitting} className="bg-[#0057FF] hover:bg-blue-600 min-w-[120px]">
                    {submitting ? <Loader2 size={16} className="animate-spin" /> : (editing ? 'Save Changes' : 'Add Result')}
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

      {/* Table */}
      <div className="bg-[#0a0f1e] border border-white/5 rounded-2xl overflow-hidden shadow-[0_8px_30px_rgba(0,0,0,0.12)]">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10 bg-white/5">
                {['Roll No. / Student', 'Exam Details', 'Marks & %', 'Grade', 'Remarks', 'Actions'].map(h => (
                  <th key={h} className="text-left px-6 py-4 text-xs font-bold uppercase tracking-wider text-white/40">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i}>
                    {[...Array(6)].map((_, j) => (
                      <td key={j} className="px-6 py-4"><div className="h-6 rounded-md bg-white/5 animate-pulse" /></td>
                    ))}
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-20 text-white/40">
                    <GraduationCap size={40} className="mx-auto mb-3 opacity-20" />
                    No results found
                  </td>
                </tr>
              ) : filtered.map((r, idx) => {
                const percentage = ((r.marks_obtained / r.total_marks) * 100).toFixed(1);
                return (
                  <motion.tr 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    key={r.id} 
                    className="hover:bg-white/5 transition-colors group"
                  >
                    <td className="px-6 py-4">
                      <div className="font-mono font-bold text-white group-hover:text-[#0057FF] transition-colors">{r.roll_number}</div>
                      <div className="text-xs text-white/40 mt-1 flex items-center gap-1">PIN: <span className="font-mono bg-white/10 px-1.5 py-0.5 rounded text-white/70">{r.pin}</span></div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-white/80">{r.exam_name}</div>
                      {r.position && <div className="text-xs text-[#FFD700] mt-1 font-medium">{r.position} Position</div>}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-white font-medium">{r.marks_obtained} <span className="text-white/30">/ {r.total_marks}</span></div>
                      <div className="text-xs text-white/50 mt-1">{percentage}%</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${getGradeColor(r.grade)}`}>{r.grade}</span>
                    </td>
                    <td className="px-6 py-4 text-white/60 text-xs max-w-[200px] truncate">
                      {r.remarks || '-'}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => handleEdit(r)} className="w-8 h-8 bg-white/5 hover:bg-[#0057FF] text-white/70 hover:text-white rounded-lg flex items-center justify-center transition-colors">
                          <Pencil size={14} />
                        </button>
                        <button onClick={() => handleDelete(r.id)} className="w-8 h-8 bg-white/5 hover:bg-[#D72638] text-white/70 hover:text-white rounded-lg flex items-center justify-center transition-colors">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
