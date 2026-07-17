import type { Metadata } from 'next';
import SectionHeader from '@/components/ui/SectionHeader';
import { Download, FileText, BookOpen, ClipboardList, ExternalLink } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Downloads | Study Material',
  description: 'Download past papers, schedules, syllabuses, and other important documents from The Foundation Collegiate.',
};

const downloads = [
  { id: 1, title: 'Matric Science Syllabus 2026', category: 'Syllabus', icon: BookOpen, size: '2.1 MB', type: 'PDF' },
  { id: 2, title: 'Intermediate Pre-Medical Syllabus', category: 'Syllabus', icon: BookOpen, size: '2.4 MB', type: 'PDF' },
  { id: 3, title: 'Monthly Test Timetable — July 2026', category: 'Schedule', icon: ClipboardList, size: '0.5 MB', type: 'PDF' },
  { id: 4, title: 'Admission Form 2026', category: 'Form', icon: FileText, size: '0.8 MB', type: 'PDF' },
  { id: 5, title: 'Fee Structure 2026', category: 'Finance', icon: FileText, size: '0.3 MB', type: 'PDF' },
];

const categoryColors: Record<string, string> = {
  Syllabus: 'bg-blue-100 text-blue-700',
  Schedule: 'bg-emerald-100 text-emerald-700',
  Form: 'bg-amber-100 text-amber-700',
  Finance: 'bg-purple-100 text-purple-700',
};

export default function DownloadsPage() {
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
          {downloads.map((file) => (
            <div
              key={file.id}
              className="glass-card p-5 rounded-2xl flex items-center gap-4 hover:border-primary/30 hover:shadow-md transition-all group"
            >
              <div className="w-12 h-12 bg-primary/10 text-primary rounded-xl flex items-center justify-center shrink-0">
                <file.icon size={24} />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-foreground group-hover:text-primary transition-colors truncate">{file.title}</h3>
                <div className="flex items-center gap-3 mt-1">
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${categoryColors[file.category]}`}>
                    {file.category}
                  </span>
                  <span className="text-xs text-muted">{file.type} • {file.size}</span>
                </div>
              </div>
              <button className="shrink-0 w-10 h-10 bg-primary/10 hover:bg-primary text-primary hover:text-white rounded-xl flex items-center justify-center transition-colors ml-auto">
                <Download size={18} />
              </button>
            </div>
          ))}
        </div>

        <div className="mt-10 glass-card p-6 rounded-2xl border-dashed border-2 border-border text-center">
          <ExternalLink size={28} className="text-muted mx-auto mb-3" />
          <p className="text-muted text-sm">More resources are uploaded regularly. Check back soon or contact us for specific materials.</p>
        </div>
      </div>
    </div>
  );
}
