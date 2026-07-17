'use client';

import { motion, Variants } from 'framer-motion';
import Link from 'next/link';
import { ArrowRight, BookOpen, Download, Search, GraduationCap } from 'lucide-react';
import ParticleBackground from '@/components/ui/ParticleBackground';
import Button from '@/components/ui/Button';

export default function HeroSection() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100, damping: 20 } },
  };

  return (
    <section className="relative min-h-[100vh] flex items-center justify-center overflow-hidden bg-[#001B4D] pt-20">
      {/* Background Elements */}
      <ParticleBackground />
      
      {/* Gradient Orbs */}
      <div className="absolute top-1/4 -left-64 w-[500px] h-[500px] bg-[#0057FF]/30 rounded-full blur-[120px] pointer-events-none mix-blend-screen" />
      <div className="absolute bottom-1/4 -right-64 w-[600px] h-[600px] bg-[#FFD700]/10 rounded-full blur-[150px] pointer-events-none mix-blend-screen" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-gradient-to-b from-transparent via-[#001B4D]/50 to-[#001B4D] pointer-events-none z-0" />

      {/* Grid Pattern */}
      <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] opacity-[0.03] z-0" />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10 py-12 lg:py-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          
          {/* Left Content */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="lg:col-span-7 text-left space-y-8"
          >
            {/* Admissions Banner */}
            <motion.div variants={itemVariants} className="inline-block">
              <Link href="/admissions">
                <div className="group relative inline-flex items-center gap-3 px-5 py-2.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-md hover:bg-white/10 transition-all duration-300 shadow-[0_0_20px_rgba(255,215,0,0.1)] hover:shadow-[0_0_30px_rgba(255,215,0,0.2)] hover:-translate-y-0.5">
                  <span className="flex h-2.5 w-2.5 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#FFD700] opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#FFD700]"></span>
                  </span>
                  <span className="text-[#FFD700] font-semibold tracking-wide text-sm uppercase">Admissions Open 2026</span>
                  <ArrowRight size={14} className="text-[#FFD700] group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>
            </motion.div>

            {/* Main Headline */}
            <motion.div variants={itemVariants} className="space-y-4 relative">
              <h1 className="text-5xl sm:text-6xl lg:text-7xl xl:text-8xl font-display font-extrabold tracking-tight text-white leading-[1.1]">
                Empowering <br className="hidden sm:block" />
                <span className="relative inline-block text-transparent bg-clip-text bg-gradient-to-r from-white via-white to-white/70">
                  Future Leaders
                </span>
              </h1>
              <h2 className="text-2xl sm:text-3xl font-display font-bold text-[#FFD700] tracking-wide mt-2">
                A Legacy of Excellence in Education.
              </h2>
            </motion.div>

            {/* Subtitle */}
            <motion.p
              variants={itemVariants}
              className="text-lg sm:text-xl text-white/70 max-w-2xl leading-relaxed font-medium"
            >
              Join the premier international educational institute. We don&apos;t just teach; we ignite minds, build character, and guarantee academic superiority.
            </motion.p>

            {/* CTA Buttons */}
            <motion.div
              variants={itemVariants}
              className="flex flex-wrap items-center gap-4 pt-4"
            >
              <Link href="/admissions">
                <Button size="lg" className="bg-[#D72638] hover:bg-[#b01e2c] text-white border-none shadow-[0_8px_25px_rgba(215,38,56,0.3)] hover:shadow-[0_12px_30px_rgba(215,38,56,0.4)] hover:-translate-y-1 transition-all duration-300 rounded-full px-8 py-7 h-auto font-bold text-lg gap-2 group w-full sm:w-auto">
                  Apply Now
                  <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>

              <Link href="/courses">
                <Button size="lg" variant="outline" className="bg-white/5 backdrop-blur-md border border-white/20 hover:bg-white/10 text-white rounded-full px-8 py-7 h-auto font-semibold gap-2 transition-all duration-300 hover:-translate-y-1 w-full sm:w-auto">
                  <BookOpen size={20} className="text-[#FFD700]" />
                  Explore Courses
                </Button>
              </Link>
            </motion.div>

            <motion.div variants={itemVariants} className="flex flex-wrap items-center gap-4 pt-2">
              <Link href="/results">
                <Button size="md" variant="ghost" className="text-white/80 hover:text-white hover:bg-white/5 rounded-full px-6 font-medium gap-2 transition-all duration-300">
                  <Search size={16} className="text-[#0057FF]" />
                  Check Results
                </Button>
              </Link>

              <Link href="/downloads">
                <Button size="default" variant="ghost" className="text-white/80 hover:text-white hover:bg-white/5 rounded-full px-6 font-medium gap-2 transition-all duration-300">
                  <Download size={16} className="text-[#0057FF]" />
                  Download Prospectus
                </Button>
              </Link>
            </motion.div>
          </motion.div>

          {/* Right Content - Abstract Premium Illustration */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, rotate: -5 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            transition={{ duration: 1, ease: "easeOut", delay: 0.3 }}
            className="lg:col-span-5 hidden lg:block relative"
          >
            <div className="relative w-full aspect-square max-w-[600px] mx-auto">
              {/* Outer Glowing Ring */}
              <motion.div 
                animate={{ rotate: 360 }}
                transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
                className="absolute inset-0 rounded-full border border-white/10 border-dashed"
              />
              
              {/* Inner Glowing Ring */}
              <motion.div 
                animate={{ rotate: -360 }}
                transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
                className="absolute inset-8 rounded-full border-2 border-[#0057FF]/30"
              />

              {/* Core Element */}
              <motion.div 
                animate={{ y: [-15, 15, -15] }}
                transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                className="absolute inset-0 flex items-center justify-center"
              >
                <div className="relative w-64 h-64 bg-gradient-to-tr from-[#0057FF] to-[#001B4D] rounded-[2rem] rotate-12 shadow-[0_20px_50px_rgba(0,87,255,0.4)] flex items-center justify-center overflow-hidden border border-white/20 backdrop-blur-xl">
                  {/* Glass overlay */}
                  <div className="absolute inset-0 bg-white/10 backdrop-blur-3xl" />
                  <GraduationCap size={100} className="text-white relative z-10 drop-shadow-2xl" strokeWidth={1.5} />
                  
                  {/* Floating particles inside */}
                  <div className="absolute top-10 left-10 w-2 h-2 rounded-full bg-[#FFD700] animate-ping" />
                  <div className="absolute bottom-10 right-10 w-3 h-3 rounded-full bg-white animate-pulse" />
                </div>
              </motion.div>

              {/* Floating Stat Card */}
              <motion.div 
                animate={{ y: [10, -10, 10], x: [-5, 5, -5] }}
                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                className="absolute bottom-10 -left-10 bg-[#0a0f1e]/80 backdrop-blur-xl border border-white/10 p-5 rounded-2xl shadow-2xl flex items-center gap-4"
              >
                <div className="w-12 h-12 rounded-xl bg-[#D72638]/20 flex items-center justify-center text-[#D72638]">
                  <span className="font-bold text-xl">A+</span>
                </div>
                <div>
                  <div className="text-white font-bold text-xl">100%</div>
                  <div className="text-white/50 text-sm font-medium">Success Rate</div>
                </div>
              </motion.div>

              {/* Floating Stat Card 2 */}
              <motion.div 
                animate={{ y: [-10, 10, -10], x: [5, -5, 5] }}
                transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
                className="absolute top-20 -right-5 bg-[#0a0f1e]/80 backdrop-blur-xl border border-white/10 p-4 rounded-2xl shadow-2xl flex items-center gap-3"
              >
                <div className="w-10 h-10 rounded-full bg-[#FFD700]/20 flex items-center justify-center">
                  <div className="w-3 h-3 bg-[#FFD700] rounded-full animate-pulse" />
                </div>
                <div>
                  <div className="text-white font-bold text-lg">5000+</div>
                  <div className="text-white/50 text-xs font-medium">Enrolled</div>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
