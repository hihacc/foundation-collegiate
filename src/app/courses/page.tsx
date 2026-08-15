'use client';

import { useEffect, useState } from 'react';
import SectionHeader from '@/components/ui/SectionHeader';
import { CheckCircle2, Award, BookOpen, GraduationCap, Laptop, Calculator, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { Course } from '@/types';
import { getStoredData, setStoredData } from '@/lib/utils/storage';
import { supabase } from '@/lib/supabase/client';

const defaultCourses: Course[] = [
  { id: '110e8400-e29b-41d4-a716-446655440061', name: 'Matriculation Science (Class IX & X)', type: 'Course', level: 'Matric', classes: 'Class IX & X', description: 'Comprehensive board exam preparation for BSEK Matric Science students.', subjects: ['Physics', 'Chemistry', 'Biology', 'Mathematics', 'English', 'Urdu'], fee_per_month: 3500, is_active: true, display_order: 1 },
  { id: '220e8400-e29b-41d4-a716-446655440062', name: 'FSc Pre-Medical (Class XI & XII)', type: 'Course', level: 'Intermediate', classes: 'Class XI & XII', description: 'Rigorous coaching for Pre-Medical students with MDCAT orientation.', subjects: ['Physics', 'Chemistry', 'Biology', 'English', 'Urdu'], fee_per_month: 4500, is_active: true, display_order: 2 },
  { id: '330e8400-e29b-41d4-a716-446655440063', name: 'FSc Pre-Engineering (Class XI & XII)', type: 'Course', level: 'Intermediate', classes: 'Class XI & XII', description: 'Advanced mathematics and physics coaching with ECAT concepts.', subjects: ['Physics', 'Chemistry', 'Mathematics', 'English', 'Urdu'], fee_per_month: 4500, is_active: true, display_order: 3 },
  { id: '440e8400-e29b-41d4-a716-446655440064', name: 'Diploma in Information Technology (DIT)', type: 'Diploma', level: 'Diploma', classes: '1-Year Program', description: 'Govt Recognized 1-Year Diploma in IT, Office Automation & Software Systems.', subjects: ['Office Automation', 'C++ Programming', 'Database Systems', 'Web Development'], fee_per_month: 3000, is_active: true, display_order: 4 },
  { id: '550e8400-e29b-41d4-a716-446655440065', name: 'Web Development & Design Diploma', type: 'Diploma', level: 'Diploma', classes: '6-Month Professional', description: 'Hands-on diploma covering HTML, CSS, JavaScript, React & Fullstack development.', subjects: ['HTML5/CSS3', 'JavaScript', 'React.js', 'Tailwind CSS', 'Git'], fee_per_month: 4000, is_active: true, display_order: 5 },
];

export default function CoursesPage() {
  const [courses, setCourses] = useState<Course[]>(() => getStoredData('courses', defaultCourses));
  const [activeTab, setActiveTab] = useState<'All' | 'Course' | 'Diploma'>('All');

  // Interactive Fee Calculator State
  const [selectedCourseId, setSelectedCourseId] = useState<string>('');
  const [includeTransport, setIncludeTransport] = useState(false);
  const [transportRoute, setTransportRoute] = useState(1500);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data, error } = await supabase.from('courses').select('*').eq('is_active', true).order('created_at', { ascending: false });
        if (cancelled) return;
        if (!error && data && data.length > 0) {
          setCourses(data as Course[]);
          setStoredData('courses', data as Course[]);
        } else {
          setCourses(getStoredData('courses', defaultCourses));
        }
      } catch {
        setCourses(getStoredData('courses', defaultCourses));
      }
    })();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (courses.length > 0 && !selectedCourseId) {
      setSelectedCourseId(courses[0].id);
    }
  }, [courses, selectedCourseId]);

  const filtered = activeTab === 'All' ? courses : courses.filter(c => c.type === activeTab);
  const selectedCourse = courses.find(c => c.id === selectedCourseId) || courses[0];

  const monthlyTuition = selectedCourse?.fee_per_month || 3500;
  const admissionFee = selectedCourse?.level === 'Intermediate' ? 8000 : 5000;
  const transportFee = includeTransport ? transportRoute : 0;
  const totalMonthly = monthlyTuition + transportFee;
  const totalFirstMonth = totalMonthly + admissionFee;

  return (
    <div className="py-20 bg-[var(--background)] space-y-16">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
        <SectionHeader
          badge="Academic & Skill Programs"
          title="Courses &"
          titleHighlight="Diplomas"
          description="Explore Matriculation & Intermediate academic coaching alongside professional IT diplomas offered at The Foundation Collegiate."
          className="mb-12"
        />

        {/* Tab Filters */}
        <div className="flex justify-center gap-2 mb-12">
          {(['All', 'Course', 'Diploma'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-5 py-2.5 rounded-xl font-bold text-sm transition-all ${
                activeTab === tab
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/25'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              {tab === 'All' ? 'All Programs' : tab === 'Course' ? 'Academic Courses' : 'Professional Diplomas'}
            </button>
          ))}
        </div>

        {/* Program Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filtered.map((program) => (
            <div
              key={program.id}
              className="clay-card rounded-3xl p-8 bg-white border border-slate-200 shadow-xl flex flex-col justify-between hover:-translate-y-1 transition-all"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-4">
                  <span className={`text-xs font-extrabold uppercase tracking-wider px-3 py-1 rounded-full ${
                    program.type === 'Diploma' ? 'bg-purple-100 text-purple-700 border border-purple-200' : 'bg-blue-100 text-blue-700 border border-blue-200'
                  }`}>
                    {program.type || 'Course'}
                  </span>
                  <span className="text-xs font-bold text-slate-500 font-mono">
                    PKR {program.fee_per_month || 3500}/mo
                  </span>
                </div>

                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold shrink-0">
                    {program.type === 'Diploma' ? <Laptop size={24} /> : <GraduationCap size={24} />}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-800 leading-tight">{program.name}</h3>
                    <p className="text-xs font-semibold text-blue-600 mt-0.5">{program.classes}</p>
                  </div>
                </div>

                <p className="text-slate-600 text-sm leading-relaxed mb-6">
                  {program.description}
                </p>

                {program.subjects && program.subjects.length > 0 && (
                  <div className="space-y-2 mb-6">
                    <span className="text-xs font-bold text-slate-400 uppercase block">Key Subjects / Modules:</span>
                    <div className="flex flex-wrap gap-1.5">
                      {program.subjects.map((sub, i) => (
                        <span key={i} className="text-xs bg-slate-100 text-slate-700 font-medium px-2.5 py-1 rounded-lg border border-slate-200">
                          {sub}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-slate-100">
                <Link
                  href="/admissions"
                  className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl flex items-center justify-center gap-2 transition-all shadow-md shadow-blue-600/20"
                >
                  Apply for {program.name}
                </Link>
              </div>
            </div>
          ))}
        </div>

        {/* Interactive Fee Estimator & Calculator Widget */}
        <div className="mt-20 bg-white rounded-[2.5rem] p-8 md:p-12 text-slate-800 border border-slate-200 shadow-xl relative overflow-hidden">
          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold uppercase tracking-wider mb-4">
                <Calculator size={14} /> Interactive ERP Calculator
              </div>
              <h2 className="text-3xl font-display font-bold text-slate-900 mb-4">Fee & Tuition Estimator</h2>
              <p className="text-slate-600 text-sm leading-relaxed mb-6">
                Calculate estimated monthly tuition, admission fees, and optional transport charges for your selected academic program.
              </p>

              <div className="space-y-5">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">Select Program / Class</label>
                  <select
                    value={selectedCourseId}
                    onChange={(e) => setSelectedCourseId(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 font-bold focus:ring-2 focus:ring-blue-500 outline-none text-sm cursor-pointer"
                  >
                    {courses.map(c => (
                      <option key={c.id} value={c.id} className="bg-white text-slate-800">
                        {c.name} (PKR {c.fee_per_month}/mo)
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="transport_check"
                      checked={includeTransport}
                      onChange={(e) => setIncludeTransport(e.target.checked)}
                      className="w-5 h-5 accent-blue-600 rounded cursor-pointer"
                    />
                    <label htmlFor="transport_check" className="text-sm font-bold text-slate-800 cursor-pointer">
                      Include Daily Transport Facility
                    </label>
                  </div>
                  {includeTransport && (
                    <select
                      value={transportRoute}
                      onChange={(e) => setTransportRoute(Number(e.target.value))}
                      className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-xs text-slate-800 font-bold"
                    >
                      <option value={1500}>Zone A (Sector 11) - Rs. 1,500</option>
                      <option value={2500}>Zone B (North Karachi) - Rs. 2,500</option>
                    </select>
                  )}
                </div>
              </div>
            </div>

            {/* Estimated Calculation Breakdown Card */}
            <div className="bg-blue-50/80 border border-blue-200 p-8 rounded-3xl space-y-4">
              <h3 className="text-lg font-bold text-slate-800 border-b border-blue-200/80 pb-3 flex justify-between items-center">
                <span>Fee Summary</span>
                <span className="text-xs text-blue-600 font-mono font-bold">{selectedCourse?.classes}</span>
              </h3>

              <div className="space-y-3 text-sm">
                <div className="flex justify-between text-slate-600">
                  <span>Monthly Tuition Fee:</span>
                  <span className="font-bold text-slate-800 font-mono">Rs. {monthlyTuition.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>One-Time Admission Fee:</span>
                  <span className="font-bold text-slate-800 font-mono">Rs. {admissionFee.toLocaleString()}</span>
                </div>
                {includeTransport && (
                  <div className="flex justify-between text-slate-600">
                    <span>Monthly Transport Charge:</span>
                    <span className="font-bold text-slate-800 font-mono">Rs. {transportFee.toLocaleString()}</span>
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-blue-200/80 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600 font-medium">Recurring Monthly Fee:</span>
                  <span className="font-bold text-emerald-700 text-lg font-mono">Rs. {totalMonthly.toLocaleString()}/mo</span>
                </div>
                <div className="flex justify-between text-base">
                  <span className="font-bold text-slate-900">First Month Total (Inc. Admission):</span>
                  <span className="font-black text-blue-700 text-xl font-mono">Rs. {totalFirstMonth.toLocaleString()}</span>
                </div>
              </div>

              <Link
                href="/admissions"
                className="w-full mt-4 py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-500/30"
              >
                Apply Online Now <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
