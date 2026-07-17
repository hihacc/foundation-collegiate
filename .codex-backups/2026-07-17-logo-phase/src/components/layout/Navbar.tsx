'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, ChevronRight, GraduationCap } from 'lucide-react';
import { cn } from '@/lib/utils';
import Button from '@/components/ui/Button';

const navLinks = [
  { name: 'Home', href: '/' },
  { name: 'About', href: '/about' },
  { name: 'Courses', href: '/courses' },
  { name: 'Admissions', href: '/admissions' },
  { name: 'Results', href: '/results' },
  { name: 'Gallery', href: '/gallery' },
  { name: 'Faculty', href: '/faculty' },
  { name: 'Downloads', href: '/downloads' },
  { name: 'Contact', href: '/contact' },
];

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Prevent scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
  }, [mobileMenuOpen]);

  const isHome = pathname === '/';

  return (
    <>
      <motion.header
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className={cn(
          'fixed top-0 left-0 right-0 z-50 transition-all duration-500',
          isScrolled 
            ? 'py-3 bg-white/95 backdrop-blur-xl border-b border-white/20 shadow-[0_8px_30px_rgb(0,0,0,0.04)]' 
            : 'py-5 bg-transparent'
        )}
      >
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <Link href="/" className="relative z-50 flex items-center gap-3 group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#001B4D] to-[#0057FF] flex items-center justify-center shadow-lg group-hover:shadow-[#0057FF]/40 transition-all duration-300 transform group-hover:scale-105">
                <GraduationCap className="text-white" size={24} strokeWidth={2.5} />
              </div>
              <div className="flex flex-col">
                <span className={cn(
                  "font-display font-bold text-lg leading-tight tracking-tight transition-colors duration-300",
                  isScrolled || !isHome ? "text-[#001B4D]" : "text-white"
                )}>
                  The Foundation
                </span>
                <span className={cn(
                  "text-xs font-medium tracking-widest uppercase transition-colors duration-300",
                  isScrolled || !isHome ? "text-[#0057FF]" : "text-[#FFD700]"
                )}>
                  Collegiate
                </span>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-1">
              {navLinks.map((link) => {
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.name}
                    href={link.href}
                    className={cn(
                      'relative px-4 py-2 rounded-full text-sm font-semibold transition-all duration-300 group overflow-hidden',
                      isScrolled || !isHome 
                        ? (isActive ? 'text-[#0057FF]' : 'text-slate-600 hover:text-[#001B4D]')
                        : (isActive ? 'text-white' : 'text-white/80 hover:text-white')
                    )}
                  >
                    <span className="relative z-10">{link.name}</span>
                    {isActive && (
                      <motion.div
                        layoutId="navbar-active"
                        className="absolute inset-0 bg-[#0057FF]/10 rounded-full"
                        transition={{ type: "spring", stiffness: 380, damping: 30 }}
                      />
                    )}
                    <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-full" />
                  </Link>
                );
              })}
            </nav>

            {/* CTA Button & Mobile Toggle */}
            <div className="flex items-center gap-4">
              <div className="hidden lg:block">
                <Link href="/admissions">
                  <Button 
                    className="bg-[#D72638] hover:bg-[#b01e2c] text-white border-none shadow-[0_4px_14px_0_rgba(215,38,56,0.39)] hover:shadow-[0_6px_20px_rgba(215,38,56,0.23)] hover:-translate-y-0.5 transition-all duration-300 rounded-full px-6 font-bold"
                  >
                    Apply Now
                  </Button>
                </Link>
              </div>

              {/* Mobile Menu Toggle */}
              <button
                className="lg:hidden relative z-50 p-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-current"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                aria-label="Toggle menu"
              >
                {mobileMenuOpen ? (
                  <X size={24} className={isScrolled || !isHome || mobileMenuOpen ? "text-[#001B4D]" : "text-white"} />
                ) : (
                  <Menu size={24} className={isScrolled || !isHome ? "text-[#001B4D]" : "text-white"} />
                )}
              </button>
            </div>
          </div>
        </div>
      </motion.header>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20, transition: { duration: 0.2 } }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="fixed inset-0 z-40 bg-white lg:hidden overflow-y-auto pt-24 pb-10 px-6"
          >
            <div className="flex flex-col gap-6">
              <nav className="flex flex-col gap-2">
                {navLinks.map((link, idx) => {
                  const isActive = pathname === link.href;
                  return (
                    <motion.div
                      key={link.name}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.05 }}
                    >
                      <Link
                        href={link.href}
                        onClick={() => setMobileMenuOpen(false)}
                        className={cn(
                          'flex items-center justify-between p-4 rounded-2xl text-xl font-bold transition-all',
                          isActive 
                            ? 'bg-[#0057FF]/10 text-[#0057FF]' 
                            : 'text-slate-800 hover:bg-slate-50'
                        )}
                      >
                        {link.name}
                        {isActive && <ChevronRight size={20} className="text-[#0057FF]" />}
                      </Link>
                    </motion.div>
                  );
                })}
              </nav>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="mt-4"
              >
                <Link href="/admissions" onClick={() => setMobileMenuOpen(false)}>
                  <Button className="w-full bg-[#D72638] hover:bg-[#b01e2c] text-white py-4 rounded-2xl text-lg font-bold shadow-lg shadow-[#D72638]/30">
                    Apply Now for 2026
                  </Button>
                </Link>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
