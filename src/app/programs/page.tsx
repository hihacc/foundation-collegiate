'use client';

export const dynamic = 'force-dynamic';

import { Suspense, useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import SectionHeader from '@/components/ui/SectionHeader';
import { BookOpen, Laptop, Stethoscope, Compass, Calculator, ArrowRight, Filter, Loader2, Award, Clock } from 'lucide-react';

interface ProgramItem {
  id: string;
  title: string;
  slug: string;
  classSlug?: string;
  streamSlug?: string;
  levelLabel: string;
  desc: string;
  icon: any;
  color: string;
  programType: 'academic_stream' | 'diploma';
  duration?: string;
}

const academicPrograms: ProgramItem[] = [
  // Class IX
  {
    id: 'ix-cs',
    title: 'Class IX — Computer Science',
    slug: 'ix-computer-science',
    classSlug: 'ix',
    streamSlug: 'computer-science',
    levelLabel: 'Class IX (Matric Part 1)',
    desc: 'BSEK Class IX Matriculation in Computer Science stream with foundational lab orientation.',
    icon: Laptop,
    color: 'bg-purple-50 text-purple-600 border-purple-200',
    programType: 'academic_stream',
    duration: '1 Year'
  },
  {
    id: 'ix-bio',
    title: 'Class IX — Biology',
    slug: 'ix-biology',
    classSlug: 'ix',
    streamSlug: 'biology',
    levelLabel: 'Class IX (Matric Part 1)',
    desc: 'BSEK Class IX Matriculation in Biology & General Science stream with laboratory practicals.',
    icon: Stethoscope,
    color: 'bg-rose-50 text-rose-600 border-rose-200',
    programType: 'academic_stream',
    duration: '1 Year'
  },
  // Class X
  {
    id: 'x-cs',
    title: 'Class X — Computer Science',
    slug: 'x-computer-science',
    classSlug: 'x',
    streamSlug: 'computer-science',
    levelLabel: 'Class X (Matric Part 2)',
    desc: 'BSEK Class X Matriculation in Computer Science stream with hands-on lab orientation.',
    icon: Laptop,
    color: 'bg-purple-50 text-purple-600 border-purple-200',
    programType: 'academic_stream',
    duration: '1 Year'
  },
  {
    id: 'x-bio',
    title: 'Class X — Biology',
    slug: 'x-biology',
    classSlug: 'x',
    streamSlug: 'biology',
    levelLabel: 'Class X (Matric Part 2)',
    desc: 'BSEK Class X Matriculation in Biology & Science stream with lab practical guidance.',
    icon: Stethoscope,
    color: 'bg-rose-50 text-rose-600 border-rose-200',
    programType: 'academic_stream',
    duration: '1 Year'
  },
  // Class XI
  {
    id: 'xi-med',
    title: 'Class XI — Pre-Medical',
    slug: 'xi-pre-medical',
    classSlug: 'xi',
    streamSlug: 'pre-medical',
    levelLabel: 'Class XI (Part 1)',
    desc: 'BIEK FSc Pre-Medical in Biology, Physics, and Chemistry with MDCAT orientation.',
    icon: Stethoscope,
    color: 'bg-rose-50 text-rose-600 border-rose-200',
    programType: 'academic_stream',
    duration: '1 Year'
  },
  {
    id: 'xi-eng',
    title: 'Class XI — Pre-Engineering',
    slug: 'xi-pre-engineering',
    classSlug: 'xi',
    streamSlug: 'pre-engineering',
    levelLabel: 'Class XI (Part 1)',
    desc: 'BIEK FSc Pre-Engineering in Advanced Mathematics, Physics, and Chemistry for ECAT.',
    icon: Compass,
    color: 'bg-blue-50 text-blue-600 border-blue-200',
    programType: 'academic_stream',
    duration: '1 Year'
  },
  {
    id: 'xi-cs',
    title: 'Class XI — Computer Science',
    slug: 'xi-computer-science',
    classSlug: 'xi',
    streamSlug: 'computer-science',
    levelLabel: 'Class XI (Part 1)',
    desc: 'BIEK ICS Computer Science covering programming, logic, physics, and mathematics.',
    icon: Laptop,
    color: 'bg-purple-50 text-purple-600 border-purple-200',
    programType: 'academic_stream',
    duration: '1 Year'
  },
  {
    id: 'xi-com',
    title: 'Class XI — Commerce',
    slug: 'xi-commerce',
    classSlug: 'xi',
    streamSlug: 'commerce',
    levelLabel: 'Class XI (Part 1)',
    desc: 'BIEK I.Com Commerce covering Accounting, Economics, and Business Mathematics.',
    icon: Calculator,
    color: 'bg-emerald-50 text-emerald-600 border-emerald-200',
    programType: 'academic_stream',
    duration: '1 Year'
  },
  // Class XII
  {
    id: 'xii-med',
    title: 'Class XII — Pre-Medical',
    slug: 'xii-pre-medical',
    classSlug: 'xii',
    streamSlug: 'pre-medical',
    levelLabel: 'Class XII (Part 2)',
    desc: 'BIEK FSc Pre-Medical Part 2 with MDCAT mock entry test series.',
    icon: Stethoscope,
    color: 'bg-rose-50 text-rose-600 border-rose-200',
    programType: 'academic_stream',
    duration: '1 Year'
  },
  {
    id: 'xii-eng',
    title: 'Class XII — Pre-Engineering',
    slug: 'xii-pre-engineering',
    classSlug: 'xii',
    streamSlug: 'pre-engineering',
    levelLabel: 'Class XII (Part 2)',
    desc: 'BIEK FSc Pre-Engineering Part 2 with ECAT engineering university entry series.',
    icon: Compass,
    color: 'bg-blue-50 text-blue-600 border-blue-200',
    programType: 'academic_stream',
    duration: '1 Year'
  },
  {
    id: 'xii-cs',
    title: 'Class XII — Computer Science',
    slug: 'xii-computer-science',
    classSlug: 'xii',
    streamSlug: 'computer-science',
    levelLabel: 'Class XII (Part 2)',
    desc: 'BIEK ICS Computer Science Part 2 focusing on software, databases, and physics.',
    icon: Laptop,
    color: 'bg-purple-50 text-purple-600 border-purple-200',
    programType: 'academic_stream',
    duration: '1 Year'
  },
  {
    id: 'xii-com',
    title: 'Class XII — Commerce',
    slug: 'xii-commerce',
    classSlug: 'xii',
    streamSlug: 'commerce',
    levelLabel: 'Class XII (Part 2)',
    desc: 'BIEK I.Com Commerce Part 2 with Advanced Accounting, Commercial Geography & Banking.',
    icon: Calculator,
    color: 'bg-emerald-50 text-emerald-600 border-emerald-200',
    programType: 'academic_stream',
    duration: '1 Year'
  }
];

const diplomaPrograms: ProgramItem[] = [
  {
    id: 'diploma-accounting',
    title: 'Diploma in Accounting & Finance',
    slug: 'diploma-accounting-finance',
    levelLabel: 'Professional Diploma',
    desc: 'Comprehensive 1-year diploma in financial accounting, corporate taxation, auditing, and computerized financial software.',
    icon: Award,
    color: 'bg-amber-50 text-amber-600 border-amber-200',
    programType: 'diploma',
    duration: '1 Year'
  }
];

function ProgramsContent() {
  const searchParams = useSearchParams();
  const streamParam = searchParams.get('stream');
  const classParam = searchParams.get('class');

  const [activeStreamFilter, setActiveStreamFilter] = useState<string>(streamParam || 'all');
  const [activeClassFilter, setActiveClassFilter] = useState<string>(classParam || 'all');

  useEffect(() => {
    if (streamParam) setActiveStreamFilter(streamParam.toLowerCase());
    else if (classParam) setActiveClassFilter(classParam.toLowerCase());
    else {
      setActiveStreamFilter('all');
      setActiveClassFilter('all');
    }
  }, [streamParam, classParam]);

  const filteredAcademic = academicPrograms.filter((item) => {
    let matchStream = true;
    let matchClass = true;

    if (activeStreamFilter !== 'all') {
      matchStream = item.streamSlug?.toLowerCase() === activeStreamFilter;
    }

    if (activeClassFilter !== 'all') {
      matchClass = item.classSlug?.toLowerCase() === activeClassFilter;
    }

    return matchStream && matchClass;
  });

  return (
    <div className="py-20 bg-[var(--background)]">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
        <SectionHeader
          badge="Academic Taxonomy & Specializations"
          title="Programs &"
          titleHighlight="Academic Streams"
          description="Class X (Matriculation), Class XI & XII (Intermediate), and Professional Diploma offerings at The Foundation Collegiate."
          className="mb-12"
        />

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center justify-center gap-2 mb-12">
          <button
            onClick={() => { setActiveStreamFilter('all'); setActiveClassFilter('all'); }}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeStreamFilter === 'all' && activeClassFilter === 'all'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            All Academic Programs
          </button>
          
          {/* Class Filters */}
          {[
            { label: 'Class IX', slug: 'ix' },
            { label: 'Class X', slug: 'x' },
            { label: 'Class XI', slug: 'xi' },
            { label: 'Class XII', slug: 'xii' },
          ].map((c) => (
            <button
              key={c.slug}
              onClick={() => { setActiveClassFilter(c.slug); setActiveStreamFilter('all'); }}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeClassFilter === c.slug
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              {c.label}
            </button>
          ))}

          {/* Stream Filters */}
          {[
            { label: 'Pre-Medical', slug: 'pre-medical' },
            { label: 'Pre-Engineering', slug: 'pre-engineering' },
            { label: 'Computer Science', slug: 'computer-science' },
            { label: 'Commerce', slug: 'commerce' },
            { label: 'Biology', slug: 'biology' },
          ].map((s) => (
            <button
              key={s.slug}
              onClick={() => { setActiveStreamFilter(s.slug); setActiveClassFilter('all'); }}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeStreamFilter === s.slug
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>

        {/* Academic Program Cards */}
        {filteredAcademic.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-3xl border border-slate-200 max-w-xl mx-auto mb-16">
            <Filter size={32} className="mx-auto text-slate-400 mb-3" />
            <h4 className="font-bold text-slate-800 text-base mb-1">No exact academic programs match the filter</h4>
            <p className="text-slate-500 text-xs mb-4">Try clearing the filters to view all available academic streams.</p>
            <button
              onClick={() => { setActiveStreamFilter('all'); setActiveClassFilter('all'); }}
              className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold"
            >
              Show All Programs
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-20">
            {filteredAcademic.map((stream) => (
              <div key={stream.id} className="bg-white rounded-3xl p-8 border border-slate-200 shadow-md hover:shadow-xl transition-all flex flex-col justify-between group">
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <div className={`w-14 h-14 rounded-2xl ${stream.color} border flex items-center justify-center shrink-0`}>
                      <stream.icon size={28} />
                    </div>
                    {stream.duration && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-full border border-slate-200">
                        <Clock size={12} /> {stream.duration}
                      </span>
                    )}
                  </div>
                  <span className="text-xs font-bold text-blue-600 uppercase tracking-widest block mb-1">{stream.levelLabel}</span>
                  <h3 className="text-xl font-bold text-slate-800 mb-3">{stream.title}</h3>
                  <p className="text-slate-600 text-sm leading-relaxed mb-6">{stream.desc}</p>
                </div>

                <Link
                  href="/admissions"
                  className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl flex items-center justify-center gap-2 transition-all shadow-md shadow-blue-600/20"
                >
                  Apply for {stream.title} <ArrowRight size={16} />
                </Link>
              </div>
            ))}
          </div>
        )}

        {/* Standalone Diploma Programs Section */}
        <div className="pt-8 border-t border-slate-200">
          <div className="mb-8">
            <span className="px-3 py-1 bg-amber-50 text-amber-700 border border-amber-200 font-bold text-xs rounded-full uppercase tracking-wider">
              Professional Certification
            </span>
            <h2 className="text-2xl font-bold text-slate-800 mt-2">Standalone Diploma Programs</h2>
            <p className="text-slate-500 text-sm mt-1">Professional certifications offered independently from standard academic board classes.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
            {diplomaPrograms.map((diploma) => (
              <div key={diploma.id} className="bg-white rounded-3xl p-8 border-2 border-amber-200/80 shadow-md hover:shadow-xl transition-all flex flex-col justify-between group">
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <div className={`w-14 h-14 rounded-2xl ${diploma.color} border flex items-center justify-center shrink-0`}>
                      <diploma.icon size={28} />
                    </div>
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-50 px-3 py-1 rounded-full border border-amber-200">
                      <Clock size={12} /> {diploma.duration}
                    </span>
                  </div>
                  <span className="text-xs font-bold text-amber-600 uppercase tracking-widest block mb-1">{diploma.levelLabel}</span>
                  <h3 className="text-xl font-bold text-slate-800 mb-3">{diploma.title}</h3>
                  <p className="text-slate-600 text-sm leading-relaxed mb-6">{diploma.desc}</p>
                </div>

                <Link
                  href="/admissions"
                  className="w-full py-3 bg-amber-600 hover:bg-amber-700 text-white font-bold text-sm rounded-xl flex items-center justify-center gap-2 transition-all shadow-md shadow-amber-600/20"
                >
                  Apply for {diploma.title} <ArrowRight size={16} />
                </Link>
              </div>
            ))}
          </div>
        </div>

        <div className="text-center bg-blue-50 border border-blue-200 rounded-3xl p-8 max-w-4xl mx-auto">
          <h3 className="text-xl font-bold text-slate-800 mb-2">Need Guidance Choosing Your Stream?</h3>
          <p className="text-slate-600 text-sm mb-6">Our academic counselors are available to guide you through stream selection and career paths.</p>
          <Link href="/contact" className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-bold text-sm shadow-md">
            Speak with an Advisor
          </Link>
        </div>

      </div>
    </div>
  );
}

export default function ProgramsPage() {
  return (
    <Suspense fallback={
      <div className="py-20 flex flex-col items-center justify-center text-slate-400">
        <Loader2 className="w-8 h-8 animate-spin mb-4 text-blue-600" />
        <p className="text-sm font-semibold">Loading programs...</p>
      </div>
    }>
      <ProgramsContent />
    </Suspense>
  );
}
