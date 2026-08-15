import type { Metadata } from 'next';
import SectionHeader from '@/components/ui/SectionHeader';
import Link from 'next/link';
import { Quote, ArrowRight, Award, GraduationCap, Users } from 'lucide-react';

export const metadata: Metadata = {
  title: 'About Us | The Foundation Collegiate',
  description: 'Learn about The Foundation Collegiate — founded by Dr. Asif Iqbal, Ph.D. — providing premier Matriculation & Intermediate coaching in North Karachi.',
};

export default function AboutPage() {
  return (
    <div className="py-20 bg-[var(--background)] space-y-16">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-5xl">
        
        {/* Section 1: About Header */}
        <SectionHeader
          badge="Leadership & Legacy"
          title="About"
          titleHighlight="The Foundation Collegiate"
          description="North Karachi's premier coaching institute, founded and guided by Dr. Asif Iqbal, Ph.D., delivering quality education for over a decade."
          className="mb-12"
        />

        {/* Section 2: Main About College Overview */}
        <div className="bg-white rounded-3xl p-8 lg:p-12 shadow-sm border border-slate-200 mb-12 leading-relaxed text-slate-600 space-y-4 text-base">
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Empowering Students for Academic Perfection</h2>
          <p>
            Founded under the visionary leadership of <strong>Dr. Asif Iqbal, Ph.D.</strong>, <strong>The Foundation Collegiate (TFC)</strong> is dedicated to offering unparalleled academic mentorship for Matriculation (BSEK) and Intermediate (BIEK) students in North Karachi.
          </p>
          <p>
            With a multi-disciplinary faculty, weekly testing series, and continuous feedback loops, TFC equips students with conceptual clarity, exam strategies, and baseline preparation for competitive university entry tests (MDCAT &amp; ECAT).
          </p>
        </div>

        {/* Section 3: Principal's Message Teaser Card */}
        <div id="principal" className="clay-card rounded-3xl p-8 lg:p-12 bg-white mb-12 shadow-xl border border-slate-200 scroll-mt-28">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-4 flex flex-col items-center text-center">
              <div className="w-36 h-36 rounded-3xl bg-gradient-to-tr from-blue-600 to-indigo-700 text-white font-bold text-4xl flex items-center justify-center mb-4 shadow-xl border-4 border-white">
                AI
              </div>
              <h3 className="text-2xl font-bold text-slate-800">Dr. Asif Iqbal</h3>
              <p className="text-xs font-bold text-blue-600 uppercase tracking-widest mt-1">PhD, M.Phil, MBA (HR), M.Ed</p>
              <span className="mt-3 px-3.5 py-1 rounded-full bg-blue-50 text-blue-700 font-semibold text-xs border border-blue-200">
                Founder & Director
              </span>
            </div>

            <div className="lg:col-span-8 space-y-4 text-slate-600 leading-relaxed text-base">
              <div className="flex items-start gap-3">
                <Quote size={28} className="text-blue-500 shrink-0 mt-1" />
                <p className="italic font-medium text-slate-700 text-lg">
                  &quot;Quality education is not merely about passing examinations; it is about building intellectual discipline, conceptual clarity, and unshakeable confidence in every student.&quot;
                </p>
              </div>
              <p>
                Dr. Asif Iqbal personally guides the faculty and curriculum design at The Foundation Collegiate to ensure every student achieves their fullest potential.
              </p>
              <div className="pt-2">
                <Link
                  href="/about/principal"
                  className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-2.5 rounded-xl text-sm transition-all shadow-md shadow-blue-600/20"
                >
                  Read Full Principal Profile &amp; Message <ArrowRight size={16} />
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Section 4: Achievements Anchor */}
        <div id="achievers" className="scroll-mt-28">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-3xl p-10 text-white shadow-xl text-center">
            <h2 className="text-3xl font-bold mb-3">Celebrating Over 100+ Board Ranks</h2>
            <p className="text-blue-100 text-sm max-w-2xl mx-auto mb-6">Our students consistently excel in BSEK and BIEK Karachi board examinations.</p>
            <Link href="/gallery" className="inline-flex items-center gap-2 bg-white text-blue-600 px-8 py-3.5 rounded-xl font-bold text-sm shadow-md hover:bg-slate-50 transition-colors">
              Explore Achievements &amp; Photo Gallery <ArrowRight size={16} />
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}
