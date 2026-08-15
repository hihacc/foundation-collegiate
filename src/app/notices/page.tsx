'use client';

import { useEffect, useState } from 'react';
import SectionHeader from '@/components/ui/SectionHeader';
import { Bell, Calendar, Pin } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import type { Notice } from '@/types';
import { getStoredData, setStoredData } from '@/lib/utils/storage';

const fallbackNotices: Notice[] = [
  { id: '110e8400-e29b-41d4-a716-446655440091', title: 'Admissions Open for Session 2026', content: 'We are pleased to announce that admissions are now open for the 2026 academic session. Apply early to secure your seat. Limited seats available for Class 9, 10, XI & XII.', created_at: new Date().toISOString(), type: 'important', is_pinned: true, is_active: true },
  { id: '220e8400-e29b-41d4-a716-446655440092', title: 'Monthly Test Result Announced', content: 'Results of the June 2026 Monthly Exam have been uploaded. Students can check their results through the Result Checker portal using their Roll Number and PIN.', created_at: new Date(Date.now() - 86400000).toISOString(), type: 'result', is_pinned: false, is_active: true },
  { id: '330e8400-e29b-41d4-a716-446655440093', title: 'Parent-Teacher Meeting Notice', content: 'A Parent-Teacher Meeting is scheduled for Saturday. Parents are requested to attend and discuss their child\'s academic performance.', created_at: new Date(Date.now() - 172800000).toISOString(), type: 'event', is_pinned: false, is_active: true },
  { id: '440e8400-e29b-41d4-a716-446655440094', title: 'Summer Vacations Schedule', content: 'The institute will follow updated summer timing from 4:00 PM to 9:00 PM starting next week.', created_at: new Date(Date.now() - 259200000).toISOString(), type: 'holiday', is_pinned: false, is_active: true },
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
  const [notices, setNotices] = useState<Notice[]>(() => getStoredData('notices', fallbackNotices));

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
        if (!error && data && data.length > 0) {
          setNotices(data as Notice[]);
          setStoredData('notices', data as Notice[]);
        } else {
          setNotices(getStoredData('notices', fallbackNotices));
        }
      } catch {
        setNotices(getStoredData('notices', fallbackNotices));
      }
    })();
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="py-20 bg-[var(--background)]">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl">
        <SectionHeader
          badge="Announcements"
          title="Notice"
          titleHighlight="Board"
          description="Stay updated with the latest announcements, events, and important notices from The Foundation Collegiate."
          className="mb-12"
        />

        <div className="space-y-6">
          {notices.map((notice) => (
            <div
              key={notice.id}
              className={`clay-card rounded-2xl p-6 md:p-8 transition-all bg-white ${notice.is_pinned ? 'border-2 border-amber-400 bg-amber-50/30' : 'border border-slate-200'}`}
            >
              <div className="flex items-start gap-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${notice.is_pinned ? 'bg-amber-100 text-amber-600' : 'bg-primary/10 text-primary'}`}>
                  {notice.is_pinned ? <Pin size={22} /> : <Bell size={22} />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-3 mb-2">
                    {notice.is_pinned && (
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 border border-amber-200">
                        📌 Pinned Notice
                      </span>
                    )}
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${typeColors[notice.type] || typeColors.general}`}>
                      {notice.type}
                    </span>
                    <span className="flex items-center gap-1 text-xs text-slate-500 font-medium">
                      <Calendar size={12} /> {formatDate(notice.created_at)}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-slate-800 mb-2">{notice.title}</h3>
                  <p className="text-slate-600 leading-relaxed text-sm md:text-base">{notice.content}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
