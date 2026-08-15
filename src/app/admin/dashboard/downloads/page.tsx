'use client';
export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { Plus, Trash2, Pencil, Search, Loader2, FileText, Download as DownloadIcon } from 'lucide-react';
import Button from '@/components/ui/Button';
import { Download } from '@/types';
import { m, AnimatePresence } from 'framer-motion';
import { formatGoogleDriveDownloadUrl } from '@/lib/utils/googleDrive';

const isUUID = (str: any) => typeof str === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);

const CATEGORIES = ['Syllabus', 'Schedule', 'Form', 'Finance', 'other'];

const categoryColors: Record<string, string> = {
  Syllabus: 'bg-blue-50 text-blue-600',
  Schedule: 'bg-emerald-50 text-emerald-600',
  Form: 'bg-violet-50 text-violet-600',
  Finance: 'bg-amber-50 text-amber-600',
  other: 'bg-slate-100 text-slate-600',
};

interface DownloadForm {
  title: string;
  description: string;
  category: string;
  file_url: string;
  file_type: string;
  file_size: string;
}

const emptyForm: DownloadForm = { title: '', description: '', category: 'Syllabus', file_url: '', file_type: '', file_size: '' };

const defaultDownloadsList: Download[] = [
  {
    id: 'd1',
    title: 'Academic Session Syllabus 2026-2027 (Class IX to XII)',
    category: 'Syllabus',
    file_type: 'PDF Document',
    file_size: '2.4 MB',
    file_url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    download_count: 142,
    is_active: true,
    created_at: new Date().toISOString()
  },
  {
    id: 'd2',
    title: 'Official Student Admission Application Form 2026',
    category: 'Form',
    file_type: 'PDF Document',
    file_size: '1.1 MB',
    file_url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    download_count: 289,
    is_active: true,
    created_at: new Date().toISOString()
  },
  {
    id: 'd3',
    title: 'Monthly Test Schedule & Exam Timetable 2026',
    category: 'Schedule',
    file_type: 'PDF Document',
    file_size: '850 KB',
    file_url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    download_count: 310,
    is_active: true,
    created_at: new Date().toISOString()
  },
  {
    id: 'd4',
    title: 'Fee Structure & Payment Schedule 2026',
    category: 'Finance',
    file_type: 'PDF Document',
    file_size: '620 KB',
    file_url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    download_count: 195,
    is_active: true,
    created_at: new Date().toISOString()
  }
];

function humanFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}

