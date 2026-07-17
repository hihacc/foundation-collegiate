'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { ArrowRight, Phone } from 'lucide-react';
import Button from '@/components/ui/Button';

export default function CTASection() {
  return (
    <section className="py-20 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-primary to-blue-800" />
      
      {/* Decorative patterns */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-black/10 rounded-full blur-3xl translate-y-1/3 -translate-x-1/4 pointer-events-none" />
      
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="max-w-4xl mx-auto text-center"
        >
          <h2 className="text-3xl md:text-5xl font-display font-bold text-white mb-6">
            Ready to Secure Your Academic Future?
          </h2>
          <p className="text-lg md:text-xl text-white/80 mb-10 max-w-2xl mx-auto font-light">
            Join thousands of successful students who have trusted The Foundation Collegiate for their board exam preparation.
          </p>
          
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link href="/admissions">
              <Button size="lg" className="w-full sm:w-auto rounded-full bg-amber-500 hover:bg-amber-400 text-slate-900 font-bold px-8 shadow-xl shadow-amber-500/20 text-lg">
                Start Admission Process <ArrowRight size={20} />
              </Button>
            </Link>
            <a href="tel:+923333439458">
              <Button size="lg" variant="outline" className="w-full sm:w-auto rounded-full border-white/30 text-white hover:bg-white hover:text-slate-900 px-8 text-lg">
                <Phone size={20} /> Call Us Now
              </Button>
            </a>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
