'use client';

import { motion } from 'framer-motion';
import { Award, Star, Medal, Trophy } from 'lucide-react';
import SectionHeader from '@/components/ui/SectionHeader';
import Image from 'next/image';

const topStudents = [
  {
    name: 'Ayesha Khan',
    position: '1st Position',
    board: 'BSEK Science Group 2025',
    marks: '98.5%',
    image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    color: 'gold'
  },
  {
    name: 'Bilal Ahmed',
    position: '2nd Position',
    board: 'BIEK Pre-Engineering 2025',
    marks: '96.2%',
    image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    color: 'blue'
  },
  {
    name: 'Fatima Ali',
    position: '1st Position',
    board: 'BIEK Pre-Medical 2025',
    marks: '97.8%',
    image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    color: 'gold'
  },
  {
    name: 'Saad Qureshi',
    position: 'Top 10',
    board: 'BSEK Computer Science 2025',
    marks: '94.0%',
    image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    color: 'red'
  }
];

export default function AchievementsSection() {
  return (
    <section className="py-24 bg-white dark:bg-[#001B4D] relative overflow-hidden">
      <div className="absolute top-1/2 left-0 w-[500px] h-[500px] bg-[#FFD700]/5 rounded-full blur-[120px] pointer-events-none" />
      
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.6 }}
        >
          <SectionHeader 
            badge="Hall of Fame"
            title="Our Top" 
            titleHighlight="Achievers" 
            description="We consistently produce board toppers. Meet the brilliant minds who have set new records and made The Foundation Collegiate proud."
            className="mb-16"
          />
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {topStudents.map((student, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ delay: idx * 0.15, duration: 0.6 }}
              className="group relative rounded-3xl overflow-hidden bg-[#080c18] border border-white/10 shadow-2xl"
            >
              <div className="aspect-[4/5] w-full relative overflow-hidden">
                <img 
                  src={student.image} 
                  alt={student.name}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 opacity-80 group-hover:opacity-100"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#080c18] via-[#080c18]/50 to-transparent" />
                
                {/* Position Badge */}
                <div className="absolute top-4 right-4 bg-[#FFD700] text-[#001B4D] px-4 py-1.5 rounded-full font-bold text-sm shadow-lg flex items-center gap-1.5 transform group-hover:-translate-y-1 transition-transform">
                  <Trophy size={14} />
                  {student.position}
                </div>
              </div>

              <div className="absolute bottom-0 left-0 w-full p-6 text-center transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                <h3 className="text-2xl font-display font-bold text-white mb-1">{student.name}</h3>
                <p className="text-[#FFD700] font-semibold text-sm mb-3">{student.board}</p>
                <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/20 px-4 py-2 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 delay-100">
                  <Star size={16} className="text-[#FFD700] fill-[#FFD700]" />
                  <span className="text-white font-bold">{student.marks}</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="mt-16 flex justify-center"
        >
          <div className="flex items-center gap-8 py-6 px-12 bg-white/5 dark:bg-[#080c18]/50 backdrop-blur-md border border-slate-200 dark:border-white/10 rounded-full flex-wrap justify-center">
            <div className="flex items-center gap-3">
              <Medal size={24} className="text-[#FFD700]" />
              <span className="font-bold text-slate-800 dark:text-white">100+ Board Positions</span>
            </div>
            <div className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-white/20 hidden md:block" />
            <div className="flex items-center gap-3">
              <Award size={24} className="text-[#0057FF]" />
              <span className="font-bold text-slate-800 dark:text-white">500+ A-1 Grades</span>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
