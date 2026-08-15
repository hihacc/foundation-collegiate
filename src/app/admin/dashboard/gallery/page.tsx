'use client';
export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { ImageIcon, Trash2, Plus, Eye, EyeOff, Clock, Filter, Loader2, Link as LinkIcon } from 'lucide-react';
import Button from '@/components/ui/Button';
import { m, AnimatePresence } from 'framer-motion';
import { getStoredData, setStoredData } from '@/lib/utils/storage';

const isUUID = (str: any) => typeof str === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);

export default function AdminGalleryPage() {
  const [images, setImages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [filterSource, setFilterSource] = useState<'all' | 'admin' | 'instagram' | 'facebook'>('all');

  const [form, setForm] = useState({ 
    title: '', 
    image_url: '', 
    category: 'Campus', 
    description: '',
    source: 'admin',
    postUrl: '' 
  });

  const fetchGallery = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('gallery')
        .select('*')
        .order('post_date', { ascending: false })
        .order('created_at', { ascending: false });
        
      if (!error && data) {
        setImages(data);
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to fetch gallery from database.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchGallery(); }, []);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size must be under 5MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setForm(p => ({ ...p, image_url: event.target!.result as string }));
        toast.success('Image loaded for preview!');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) { toast.error('Please enter a title'); return; }
    if (!form.image_url.trim()) { toast.error('Please provide an image'); return; }
    
    setSubmitting(true);
    const newId = crypto.randomUUID();
    const payload = {
      id: newId,
      title: form.title.trim(),
      image_url: form.image_url.trim(),
      category: form.category || 'Campus',
      description: form.description.trim() || null,
      source: form.source,
      source_post_id: form.postUrl.trim() || `manual_${newId}`,
      is_active: true,
      post_date: new Date().toISOString(),
      created_at: new Date().toISOString(),
    };

    const { error } = await supabase.from('gallery').insert([payload]);
    
    if (error) {
      toast.error('Database Error', { description: error.message });
      setSubmitting(false);
      return;
    }

    setImages([payload, ...images]);
    toast.success('Picture added to Gallery!');
    setShowForm(false);
    setForm({ title: '', image_url: '', category: 'Campus', description: '', source: 'admin', postUrl: '' });
    setSubmitting(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Permanently delete this picture?')) return;
    try {
      if (isUUID(id)) {
        await supabase.from('gallery').delete().eq('id', id);
      } else {
        const target = images.find(g => g.id === id);
        if (target?.title) {
          await supabase.from('gallery').delete().eq('title', target.title);
        }
      }
    } catch {}
    const updated = images.filter(img => img.id !== id);
    setImages(updated);
    setStoredData('gallery', updated);
    toast.success('Picture deleted successfully!');
  };

  const toggleVisibility = async (id: string, currentState: boolean) => {
    try {
      const { error } = await supabase.from('gallery').update({ is_active: !currentState }).eq('id', id);
      if (error) throw error;
      setImages(images.map(img => img.id === id ? { ...img, is_active: !currentState } : img));
      toast.success(currentState ? 'Image hidden from public view' : 'Image published to gallery');
    } catch (err: any) {
      toast.error('Failed to update visibility', { description: err.message });
    }
  };

  const filteredImages = images.filter(img => filterSource === 'all' || img.source === filterSource);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-display font-bold text-slate-800">Gallery Management</h1>
          <p className="text-slate-500 text-sm mt-1">Upload photos or link social media posts directly to the gallery.</p>
        </div>
        <Button size="sm" onClick={() => setShowForm(!showForm)} className="mt-4 md:mt-0 bg-blue-600 hover:bg-blue-700">
          <Plus size={16} className="mr-1.5" /> Add New Photo
        </Button>
      </div>

      {/* Upload Form */}
      <AnimatePresence>
        {showForm && (
          <m.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-white border border-blue-200 rounded-2xl p-5 sm:p-6 shadow-md mb-6 ring-1 ring-blue-100">
              <h2 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                <ImageIcon size={20} className="text-blue-600" /> Add to Gallery
              </h2>

              <form onSubmit={handleAdd} className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="text-sm font-bold text-slate-700 block mb-1.5">Photo Title <span className="text-red-500">*</span></label>
                    <input
                      required
                      type="text"
                      placeholder="e.g. Science Exhibition 2026"
                      value={form.title}
                      onChange={e => setForm(prev => ({ ...prev, title: e.target.value }))}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 text-slate-800 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-bold text-slate-700 block mb-1.5">Category</label>
                    <select
                      value={form.category}
                      onChange={e => setForm(prev => ({ ...prev, category: e.target.value }))}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 text-slate-800 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm cursor-pointer"
                    >
                      <option value="Classroom">Classroom & Labs</option>
                      <option value="Events">Campus Events & Sports</option>
                      <option value="Achievements">Awards & High Achievers</option>
                      <option value="Campus">Campus Life</option>
                      <option value="Social Media">Social Media</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-sm font-bold text-slate-700 block mb-1.5">Source Type</label>
                    <select
                      value={form.source}
                      onChange={e => setForm(prev => ({ ...prev, source: e.target.value }))}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 text-slate-800 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm cursor-pointer"
                    >
                      <option value="admin">Manual Upload (Website)</option>
                      <option value="instagram">Instagram Post</option>
                      <option value="facebook">Facebook Post</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-sm font-bold text-slate-700 block mb-1.5">Link to Original Post (Optional)</label>
                    <div className="relative">
                      <LinkIcon size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="url"
                        placeholder="https://instagram.com/p/..."
                        value={form.postUrl}
                        onChange={e => setForm(prev => ({ ...prev, postUrl: e.target.value }))}
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 text-slate-800 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm"
                      />
                    </div>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="text-sm font-bold text-slate-700 block mb-1.5">Description / Caption (Optional)</label>
                    <textarea
                      rows={2}
                      placeholder="Add details about this photo..."
                      value={form.description}
                      onChange={e => setForm(prev => ({ ...prev, description: e.target.value }))}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 text-slate-800 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm resize-none"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="text-sm font-bold text-slate-700 block mb-1.5">Upload Image <span className="text-red-500">*</span></label>
                    <div className="flex items-center justify-center w-full">
                      <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-slate-300 border-dashed rounded-xl cursor-pointer bg-slate-50 hover:bg-slate-100 transition-colors">
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                          <ImageIcon className="w-8 h-8 mb-3 text-slate-400" />
                          <p className="mb-2 text-sm text-slate-500"><span className="font-bold">Click to upload</span> JPG, PNG, or WEBP (Max 5MB)</p>
                        </div>
                        <input type="file" className="hidden" accept="image/jpeg, image/png, image/webp" onChange={handleFileUpload} />
                      </label>
                    </div>
                  </div>
                </div>

                {form.image_url && (
                  <div className="mt-4 relative w-32 h-32 rounded-xl overflow-hidden border border-slate-200">
                    <img src={form.image_url} alt="Preview" className="w-full h-full object-cover" />
                    <button type="button" onClick={() => setForm(p => ({ ...p, image_url: '' }))} className="absolute top-1 right-1 bg-white rounded-full p-1 shadow-sm text-red-500 hover:bg-red-50">
                      <Trash2 size={14} />
                    </button>
                  </div>
                )}

                <div className="flex justify-end pt-4 border-t border-slate-100">
                  <Button type="button" variant="outline" className="mr-3" onClick={() => setShowForm(false)}>Cancel</Button>
                  <Button type="submit" isLoading={submitting} className="bg-blue-600 hover:bg-blue-700">Add to Gallery</Button>
                </div>
              </form>
            </div>
          </m.div>
        )}
      </AnimatePresence>

      {/* Gallery Database View */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
        <div className="flex flex-col sm:flex-row items-center justify-between mb-6 pb-4 border-b border-slate-100 gap-4">
          <h2 className="text-lg font-bold text-slate-800">Database Images ({filteredImages.length})</h2>
          
          <div className="flex items-center gap-2">
            <Filter size={16} className="text-slate-400" />
            <select 
              value={filterSource} 
              onChange={e => setFilterSource(e.target.value as any)}
              className="text-sm border border-slate-200 rounded-lg px-3 py-1.5 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Sources</option>
              <option value="admin">Manual Uploads</option>
              <option value="instagram">Instagram</option>
              <option value="facebook">Facebook</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin mb-4 text-blue-500" />
            <p>Loading database...</p>
          </div>
        ) : filteredImages.length === 0 ? (
          <div className="py-20 text-center text-slate-400 flex flex-col items-center">
            <ImageIcon className="w-12 h-12 mb-4 opacity-50" />
            <p className="text-lg font-medium text-slate-600">No images found in the database.</p>
            <p className="text-sm mt-1">Upload a photo to see it in the gallery.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredImages.map((img) => (
              <div key={img.id} className={`group relative bg-white border ${img.is_active ? 'border-slate-200' : 'border-red-200 opacity-70'} rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all`}>
                <div className="relative aspect-video bg-slate-100">
                  <img src={img.image_url} alt={img.title} className="w-full h-full object-cover" />
                  
                  {/* Source Indicator */}
                  <div className="absolute top-2 left-2 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-md shadow-sm flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-slate-700">
                    {img.source === 'instagram' && <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-pink-600"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/></svg>}
                    {img.source === 'facebook' && <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-600"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>}
                    {img.source === 'admin' && <ImageIcon size={12} className="text-blue-600" />}
                    {img.source}
                  </div>
                  
                  {/* Visibility Indicator */}
                  {!img.is_active && (
                    <div className="absolute top-2 right-2 bg-red-100 text-red-600 px-2 py-0.5 rounded text-[10px] font-bold">
                      HIDDEN
                    </div>
                  )}
                </div>
                
                <div className="p-3">
                  <h4 className="font-bold text-sm text-slate-800 truncate" title={img.title}>{img.title}</h4>
                  <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                    <Clock size={10} /> 
                    {new Date(img.post_date || img.created_at).toLocaleDateString()}
                  </p>
                  
                  <div className="flex items-center gap-2 mt-4 pt-3 border-t border-slate-100">
                    <button
                      onClick={() => toggleVisibility(img.id, img.is_active)}
                      className={`flex-1 flex justify-center items-center gap-1.5 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                        img.is_active 
                          ? 'bg-slate-50 text-slate-600 hover:bg-slate-100' 
                          : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
                      }`}
                    >
                      {img.is_active ? <><EyeOff size={14} /> Hide</> : <><Eye size={14} /> Publish</>}
                    </button>
                    <button
                      onClick={() => handleDelete(img.id)}
                      className="p-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
                      title="Delete permanently"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
