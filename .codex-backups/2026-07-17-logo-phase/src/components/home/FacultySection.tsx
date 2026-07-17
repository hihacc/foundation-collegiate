'use client';

import { motion } from 'framer-motion';
import SectionHeader from '@/components/ui/SectionHeader';

const faculty = [
  { name: 'Sir Ahmed', subject: 'Physics', experience: '15+ Years', initials: 'SA' },
  { name: 'Miss Fatima', subject: 'Chemistry', experience: '10+ Years', initials: 'MF' },
  { name: 'Sir Usman', subject: 'Mathematics', experience: '12+ Years', initials: 'SU' },
  { name: 'Miss Ayesha', subject: 'Biology', experience: '8+ Years', initials: 'MA' },
];

export default function FacultySection() {
  return (
    <section className="py-24 bg-background relative overflow-hidden">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeader 
          badge="Our Teachers"
          title="Learn from the" 
          titleHighlight="Best Faculty" 
          description="Our highly qualified and experienced teachers are dedicated to your success."
          className="mb-16"
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {faculty.map((teacher, idx) => (
            <motion.div
              key={teacher.name}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1, duration: 0.5 }}
              className="glass-card rounded-2xl p-6 text-center group hover:shadow-xl hover:border-primary/30 transition-all"
            >
              <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-tr from-primary to-blue-400 flex items-center justify-center text-white text-3xl font-bold mb-4 shadow-lg group-hover:scale-110 transition-transform">
                {teacher.initials}
              </div>
              <h3 className="text-xl font-bold mb-1">{teacher.name}</h3>
              <p className="text-primary font-medium mb-2">{teacher.subject}</p>
              <span className="text-xs font-semibold px-3 py-1 rounded-full bg-muted-bg text-muted">
                {teacher.experience}
              </span>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
