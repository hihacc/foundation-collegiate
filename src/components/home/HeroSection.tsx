"use client";
import { m, LazyMotion, domAnimation } from 'framer-motion';
import { ArrowRight, BookOpen, GraduationCap } from 'lucide-react';
import Link from 'next/link';
import type { HeroData } from '@/types';
import Button from '@/components/ui/Button';

export default function HeroSection({ heroData }: { heroData: HeroData }) {
  const year = heroData?.admissions_year || '2026';
  const admissionsOpen = heroData?.admissions_open !== 'false';
  const tagline = heroData?.site_tagline || "We Know and Deliver What Quality Education Means. Foundation Collegiate is North Karachi's premier coaching institute, dedicated to shaping futures through expert Matriculation & Intermediate tutoring.";

  return (
    <LazyMotion features={domAnimation}>
      <section className="relative min-h-[90vh] lg:min-h-screen w-full flex items-center justify-center pt-28 pb-20 px-4 sm:px-6 lg:px-8 overflow-hidden bg-[#F8FAFC]">
        {/* Soft Background Gradients */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-blue-100/50 rounded-full blur-[100px]" />
          <div className="absolute bottom-[-10%] right-[-5%] w-[600px] h-[600px] bg-indigo-100/40 rounded-full blur-[120px]" />
        </div>

        <div className="container mx-auto max-w-7xl w-full flex flex-col items-center justify-center text-center relative z-10">
          <m.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full bg-white border border-blue-100 shadow-sm mb-8 text-[#1E3A8A] font-bold text-sm tracking-wide mx-auto"
          >
            <GraduationCap className="w-5 h-5 text-[#2563EB] shrink-0" />
            <span>{admissionsOpen ? `Admissions Open for ${year}` : `Academic Session ${year}`}</span>
          </m.div>

          <m.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1, ease: "easeOut" }}
            className="text-4xl sm:text-6xl lg:text-7xl font-bold mb-6 tracking-tight leading-[1.15] text-[#0F172A] text-center max-w-5xl mx-auto"
          >
            Excellence in <br className="hidden sm:inline" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#2563EB] to-[#1E3A8A]">Education</span> &amp; Character
          </m.h1>

          <m.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2, ease: "easeOut" }}
            className="text-base sm:text-xl text-slate-600 mb-10 max-w-3xl mx-auto font-medium leading-relaxed text-center"
          >
            {tagline}
          </m.p>

          <m.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3, ease: "easeOut" }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6 w-full max-w-md sm:max-w-xl mx-auto mb-16"
          >
            <Link href="/admissions" className="w-full sm:w-1/2">
              <button className="w-full bg-[#2563EB] hover:bg-[#1E3A8A] text-white px-8 py-4 rounded-full font-bold text-lg flex items-center justify-center gap-2 group transition-all duration-300 shadow-lg shadow-blue-600/20 hover:shadow-xl hover:shadow-blue-600/30 hover:-translate-y-0.5">
                Enroll Now
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform shrink-0" />
              </button>
            </Link>
            <Link href="/courses" className="w-full sm:w-1/2">
              <button className="w-full bg-white text-[#0F172A] hover:text-[#2563EB] border border-slate-200 hover:border-[#2563EB] px-8 py-4 rounded-full font-bold text-lg flex items-center justify-center gap-2 transition-all duration-300 shadow-sm hover:shadow-md hover:-translate-y-0.5">
                <BookOpen className="w-5 h-5 shrink-0" />
                Explore Programs
              </button>
            </Link>
          </m.div>
        </div>
      </section>
    </LazyMotion>
  );
}
