'use client';

import { m } from 'framer-motion';
import { FileText, ArrowRight, CheckCircle2, GraduationCap } from 'lucide-react';
import Link from 'next/link';
import Button from '@/components/ui/Button';

export default function AdmissionsBanner() {
  return (
    <section className="py-24 bg-[#fafbff] relative overflow-hidden">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="bg-white border border-blue-100 rounded-[3rem] p-8 md:p-16 relative overflow-hidden shadow-xl">
          {/* Abstract Backgrounds */}
          <div className="absolute top-0 right-0 w-full h-full bg-grid-pattern opacity-[0.03] pointer-events-none" />
          <div className="absolute -top-32 -right-32 w-96 h-96 bg-blue-100 rounded-full blur-[100px] opacity-60 pointer-events-none mix-blend-multiply" />
          <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-amber-50 rounded-full blur-[100px] opacity-60 pointer-events-none mix-blend-multiply" />

          <div className="relative z-10 flex flex-col lg:flex-row items-center gap-12 lg:gap-20">
            {/* Left Content */}
            <m.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="lg:w-1/2 space-y-6"
            >
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-sm font-bold uppercase tracking-wider">
                <span className="w-2 h-2 rounded-full bg-blue-600 animate-ping" />
                Admissions 2026
              </div>
              <h2 className="text-4xl md:text-5xl font-display font-bold text-slate-900 leading-tight">
                Your Journey to <br className="hidden md:block" />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-700 to-indigo-600">Brilliance</span> Starts Here.
              </h2>
              <p className="text-slate-600 text-lg leading-relaxed max-w-xl font-medium">
                The Foundation Collegiate is now accepting applications for the 2026 academic year. Secure your place at an institute that guarantees results and character development.
              </p>
              
              <ul className="space-y-3 pt-2">
                {['100% Merit-Based Scholarships available.', 'Simple 3-step online registration.', 'Expert career counseling included.'].map((item, idx) => (
                  <li key={idx} className="flex items-center gap-3 text-slate-700 font-medium">
                    <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>

              <div className="pt-6 flex flex-wrap gap-4">
                <Link href="/admissions">
                  <Button className="bg-[#D72638] hover:bg-[#b01e2c] text-white border-none shadow-[0_8px_25px_rgba(215,38,56,0.4)] hover:shadow-[0_12px_30px_rgba(215,38,56,0.5)] hover:-translate-y-1 transition-all duration-300 rounded-full px-8 py-6 h-auto font-bold text-lg gap-2 group w-full sm:w-auto">
                    Apply Online Now
                    <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
              </div>
            </m.div>

            {/* Right Cards */}
            <m.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="lg:w-1/2 w-full flex flex-col gap-6 relative"
            >
              <div className="absolute inset-0 bg-gradient-to-tr from-blue-100/50 to-transparent blur-2xl rounded-full -z-10" />
              
              {/* Card 1 */}
              <div className="bg-white border border-slate-200 p-6 sm:p-8 rounded-3xl shadow-lg hover:-translate-y-2 transition-transform duration-300">
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-blue-100 flex items-center justify-center shrink-0 shadow-sm">
                    <FileText size={28} className="text-blue-700" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-900 mb-2">Admission Guidelines</h3>
                    <p className="text-slate-600 text-sm leading-relaxed mb-4">
                      Review our eligibility criteria, required documents (B-Form, Marksheets), and fee structure before applying.
                    </p>
                    <a href="/admissions" className="text-blue-600 hover:text-blue-700 font-bold text-sm flex items-center gap-1 transition-colors group">
                      Read Guidelines <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                    </a>
                  </div>
                </div>
              </div>

              {/* Card 2 */}
              <div className="bg-white border border-slate-200 p-6 sm:p-8 rounded-3xl shadow-lg hover:-translate-y-2 transition-transform duration-300 ml-0 sm:ml-8">
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-rose-100 flex items-center justify-center shrink-0 shadow-sm">
                    <GraduationCap size={28} className="text-rose-700" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-900 mb-2">Scholarships Program</h3>
                    <p className="text-slate-600 text-sm leading-relaxed mb-4">
                      We offer up to 100% tuition fee waivers for top-performing students and financial assistance for deserving candidates.
                    </p>
                    <a href="/admissions" className="text-blue-600 hover:text-blue-700 font-bold text-sm flex items-center gap-1 transition-colors group">
                      View Scholarships <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                    </a>
                  </div>
                </div>
              </div>
            </m.div>
          </div>
        </div>
      </div>
    </section>
  );
}
