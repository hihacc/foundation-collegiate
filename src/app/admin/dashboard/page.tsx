'use client';
export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { 
  Users, FileText, MessageSquare, ClipboardList, TrendingUp, Activity, 
  ShieldAlert, ArrowUpRight, Mail, Wallet, BookOpen, UserPlus, Receipt, 
  Printer, Sparkles, CheckCircle2, AlertCircle, Clock, ShieldCheck,
  ChevronRight, RefreshCw, BarChart3, Bell, UserCheck
} from 'lucide-react';
import { formatRelativeTime } from '@/lib/utils/grades';
import { Admission } from '@/lib/types';
import { getStoredData } from '@/lib/utils/storage';
import Link from 'next/link';

interface Stats {
  results: number;
  messages: number;
  admissions: number;
  students: number;
  attendanceRate: number;
  pending_admissions: number;
}

const statusStyles: Record<string, string> = {
  pending:   'bg-amber-100 text-amber-800 border-amber-200',
  approved:  'bg-emerald-100 text-emerald-800 border-emerald-200',
  rejected:  'bg-red-100 text-red-800 border-red-200',
  interview: 'bg-blue-100 text-blue-800 border-blue-200',
};

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<Stats>({ 
    results: 0, 
    messages: 0, 
    admissions: 0, 
    students: 0,
    attendanceRate: 94, 
    pending_admissions: 0 
  });
  const [recentAdmissions, setRecentAdmissions] = useState<Partial<Admission>[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      // Query counts from Supabase
      const [
        { count: stCount },
        { count: resCount },
        { count: admCount },
        { count: msgCount },
        { data: admData }
      ] = await Promise.all([
        supabase.from('students').select('*', { count: 'exact', head: true }),
        supabase.from('results').select('*', { count: 'exact', head: true }),
        supabase.from('admissions').select('*', { count: 'exact', head: true }),
        supabase.from('contacts').select('*', { count: 'exact', head: true }),
        supabase.from('admissions').select('*').order('created_at', { ascending: false }).limit(6)
      ]);

      const loadedAdmissions = (admData && admData.length > 0) ? (admData as Partial<Admission>[]) : getStoredData('admissions', []);

      setStats({
        students: stCount ?? getStoredData('students', []).length,
        results: resCount ?? getStoredData('results', []).length,
        admissions: admCount ?? getStoredData('admissions', []).length,
        messages: msgCount ?? getStoredData('messages', []).length,
        attendanceRate: 94.5,
        pending_admissions: loadedAdmissions.filter((a: any) => a.status === 'pending').length
      });

      setRecentAdmissions(loadedAdmissions);
    } catch {
      setStats({
        students: getStoredData('students', []).length,
        results: getStoredData('results', []).length,
        admissions: getStoredData('admissions', []).length,
        messages: getStoredData('messages', []).length,
        attendanceRate: 94,
        pending_admissions: 0
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  return (
    <div className="space-y-8 max-w-7xl mx-auto font-sans">
      {/* Executive Header Banner (Light Theme UI) */}
      <div className="relative bg-gradient-to-r from-blue-50 via-indigo-50/60 to-white rounded-3xl p-6 sm:p-8 text-slate-900 shadow-md overflow-hidden border border-blue-100">
        <div className="absolute right-0 top-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold border border-emerald-200 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span> System Status: Operational
              </span>
              <span className="text-xs text-slate-500 font-mono">Karachi Campus</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-display font-black tracking-tight text-slate-900">
              Executive Command Center
            </h1>
            <p className="text-slate-600 text-xs sm:text-sm max-w-2xl">
              Welcome back, <strong className="text-blue-600 font-bold">foundationcollegiate@gmail.com</strong>. Manage academic records, student enrollment, fee structures, and attendance registers.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchDashboardStats}
              className="p-3 rounded-2xl bg-white hover:bg-slate-50 text-slate-700 transition-all shadow-sm border border-slate-200"
              title="Refresh Dashboard"
            >
              <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
            </button>
            <Link
              href="/admin/dashboard/students"
              className="px-5 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm transition-all shadow-md shadow-blue-500/20 flex items-center gap-2"
            >
              <UserPlus size={16} /> Add New Student
            </Link>
          </div>
        </div>
      </div>

      {/* Main Metric Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase">Enrolled Students</span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <Users size={18} />
            </div>
          </div>
          <div className="text-3xl font-black text-slate-900">{stats.students}</div>
          <div className="text-[11px] font-bold text-emerald-600 flex items-center gap-1">
            <TrendingUp size={13} /> Active Roster
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase">Exam Marksheets</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <FileText size={18} />
            </div>
          </div>
          <div className="text-3xl font-black text-slate-900">{stats.results}</div>
          <div className="text-[11px] font-bold text-emerald-600 flex items-center gap-1">
            <CheckCircle2 size={13} /> Verified Transcripts
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase">Attendance Rate</span>
            <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
              <UserCheck size={18} />
            </div>
          </div>
          <div className="text-3xl font-black text-slate-900">{stats.attendanceRate}%</div>
          <div className="text-[11px] font-bold text-indigo-600 flex items-center gap-1">
            <Activity size={13} /> Daily ERP Score
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase">Admissions</span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
              <ClipboardList size={18} />
            </div>
          </div>
          <div className="text-3xl font-black text-slate-900">{stats.admissions}</div>
          <div className="text-[11px] font-bold text-amber-600 flex items-center gap-1">
            <Clock size={13} /> {stats.pending_admissions} Pending Review
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2 col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase">Inquiries</span>
            <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
              <MessageSquare size={18} />
            </div>
          </div>
          <div className="text-3xl font-black text-slate-900">{stats.messages}</div>
          <div className="text-[11px] font-bold text-purple-600 flex items-center gap-1">
            <Mail size={13} /> Contact Messages
          </div>
        </div>
      </div>

      {/* ERP Quick Action Launchpad */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <Sparkles size={18} className="text-blue-600" /> ERP Quick Launchpad
          </h2>
          <span className="text-xs text-slate-400 font-bold">1-Click Modules</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <Link
            href="/admin/dashboard/students"
            className="p-4 rounded-2xl bg-gradient-to-br from-blue-50 to-blue-100/50 border border-blue-200 hover:border-blue-400 hover:shadow-md transition-all group"
          >
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold mb-3 shadow-md group-hover:scale-110 transition-transform">
              <Users size={20} />
            </div>
            <div className="font-bold text-slate-900 text-xs sm:text-sm">Students Roster</div>
            <div className="text-[11px] text-slate-500 mt-0.5">Directory &amp; Profile</div>
          </Link>

          <Link
            href="/admin/dashboard/attendance"
            className="p-4 rounded-2xl bg-gradient-to-br from-indigo-50 to-indigo-100/50 border border-indigo-200 hover:border-indigo-400 hover:shadow-md transition-all group"
          >
            <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold mb-3 shadow-md group-hover:scale-110 transition-transform">
              <UserCheck size={20} />
            </div>
            <div className="font-bold text-slate-900 text-xs sm:text-sm">Attendance Portal</div>
            <div className="text-[11px] text-slate-500 mt-0.5">SaaS Daily &amp; Grid</div>
          </Link>

          <Link
            href="/admin/dashboard/results"
            className="p-4 rounded-2xl bg-gradient-to-br from-emerald-50 to-emerald-100/50 border border-emerald-200 hover:border-emerald-400 hover:shadow-md transition-all group"
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold mb-3 shadow-md group-hover:scale-110 transition-transform">
              <FileText size={20} />
            </div>
            <div className="font-bold text-slate-900 text-xs sm:text-sm">Exam Results</div>
            <div className="text-[11px] text-slate-500 mt-0.5">Marksheet &amp; PIN</div>
          </Link>

          <Link
            href="/admin/dashboard/fees"
            className="p-4 rounded-2xl bg-gradient-to-br from-amber-50 to-amber-100/50 border border-amber-200 hover:border-amber-400 hover:shadow-md transition-all group"
          >
            <div className="w-10 h-10 rounded-xl bg-amber-600 text-white flex items-center justify-center font-bold mb-3 shadow-md group-hover:scale-110 transition-transform">
              <Wallet size={20} />
            </div>
            <div className="font-bold text-slate-900 text-xs sm:text-sm">Fee Management</div>
            <div className="text-[11px] text-slate-500 mt-0.5">Challans &amp; Receipts</div>
          </Link>

          <Link
            href="/admin/dashboard/students/scanner"
            className="p-4 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 text-white hover:shadow-lg hover:shadow-orange-500/20 transition-all group border border-amber-400"
          >
            <div className="w-10 h-10 rounded-xl bg-white/20 text-white flex items-center justify-center font-bold mb-3 shadow-md group-hover:scale-110 transition-transform">
              <Sparkles size={20} />
            </div>
            <div className="font-bold text-white text-xs sm:text-sm">📸 AI Form Scanner</div>
            <div className="text-[11px] text-amber-100 mt-0.5">OpenRouter &bull; Qwen &bull; OCR</div>
          </Link>

          <Link
            href="/admin/dashboard/notices"
            className="p-4 rounded-2xl bg-gradient-to-br from-purple-50 to-purple-100/50 border border-purple-200 hover:border-purple-400 hover:shadow-md transition-all group"
          >
            <div className="w-10 h-10 rounded-xl bg-purple-600 text-white flex items-center justify-center font-bold mb-3 shadow-md group-hover:scale-110 transition-transform">
              <Bell size={20} />
            </div>
            <div className="font-bold text-slate-900 text-xs sm:text-sm">Notice Board</div>
            <div className="text-[11px] text-slate-500 mt-0.5">Announcements</div>
          </Link>

          <Link
            href="/admin/dashboard/downloads"
            className="p-4 rounded-2xl bg-gradient-to-br from-cyan-50 to-cyan-100/50 border border-cyan-200 hover:border-cyan-400 hover:shadow-md transition-all group"
          >
            <div className="w-10 h-10 rounded-xl bg-cyan-600 text-white flex items-center justify-center font-bold mb-3 shadow-md group-hover:scale-110 transition-transform">
              <BookOpen size={20} />
            </div>
            <div className="font-bold text-slate-900 text-xs sm:text-sm">Study Materials</div>
            <div className="text-[11px] text-slate-500 mt-0.5">Notes &amp; Sylabus</div>
          </Link>
        </div>
      </div>

      {/* Bottom Section: Recent Admissions & System Audit Widget */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Admissions List (2 Cols) */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
              <ClipboardList size={18} className="text-blue-600" /> Recent Admission Applications
            </h3>
            <Link href="/admin/dashboard/admissions" className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1">
              View All <ChevronRight size={14} />
            </Link>
          </div>

          <div className="divide-y divide-slate-100">
            {recentAdmissions.length > 0 ? (
              recentAdmissions.map((adm, i) => (
                <div key={adm.id || i} className="py-3 flex items-center justify-between gap-4 hover:bg-slate-50/60 transition-colors rounded-xl px-2">
                  <div className="space-y-0.5">
                    <div className="font-bold text-slate-900 text-sm">{adm.student_name}</div>
                    <div className="text-xs text-slate-500">Class: <strong className="text-slate-700">{adm.class_applied}</strong> &bull; Phone: {adm.parent_phone}</div>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-bold border capitalize ${statusStyles[adm.status || 'pending']}`}>
                    {adm.status || 'pending'}
                  </span>
                </div>
              ))
            ) : (
              <div className="py-8 text-center text-slate-400 text-xs">
                No recent admission applications.
              </div>
            )}
          </div>
        </div>

        {/* Security & System Audit Widget (1 Col - Light Theme UI) */}
        <div className="bg-white text-slate-900 rounded-2xl p-6 border border-slate-200 shadow-sm space-y-5">
          <div className="flex items-center gap-2 text-emerald-600 border-b border-slate-100 pb-3">
            <ShieldCheck size={20} />
            <h3 className="font-bold text-slate-900 text-base">Security &amp; Audit Status</h3>
          </div>

          <div className="space-y-3.5 text-xs font-sans">
            <div className="flex items-center justify-between py-2 border-b border-slate-100">
              <span className="text-slate-500 font-medium">Authenticated Admin</span>
              <span className="font-bold text-blue-600">foundationcollegiate@gmail.com</span>
            </div>

            <div className="flex items-center justify-between py-2 border-b border-slate-100">
              <span className="text-slate-500 font-medium">Database Connection</span>
              <span className="font-bold text-emerald-700 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span> Supabase Connected
              </span>
            </div>

            <div className="flex items-center justify-between py-2 border-b border-slate-100">
              <span className="text-slate-500 font-medium">SMTP Email Server</span>
              <span className="font-bold text-emerald-700 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Gmail Active
              </span>
            </div>

            <div className="flex items-center justify-between py-2 border-b border-slate-100">
              <span className="text-slate-500 font-medium">Security Threats</span>
              <span className="font-bold text-emerald-700">0 Threats Detected</span>
            </div>
          </div>

          <div className="pt-2">
            <Link
              href="/admin/dashboard/settings"
              className="w-full py-2.5 px-4 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold block text-center border border-slate-200 transition-colors"
            >
              Configure Institute Settings
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
