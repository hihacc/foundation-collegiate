'use client';

import { useEffect, useState } from 'react';
import { m } from 'framer-motion';
import { Award, Star, Trophy } from 'lucide-react';
import { Achiever } from '@/types';
import { supabase } from '@/lib/supabase/client';
import { formatGoogleDriveImageUrl } from '@/lib/utils/googleDrive';

const initialAchieversSeed: Achiever[] = [
  { 
    id: '110e8400-e29b-41d4-a716-446655440091', 
    name: 'Ibrahim Asif', 
    position: '1ST POSITION', 
    board: 'BSEK SCIENCE GROUP 2026', 
    percentage: '95.0%', 
    photo_url: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=800&q=80', 
    is_active: true,
    display_order: 1
  },
  { 
    id: '110e8400-e29b-41d4-a716-446655440092', 
    name: 'Ayesha Fatima', 
    position: '1ST POSITION', 
    board: 'BIEK PRE-MEDICAL 2026', 
    percentage: '94.6%', 
    photo_url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=800&q=80', 
    is_active: true,
    display_order: 2
  },
  { 
    id: '110e8400-e29b-41d4-a716-446655440093', 
    name: 'Muhammad Hamza', 
    position: '2ND POSITION', 
    board: 'BIEK PRE-ENGINEERING 2026', 
    percentage: '93.8%', 
    photo_url: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=800&q=80', 
    is_active: true,
    display_order: 3
  },
  { 
    id: '110e8400-e29b-41d4-a716-446655440094', 
    name: 'Zainab Tariq', 
    position: '1ST POSITION', 
    board: 'BIEK COMPUTER SCIENCE 2026', 
    percentage: '92.4%', 
    photo_url: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=800&q=80', 
    is_active: true,
    display_order: 4
  },
];

export default function AchievementsSection() {
  const [achievers, setAchievers] = useState<Achiever[]>(initialAchieversSeed);
  const [loading, setLoading] = useState(true);

  const getDeletedIds = (): string[] => {
    try { return JSON.parse(localStorage.getItem('tfc_deleted_achievers') || '[]'); } catch { return []; }
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const deletedIds = getDeletedIds();
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('achievers')
          .select('*')
          .order('display_order', { ascending: true })
          .order('created_at', { ascending: false });

        if (cancelled) return;

        if (!error && data && data.length > 0) {
          const filtered = data.filter((a: any) => a.is_active !== false && !deletedIds.includes(a.id) && !deletedIds.includes(a.name));
          if (filtered.length > 0) {
            setAchievers(filtered as Achiever[]);
            try { localStorage.setItem('tfc_achievers_cache', JSON.stringify(filtered)); } catch {}
          } else {
            const validSeed = initialAchieversSeed.filter(a => !deletedIds.includes(a.id) && !deletedIds.includes(a.name));
            setAchievers(validSeed);
          }
        } else {
          const local = JSON.parse(localStorage.getItem('tfc_achievers_cache') || '[]');
          const filteredLocal = (local.length > 0 ? local : initialAchieversSeed).filter((a: any) => !deletedIds.includes(a.id) && !deletedIds.includes(a.name));
          setAchievers(filteredLocal.length > 0 ? filteredLocal : initialAchieversSeed);
        }
      } catch (err) {
        console.warn('Achievers fetch error:', err);
        const local = JSON.parse(localStorage.getItem('tfc_achievers_cache') || '[]');
        const filteredLocal = (local.length > 0 ? local : initialAchieversSeed).filter((a: any) => !deletedIds.includes(a.id) && !deletedIds.includes(a.name));
        setAchievers(filteredLocal.length > 0 ? filteredLocal : initialAchieversSeed);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  return (
    <section className="py-20 bg-gradient-to-b from-blue-50/30 via-white to-slate-50 text-slate-900 relative overflow-hidden">
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-blue-100/40 rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-[350px] h-[350px] bg-amber-100/40 rounded-full blur-[120px] pointer-events-none" />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10 max-w-7xl">
        <div className="text-center mb-14 max-w-3xl mx-auto">
          <m.div
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-100 border border-amber-200 text-amber-800 font-bold text-xs tracking-widest uppercase mb-4 shadow-2xs"
          >
            <Trophy size={14} className="text-amber-600" /> Hall of Fame
          </m.div>
          
          <m.h2 
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-5xl font-display font-bold text-slate-900 tracking-tight"
          >
            Top Achievers <span className="text-slate-400 font-normal">/ Hall of Fame</span>
          </m.h2>

          <p className="text-slate-600 text-sm md:text-base max-w-2xl mx-auto mt-3 leading-relaxed font-medium">
            We consistently produce board toppers. Meet the brilliant minds who have set new records and made The Foundation Collegiate proud.
          </p>
        </div>

        {/* Achievers Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
          {loading ? (
            [...Array(2)].map((_, i) => (
              <div key={i} className="bg-white border border-slate-200 rounded-3xl p-5 h-96 animate-pulse" />
            ))
          ) : (
            achievers.map((student, idx) => (
              <m.div
                key={student.id || idx}
                initial={{ opacity: 0, y: 25 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="group relative rounded-[2.5rem] bg-white border border-slate-200/80 shadow-lg hover:shadow-2xl hover:border-amber-300 transition-all duration-500 flex flex-col justify-between overflow-hidden"
              >
                <div className="absolute top-4 right-4 z-20">
                  <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-amber-400 text-slate-950 font-black text-xs shadow-md uppercase tracking-wider">
                    <Star size={13} fill="currentColor" /> {student.position || '1ST POSITION'}
                  </span>
                </div>

                <div className="relative aspect-[4/5] w-full overflow-hidden bg-slate-100">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img 
                    src={student.photo_url ? formatGoogleDriveImageUrl(student.photo_url) : 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80'} 
                    alt={student.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-white via-white/50 to-transparent" />
                </div>

                <div className="relative z-10 p-6 pt-0 flex flex-col items-center text-center bg-white">
                  <h3 className="text-2xl font-bold text-slate-800 tracking-tight group-hover:text-blue-600 transition-colors">
                    {student.name}
                  </h3>
                  
                  <p className="text-xs font-extrabold text-blue-600 mt-1 mb-4 uppercase tracking-wider">
                    {student.board || 'BSEK SCIENCE GROUP 2026'}
                  </p>

                  {student.percentage && (
                    <div className="inline-flex items-center justify-center gap-1.5 px-5 py-2 rounded-full bg-slate-50 border border-slate-200 text-slate-800 font-mono font-bold text-xs shadow-xs">
                      <Star size={14} className="text-amber-500 fill-amber-500" />
                      <span>{student.percentage} Marks</span>
                    </div>
                  )}
                </div>
              </m.div>
            ))
          )}
        </div>

        <div className="mt-14 flex flex-wrap items-center justify-center gap-5">
          <div className="flex items-center gap-3 px-6 py-3.5 rounded-full bg-white border border-slate-200 shadow-sm">
            <Trophy size={20} className="text-amber-500" />
            <span className="font-bold text-sm text-slate-800">100+ Board Positions Secured</span>
          </div>
          <div className="flex items-center gap-3 px-6 py-3.5 rounded-full bg-white border border-slate-200 shadow-sm">
            <Award size={20} className="text-blue-600" />
            <span className="font-bold text-sm text-slate-800">500+ A-1 Grade Holders</span>
          </div>
        </div>
      </div>
    </section>
  );
}
