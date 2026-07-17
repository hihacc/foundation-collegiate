'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, ArrowRight, X, Maximize2, Image as ImageIcon } from 'lucide-react';
import SectionHeader from '@/components/ui/SectionHeader';
import Button from '@/components/ui/Button';

const galleryItems = [
  { id: 1, type: 'image', url: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?q=80&w=800', span: 'col-span-1 md:col-span-2 row-span-2', title: 'Annual Convocation 2024' },
  { id: 2, type: 'image', url: 'https://images.unsplash.com/photo-1562774053-701939374585?q=80&w=800', span: 'col-span-1 row-span-1', title: 'Science Exhibition' },
  { id: 3, type: 'video', url: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?q=80&w=800', span: 'col-span-1 row-span-1', title: 'Campus Tour' },
  { id: 4, type: 'image', url: 'https://images.unsplash.com/photo-1427504494785-319ce8372ac0?q=80&w=800', span: 'col-span-1 row-span-2', title: 'Library Study Session' },
  { id: 5, type: 'image', url: 'https://images.unsplash.com/photo-1577896851231-70ef18881754?q=80&w=800', span: 'col-span-1 md:col-span-2 row-span-1', title: 'Sports Day 2024' },
];

export default function GalleryPreview() {
  const [selectedItem, setSelectedItem] = useState<any>(null);

  return (
    <section className="py-24 bg-[#080c18] relative">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-16">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="md:max-w-2xl"
          >
            <SectionHeader 
              align="left"
              badge="Campus Life"
              title="Experience" 
              titleHighlight="TFC" 
              description="A glimpse into our vibrant campus life, academic excellence, and extracurricular activities."
              className="mb-0"
            />
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <a href="/gallery">
              <Button variant="outline" className="border-white/20 text-white hover:bg-white/10 rounded-full px-6 group">
                View Full Gallery <ArrowRight size={18} className="ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </a>
          </motion.div>
        </div>

        {/* Masonry Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 auto-rows-[200px] gap-4">
          {galleryItems.map((item, idx) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ duration: 0.5, delay: idx * 0.1 }}
              className={`relative rounded-3xl overflow-hidden group cursor-pointer ${item.span}`}
              onClick={() => setSelectedItem(item)}
            >
              <img 
                src={item.url} 
                alt={item.title} 
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#001B4D]/90 via-[#001B4D]/20 to-transparent opacity-60 group-hover:opacity-80 transition-opacity duration-300" />
              
              <div className="absolute inset-0 p-6 flex flex-col justify-end opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-4 group-hover:translate-y-0">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white">
                    {item.type === 'video' ? <Play size={18} className="ml-1" /> : <Maximize2 size={18} />}
                  </div>
                  <span className="text-white text-sm font-bold bg-[#D72638] px-3 py-1 rounded-full uppercase tracking-wider">
                    {item.type}
                  </span>
                </div>
                <h3 className="text-2xl font-bold text-white leading-tight">{item.title}</h3>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Lightbox */}
      <AnimatePresence>
        {selectedItem && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedItem(null)}
            className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-4 backdrop-blur-sm"
          >
            <button 
              className="absolute top-6 right-6 w-12 h-12 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-colors"
              onClick={() => setSelectedItem(null)}
            >
              <X size={24} />
            </button>
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="relative max-w-5xl w-full max-h-[85vh] rounded-2xl overflow-hidden"
              onClick={e => e.stopPropagation()}
            >
              <img src={selectedItem.url} alt={selectedItem.title} className="w-full h-full object-contain" />
              <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent">
                <h3 className="text-white text-2xl font-bold">{selectedItem.title}</h3>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
