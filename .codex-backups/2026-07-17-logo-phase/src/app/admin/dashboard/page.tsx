'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { Users, FileText, MessageSquare, ClipboardList, TrendingUp, Activity, ShieldAlert } from 'lucide-react';
import { formatRelativeTime } from '@/lib/utils/grades';
import { Admission } from '@/lib/types';
import { motion } from 'framer-motion';

interface Stats {
  results: number;
  messages: number;
  admissions: number;
  unread_messages: number;
  pending_admissions: number;
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<Stats>({ results: 0, messages: 0, admissions: 0, unread_messages: 0, pending_admissions: 0 });
  const [recentAdmissions, setRecentAdmissions] = useState<Partial<Admission>[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [
          { count: results, error: e1 },
          { count: messages, error: e2 },
          { count: admissions, error: e3 },
          { count: unread_messages, error: e4 },
          { count: pending_admissions, error: e5 },
          { data: recentData, error: e6 },
        ] = await Promise.all([
          supabase.from('results').select('*', { count: 'exact', head: true }),
          supabase.from('messages').select('*', { count: 'exact', head: true }),
          supabase.from('admissions').select('*', { count: 'exact', head: true }),
          supabase.from('messages').select('*', { count: 'exact', head: true }).eq('is_read', false),
          supabase.from('admissions').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
          supabase.from('admissions').select('student_name, class_applied, status, created_at').order('created_at', { ascending: false }).limit(5),
        ]);

        if (e1 || e2 || e3 || e4 || e5 || e6) throw new Error('Failed to fetch data');

        setStats({
          results: results ?? 0,
          messages: messages ?? 0,
          admissions: admissions ?? 0,
          unread_messages: unread_messages ?? 0,
          pending_admissions: pending_admissions ?? 0,
        });
        setRecentAdmissions(recentData as Partial<Admission>[] || []);
      } catch (err) {
        console.error(err);
        setError(true);
        // Premium fallback data for preview
        setStats({ results: 142, messages: 8, admissions: 34, unread_messages: 2, pending_admissions: 5 });
        setRecentAdmissions([
          { student_name: 'Bilal Qureshi', class_applied: 'Pre-Engineering', status: 'pending', created_at: new Date().toISOString() },
          { student_name: 'Ayesha Tarik', class_applied: 'Pre-Medical', status: 'approved', created_at: new Date(Date.now() - 3600000).toISOString() },
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const cards = [
    { label: 'Total Results', value: stats.results, icon: FileText, color: 'blue', href: '/admin/dashboard/results' },
    { label: 'Total Admissions', value: stats.admissions, icon: ClipboardList, color: 'green', href: '/admin/dashboard/admissions' },
    { label: 'Messages', value: stats.messages, icon: MessageSquare, color: 'purple', badge: stats.unread_messages, href: '/admin/dashboard/messages' },
    { label: 'Pending Applications', value: stats.pending_admissions, icon: TrendingUp, color: 'amber', href: '/admin/dashboard/admissions' },
  ];

  const statusColor: Record<string, string> = {
    pending: 'bg-amber-500/10 text-amber-400 border border-amber-500/20',
    approved: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
    rejected: 'bg-red-500/10 text-red-400 border border-red-500/20',
    interview: 'bg-blue-500/10 text-blue-400 border border-blue-500/20',
  };

  const cardColors: Record<string, { bg: string, border: string }> = {
    blue: { bg: 'bg-[#0057FF]/10 text-[#0057FF]', border: 'group-hover:border-[#0057FF]/30' },
    green: { bg: 'bg-emerald-500/10 text-emerald-400', border: 'group-hover:border-emerald-500/30' },
    purple: { bg: 'bg-purple-500/10 text-purple-400', border: 'group-hover:border-purple-500/30' },
    amber: { bg: 'bg-amber-500/10 text-amber-400', border: 'group-hover:border-amber-500/30' },
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-white">Dashboard</h1>
          <p className="text-white/50 mt-1">Welcome back! Here&apos;s what&apos;s happening at The Foundation Collegiate.</p>
        </div>
      </div>

      {error && (
        <div className="bg-[#D72638]/10 border border-[#D72638]/20 text-[#D72638] px-4 py-3 rounded-xl flex items-center gap-3 text-sm">
          <ShieldAlert size={18} className="shrink-0" />
          <p>Database connection failed. Displaying preview data.</p>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        {cards.map((card, idx) => (
          <motion.a
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            key={card.label}
            href={card.href}
            className={`bg-[#0a0f1e] border border-white/5 rounded-2xl p-6 transition-all group hover:shadow-[0_8px_30px_rgba(0,0,0,0.12)] ${cardColors[card.color].border}`}
          >
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110 ${cardColors[card.color].bg}`}>
              <card.icon size={24} />
            </div>
            <div className="text-3xl font-display font-bold text-white mb-1">
              {loading ? <div className="h-8 w-16 rounded bg-white/5 animate-pulse" /> : card.value.toLocaleString()}
            </div>
            <div className="text-sm text-white/50 font-medium">{card.label}</div>
            {card.badge !== undefined && card.badge > 0 && (
              <div className="absolute top-5 right-5 w-6 h-6 bg-[#D72638] rounded-full flex items-center justify-center text-white text-xs font-bold shadow-[0_0_10px_rgba(215,38,56,0.5)]">
                {card.badge}
              </div>
            )}
          </motion.a>
        ))}
      </div>

      {/* Recent Admissions */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-[#0a0f1e] border border-white/5 rounded-2xl overflow-hidden shadow-[0_8px_30px_rgba(0,0,0,0.12)]"
      >
        <div className="flex items-center justify-between px-6 py-5 border-b border-white/10 bg-white/5">
          <h2 className="font-bold text-white flex items-center gap-2">
            <Activity size={18} className="text-[#0057FF]" />
            Recent Admission Applications
          </h2>
          <a href="/admin/dashboard/admissions" className="text-sm text-[#0057FF] hover:text-[#4d8bff] transition-colors font-medium">View all</a>
        </div>

        {loading ? (
          <div className="p-6 space-y-3">
            {[...Array(5)].map((_, i) => <div key={i} className="h-16 rounded-xl bg-white/5 animate-pulse" />)}
          </div>
        ) : recentAdmissions.length === 0 ? (
          <div className="p-16 text-center flex flex-col items-center">
            <ClipboardList size={40} className="text-white/20 mb-3" />
            <p className="text-white/60 font-medium">No applications yet.</p>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {recentAdmissions.map((adm, idx) => (
              <div key={idx} className="flex items-center justify-between px-6 py-4 hover:bg-white/5 transition-colors group">
                <div>
                  <p className="font-bold text-white group-hover:text-[#0057FF] transition-colors">{adm.student_name}</p>
                  <p className="text-sm text-white/50">{adm.class_applied}</p>
                </div>
                <div className="text-right">
                  <span className={`text-[10px] uppercase tracking-wider font-bold px-2.5 py-1 rounded-md ${statusColor[adm.status || ''] || 'bg-white/10 text-white/50 border border-white/10'}`}>
                    {adm.status}
                  </span>
                  {adm.created_at && (
                    <p className="text-xs text-white/40 mt-1.5">{formatRelativeTime(adm.created_at)}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}
