'use client';

import { m } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import { cn } from '@/lib/utils';

interface SectionHeaderProps {
  badge?: string;
  title: string;
  titleHighlight?: string;
  description?: string;
  align?: 'left' | 'center';
  className?: string;
}

export default function SectionHeader({
  badge,
  title,
  titleHighlight,
  description,
  align = 'center',
  className,
}: SectionHeaderProps) {
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.3 });

  return (
    <m.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className={cn(
        'space-y-4',
        align === 'center' ? 'text-center' : 'text-left',
        className
      )}
    >
      {badge && (
        <div className={cn(
          'inline-flex items-center gap-2 px-5 py-2 rounded-full',
          'bg-gradient-to-r from-[#0057FF]/10 to-[#001F54]/10 border border-[#0057FF]/20 text-[#0057FF] text-sm font-bold tracking-wide uppercase shadow-sm',
          align === 'center' ? 'mx-auto' : ''
        )}>
          <span className="w-1.5 h-1.5 rounded-full bg-[#0057FF] animate-pulse shadow-[0_0_8px_rgba(0,87,255,0.8)]" />
          {badge}
        </div>
      )}
      <h2 className="text-4xl md:text-5xl lg:text-6xl font-display font-extrabold tracking-tight text-[#0F172A]">
        {title}{' '}
        {titleHighlight && (
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#0057FF] to-[#001F54]">
            {titleHighlight}
          </span>
        )}
      </h2>
      {description && (
        <p className={cn(
          "text-lg max-w-2xl leading-relaxed text-slate-700 font-medium",
          align === 'center' ? 'mx-auto' : ''
        )}>
          {description}
        </p>
      )}
    </m.div>
  );
}