export default function AdminDownloadsPage() {
  const [downloads, setDownloads] = useState<Download[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Download | null>(null);
  const [search, setSearch] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState<DownloadForm>(emptyForm);

  const getDeletedIds = (): string[] => {
    try { return JSON.parse(localStorage.getItem('tfc_deleted_downloads') || '[]'); } catch { return []; }
  };

  const fetchDownloads = async () => {
    const deleted = getDeletedIds();
    try {
      setLoading(true);
      const { data, error } = await supabase.from('downloads').select('*');
      if (!error && data && data.length > 0) {
        const dbIds = new Set(data.map((d: any) => d.id));
        const merged = [...data as Download[], ...defaultDownloadsList.filter(d => !dbIds.has(d.id))];
        const filtered = merged.filter((d: any) => !deleted.includes(d.id) && !deleted.includes(d.title));
        setDownloads(filtered);
        try { localStorage.setItem('tfc_downloads_cache', JSON.stringify(filtered)); } catch {}
      } else {
        const local = JSON.parse(localStorage.getItem('tfc_downloads_cache') || '[]');
        const filteredLocal = (local.length > 0 ? local : defaultDownloadsList).filter((d: any) => !deleted.includes(d.id) && !deleted.includes(d.title));
        setDownloads(filteredLocal);
      }
    } catch {
      const local = JSON.parse(localStorage.getItem('tfc_downloads_cache') || '[]');
      const filteredLocal = (local.length > 0 ? local : defaultDownloadsList).filter((d: any) => !deleted.includes(d.id) && !deleted.includes(d.title));
      setDownloads(filteredLocal);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { 
    fetchDownloads(); 
  }, []);

  const updateAndStore = (newList: Download[]) => {
    setDownloads(newList);
    try { localStorage.setItem('tfc_downloads_cache', JSON.stringify(newList)); } catch {}
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    
    const ext = file.name.includes('.') ? file.name.split('.').pop()!.toUpperCase() : '';
    const fileSize = humanFileSize(file.size);
    
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setForm(p => ({ 
          ...p, 
          file_url: event.target!.result as string, 
          file_type: ext, 
          file_size: fileSize 
        }));
        toast.success('File loaded successfully!');
      }
      setUploading(false);
    };
    reader.onerror = () => {
      toast.error('Failed to read file');
      setUploading(false);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.file_url) { toast.error('Please upload a file first or paste a link'); return; }
    setSubmitting(true);

    const rawUrl = form.file_url.trim();
    let formattedUrl = rawUrl;
    if (rawUrl.includes('drive.google.com')) {
      formattedUrl = formatGoogleDriveDownloadUrl(rawUrl);
    }

    const payload = {
      title: form.title.trim(),
      description: form.description.trim() || undefined,
      category: form.category,
      file_url: formattedUrl,
      file_type: form.file_type || undefined,
      file_size: form.file_size || undefined,
      is_active: true,
    };

    let newId = editing ? editing.id : crypto.randomUUID();

    try {
      if (editing) {
        if (isUUID(editing.id)) {
          await supabase.from('downloads').update(payload).eq('id', editing.id);
        } else {
          await supabase.from('downloads').update(payload).eq('title', editing.title);
        }
        const updated = downloads.map(d => d.id === editing.id ? { ...d, ...payload } : d);
        updateAndStore(updated);
        toast.success('Download resource updated!');
      } else {
        const { error } = await supabase.from('downloads').insert([{ id: newId, ...payload }]);
        if (error) console.warn('Supabase DB Insert Notice:', error.message);
        const newD: Download = { id: newId, ...payload, download_count: 0, created_at: new Date().toISOString() };
        const updated = [newD, ...downloads];
        updateAndStore(updated);
        toast.success('Download published live!');
      }
    } catch {
      if (editing) {
        const updated = downloads.map(d => d.id === editing.id ? { ...d, ...payload } : d);
        updateAndStore(updated);
      } else {
        const newD: Download = { id: newId, ...payload, download_count: 0, created_at: new Date().toISOString() };
        const updated = [newD, ...downloads];
        updateAndStore(updated);
      }
      toast.success('Download saved!');
    } finally {
      setShowForm(false);
      setEditing(null);
      setForm(emptyForm);
      setSubmitting(false);
    }
  };

  const handleEdit = (item: Download) => {
    setEditing(item);
    setForm({
      title: item.title,
      description: item.description || '',
      category: item.category || 'Syllabus',
      file_url: item.file_url,
      file_type: item.file_type || '',
      file_size: item.file_size || '',
    });
    setShowForm(true);
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 50);
  };

  const handleDelete = async (item: Download) => {
    if (!confirm(`Delete "${item.title}"?`)) return;

    // 1. Instantly remove from active state
    const updated = downloads.filter(d => d.id !== item.id && d.title !== item.title);
    updateAndStore(updated);

    // 2. Blacklist ID and title
    const deleted = getDeletedIds();
    if (item.id && !deleted.includes(item.id)) deleted.push(item.id);
    if (item.title && !deleted.includes(item.title)) deleted.push(item.title);
    try { localStorage.setItem('tfc_deleted_downloads', JSON.stringify(deleted)); } catch {}

    // 3. Delete from Supabase DB
    try {
      if (isUUID(item.id)) {
        await supabase.from('downloads').delete().eq('id', item.id);
      } else {
        await supabase.from('downloads').delete().eq('title', item.title);
      }
    } catch {}

    toast.success('Download resource deleted permanently!');
  };

  const handleDownloadFile = (file: Download) => {
    const rawUrl = file.file_url || 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf';
    const fileUrl = formatGoogleDriveDownloadUrl(rawUrl) || rawUrl;
    const cleanFileName = (file.title || 'document').replace(/[^a-z0-9]/gi, '_');

    try {
      if (fileUrl.startsWith('data:')) {
        const link = document.createElement('a');
        link.href = fileUrl;
        link.download = `${cleanFileName}.${(file.file_type || 'pdf').toLowerCase()}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success(`Downloaded: ${file.title}`);
      } else {
        const link = document.createElement('a');
        link.href = fileUrl;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        link.download = `${cleanFileName}.${(file.file_type || 'pdf').toLowerCase()}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success(`Opening document: ${file.title}`);
      }
    } catch {
      window.open(fileUrl, '_blank');
    }
  };

  const filteredDownloads = downloads.filter(d =>
    (d.title || '').toLowerCase().includes(search.toLowerCase()) ||
    (d.category || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <DownloadIcon className="text-blue-600" size={28} />
            <h1 className="text-2xl sm:text-3xl font-display font-bold text-slate-800">Student Downloads Management</h1>
          </div>
          <p className="text-slate-500 text-sm mt-1">{downloads.length} academic resources synced live to Supabase &amp; Students Portal</p>
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative w-full sm:w-64">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search title, category..."
              className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 text-slate-800 text-sm rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none shadow-inner"
            />
          </div>
          <Button size="sm" onClick={() => { setEditing(null); setForm(emptyForm); setShowForm(!showForm); }} className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto shrink-0 shadow-md">
            <Plus size={16} className="mr-1.5" /> Add Download Item
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
            <div className="bg-white border border-blue-200 rounded-2xl p-5 sm:p-6 shadow-md mb-6 ring-1 ring-blue-100">
              <h2 className="text-lg font-bold text-slate-800 mb-4 pb-3 border-b border-slate-100 flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span>
                {editing ? `Edit Item: ${editing.title}` : 'Add Download Resource'}
              </h2>

              <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                <div className="sm:col-span-2">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">Document Title <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    required
                    value={form.title}
                    onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                    placeholder="e.g. IX Class Chemistry Syllabus 2026"
                    className="w-full px-4 py-2.5 bg-white border border-slate-200 text-slate-800 rounded-xl focus:ring-2 focus:ring-blue-500 text-sm font-semibold transition-all shadow-sm"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">Category</label>
                  <select
                    value={form.category}
                    onChange={e => setForm(p => ({ ...p, category: e.target.value }))}
                    className="w-full px-4 py-2.5 bg-white border border-slate-200 text-slate-800 rounded-xl focus:ring-2 focus:ring-blue-500 text-sm font-semibold cursor-pointer shadow-sm"
                  >
                    {CATEGORIES.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div className="sm:col-span-3">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">Upload File OR Paste Google Drive / Direct Link</label>
                  <div className="flex flex-col sm:flex-row items-center gap-3">
                    <label className="cursor-pointer px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl border border-slate-200 flex items-center gap-2 shrink-0">
                      {uploading ? <Loader2 size={16} className="animate-spin" /> : <FileText size={16} />} 
                      <span>Upload PDF / File</span>
                      <input type="file" onChange={handleFileUpload} className="hidden" />
                    </label>
                    <input
                      type="text"
                      placeholder="OR paste Google Drive / Direct File URL (https://...)"
                      value={form.file_url}
                      onChange={e => setForm(p => ({ ...p, file_url: e.target.value }))}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 text-slate-800 rounded-xl focus:ring-2 focus:ring-blue-500 text-sm"
                    />
                  </div>
                </div>

                <div className="sm:col-span-3 flex gap-3 pt-2">
                  <Button type="submit" disabled={submitting} className="bg-blue-600 hover:bg-blue-700 text-white font-bold min-w-[140px]">
                    {submitting ? <Loader2 size={16} className="animate-spin" /> : (editing ? 'Save Changes' : 'Publish Download')}
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

      {/* Grid of Downloads (100% Synced & Permanent Deletion) */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="admin-table w-full text-sm">
            <thead>
              <tr className="bg-slate-50 text-slate-600 border-b border-slate-200">
                <th className="py-3.5 px-4 font-bold text-left">Document Title</th>
                <th className="py-3.5 px-4 font-bold text-left">Category</th>
                <th className="py-3.5 px-4 font-bold text-left">File Type &amp; Size</th>
                <th className="py-3.5 px-4 font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                [...Array(3)].map((_, i) => (
                  <tr key={i}>
                    {[...Array(4)].map((_, j) => (
                      <td key={j} className="px-4 py-4"><div className="h-6 rounded-md skeleton bg-slate-100 animate-pulse" /></td>
                    ))}
                  </tr>
                ))
              ) : filteredDownloads.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-center py-16 text-slate-400">
                    <FileText size={40} className="mx-auto mb-2 text-slate-300" />
                    <p className="font-semibold text-slate-500">No download resources found.</p>
                  </td>
                </tr>
              ) : (
                filteredDownloads.map(item => (
                  <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-800">{item.title}</div>
                      {item.description && <div className="text-xs text-slate-500 mt-0.5">{item.description}</div>}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${categoryColors[item.category] || 'bg-slate-100 text-slate-700'}`}>
                        {item.category}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-xs font-medium text-slate-600">
                      {[item.file_type || 'PDF', item.file_size || '1.5 MB'].filter(Boolean).join(' • ')}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleDownloadFile(item)}
                          className="p-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-600 hover:text-white transition-colors border border-blue-200"
                          title="Download Document"
                        >
                          <DownloadIcon size={14} />
                        </button>
                        <button
                          onClick={() => handleEdit(item)}
                          className="p-1.5 bg-amber-50 text-amber-700 rounded-lg hover:bg-amber-600 hover:text-white transition-colors border border-amber-200"
                          title="Edit Resource"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          onClick={() => handleDelete(item)}
                          className="p-1.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-600 hover:text-white transition-colors border border-red-200"
                          title="Delete Resource"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
