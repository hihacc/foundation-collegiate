'use client';
export const dynamic = 'force-dynamic';

import React, { useEffect, useState, useRef } from 'react';
import { supabase } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { 
  ImageIcon, Trash2, Plus, Eye, EyeOff, Clock, Filter, 
  Loader2, Link as LinkIcon, UploadCloud, Layers, CheckSquare, 
  Square, X, Check, RefreshCw, ZoomIn, Download, ExternalLink,
  Edit3, Sparkles, FolderPlus, Tag, ShieldCheck, AlertCircle
} from 'lucide-react';
import Button from '@/components/ui/Button';
import { m, AnimatePresence } from 'framer-motion';
import { getStoredData, setStoredData } from '@/lib/utils/storage';

const CATEGORIES = [
  { id: 'Campus', label: 'Campus Life' },
  { id: 'Classroom', label: 'Classroom & Labs' },
  { id: 'Events', label: 'Campus Events & Sports' },
  { id: 'Achievements', label: 'Awards & High Achievers' },
  { id: 'Social Media', label: 'Social Media Updates' }
];

interface BulkUploadQueueItem {
  id: string;
  file?: File;
  previewUrl: string;
  title: string;
  category: string;
  description: string;
  source: string;
  size?: number;
  status: 'pending' | 'uploading' | 'done' | 'error';
  errorMessage?: string;
}

