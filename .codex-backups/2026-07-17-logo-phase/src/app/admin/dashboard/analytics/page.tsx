'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { BarChart3, TrendingUp, Eye } from 'lucide-react';

export default function AdminAnalyticsPage() {
  const [stats, setStats] = useState({ total_results: 0, total_admissions: 0, total_messages: 0, total_teachers: 0 });

  useEffect(() => {
    Promise.all([
      supabase.from('results').select('*', { count: 'exact', head: true }),
      supabase.from('admissions').select('*', { count: 'exact', head: true }),
      supabase.from('messages').select('*', { count: 'exact', head: true }),
      supabase.from('teachers').select('*', { count: 'exact', head: true }),
    ]).then(([r, a, m, t]) => {
      setStats({
        total_results: r.count ?? 0,
        total_admissions: a.count ?? 0,
        total_messages: m.count ?? 0,
        total_teachers: t.count ?? 0,
      });
    });
  }, []);

  const cards = [
    { label: 'Total Results Uploaded', value: stats.total_results, icon: BarChart3, color: 'blue' },
    { label: 'Total Applications', value: stats.total_admissions, icon: TrendingUp, color: 'green' },
    { label: 'Contact Messages', value: stats.total_messages, icon: Eye, color: 'purple' },
    { label: 'Active Teachers', value: stats.total_teachers, icon: BarChart3, color: 'amber' },
  ];

  const colorMap: Record<string, string> = {
    blue: 'bg-blue-500/10 text-blue-400',
    green: 'bg-emerald-500/10 text-emerald-400',
    purple: 'bg-purple-500/10 text-purple-400',
    amber: 'bg-amber-500/10 text-amber-400',
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-display font-bold text-white">Analytics</h1>
        <p className="text-slate-400 text-sm mt-1">Overview of your website activity</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        {cards.map(card => (
          <div key={card.label} className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${colorMap[card.color]}`}>
              <card.icon size={24} />
            </div>
            <div className="text-4xl font-display font-bold text-white mb-2">{card.value.toLocaleString()}</div>
            <div className="text-sm text-slate-400">{card.label}</div>
          </div>
        ))}
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center text-slate-500">
        <BarChart3 size={48} className="mx-auto mb-4 opacity-20" />
        <p className="font-medium">Detailed charts powered by Cloudflare Analytics are available in your Cloudflare Dashboard.</p>
        <a href="https://dash.cloudflare.com" target="_blank" rel="noreferrer"
          className="inline-block mt-4 text-primary hover:underline text-sm">
          Open Cloudflare Dashboard →
        </a>
      </div>
    </div>
  );
}
