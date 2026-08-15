'use client';

import { useEffect, useState } from 'react';
import { m } from 'framer-motion';
import { UserCircle } from 'lucide-react';
import Image from 'next/image';
import { supabase } from '@/lib/supabase/client';
import { getStoredData, setStoredData } from '@/lib/utils/storage';
import { Teacher } from '@/lib/types';

const fallbackFaculty: Teacher[] = [
  { id: '110e8400-e29b-41d4-a716-446655440011', name: 'Prof. Ahmed Khan', subject: 'Physics', experience_years: 15, photo_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=300', is_active: true },
  { id: '220e8400-e29b-41d4-a716-446655440022', name: 'Dr. Sarah Farooq', subject: 'Chemistry', experience_years: 10, photo_url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=300', is_active: true },
  { id: '330e8400-e29b-41d4-a716-446655440033', name: 'Sir Tariq Mehmood', subject: 'Mathematics', experience_years: 12, photo_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=300', is_active: true },
  { id: '440e8400-e29b-41d4-a716-446655440044', name: 'Miss Ayesha Ali', subject: 'Biology', experience_years: 8, photo_url: 'https://images.unsplash.com/photo-1580894732444-8ecded7900cd?auto=format&fit=crop&q=80&w=300', is_active: true },
];

function getInitials(name: string) {
  return (name || 'Faculty')
    .split(' ')
    .filter(Boolean)
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

export default function FacultySection() {
  const [faculty, setFaculty] = useState<Teacher[]>(fallbackFaculty);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data, error } = await supabase
          .from('teachers')
          .select('*')
          .eq('is_active', true)
          .order('display_order', { ascending: true })
          .limit(4);
        if (cancelled) return;
        if (!error && data && data.length > 0) {
          setFaculty(data as Teacher[]);
        }
      } catch (err) {
        console.error('Failed to load faculty from Supabase:', err);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  return (
    <section id="faculty" className="py-24 relative overflow-hidden bg-[var(--background)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        <div className="text-center mb-20">
          <m.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-full bg-white border-2 border-[var(--border)] shadow-xs mb-6 text-[var(--color-secondary)] font-bold text-sm tracking-widest uppercase"
          >
            <UserCircle size={16} /> Mentors of Excellence
          </m.div>
          <m.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-5xl font-display font-black tracking-tight"
          >
            Learn from <span className="clay-badge px-4 py-1 text-[var(--color-primary)]">Expert Faculty</span>
          </m.h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {faculty.map((teacher, idx) => (
            <m.div
              key={teacher.id || idx}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 }}
              className="clay-card p-6 rounded-3xl bg-white text-center flex flex-col items-center group hover:-translate-y-2 transition-all duration-300 border border-slate-200"
            >
              {teacher.photo_url ? (
                <div className="relative w-24 h-24 rounded-full overflow-hidden mb-6 shadow-lg border-4 border-white group-hover:scale-105 transition-transform shrink-0">
                  <Image
                    src={teacher.photo_url}
                    alt={teacher.name}
                    fill
                    sizes="(max-width: 768px) 96px, 96px"
                    className="object-cover"
                  />
                </div>
              ) : (
                <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-bold text-2xl flex items-center justify-center mb-6 shadow-lg border-4 border-white group-hover:scale-105 transition-transform shrink-0">
                  {getInitials(teacher.name)}
                </div>
              )}

              <h3 className="text-xl font-bold text-slate-800 mb-1">{teacher.name}</h3>
              <p className="text-sm font-bold text-blue-600 mb-2">{teacher.subject}</p>
              <p className="text-xs text-slate-500 font-semibold bg-slate-100 px-3 py-1 rounded-full border border-slate-200">
                {teacher.experience_years || 5}+ Years Teaching Experience
              </p>
            </m.div>
          ))}
        </div>
      </div>
    </section>
  );
}
