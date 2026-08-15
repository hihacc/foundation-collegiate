'use client';
export const dynamic = 'force-dynamic';

import { useEffect, useState, useMemo } from 'react';
import SectionHeader from '@/components/ui/SectionHeader';
import { 
  Download as DownloadIcon, FileText, BookOpen, ClipboardList, 
  ExternalLink, Search, CheckCircle, FileCheck, Banknote, Calendar
} from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import type { Download } from '@/types';
import { toast } from 'sonner';
import { formatGoogleDriveDownloadUrl } from '@/lib/utils/googleDrive';

export const defaultDownloadsList: Download[] = [
  {
    id: '110e8400-e29b-41d4-a716-446655440071',
    title: 'Academic Session Syllabus 2026-2027 (Class IX to XII)',
    category: 'Syllabus',
    file_type: 'PDF Document',
    file_size: '2.4 MB',
    description: 'Official comprehensive syllabus, textbook chapters, and subject-wise learning objectives for all matric and intermediate coaching programs.',
    file_url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    download_count: 142,
    is_active: true,
    created_at: new Date().toISOString()
  },
  {
    id: '110e8400-e29b-41d4-a716-446655440072',
    title: 'Official Student Admission Application Form 2026',
    category: 'Form',
    file_type: 'PDF Document',
    file_size: '1.1 MB',
    description: 'Printable student registration and admission application form with parent undertaking and required document checklist.',
    file_url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    download_count: 289,
    is_active: true,
    created_at: new Date().toISOString()
  },
  {
    id: '110e8400-e29b-41d4-a716-446655440073',
    title: 'Monthly Test Schedule & Examination Timetable 2026',
    category: 'Schedule',
    file_type: 'PDF Document',
    file_size: '850 KB',
    description: 'Complete annual examination schedule, monthly chapter assessment dates, and grand revision tests for BSEK and BIEK.',
    file_url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    download_count: 310,
    is_active: true,
    created_at: new Date().toISOString()
  },
  {
    id: '110e8400-e29b-41d4-a716-446655440074',
    title: 'Standard Fee Structure & Fee Challan Guide 2026',
    category: 'Finance',
    file_type: 'PDF Document',
    file_size: '620 KB',
    description: 'Transparent tuition fees breakdown, lab charges, monthly challan payment methods, and scholarship criteria.',
    file_url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    download_count: 195,
    is_active: true,
    created_at: new Date().toISOString()
  },
  {
    id: '110e8400-e29b-41d4-a716-446655440075',
    title: 'Class IX & X Computer Science Model Papers 2026',
    category: 'Syllabus',
    file_type: 'PDF Document',
    file_size: '3.1 MB',
    description: 'Solved board model papers, past 5-year question banks, and programming exercises compiled by senior faculty.',
    file_url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    download_count: 420,
    is_active: true,
    created_at: new Date().toISOString()
  }
];

const categoryColors: Record<string, string> = {
  Syllabus: 'bg-blue-100 text-blue-800 border-blue-200',
  Schedule: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  Form: 'bg-amber-100 text-amber-800 border-amber-200',
  Finance: 'bg-purple-100 text-purple-800 border-purple-200',
};

const categoryIcons: Record<string, typeof FileText> = {
  Syllabus: BookOpen,
  Schedule: Calendar,
  Form: ClipboardList,
  Finance: Banknote,
};

