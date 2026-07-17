import type { Metadata } from 'next';
import SectionHeader from '@/components/ui/SectionHeader';
import { ImageIcon } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Gallery | Campus Life',
  description: 'Explore photos from The Foundation Collegiate — events, classes, achievements, and campus life.',
};

const categories = ['All', 'Events', 'Classroom', 'Achievements', 'Campus'];

export default function GalleryPage() {
  const placeholderImages = Array.from({ length: 12 }, (_, i) => ({
    id: i + 1,
    category: categories[(i % (categories.length - 1)) + 1],
    title: `Photo ${i + 1}`,
  }));

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
              className={`px-5 py-2 rounded-full text-sm font-semibold transition-all border ${
                cat === 'All'
                  ? 'bg-primary text-white border-primary shadow-md'
                  : 'bg-card border-border text-muted hover:border-primary hover:text-primary'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Grid */}
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
      </div>
    </div>
  );
}
