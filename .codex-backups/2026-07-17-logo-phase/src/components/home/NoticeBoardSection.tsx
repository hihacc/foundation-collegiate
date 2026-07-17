'use client';

import { motion } from 'framer-motion';
import { Bell, Calendar, ChevronRight, Clock, FileText, Pin } from 'lucide-react';
import SectionHeader from '@/components/ui/SectionHeader';
import Button from '@/components/ui/Button';

const notices = [
  {
    id: 1,
    title: 'Admissions Open for Session 2026',
    date: 'Aug 15, 2025',
    type: 'Admission',
    color: 'bg-[#D72638]/10 text-[#D72638] border-[#D72638]/20',
    isPinned: true
  },
  {
    id: 2,
    title: 'Monthly Assessment Schedule (Class 9 & 10)',
    date: 'Sep 02, 2025',
    type: 'Examination',
    color: 'bg-[#0057FF]/10 text-[#0057FF] border-[#0057FF]/20',
    isPinned: false
  },
  {
    id: 3,
    title: 'Independence Day Celebration Event',
    date: 'Aug 14, 2025',
    type: 'Event',
    color: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
    isPinned: false
  },
  {
    id: 4,
    title: 'Merit Scholarship List Announced',
    date: 'Aug 10, 2025',
    type: 'Scholarship',
    color: 'bg-[#FFD700]/10 text-[#FFD700] border-[#FFD700]/20',
    isPinned: false
  }
];

export default function NoticeBoardSection() {
  return (
    <section className="py-24 bg-[#fafbff] dark:bg-[#040812] relative overflow-hidden">
      <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] opacity-[0.03] pointer-events-none" />
      
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="lg:col-span-5"
          >
            <SectionHeader 
              align="left"
              badge="Stay Updated"
              title="Campus" 
              titleHighlight="Notice Board" 
              description="Keep track of important dates, examination schedules, upcoming events, and official announcements from the administration."
            />
            
            <div className="mt-8 space-y-4 hidden lg:block">
              <div className="flex items-center gap-4 text-slate-600 dark:text-white/60">
                <div className="w-12 h-12 rounded-xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 flex items-center justify-center shadow-sm">
                  <Calendar className="text-[#0057FF]" size={20} />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white">Academic Calendar</h4>
                  <p className="text-sm">Download the 2025-2026 schedule</p>
                </div>
              </div>
              <div className="flex items-center gap-4 text-slate-600 dark:text-white/60">
                <div className="w-12 h-12 rounded-xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 flex items-center justify-center shadow-sm">
                  <Clock className="text-[#D72638]" size={20} />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white">Class Timings</h4>
                  <p className="text-sm">Morning & Afternoon Shifts</p>
                </div>
              </div>
            </div>

            <Button className="mt-10 bg-[#001B4D] hover:bg-[#001338] text-white px-8 py-6 rounded-full font-bold shadow-xl shadow-[#001B4D]/20 transition-transform hover:-translate-y-1 w-full sm:w-auto">
              View All Notices <ChevronRight size={18} className="ml-2" />
            </Button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="lg:col-span-7 relative"
          >
            <div className="absolute -inset-4 bg-gradient-to-r from-[#0057FF]/10 to-[#FFD700]/10 blur-3xl -z-10 rounded-full" />
            
            <div className="bg-white dark:bg-[#0a0f1e]/90 backdrop-blur-xl border border-slate-200 dark:border-white/10 rounded-3xl p-2 sm:p-4 shadow-2xl">
              <div className="flex items-center justify-between px-4 py-4 border-b border-slate-100 dark:border-white/5 mb-2">
                <h3 className="font-bold text-lg flex items-center gap-2 dark:text-white">
                  <Bell size={20} className="text-[#D72638] animate-pulse" /> Recent Updates
                </h3>
              </div>
              
              <div className="space-y-2">
                {notices.map((notice, idx) => (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.3 + (idx * 0.1) }}
                    key={notice.id} 
                    className="group relative flex flex-col sm:flex-row sm:items-center gap-4 p-4 rounded-2xl hover:bg-slate-50 dark:hover:bg-white/5 transition-colors cursor-pointer border border-transparent hover:border-slate-200 dark:hover:border-white/10"
                  >
                    <div className={`shrink-0 px-3 py-1.5 rounded-lg border text-xs font-bold tracking-wide ${notice.color} w-fit sm:w-28 text-center`}>
                      {notice.type}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-slate-900 dark:text-white group-hover:text-[#0057FF] transition-colors flex items-center gap-2">
                        {notice.isPinned && <Pin size={14} className="text-[#D72638] fill-[#D72638]" />}
                        <span className="truncate">{notice.title}</span>
                      </h4>
                      <div className="flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-white/40 mt-1.5">
                        <Calendar size={12} /> {notice.date}
                      </div>
                    </div>

                    <div className="hidden sm:flex shrink-0 w-8 h-8 rounded-full bg-slate-100 dark:bg-white/5 items-center justify-center text-slate-400 group-hover:bg-[#0057FF] group-hover:text-white transition-all transform group-hover:scale-110">
                      <ChevronRight size={16} />
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>

        </div>
      </div>
    </section>
  );
}
