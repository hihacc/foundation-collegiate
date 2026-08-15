'use client';
export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { m, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import SectionHeader from '@/components/ui/SectionHeader';
import { X, Clock, Filter, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import type { GalleryImage } from '@/types';

// Categories combine manual ones and Social Media
const categories = ['All', 'Social Media', 'Classroom', 'Events', 'Achievements', 'Campus'];

export default function GalleryPage() {
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('All');
  const [selectedImage, setSelectedImage] = useState<GalleryImage | null>(null);

  // Pagination & Lazy Loading states
  const [page, setPage] = useState(1);
  const itemsPerPage = 12;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('gallery')
          .select('*')
          .eq('is_active', true)
          .order('post_date', { ascending: false, nullsFirst: false })
          .order('created_at', { ascending: false });
          
        if (!cancelled && !error && data) {
          setImages(data as GalleryImage[]);
        }
      } catch (err) {
        console.error("Failed to load gallery data");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const filteredImages =
    activeCategory === 'All'
      ? images
      : images.filter((img) => (img.category || '').toLowerCase() === activeCategory.toLowerCase());

  // Pagination logic
  const displayedImages = filteredImages.slice(0, page * itemsPerPage);
  const hasMore = displayedImages.length < filteredImages.length;

  return (
    <div className="py-20 bg-[#F8FAFC] min-h-screen">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
        <SectionHeader
          badge="Photo Gallery"
          title="Campus &"
          titleHighlight="Social Updates"
          description="A visual journey through the academic environment, events, and latest social media updates from The Foundation Collegiate."
          className="mb-12"
        />

        {/* Category Filters */}
        <div className="flex flex-wrap items-center justify-center gap-3 mb-12">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => { setActiveCategory(cat); setPage(1); }}
              className={`px-5 py-2.5 rounded-full text-sm font-bold transition-all duration-300 ${
                activeCategory === cat
                  ? 'bg-[#2563EB] text-white shadow-lg shadow-blue-600/30 -translate-y-0.5'
                  : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200 hover:border-blue-300 hover:text-[#2563EB]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Gallery Grid */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
            <Loader2 className="w-10 h-10 animate-spin mb-4 text-[#2563EB]" />
            <p className="font-medium">Loading Gallery...</p>
          </div>
        ) : filteredImages.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
            <p className="text-xl font-medium text-slate-600">No images found for this category.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {displayedImages.map((img, idx) => (
              <m.div
                key={img.id || idx}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                onClick={() => setSelectedImage(img)}
                className="group cursor-pointer rounded-2xl bg-white border border-slate-200 overflow-hidden shadow-sm hover:shadow-xl hover:border-blue-200 transition-all duration-300 flex flex-col hover:-translate-y-1"
              >
                <div className="relative aspect-square bg-slate-100 overflow-hidden">
                  <Image
                    src={img.image_url}
                    alt={img.title || 'Gallery Photo'}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                    className="object-cover group-hover:scale-110 transition-transform duration-700"
                    loading="lazy"
                  />
                  
                  {/* Category & Source Badges */}
                  <div className="absolute top-3 left-3 flex flex-col gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-white/95 text-[#2563EB] backdrop-blur-sm shadow-sm inline-block">
                      {img.category || 'Update'}
                    </span>
                  </div>

                  <div className="absolute top-3 right-3 flex gap-2">
                    {img.source === 'instagram' && (
                      <div className="bg-white/95 p-1.5 rounded-full shadow-sm text-pink-600 backdrop-blur-sm">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/></svg>
                      </div>
                    )}
                    {img.source === 'facebook' && (
                      <div className="bg-white/95 p-1.5 rounded-full shadow-sm text-blue-600 backdrop-blur-sm">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="p-4 flex-1 flex flex-col justify-between">
                  <div>
                    {img.title !== 'Instagram Post' && img.title !== 'Facebook Post' && (
                      <h3 className="font-bold text-[#0F172A] text-base group-hover:text-[#2563EB] transition-colors mb-2 line-clamp-1">{img.title}</h3>
                    )}
                    {img.description && <p className="text-sm text-slate-600 line-clamp-2 leading-relaxed">{img.description}</p>}
                  </div>
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center text-xs text-slate-400 font-medium">
                    <Clock size={12} className="mr-1.5" />
                    {new Date(img.post_date || img.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                  </div>
                </div>
              </m.div>
            ))}
          </div>
        )}

        {/* Load More Button */}
        {!loading && hasMore && (
          <div className="mt-12 flex justify-center">
            <button 
              onClick={() => setPage(p => p + 1)}
              className="px-8 py-3 bg-white text-[#2563EB] font-bold rounded-full border border-slate-200 hover:border-[#2563EB] hover:bg-[#EFF6FF] transition-all duration-300 shadow-sm hover:shadow-md"
            >
              Load More Images
            </button>
          </div>
        )}
      </div>

      {/* Modern Lightbox Overlay */}
      <AnimatePresence>
        {selectedImage && (
          <m.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-[#0F172A]/95 backdrop-blur-md flex items-center justify-center p-4 sm:p-6"
            onClick={() => setSelectedImage(null)}
          >
            <div 
              className="relative max-w-5xl w-full max-h-[90vh] bg-white rounded-3xl overflow-hidden shadow-2xl flex flex-col md:flex-row" 
              onClick={e => e.stopPropagation()}
            >
              <button
                onClick={() => setSelectedImage(null)}
                className="absolute top-4 right-4 z-20 w-10 h-10 rounded-full bg-white/10 hover:bg-slate-200 text-slate-800 flex items-center justify-center transition-colors shadow-sm md:bg-slate-100"
              >
                <X size={20} />
              </button>

              {/* Image Side */}
              <div className="relative w-full md:w-2/3 bg-black min-h-[40vh] md:min-h-[60vh] flex items-center justify-center">
                <Image 
                  src={selectedImage.image_url} 
                  alt={selectedImage.title || 'Image'} 
                  fill 
                  sizes="(max-width: 768px) 100vw, 66vw" 
                  className="object-contain" 
                  priority
                />
              </div>

              {/* Details Side */}
              <div className="w-full md:w-1/3 bg-white p-6 md:p-8 flex flex-col overflow-y-auto max-h-[50vh] md:max-h-[80vh]">
                <div className="flex items-center gap-3 mb-6">
                  {selectedImage.source === 'instagram' ? (
                    <div className="flex items-center gap-2 text-pink-600 bg-pink-50 px-3 py-1.5 rounded-full text-sm font-bold">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/></svg> Instagram
                    </div>
                  ) : selectedImage.source === 'facebook' ? (
                    <div className="flex items-center gap-2 text-blue-600 bg-blue-50 px-3 py-1.5 rounded-full text-sm font-bold">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg> Facebook
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-[#2563EB] bg-[#EFF6FF] px-3 py-1.5 rounded-full text-sm font-bold">
                      Foundation Admin
                    </div>
                  )}
                  <span className="text-sm text-slate-400 font-medium">
                    {new Date(selectedImage.post_date || selectedImage.created_at).toLocaleDateString()}
                  </span>
                </div>

                <h3 className="text-2xl font-bold text-[#0F172A] mb-4">
                  {selectedImage.title !== 'Instagram Post' && selectedImage.title !== 'Facebook Post' ? selectedImage.title : 'Social Update'}
                </h3>
                
                {selectedImage.description ? (
                  <p className="text-base text-slate-600 leading-relaxed whitespace-pre-wrap">{selectedImage.description}</p>
                ) : (
                  <p className="text-base text-slate-400 italic">No description provided.</p>
                )}
              </div>
            </div>
          </m.div>
        )}
      </AnimatePresence>
    </div>
  );
}
