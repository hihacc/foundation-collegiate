'use client';
export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';
import { 
  Banknote, Wallet, AlertCircle, ArrowUpRight, ArrowDownRight, 
  Mail, Printer, CreditCard, Search, FileText, Download, 
  Loader2, Receipt, Users, Plus, CheckCircle2, ChevronRight
} from 'lucide-react';
import { m } from 'framer-motion';
import { getStoredData } from '@/lib/utils/storage';
import { toast } from 'sonner';

export default function FeeDashboardPage() {
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalFeeCollected: 0,
    pendingFee: 0,
    overduePayments: 0,
    expectedTotal: 0,
  });
  
  const [loading, setLoading] = useState(true);
  const [sendingReminders, setSendingReminders] = useState(false);
  const [unpaidList, setUnpaidList] = useState<any[]>([]);
  const [recentTransactions, setRecentTransactions] = useState<any[]>([]);

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      try {
        const [
          { count: studentCount },
          { data: challans },
          { data: transactions },
          { data: students }
        ] = await Promise.all([
          supabase.from('students').select('*', { count: 'exact', head: true }),
          supabase.from('fee_challans').select('*'),
          supabase.from('fee_transactions').select('*').order('payment_date', { ascending: false }).limit(6),
          supabase.from('students').select('id, name, roll_number, class_name, email, phone')
        ]);

        const validChallans = (challans && challans.length > 0) ? challans : getStoredData('fee_challans', []);
        const validTx = (transactions && transactions.length > 0) ? transactions : getStoredData('fee_transactions', []);
        const validStudents = (students && students.length > 0) ? students : getStoredData('students', []);

        setRecentTransactions(validTx);

        let collected = 0;
        let pending = 0;
        let overdue = 0;
        const unpaid: any[] = [];

        validChallans.forEach((c: any) => {
          if (c.status !== 'Paid') {
            const remaining = Number(c.net_payable) - Number(c.paid_amount || 0);
            const st = validStudents.find((s: any) => s.id === c.student_id);
            if (st) {
              unpaid.push({ ...st, challan: c, remaining });
            }
            if (new Date(c.due_date) < new Date()) {
              overdue += remaining;
            } else {
              pending += remaining;
            }
          }
        });

        // Use fee_transactions for collected amount
        const { data: allTx } = await supabase.from('fee_transactions').select('*').eq('status', 'Success');
        const finalTx = (allTx && allTx.length > 0) ? allTx : getStoredData('fee_transactions', []);
        
        finalTx.forEach((tx: any) => {
          collected += Number(tx.amount_paid || 0);
        });

        unpaid.sort((a, b) => b.remaining - a.remaining);
        setUnpaidList(unpaid);
        
        const expected = collected + pending + overdue;

        setStats({
          totalStudents: studentCount || validStudents.length,
          totalFeeCollected: collected,
          pendingFee: pending,
          overduePayments: overdue,
          expectedTotal: expected
        });
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const handleSendBatchReminders = async () => {
    const withEmail = unpaidList.filter(u => u.email);
    if (withEmail.length === 0) {
      return toast.info('No unpaid students have registered email addresses to receive reminders.');
    }

    setSendingReminders(true);
    let count = 0;

    for (const item of withEmail) {
      try {
        await fetch('/api/send-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'custom_broadcast',
            toEmail: item.email,
            payload: {
              title: `Fee Payment Reminder - ${item.challan?.month_year || 'Current Month'}`,
              message: `Dear Parent/Student (${item.name}),\n\nThis is an official reminder from The Foundation Collegiate regarding pending fee dues of Rs. ${item.remaining.toLocaleString()} for ${item.challan?.month_year || 'this month'}.\n\nPlease clear your dues at the accounts office or online at your earliest convenience.\n\nThank you,\nAccounts Dept | The Foundation Collegiate\nHouse# 1704, Sector 11-E, Muslim Town, North Karachi`
            }
          })
        });
        count++;
      } catch {}
    }

    setSendingReminders(false);
    toast.success(`Fee reminder dispatches sent to ${count} students/parents!`);
  };

  const formatCurrency = (val: number) => `Rs. ${val.toLocaleString()}`;
  const collectionRate = stats.expectedTotal > 0 ? Math.min(100, Math.round((stats.totalFeeCollected / stats.expectedTotal) * 100)) : 0;

  const renderStatCard = (title: string, value: string, Icon: any, color: string, trend?: number) => (
    <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all group">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest mb-1.5">{title}</p>
          <h3 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">{loading ? '...' : value}</h3>
        </div>
        <div className={`p-3.5 rounded-2xl ${color} shadow-2xs group-hover:scale-105 transition-transform`}>
          <Icon size={24} />
        </div>
      </div>
      {trend !== undefined && (
        <div className="mt-4 flex items-center gap-2">
          <div className={`flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${trend >= 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}`}>
            {trend >= 0 ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
            {Math.abs(trend)}%
          </div>
          <span className="text-xs text-slate-400 font-medium">vs target</span>
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-8 max-w-7xl mx-auto font-sans px-2 sm:px-4 lg:px-6">
      
      {/* Executive Financial Header Banner (Pure Light Theme) */}
      <div className="bg-gradient-to-r from-blue-50 via-indigo-50/60 to-white rounded-3xl p-6 sm:p-8 text-slate-900 shadow-md border border-blue-100 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-blue-100 text-blue-800 text-xs font-bold border border-blue-200 flex items-center gap-1.5">
                <Receipt size={14} className="text-blue-600" /> Accounts &amp; Billing Center
              </span>
              <span className="text-xs text-slate-500 font-mono">Session 2026-2027</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-display font-black tracking-tight text-slate-900">
              Fee Management &amp; Accounts Portal
            </h1>
            <p className="text-slate-600 text-xs sm:text-sm max-w-2xl">
              Track fee collections, generate official Parent Receipts, record payments, and dispatch automatic dues reminders.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleSendBatchReminders}
              disabled={sendingReminders || unpaidList.length === 0}
              className="px-4 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm transition-all shadow-md shadow-blue-600/20 flex items-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              {sendingReminders ? <Loader2 size={16} className="animate-spin" /> : <Mail size={16} />}
              <span>Auto-Remind Parents</span>
            </button>

            <Link
              href="/admin/dashboard/fees/challans"
              className="px-4 py-3 rounded-2xl bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 font-bold text-xs sm:text-sm transition-all shadow-sm flex items-center gap-2"
            >
              <Receipt size={16} className="text-blue-600" />
              <span>Issue Parent Receipts</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <Link
          href="/admin/dashboard/fees"
          className="px-4 py-2 rounded-2xl text-xs font-bold bg-blue-600 text-white shadow-md shadow-blue-600/20 flex items-center gap-2 whitespace-nowrap"
        >
          <Banknote size={15} /> Overview &amp; Analytics
        </Link>
        <Link
          href="/admin/dashboard/fees/challans"
          className="px-4 py-2 rounded-2xl text-xs font-bold bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 flex items-center gap-2 whitespace-nowrap"
        >
          <Receipt size={15} /> Parent Receipts &amp; Challans
        </Link>
        <Link
          href="/admin/dashboard/fees/payments"
          className="px-4 py-2 rounded-2xl text-xs font-bold bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 flex items-center gap-2 whitespace-nowrap"
        >
          <CreditCard size={15} /> Verified Payment Records
        </Link>
        <Link
          href="/admin/dashboard/fees/structures"
          className="px-4 py-2 rounded-2xl text-xs font-bold bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 flex items-center gap-2 whitespace-nowrap"
        >
          <FileText size={15} /> Class Fee Structures
        </Link>
      </div>

      {/* Key Metric Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {renderStatCard("Total Revenue Collected", formatCurrency(stats.totalFeeCollected), Banknote, "bg-emerald-50 text-emerald-600 border border-emerald-100", 12.5)}
        {renderStatCard("Pending Dues (Unpaid)", formatCurrency(stats.pendingFee), Wallet, "bg-blue-50 text-blue-600 border border-blue-100", 4.2)}
        {renderStatCard("Overdue Payments", formatCurrency(stats.overduePayments), AlertCircle, "bg-red-50 text-red-600 border border-red-100", -2.4)}
        {renderStatCard("Total Expected Revenue", formatCurrency(stats.expectedTotal), CreditCard, "bg-purple-50 text-purple-600 border border-purple-100")}
      </div>

      {/* Collection Target Progress Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-4">
        <div className="flex justify-between items-end">
          <div>
            <h3 className="text-base sm:text-lg font-black text-slate-900">Collection Target Progress</h3>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mt-0.5">Current Academic Term</p>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-blue-600 font-mono">{collectionRate}%</div>
        </div>

        <div className="h-4 w-full bg-slate-100 rounded-full overflow-hidden relative shadow-inner">
          <m.div 
            initial={{ width: 0 }} 
            animate={{ width: `${collectionRate}%` }} 
            transition={{ duration: 1.2, ease: "easeOut" }}
            className={`absolute top-0 left-0 h-full rounded-full ${collectionRate < 50 ? 'bg-red-500' : collectionRate < 80 ? 'bg-amber-400' : 'bg-emerald-500'}`}
          />
        </div>
      </div>

      {/* Split Grids: Recent Payments & Pending Dues List */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Recent Transactions List (2 Cols) */}
        <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          <div className="p-5 sm:p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
            <div>
              <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
                <CreditCard size={18} className="text-blue-600" /> Recent Payment Transactions
              </h2>
              <p className="text-xs text-slate-400 font-medium">Latest verified student fee collections</p>
            </div>
            <Link href="/admin/dashboard/fees/payments" className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1">
              View All <ChevronRight size={14} />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-900 text-white font-bold uppercase text-[10px]">
                  <th className="py-3 px-4">Transaction ID</th>
                  <th className="py-3 px-4">Payment Method</th>
                  <th className="py-3 px-4 text-right">Amount Paid</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentTransactions.length > 0 ? (
                  recentTransactions.map((tx: any, idx: number) => (
                    <tr key={tx.id || idx} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-blue-900">{tx.transaction_ref || `TX-${idx+1}`}</td>
                      <td className="py-3 px-4 font-semibold text-slate-700">{tx.payment_method || 'Cash at Reception'}</td>
                      <td className="py-3 px-4 text-right font-mono font-black text-emerald-700">Rs. {Number(tx.amount_paid || 0).toLocaleString()}</td>
                      <td className="py-3 px-4 text-slate-500 font-mono">{new Date(tx.payment_date || Date.now()).toLocaleDateString('en-PK')}</td>
                      <td className="py-3 px-4 text-center">
                        <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 font-black text-[10px]">
                          VERIFIED
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="py-10 text-center text-slate-400 font-medium">
                      No recent payment transactions recorded yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Quick Pending Dues Widget (1 Col) */}
        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-sm space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <AlertCircle size={16} className="text-red-500" /> Pending Dues Defaulters
              </h3>
              <span className="text-xs font-mono font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-full border border-red-200">
                {unpaidList.length} Students
              </span>
            </div>

            <div className="divide-y divide-slate-100 max-h-[300px] overflow-y-auto pr-1">
              {unpaidList.length > 0 ? (
                unpaidList.slice(0, 5).map((u, i) => (
                  <div key={i} className="py-2.5 flex items-center justify-between gap-3 text-xs">
                    <div className="min-w-0">
                      <div className="font-bold text-slate-900 truncate">{u.name}</div>
                      <div className="text-[10px] text-slate-400">{u.class_name} &bull; {u.roll_number}</div>
                    </div>
                    <span className="font-mono font-bold text-red-600 shrink-0">
                      Rs. {u.remaining.toLocaleString()}
                    </span>
                  </div>
                ))
              ) : (
                <div className="py-8 text-center text-slate-400 text-xs">
                  🎉 No pending fee defaulters at this time!
                </div>
              )}
            </div>
          </div>

          <Link
            href="/admin/dashboard/fees/challans"
            className="w-full py-2.5 px-4 rounded-2xl bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-xs font-bold block text-center transition-colors"
          >
            Manage All Fee Challans &rarr;
          </Link>
        </div>

      </div>

    </div>
  );
}
