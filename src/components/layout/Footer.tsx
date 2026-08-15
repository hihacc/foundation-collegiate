'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Mail, MapPin, Phone } from 'lucide-react';
import { useSettings } from '@/lib/hooks/useSettings';

const FacebookSVG = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path>
  </svg>
);

const InstagramSVG = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
  </svg>
);

const quickLinks = [
  { name: 'Home', href: '/' },
  { name: 'About Us', href: '/about' },
  { name: 'Admissions 2026', href: '/admissions' },
  { name: 'Our Courses', href: '/courses' },
  { name: 'Result Checker', href: '/results' },
];

const studentLinks = [
  { name: 'Check Results', href: '/results' },
  { name: 'Notice Board', href: '/notices' },
  { name: 'Downloads', href: '/downloads' },
  { name: 'Apply for Admission', href: '/admissions' },
  { name: 'FAQs', href: '/faqs' },
];

export default function Footer() {
  const settings = useSettings();

  const phone = settings.contact_phone || '0333-3439458';
  const email = settings.contact_email || 'foundationcollegiate@gmail.com';
  const address = 'House# 1704, Sector 11-E, Muslim Town, North Karachi, Karachi, Pakistan';

  return (
    <footer className="bg-white border-t border-slate-200">
      {/* Main Four-Column Footer */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16 max-w-7xl">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          
          {/* Column 1: Brand Info & Logo */}
          <div className="space-y-5">
            <Link href="/" className="flex items-center gap-3 group">
              <div className="w-10 h-10 overflow-hidden rounded-xl bg-white shadow-xs ring-1 ring-slate-200 shrink-0">
                <Image src="/foundation-logo.png" alt="TFC Logo" width={40} height={40} className="h-full w-full object-cover" />
              </div>
              <div>
                <div className="font-bold text-slate-900 text-base leading-tight">The Foundation Collegiate</div>
                <div className="text-[10px] font-extrabold tracking-widest text-blue-600 uppercase">TFC</div>
              </div>
            </Link>

            <p className="text-xs leading-relaxed text-slate-600 font-medium">
              &quot;We Know and Deliver What Quality Education Means&quot;
            </p>
            <p className="text-xs leading-relaxed text-slate-500">
              North Karachi&apos;s premier coaching institute for Matriculation & Intermediate board exam success.
            </p>

            {/* Social Icons (Render only if configured) */}
            <div className="flex gap-2.5 pt-2">
              {settings.facebook_url && (
                <a
                  href={settings.facebook_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-9 h-9 bg-slate-50 border border-slate-200 hover:bg-blue-600 text-slate-600 hover:text-white hover:border-blue-600 rounded-lg flex items-center justify-center transition-all shadow-xs"
                  aria-label="Facebook"
                >
                  <FacebookSVG />
                </a>
              )}
              {settings.instagram_url && (
                <a
                  href={settings.instagram_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-9 h-9 bg-slate-50 border border-slate-200 hover:bg-gradient-to-tr hover:from-yellow-500 hover:via-pink-600 hover:to-purple-700 text-slate-600 hover:text-white hover:border-transparent rounded-lg flex items-center justify-center transition-all shadow-xs"
                  aria-label="Instagram"
                >
                  <InstagramSVG />
                </a>
              )}
              {!settings.facebook_url && !settings.instagram_url && (
                <>
                  <a
                    href="https://www.facebook.com/TheFoundationCollegiate/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-9 h-9 bg-slate-50 border border-slate-200 hover:bg-blue-600 text-slate-600 hover:text-white hover:border-blue-600 rounded-lg flex items-center justify-center transition-all shadow-xs"
                    aria-label="Facebook"
                  >
                    <FacebookSVG />
                  </a>
                  <a
                    href="https://www.instagram.com/thefoundationcollegiate/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-9 h-9 bg-slate-50 border border-slate-200 hover:bg-gradient-to-tr hover:from-yellow-500 hover:via-pink-600 hover:to-purple-700 text-slate-600 hover:text-white hover:border-transparent rounded-lg flex items-center justify-center transition-all shadow-xs"
                    aria-label="Instagram"
                  >
                    <InstagramSVG />
                  </a>
                </>
              )}
            </div>
          </div>

          {/* Column 2: Quick Links */}
          <div>
            <h4 className="font-bold text-slate-900 text-xs tracking-widest uppercase mb-5">
              Quick Links
            </h4>
            <ul className="space-y-2.5 text-xs">
              {quickLinks.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-slate-600 hover:text-blue-600 transition-colors font-medium flex items-center gap-1.5"
                  >
                    <span className="text-blue-500 font-bold">&rsaquo;</span> {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3: Student Resources */}
          <div>
            <h4 className="font-bold text-slate-900 text-xs tracking-widest uppercase mb-5">
              Student Resources
            </h4>
            <ul className="space-y-2.5 text-xs">
              {studentLinks.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-slate-600 hover:text-blue-600 transition-colors font-medium flex items-center gap-1.5"
                  >
                    <span className="text-blue-500 font-bold">&rsaquo;</span> {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 4: Contact Us */}
          <div>
            <h4 className="font-bold text-slate-900 text-xs tracking-widest uppercase mb-5">
              Contact Us
            </h4>
            <div className="space-y-4 text-xs">
              <div className="flex items-start gap-3">
                <MapPin className="text-blue-600 mt-0.5 shrink-0" size={16} />
                <p className="text-slate-600 leading-relaxed font-medium">
                  {address}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="text-blue-600 shrink-0" size={16} />
                <a href={`tel:${phone}`} className="text-slate-600 hover:text-blue-600 transition-colors font-semibold">
                  {phone}
                </a>
              </div>
              <div className="flex items-center gap-3">
                <Mail className="text-blue-600 shrink-0" size={16} />
                <a href={`mailto:${email}`} className="text-slate-600 hover:text-blue-600 transition-colors break-all font-semibold">
                  {email}
                </a>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Footer Bottom Bar */}
      <div className="border-t border-slate-200 bg-slate-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-5 flex flex-col md:flex-row justify-between items-center gap-4 text-xs max-w-7xl">
          <div className="text-slate-600 font-semibold text-center md:text-left">
            <span>&copy; 2026 The Foundation Collegiate. All rights reserved.</span>
          </div>

          <div className="flex items-center gap-5">
            <Link href="/privacy" className="text-slate-600 hover:text-blue-600 transition-colors font-medium">Privacy Policy</Link>
            <Link href="/terms" className="text-slate-600 hover:text-blue-600 transition-colors font-medium">Terms</Link>
            <Link href="/admin" className="text-blue-600 hover:text-blue-700 font-bold transition-colors border-l border-slate-300 pl-4">
              Admin Dashboard
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
