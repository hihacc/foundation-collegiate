'use client';

import { motion } from 'framer-motion';
import { BookOpen, CheckCircle2, ArrowRight, Calculator, Microscope, Code, LineChart, Beaker, Zap } from 'lucide-react';
import Link from 'next/link';
import SectionHeader from '@/components/ui/SectionHeader';
import Button from '@/components/ui/Button';

const courses = [
  {
    id: 'middle-school',
    title: 'Middle School (VI - VIII)',
    classes: 'Class 6, 7 & 8',
    description: 'Building a strong foundation in core subjects. Focus on critical thinking, basic sciences, and mathematics.',
    features: ['Mathematics', 'General Science', 'English Language', 'Computer Basics'],
    icon: Calculator,
    color: 'blue'
  },
  {
    id: 'matric-science',
    title: 'Matric Science (IX & X)',
    classes: 'Class 9 & 10',
    description: 'Comprehensive preparation for BSEK board exams with intensive focus on conceptual clarity and practicals.',
    features: ['Physics', 'Chemistry', 'Biology / Computer', 'Mathematics'],
    icon: Microscope,
    color: 'green'
  },
  {
    id: 'inter-premed',
    title: 'Pre-Medical (XI & XII)',
    classes: 'Intermediate',
    description: 'Rigorous coaching for future doctors (BIEK). Includes in-depth MDCAT basics and practical lab focus.',
    features: ['Botany & Zoology', 'Chemistry', 'Physics', 'MDCAT Preparation'],
    icon: Beaker,
    color: 'red'
  },
  {
    id: 'inter-preeng',
    title: 'Pre-Engineering (XI & XII)',
    classes: 'Intermediate',
    description: 'Advanced mathematics and physics coaching to prepare students for top engineering universities.',
    features: ['Advanced Mathematics', 'Physics', 'Chemistry', 'ECAT Preparation'],
    icon: Zap,
    color: 'gold'
  },
  {
    id: 'inter-cs',
    title: 'Computer Science (XI & XII)',
    classes: 'Intermediate',
    description: 'Modern computing curriculum covering programming, databases, and IT fundamentals.',
    features: ['Programming Basics', 'Databases', 'Physics', 'Mathematics'],
    icon: Code,
    color: 'blue'
  },
  {
    id: 'inter-commerce',
    title: 'Commerce (XI & XII)',
    classes: 'Intermediate',
    description: 'Specialized faculty for Accounting, Economics, and Business Math for future entrepreneurs.',
    features: ['Accounting', 'Economics', 'Business Math', 'Commercial Geo'],
    icon: LineChart,
    color: 'gold'
  }
];

export default function CoursesSection() {
  const colorMap: Record<string, { bg: string, text: string, border: string, shadow: string, hoverBorder: string }> = {
    blue: { bg: 'bg-[#0057FF]/10', text: 'text-[#0057FF]', border: 'border-[#0057FF]/20', hoverBorder: 'group-hover:border-[#0057FF]/50', shadow: 'shadow-[#0057FF]/20' },
    green: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/20', hoverBorder: 'group-hover:border-emerald-500/50', shadow: 'shadow-emerald-500/20' },
    red: { bg: 'bg-[#D72638]/10', text: 'text-[#D72638]', border: 'border-[#D72638]/20', hoverBorder: 'group-hover:border-[#D72638]/50', shadow: 'shadow-[#D72638]/20' },
    gold: { bg: 'bg-[#FFD700]/10', text: 'text-[#FFD700]', border: 'border-[#FFD700]/20', hoverBorder: 'group-hover:border-[#FFD700]/50', shadow: 'shadow-[#FFD700]/20' },
  };

  return (
    <section className="py-24 bg-[#080c18] relative">
      <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      <div className="absolute inset-0 bg-grid-pattern opacity-[0.02] pointer-events-none" />
      
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.6 }}
        >
          <SectionHeader 
            badge="Academic Excellence"
            title="Premium" 
            titleHighlight="Programs" 
            description="From Class 6 to Intermediate, we offer tailored, high-performance coaching programs designed to guarantee maximum scores in board examinations."
            className="mb-16 text-white"
          />
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {courses.map((course, idx) => {
            const colors = colorMap[course.color];
            return (
              <motion.div
                key={course.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-50px' }}
                transition={{ delay: idx * 0.1, duration: 0.5 }}
                className={`bg-[#0a0f1e]/80 backdrop-blur-xl border ${colors.border} ${colors.hoverBorder} rounded-[2rem] p-8 hover:-translate-y-2 transition-all duration-300 relative group overflow-hidden shadow-lg hover:shadow-2xl`}
              >
                {/* Background Glow */}
                <div className={`absolute -top-24 -right-24 w-48 h-48 rounded-full blur-[80px] opacity-0 group-hover:opacity-40 transition-opacity duration-500 ${colors.bg}`} />

                <div className="flex justify-between items-start mb-6">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3 shadow-inner ${colors.bg} ${colors.text}`}>
                    <course.icon size={28} />
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold tracking-wider uppercase border ${colors.bg} ${colors.border} ${colors.text}`}>
                    {course.classes}
                  </span>
                </div>

                <h3 className="text-2xl font-display font-bold mb-3 text-white group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-white group-hover:to-white/70 transition-all">
                  {course.title}
                </h3>
                <p className="text-white/60 mb-6 leading-relaxed text-sm">
                  {course.description}
                </p>
                
                <ul className="space-y-3 mb-8">
                  {course.features.map((feature, fIdx) => (
                    <li key={fIdx} className="flex items-center gap-3 text-sm font-medium text-white/80">
                      <CheckCircle2 size={16} className={`${colors.text} shrink-0`} />
                      {feature}
                    </li>
                  ))}
                </ul>

                <Link href={`/courses#${course.id}`} className="block mt-auto">
                  <Button className={`w-full bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-xl py-6 transition-all duration-300 group-hover:shadow-[0_0_20px_rgba(255,255,255,0.1)] gap-2`}>
                    Course Details <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
