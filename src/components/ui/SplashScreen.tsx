'use client';

import { useState, useEffect } from 'react';
import { m, AnimatePresence } from 'framer-motion';
import Image from 'next/image';

export default function SplashScreen() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Only show once per session for a smooth UX
    const hasShown = sessionStorage.getItem('tfc_splash_shown');
    if (hasShown) {
      setIsVisible(false);
      return;
    }

    // Hide after 2 seconds
    const timer = setTimeout(() => {
      setIsVisible(false);
      sessionStorage.setItem('tfc_splash_shown', 'true');
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <AnimatePresence>
      {isVisible && (
        <m.div
          key="splash"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6, ease: "easeInOut" }}
          className="fixed inset-0 z-[9999] bg-white flex flex-col items-center justify-center overflow-hidden"
        >
          {/* Background Glows (Light Theme) */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute -top-1/2 -right-1/4 w-full h-full bg-blue-100/50 blur-[100px] rounded-full mix-blend-multiply" />
            <div className="absolute -bottom-1/2 -left-1/4 w-full h-full bg-[#0057FF]/5 blur-[100px] rounded-full mix-blend-multiply" />
          </div>

          <m.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="relative z-10 flex flex-col items-center w-full px-4"
          >
            {/* Logo Container */}
            <m.div 
              initial={{ y: 20 }}
              animate={{ y: 0 }}
              transition={{ delay: 0.2, duration: 0.5, type: "spring" }}
              className="w-24 h-24 sm:w-32 sm:h-32 bg-white rounded-3xl p-3 sm:p-4 shadow-xl flex items-center justify-center mb-6 ring-1 ring-slate-100"
            >
              <Image 
                src="/foundation-logo.png" 
                alt="The Foundation Collegiate Logo" 
                width={120} 
                height={120} 
                className="w-full h-full object-contain"
                priority
              />
            </m.div>
            
            <m.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.5 }}
              className="text-center"
            >
              <h1 className="font-display font-bold text-3xl sm:text-4xl md:text-5xl text-[#001B4D] tracking-tight mb-2">
                The Foundation
              </h1>
              <h2 className="text-[#0057FF] text-sm sm:text-base font-bold tracking-[0.2em] uppercase">
                Collegiate
              </h2>
            </m.div>

            {/* Loading dots (Light Theme) */}
            <div className="mt-10 flex gap-2.5">
              {[0, 1, 2].map((i) => (
                <m.div
                  key={i}
                  animate={{ scale: [1, 1.5, 1], opacity: [0.3, 1, 0.3] }}
                  transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                  className="w-2 h-2 sm:w-2.5 sm:h-2.5 bg-blue-600 rounded-full"
                />
              ))}
            </div>
          </m.div>
        </m.div>
      )}
    </AnimatePresence>
  );
}
