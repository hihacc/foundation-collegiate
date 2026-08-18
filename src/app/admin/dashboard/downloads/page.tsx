'use client';
export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { 
  Plus, Trash2, Pencil, Search, Loader2, FileText, Download as DownloadIcon, 
  Eye, Copy, Folder, CheckCircle2, LayoutGrid, List, 
  RefreshCw, X, MessageCircle,
  FileCheck, BookOpen, Receipt, Calendar
} from 'lucide-react';
import Button from '@/components/ui/Button';
import { Download } from '@/types';
import { m, AnimatePresence } from 'framer-motion';
import { formatGoogleDriveDownloadUrl } from '@/lib/utils/googleDrive';
import { cn } from '@/lib/utils';

const isUUID = (str: any) => typeof str === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);

const CATEGORIES = ['All', 'Syllabus', 'Schedule', 'Form', 'Finance', 'Curriculum', 'other'] as const;

const categoryColors: Record<string, { bg: string; text: string; border: string; icon: any }> = {
  Syllabus: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', icon: BookOpen },
  Schedule: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', icon: Calendar },
  Form: { bg: 'bg-violet-50', text: 'text-violet-700', border: 'border-violet-200', icon: FileCheck },
  Finance: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', icon: Receipt },
  Curriculum: { bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200', icon: BookOpen },
  other: { bg: 'bg-slate-100', text: 'text-slate-700', border: 'border-slate-200', icon: Folder },
};

interface DownloadForm {
  title: string;
  description: string;
  category: string;
  file_url: string;
  file_type: string;
  file_size: string;
}

const emptyForm: DownloadForm = { title: '', description: '', category: 'Syllabus', file_url: '', file_type: 'PDF Document', file_size: '' };

const defaultDownloadsList: Download[] = [
  {
    id: 'd1',
    title: 'Academic Session Syllabus 2026-2027 (Class IX to XII)',
    description: 'Complete course curriculum and examination breakdowns for SSC & HSSC faculties.',
    category: 'Syllabus',
    file_type: 'PDF Document',
    file_size: '2.4 MB',
    file_url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    download_count: 342,
    is_active: true,
    created_at: new Date().toISOString()
  },
  {
    id: 'd2',
    title: 'Official Student Admission Application Form 2026',
    description: 'Printable walk-in admission application form with required documents checklist.',
    category: 'Form',
    file_type: 'PDF Document',
    file_size: '1.1 MB',
    file_url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    download_count: 589,
    is_active: true,
    created_at: new Date().toISOString()
  },
  {
    id: 'd3',
    title: 'Monthly Test Schedule & Exam Timetable 2026',
    description: 'Timetable with exact dates for monthly assessments, mid-term exams, and grand revisions.',
    category: 'Schedule',
    file_type: 'PDF Document',
    file_size: '850 KB',
    file_url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    download_count: 620,
    is_active: true,
    created_at: new Date().toISOString()
  },
  {
    id: 'd4',
    title: 'Fee Structure & Payment Policy Schedule 2026',
    description: 'Comprehensive breakdown of monthly tuition, computer lab fees, and transport guidelines.',
    category: 'Finance',
    file_type: 'PDF Document',
    file_size: '620 KB',
    file_url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    download_count: 415,
    is_active: true,
    created_at: new Date().toISOString()
  },
  {
    id: 'd5',
    title: 'Class IX & X Computer Science Model Papers 2026',
    description: 'Solved model papers and chapter-wise important questions for Karachi Board examinations.',
    category: 'Syllabus',
    file_type: 'PDF Document',
    file_size: '3.1 MB',
    file_url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    download_count: 278,
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
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState<DownloadForm>(emptyForm);
  const [previewDoc, setPreviewDoc] = useState<Download | null>(null);

  const getDeletedIds = (): string[] => {
    try {
      const stored = localStorage.getItem('tfc_deleted_downloads');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  };

  const fetchDownloads = async () => {
    setLoading(true);
    const deleted = getDeletedIds();

    try {
      const { data, error } = await supabase
        .from('downloads')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (data && data.length > 0) {
        const clean = (data as Download[]).filter(d => !deleted.includes(d.id) && !deleted.includes(d.title));
        setDownloads(clean);
        localStorage.setItem('tfc_downloads_cache', JSON.stringify(clean));
      } else {
        const cached = localStorage.getItem('tfc_downloads_cache');
        if (cached) {
          const parsed = JSON.parse(cached);
          setDownloads(parsed.filter((d: Download) => !deleted.includes(d.id) && !deleted.includes(d.title)));
        } else {
          const clean = defaultDownloadsList.filter(d => !deleted.includes(d.id) && !deleted.includes(d.title));
          setDownloads(clean);
        }
      }
    } catch {
      const cached = localStorage.getItem('tfc_downloads_cache');
      if (cached) {
        const parsed = JSON.parse(cached);
        setDownloads(parsed.filter((d: Download) => !deleted.includes(d.id) && !deleted.includes(d.title)));
      } else {
        const clean = defaultDownloadsList.filter(d => !deleted.includes(d.id) && !deleted.includes(d.title));
        setDownloads(clean);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDownloads();
  }, []);

  const updateAndStore = (updated: Download[]) => {
    setDownloads(updated);
    try {
      localStorage.setItem('tfc_downloads_cache', JSON.stringify(updated));
    } catch {}
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 15 * 1024 * 1024) {
      toast.error('File exceeds 15MB limit. Please upload to Google Drive and paste the link.');
      return;
    }

    setUploading(true);
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      setForm(p => ({
        ...p,
        file_url: base64,
        file_size: humanFileSize(file.size),
        file_type: file.type.includes('pdf') ? 'PDF Document' : (file.name.split('.').pop()?.toUpperCase() || 'Document'),
        title: p.title || file.name.replace(/\.[^/.]+$/, "")
      }));
      setUploading(false);
      toast.success(`Loaded "${file.name}" (${humanFileSize(file.size)})`);
    };
    reader.onerror = () => {
      setUploading(false);
      toast.error('Failed to read file');
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) {
      toast.error('Please enter a document title');
      return;
    }

    setSubmitting(true);
    const rawUrl = form.file_url.trim();
    const formattedUrl = rawUrl.includes('drive.google.com') ? formatGoogleDriveDownloadUrl(rawUrl) : rawUrl;

    const payload = {
      title: form.title.trim(),
      description: form.description.trim(),
      category: form.category,
      file_url: formattedUrl || 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
      file_type: form.file_type || 'PDF Document',
      file_size: form.file_size || '1.2 MB',
      is_active: true,
    };

    const newId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `d_${Date.now()}`;

    try {
      if (editing) {
        if (isUUID(editing.id)) {
          await supabase.from('downloads').update(payload).eq('id', editing.id);
        }
        const updated = downloads.map(d => d.id === editing.id ? { ...d, ...payload } : d);
        updateAndStore(updated);
        toast.success('Download resource updated!');
      } else {
        await supabase.from('downloads').insert([{ id: newId, ...payload, download_count: 0, created_at: new Date().toISOString() }]);
        const updated = [{ id: newId, ...payload, download_count: 0, created_at: new Date().toISOString() }, ...downloads];
        updateAndStore(updated);
        toast.success('Download published live!');
      }
    } catch {
      toast.error('Operation failed, please try again.');
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
      file_type: item.file_type || 'PDF Document',
      file_size: item.file_size || '',
    });
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (item: Download) => {
    if (!confirm(`Permanently delete "${item.title}"?`)) return;

    const updated = downloads.filter(d => d.id !== item.id && d.title !== item.title);
    updateAndStore(updated);

    const deleted = getDeletedIds();
    if (item.id && !deleted.includes(item.id)) deleted.push(item.id);
    if (item.title && !deleted.includes(item.title)) deleted.push(item.title);
    try { localStorage.setItem('tfc_deleted_downloads', JSON.stringify(deleted)); } catch {}

    try {
      if (isUUID(item.id)) {
        await supabase.from('downloads').delete().eq('id', item.id);
      } else {
        await supabase.from('downloads').delete().eq('title', item.title);
      }
      toast.success('Resource deleted successfully.');
    } catch {
      toast.error('Failed to delete from database.');
    }
  };

  const handleDownloadFile = (file: Download) => {
    const fileUrl = file.file_url;
    const cleanFileName = (file.title || 'document').replace(/[^a-z0-9]/gi, '_');

    try {
      if (fileUrl.startsWith('data:')) {
        const link = document.createElement('a');
        link.href = fileUrl;
        link.download = `${cleanFileName}.${(file.file_type || 'pdf').toLowerCase().includes('pdf') ? 'pdf' : 'bin'}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success(`Downloaded: ${file.title}`);
      } else {
        const link = document.createElement('a');
        link.href = fileUrl;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        link.download = `${cleanFileName}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success(`Opening document: ${file.title}`);
      }
    } catch {
      window.open(fileUrl, '_blank');
    }
  };

  const handleCopyShareLink = (file: Download) => {
    const url = file.file_url.startsWith('http') ? file.file_url : window.location.origin + '/downloads';
    navigator.clipboard.writeText(url);
    toast.success('Link copied to clipboard!');
  };

  const handleWhatsAppShare = (file: Download) => {
    const text = `📄 *The Foundation Collegiate - Academic Resource*\n\n📌 *${file.title}*\n📂 Category: ${file.category}\n📎 Size: ${file.file_size || 'Standard'}\n\n🔗 *Download Link:*\n${file.file_url.startsWith('http') ? file.file_url : window.location.origin + '/downloads'}`;
    const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    window.open(whatsappUrl, '_blank');
  };

  const filteredDownloads = downloads.filter(d => {
    const matchesSearch = (d.title || '').toLowerCase().includes(search.toLowerCase()) ||
                          (d.category || '').toLowerCase().includes(search.toLowerCase()) ||
                          (d.description || '').toLowerCase().includes(search.toLowerCase());
    const matchesCat = selectedCategory === 'All' || d.category.toLowerCase() === selectedCategory.toLowerCase();
    return matchesSearch && matchesCat;
  });

  const totalDownloadsCount = downloads.reduce((acc, d) => acc + (d.download_count || 0), 0);
  const syllabiCount = downloads.filter(d => d.category?.toLowerCase() === 'syllabus').length;
  const formsCount = downloads.filter(d => d.category?.toLowerCase() === 'form').length;

  return (
    <div className="space-y-6 w-full max-w-full pb-12 font-sans antialiased text-slate-900">
      <div className="relative bg-gradient-to-r from-blue-50 via-indigo-50/50 to-white rounded-3xl p-6 sm:p-8 text-slate-900 shadow-xs border border-blue-100/80 overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-600/20 shrink-0">
              <DownloadIcon size={28} />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="px-3 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold border border-emerald-200 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span> {downloads.length} Live Documents
                </span>
                <span className="text-xs text-slate-500 font-mono">Public Student Portal</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-display font-black tracking-tight text-slate-900">
                Academic Downloads &amp; Document Management
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <button onClick={fetchDownloads} className="p-3 rounded-2xl bg-white hover:bg-slate-50 text-slate-700 transition-all shadow-xs border border-slate-200 cursor-pointer">
              <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
            </button>
            <Button onClick={() => { setEditing(null); setForm(emptyForm); setShowForm(!showForm); }} className="px-5 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-blue-500/20 flex items-center gap-2 cursor-pointer">
              <Plus size={18} /> Add New Document
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase">
            <span>Total Resources</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold"><FileText size={16} /></div>
          </div>
          <div className="text-3xl font-display font-black text-slate-900">{downloads.length}</div>
          <div className="text-[11px] font-bold text-emerald-600 flex items-center gap-1"><CheckCircle2 size={13} /> Active in ERP</div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase">
            <span>Syllabus &amp; Papers</span>
            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold"><BookOpen size={16} /></div>
          </div>
          <div className="text-3xl font-display font-black text-slate-900">{syllabiCount}</div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase">
            <span>Forms &amp; Policies</span>
            <div className="w-8 h-8 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center font-bold"><FileCheck size={16} /></div>
          </div>
          <div className="text-3xl font-display font-black text-slate-900">{formsCount}</div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase">
            <span>Student Downloads</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold"><DownloadIcon size={16} /></div>
          </div>
          <div className="text-3xl font-display font-black text-slate-900">{totalDownloadsCount}</div>
        </div>
      </div>

      <AnimatePresence>
        {showForm && (
          <m.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
            <div className="bg-white border border-blue-200 rounded-3xl p-6 sm:p-8 shadow-xl mb-6 ring-2 ring-blue-100">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
                <div>
                  <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-blue-600"></span>{editing ? `Edit Resource: ${editing.title}` : 'Add New Academic Document'}
                  </h2>
                </div>
                <button onClick={() => { setShowForm(false); setEditing(null); }} className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100"><X size={20} /></button>
              </div>
              <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="md:col-span-2">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1.5">Document Title <span className="text-red-500">*</span></label>
                  <input type="text" required value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 text-slate-900 rounded-2xl focus:ring-2 focus:ring-blue-500 text-sm font-semibold shadow-inner" />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1.5">Category <span className="text-red-500">*</span></label>
                  <select value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 text-slate-900 rounded-2xl focus:ring-2 focus:ring-blue-500 text-sm font-semibold shadow-inner cursor-pointer">
                    {CATEGORIES.filter(c => c !== 'All').map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="md:col-span-3">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1.5">Short Description</label>
                  <textarea rows={2} value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 text-slate-900 rounded-2xl focus:ring-2 focus:ring-blue-500 text-sm font-medium shadow-inner" />
                </div>
                <div className="md:col-span-3">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1.5">File Source</label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <label className="cursor-pointer border-2 border-dashed border-blue-200 hover:border-blue-500 bg-blue-50/40 hover:bg-blue-50 rounded-2xl p-5 flex flex-col items-center justify-center text-center transition-all group">
                      {uploading ? <Loader2 size={28} className="animate-spin text-blue-600 mb-2" /> : <FileText size={28} className="text-blue-600 mb-2" />}
                      <span className="text-xs font-bold text-slate-800">{form.file_size ? `Selected: (${form.file_size})` : 'Upload PDF/Document'}</span>
                      <input type="file" onChange={handleFileUpload} className="hidden" />
                    </label>
                    <div className="flex flex-col justify-center space-y-2">
                      <span className="text-xs font-bold text-slate-600">OR Google Drive / Web URL</span>
                      <input type="text" value={form.file_url} onChange={e => setForm(p => ({ ...p, file_url: e.target.value }))} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 text-slate-900 rounded-2xl focus:ring-2 focus:ring-blue-500 text-xs shadow-inner" />
                    </div>
                  </div>
                </div>
                <div className="md:col-span-3 flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                  <Button type="button" variant="outline" onClick={() => { setShowForm(false); setEditing(null); }} className="px-6 py-2.5 rounded-xl">Cancel</Button>
                  <Button type="submit" disabled={submitting} className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-8 py-2.5 rounded-xl">{submitting ? 'Processing...' : (editing ? 'Update' : 'Publish')}</Button>
                </div>
              </form>
            </div>
          </m.div>
        )}
      </AnimatePresence>

      <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 custom-scrollbar">
          {CATEGORIES.map(cat => {
            const count = cat === 'All' ? downloads.length : downloads.filter(d => d.category?.toLowerCase() === cat.toLowerCase()).length;
            return (
              <button key={cat} onClick={() => setSelectedCategory(cat)} className={cn('px-3.5 py-2 rounded-2xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 cursor-pointer', selectedCategory === cat ? 'bg-blue-600 text-white shadow-sm' : 'bg-slate-100 hover:bg-slate-200/70 text-slate-600')}>
                <span>{cat}</span> <span className={cn('px-1.5 py-0.2 rounded-full text-[10px]', selectedCategory === cat ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700')}>{count}</span>
              </button>
            );
          })}
        </div>
        <div className="flex items-center gap-3">
          <div className="relative w-full sm:w-72">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search..." className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 text-slate-800 text-xs font-semibold rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none" />
          </div>
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 shrink-0">
            <button onClick={() => setViewMode('grid')} className={cn('p-1.5 rounded-lg text-xs transition-all', viewMode === 'grid' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-500')}><LayoutGrid size={16} /></button>
            <button onClick={() => setViewMode('table')} className={cn('p-1.5 rounded-lg text-xs transition-all', viewMode === 'table' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-500')}><List size={16} /></button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[...Array(6)].map((_, i) => <div key={i} className="bg-white p-6 rounded-3xl border border-slate-200 h-32 animate-pulse" />)}
        </div>
      ) : filteredDownloads.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center text-slate-500">No resources found.</div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filteredDownloads.map(item => {
            const catStyle = categoryColors[item.category] || categoryColors.other;
            const CatIcon = catStyle.icon;
            return (
              <div key={item.id} className="bg-white rounded-3xl border border-slate-200 p-5 flex flex-col justify-between group">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className={cn('px-2.5 py-1 rounded-full text-[11px] font-bold border flex items-center gap-1.5', catStyle.bg, catStyle.text, catStyle.border)}><CatIcon size={12} />{item.category}</span>
                    <span className="text-[11px] font-bold text-slate-400 font-mono">{item.download_count || 0} hits</span>
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm leading-snug">{item.title}</h3>
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2">{item.description || 'No description available.'}</p>
                  </div>
                </div>
                <div className="space-y-3 pt-4 mt-2 border-t border-slate-100">
                  <div className="flex items-center justify-between text-xs font-mono font-bold text-slate-400">{item.file_type} • {item.file_size}</div>
                  <div className="grid grid-cols-2 gap-2">
                    <button onClick={() => handleDownloadFile(item)} className="py-2 rounded-xl bg-blue-600 text-white font-bold text-xs">Download</button>
                    <button onClick={() => setPreviewDoc(item)} className="py-2 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs">Preview</button>
                  </div>
                  <div className="flex justify-between items-center pt-2 text-slate-400">
                    <div className="flex gap-2">
                      <button onClick={() => handleWhatsAppShare(item)}><MessageCircle size={16} /></button>
                      <button onClick={() => handleCopyShareLink(item)}><Copy size={16} /></button>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => handleEdit(item)}><Pencil size={16} /></button>
                      <button onClick={() => handleDelete(item)}><Trash2 size={16} /></button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-2xs">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="bg-slate-50 border-b text-xs font-bold text-slate-600 uppercase">
                <th className="py-4 px-6">Document Title</th>
                <th className="py-4 px-4">Category</th>
                <th className="py-4 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredDownloads.map(item => (
                <tr key={item.id} className="hover:bg-slate-50">
                  <td className="py-4 px-6 font-bold text-slate-900">{item.title}</td>
                  <td className="py-4 px-4 text-xs font-bold">{item.category}</td>
                  <td className="py-4 px-6 text-right flex gap-2 justify-end">
                    <button onClick={() => handleDownloadFile(item)}><DownloadIcon size={16} /></button>
                    <button onClick={() => handleEdit(item)}><Pencil size={16} /></button>
                    <button onClick={() => handleDelete(item)}><Trash2 size={16} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {previewDoc && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-4xl w-full h-[85vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <h3 className="font-bold text-sm">{previewDoc.title}</h3>
              <button onClick={() => setPreviewDoc(null)}><X size={20} /></button>
            </div>
            <div className="flex-1 p-2 bg-slate-100">
              <iframe src={previewDoc.file_url} className="w-full h-full rounded-2xl bg-white" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
