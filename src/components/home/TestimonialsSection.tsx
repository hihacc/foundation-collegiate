'use client';

import { useEffect, useState } from 'react';
import { m } from 'framer-motion';
import { Quote, Star } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import type { Testimonial } from '@/types';

const fallbackTestimonials: Testimonial[] = [
  {
    id: '1',
    student_name: 'Muhammad Ahmed',
    class_name: 'Class 10 (Science)',
    quote: 'The Foundation Collegiate helped me secure A-1 Grade in BSEK Board Exams. The daily test series and conceptual teaching of Physics and Chemistry made all the difference.',
    rating: 5,
    is_active: true,
    created_at: new Date().toISOString(),
  },
  {
    id: '2',
    student_name: 'Sara Ali',
    class_name: 'XI Pre-Medical',
    quote: 'Faculty members are extremely dedicated and approachable. Their MDCAT foundation concepts and past paper practice gave me complete confidence.',
    rating: 5,
    is_active: true,
    created_at: new Date().toISOString(),
  },
  {
    id: '3',
    student_name: 'Usman Tariq',
    class_name: 'XII Pre-Engineering',
    quote: 'Best coaching institute in North Karachi! Mathematics and Physics lectures by Dr. Asif Iqbal and team are unparalleled.',
    rating: 5,
    is_active: true,
    created_at: new Date().toISOString(),
  },
];

export default function TestimonialsSection() {
  const [testimonials, setTestimonials] = useState<Testimonial[]>(fallbackTestimonials);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data, error } = await supabase
          .from('testimonials')
          .select('*')
          .eq('is_active', true)
          .order('created_at', { ascending: false });
        if (cancelled) return;
        if (error || !data || !data.length) return;
        setTestimonials(data as Testimonial[]);
      } catch {
        // keep fallback silently
      }
    })();
    return () => { cancelled = true; };
  }, []);

  return (
    <section className="py-24 relative overflow-hidden bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Section Header */}
        <div className="text-center mb-16">
          <m.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-full bg-white border border-slate-200 shadow-xs mb-4 text-blue-600 font-bold text-xs tracking-widest uppercase"
          >
            <Quote size={14} /> Student Voices
          </m.div>
          <m.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-3xl md:text-4xl font-display font-bold text-slate-800"
          >
            What Our <span className="text-blue-600">Students Say</span>
          </m.h2>
        </div>

        {/* Testimonials Grid */}
        <m.div 
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-3 gap-8"
        >
          {testimonials.map((t, idx) => {
            const displayName = t.student_name || t.name || 'Student';
            return (
              <m.div
                key={t.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center gap-1 mb-4 text-amber-400">
                    {[...Array(t.rating || 5)].map((_, i) => (
                      <Star key={i} size={16} fill="currentColor" />
                    ))}
                  </div>

                  <p className="text-slate-600 leading-relaxed text-sm md:text-base italic mb-6">
                    &quot;{t.quote || t.content}&quot;
                  </p>
                </div>

                <div className="flex items-center gap-4 pt-4 border-t border-slate-100">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold text-lg shadow-md group-hover:scale-105 transition-transform">
                    {displayName.charAt(0)}
                  </div>
                  <div>
                    <div className="font-bold text-slate-800">{displayName}</div>
                    <div className="text-xs text-blue-600 font-bold uppercase tracking-wide mt-0.5">{t.class_name || t.achievement || 'Student'}</div>
                  </div>
                </div>
              </m.div>
            );
          })}
        </m.div>
      </div>
    </section>
  );
}
