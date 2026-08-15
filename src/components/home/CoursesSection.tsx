'use client';

import { useEffect, useState } from 'react';
import { m } from 'framer-motion';
import { GraduationCap, ArrowRight, Laptop } from 'lucide-react';
import Link from 'next/link';
import SectionHeader from '@/components/ui/SectionHeader';
import { Course } from '@/types';
import { getStoredData, setStoredData } from '@/lib/utils/storage';
import { supabase } from '@/lib/supabase/client';

const defaultCourses: Course[] = [
  { id: '1', name: 'Matriculation Science', type: 'Course', level: 'Matric', classes: 'Class IX & X', description: 'Comprehensive board exam preparation.', subjects: ['Physics', 'Chemistry', 'Biology', 'Maths'], fee_per_month: 3500, is_active: true, display_order: 1 },
  { id: '2', name: 'FSc Pre-Medical', type: 'Course', level: 'Intermediate', classes: 'Class XI & XII', description: 'Rigorous coaching for Pre-Medical students.', subjects: ['Physics', 'Chemistry', 'Biology', 'English'], fee_per_month: 4500, is_active: true, display_order: 2 },
  { id: '3', name: 'FSc Pre-Engineering', type: 'Course', level: 'Intermediate', classes: 'Class XI & XII', description: 'Advanced mathematics and physics coaching.', subjects: ['Physics', 'Chemistry', 'Maths', 'English'], fee_per_month: 4500, is_active: true, display_order: 3 },
  { id: '4', name: 'Diploma in IT (DIT)', type: 'Diploma', level: 'Diploma', classes: '1-Year Program', description: '1-Year Diploma in IT & Software Systems.', subjects: ['Automation', 'Programming', 'DB'], fee_per_month: 3000, is_active: true, display_order: 4 },
];

export default function CoursesSection() {
  const [courses, setCourses] = useState<Course[]>(defaultCourses);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data, error } = await supabase.from('courses').select('*').order('display_order').limit(6);
        if (cancelled) return;
        if (!error && data && data.length > 0) {
          setCourses(data as Course[]);
        }
      } catch (err) {
        console.error('Failed to load courses from Supabase:', err);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  return (
    <section id="courses" className="py-24 relative overflow-hidden bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
          <SectionHeader
            badge="Academic Programs"
            title="Courses &"
            titleHighlight="Diplomas"
            description="Explore our high-achieving academic coaching and professional IT diploma programs designed for board success."
            className="text-left max-w-2xl"
          />
          <Link href="/courses" className="inline-flex items-center gap-2 font-bold text-[#2563EB] hover:text-[#1E3A8A] transition-colors">
            View All Programs <ArrowRight size={18} />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {courses.slice(0, 4).map((c, idx) => (
            <m.div
              key={c.id || idx}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1, duration: 0.5 }}
              className="bg-white rounded-3xl p-6 flex flex-col justify-between group h-full border border-slate-100 shadow-sm hover:shadow-xl hover:border-blue-100 hover:-translate-y-2 transition-all duration-300"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-6">
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full ${
                    c.type === 'Diploma' ? 'bg-indigo-50 text-indigo-700' : 'bg-blue-50 text-[#2563EB]'
                  }`}>
                    {c.type || 'Course'}
                  </span>
                  <span className="text-xs font-bold text-slate-400 font-mono">PKR {c.fee_per_month || 3500}/mo</span>
                </div>

                <div className="w-14 h-14 rounded-2xl bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-[#2563EB] group-hover:text-white transition-all duration-300">
                  {c.type === 'Diploma' ? <Laptop size={24} /> : <GraduationCap size={24} />}
                </div>

                <h3 className="text-xl font-bold text-[#0F172A] mb-3 leading-snug">{c.name}</h3>
                
                <div className="space-y-2 mb-4 p-3 bg-slate-50 rounded-xl">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-500 font-semibold">Duration:</span>
                    <span className="text-slate-800 font-bold">{c.type === 'Diploma' ? '1 Year' : '2 Years'}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-500 font-semibold">Eligibility:</span>
                    <span className="text-slate-800 font-bold">{c.level === 'Matric' ? '8th Pass' : 'Matric Pass'}</span>
                  </div>
                </div>
                
                {c.description && <p className="text-sm text-slate-600 leading-relaxed mb-6 line-clamp-2">{c.description}</p>}
              </div>

              <Link
                href="/admissions"
                className="w-full py-3.5 bg-white text-[#2563EB] border border-[#2563EB] hover:bg-[#2563EB] hover:text-white font-bold text-sm rounded-xl flex items-center justify-center gap-2 transition-all duration-300"
              >
                View Details <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
              </Link>
            </m.div>
          ))}
        </div>
      </div>
    </section>
  );
}
