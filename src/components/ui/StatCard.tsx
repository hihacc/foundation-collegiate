'use client';

import { useEffect, useRef, useState } from 'react';
import { useInView } from 'react-intersection-observer';
import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';
import { m } from 'framer-motion';

interface StatCardProps {
  value: number;
  label: string;
  icon: LucideIcon;
  prefix?: string;
  suffix?: string;
  color?: 'blue' | 'gold' | 'green' | 'red';
  description?: string;
}

const colorMap = {
  blue: { 
    bg: 'bg-blue-50', 
    text: 'text-blue-600', 
    border: 'border-blue-100',
    shadow: 'hover:shadow-[0_8px_30px_rgba(37,99,235,0.12)]'
  },
  gold: { 
    bg: 'bg-amber-50', 
    text: 'text-amber-600', 
    border: 'border-amber-100',
    shadow: 'hover:shadow-[0_8px_30px_rgba(245,158,11,0.12)]'
  },
  green: { 
    bg: 'bg-emerald-50', 
    text: 'text-emerald-600', 
    border: 'border-emerald-100',
    shadow: 'hover:shadow-[0_8px_30px_rgba(16,185,129,0.12)]'
  },
  red: { 
    bg: 'bg-red-50', 
    text: 'text-red-600', 
    border: 'border-red-100',
    shadow: 'hover:shadow-[0_8px_30px_rgba(220,38,38,0.12)]'
  },
};

function useCountUp(target: number, duration: number = 2000, inView: boolean) {
  const [count, setCount] = useState(0);
  const frameRef = useRef<number>(0);

  useEffect(() => {
    if (!inView) return;
    const startTime = performance.now();
    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(eased * target));
      if (progress < 1) frameRef.current = requestAnimationFrame(animate);
    };
    frameRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frameRef.current);
  }, [target, duration, inView]);

  return count;
}

export default function StatCard({ value, label, icon: Icon, prefix = '', suffix = '', color = 'blue', description }: StatCardProps) {
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.3 });
  const count = useCountUp(value, 2000, inView);
  const colors = colorMap[color];

  return (
    <m.div
      ref={ref}
      whileHover={{ y: -5, scale: 1.02 }}
      className={cn(
        'group relative rounded-3xl p-8 transition-all duration-500 bg-white border shadow-sm',
        colors.border,
        colors.shadow
      )}
    >
      <div className="relative z-10 flex flex-col items-center text-center">
        <div className={cn(
          'w-16 h-16 rounded-2xl flex items-center justify-center mb-6 transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3 shadow-sm',
          colors.bg,
          colors.text
        )}>
          <Icon size={32} />
        </div>
        <div className="font-display text-5xl font-extrabold text-slate-800 mb-2 tracking-tight">
          {prefix}{inView ? count.toLocaleString() : 0}{suffix}
        </div>
        <div className="font-medium text-slate-600 text-lg mb-2">{label}</div>
        {description && <p className="text-sm text-slate-400">{description}</p>}
      </div>
    </m.div>
  );
}
