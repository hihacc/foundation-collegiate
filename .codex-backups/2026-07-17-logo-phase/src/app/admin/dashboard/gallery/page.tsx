'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { ImageIcon, Trash2, Plus } from 'lucide-react';
import Button from '@/components/ui/Button';

export default function AdminGalleryPage() {
  const [images, setImages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', image_url: '', category: 'general', description: '' });
  const [uploading, setUploading] = useState(false);

  const fetch = async () => {
    setLoading(true);
    const { data } = await supabase.from('gallery').select('*').order('created_at', { ascending: false });
    setImages(data || []);
    setLoading(false);
  };

  useEffect(() => { fetch(); }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const filename = `gallery/${Date.now()}_${file.name}`;
    const { error, data } = await supabase.storage.from('media').upload(filename, file);
    if (error) { toast.error('Upload failed: ' + error.message); setUploading(false); return; }
    const { data: url } = supabase.storage.from('media').getPublicUrl(filename);
    setForm(p => ({ ...p, image_url: url.publicUrl }));
    setUploading(false);
    toast.success('Image uploaded!');
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.image_url) { toast.error('Please upload an image first'); return; }
    const { error } = await supabase.from('gallery').insert([form]);
    if (error) { toast.error('Failed to add image'); return; }
    toast.success('Image added to gallery!');
    setShowForm(false);
    setForm({ title: '', image_url: '', category: 'general', description: '' });
    fetch();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Remove this image?')) return;
    await supabase.from('gallery').delete().eq('id', id);
    toast.success('Image removed');
    fetch();
  };

  const categories = ['All', 'general', 'events', 'classroom', 'achievements', 'campus'];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-white">Gallery Management</h1>
          <p className="text-slate-400 text-sm mt-1">{images.length} images</p>
        </div>
        <Button size="sm" onClick={() => setShowForm(!showForm)}>
          <Plus size={16} /> Add Image
        </Button>
      </div>

      {showForm && (
        <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6">
          <h2 className="font-bold text-white mb-5">Add New Image</h2>
          <form onSubmit={handleAdd} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-slate-300 block mb-1.5">Title</label>
                <input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                  placeholder="Photo title"
                  className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 text-white rounded-xl focus:ring-2 focus:ring-primary focus:outline-none text-sm" />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-300 block mb-1.5">Category</label>
                <select value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))}
                  className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 text-white rounded-xl focus:ring-2 focus:ring-primary focus:outline-none text-sm">
                  {categories.filter(c => c !== 'All').map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-slate-300 block mb-1.5">Upload Image</label>
              <input type="file" accept="image/*" onChange={handleFileUpload}
                className="w-full text-slate-400 text-sm file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:bg-primary file:text-white file:font-semibold file:cursor-pointer hover:file:bg-blue-700 transition-all" />
              {uploading && <p className="text-sm text-primary mt-2 animate-pulse">Uploading...</p>}
              {form.image_url && !uploading && (
                <p className="text-xs text-green-400 mt-2">✓ Image uploaded successfully</p>
              )}
            </div>

            <div className="flex gap-3 pt-2">
              <Button type="submit" size="sm" isLoading={uploading}>Add to Gallery</Button>
              <Button type="button" variant="ghost" size="sm" className="text-slate-400 hover:text-white" onClick={() => setShowForm(false)}>Cancel</Button>
            </div>
          </form>
        </div>
      )}

      {/* Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {loading ? (
          [...Array(10)].map((_, i) => <div key={i} className="skeleton aspect-square rounded-xl" />)
        ) : images.length === 0 ? (
          <div className="col-span-full text-center py-16 text-slate-500">
            <ImageIcon size={48} className="mx-auto mb-3 opacity-20" />
            <p>No images yet. Add your first photo!</p>
          </div>
        ) : images.map(img => (
          <div key={img.id} className="group relative aspect-square rounded-xl overflow-hidden bg-slate-800 border border-slate-700">
            {img.image_url ? (
              <img src={img.image_url} alt={img.title || ''} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <ImageIcon size={28} className="text-slate-600" />
              </div>
            )}
            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
              {img.title && <p className="text-white text-xs font-medium px-2 text-center">{img.title}</p>}
              <button onClick={() => handleDelete(img.id)}
                className="w-9 h-9 bg-red-600 text-white rounded-lg flex items-center justify-center">
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
