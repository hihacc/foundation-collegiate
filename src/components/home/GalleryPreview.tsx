'use client';

import { useEffect, useState } from 'react';
import { m, AnimatePresence } from 'framer-motion';
import { ArrowRight, X, Maximize2, Image as ImageIcon } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { supabase } from '@/lib/supabase/client';
import { getStoredData } from '@/lib/utils/storage';

interface GalleryItem {
  id: string | number;
  type: 'image' | 'video';
  url: string;
  span: string;
  title: string;
}

const spans = [
  'col-span-1 md:col-span-2 row-span-2',
  'col-span-1 row-span-1',
  'col-span-1 row-span-1',
  'col-span-1 row-span-2',
  'col-span-1 md:col-span-2 row-span-1',
];

const fallbackGallery = [
  { id: '1', title: 'Interactive Science Laboratory', image_url: 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?auto=format&fit=crop&q=80&w=800' },
  { id: '2', title: 'Annual High Achievers Award Ceremony', image_url: 'https://images.unsplash.com/photo-1523580494863-6f3031224c94?auto=format&fit=crop&q=80&w=800' },
  { id: '3', title: 'Modern Digital Classrooms', image_url: 'https://images.unsplash.com/photo-1580582932707-520aed937b7b?auto=format&fit=crop&q=80&w=800' },
  { id: '4', title: 'Computer Science Tech Lab', image_url: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&q=80&w=800' },
  { id: '5', title: 'Library & Quiet Study Lounge', image_url: 'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?auto=format&fit=crop&q=80&w=800' },
];

export default function GalleryPreview() {
  const [galleryItems, setGalleryItems] = useState<GalleryItem[]>(() => {
    const raw = getStoredData('gallery', fallbackGallery);
    return raw.map((item: any, idx: number) => ({
      id: item.id || idx,
      type: 'image',
      url: item.image_url || 'https://images.unsplash.com/photo-1580582932707-520aed937b7b?auto=format&fit=crop&q=80&w=800',
      span: spans[idx % spans.length],
      title: item.title || 'Campus Highlights',
    }));
  });

  const [selectedItem, setSelectedItem] = useState<GalleryItem | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data, error } = await supabase
          .from('gallery')
          .select('*')
          .eq('is_active', true)
          .order('post_date', { ascending: false, nullsFirst: false })
          .order('created_at', { ascending: false })
          .limit(5);
          
        if (cancelled) return;
        if (error || !data || !data.length) return;
        const items = data.map((img: any, idx: number) => ({
          id: img.id,
          type: 'image',
          url: img.image_url,
          span: spans[idx % spans.length],
          title: img.title || 'Campus Life',
        }));
        setGalleryItems(items as GalleryItem[]);
      } catch {
        // keep stored gallery
      }
    })();
    return () => { cancelled = true; };
  }, []);

  return (
    <section className="py-24 relative overflow-hidden bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
          <div>
            <div className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-full bg-slate-100 border border-slate-200 mb-4 text-blue-600 font-bold text-xs tracking-widest uppercase">
              <ImageIcon size={14} /> Campus Life
            </div>
            <h2 className="text-3xl md:text-4xl font-display font-bold text-slate-800">
              Campus Life & <span className="text-blue-600">Achievements</span>
            </h2>
          </div>
          <Link href="/gallery" className="inline-flex items-center gap-2 font-bold text-blue-600 hover:text-blue-700 transition-colors">
            View Full Photo Gallery <ArrowRight size={18} />
          </Link>
        </div>

        {/* Gallery Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 auto-rows-[220px] gap-4">
          {galleryItems.slice(0, 5).map((item, idx) => (
            <m.div
              key={item.id}
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.08 }}
              className={`group relative rounded-2xl overflow-hidden cursor-pointer bg-slate-100 border border-slate-200 ${item.span}`}
              onClick={() => setSelectedItem(item)}
            >
              <Image
                src={item.url}
                alt={item.title}
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                className="object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent opacity-80 group-hover:opacity-90 transition-opacity" />
              <div className="absolute bottom-4 left-4 right-4 text-white">
                <p className="font-bold text-sm md:text-base leading-snug">{item.title}</p>
              </div>
              <div className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white/20 backdrop-blur-xs flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity">
                <Maximize2 size={16} />
              </div>
            </m.div>
          ))}
        </div>
      </div>

      {/* Lightbox Modal */}
      <AnimatePresence>
        {selectedItem && (
          <m.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4"
            onClick={() => setSelectedItem(null)}
          >
            <div className="relative max-w-4xl w-full bg-slate-900 rounded-3xl overflow-hidden border border-slate-800 shadow-2xl" onClick={e => e.stopPropagation()}>
              <button
                onClick={() => setSelectedItem(null)}
                className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-slate-800 text-white flex items-center justify-center hover:bg-slate-700 transition-colors"
              >
                <X size={20} />
              </button>
              <div className="relative aspect-video w-full bg-black">
                <Image src={selectedItem.url} alt={selectedItem.title} fill className="object-contain" sizes="100vw" />
              </div>
              <div className="p-6 bg-slate-900 text-white">
                <h3 className="text-xl font-bold">{selectedItem.title}</h3>
              </div>
            </div>
          </m.div>
        )}
      </AnimatePresence>
    </section>
  );
}
