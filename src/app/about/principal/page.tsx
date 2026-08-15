import type { Metadata } from 'next';
import SectionHeader from '@/components/ui/SectionHeader';
import Link from 'next/link';
import { Award, BookOpen, GraduationCap, Quote, ShieldCheck, ArrowLeft, Mail, Phone, Building } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Principal & Director Profile — Dr. Asif Iqbal | The Foundation Collegiate',
  description: 'Profile and message from Dr. Asif Iqbal — PhD, M.Phil, MBA (HR), M.Ed, MA (IR), MA (IS), B.Sc (Hons), IDCS, IAD — Founder & Director of The Foundation Collegiate.',
};

export default function PrincipalProfilePage() {
  const credentials = [
    'Ph.D. in Education & Science',
    'M.Phil in Educational Leadership',
    'MBA (Human Resource Management)',
    'M.Ed (Master of Education)',
    'M.A. (International Relations)',
    'M.A. (Islamic Studies)',
    'B.Sc (Honours)',
    'IDCS (International Diploma in Computer Studies)',
    'IAD (International Advanced Diploma)'
  ];

  return (
    <div className="py-20 bg-[var(--background)] space-y-16">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-5xl">
        <div className="mb-8">
          <Link 
            href="/about" 
            className="inline-flex items-center gap-2 text-sm font-bold text-blue-600 hover:text-blue-700 transition-colors"
          >
            <ArrowLeft size={16} /> Back to About Us
          </Link>
        </div>

        <SectionHeader
          badge="Executive Leadership"
          title="Director's"
          titleHighlight="Profile & Vision"
          description="Meet Dr. Asif Iqbal — Founder, Director, and Principal mentor driving academic perfection at The Foundation Collegiate."
          className="mb-16"
        />

        {/* Profile Card Header */}
        <div className="bg-white rounded-3xl p-8 lg:p-12 shadow-xl border border-slate-200 mb-12">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            
            <div className="lg:col-span-5 flex flex-col items-center text-center">
              <div className="w-44 h-44 rounded-3xl bg-gradient-to-tr from-blue-600 to-indigo-700 text-white font-bold text-5xl flex items-center justify-center mb-6 shadow-xl border-4 border-white">
                AI
              </div>
              <h1 className="text-3xl font-bold text-slate-800">Dr. Asif Iqbal</h1>
              <p className="text-xs font-bold text-blue-600 uppercase tracking-widest mt-1">Founder & Director</p>
              <span className="mt-3 px-4 py-1.5 rounded-full bg-blue-50 text-blue-700 font-semibold text-xs border border-blue-200">
                Principal, The Foundation Collegiate
              </span>
            </div>

            <div className="lg:col-span-7 space-y-6">
              <div className="bg-blue-50/70 border border-blue-100 rounded-2xl p-6 relative">
                <Quote size={28} className="text-blue-500 mb-2" />
                <p className="italic font-medium text-slate-800 text-lg leading-relaxed">
                  &quot;Quality education is not merely about passing examinations; it is about building intellectual discipline, conceptual clarity, and unshakeable confidence in every student.&quot;
                </p>
              </div>

              <div>
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-3">Academic Qualifications & Credentials</h3>
                <div className="flex flex-wrap gap-2">
                  {credentials.map((cred, idx) => (
                    <span key={idx} className="bg-slate-100 border border-slate-200 text-slate-700 text-xs font-semibold px-3 py-1.5 rounded-xl">
                      {cred}
                    </span>
                  ))}
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Detailed Message & Legacy */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
          <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm space-y-4 text-slate-600 leading-relaxed text-sm sm:text-base">
            <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2 mb-4">
              <GraduationCap className="text-blue-600" /> Educational Leadership & Philosophy
            </h3>
            <p>
              With over two decades of experience in higher education management, curriculum synthesis, and academic mentorship, <strong>Dr. Asif Iqbal</strong> established The Foundation Collegiate to set a new benchmark in North Karachi for Matriculation &amp; Intermediate coaching.
            </p>
            <p>
              His multi-disciplinary academic background spanning Physics, Education, International Relations, and Human Resource Management enables him to craft customized learning strategies that cater to diverse student aptitudes.
            </p>
          </div>

          <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm space-y-4 text-slate-600 leading-relaxed text-sm sm:text-base">
            <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2 mb-4">
              <ShieldCheck className="text-emerald-600" /> Commitment to Student Ranks
            </h3>
            <p>
              Under his guidance, TFC students consistently secure top board positions across BSEK (Matriculation Science &amp; Computer) and BIEK (FSc Pre-Medical, Pre-Engineering, Computer Science, and Commerce).
            </p>
            <p>
              Dr. Asif Iqbal personally oversees the weekly testing series, faculty evaluation, and baseline MDCAT/ECAT orientation modules to ensure zero compromise on teaching quality.
            </p>
          </div>
        </div>

        {/* Action CTA */}
        <div className="bg-blue-600 rounded-3xl p-10 text-center text-white shadow-xl">
          <h3 className="text-2xl font-bold mb-3">Join The Foundation Collegiate</h3>
          <p className="text-blue-100 text-sm mb-6 max-w-xl mx-auto">Admissions are currently open for the upcoming academic session. Experience dedicated mentorship and top rank coaching.</p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/admissions" className="bg-white text-blue-600 px-8 py-3.5 rounded-xl font-bold text-sm shadow-md hover:bg-slate-50 transition-colors">
              Apply for Admission
            </Link>
            <Link href="/contact" className="bg-blue-700 text-white border border-blue-400/40 px-8 py-3.5 rounded-xl font-bold text-sm hover:bg-blue-800 transition-colors">
              Schedule Counseling Meeting
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}
