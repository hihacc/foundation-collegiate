'use client';

import { motion } from 'framer-motion';
import { Quote, Star } from 'lucide-react';
import SectionHeader from '@/components/ui/SectionHeader';

const testimonials = [
  { 
    id: 1, 
    name: 'Ahmed Khan', 
    class: 'Matric Science', 
    quote: 'The teachers here are exceptional. Their conceptual approach helped me secure an A-1 grade in my board exams.', 
    rating: 5 
  },
  { 
    id: 2, 
    name: 'Sara Ali', 
    class: 'Pre-Medical', 
    quote: 'Regular testing and past paper sessions made the final exams feel incredibly easy. Highly recommended!', 
    rating: 5 
  },
  { 
    id: 3, 
    name: 'Usman Tariq', 
    class: 'Pre-Engineering', 
    quote: 'The environment is highly competitive yet supportive. I couldn\'t have asked for a better coaching center.', 
    rating: 5 
  },
];

export default function TestimonialsSection() {
  return (
    <section className="py-24 bg-background relative">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeader 
          badge="Testimonials"
          title="What Our Students" 
          titleHighlight="Say" 
          description="Read the success stories from our brilliant students who achieved their academic goals with us."
          className="mb-16"
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((t, idx) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.15, duration: 0.5 }}
              className="glass-card p-8 rounded-3xl relative group hover:-translate-y-2 transition-all hover:shadow-2xl"
            >
              <Quote className="absolute top-6 right-6 text-primary/10 rotate-180" size={48} />
              
              <div className="flex gap-1 mb-6">
                {[...Array(t.rating)].map((_, i) => (
                  <Star key={i} size={16} className="fill-amber-400 text-amber-400" />
                ))}
              </div>

              <p className="text-foreground/80 leading-relaxed mb-8 relative z-10 italic">
                &quot;{t.quote}&quot;
              </p>

              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-amber-400 to-amber-600 flex items-center justify-center text-white font-bold text-lg shadow-md">
                  {t.name.charAt(0)}
                </div>
                <div>
                  <div className="font-bold text-foreground">{t.name}</div>
                  <div className="text-xs text-primary font-medium">{t.class}</div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
