'use client';
export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { BarChart3, TrendingUp, MessageSquare, UserCog, Users, Banknote, ShieldCheck, ArrowUpRight, Award, ExternalLink, Calendar } from 'lucide-react';
import { m } from 'framer-motion';
import { getStoredData } from '@/lib/utils/storage';

export default function AdminAnalyticsPage() {
  const [stats, setStats] = useState({
    total_students: 0,
    total_results: 0,
    total_admissions: 0,
    total_messages: 0,
    total_teachers: 0,
    fee_collected: 0,
    pending_dues: 0,
    overdue_dues: 0,
    total_discounts: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAnalytics() {
      try {
        const [rRes, aRes, mRes, tRes, sRes, chRes, txRes] = await Promise.all([
          supabase.from('results').select('*', { count: 'exact', head: true }),
          supabase.from('admissions').select('*', { count: 'exact', head: true }),
          supabase.from('contacts').select('*', { count: 'exact', head: true }),
          supabase.from('teachers').select('*', { count: 'exact', head: true }),
          supabase.from('students').select('*', { count: 'exact', head: true }).eq('is_active', true),
          supabase.from('fee_challans').select('*'),
          supabase.from('fee_transactions').select('*').eq('status', 'Success'),
        ]);

        const challans = chRes.data || getStoredData('fee_challans', []);
        const transactions = txRes.data || getStoredData('fee_transactions', []);
        const localStudents = getStoredData('students', []);
        const localResults = getStoredData('results', []);
        const localAdmissions = getStoredData('admissions', []);

        let collected = 0;
        let pending = 0;
        let overdue = 0;
        let discounts = 0;

        challans.forEach((c: any) => {
          discounts += Number(c.discount_applied || 0);
          if (c.status === 'Pending' || c.status === 'Partially Paid') {
            const rem = Number(c.net_payable) - Number(c.paid_amount || 0);
            if (new Date(c.due_date) < new Date()) {
              overdue += rem;
            } else {
              pending += rem;
            }
          }
        });

        transactions.forEach((tx: any) => {
          collected += Number(tx.amount_paid || 0);
        });

        setStats({
          total_students: sRes.count || localStudents.length,
          total_results: rRes.count || localResults.length,
          total_admissions: aRes.count || localAdmissions.length,
          total_messages: mRes.count || getStoredData('contacts', []).length,
          total_teachers: tRes.count || getStoredData('teachers', []).length,
          fee_collected: collected,
          pending_dues: pending,
          overdue_dues: overdue,
          total_discounts: discounts,
        });
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchAnalytics();
  }, []);

  const cards = [
    { label: 'Active Students', value: stats.total_students, icon: Users, color: 'text-blue-600 bg-blue-50', grad: 'from-blue-500 to-blue-700' },
    { label: 'Total Results Uploaded', value: stats.total_results, icon: BarChart3, color: 'text-emerald-600 bg-emerald-50', grad: 'from-emerald-500 to-emerald-700' },
    { label: 'Admission Applications', value: stats.total_admissions, icon: TrendingUp, color: 'text-amber-600 bg-amber-50', grad: 'from-amber-400 to-amber-600' },
    { label: 'Total Fee Collected', value: `Rs. ${stats.fee_collected.toLocaleString()}`, icon: Banknote, color: 'text-violet-600 bg-violet-50', grad: 'from-violet-500 to-violet-700' },
  ];

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl sm:text-3xl font-display font-bold text-slate-800">Advanced ERP & Site Analytics</h1>
        <p className="text-slate-500 mt-1 text-sm sm:text-base">Comprehensive performance indicators, academic grade distributions, and financial health metrics.</p>
      </div>

      {/* Top Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {cards.map((card, idx) => (
          <m.div
            key={card.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.08 }}
            className="relative bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:shadow-lg hover:shadow-slate-200/80 hover:-translate-y-0.5 transition-all duration-200 group overflow-hidden"
          >
            <div className="flex items-start justify-between mb-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${card.color} group-hover:scale-110 transition-transform`}>
                <card.icon size={22} />
              </div>
              <ArrowUpRight size={16} className="text-slate-300 group-hover:text-slate-500 transition-colors" />
            </div>
            {loading ? (
              <div className="h-9 w-24 rounded-lg skeleton mb-1.5" />
            ) : (
              <div className="text-3xl font-display font-bold text-slate-800">
                {card.value}
              </div>
            )}
            <div className="text-sm text-slate-500 font-medium mt-1">{card.label}</div>
            <div className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${card.grad} opacity-0 group-hover:opacity-100 transition-opacity`} />
          </m.div>
        ))}
      </div>

      {/* Visual Analytics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Grade Distribution Chart */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">
          <div className="flex justify-between items-center border-b border-slate-100 pb-4">
            <div>
              <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                <Award className="text-amber-500" size={20} /> Academic Performance Distribution
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">Grade ratio across Matriculation & Intermediate Board Exams.</p>
            </div>
            <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200">
              98% Success Rate
            </span>
          </div>

          <div className="space-y-4">
            {[
              { grade: 'A-1 Grade (80%+)', percent: 72, color: 'bg-emerald-500' },
              { grade: 'A Grade (70-79%)', percent: 20, color: 'bg-blue-500' },
              { grade: 'B Grade (60-69%)', percent: 6, color: 'bg-amber-500' },
              { grade: 'C Grade (50-59%)', percent: 2, color: 'bg-purple-500' },
            ].map(item => (
              <div key={item.grade} className="space-y-1.5">
                <div className="flex justify-between text-xs font-semibold text-slate-700">
                  <span>{item.grade}</span>
                  <span className="font-mono">{item.percent}%</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                  <div className={`h-full ${item.color} rounded-full transition-all duration-1000`} style={{ width: `${item.percent}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Financial Breakdown Chart */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">
          <div className="flex justify-between items-center border-b border-slate-100 pb-4">
            <div>
              <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                <Banknote className="text-blue-600" size={20} /> Financial Collection & Dues Overview
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">Real-time status of collected vs pending fees.</p>
            </div>
            <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-blue-50 text-blue-600 border border-blue-200">
              ERP Billing
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-xl">
              <div className="text-xs text-emerald-700 font-bold">Total Fee Collected</div>
              <div className="text-xl font-bold text-emerald-800 mt-1">Rs. {stats.fee_collected.toLocaleString()}</div>
            </div>
            <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-xl">
              <div className="text-xs text-amber-700 font-bold">Pending Dues</div>
              <div className="text-xl font-bold text-amber-800 mt-1">Rs. {stats.pending_dues.toLocaleString()}</div>
            </div>
            <div className="p-4 bg-red-50/70 border border-red-200 rounded-xl">
              <div className="text-xs text-red-700 font-bold">Overdue Payments</div>
              <div className="text-xl font-bold text-red-800 mt-1">Rs. {stats.overdue_dues.toLocaleString()}</div>
            </div>
            <div className="p-4 bg-blue-50/70 border border-blue-200 rounded-xl">
              <div className="text-xs text-blue-700 font-bold">Scholarships / Discounts</div>
              <div className="text-xl font-bold text-blue-800 mt-1">Rs. {stats.total_discounts.toLocaleString()}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Cloudflare Traffic Card */}
      <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center shadow-sm">
        <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <BarChart3 size={28} className="text-blue-600" />
        </div>
        <h3 className="text-lg font-bold text-slate-800 mb-2">Cloudflare Web Analytics & Speed Monitoring</h3>
        <p className="text-slate-500 text-sm max-w-md mx-auto mb-6">
          Real-time web traffic analytics, geography stats, and DDoS protection metrics are monitored live in your Cloudflare dashboard.
        </p>
        <a
          href="https://dash.cloudflare.com"
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl transition-all shadow-md shadow-blue-600/20"
        >
          Open Cloudflare Dashboard <ExternalLink size={16} />
        </a>
      </div>
    </div>
  );
}
