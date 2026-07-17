'use client';

import { useEffect, useState } from 'react';
import SectionHeader from '@/components/ui/SectionHeader';
import { Bell, Calendar, Pin } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import type { Notice } from '@/types';

const fallbackNotices: Notice[] = [
  { id: '1', title: 'Admissions Open for Session 2026', content: 'We are pleased to announce that admissions are now open for the 2026 academic session. Apply early to secure your seat. Limited seats available.', created_at: '2026-07-15', type: 'important', is_pinned: true, is_active: true },
  { id: '2', title: 'Monthly Test Result Announced', content: 'Results of the June 2026 Monthly Exam have been uploaded. Students can check their results through the Result Checker portal using their Roll Number and PIN.', created_at: '2026-07-10', type: 'result', is_pinned: false, is_active: true },
  { id: '3', title: 'Parent-Teacher Meeting', content: 'A Parent-Teacher Meeting is scheduled for July 20, 2026. Parents are requested to attend and discuss their child\'s academic progress.', created_at: '2026-07-05', type: 'event', is_pinned: false, is_active: true },
  { id: '4', title: 'Eid Holiday Notice', content: 'The institute will remain closed from July 22-27, 2026 for the Eid holidays. Classes will resume on July 28, 2026.', created_at: '2026-07-01', type: 'holiday', is_pinned: false, is_active: true },
];

const typeColors: Record<string, string> = {
  important: 'bg-red-100 text-red-700 border-red-200',
  result: 'bg-green-100 text-green-700 border-green-200',
  event: 'bg-blue-100 text-blue-700 border-blue-200',
  holiday: 'bg-amber-100 text-amber-700 border-amber-200',
  general: 'bg-slate-100 text-slate-700 border-slate-200',
};

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('en-PK', { month: 'short', day: '2-digit', year: 'numeric' });
}

export default function NoticesPage() {
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
          .order('created_at', { ascending: false });
        if (cancelled) return;
        if (error || !data) return;
        const now = Date.now();
        const valid = (data as Notice[]).filter(
          (n) => !n.expires_at || new Date(n.expires_at).getTime() >= now
        );
        if (valid.length) setNotices(valid);
      } catch {
        // keep fallback silently
      }
    })();
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="py-20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl">
        <SectionHeader
          badge="Announcements"
          title="Notice"
          titleHighlight="Board"
          description="Stay updated with the latest announcements, events, and important notices."
          className="mb-12"
        />

        <div className="space-y-6">
          {notices.map((notice) => (
            <div
              key={notice.id}
              className={`glass-card rounded-2xl p-6 md:p-8 border transition-all hover:shadow-lg ${notice.is_pinned ? 'border-amber-200 dark:border-amber-900/30 bg-amber-50/50 dark:bg-amber-900/10' : 'border-border'}`}
            >
              <div className="flex items-start gap-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${notice.is_pinned ? 'bg-amber-100 text-amber-600' : 'bg-primary/10 text-primary'}`}>
                  {notice.is_pinned ? <Pin size={22} /> : <Bell size={22} />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-3 mb-2">
                    {notice.is_pinned && (
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 border border-amber-200">
                        📌 Pinned
                      </span>
                    )}
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${typeColors[notice.type] || typeColors.general}`}>
                      {notice.type}
                    </span>
                    <span className="flex items-center gap-1 text-xs text-muted">
                      <Calendar size={12} /> {formatDate(notice.created_at)}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold mb-2">{notice.title}</h3>
                  <p className="text-muted leading-relaxed">{notice.content}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
