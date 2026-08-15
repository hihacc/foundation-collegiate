'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import SectionHeader from '@/components/ui/SectionHeader';
import { UserCog, BookOpen, Mail, Phone, Award, Loader2, Users, Briefcase } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';

const defaultTeachers = [
  { id: '1', name: 'Dr. Asif Iqbal', designation: 'Managing Director & Senior Physics Faculty', qualification: 'Ph.D. in Physics & Education', department: 'Physics', experience: '15+ Years', staff_type: 'faculty' },
  { id: '2', name: 'Prof. Muhammad Kamran', designation: 'Head of Chemistry Department', qualification: 'M.Sc. Organic Chemistry', department: 'Chemistry', experience: '12+ Years', staff_type: 'faculty' },
  { id: '3', name: 'Prof. Shahzaib Khan', designation: 'Senior Mathematics Lecturer', qualification: 'M.Sc. Applied Mathematics', department: 'Mathematics', experience: '10+ Years', staff_type: 'faculty' },
  { id: '4', name: 'Dr. Fatima Tariq', designation: 'Biology & MDCAT Specialist', qualification: 'MBBS / Senior Lecturer', department: 'Biology', experience: '8+ Years', staff_type: 'faculty' },
  { id: '5', name: 'Engr. Bilal Ahmed', designation: 'Computer Science & DIT Lead', qualification: 'BS Computer Engineering', department: 'Computer Science', experience: '9+ Years', staff_type: 'faculty' },
  { id: '6', name: 'Prof. Tariq Mahmood', designation: 'Senior English & Humanities Lecturer', qualification: 'M.A. English Literature', department: 'English', experience: '14+ Years', staff_type: 'faculty' },
  { id: '7', name: 'Muhammad Usman', designation: 'Senior Accounts & Admissions Officer', qualification: 'M.Com Finance', department: 'Administration', experience: '7+ Years', staff_type: 'staff' },
  { id: '8', name: 'Saima Raza', designation: 'Student Services Coordinator', qualification: 'B.A. Mass Communication', department: 'Student Affairs', experience: '5+ Years', staff_type: 'staff' }
];

function TeachersContent() {
  const searchParams = useSearchParams();
  const initialType = searchParams.get('type') === 'staff' ? 'staff' : 'faculty';
  
  const [activeTab, setActiveTab] = useState<'faculty' | 'staff'>(initialType);
  const [teachers, setTeachers] = useState<any[]>(defaultTeachers);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const typeParam = searchParams.get('type');
    if (typeParam === 'staff' || typeParam === 'faculty') {
      setActiveTab(typeParam);
    }
  }, [searchParams]);

  useEffect(() => {
    let isMounted = true;
    const fetchTeachers = async () => {
      try {
        const { data, error } = await supabase.from('teachers').select('*').order('created_at', { ascending: true });
        if (isMounted && !error && data && data.length > 0) {
          setTeachers(data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchTeachers();
    return () => { isMounted = false; };
  }, []);

  const filteredTeachers = teachers.filter(t => (t.staff_type || 'faculty').toLowerCase() === activeTab);

  return (
    <div className="py-20 bg-[var(--background)]">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
        <SectionHeader
          badge="Distinguished Educators & Administration"
          title="Our Faculty &"
          titleHighlight="Institutional Staff"
          description="Meet the highly qualified professors, lecturers, and administrative staff dedicated to serving students at The Foundation Collegiate."
          className="mb-12"
        />

        {/* Tab Filters */}
        <div className="flex justify-center gap-3 mb-12">
          <button
            onClick={() => setActiveTab('faculty')}
            className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-bold text-sm transition-all ${
              activeTab === 'faculty'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/25'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <Users size={18} /> Teaching Faculty
          </button>
          <button
            onClick={() => setActiveTab('staff')}
            className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-bold text-sm transition-all ${
              activeTab === 'staff'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/25'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <Briefcase size={18} /> Administrative Staff
          </button>
        </div>

        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin mb-4 text-blue-600" />
            <p className="text-sm font-semibold">Loading team profiles...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredTeachers.map((teacher) => (
              <div key={teacher.id} className="bg-white rounded-3xl p-8 border border-slate-200 shadow-md hover:shadow-xl transition-all flex flex-col justify-between group">
                <div>
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-700 text-white font-bold text-xl flex items-center justify-center shadow-lg shrink-0 group-hover:scale-105 transition-transform">
                      {teacher.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-slate-800 leading-tight">{teacher.name}</h3>
                      <p className="text-xs font-bold text-blue-600 mt-1">{teacher.designation}</p>
                    </div>
                  </div>

                  <div className="space-y-3 text-xs border-t border-slate-100 pt-4">
                    <div className="flex items-center gap-2 text-slate-600">
                      <Award size={16} className="text-amber-500 shrink-0" />
                      <span className="font-semibold">{teacher.qualification || 'Qualified Professional'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-600">
                      <BookOpen size={16} className="text-blue-500 shrink-0" />
                      <span>Department: <strong>{teacher.department || 'Academic Division'}</strong></span>
                    </div>
                    {teacher.experience && (
                      <div className="flex items-center gap-2 text-slate-600">
                        <UserCog size={16} className="text-emerald-500 shrink-0" />
                        <span>Experience: <strong>{teacher.experience}</strong></span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
                  <span className="font-bold text-slate-500 uppercase tracking-wider text-[10px]">
                    {activeTab === 'faculty' ? 'Board Examiner & Mentor' : 'TFC Staff Member'}
                  </span>
                  <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 font-bold text-[10px]">
                    {activeTab === 'faculty' ? 'Verified Faculty' : 'Official Staff'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function TeachersPage() {
  return (
    <Suspense fallback={
      <div className="py-20 flex flex-col items-center justify-center text-slate-400">
        <Loader2 className="w-8 h-8 animate-spin mb-4 text-blue-600" />
        <p className="text-sm font-semibold">Loading team profiles...</p>
      </div>
    }>
      <TeachersContent />
    </Suspense>
  );
}
