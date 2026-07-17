'use client';

import { useEffect, useState } from 'react';
import SectionHeader from '@/components/ui/SectionHeader';
import { Download as DownloadIcon, FileText, BookOpen, ClipboardList, ExternalLink } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import type { Download } from '@/types';

const fallbackDownloads: Download[] = [
  { id: '1', title: 'Matric Science Syllabus 2026', category: 'Syllabus', file_url: '', file_size: '2.1 MB', file_type: 'PDF', download_count: 0, is_active: true, created_at: '2026-07-01' },
  { id: '2', title: 'Intermediate Pre-Medical Syllabus', category: 'Syllabus', file_url: '', file_size: '2.4 MB', file_type: 'PDF', download_count: 0, is_active: true, created_at: '2026-07-01' },
  { id: '3', title: 'Monthly Test Timetable — July 2026', category: 'Schedule', file_url: '', file_size: '0.5 MB', file_type: 'PDF', download_count: 0, is_active: true, created_at: '2026-07-01' },
  { id: '4', title: 'Admission Form 2026', category: 'Form', file_url: '', file_size: '0.8 MB', file_type: 'PDF', download_count: 0, is_active: true, created_at: '2026-07-01' },
  { id: '5', title: 'Fee Structure 2026', category: 'Finance', file_url: '', file_size: '0.3 MB', file_type: 'PDF', download_count: 0, is_active: true, created_at: '2026-07-01' },
];

const categoryColors: Record<string, string> = {
  Syllabus: 'bg-blue-100 text-blue-700',
  Schedule: 'bg-emerald-100 text-emerald-700',
  Form: 'bg-amber-100 text-amber-700',
  Finance: 'bg-purple-100 text-purple-700',
};

const categoryIcons: Record<string, typeof FileText> = {
  Syllabus: BookOpen,
  Schedule: ClipboardList,
  Form: FileText,
  Finance: FileText,
};

export default function DownloadsPage() {
  const [downloads, setDownloads] = useState<Download[]>(fallbackDownloads);
  const [isLive, setIsLive] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data, error } = await supabase
          .from('downloads')
          .select('*')
          .eq('is_active', true)
          .order('created_at', { ascending: false });
        if (cancelled) return;
        if (error || !data || !data.length) return;
        setDownloads(data as Download[]);
        setIsLive(true);
      } catch {
        // keep fallback silently
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const handleDownload = (file: Download) => {
    // Fire-and-forget download count increment
    supabase
      .from('downloads')
      .update({ download_count: (file.download_count || 0) + 1 })
      .eq('id', file.id)
      .then(() => {}, () => {});
  };

  return (
    <div className="py-20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl">
        <SectionHeader
          badge="Resources"
          title="Student"
          titleHighlight="Downloads"
          description="Access all the important study materials, schedules, and forms in one place."
          className="mb-12"
        />

        <div className="space-y-4">
          {downloads.map((file) => {
            const Icon = categoryIcons[file.category] || FileText;
            return (
            <div
              key={file.id}
              className="glass-card p-5 rounded-2xl flex items-center gap-4 hover:border-primary/30 hover:shadow-md transition-all group"
            >
              <div className="w-12 h-12 bg-primary/10 text-primary rounded-xl flex items-center justify-center shrink-0">
                <Icon size={24} />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-foreground group-hover:text-primary transition-colors truncate">{file.title}</h3>
                <div className="flex items-center gap-3 mt-1">
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${categoryColors[file.category] || 'bg-slate-100 text-slate-700'}`}>
                    {file.category}
                  </span>
                  <span className="text-xs text-muted">
                    {[file.file_type, file.file_size].filter(Boolean).join(' • ')}
                  </span>
                </div>
              </div>
              {isLive && file.file_url ? (
                <a
                  href={file.file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  download
                  onClick={() => handleDownload(file)}
                  className="shrink-0 w-10 h-10 bg-primary/10 hover:bg-primary text-primary hover:text-white rounded-xl flex items-center justify-center transition-colors ml-auto"
                >
                  <DownloadIcon size={18} />
                </a>
              ) : (
                <button
                  disabled
                  title="Coming soon"
                  className="shrink-0 w-10 h-10 bg-primary/10 text-primary rounded-xl flex items-center justify-center ml-auto opacity-50 cursor-not-allowed"
                >
                  <DownloadIcon size={18} />
                </button>
              )}
            </div>
            );
          })}
        </div>

        <div className="mt-10 glass-card p-6 rounded-2xl border-dashed border-2 border-border text-center">
          <ExternalLink size={28} className="text-muted mx-auto mb-3" />
          <p className="text-muted text-sm">More resources are uploaded regularly. Check back soon or contact us for specific materials.</p>
        </div>
      </div>
    </div>
  );
}
