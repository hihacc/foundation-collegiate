'use client';

import { useState } from 'react';
import { m } from 'framer-motion';
import Link from 'next/link';
import { ArrowRight, Phone, Mail, CheckCircle2 } from 'lucide-react';
import Button from '@/components/ui/Button';

export default function CTASection() {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      // Simulate API call
      setTimeout(() => {
        setSubscribed(true);
        setEmail('');
      }, 800);
    }
  };

  return (
    <section className="py-24 relative overflow-hidden bg-blue-50/50">
      
      {/* Decorative patterns */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-white rounded-full blur-3xl -translate-y-1/2 translate-x-1/4 pointer-events-none mix-blend-overlay" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-blue-100/50 rounded-full blur-3xl translate-y-1/3 -translate-x-1/4 pointer-events-none" />
      <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] opacity-[0.02] pointer-events-none" />
      
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          
          {/* Left Side: Main CTA */}
          <m.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-left"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-100 border border-blue-200 text-blue-700 text-sm font-semibold mb-6">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-blue-500"></span>
              </span>
              Admissions Open 2026
            </div>
            
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-display font-extrabold text-slate-900 mb-6 leading-tight">
              Ready to Secure Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-700 to-indigo-600">Academic Future?</span>
            </h2>
            <p className="text-lg md:text-xl text-slate-600 mb-10 max-w-xl font-medium leading-relaxed">
              Join thousands of successful students who have trusted The Foundation Collegiate for their board exam preparation.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/admissions">
                <Button size="lg" className="w-full sm:w-auto rounded-full bg-blue-600 hover:bg-blue-700 text-white font-bold px-8 py-6 h-auto shadow-lg hover:shadow-xl transition-all hover:-translate-y-1 text-lg group">
                  Start Admission <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <a href="tel:+923333439458">
                <Button size="lg" variant="outline" className="w-full sm:w-auto rounded-full border-blue-200 text-blue-700 hover:bg-blue-50 px-8 py-6 h-auto text-lg backdrop-blur-sm transition-all hover:-translate-y-1">
                  <Phone size={20} className="mr-2" /> Call Us Now
                </Button>
              </a>
            </div>
          </m.div>

          {/* Right Side: Newsletter Subscribe */}
          <m.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="relative"
          >
            <div className="bg-white border border-slate-200 rounded-[2rem] p-8 md:p-10 shadow-xl relative overflow-hidden">
              {/* Glass reflection */}
              <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-blue-50/50 to-transparent pointer-events-none" />
              
              <div className="relative z-10">
                <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center mb-6 border border-blue-100">
                  <Mail className="text-blue-600" size={28} />
                </div>
                
                <h3 className="text-2xl md:text-3xl font-display font-bold text-slate-900 mb-3">
                  Stay Updated
                </h3>
                <p className="text-slate-600 mb-8 font-medium">
                  Subscribe to our newsletter for the latest announcements, results, and study tips directly to your inbox.
                </p>

                {subscribed ? (
                  <m.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-xl"
                  >
                    <CheckCircle2 className="text-emerald-500" />
                    <span className="font-semibold">Thank you for subscribing!</span>
                  </m.div>
                ) : (
                  <form onSubmit={handleSubscribe} className="space-y-4">
                    <div className="relative">
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Enter your email address"
                        className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
                      />
                    </div>
                    <Button type="submit" className="w-full bg-blue-600 text-white hover:bg-blue-700 py-4 h-auto rounded-xl font-bold text-lg shadow-md hover:-translate-y-0.5 transition-all">
                      Subscribe Now
                    </Button>
                    <p className="text-center text-xs text-slate-500 mt-4">
                      We respect your privacy. No spam, ever.
                    </p>
                  </form>
                )}
              </div>
            </div>
          </m.div>

        </div>
      </div>
    </section>
  );
}
