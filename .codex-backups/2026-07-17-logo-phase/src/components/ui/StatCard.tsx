'use client';

import { useEffect, useRef, useState } from 'react';
import { useInView } from 'react-intersection-observer';
import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';
import { motion } from 'framer-motion';

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
    bg: 'bg-[#0057FF]/10', 
    text: 'text-[#0057FF]', 
    border: 'border-[#0057FF]/20',
    shadow: 'hover:shadow-[0_0_30px_rgba(0,87,255,0.15)]'
  },
  gold: { 
    bg: 'bg-[#FFD700]/10', 
    text: 'text-[#FFD700]', 
    border: 'border-[#FFD700]/20',
    shadow: 'hover:shadow-[0_0_30px_rgba(255,215,0,0.15)]'
  },
  green: { 
    bg: 'bg-emerald-500/10', 
    text: 'text-emerald-400', 
    border: 'border-emerald-500/20',
    shadow: 'hover:shadow-[0_0_30px_rgba(16,185,129,0.15)]'
  },
  red: { 
    bg: 'bg-[#D72638]/10', 
    text: 'text-[#D72638]', 
    border: 'border-[#D72638]/20',
    shadow: 'hover:shadow-[0_0_30px_rgba(215,38,56,0.15)]'
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
    <motion.div
      ref={ref}
      whileHover={{ y: -5, scale: 1.02 }}
      className={cn(
        'group relative rounded-3xl p-8 transition-all duration-500 glass-dark border',
        colors.border,
        colors.shadow
      )}
    >
      {/* Background Glow */}
      <div className={cn(
        'absolute -inset-0.5 rounded-3xl opacity-0 group-hover:opacity-100 blur transition duration-500',
        colors.bg
      )} />
      
      <div className="relative z-10 flex flex-col items-center text-center">
        <div className={cn(
          'w-16 h-16 rounded-2xl flex items-center justify-center mb-6 transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3 shadow-inner',
          colors.bg,
          colors.text
        )}>
          <Icon size={32} />
        </div>
        <div className="font-display text-5xl font-extrabold text-white mb-2 tracking-tight">
          {prefix}{inView ? count.toLocaleString() : 0}{suffix}
        </div>
        <div className="font-medium text-white/80 text-lg mb-2">{label}</div>
        {description && <p className="text-sm text-white/50">{description}</p>}
      </div>
    </motion.div>
  );
}
