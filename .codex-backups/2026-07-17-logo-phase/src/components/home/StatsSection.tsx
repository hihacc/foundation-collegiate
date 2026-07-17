'use client';

import { Users, Trophy, Award, Calendar } from 'lucide-react';
import StatCard from '@/components/ui/StatCard';
import SectionHeader from '@/components/ui/SectionHeader';
import { motion } from 'framer-motion';

const stats = [
  { value: 5000, label: 'Students Enrolled', icon: Users, suffix: '+', color: 'blue' as const },
  { value: 15, label: 'Years Experience', icon: Calendar, suffix: '+', color: 'red' as const },
  { value: 100, label: 'Top Positions', icon: Award, suffix: '+', color: 'gold' as const },
  { value: 98, label: 'Success Rate', icon: Trophy, suffix: '%', color: 'green' as const },
];

export default function StatsSection() {
  return (
    <section className="py-24 bg-white relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-[#0057FF]/30 to-transparent" />
      <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] opacity-[0.03] pointer-events-none" />
      
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <motion.div
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
        </motion.div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {stats.map((stat, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: idx * 0.1 }}
            >
              <StatCard {...stat} />
            </motion.div>
          ))}
        </div>

        {/* Admissions Open Banner */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mt-16 w-full max-w-4xl mx-auto rounded-3xl bg-gradient-to-r from-[#001B4D] via-[#001338] to-[#001B4D] border border-[#0057FF]/20 p-8 sm:p-12 text-center relative overflow-hidden shadow-[0_20px_50px_rgba(0,27,77,0.5)]"
        >
          <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] opacity-10" />
          <div className="absolute -top-24 -left-24 w-64 h-64 bg-[#0057FF] rounded-full blur-[100px] opacity-30" />
          <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-[#FFD700] rounded-full blur-[100px] opacity-20" />
          
          <div className="relative z-10 flex flex-col sm:flex-row items-center justify-between gap-8">
            <div className="text-left space-y-2">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#FFD700]/10 border border-[#FFD700]/20 text-[#FFD700] text-sm font-bold uppercase tracking-wider mb-2">
                <span className="w-2 h-2 rounded-full bg-[#FFD700] animate-ping" />
                Enrollment Started
              </div>
              <h3 className="text-3xl sm:text-4xl font-display font-bold text-white">Admissions Open 2026</h3>
              <p className="text-white/70 max-w-md text-lg">Secure your child&apos;s future at a premium institute. Limited seats available for all classes.</p>
            </div>
            <a 
              href="/admissions" 
              className="w-full sm:w-auto px-8 py-4 bg-[#D72638] hover:bg-[#b01e2c] text-white rounded-full font-bold text-lg shadow-[0_0_20px_rgba(215,38,56,0.4)] hover:shadow-[0_0_30px_rgba(215,38,56,0.6)] transition-all duration-300 hover:-translate-y-1 text-center whitespace-nowrap"
            >
              Apply Online Now
            </a>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
