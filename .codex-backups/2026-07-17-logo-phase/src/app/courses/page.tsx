import type { Metadata } from 'next';
import SectionHeader from '@/components/ui/SectionHeader';
import { CheckCircle2, Award, BookOpen } from 'lucide-react';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Our Programs & Courses',
  description: 'Explore Matriculation and Intermediate programs offered at The Foundation Collegiate, North Karachi.',
};

const courses = [
  {
    id: 'matric',
    level: 'Matriculation',
    classes: 'Class IX & X',
    icon: BookOpen,
    description: 'Our Matric program offers expert guidance for all boards with regular assessments and test series.',
    programs: [
      { name: 'Science Group', subjects: ['Physics', 'Chemistry', 'Biology', 'Mathematics', 'English', 'Urdu'] },
      { name: 'Computer Science Group', subjects: ['Physics', 'Computer Science', 'Mathematics', 'English', 'Urdu'] },
    ],
    highlights: ['BSEK & FBISE Focus', 'Daily Practice Tests', 'Weekly Report Cards', 'Parent-Teacher Meetings'],
    color: 'blue',
  },
  {
    id: 'inter-science',
    level: 'Intermediate',
    classes: 'Class XI & XII (Science)',
    icon: Award,
    description: 'Rigorous and results-oriented coaching for Pre-Medical and Pre-Engineering students.',
    programs: [
      { name: 'Pre-Medical (FSc)', subjects: ['Physics', 'Chemistry', 'Biology', 'English', 'Urdu'] },
      { name: 'Pre-Engineering (FSc)', subjects: ['Physics', 'Chemistry', 'Mathematics', 'English', 'Urdu'] },
    ],
    highlights: ['BIEK Board Preparation', 'MDCAT/ECAT Concepts', 'Bi-weekly Mock Exams', 'Past Paper Intensive'],
    color: 'green',
  },
  {
    id: 'inter-commerce',
    level: 'Intermediate',
    classes: 'Class XI & XII (Commerce)',
    icon: CheckCircle2,
    description: 'Specialized faculty for Accounting, Economics, and Business Studies for ICom students.',
    programs: [
      { name: 'I.Com (Commerce)', subjects: ['Accounting', 'Economics', 'Business Math', 'Business Studies', 'English'] },
    ],
    highlights: ['Expert Commerce Faculty', 'Accounting Practicals', 'Career Counseling', 'Revision Intensives'],
    color: 'gold',
  },
];

export default function CoursesPage() {
  const colorMap: Record<string, { badge: string; border: string; icon: string }> = {
    blue: { badge: 'bg-blue-100 text-blue-700', border: 'border-blue-200', icon: 'bg-blue-100 text-blue-600' },
    green: { badge: 'bg-emerald-100 text-emerald-700', border: 'border-emerald-200', icon: 'bg-emerald-100 text-emerald-600' },
    gold: { badge: 'bg-amber-100 text-amber-700', border: 'border-amber-200', icon: 'bg-amber-100 text-amber-600' },
  };

  return (
    <div className="py-20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeader
          badge="Programs"
          title="Our"
          titleHighlight="Courses"
          description="Comprehensive programs designed for maximum board exam success."
          className="mb-16"
        />

        <div className="space-y-16">
          {courses.map((course) => {
            const colors = colorMap[course.color];
            return (
              <div key={course.id} id={course.id} className={`glass-card rounded-3xl overflow-hidden border-2 ${colors.border} shadow-lg`}>
                <div className="p-8 md:p-10">
                  <div className="flex flex-col md:flex-row md:items-start gap-6 mb-8">
                    <div className={`w-16 h-16 rounded-2xl flex items-center justify-center shrink-0 ${colors.icon}`}>
                      <course.icon size={32} />
                    </div>
                    <div>
                      <div className={`inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-2 ${colors.badge}`}>
                        {course.classes}
                      </div>
                      <h2 className="text-3xl font-display font-bold mb-2">{course.level}</h2>
                      <p className="text-muted text-lg">{course.description}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Programs */}
                    <div>
                      <h3 className="font-bold text-lg mb-4">Available Programs</h3>
                      <div className="space-y-4">
                        {course.programs.map((prog) => (
                          <div key={prog.name} className="bg-muted-bg rounded-xl p-4">
                            <h4 className="font-bold mb-2">{prog.name}</h4>
                            <div className="flex flex-wrap gap-2">
                              {prog.subjects.map((sub) => (
                                <span key={sub} className="text-xs px-2.5 py-1 bg-background rounded-full border border-border font-medium">{sub}</span>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Highlights */}
                    <div>
                      <h3 className="font-bold text-lg mb-4">Program Highlights</h3>
                      <ul className="space-y-3">
                        {course.highlights.map((h) => (
                          <li key={h} className="flex items-center gap-3 font-medium">
                            <CheckCircle2 size={18} className="text-primary shrink-0" />
                            {h}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="bg-muted-bg px-8 md:px-10 py-5 flex flex-col sm:flex-row items-center gap-4 justify-between border-t border-border">
                  <p className="text-muted text-sm">Interested in this program?</p>
                  <Link href="/admissions" className="bg-primary text-white px-6 py-2.5 rounded-full font-bold text-sm hover:bg-blue-700 transition-colors shrink-0">
                    Apply Now
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