export default function AdminGalleryPage() {
  const [images, setImages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdder, setShowAdder] = useState(false);
  const [adderMode, setAdderMode] = useState<'bulk-files' | 'bulk-urls' | 'single'>('bulk-files');
  
  // Filtering & Search
  const [filterSource, setFilterSource] = useState<'all' | 'admin' | 'instagram' | 'facebook'>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'hidden'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Multi-Selection State
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkActionLoading, setBulkActionLoading] = useState(false);

  // Lightbox State
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);

  // --- 1. SINGLE PHOTO FORM STATE ---
  const [singleForm, setSingleForm] = useState({ 
    title: '', 
    image_url: '', 
    category: 'Campus', 
    description: '',
    source: 'admin',
    postUrl: '' 
  });
  const [singleSubmitting, setSingleSubmitting] = useState(false);

  // --- 2. BULK FILES QUEUE STATE ---
  const [bulkQueue, setBulkQueue] = useState<BulkUploadQueueItem[]>([]);
  const [bulkDefaultCategory, setBulkDefaultCategory] = useState('Campus');
  const [bulkTitlePrefix, setBulkTitlePrefix] = useState('');
  const [bulkDefaultSource, setBulkDefaultSource] = useState('admin');
  const [bulkDefaultDescription, setBulkDefaultDescription] = useState('');
  const [isBulkUploading, setIsBulkUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({ current: 0, total: 0 });
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- 3. BULK URL IMPORT STATE ---
  const [urlRawText, setUrlRawText] = useState('');
  const [urlDefaultCategory, setUrlDefaultCategory] = useState('Campus');
  const [urlTitlePrefix, setUrlTitlePrefix] = useState('');
  const [urlDefaultSource, setUrlDefaultSource] = useState('admin');
  const [urlImporting, setUrlImporting] = useState(false);

  const fetchGallery = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('gallery')
        .select('*')
        .order('post_date', { ascending: false })
        .order('created_at', { ascending: false });
        
      if (!error && data && data.length > 0) {
        setImages(data);
        setStoredData('gallery', data);
      } else {
        const local = getStoredData<any[]>('gallery', []);
        setImages(local);
      }
    } catch (err) {
      console.error(err);
      const local = getStoredData<any[]>('gallery', []);
      setImages(local);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchGallery(); }, []);

  // -------------------------------------------------------------
  // HANDLERS: MULTI-FILE BULK QUEUE
  // -------------------------------------------------------------
  const handleBulkFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    addFilesToQueue(Array.from(files));
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const addFilesToQueue = (files: File[]) => {
    const newItems: BulkUploadQueueItem[] = [];

    files.forEach((file, idx) => {
      if (!file.type.startsWith('image/')) {
        toast.error(`Skipped "${file.name}" (not an image file)`);
        return;
      }
      if (file.size > 15 * 1024 * 1024) {
        toast.error(`Skipped "${file.name}" (exceeds 15MB)`);
        return;
      }

      // Generate a readable title from filename
      const cleanBaseName = file.name
        .replace(/\.[^/.]+$/, '')
        .replace(/[_-]+/g, ' ')
        .replace(/\b\w/g, l => l.toUpperCase())
        .trim();

      const previewUrl = URL.createObjectURL(file);
      newItems.push({
        id: `queue_${Date.now()}_${idx}_${Math.random().toString(36).slice(2, 6)}`,
        file,
        previewUrl,
        title: bulkTitlePrefix ? `${bulkTitlePrefix.trim()} ${cleanBaseName}` : cleanBaseName,
        category: bulkDefaultCategory,
        description: bulkDefaultDescription,
        source: bulkDefaultSource,
        size: file.size,
        status: 'pending'
      });
    });

    if (newItems.length > 0) {
      setBulkQueue(prev => [...prev, ...newItems]);
      toast.success(`Added ${newItems.length} photos to the upload queue!`);
    }
  };

  const removeQueueItem = (id: string) => {
    setBulkQueue(prev => prev.filter(item => item.id !== id));
  };

  const applyGlobalCategoryToQueue = (category: string) => {
    setBulkDefaultCategory(category);
    setBulkQueue(prev => prev.map(item => ({ ...item, category })));
    toast.info(`Updated all queue items to "${category}"`);
  };

  const applyGlobalPrefixToQueue = (prefix: string) => {
    setBulkTitlePrefix(prefix);
    if (!prefix.trim()) return;
    setBulkQueue(prev => prev.map(item => {
      const base = item.file?.name.replace(/\.[^/.]+$/, '').replace(/[_-]+/g, ' ').trim() || 'Photo';
      return { ...item, title: `${prefix.trim()} ${base}` };
    }));
  };

  const handleBulkUploadSubmit = async () => {
    if (bulkQueue.length === 0) {
      toast.error('No photos in upload queue.');
      return;
    }

    try {
      setIsBulkUploading(true);
      setUploadProgress({ current: 0, total: bulkQueue.length });
      toast.loading(`⚡ Uploading & adding ${bulkQueue.length} photos to gallery...`, { id: 'bulk-gal' });

      // 1. Upload files in batches to /api/admin/gallery/upload
      const formData = new FormData();
      bulkQueue.forEach(item => {
        if (item.file) formData.append('files', item.file);
      });

      const uploadRes = await fetch('/api/admin/gallery/upload', {
        method: 'POST',
        body: formData
      });
      const uploadJson = await uploadRes.json();

      if (!uploadJson.success || !uploadJson.files || uploadJson.files.length === 0) {
        throw new Error(uploadJson.error || 'File upload failed');
      }

      // Map uploaded server URLs back to gallery records
      const recordsToInsert = uploadJson.files.map((f: any, idx: number) => {
        const queueItem = bulkQueue[idx] || bulkQueue[0];
        return {
          id: crypto.randomUUID(),
          title: queueItem?.title || f.originalName,
          image_url: f.url,
          category: queueItem?.category || bulkDefaultCategory,
          description: queueItem?.description || bulkDefaultDescription || null,
          source: queueItem?.source || bulkDefaultSource,
          source_post_id: `bulk_${Date.now()}_${idx}`,
          is_active: true,
          display_order: 0,
          post_date: new Date().toISOString(),
          created_at: new Date().toISOString()
        };
      });

      // 2. Batch Insert records via /api/admin/gallery/bulk
      const bulkRes = await fetch('/api/admin/gallery/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: recordsToInsert })
      });
      const bulkJson = await bulkRes.json();

      toast.dismiss('bulk-gal');

      if (bulkJson.success) {
        toast.success(`🎉 Successfully added ${recordsToInsert.length} photos to the Gallery!`);
        setBulkQueue([]);
        setShowAdder(false);
        fetchGallery();
      } else {
        toast.error('Bulk record creation failed: ' + bulkJson.error);
      }

    } catch (err: any) {
      toast.dismiss('bulk-gal');
      toast.error('Bulk upload error: ' + err.message);
    } finally {
      setIsBulkUploading(false);
    }
  };

  // -------------------------------------------------------------
  // HANDLERS: BULK URL IMPORTER
  // -------------------------------------------------------------
  const handleBulkUrlImport = async () => {
    const urls = urlRawText
      .split(/[\n,]+/)
      .map(u => u.trim())
      .filter(u => u.startsWith('http://') || u.startsWith('https://') || u.startsWith('/'));

    if (urls.length === 0) {
      toast.error('Please enter at least one valid image URL');
      return;
    }

    try {
      setUrlImporting(true);
      toast.loading(`Importing ${urls.length} image URLs...`, { id: 'url-import' });

      const items = urls.map((url, idx) => {
        const autoTitle = urlTitlePrefix ? `${urlTitlePrefix.trim()} Photo ${idx + 1}` : `Gallery Photo ${idx + 1}`;
        return {
          id: crypto.randomUUID(),
          title: autoTitle,
          image_url: url,
          category: urlDefaultCategory,
          description: null,
          source: urlDefaultSource,
          is_active: true,
          post_date: new Date().toISOString()
        };
      });

      const res = await fetch('/api/admin/gallery/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items })
      });
      const json = await res.json();
      toast.dismiss('url-import');

      if (json.success) {
        toast.success(`🎉 Successfully imported ${items.length} photos!`);
        setUrlRawText('');
        setShowAdder(false);
        fetchGallery();
      } else {
        toast.error('Import failed: ' + json.error);
      }
    } catch (err: any) {
      toast.dismiss('url-import');
      toast.error('URL import error: ' + err.message);
    } finally {
      setUrlImporting(false);
    }
  };

  // -------------------------------------------------------------
  // HANDLERS: SINGLE PHOTO SUBMIT
  // -------------------------------------------------------------
  const handleSingleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!singleForm.title.trim()) { toast.error('Please enter a title'); return; }
    if (!singleForm.image_url.trim()) { toast.error('Please provide an image'); return; }
    
    setSingleSubmitting(true);
    const newId = crypto.randomUUID();
    const payload = {
      id: newId,
      title: singleForm.title.trim(),
      image_url: singleForm.image_url.trim(),
      category: singleForm.category || 'Campus',
      description: singleForm.description.trim() || null,
      source: singleForm.source,
      source_post_id: singleForm.postUrl.trim() || `manual_${newId}`,
      is_active: true,
      post_date: new Date().toISOString(),
      created_at: new Date().toISOString(),
    };

    const res = await fetch('/api/admin/gallery/bulk', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items: [payload] })
    });
    const json = await res.json();
    
    if (json.success) {
      setImages([payload, ...images]);
      toast.success('Picture added to Gallery!');
      setShowAdder(false);
      setSingleForm({ title: '', image_url: '', category: 'Campus', description: '', source: 'admin', postUrl: '' });
    } else {
      toast.error('Failed to add picture: ' + json.error);
    }
    setSingleSubmitting(false);
  };

  // -------------------------------------------------------------
  // MULTI-SELECTION BATCH ACTIONS
  // -------------------------------------------------------------
  const toggleSelectAll = () => {
    if (selectedIds.size === filteredImages.length && filteredImages.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredImages.map(img => img.id)));
    }
  };

  const toggleSelectOne = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const handleBulkDelete = async () => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;
    if (!confirm(`Are you sure you want to permanently delete all ${ids.length} selected photos?`)) return;

    try {
      setBulkActionLoading(true);
      const res = await fetch('/api/admin/gallery/bulk', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids })
      });
      const json = await res.json();
      if (json.success) {
        toast.success(`Deleted ${ids.length} photos!`);
        setImages(images.filter(img => !selectedIds.has(img.id)));
        setSelectedIds(new Set());
      } else {
        toast.error('Bulk delete failed: ' + json.error);
      }
    } catch (e: any) {
      toast.error('Error: ' + e.message);
    } finally {
      setBulkActionLoading(false);
    }
  };

  const handleBulkVisibility = async (makeActive: boolean) => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;

    try {
      setBulkActionLoading(true);
      const res = await fetch('/api/admin/gallery/bulk', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids, updates: { is_active: makeActive } })
      });
      const json = await res.json();
      if (json.success) {
        toast.success(`Updated ${ids.length} photos to ${makeActive ? 'Published' : 'Hidden'}!`);
        setImages(images.map(img => selectedIds.has(img.id) ? { ...img, is_active: makeActive } : img));
        setSelectedIds(new Set());
      } else {
        toast.error('Bulk update failed: ' + json.error);
      }
    } catch (e: any) {
      toast.error('Error: ' + e.message);
    } finally {
      setBulkActionLoading(false);
    }
  };

  const handleBulkCategoryChange = async (category: string) => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0 || !category) return;

    try {
      setBulkActionLoading(true);
      const res = await fetch('/api/admin/gallery/bulk', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids, updates: { category } })
      });
      const json = await res.json();
      if (json.success) {
        toast.success(`Moved ${ids.length} photos to "${category}"!`);
        setImages(images.map(img => selectedIds.has(img.id) ? { ...img, category } : img));
        setSelectedIds(new Set());
      } else {
        toast.error('Category change failed: ' + json.error);
      }
    } catch (e: any) {
      toast.error('Error: ' + e.message);
    } finally {
      setBulkActionLoading(false);
    }
  };

  const handleDeleteSingle = async (id: string) => {
    if (!confirm('Permanently delete this picture?')) return;
    try {
      await fetch('/api/admin/gallery/bulk', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: [id] })
      });
      setImages(images.filter(img => img.id !== id));
      toast.success('Picture deleted successfully!');
    } catch {
      toast.error('Delete failed');
    }
  };

  const toggleVisibilitySingle = async (id: string, currentState: boolean) => {
    try {
      await fetch('/api/admin/gallery/bulk', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: [id], updates: { is_active: !currentState } })
      });
      setImages(images.map(img => img.id === id ? { ...img, is_active: !currentState } : img));
      toast.success(currentState ? 'Image hidden' : 'Image published');
    } catch {
      toast.error('Visibility update failed');
    }
  };

  // Filtered List
  const filteredImages = images.filter(img => {
    if (filterSource !== 'all' && img.source !== filterSource) return false;
    if (filterCategory !== 'all' && img.category !== filterCategory) return false;
    if (filterStatus === 'active' && !img.is_active) return false;
    if (filterStatus === 'hidden' && img.is_active) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        img.title?.toLowerCase().includes(q) ||
        img.category?.toLowerCase().includes(q) ||
        img.description?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto font-sans px-2 sm:px-4">
      
      {/* Header Banner */}
      <div className="bg-linear-to-r from-slate-900 via-blue-950 to-indigo-950 rounded-3xl p-6 sm:p-8 text-white shadow-xl border border-blue-900/40 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-white/10 text-blue-200 text-xs font-bold border border-white/15 flex items-center gap-1.5 backdrop-blur-xs">
                <ImageIcon size={14} className="text-blue-400" /> Gallery Content Manager
              </span>
              <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-500/30 flex items-center gap-1.5">
                <Sparkles size={13} className="text-emerald-400" />
                Bulk Multi-Upload Ready
              </span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-display font-black tracking-tight text-white">
              Campus Photo Gallery
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm max-w-2xl leading-relaxed">
              Upload multiple photos simultaneously in bulk, drag &amp; drop event galleries, or import image links directly into the college gallery.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => { setShowAdder(!showAdder); setAdderMode('bulk-files'); }}
              className="px-5 py-3 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black text-xs sm:text-sm transition-all shadow-lg shadow-blue-900/40 flex items-center gap-2 cursor-pointer"
            >
              <UploadCloud size={18} />
              <span>⚡ Bulk Add Photos</span>
            </button>

            <button
              onClick={fetchGallery}
              className="px-4 py-3 rounded-2xl bg-white/10 hover:bg-white/20 text-white border border-white/20 font-bold text-xs sm:text-sm transition-all flex items-center gap-2 cursor-pointer backdrop-blur-xs"
            >
              <RefreshCw size={15} className={loading ? 'animate-spin' : ''} /> Refresh
            </button>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* BULK ADDER PANEL (Multi-File / URLs / Single)           */}
      {/* ======================================================== */}
      <AnimatePresence>
        {showAdder && (
          <m.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-white border-2 border-blue-200 rounded-3xl p-6 sm:p-7 shadow-xl space-y-6 relative overflow-hidden"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2.5">
                <span className="p-2 rounded-2xl bg-blue-100 text-blue-700">
                  <Layers size={20} />
                </span>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Add Photos to Gallery</h3>
                  <p className="text-xs text-slate-500">Choose your preferred upload method below.</p>
                </div>
              </div>

              {/* Adder Mode Tabs */}
              <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-2xl text-xs font-bold">
                <button
                  onClick={() => setAdderMode('bulk-files')}
                  className={`px-3.5 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
                    adderMode === 'bulk-files' 
                      ? 'bg-blue-600 text-white shadow-xs' 
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <UploadCloud size={14} /> Bulk Multi-File Upload
                </button>

                <button
                  onClick={() => setAdderMode('bulk-urls')}
                  className={`px-3.5 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
                    adderMode === 'bulk-urls' 
                      ? 'bg-blue-600 text-white shadow-xs' 
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <LinkIcon size={14} /> Bulk URLs Import
                </button>

                <button
                  onClick={() => setAdderMode('single')}
                  className={`px-3.5 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
                    adderMode === 'single' 
                      ? 'bg-blue-600 text-white shadow-xs' 
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Plus size={14} /> Single Photo
                </button>
              </div>
            </div>

            {/* --- TAB 1: MULTI-FILE BULK UPLOAD --- */}
            {adderMode === 'bulk-files' && (
              <div className="space-y-6">
                
                {/* Drag & Drop Box */}
                <div 
                  onDragOver={e => e.preventDefault()}
                  onDrop={e => {
                    e.preventDefault();
                    if (e.dataTransfer.files) addFilesToQueue(Array.from(e.dataTransfer.files));
                  }}
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-blue-300 hover:border-blue-500 bg-blue-50/40 hover:bg-blue-50/80 rounded-3xl p-8 text-center transition-all cursor-pointer space-y-3 group"
                >
                  <input
                    type="file"
                    multiple
                    ref={fileInputRef}
                    onChange={handleBulkFileSelect}
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    className="hidden"
                  />
                  <div className="w-16 h-16 rounded-2xl bg-blue-100 group-hover:scale-110 text-blue-600 flex items-center justify-center mx-auto transition-transform shadow-xs">
                    <UploadCloud size={32} />
                  </div>
                  <div>
                    <p className="font-bold text-slate-800 text-sm sm:text-base">
                      Drag &amp; drop multiple images here, or <span className="text-blue-600 underline">browse files</span>
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      Select 5, 10, 50, or 100+ images at once (JPG, PNG, WEBP, GIF up to 15MB each).
                    </p>
                  </div>
                </div>

                {/* Batch Common Configuration Controls */}
                {bulkQueue.length > 0 && (
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                        <Sparkles size={14} className="text-blue-600" /> Apply Default Settings to All Queued Photos ({bulkQueue.length}):
                      </span>
                      <button
                        onClick={() => setBulkQueue([])}
                        className="text-xs text-red-600 hover:underline font-bold cursor-pointer"
                      >
                        Clear All Queue
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="text-[11px] font-bold text-slate-600 block mb-1">Default Category:</label>
                        <select
                          value={bulkDefaultCategory}
                          onChange={e => applyGlobalCategoryToQueue(e.target.value)}
                          className="w-full p-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          {CATEGORIES.map(c => (
                            <option key={c.id} value={c.id}>{c.label}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="text-[11px] font-bold text-slate-600 block mb-1">Title Prefix / Event Name:</label>
                        <input
                          type="text"
                          value={bulkTitlePrefix}
                          onChange={e => applyGlobalPrefixToQueue(e.target.value)}
                          placeholder="e.g. Sports Gala 2026 -"
                          className="w-full p-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      <div>
                        <label className="text-[11px] font-bold text-slate-600 block mb-1">Source Tag:</label>
                        <select
                          value={bulkDefaultSource}
                          onChange={e => {
                            setBulkDefaultSource(e.target.value);
                            setBulkQueue(prev => prev.map(item => ({ ...item, source: e.target.value })));
                          }}
                          className="w-full p-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="admin">Manual Upload (Website)</option>
                          <option value="instagram">Instagram Post</option>
                          <option value="facebook">Facebook Post</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}

                {/* Queue Cards Grid */}
                {bulkQueue.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="font-bold text-xs text-slate-700">Photos in Queue ({bulkQueue.length}):</h4>
                    <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 border border-slate-200 rounded-2xl">
                      {bulkQueue.map((item, idx) => (
                        <div key={item.id} className="p-3 bg-white hover:bg-slate-50 flex items-center justify-between gap-3 text-xs">
                          <div className="flex items-center gap-3 min-w-0">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={item.previewUrl} alt="Preview" className="w-12 h-12 rounded-xl object-cover shrink-0 border border-slate-200" />
                            <div className="min-w-0 space-y-1">
                              <input
                                type="text"
                                value={item.title}
                                onChange={e => {
                                  const val = e.target.value;
                                  setBulkQueue(prev => prev.map(p => p.id === item.id ? { ...p, title: val } : p));
                                }}
                                className="font-bold text-slate-800 text-xs bg-transparent border-b border-transparent hover:border-slate-300 focus:border-blue-500 outline-none w-full max-w-sm truncate"
                              />
                              <div className="flex items-center gap-2 text-[10px] text-slate-500">
                                <span>{item.size ? `${(item.size / 1024).toFixed(0)} KB` : ''}</span>
                                <span>•</span>
                                <span className="font-semibold text-blue-600">{item.category}</span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <select
                              value={item.category}
                              onChange={e => {
                                const val = e.target.value;
                                setBulkQueue(prev => prev.map(p => p.id === item.id ? { ...p, category: val } : p));
                              }}
                              className="px-2 py-1 bg-slate-100 rounded-lg text-[11px] font-semibold text-slate-700 outline-none"
                            >
                              {CATEGORIES.map(c => (
                                <option key={c.id} value={c.id}>{c.label}</option>
                              ))}
                            </select>

                            <button
                              onClick={() => removeQueueItem(item.id)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 cursor-pointer"
                              title="Remove from queue"
                            >
                              <X size={15} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Bulk Actions Button */}
                {bulkQueue.length > 0 && (
                  <div className="flex items-center justify-end gap-3 pt-2">
                    <button
                      onClick={() => setBulkQueue([])}
                      className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleBulkUploadSubmit}
                      disabled={isBulkUploading}
                      className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-md flex items-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      {isBulkUploading ? <RefreshCw size={15} className="animate-spin" /> : <UploadCloud size={15} />}
                      <span>Upload &amp; Add All to Gallery ({bulkQueue.length} Photos)</span>
                    </button>
                  </div>
                )}

              </div>
            )}

            {/* --- TAB 2: BULK URLS IMPORT --- */}
            {adderMode === 'bulk-urls' && (
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1.5">
                    Paste Image URLs (One URL per line):
                  </label>
                  <textarea
                    rows={6}
                    value={urlRawText}
                    onChange={e => setUrlRawText(e.target.value)}
                    placeholder="https://example.com/photo1.jpg&#10;https://example.com/photo2.png&#10;https://images.unsplash.com/photo-..."
                    className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-mono text-slate-800 focus:ring-2 focus:ring-blue-500 outline-none leading-relaxed"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">Paste image URLs from cloud storage, CDN, Instagram CDN, or external drives.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 block mb-1">Category:</label>
                    <select
                      value={urlDefaultCategory}
                      onChange={e => setUrlDefaultCategory(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {CATEGORIES.map(c => (
                        <option key={c.id} value={c.id}>{c.label}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-600 block mb-1">Title Prefix:</label>
                    <input
                      type="text"
                      value={urlTitlePrefix}
                      onChange={e => setUrlTitlePrefix(e.target.value)}
                      placeholder="e.g. Science Fair 2026"
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-600 block mb-1">Source:</label>
                    <select
                      value={urlDefaultSource}
                      onChange={e => setUrlDefaultSource(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="admin">Manual URL</option>
                      <option value="instagram">Instagram</option>
                      <option value="facebook">Facebook</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    onClick={() => setShowAdder(false)}
                    className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleBulkUrlImport}
                    disabled={urlImporting || !urlRawText.trim()}
                    className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-md flex items-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {urlImporting ? <RefreshCw size={15} className="animate-spin" /> : <LinkIcon size={15} />}
                    <span>Import All URLs to Gallery</span>
                  </button>
                </div>
              </div>
            )}

            {/* --- TAB 3: SINGLE PHOTO --- */}
            {adderMode === 'single' && (
              <form onSubmit={handleSingleAdd} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Photo Title <span className="text-red-500">*</span></label>
                    <input
                      required
                      type="text"
                      placeholder="e.g. Science Exhibition 2026"
                      value={singleForm.title}
                      onChange={e => setSingleForm(prev => ({ ...prev, title: e.target.value }))}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Category</label>
                    <select
                      value={singleForm.category}
                      onChange={e => setSingleForm(prev => ({ ...prev, category: e.target.value }))}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer"
                    >
                      {CATEGORIES.map(c => (
                        <option key={c.id} value={c.id}>{c.label}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Image URL or Upload</label>
                    <input
                      type="text"
                      placeholder="https://... or /uploads/..."
                      value={singleForm.image_url}
                      onChange={e => setSingleForm(prev => ({ ...prev, image_url: e.target.value }))}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Source</label>
                    <select
                      value={singleForm.source}
                      onChange={e => setSingleForm(prev => ({ ...prev, source: e.target.value }))}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer"
                    >
                      <option value="admin">Manual Upload (Website)</option>
                      <option value="instagram">Instagram Post</option>
                      <option value="facebook">Facebook Post</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-end pt-3 border-t border-slate-100 gap-2">
                  <button type="button" onClick={() => setShowAdder(false)} className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold cursor-pointer">
                    Cancel
                  </button>
                  <button type="submit" disabled={singleSubmitting} className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-md flex items-center gap-1.5 cursor-pointer disabled:opacity-50">
                    {singleSubmitting ? <RefreshCw size={14} className="animate-spin" /> : <Plus size={14} />}
                    <span>Add Photo</span>
                  </button>
                </div>
              </form>
            )}

          </m.div>
        )}
      </AnimatePresence>

      {/* ======================================================== */}
      {/* FILTER & BATCH SELECTION CONTROL BAR                    */}
      {/* ======================================================== */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-4 sm:p-5 space-y-4">
        <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between">
          
          {/* Search Box */}
          <div className="relative flex-1">
            <Filter size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search by photo title, category, event..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          {/* Filters Row */}
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={filterCategory}
              onChange={e => setFilterCategory(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 text-slate-700 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer"
            >
              <option value="all">All Categories</option>
              {CATEGORIES.map(c => (
                <option key={c.id} value={c.id}>{c.label}</option>
              ))}
            </select>

            <select
              value={filterSource}
              onChange={e => setFilterSource(e.target.value as any)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 text-slate-700 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer"
            >
              <option value="all">All Sources</option>
              <option value="admin">Manual Uploads</option>
              <option value="instagram">Instagram</option>
              <option value="facebook">Facebook</option>
            </select>

            <select
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value as any)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 text-slate-700 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer"
            >
              <option value="all">All Statuses</option>
              <option value="active">Published Only</option>
              <option value="hidden">Hidden Only</option>
            </select>

            <button
              onClick={toggleSelectAll}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                selectedIds.size > 0 && selectedIds.size === filteredImages.length
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              <CheckSquare size={14} />
              <span>{selectedIds.size === filteredImages.length && filteredImages.length > 0 ? 'Deselect All' : 'Select All'}</span>
            </button>
          </div>
        </div>

        {/* Multi-Select Action Sticky Bar */}
        {selectedIds.size > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-3.5 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 font-bold text-blue-900">
              <span className="w-2 h-2 rounded-full bg-blue-600" />
              <span>{selectedIds.size} Photo{selectedIds.size > 1 ? 's' : ''} Selected</span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => handleBulkVisibility(true)}
                disabled={bulkActionLoading}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition-all flex items-center gap-1 cursor-pointer"
              >
                <Eye size={13} /> Publish Selected
              </button>

              <button
                onClick={() => handleBulkVisibility(false)}
                disabled={bulkActionLoading}
                className="px-3 py-1.5 bg-slate-700 hover:bg-slate-800 text-white font-bold rounded-xl transition-all flex items-center gap-1 cursor-pointer"
              >
                <EyeOff size={13} /> Hide Selected
              </button>

              <select
                onChange={e => {
                  if (e.target.value) handleBulkCategoryChange(e.target.value);
                }}
                defaultValue=""
                className="px-3 py-1.5 bg-white border border-blue-200 text-slate-700 font-bold rounded-xl outline-none cursor-pointer"
              >
                <option value="" disabled>Move Category to...</option>
                {CATEGORIES.map(c => (
                  <option key={c.id} value={c.id}>{c.label}</option>
                ))}
              </select>

              <button
                onClick={handleBulkDelete}
                disabled={bulkActionLoading}
                className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl transition-all flex items-center gap-1 cursor-pointer"
              >
                <Trash2 size={13} /> Delete Selected ({selectedIds.size})
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ======================================================== */}
      {/* GALLERY GRID VIEW                                        */}
      {/* ======================================================== */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-6">
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
          <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
            <span>Gallery Database</span>
            <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-xs font-mono">
              {filteredImages.length} photo{filteredImages.length !== 1 ? 's' : ''}
            </span>
          </h2>
        </div>

        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin mb-4 text-blue-500" />
            <p className="text-xs font-bold">Loading gallery photos...</p>
          </div>
        ) : filteredImages.length === 0 ? (
          <div className="py-20 text-center text-slate-400 flex flex-col items-center space-y-2">
            <ImageIcon className="w-12 h-12 mb-2 opacity-50" />
            <p className="text-sm font-bold text-slate-700">No photos match your filters</p>
            <p className="text-xs text-slate-500">Click &quot;⚡ Bulk Add Photos&quot; above to upload gallery photos.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredImages.map((img) => {
              const isSelected = selectedIds.has(img.id);

              return (
                <div 
                  key={img.id} 
                  className={`group relative bg-white border-2 rounded-2xl overflow-hidden transition-all shadow-2xs hover:shadow-md ${
                    isSelected
                      ? 'border-blue-500 ring-2 ring-blue-400 bg-blue-50/20'
                      : img.is_active 
                      ? 'border-slate-200 hover:border-blue-300' 
                      : 'border-amber-300 bg-amber-50/20 opacity-80'
                  }`}
                >
                  {/* Photo Container */}
                  <div className="relative aspect-video bg-slate-100 overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img 
                      src={img.image_url} 
                      alt={img.title} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 cursor-pointer"
                      onClick={() => setLightboxUrl(img.image_url)}
                    />
                    
                    {/* Selection Checkbox (Top Left) */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleSelectOne(img.id);
                      }}
                      className={`absolute top-2.5 left-2.5 w-6 h-6 rounded-lg flex items-center justify-center transition-all cursor-pointer shadow-sm ${
                        isSelected 
                          ? 'bg-blue-600 text-white' 
                          : 'bg-white/90 text-slate-600 hover:bg-white'
                      }`}
                    >
                      {isSelected ? <Check size={14} className="stroke-[3]" /> : <Square size={14} className="opacity-40" />}
                    </button>

                    {/* Source & Status Pill (Top Right) */}
                    <div className="absolute top-2.5 right-2.5 flex items-center gap-1">
                      {!img.is_active && (
                        <span className="bg-amber-500 text-white px-2 py-0.5 rounded-md text-[10px] font-black tracking-wider shadow-sm">
                          HIDDEN
                        </span>
                      )}
                      <span className="bg-black/60 backdrop-blur-xs text-white px-2 py-0.5 rounded-md text-[10px] font-bold shadow-sm">
                        {img.category || 'Campus'}
                      </span>
                    </div>

                    {/* Quick Lightbox Action Overlay */}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                      <span className="p-2 rounded-full bg-white/90 text-slate-900 shadow-md">
                        <ZoomIn size={18} />
                      </span>
                    </div>
                  </div>
                  
                  {/* Details Card */}
                  <div className="p-3.5 space-y-2">
                    <h4 className="font-bold text-xs text-slate-900 truncate" title={img.title}>
                      {img.title}
                    </h4>

                    <div className="flex items-center justify-between text-[10px] text-slate-500">
                      <span className="flex items-center gap-1">
                        <Clock size={11} /> 
                        {new Date(img.post_date || img.created_at).toLocaleDateString()}
                      </span>
                      <span className="font-semibold text-slate-600 capitalize">
                        {img.source || 'admin'}
                      </span>
                    </div>
                    
                    {/* Card Actions */}
                    <div className="flex items-center gap-1.5 pt-2 border-t border-slate-100">
                      <button
                        onClick={() => toggleVisibilitySingle(img.id, img.is_active)}
                        className={`flex-1 flex justify-center items-center gap-1 py-1.5 rounded-xl text-[11px] font-bold transition-colors cursor-pointer ${
                          img.is_active 
                            ? 'bg-slate-100 text-slate-700 hover:bg-slate-200' 
                            : 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                        }`}
                      >
                        {img.is_active ? <><EyeOff size={13} /> Hide</> : <><Eye size={13} /> Publish</>}
                      </button>

                      <button
                        onClick={() => handleDeleteSingle(img.id)}
                        className="p-1.5 rounded-xl bg-red-50 text-red-600 hover:bg-red-100 transition-colors cursor-pointer"
                        title="Delete permanently"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ======================================================== */}
      {/* LIGHTBOX VIEWER MODAL                                    */}
      {/* ======================================================== */}
      {lightboxUrl && (
        <div 
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setLightboxUrl(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh] flex flex-col items-center gap-3">
            <button
              onClick={() => setLightboxUrl(null)}
              className="absolute -top-10 right-0 text-white hover:text-slate-300 p-1 cursor-pointer"
            >
              <X size={24} />
            </button>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={lightboxUrl}
              alt="Lightbox View"
              className="max-h-[80vh] w-auto object-contain rounded-2xl shadow-2xl border border-white/10"
              onClick={e => e.stopPropagation()}
            />
            <div className="flex items-center gap-2">
              <a
                href={lightboxUrl}
                download="gallery-photo.jpg"
                className="px-4 py-2 bg-white text-slate-900 font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-md cursor-pointer"
                onClick={e => e.stopPropagation()}
              >
                <Download size={14} /> Download Original
              </a>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
