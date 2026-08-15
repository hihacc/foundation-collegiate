'use client';

import { usePathname } from 'next/navigation';
import { LazyMotion, domAnimation } from 'framer-motion';
import Navbar from './Navbar';
import Footer from './Footer';
import { MessageCircle } from 'lucide-react';

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdminRoute = pathname?.startsWith('/admin');

  if (isAdminRoute) {
    return <LazyMotion features={domAnimation}>{children}</LazyMotion>;
  }

  return (
    <LazyMotion features={domAnimation}>
      <Navbar />
      <main className="flex-1 flex flex-col">
        {children}
      </main>
      <Footer />

      {/* Floating WhatsApp Button on Left Corner (+923333439458) */}
      <a
        href="https://wa.me/923333439458"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Chat on WhatsApp with The Foundation Collegiate (+923333439458)"
        className="fixed bottom-6 left-6 z-50 bg-emerald-500 hover:bg-emerald-600 text-white p-3.5 rounded-full shadow-lg hover:shadow-xl hover:scale-110 transition-all duration-300 flex items-center justify-center border-2 border-white group"
      >
        <MessageCircle size={26} className="fill-white text-emerald-500 shrink-0" />
        <span className="max-w-0 overflow-hidden whitespace-nowrap group-hover:max-w-xs transition-all duration-300 text-xs font-bold pl-0 group-hover:pl-2">
          Chat on WhatsApp
        </span>
      </a>
    </LazyMotion>
  );
}
