import type { Metadata } from 'next';
import SectionHeader from '@/components/ui/SectionHeader';
import Link from 'next/link';
import { GraduationCap, Target, Users, MapPin, Phone, Mail } from 'lucide-react';

export const metadata: Metadata = {
  title: 'About Us',
  description: 'Learn about The Foundation Collegiate — our mission, vision, history, and commitment to quality education in North Karachi.',
};

export default function AboutPage() {
  return (
    <div className="py-20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl">
        <SectionHeader
          badge="About"
          title="About"
          titleHighlight="The Foundation"
          description="North Karachi's most trusted coaching institute, delivering quality education since its founding."
          className="mb-16"
        />

        {/* Story */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mb-20">
          <div>
            <h2 className="text-3xl font-display font-bold mb-6">Our Story</h2>
            <div className="space-y-4 text-muted leading-relaxed text-lg">
              <p>
                The Foundation Collegiate was established with a singular mission: to provide students in North Karachi with access to the highest quality coaching and academic guidance.
              </p>
              <p>
                We believe every student has the potential to excel, and our role is to unlock that potential through structured learning, conceptual teaching, and regular assessment.
              </p>
              <p>
                Our institute has consistently produced top scorers in the Karachi and Federal Board exams, with hundreds of students achieving A-1 grades every year.
              </p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {[
              { icon: GraduationCap, label: '1500+ Students Taught', color: 'blue' },
              { icon: Target, label: '98% Success Rate', color: 'gold' },
              { icon: Users, label: '12+ Expert Teachers', color: 'green' },
              { icon: GraduationCap, label: '50+ Board Positions', color: 'purple' },
            ].map((item, idx) => (
              <div key={idx} className={`glass-card rounded-2xl p-6 text-center hover:-translate-y-1 transition-transform`}>
                <div className={`w-12 h-12 mx-auto rounded-xl mb-3 flex items-center justify-center
                  ${item.color === 'blue' ? 'bg-blue-100 text-blue-600' :
                    item.color === 'gold' ? 'bg-amber-100 text-amber-600' :
                    item.color === 'green' ? 'bg-emerald-100 text-emerald-600' :
                    'bg-purple-100 text-purple-600'}`}
                >
                  <item.icon size={24} />
                </div>
                <p className="font-bold text-sm">{item.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Mission & Vision */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-20">
          <div className="bg-primary/5 border-2 border-primary/20 rounded-3xl p-8">
            <div className="w-12 h-12 bg-primary text-white rounded-xl flex items-center justify-center mb-4">
              <Target size={24} />
            </div>
            <h3 className="text-2xl font-bold mb-4">Our Mission</h3>
            <p className="text-muted leading-relaxed text-lg">
              To empower students with quality education, strong conceptual foundations, and the confidence to achieve their academic goals and succeed in their future careers.
            </p>
          </div>
          <div className="bg-amber-500/5 border-2 border-amber-500/20 rounded-3xl p-8">
            <div className="w-12 h-12 bg-amber-500 text-white rounded-xl flex items-center justify-center mb-4">
              <GraduationCap size={24} />
            </div>
            <h3 className="text-2xl font-bold mb-4">Our Vision</h3>
            <p className="text-muted leading-relaxed text-lg">
              To be the leading coaching institute in Karachi, renowned for producing top board performers, nurturing critical thinkers, and building the leaders of tomorrow.
            </p>
          </div>
        </div>

        {/* Contact CTA */}
        <div className="bg-[#0a1128] text-white rounded-3xl p-10 text-center">
          <h3 className="text-3xl font-bold mb-4">Come Visit Us</h3>
          <div className="flex flex-wrap justify-center gap-8 mb-8">
            <div className="flex items-center gap-2 text-white/70">
              <MapPin size={18} className="text-amber-400" />
              <span>House #1704, Sector 11-E, Muslim Town, North Karachi</span>
            </div>
            <div className="flex items-center gap-2 text-white/70">
              <Phone size={18} className="text-amber-400" />
              <a href="tel:+923333439458" className="hover:text-white transition-colors">0333-3439458</a>
            </div>
            <div className="flex items-center gap-2 text-white/70">
              <Mail size={18} className="text-amber-400" />
              <a href="mailto:foundationcollegiate@gmail.com" className="hover:text-white transition-colors">foundationcollegiate@gmail.com</a>
            </div>
          </div>
          <Link href="/admissions" className="inline-flex items-center gap-2 bg-amber-500 text-slate-900 font-bold px-8 py-3.5 rounded-full hover:bg-amber-400 transition-colors shadow-xl text-lg">
            Apply Now for 2026
          </Link>
        </div>

      </div>
    </div>
  );
}
