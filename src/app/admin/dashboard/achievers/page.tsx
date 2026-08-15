'use client';
export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { Plus, Trash2, Pencil, Search, Loader2, Trophy, Upload, Star, Check } from 'lucide-react';
import Button from '@/components/ui/Button';
import { Achiever } from '@/types';
import { m, AnimatePresence } from 'framer-motion';
import { formatGoogleDriveImageUrl } from '@/lib/utils/googleDrive';
import { optimizeUploadedImage } from '@/lib/utils/imageOptimizer';

const isUUID = (str: any) => typeof str === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);

const initialAchieversSeed: Achiever[] = [
  { id: '110e8400-e29b-41d4-a716-446655440091', name: 'Ibrahim Asif', position: '1ST POSITION', board: 'BSEK SCIENCE GROUP 2026', percentage: '95.0%', photo_url: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=800&q=80', is_active: true, display_order: 1 },
  { id: '110e8400-e29b-41d4-a716-446655440092', name: 'Ayesha Fatima', position: '1ST POSITION', board: 'BIEK PRE-MEDICAL 2026', percentage: '94.6%', photo_url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=800&q=80', is_active: true, display_order: 2 },
  { id: '110e8400-e29b-41d4-a716-446655440093', name: 'Muhammad Hamza', position: '2ND POSITION', board: 'BIEK PRE-ENGINEERING 2026', percentage: '93.8%', photo_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=800&q=80', is_active: true, display_order: 3 },
  { id: '110e8400-e29b-41d4-a716-446655440094', name: 'Zainab Tariq', position: '1ST POSITION', board: 'BIEK COMPUTER SCIENCE 2026', percentage: '92.4%', photo_url: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=800&q=80', is_active: true, display_order: 4 },
];

export default function AdminAchieversPage() {
  const [achievers, setAchievers] = useState<Achiever[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Achiever | null>(null);
  const [search, setSearch] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const [form, setForm] = useState({
    name: '',
    position: '1ST POSITION',
    board: 'BSEK SCIENCE GROUP 2026',
    percentage: '95.0%',
    photo_url: '',
    is_active: true,
  });

  const getDeletedIds = (): string[] => {
    try { return JSON.parse(localStorage.getItem('tfc_deleted_achievers') || '[]'); } catch { return []; }
  };

  const fetchAchievers = async () => {
    const deletedIds = getDeletedIds();
    try {
      setLoading(true);
      const { data, error } = await supabase.from('achievers').select('*').order('created_at', { ascending: false });
      if (!error && data && data.length > 0) {
        const filteredData = data.filter((a: any) => !deletedIds.includes(a.id) && !deletedIds.includes(a.name));
        setAchievers(filteredData as Achiever[]);
        try { localStorage.setItem('tfc_achievers_cache', JSON.stringify(filteredData)); } catch {}
      } else {
        const local = JSON.parse(localStorage.getItem('tfc_achievers_cache') || '[]');
        const filteredLocal = (local.length > 0 ? local : initialAchieversSeed).filter((a: any) => !deletedIds.includes(a.id) && !deletedIds.includes(a.name));
        setAchievers(filteredLocal);
      }
    } catch {
      const local = JSON.parse(localStorage.getItem('tfc_achievers_cache') || '[]');
      const filteredLocal = (local.length > 0 ? local : initialAchieversSeed).filter((a: any) => !deletedIds.includes(a.id) && !deletedIds.includes(a.name));
      setAchievers(filteredLocal);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAchievers();
  }, []);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingPhoto(true);
    const toastId = toast.loading('Processing and optimizing your picture...');

    try {
      const optimizedDataUrl = await optimizeUploadedImage(file);
      if (optimizedDataUrl) {
        setForm(prev => ({ ...prev, photo_url: optimizedDataUrl }));
        toast.success('Your picture is ready & previewed below!', { id: toastId });
      }
    } catch (err: any) {
      toast.error('Image upload notice: ' + (err.message || 'Failed to process image'), { id: toastId });
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    const rawPhotoUrl = form.photo_url.trim();
    let formattedPhotoUrl = rawPhotoUrl;
    if (rawPhotoUrl.includes('drive.google.com')) {
      formattedPhotoUrl = formatGoogleDriveImageUrl(rawPhotoUrl);
    }
    if (!formattedPhotoUrl) {
      formattedPhotoUrl = 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=800&q=80';
    }

    const newId = editing ? editing.id : crypto.randomUUID();
    const payload = {
      id: newId,
      name: form.name.trim(),
      position: form.position.trim().toUpperCase(),
      board: form.board.trim().toUpperCase(),
      percentage: form.percentage.trim(),
      photo_url: formattedPhotoUrl,
      is_active: form.is_active,
    };

    try {
      if (editing) {
        if (isUUID(editing.id)) {
          await supabase.from('achievers').update(payload).eq('id', editing.id);
        } else {
          await supabase.from('achievers').update(payload).eq('name', editing.name);
        }
        const updated = achievers.map(a => a.id === editing.id ? { ...a, ...payload } : a);
        setAchievers(updated);
        try { localStorage.setItem('tfc_achievers_cache', JSON.stringify(updated)); } catch {}
        toast.success('Top Achiever photo & profile updated successfully!');
      } else {
        const { error } = await supabase.from('achievers').insert([payload]);
        if (error) console.warn('Supabase DB Insert Notice:', error.message);
        
        const updated = [payload as Achiever, ...achievers];
        setAchievers(updated);
        try { localStorage.setItem('tfc_achievers_cache', JSON.stringify(updated)); } catch {}
        toast.success('Top Achiever added successfully with your photo!');
      }

      setForm({
        name: '',
        position: '1ST POSITION',
        board: 'BSEK SCIENCE GROUP 2026',
        percentage: '95.0%',
        photo_url: '',
        is_active: true,
      });
      setShowForm(false);
      setEditing(null);
    } catch (err: any) {
      toast.error('Failed to save: ' + (err?.message || 'Database error'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (a: Achiever) => {
    setEditing(a);
    setForm({
      name: a.name,
      position: a.position,
      board: a.board || 'BSEK SCIENCE GROUP 2026',
      percentage: a.percentage || '95.0%',
      photo_url: a.photo_url || '',
      is_active: a.is_active !== false,
    });
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to permanently delete this Top Achiever card?')) return;
    
    const targetAchiever = achievers.find(a => a.id === id);
    const updated = achievers.filter(a => a.id !== id);
    setAchievers(updated);

    try {
      const deletedList = getDeletedIds();
      deletedList.push(id);
      if (targetAchiever?.name) deletedList.push(targetAchiever.name);
      localStorage.setItem('tfc_deleted_achievers', JSON.stringify(Array.from(new Set(deletedList))));
      localStorage.setItem('tfc_achievers_cache', JSON.stringify(updated));
    } catch {}

    try {
      if (isUUID(id)) {
        await supabase.from('achievers').delete().eq('id', id);
      } else if (targetAchiever?.name) {
        await supabase.from('achievers').delete().eq('name', targetAchiever.name);
      }
      toast.success('Achiever card permanently deleted.');
    } catch {
      toast.success('Achiever card removed.');
    }
  };

  const filtered = achievers.filter(a =>
    a.name.toLowerCase().includes(search.toLowerCase()) ||
    (a.position && a.position.toLowerCase().includes(search.toLowerCase())) ||
    (a.board && a.board.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto font-sans">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <Trophy className="text-amber-500" size={28} />
            <h1 className="text-2xl sm:text-3xl font-display font-bold text-slate-800">Top Achievers / Hall of Fame</h1>
          </div>
          <p className="text-slate-500 text-sm mt-1">
            {achievers.length} board toppers displayed live on website
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative w-full sm:w-64">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              value={search} 
              onChange={e => setSearch(e.target.value)}
              placeholder="Search achiever, board..."
              className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 text-slate-800 text-sm rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none shadow-inner"
            />
          </div>
          <Button size="sm" onClick={() => { setEditing(null); setShowForm(!showForm); }} className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold w-full sm:w-auto shrink-0 shadow-md">
            <Plus size={16} className="mr-1.5" /> Add Top Achiever
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
            <div className="bg-white border border-amber-200 rounded-3xl p-5 sm:p-7 shadow-md mb-6 ring-1 ring-amber-100">
              <h2 className="text-lg font-bold text-slate-800 mb-4 pb-3 border-b border-slate-100 flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                {editing ? `Edit Top Achiever: ${editing.name}` : 'Register Top Achiever'}
              </h2>

              <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                <div>
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">Achiever Full Name <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    required
                    value={form.name}
                    onChange={e => setForm(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g. Ibrahim Asif"
                    className="w-full px-4 py-2.5 bg-white border border-slate-200 text-slate-800 rounded-xl focus:ring-2 focus:ring-amber-500 text-sm font-semibold transition-all shadow-sm"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">Position / Rank <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    required
                    value={form.position}
                    onChange={e => setForm(prev => ({ ...prev, position: e.target.value.toUpperCase() }))}
                    placeholder="e.g. 1ST POSITION"
                    className="w-full px-4 py-2.5 bg-white border border-slate-200 text-slate-800 rounded-xl focus:ring-2 focus:ring-amber-500 text-sm font-semibold transition-all shadow-sm"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">Board / Group Name <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    required
                    value={form.board}
                    onChange={e => setForm(prev => ({ ...prev, board: e.target.value.toUpperCase() }))}
                    placeholder="e.g. BSEK SCIENCE GROUP 2026"
                    className="w-full px-4 py-2.5 bg-white border border-slate-200 text-slate-800 rounded-xl focus:ring-2 focus:ring-amber-500 text-sm font-semibold transition-all shadow-sm"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">Marks / Percentage <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    required
                    value={form.percentage}
                    onChange={e => setForm(prev => ({ ...prev, percentage: e.target.value }))}
                    placeholder="e.g. 95.0% or 1045/1100"
                    className="w-full px-4 py-2.5 bg-white border border-slate-200 text-slate-800 rounded-xl focus:ring-2 focus:ring-amber-500 text-sm font-semibold transition-all shadow-sm"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">Upload Student Portrait Photo</label>
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                    <label className="cursor-pointer bg-white border border-slate-300 hover:bg-slate-100 text-slate-800 px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all shadow-xs shrink-0">
                      {uploadingPhoto ? <Loader2 size={16} className="animate-spin text-amber-500" /> : <Upload size={16} className="text-amber-500" />}
                      <span>{uploadingPhoto ? 'Optimizing Photo...' : 'Choose Picture from Device'}</span>
                      <input 
                        type="file" 
                        accept="image/*,.heic,.heif,.jpg,.jpeg,.png,.webp" 
                        onChange={handlePhotoUpload} 
                        className="hidden" 
                      />
                    </label>
                    <span className="text-xs text-slate-400 font-medium">Or paste image URL:</span>
                    <input
                      type="text"
                      value={form.photo_url}
                      onChange={e => setForm(prev => ({ ...prev, photo_url: e.target.value }))}
                      placeholder="https://... or data:image/..."
                      className="w-full px-3 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl text-xs outline-none"
                    />
                  </div>

                  {form.photo_url && (
                    <div className="mt-3 flex items-center gap-3 bg-amber-50/70 p-3 rounded-2xl border border-amber-200">
                      <div className="w-14 h-14 rounded-xl overflow-hidden bg-slate-200 shrink-0 border border-slate-300 shadow-xs">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img 
                          src={form.photo_url} 
                          alt="Live Preview" 
                          className="w-full h-full object-cover" 
                        />
                      </div>
                      <div className="text-xs">
                        <span className="font-bold text-amber-900 block flex items-center gap-1">
                          <Check size={14} className="text-emerald-600" /> Your Picture Is Selected &amp; Ready
                        </span>
                        <span className="text-slate-500 text-[11px]">This exact photo will be displayed on the card.</span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="sm:col-span-full flex justify-end gap-3 pt-3 border-t border-slate-100">
                  <Button type="button" variant="outline" size="sm" onClick={() => { setShowForm(false); setEditing(null); }}>
                    Cancel
                  </Button>
                  <Button type="submit" size="sm" disabled={submitting || uploadingPhoto} className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold shadow-md">
                    {submitting ? <Loader2 size={16} className="animate-spin mr-1.5" /> : null}
                    {editing ? 'Save Changes' : 'Publish Top Achiever'}
                  </Button>
                </div>
              </form>
            </div>
          </m.div>
        )}
      </AnimatePresence>

      {/* Grid of Achievers */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {loading ? (
          [...Array(4)].map((_, i) => (
            <div key={i} className="bg-white border border-slate-200 rounded-3xl p-5 h-96 animate-pulse" />
          ))
        ) : filtered.length === 0 ? (
          <div className="col-span-full text-center py-16 text-slate-400 bg-white border border-slate-200 rounded-3xl">
            <Trophy size={40} className="mx-auto mb-2 text-slate-300" />
            <p className="font-semibold text-slate-500">No Top Achievers cards found.</p>
          </div>
        ) : (
          filtered.map((a) => (
            <div key={a.id} className="bg-white border border-slate-200 rounded-[2.5rem] p-4 text-slate-800 shadow-md hover:shadow-xl transition-all flex flex-col justify-between relative overflow-hidden group">
              <div className="relative aspect-[4/5] rounded-3xl overflow-hidden mb-3 bg-slate-100 border border-slate-200">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={a.photo_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80'}
                  alt={a.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/30 via-transparent to-transparent" />
                
                <div className="absolute top-3 left-3 bg-amber-400 text-slate-950 px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider flex items-center gap-1 shadow-md">
                  <Star size={12} fill="currentColor" /> {a.position || '1ST POSITION'}
                </div>

                {a.percentage && (
                  <div className="absolute bottom-3 right-3 bg-white text-slate-800 border border-slate-200 px-3 py-1 rounded-full text-xs font-mono font-bold shadow-md flex items-center gap-1">
                    <Star size={12} className="text-amber-500 fill-amber-500" /> {a.percentage} Marks
                  </div>
                )}
              </div>

              <div className="text-center py-1">
                <h3 className="font-bold text-slate-800 text-xl leading-tight mb-0.5">{a.name}</h3>
                <p className="text-xs text-blue-600 font-extrabold uppercase tracking-wider mb-2">{a.board || 'BSEK SCIENCE GROUP 2026'}</p>
              </div>

              <div className="flex justify-center gap-2 pt-3 border-t border-slate-100">
                <button 
                  onClick={() => handleEdit(a)} 
                  title="Edit Achiever" 
                  className="px-3.5 py-1.5 bg-amber-50 hover:bg-amber-600 text-amber-700 hover:text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors border border-amber-200 cursor-pointer"
                >
                  <Pencil size={14} /> Edit
                </button>
                <button 
                  onClick={() => handleDelete(a.id)} 
                  title="Delete Achiever" 
                  className="px-3.5 py-1.5 bg-red-50 hover:bg-red-600 text-red-600 hover:text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors border border-red-200 cursor-pointer"
                >
                  <Trash2 size={14} /> Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
