import { Metadata } from 'next';
import Link from 'next/link';
import SectionHeader from '@/components/ui/SectionHeader';
import { BookOpen, GraduationCap, Calendar, Award, CheckCircle2, ArrowRight } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Academics & Examination System | The Foundation Collegiate',
  description: 'Explore academic levels, class structures, assessment systems, and academic calendars at The Foundation Collegiate.',
};

export default function AcademicsPage() {
  const academicPillars = [
    {
      title: 'Classes & Levels',
      desc: 'Coaching for IX & X Matriculation (BSEK) and XI & XII Intermediate (BIEK) in Science & Computer streams.',
      link: '/classes',
      icon: GraduationCap
    },
    {
      title: 'Academic Programs',
      desc: 'Pre-Medical, Pre-Engineering, Computer Science, Commerce, and Professional IT Diplomas.',
      link: '/courses',
      icon: BookOpen
    },
    {
      title: 'Academic Calendar & Notices',
      desc: 'Stay informed with upcoming test schedules, holiday notifications, and exam timetables.',
      link: '/notices',
      icon: Calendar
    },
    {
      title: 'Examination & Results System',
      desc: 'Daily assessments, weekly test series, and official online marksheet verification using student PIN.',
      link: '/results',
      icon: Award
    }
  ];

  return (
    <div className="py-20 bg-[var(--background)]">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
        <SectionHeader
          badge="Educational Framework"
          title="Academic"
          titleHighlight="Excellence & System"
          description="Combining disciplined pedagogy, weekly test series, and board exam orientation to ensure top student achievement."
          className="mb-16"
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
          {academicPillars.map((pillar, idx) => (
            <div key={idx} className="bg-white p-8 rounded-3xl border border-slate-200 shadow-md hover:shadow-xl transition-all flex flex-col justify-between group">
              <div>
                <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <pillar.icon size={28} />
                </div>
                <h3 className="text-2xl font-bold text-slate-800 mb-3">{pillar.title}</h3>
                <p className="text-slate-600 text-sm leading-relaxed mb-6">{pillar.desc}</p>
              </div>

              <Link 
                href={pillar.link}
                className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-bold text-sm"
              >
                Explore Details <ArrowRight size={16} />
              </Link>
            </div>
          ))}
        </div>

        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-3xl p-8 sm:p-12 text-white shadow-xl flex flex-col md:flex-row items-center justify-between gap-8">
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-blue-200 block mb-2">Student Verification</span>
            <h3 className="text-2xl sm:text-3xl font-bold">Check Your Examination Results</h3>
            <p className="text-blue-100 text-sm mt-2 max-w-xl">Access monthly test transcripts and official mark sheets securely with your Roll Number and 4-digit PIN.</p>
          </div>
          <Link href="/results" className="bg-white text-blue-600 hover:bg-slate-50 px-8 py-4 rounded-2xl font-bold text-sm shadow-lg shrink-0 transition-colors">
            Result Checker Portal
          </Link>
        </div>
      </div>
    </div>
  );
}
