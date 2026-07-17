import Link from 'next/link';
import Image from 'next/image';
import { Mail, MapPin, Phone } from 'lucide-react';

const FacebookSVG = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path>
  </svg>
);

const InstagramSVG = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
  </svg>
);

const WhatsAppSVG = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.890-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/>
  </svg>
);

const quickLinks = [
  { name: 'Home', href: '/' },
  { name: 'About Us', href: '/about' },
  { name: 'Admissions 2026', href: '/admissions' },
  { name: 'Our Courses', href: '/courses' },
  { name: 'Result Checker', href: '/results' },
  { name: 'Gallery', href: '/gallery' },
  { name: 'Downloads', href: '/downloads' },
  { name: 'Contact Us', href: '/contact' },
];

const studentLinks = [
  { name: 'Check Results', href: '/results' },
  { name: 'Notice Board', href: '/notices' },
  { name: 'Downloads', href: '/downloads' },
  { name: 'Apply for Admission', href: '/admissions' },
  { name: 'FAQs', href: '/faqs' },
];

export default function Footer() {
  return (
    <footer className="bg-slate-950 text-slate-300">
      {/* Main Footer */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          
          {/* Brand Column */}
          <div className="space-y-6">
            <Link href="/" className="flex items-center gap-3">
              <div className="relative h-11 w-11 overflow-hidden rounded-xl bg-white">
                <Image src="/foundation-logo.png" alt="The Foundation Collegiate" width={44} height={44} className="h-full w-full object-cover" />
              </div>
              <div>
                <div className="font-bold text-white text-base">The Foundation</div>
                <div className="text-xs font-semibold tracking-widest text-yellow-400 uppercase">Collegiate</div>
              </div>
            </Link>
            <p className="text-sm leading-relaxed text-slate-400">
              We Know and Deliver what Quality Education Means. Your trusted coaching partner in North Karachi for over a decade.
            </p>
            {/* Social Links */}
            <div className="flex gap-3">
              <a
                href="https://www.facebook.com/TheFoundationCollegiate/"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 bg-slate-800 hover:bg-[#1877F2] text-slate-400 hover:text-white rounded-lg flex items-center justify-center transition-all duration-300 hover:-translate-y-0.5"
                aria-label="Facebook"
              >
                <FacebookSVG />
              </a>
              <a
                href="https://www.instagram.com/thefoundationcollegiate/"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 bg-slate-800 hover:bg-gradient-to-tr hover:from-yellow-500 hover:via-pink-600 hover:to-purple-700 text-slate-400 hover:text-white rounded-lg flex items-center justify-center transition-all duration-300 hover:-translate-y-0.5"
                aria-label="Instagram"
              >
                <InstagramSVG />
              </a>
              <a
                href="https://wa.me/923333439458"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 bg-slate-800 hover:bg-[#25D366] text-slate-400 hover:text-white rounded-lg flex items-center justify-center transition-all duration-300 hover:-translate-y-0.5"
                aria-label="WhatsApp"
              >
                <WhatsAppSVG />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-white font-bold text-sm uppercase tracking-wider mb-6 pb-2 border-b border-slate-800">
              Quick Links
            </h4>
            <ul className="space-y-3">
              {quickLinks.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-sm text-slate-400 hover:text-yellow-400 transition-colors flex items-center gap-2 group"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-primary group-hover:bg-yellow-400 transition-colors shrink-0" />
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Student Links */}
          <div>
            <h4 className="text-white font-bold text-sm uppercase tracking-wider mb-6 pb-2 border-b border-slate-800">
              Student Resources
            </h4>
            <ul className="space-y-3">
              {studentLinks.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-sm text-slate-400 hover:text-yellow-400 transition-colors flex items-center gap-2 group"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-primary group-hover:bg-yellow-400 transition-colors shrink-0" />
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
            {/* Admissions CTA */}
            <div className="mt-8 p-4 bg-primary/20 border border-primary/30 rounded-xl">
              <p className="text-sm font-bold text-yellow-400 mb-2">🎉 Admissions 2026 Open!</p>
              <Link
                href="/admissions"
                className="text-xs text-white bg-primary hover:bg-blue-700 px-4 py-2 rounded-lg font-medium transition-colors inline-block"
              >
                Apply Now →
              </Link>
            </div>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="text-white font-bold text-sm uppercase tracking-wider mb-6 pb-2 border-b border-slate-800">
              Contact Us
            </h4>
            <div className="space-y-5">
              <div className="flex items-start gap-3">
                <MapPin className="text-primary mt-0.5 shrink-0" size={18} />
                <p className="text-sm text-slate-400 leading-relaxed">
                  House #1704, Sector 11-E,<br />
                  Muslim Town, North Karachi,<br />
                  Karachi, Pakistan
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="text-primary shrink-0" size={18} />
                <a href="tel:+923333439458" className="text-sm text-slate-400 hover:text-white transition-colors">
                  0333-3439458
                </a>
              </div>
              <div className="flex items-center gap-3">
                <Mail className="text-primary shrink-0" size={18} />
                <a href="mailto:foundationcollegiate@gmail.com" className="text-sm text-slate-400 hover:text-white transition-colors break-all">
                  foundationcollegiate@gmail.com
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-slate-800">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col md:flex-row justify-between items-center gap-4 text-sm">
          <p className="text-slate-500">
            &copy; {new Date().getFullYear()} The Foundation Collegiate. All rights reserved.
          </p>
          <div className="flex items-center gap-6">
            <Link href="/privacy" className="text-slate-500 hover:text-slate-300 transition-colors">Privacy Policy</Link>
            <Link href="/terms" className="text-slate-500 hover:text-slate-300 transition-colors">Terms</Link>
            <Link href="/sitemap.xml" className="text-slate-500 hover:text-slate-300 transition-colors">Sitemap</Link>
            <Link href="/admin" className="text-slate-600 hover:text-slate-400 transition-colors border-l border-slate-800 pl-4">
              Admin
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
