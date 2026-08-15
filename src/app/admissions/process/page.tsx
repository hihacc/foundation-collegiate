import { Metadata } from 'next';
import Link from 'next/link';
import SectionHeader from '@/components/ui/SectionHeader';
import { ClipboardList, UserCheck, FileText, CheckCircle2, ArrowRight, ShieldCheck, FileCheck } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Admission Process | The Foundation Collegiate',
  description: 'Step-by-step guide to applying for admission at The Foundation Collegiate.',
};

export default function AdmissionProcessPage() {
  const steps = [
    {
      id: 1,
      title: 'Submit Application Form',
      description: 'Fill out the online admission form completely with accurate details about the student and parents.',
      icon: <ClipboardList size={32} className="text-blue-600" />
    },
    {
      id: 2,
      title: 'Document Verification',
      description: 'Provide necessary documents including previous marksheets, B-Form/CNIC, and photographs.',
      icon: <FileText size={32} className="text-blue-600" />
    },
    {
      id: 3,
      title: 'Interview / Assessment',
      description: 'The student will undergo a brief interview or baseline assessment test depending on the class level.',
      icon: <UserCheck size={32} className="text-blue-600" />
    },
    {
      id: 4,
      title: 'Fee Submission & Enrollment',
      description: 'Upon approval, submit the admission and first month tuition fee to finalize enrollment.',
      icon: <CheckCircle2 size={32} className="text-blue-600" />
    }
  ];

  return (
    <div className="py-20 bg-[var(--background)] space-y-16">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-5xl">
        <SectionHeader
          badge="Admissions 2026"
          title="Admission"
          titleHighlight="Process & Requirements"
          description="Joining The Foundation Collegiate is simple and transparent. Follow these steps to secure your admission."
          className="mb-16"
        />

        {/* Steps Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
          {steps.map((step) => (
            <div key={step.id} className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm hover:shadow-lg transition-all flex gap-6">
              <div className="shrink-0 w-16 h-16 rounded-2xl bg-blue-50 flex items-center justify-center font-black text-blue-600">
                {step.icon}
              </div>
              <div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-1">Step {step.id}</span>
                <h3 className="text-xl font-bold text-slate-800 mb-3">{step.title}</h3>
                <p className="text-slate-600 text-sm leading-relaxed">{step.description}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Eligibility Criteria */}
        <div id="eligibility" className="bg-white rounded-3xl p-8 sm:p-10 border border-slate-200 shadow-sm scroll-mt-28 mb-12">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-blue-50 text-blue-700 font-bold text-xs uppercase tracking-wider mb-4 border border-blue-100">
            <ShieldCheck size={16} /> Academic Standards
          </div>
          <h3 className="text-2xl font-bold text-slate-800 mb-4">Eligibility Criteria</h3>
          <ul className="space-y-3 text-slate-600 text-sm leading-relaxed">
            <li className="flex items-start gap-3">
              <CheckCircle2 size={18} className="text-emerald-500 shrink-0 mt-0.5" />
              <span><strong>Matriculation (IX & X):</strong> Minimum 60% marks in Class 8th or previous board examinations.</span>
            </li>
            <li className="flex items-start gap-3">
              <CheckCircle2 size={18} className="text-emerald-500 shrink-0 mt-0.5" />
              <span><strong>FSc Pre-Medical & Pre-Engineering (XI & XII):</strong> Minimum 65% marks in Matriculation Science.</span>
            </li>
            <li className="flex items-start gap-3">
              <CheckCircle2 size={18} className="text-emerald-500 shrink-0 mt-0.5" />
              <span><strong>Computer Science & Commerce (XI & XII):</strong> Minimum 55% marks in Matriculation.</span>
            </li>
            <li className="flex items-start gap-3">
              <CheckCircle2 size={18} className="text-emerald-500 shrink-0 mt-0.5" />
              <span><strong>IT Diplomas & Short Courses:</strong> Open to Matric and Intermediate passed candidates.</span>
            </li>
          </ul>
        </div>

        {/* Required Documents */}
        <div id="documents" className="bg-white rounded-3xl p-8 sm:p-10 border border-slate-200 shadow-sm scroll-mt-28 mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-amber-50 text-amber-700 font-bold text-xs uppercase tracking-wider mb-4 border border-amber-100">
            <FileCheck size={16} /> Checklist
          </div>
          <h3 className="text-2xl font-bold text-slate-800 mb-4">Required Documents for Registration</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-slate-600 text-sm">
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-center gap-3">
              <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0" />
              <span>Attested Copy of Previous Marksheet / Result Card</span>
            </div>
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-center gap-3">
              <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0" />
              <span>Copy of Student B-Form / CNIC</span>
            </div>
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-center gap-3">
              <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0" />
              <span>Copy of Father / Guardian CNIC</span>
            </div>
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-center gap-3">
              <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0" />
              <span>4 Passport-size Recent Photographs (Blue Background)</span>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="bg-blue-600 rounded-3xl p-10 text-center text-white shadow-xl">
          <h2 className="text-2xl font-bold mb-4">Ready to start your journey?</h2>
          <p className="text-blue-100 mb-8 max-w-2xl mx-auto">
            Our admissions are currently open for the 2026 academic session. Secure your seat today.
          </p>
          <Link 
            href="/admissions" 
            className="inline-flex items-center gap-2 bg-white text-blue-600 px-8 py-4 rounded-xl font-bold hover:bg-slate-50 transition-colors shadow-lg"
          >
            Apply Online Now <ArrowRight size={18} />
          </Link>
        </div>
      </div>
    </div>
  );
}
