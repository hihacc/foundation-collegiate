'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { Plus, Trash2, Pencil, Search, Loader2, FileText, ExternalLink, Download as DownloadIcon, AlertTriangle } from 'lucide-react';
import Button from '@/components/ui/Button';
import { Download } from '@/types';
import { motion, AnimatePresence } from 'framer-motion';

const CATEGORIES = ['syllabus', 'timetable', 'forms', 'fee', 'other'];

const categoryColors: Record<string, string> = {
  syllabus: 'bg-blue-500/20 text-blue-400',
  timetable: 'bg-green-500/20 text-green-400',
  forms: 'bg-purple-500/20 text-purple-400',
  fee: 'bg-amber-500/20 text-amber-400',
  other: 'bg-white/10 text-white/60',
};

interface DownloadForm {
  title: string;
  description: string;
  category: string;
  file_url: string;
  file_type: string;
  file_size: string;
}

const emptyForm: DownloadForm = { title: '', description: '', category: 'syllabus', file_url: '', file_type: '', file_size: '' };

function humanFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}

export default function AdminDownloadsPage() {
  const [downloads, setDownloads] = useState<Download[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Download | null>(null);
  const [search, setSearch] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState<DownloadForm>(emptyForm);

  const fetchDownloads = async () => {
    try {
      setLoading(true);
      setError(null);
      const { data, error } = await supabase.from('downloads').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      setDownloads((data as Download[]) || []);
    } catch (err) {
      console.error(err);
      setError('Failed to load downloads. Check your connection and try again.');
      toast.error('Failed to load downloads');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchDownloads(); }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const filename = `downloads/${Date.now()}_${file.name}`;
    const { error } = await supabase.storage.from('media').upload(filename, file);
    if (error) { toast.error('Upload failed: ' + error.message); setUploading(false); return; }
    const { data: url } = supabase.storage.from('media').getPublicUrl(filename);
    const ext = file.name.includes('.') ? file.name.split('.').pop()!.toUpperCase() : '';
    setForm(p => ({ ...p, file_url: url.publicUrl, file_type: ext, file_size: humanFileSize(file.size) }));
    setUploading(false);
    toast.success('File uploaded!');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.file_url) { toast.error('Please upload a file first'); return; }
    setSubmitting(true);

    try {
      const payload = {
        title: form.title.trim(),
        description: form.description.trim() || null,
        category: form.category,
        file_url: form.file_url,
        file_type: form.file_type || null,
        file_size: form.file_size || null,
      };

      if (editing) {
        const { error } = await supabase.from('downloads').update(payload).eq('id', editing.id);
        if (error) throw error;
        toast.success('Download updated!');
      } else {
        const { error } = await supabase.from('downloads').insert([payload]);
        if (error) throw error;
        toast.success('Download added!');
      }
      setShowForm(false);
      setEditing(null);
      setForm(emptyForm);
      fetchDownloads();
    } catch (err) {
      console.error(err);
      toast.error(editing ? 'Update failed' : 'Failed to add download. Make sure database is configured.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (item: Download) => {
    setEditing(item);
    setForm({
      title: item.title,
      description: item.description || '',
      category: CATEGORIES.includes(item.category) ? item.category : 'other',
      file_url: item.file_url,
      file_type: item.file_type || '',
      file_size: item.file_size || '',
    });
    setShowForm(true);
  };

  const handleDelete = async (item: Download) => {
    if (!confirm('Delete this download?')) return;
    try {
      const { error } = await supabase.from('downloads').delete().eq('id', item.id);
      if (error) throw error;
      // Best-effort: remove the file from storage too (non-fatal if it fails)
      try {
        const marker = '/media/';
        const idx = item.file_url?.indexOf(marker) ?? -1;
        if (idx !== -1) {
          const path = decodeURIComponent(item.file_url.slice(idx + marker.length));
          await supabase.storage.from('media').remove([path]);
        }
      } catch (storageErr) {
        console.error('Storage cleanup failed', storageErr);
      }
      toast.success('Download deleted');
      fetchDownloads();
    } catch (err) {
      console.error(err);
      toast.error('Failed to delete download');
    }
  };

  const filteredDownloads = downloads.filter(d =>
    d.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#0a0f1e] p-6 rounded-2xl border border-white/5">
        <div>
          <h1 className="text-2xl font-display font-bold text-white">Downloads Management</h1>
          <p className="text-white/50 text-sm mt-1">Manage syllabus, timetables, forms, and other files</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" size={16} />
            <input
              type="text"
              placeholder="Search downloads..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9 pr-4 py-2 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#0057FF] w-full sm:w-64 transition-all"
            />
          </div>
          <Button size="sm" onClick={() => { setEditing(null); setShowForm(!showForm); setForm(emptyForm); }} className="bg-[#0057FF] hover:bg-blue-600">
            <Plus size={16} /> Add File
          </Button>
        </div>
      </div>

      {/* Error banner */}
      {error && (
        <div className="flex items-center gap-3 bg-[#D72638]/10 border border-[#D72638]/30 text-red-300 rounded-2xl p-4 text-sm">
          <AlertTriangle size={18} className="shrink-0" />
          <p className="flex-1">{error}</p>
          <button onClick={fetchDownloads} className="font-semibold text-white hover:underline shrink-0">Retry</button>
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
                {editing ? 'Edit Download' : 'Add New Download'}
              </h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="text-sm font-medium text-white/70 block mb-1.5">Title <span className="text-red-400">*</span></label>
                    <input required value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                      placeholder="e.g. Class 9 Physics Syllabus"
                      className="w-full px-4 py-2.5 bg-background border border-white/10 text-white rounded-xl focus:ring-2 focus:ring-[#0057FF] focus:outline-none text-sm transition-all" />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-white/70 block mb-1.5">Category</label>
                    <select value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))}
                      className="w-full px-4 py-2.5 bg-background border border-white/10 text-white rounded-xl focus:ring-2 focus:ring-[#0057FF] focus:outline-none text-sm transition-all">
                      {CATEGORIES.map(c => <option key={c} value={c} className="capitalize">{c}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-white/70 block mb-1.5">Description (Optional)</label>
                  <textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                    rows={2} placeholder="Short description of the file..."
                    className="w-full px-4 py-2.5 bg-background border border-white/10 text-white rounded-xl focus:ring-2 focus:ring-[#0057FF] focus:outline-none text-sm resize-none transition-all" />
                </div>
                <div>
                  <label className="text-sm font-medium text-white/70 block mb-1.5">
                    Upload File {!editing && <span className="text-red-400">*</span>}
                    {editing && <span className="text-white/40 font-normal"> (leave empty to keep current file)</span>}
                  </label>
                  <input type="file" onChange={handleFileUpload}
                    className="w-full text-white/50 text-sm file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:bg-[#0057FF] file:text-white file:font-semibold file:cursor-pointer hover:file:bg-blue-600 transition-all" />
                  {uploading && <p className="text-sm text-[#0057FF] mt-2 animate-pulse">Uploading...</p>}
                  {form.file_url && !uploading && (
                    <p className="text-xs text-green-400 mt-2">
                      File ready: {form.file_type || 'FILE'}{form.file_size ? ` · ${form.file_size}` : ''}
                    </p>
                  )}
                </div>
                <div className="flex gap-3 pt-2">
                  <Button type="submit" disabled={submitting || uploading} className="bg-[#0057FF] hover:bg-blue-600 min-w-[120px]">
                    {submitting ? <Loader2 size={16} className="animate-spin" /> : (editing ? 'Save Changes' : 'Add Download')}
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
      <div className="space-y-4">
        {loading ? (
          [...Array(5)].map((_, i) => <div key={i} className="h-24 rounded-2xl bg-white/5 animate-pulse border border-white/5" />)
        ) : filteredDownloads.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 bg-[#0a0f1e] rounded-2xl border border-white/5">
            <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4 text-white/20">
              <FileText size={24} />
            </div>
            <h3 className="text-white font-medium">No downloads found</h3>
            <p className="text-white/40 text-sm mt-1">Try adjusting your search or upload a new file.</p>
          </div>
        ) : filteredDownloads.map((d, i) => (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            key={d.id}
            className="group bg-[#0a0f1e] border border-white/5 hover:border-[#0057FF]/30 rounded-2xl p-5 flex items-start gap-4 transition-all hover:shadow-[0_8px_30px_rgba(0,0,0,0.3)]"
          >
            <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-[#001F54] to-[#0057FF] flex items-center justify-center text-white shrink-0 shadow-inner">
              <FileText size={20} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${categoryColors[d.category] || categoryColors.other}`}>{d.category}</span>
                {d.file_type && <span className="text-xs text-white/50 font-medium">{d.file_type}</span>}
                {d.file_size && <span className="text-xs text-white/40">{d.file_size}</span>}
                {d.created_at && <span className="text-xs text-white/40">{new Date(d.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>}
              </div>
              <h3 className="font-bold text-white truncate group-hover:text-[#0057FF] transition-colors">{d.title}</h3>
              {d.description && <p className="text-sm text-white/50 line-clamp-1 mt-0.5">{d.description}</p>}
              <p className="text-xs text-white/40 mt-1.5 flex items-center gap-1.5">
                <DownloadIcon size={12} /> {d.download_count || 0} downloads
              </p>
            </div>
            <div className="flex gap-2 shrink-0">
              <a href={d.file_url} target="_blank" rel="noopener noreferrer" title="Open file"
                className="w-9 h-9 bg-white/5 hover:bg-[#0057FF] text-white/70 hover:text-white rounded-xl flex items-center justify-center transition-colors">
                <ExternalLink size={16} />
              </a>
              <button onClick={() => handleEdit(d)} title="Edit"
                className="w-9 h-9 bg-white/5 hover:bg-[#0057FF] text-white/70 hover:text-white rounded-xl flex items-center justify-center transition-colors">
                <Pencil size={16} />
              </button>
              <button onClick={() => handleDelete(d)} title="Delete"
                className="w-9 h-9 bg-white/5 hover:bg-[#D72638] text-white/70 hover:text-white rounded-xl flex items-center justify-center transition-colors">
                <Trash2 size={16} />
              </button>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
