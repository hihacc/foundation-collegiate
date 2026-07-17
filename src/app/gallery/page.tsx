'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import SectionHeader from '@/components/ui/SectionHeader';
import { ImageIcon, X } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import type { GalleryImage } from '@/types';

const categories = ['All', 'General', 'Events', 'Classroom', 'Achievements', 'Campus'];

export default function GalleryPage() {
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [activeCategory, setActiveCategory] = useState('All');
  const [selectedImage, setSelectedImage] = useState<GalleryImage | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data, error } = await supabase
          .from('gallery')
          .select('*')
          .eq('is_active', true)
          .order('display_order', { ascending: true })
          .order('created_at', { ascending: false });
        if (cancelled) return;
        if (error || !data || !data.length) return;
        setImages(data as GalleryImage[]);
      } catch {
        // keep placeholder silently
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const placeholderImages = Array.from({ length: 12 }, (_, i) => ({
    id: i + 1,
    category: categories[(i % (categories.length - 2)) + 2],
    title: `Photo ${i + 1}`,
  }));

  const filteredImages =
    activeCategory === 'All'
      ? images
      : images.filter((img) => img.category?.toLowerCase() === activeCategory.toLowerCase());

  const hasLiveImages = images.length > 0;

  return (
    <div className="py-20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeader
          badge="Gallery"
          title="Campus"
          titleHighlight="Life"
          description="A visual journey through the vibrant academic environment, events, and achievements at our campus."
          className="mb-12"
        />

        {/* Filter Pills */}
        <div className="flex flex-wrap justify-center gap-3 mb-12">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-5 py-2 rounded-full text-sm font-semibold transition-all border cursor-pointer ${
                cat === activeCategory
                  ? 'bg-primary text-white border-primary shadow-md'
                  : 'bg-card border-border text-muted hover:border-primary hover:text-primary'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Grid */}
        {hasLiveImages ? (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredImages.map((img, idx) => (
                <motion.div
                  key={img.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.4, delay: (idx % 8) * 0.05 }}
                  onClick={() => setSelectedImage(img)}
                  className="group relative aspect-square rounded-2xl overflow-hidden bg-muted-bg border border-border hover:shadow-xl hover:border-primary/30 transition-all cursor-pointer"
                >
                  <img
                    src={img.image_url}
                    alt={img.title || 'Gallery image'}
                    loading="lazy"
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-primary/80 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center p-4">
                    <span className="text-white font-semibold text-center">{img.title || img.category}</span>
                  </div>
                </motion.div>
              ))}
            </div>
            {filteredImages.length === 0 && (
              <div className="mt-12 text-center">
                <p className="text-muted text-sm italic">No images found in this category yet.</p>
              </div>
            )}
          </>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {placeholderImages.map((img) => (
                <div
                  key={img.id}
                  className="group relative aspect-square rounded-2xl overflow-hidden bg-muted-bg border border-border hover:shadow-xl hover:border-primary/30 transition-all cursor-pointer"
                >
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
                    <ImageIcon size={36} className="text-muted opacity-30" />
                    <span className="text-xs text-muted opacity-50">{img.category}</span>
                  </div>
                  <div className="absolute inset-0 bg-primary/80 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <span className="text-white font-semibold">{img.title}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-12 text-center">
              <p className="text-muted text-sm italic">
                Gallery images will be displayed here once uploaded through the Admin Panel.
              </p>
            </div>
          </>
        )}
      </div>

      {/* Lightbox */}
      <AnimatePresence>
        {selectedImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedImage(null)}
            className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-4 backdrop-blur-sm"
          >
            <button
              className="absolute top-6 right-6 w-12 h-12 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-colors cursor-pointer"
              onClick={() => setSelectedImage(null)}
            >
              <X size={24} />
            </button>
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="relative max-w-5xl w-full max-h-[85vh] rounded-2xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <img src={selectedImage.image_url} alt={selectedImage.title || 'Gallery image'} className="w-full h-full object-contain" />
              {(selectedImage.title || selectedImage.description) && (
                <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent">
                  {selectedImage.title && <h3 className="text-white text-2xl font-bold">{selectedImage.title}</h3>}
                  {selectedImage.description && <p className="text-white/70 text-sm mt-1">{selectedImage.description}</p>}
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
