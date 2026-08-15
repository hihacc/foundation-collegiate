'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { m, AnimatePresence } from 'framer-motion';
import { Menu, X, ChevronDown, Plus, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';
import Button from '@/components/ui/Button';

type NavItem = {
  name: string;
  href?: string;
  children?: { name: string; href: string }[];
};

const navLinks: NavItem[] = [
  { name: 'Home', href: '/' },
  { 
    name: 'About', 
    children: [
      { name: 'About The Foundation Collegiate', href: '/about' },
      { name: 'Our Faculty & Staff', href: '/teachers' },
    ]
  },
  { 
    name: 'Academics', 
    children: [
      { name: 'Classes & Levels', href: '/classes' },
      { name: 'Subjects', href: '/courses' },
      { name: 'Academic Programs', href: '/academics' },
      { name: 'Academic Calendar', href: '/notices' },
      { name: 'Examination System', href: '/results' },
      { name: 'Results', href: '/results' },
    ]
  },
  { 
    name: 'Programs', 
    children: [
      { name: 'Pre-Medical', href: '/programs?stream=pre-medical' },
      { name: 'Pre-Engineering', href: '/programs?stream=pre-engineering' },
      { name: 'Computer Science', href: '/programs?stream=computer-science' },
      { name: 'Commerce', href: '/programs?stream=commerce' },
      { name: 'Class IX', href: '/programs?class=ix' },
      { name: 'Class X', href: '/programs?class=x' },
      { name: 'Class XI', href: '/programs?class=xi' },
      { name: 'Class XII', href: '/programs?class=xii' },
    ]
  },
  { 
    name: 'Admissions', 
    children: [
      { name: 'Admissions 2026', href: '/admissions' },
      { name: 'Admission Process', href: '/admissions/process' },
      { name: 'Eligibility', href: '/admissions/process#eligibility' },
      { name: 'Fee Structure', href: '/admissions/fees' },
      { name: 'Required Documents', href: '/admissions/process#documents' },
      { name: 'Apply Online', href: '/admissions' },
    ]
  },
  { name: 'Results', href: '/results' },
  { name: 'Gallery', href: '/gallery' },
  { name: 'Downloads', href: '/downloads' },
  { name: 'Contact', href: '/contact' },
];

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [openAccordions, setOpenAccordions] = useState<Record<string, boolean>>({});
  const navRef = useRef<HTMLElement>(null);
  const pathname = usePathname();

  // Handle Scroll
  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Handle Click Outside for Dropdowns
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(e.target as Node)) {
        setActiveDropdown(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle Escape Key
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setActiveDropdown(null);
    };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, []);

  // Close menus on route change
  useEffect(() => {
    setActiveDropdown(null);
    setMobileMenuOpen(false);
  }, [pathname]);

  // Lock body scroll on mobile menu
  useEffect(() => {
    if (mobileMenuOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = 'unset';
  }, [mobileMenuOpen]);

  const toggleDropdown = (name: string, e: React.MouseEvent) => {
    e.preventDefault();
    setActiveDropdown(prev => prev === name ? null : name);
  };

  const toggleAccordion = (name: string) => {
    setOpenAccordions(prev => ({ ...prev, [name]: !prev[name] }));
  };

  const handleMouseEnter = (name: string) => {
    if (window.innerWidth >= 1024) {
      setActiveDropdown(name);
    }
  };

  const handleMouseLeave = () => {
    if (window.innerWidth >= 1024) {
      setActiveDropdown(null);
    }
  };

  return (
    <m.header
      ref={navRef}
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className={cn(
        'fixed top-0 left-0 right-0 z-[100] transition-all duration-300',
        isScrolled || mobileMenuOpen
          ? 'py-2.5 bg-white/95 backdrop-blur-xl border-b border-slate-200 shadow-sm' 
          : 'py-3.5 bg-white/90 backdrop-blur-md border-b border-slate-100/80 shadow-xs'
      )}
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
        <div className="flex items-center justify-between">
          
          {/* Left Side: Brand & Logo */}
          <Link href="/" className="relative z-50 flex items-center gap-2.5 group focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 rounded-xl p-1 shrink-0">
            <div className="w-9 h-9 overflow-hidden rounded-xl bg-white shadow-xs ring-1 ring-slate-200 transition-transform duration-300 group-hover:scale-105 shrink-0">
              <Image src="/foundation-logo.png" alt="TFC Logo" width={36} height={36} priority className="h-full w-full object-cover" />
            </div>
            <div className="flex flex-col">
              <span className="font-display font-black text-base leading-tight tracking-tight text-slate-900">
                The Foundation
              </span>
              <span className="text-[10px] font-bold tracking-widest uppercase text-blue-600">
                COLLEGIATE
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-1">
            {navLinks.map((link) => {
              const isCurrentPath = link.href === pathname || link.children?.some(c => c.href === pathname || pathname.startsWith(c.href));
              const hasChildren = !!link.children;
              const isDropdownOpen = activeDropdown === link.name;
              
              return (
                <div
                  key={link.name}
                  className="relative"
                  onMouseEnter={() => hasChildren && handleMouseEnter(link.name)}
                  onMouseLeave={handleMouseLeave}
                >
                  {hasChildren ? (
                    <button
                      onClick={(e) => toggleDropdown(link.name, e)}
                      aria-expanded={isDropdownOpen}
                      aria-haspopup="true"
                      className={cn(
                        'flex items-center gap-1 relative px-3 py-2 rounded-full text-xs font-bold transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 whitespace-nowrap',
                        isCurrentPath ? 'text-blue-600' : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100/70'
                      )}
                    >
                      <span className="relative z-10">{link.name}</span>
                      <ChevronDown size={12} className={cn("transition-transform duration-300 shrink-0", isDropdownOpen ? 'rotate-180 text-blue-600' : 'text-slate-400')} />
                      
                      {isCurrentPath && (
                        <m.div layoutId="navbar-active" className="absolute inset-0 bg-blue-50 rounded-full -z-0" transition={{ type: "spring", stiffness: 400, damping: 30 }} />
                      )}
                    </button>
                  ) : (
                    <Link
                      href={link.href!}
                      className={cn(
                        'relative px-3 py-2 rounded-full text-xs font-bold transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 whitespace-nowrap',
                        isCurrentPath ? 'text-blue-600' : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100/70'
                      )}
                    >
                      <span className="relative z-10">{link.name}</span>
                      {isCurrentPath && (
                        <m.div layoutId="navbar-active" className="absolute inset-0 bg-blue-50 rounded-full -z-0" transition={{ type: "spring", stiffness: 400, damping: 30 }} />
                      )}
                    </Link>
                  )}

                  {/* Desktop Dropdown Menu */}
                  {hasChildren && (
                    <AnimatePresence>
                      {isDropdownOpen && (
                        <m.div
                          initial={{ opacity: 0, y: 12, scale: 0.96 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 8, scale: 0.96 }}
                          transition={{ duration: 0.18, ease: "easeOut" }}
                          className="absolute top-full left-1/2 -translate-x-1/2 pt-3 w-64 z-50"
                        >
                          <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/70 border border-slate-200/80 p-2 flex flex-col relative overflow-hidden ring-1 ring-slate-900/5">
                            {link.children!.map((child) => (
                              <Link
                                key={child.name}
                                href={child.href}
                                onClick={() => setActiveDropdown(null)}
                                className={cn(
                                  "px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-between focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500",
                                  (pathname === child.href || (child.href.includes('#') && pathname === child.href.split('#')[0]))
                                    ? "bg-blue-50 text-blue-600" 
                                    : "text-slate-700 hover:bg-slate-50 hover:text-slate-900 hover:pl-4"
                                )}
                              >
                                <span>{child.name}</span>
                              </Link>
                            ))}
                          </div>
                        </m.div>
                      )}
                    </AnimatePresence>
                  )}
                </div>
              );
            })}
          </nav>

          {/* Primary Blue Apply Now CTA Button */}
          <div className="flex items-center gap-2.5 relative z-50 shrink-0">
            <div className="hidden lg:block">
              <Link href="/admissions" tabIndex={-1}>
                <Button 
                  className="bg-blue-600 hover:bg-blue-700 text-white border-none shadow-md shadow-blue-600/20 hover:shadow-lg hover:shadow-blue-600/30 hover:-translate-y-0.5 transition-all duration-300 rounded-full px-5 py-2 font-bold text-xs"
                >
                  Apply Now
                </Button>
              </Link>
            </div>

            {/* Mobile / Tablet Toggle */}
            <button
              className={cn(
                "lg:hidden p-2 rounded-full transition-colors focus:outline-none",
                mobileMenuOpen ? "bg-slate-100 text-slate-900" : "bg-white/90 text-slate-900 border border-slate-200 shadow-xs"
              )}
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile / Tablet Navigation Overlay Drawer */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <m.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: '100dvh' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="fixed inset-0 top-[62px] bg-white lg:hidden overflow-y-auto border-t border-slate-100 shadow-inner z-[90] pb-24"
          >
            <div className="container mx-auto px-6 py-6 flex flex-col gap-3">
              {navLinks.map((link) => {
                const hasChildren = !!link.children;
                const isCurrentPath = link.href === pathname || link.children?.some(c => c.href === pathname);
                const isAccordionOpen = !!openAccordions[link.name];

                return (
                  <div key={link.name} className="flex flex-col border-b border-slate-100 pb-3 last:border-0">
                    {hasChildren ? (
                      <div>
                        <button
                          onClick={() => toggleAccordion(link.name)}
                          className={cn(
                            "flex items-center justify-between w-full py-2 text-base font-bold transition-colors",
                            isCurrentPath ? "text-blue-600" : "text-slate-800"
                          )}
                          aria-expanded={isAccordionOpen}
                        >
                          <span>{link.name}</span>
                          {isAccordionOpen ? <Minus size={18} className="text-blue-600" /> : <Plus size={18} className="text-slate-400" />}
                        </button>
                        
                        <AnimatePresence>
                          {isAccordionOpen && (
                            <m.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              className="overflow-hidden"
                            >
                              <div className="flex flex-col gap-1.5 pl-4 pt-2 border-l-2 border-slate-100 ml-2">
                                {link.children!.map((child) => (
                                  <Link
                                    key={child.name}
                                    href={child.href}
                                    onClick={() => setMobileMenuOpen(false)}
                                    className={cn(
                                      "py-2 px-3 rounded-xl text-sm font-bold transition-colors",
                                      (pathname === child.href)
                                        ? "bg-blue-50 text-blue-600" 
                                        : "text-slate-600 hover:text-slate-900"
                                    )}
                                  >
                                    {child.name}
                                  </Link>
                                ))}
                              </div>
                            </m.div>
                          )}
                        </AnimatePresence>
                      </div>
                    ) : (
                      <Link
                        href={link.href!}
                        onClick={() => setMobileMenuOpen(false)}
                        className={cn(
                          "py-2 text-base font-bold transition-colors",
                          isCurrentPath ? "text-blue-600" : "text-slate-800"
                        )}
                      >
                        {link.name}
                      </Link>
                    )}
                  </div>
                );
              })}
              
              <div className="mt-6 pt-2">
                <Link href="/admissions" onClick={() => setMobileMenuOpen(false)}>
                  <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 text-base rounded-2xl shadow-lg shadow-blue-600/25">
                    Apply Now for Admission
                  </Button>
                </Link>
              </div>
            </div>
          </m.div>
        )}
      </AnimatePresence>
    </m.header>
  );
}
