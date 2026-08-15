'use client';

import { useEffect, useState } from 'react';
import { Users, Trophy, Award, Calendar, BookOpen } from 'lucide-react';
import StatCard from '@/components/ui/StatCard';
import SectionHeader from '@/components/ui/SectionHeader';
import { m } from 'framer-motion';
import { supabase } from '@/lib/supabase/client';
import { useSettings } from '@/lib/hooks/useSettings';
import Link from 'next/link';

export default function StatsSection() {
  const settings = useSettings();
  const [dynamicStats, setDynamicStats] = useState({
    studentsCount: 469,
    yearsExp: 15,
    topPositions: 100,
    successRate: 98,
  });

  useEffect(() => {
    let cancelled = false;
    async function fetchCounts() {
      try {
        const [
          { count: resultCount },
          { count: teacherCount },
        ] = await Promise.all([
          supabase.from('results').select('*', { count: 'exact', head: true }).eq('is_active', true),
          supabase.from('teachers').select('*', { count: 'exact', head: true }).eq('is_active', true),
        ]);

        if (cancelled) return;

        setDynamicStats(prev => ({
          studentsCount: 469,
          yearsExp: 15,
          topPositions: resultCount && resultCount > 0 ? Math.max(100, resultCount) : prev.topPositions,
          successRate: 98,
        }));
      } catch {
        // keep fallback stats
      }
    }
    fetchCounts();
    return () => { cancelled = true; };
  }, []);

  const stats = [
    { value: 469, label: 'Active Students', icon: Users, suffix: '+', color: 'blue' as const },
    { value: dynamicStats.yearsExp, label: 'Years Experience', icon: Calendar, suffix: '+', color: 'red' as const },
    { value: dynamicStats.topPositions, label: 'Top Positions', icon: Award, suffix: '+', color: 'gold' as const },
    { value: dynamicStats.successRate, label: 'Success Rate', icon: Trophy, suffix: '%', color: 'green' as const },
  ];

  const admissionsOpen = settings.admissions_open !== 'false';
  const admissionsYear = settings.admissions_year || '2026';

  return (
    <section className="py-24 bg-white relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-[#0057FF]/30 to-transparent" />
      <div className="absolute inset-0 bg-grid-pattern opacity-[0.03] pointer-events-none" />
      
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <m.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
        >
          <SectionHeader 
            badge="Our Impact"
            title="A Legacy of" 
            titleHighlight="Excellence" 
            description="For over 15 years, The Foundation Collegiate has been producing top-tier results in Matriculation and Intermediate Board Exams, proving our commitment to quality education."
            className="mb-16"
          />
        </m.div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {stats.map((stat, idx) => (
            <m.div
              key={idx}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: idx * 0.1 }}
            >
              <StatCard {...stat} />
            </m.div>
          ))}
        </div>

        {/* Admissions Open Banner */}
        <m.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mt-16 w-full max-w-4xl mx-auto rounded-3xl bg-blue-50 border border-blue-200 p-8 sm:p-12 text-center relative overflow-hidden shadow-xl"
        >
          <div className="absolute inset-0 bg-grid-pattern opacity-10" />
          <div className="absolute -top-24 -left-24 w-64 h-64 bg-blue-400 rounded-full blur-[100px] opacity-20" />
          <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-amber-400 rounded-full blur-[100px] opacity-10" />
          
          <div className="relative z-10 flex flex-col sm:flex-row items-center justify-between gap-8">
            <div className="text-left space-y-2">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-100 border border-blue-200 text-blue-700 text-sm font-bold uppercase tracking-wider mb-2">
                <span className={`w-2 h-2 rounded-full ${admissionsOpen ? 'bg-blue-600 animate-ping' : 'bg-slate-400'}`} />
                {admissionsOpen ? 'Enrollment Open' : 'Enrollment Status'}
              </div>
              <h3 className="text-3xl sm:text-4xl font-display font-bold text-slate-900">
                Admissions {admissionsOpen ? 'Open' : 'Information'} {admissionsYear}
              </h3>
              <p className="text-slate-600 max-w-md text-lg">
                Secure your child&apos;s future at a premier institute. Limited seats available for all classes.
              </p>
            </div>
            <Link
              href="/admissions" 
              className="w-full sm:w-auto px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-full font-bold text-lg shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-1 text-center whitespace-nowrap"
            >
              Apply Online Now
            </Link>
          </div>
        </m.div>
      </div>
    </section>
  );
}
