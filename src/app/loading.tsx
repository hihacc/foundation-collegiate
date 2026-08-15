import { Loader2 } from 'lucide-react';
import Image from 'next/image';

export default function Loading() {
  return (
    <div className="fixed inset-0 z-[9998] bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center">
      <div className="relative w-16 h-16 sm:w-20 sm:h-20 bg-white rounded-2xl p-2.5 shadow-xl flex items-center justify-center mb-4 ring-1 ring-slate-100 animate-pulse">
        <Image 
          src="/foundation-logo.png" 
          alt="TFC Logo" 
          width={60} 
          height={60} 
          className="w-full h-full object-contain"
        />
      </div>
      <div className="flex items-center gap-2 text-blue-600 font-semibold text-sm uppercase tracking-widest">
        <Loader2 className="w-4 h-4 animate-spin" />
        <span>Loading...</span>
      </div>
    </div>
  );
}
