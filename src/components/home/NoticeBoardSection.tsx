'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { m } from 'framer-motion';
import { Bell, Calendar, ChevronRight, Pin } from 'lucide-react';
import SectionHeader from '@/components/ui/SectionHeader';
import Button from '@/components/ui/Button';
import { supabase } from '@/lib/supabase/client';
import type { Notice } from '@/types';
import { getStoredData, setStoredData } from '@/lib/utils/storage';

const fallbackNotices: Notice[] = [
  { id: '110e8400-e29b-41d4-a716-446655440091', title: 'Admissions Open for Session 2026', content: 'We are pleased to announce that admissions are now open for the 2026 academic session. Apply early to secure your seat.', created_at: new Date().toISOString(), type: 'important', is_pinned: true, is_active: true },
  { id: '220e8400-e29b-41d4-a716-446655440092', title: 'Monthly Test Result Announced', content: 'Results of the June 2026 Monthly Exam have been uploaded to the Result Checker portal.', created_at: new Date(Date.now() - 86400000).toISOString(), type: 'result', is_pinned: false, is_active: true },
  { id: '330e8400-e29b-41d4-a716-446655440093', title: 'Parent-Teacher Meeting Notice', content: 'A Parent-Teacher Meeting is scheduled for Saturday afternoon.', created_at: new Date(Date.now() - 172800000).toISOString(), type: 'event', is_pinned: false, is_active: true },
];

const typeStyles: Record<string, { label: string; color: string }> = {
  important: { label: 'Important', color: 'bg-red-50 text-red-600 border-red-200' },
  result: { label: 'Result', color: 'bg-emerald-50 text-emerald-600 border-emerald-200' },
  event: { label: 'Event', color: 'bg-blue-50 text-blue-600 border-blue-200' },
  holiday: { label: 'Holiday', color: 'bg-amber-50 text-amber-600 border-amber-200' },
  general: { label: 'General', color: 'bg-slate-100 text-slate-600 border-slate-200' },
};

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('en-PK', { month: 'short', day: '2-digit' });
}

export default function NoticeBoardSection() {
  const [notices, setNotices] = useState<Notice[]>(fallbackNotices);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data, error } = await supabase
          .from('notices')
          .select('*')
          .eq('is_active', true)
          .order('is_pinned', { ascending: false })
          .order('created_at', { ascending: false })
          .limit(4);
        if (cancelled) return;
        if (!error && data && data.length > 0) {
          setNotices(data as Notice[]);
        }
      } catch (err) {
        console.error('Failed to load notices from Supabase:', err);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  return (
    <section className="py-24 bg-white relative overflow-hidden">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
          <SectionHeader
            badge="Latest Updates"
            title="Notice"
            titleHighlight="Board"
            description="Stay informed with real-time announcements, exam schedules, and events from The Foundation Collegiate."
            className="text-left max-w-2xl"
          />
          <Link href="/notices" className="inline-flex items-center gap-2 font-bold text-[#0057FF] hover:text-[#0040B8] transition-colors">
            View All Announcements <ChevronRight size={18} />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {notices.slice(0, 4).map((notice, idx) => {
            const badgeInfo = typeStyles[notice.type] || typeStyles.general;
            return (
              <m.div
                key={notice.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: idx * 0.1 }}
                className={`p-6 rounded-2xl bg-white border shadow-sm hover:shadow-md transition-all ${
                  notice.is_pinned ? 'border-amber-300 ring-1 ring-amber-200' : 'border-slate-200'
                }`}
              >
                <div className="flex items-center justify-between gap-4 mb-3">
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${badgeInfo.color}`}>
                      {badgeInfo.label}
                    </span>
                    {notice.is_pinned && (
                      <span className="text-xs font-bold text-amber-600 flex items-center gap-1">
                        <Pin size={12} /> Pinned
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-slate-400 font-medium flex items-center gap-1">
                    <Calendar size={12} /> {formatDate(notice.created_at)}
                  </div>
                </div>
                <h3 className="text-lg font-bold text-slate-800 mb-2">{notice.title}</h3>
                <p className="text-slate-600 text-sm line-clamp-2 leading-relaxed">{notice.content}</p>
              </m.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