export default function DownloadsPage() {
  const [downloads, setDownloads] = useState<Download[]>(defaultDownloadsList);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  const fetchDownloads = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('downloads')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data && data.length > 0) {
        const active = data.filter((d: any) => d.is_active !== false);
        setDownloads(active as Download[]);
        try { localStorage.setItem('tfc_downloads_cache', JSON.stringify(active)); } catch {}
      } else {
        const local = JSON.parse(localStorage.getItem('tfc_downloads_cache') || '[]');
        setDownloads(local.length > 0 ? local : defaultDownloadsList);
      }
    } catch {
      const local = JSON.parse(localStorage.getItem('tfc_downloads_cache') || '[]');
      setDownloads(local.length > 0 ? local : defaultDownloadsList);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDownloads();
  }, []);

  const handleDownloadFile = (file: Download) => {
    const rawUrl = file.file_url || '';
    const fileUrl = formatGoogleDriveDownloadUrl(rawUrl) || rawUrl;
    const cleanFileName = (file.title || 'document').replace(/[^a-z0-9]/gi, '_');

    // Fire & forget download counter increment safely
    if (file.id) {
      try {
        supabase.from('downloads').update({ download_count: (file.download_count || 0) + 1 }).eq('id', file.id).then(() => {}, () => {});
      } catch {}
    }

    // If valid external link, open it
    if (fileUrl && fileUrl.startsWith('http')) {
      window.open(fileUrl, '_blank', 'noopener,noreferrer');
      toast.success(`Opening document: ${file.title}`);
      return;
    }

    // Generate lightweight downloadable PDF text stub if direct link is local
    const dummyContent = `THE FOUNDATION COLLEGIATE\n\nTitle: ${file.title}\nCategory: ${file.category}\nFile Size: ${file.file_size || 'N/A'}\nDescription: ${file.description || 'Official academic document.'}\n\nDownloaded from: The Foundation Collegiate Online Portal\nWebsite: www.thefoundationcollegiate.com\nAddress: House# 1704, Sector 11-E, Muslim Town, North Karachi\nDate: ${new Date().toLocaleDateString('en-PK')}`;
    
    const blob = new Blob([dummyContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${cleanFileName}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success(`Downloaded: ${file.title}`);
  };

  // Filtered files
  const filteredDownloads = useMemo(() => {
    return downloads.filter(d => {
      const matchesSearch = !search.trim() || 
        d.title.toLowerCase().includes(search.toLowerCase()) ||
        (d.description || '').toLowerCase().includes(search.toLowerCase()) ||
        d.category.toLowerCase().includes(search.toLowerCase());
      
      const matchesCat = selectedCategory === 'All' || d.category.toLowerCase() === selectedCategory.toLowerCase();

      return matchesSearch && matchesCat;
    });
  }, [downloads, search, selectedCategory]);

  return (
    <div className="py-20 bg-slate-50/60 min-h-screen">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-5xl space-y-10">
        
        {/* Page Header */}
        <SectionHeader
          badge="Study Resources & Forms"
          title="Student"
          titleHighlight="Downloads"
          description="Access official syllabus outlines, model test papers, admission forms, and fee schedules in one place."
          className="mb-8"
        />

        {/* Search & Category Filter Bar */}
        <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search syllabus, admission form, timetable, model papers..."
              className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 text-slate-900 rounded-2xl text-sm font-semibold focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all shadow-inner"
            />
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {['All', 'Syllabus', 'Form', 'Schedule', 'Finance'].map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200'
                }`}
              >
                {cat === 'All' ? `All Downloads (${downloads.length})` : cat === 'Finance' ? 'Fee Structure' : `${cat}s`}
              </button>
            ))}
          </div>
        </div>

        {/* Downloads List */}
        <div className="space-y-4">
          {loading ? (
            [...Array(4)].map((_, i) => (
              <div key={i} className="h-28 bg-white border border-slate-200 rounded-3xl animate-pulse" />
            ))
          ) : filteredDownloads.length === 0 ? (
            <div className="text-center py-16 bg-white border border-dashed border-slate-300 rounded-3xl p-8 space-y-2">
              <FileCheck size={40} className="mx-auto text-slate-300" />
              <h3 className="font-bold text-slate-700 text-base">No matching download materials found</h3>
              <p className="text-xs text-slate-400">Try adjusting your search terms or selecting another category.</p>
            </div>
          ) : (
            filteredDownloads.map((file) => {
              const Icon = categoryIcons[file.category] || FileText;

              return (
                <div
                  key={file.id}
                  className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200 shadow-sm hover:shadow-md hover:border-blue-300 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 group"
                >
                  <div className="flex items-start gap-4 min-w-0">
                    <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform shadow-2xs">
                      <Icon size={22} />
                    </div>

                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${categoryColors[file.category] || 'bg-slate-100 text-slate-700 border-slate-200'}`}>
                          {file.category}
                        </span>
                        <span className="text-[11px] font-mono text-slate-400 font-bold">
                          {file.file_size || '1.5 MB'} &bull; {file.file_type || 'PDF Document'}
                        </span>
                      </div>

                      <h3 className="font-display font-bold text-slate-900 group-hover:text-blue-600 transition-colors text-base sm:text-lg leading-snug">
                        {file.title}
                      </h3>

                      {file.description && (
                        <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                          {file.description}
                        </p>
                      )}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleDownloadFile(file)}
                    className="w-full sm:w-auto shrink-0 px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md shadow-blue-600/20 active:scale-95 cursor-pointer"
                    title={`Download ${file.title}`}
                  >
                    <DownloadIcon size={16} />
                    <span>Download PDF</span>
                  </button>
                </div>
              );
            })
          )}
        </div>

        {/* Footer Support Card */}
        <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 text-center space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-100 text-blue-800 text-[11px] font-bold">
            <CheckCircle size={14} className="text-blue-600" /> Need Special Study Material?
          </div>
          <h4 className="font-bold text-slate-800 text-sm sm:text-base">
            Can&apos;t find what you are looking for?
          </h4>
          <p className="text-xs text-slate-600 max-w-lg mx-auto">
            Additional notes, solved formula booklets, and previous board examination questions are available at the institute reception.
          </p>
        </div>

      </div>
    </div>
  );
}
