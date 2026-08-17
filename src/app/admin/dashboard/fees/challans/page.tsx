'use client';
export const dynamic = 'force-dynamic';

import { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { 
  Search, Printer, Download, Mail, CheckCircle2, FileText, 
  AlertCircle, Plus, Receipt, ShieldCheck, UserCheck, CreditCard,
  Building2, Phone, Calendar, Sparkles, ArrowRight, X, Check
} from 'lucide-react';
import { getStoredData, setStoredData } from '@/lib/utils/storage';
import { OFFICIAL_CLASSES } from '@/lib/utils/classes';

const defaultFallbackStudents = [
  { id: 's1', name: 'Asif Khan', father_name: 'Muhammad Khan', roll_number: 'FC-26-101', class_name: 'Class IX - Science / Biology', status: 'active' },
  { id: 's2', name: 'Zainab Ahmed', father_name: 'Tariq Ahmed', roll_number: 'FC-26-102', class_name: 'Class XI - Pre-Medical', status: 'active' },
  { id: 's3', name: 'Bilal Hassan', father_name: 'Hassan Raza', roll_number: 'FC-26-103', class_name: 'Class XII - Pre-Engineering', status: 'active' },
  { id: 's4', name: 'Hamza Malik', father_name: 'Malik Usman', roll_number: 'FC-26-104', class_name: 'Diploma in Information Technology (DIT)', status: 'active' }
];

const defaultStructuresList = [
  { id: '1', class_name: 'Class IX - Science / Biology', monthly_tuition_fee: 6500 },
  { id: '2', class_name: 'Class IX - Computer Science', monthly_tuition_fee: 6500 },
  { id: '3', class_name: 'Class X - Science / Biology', monthly_tuition_fee: 7000 },
  { id: '4', class_name: 'Class X - Computer Science', monthly_tuition_fee: 7000 },
  { id: '5', class_name: 'Class XI - Pre-Medical', monthly_tuition_fee: 9500 },
  { id: '6', class_name: 'Class XI - Pre-Engineering', monthly_tuition_fee: 9500 },
  { id: '7', class_name: 'Class XI - Computer Science', monthly_tuition_fee: 9500 },
  { id: '8', class_name: 'Class XII - Pre-Medical', monthly_tuition_fee: 9500 },
  { id: '9', class_name: 'Class XII - Pre-Engineering', monthly_tuition_fee: 9500 },
  { id: '10', class_name: 'Diploma in Information Technology (DIT)', monthly_tuition_fee: 5500 }
];

export default function FeeChallansPage() {
  const [challans, setChallans] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<any[]>([]);
  const [structures, setStructures] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Paid' | 'Unpaid' | 'Overdue'>('All');
  const [loading, setLoading] = useState(true);
  
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const d = new Date();
    return d.toLocaleString('default', { month: 'long', year: 'numeric' }); // e.g. "August 2026"
  });

  const [generating, setGenerating] = useState(false);
  const [printReceipt, setPrintReceipt] = useState<any | null>(null);

  // Quick Payment Modal state
  const [payModalChallan, setPayModalChallan] = useState<any | null>(null);
  const [payMethod, setPayMethod] = useState('Cash');
  const [payRef, setPayRef] = useState('');
  const [payProcessing, setPayProcessing] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    let chList = getStoredData('fee_challans', []);
    let stList = getStoredData('students', defaultFallbackStudents);
    let prList = getStoredData('student_fee_profiles', []);
    let stcList = getStoredData('fee_structures', defaultStructuresList);

    try {
      const { data: cData } = await supabase.from('fee_challans').select('*').order('created_at', { ascending: false });
      if (cData && cData.length > 0) chList = cData;
    } catch {}

    try {
      const { data: sData } = await supabase.from('students').select('*').order('name');
      if (sData && sData.length > 0) stList = sData;
    } catch {}

    try {
      const { data: pData, error } = await supabase.from('student_fee_profiles').select('*');
      if (!error && pData && pData.length > 0) prList = pData;
    } catch {}

    try {
      const { data: fData } = await supabase.from('fee_structures').select('*');
      if (fData && fData.length > 0) stcList = fData;
    } catch {}

    setChallans(chList);
    setStudents(stList);
    setProfiles(prList);
    setStructures(stcList);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const getStudentInfo = (studentId: string) => {
    const student = students.find(s => s.id === studentId);
    return student || { name: 'Student', father_name: 'N/A', roll_number: 'N/A', class_name: 'General Program' };
  };

  const handleGenerateMonthly = async () => {
    if (!confirm(`Generate Fee Receipts for ${selectedMonth}? This will create billing vouchers for active students.`)) return;
    setGenerating(true);
    
    try {
      const newChallans: any[] = [];
      let studentList = (Array.isArray(students) && students.length > 0) ? students : getStoredData('students', defaultFallbackStudents);
      if (!Array.isArray(studentList) || studentList.length === 0) studentList = defaultFallbackStudents;

      const currentChallans = Array.isArray(challans) ? challans : [];
      const currentProfiles = Array.isArray(profiles) ? profiles : [];
      const currentStructures = Array.isArray(structures) ? structures : [];

      const activeStudents = studentList.filter((s: any) => {
        if (!s || !s.id) return false;
        const st = String(s.status || '').toLowerCase().trim();
        const isNotInactive = st !== 'inactive' && st !== 'graduated' && st !== 'alumni';
        const isActiveFlag = s.is_active !== false;
        return isNotInactive && isActiveFlag;
      });
      
      for (const student of activeStudents) {
        if (!student || !student.id) continue;
        if (currentChallans.some((c: any) => c && c.student_id === student.id && c.month_year === selectedMonth)) {
          continue;
        }

        const profile = currentProfiles.find((p: any) => p && p.student_id === student.id);
        let structure = currentStructures.find((s: any) => s && s.id === profile?.fee_structure_id);
        
        if (!structure && student.class_name) {
          structure = currentStructures.find((s: any) => s && s.class_name && String(s.class_name).toLowerCase().includes(String(student.class_name).toLowerCase()));
        }

        let net = structure ? Number(structure.monthly_tuition_fee || 8500) : 8500;
        if (profile?.transport_fee) net += Number(profile.transport_fee);

        let discountAmount = 0;
        if (profile?.discount_type === 'Percentage') {
          discountAmount = (net * Number(profile.discount_value || 0)) / 100;
        } else if (profile?.discount_type === 'Fixed') {
          discountAmount = Number(profile.discount_value || 0);
        } else if (profile?.discount_type === 'Scholarship') {
          discountAmount = net;
        }

        net = Math.max(0, net - discountAmount);

        const issueDate = new Date();
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + 10);

        const refNo = `TFC-${Math.floor(10000000 + Math.random() * 90000000)}`;
        const genId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `ch-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

        newChallans.push({
          id: genId,
          student_id: student.id,
          month_year: selectedMonth,
          issue_date: issueDate.toISOString().split('T')[0],
          due_date: dueDate.toISOString().split('T')[0],
          net_payable: net,
          paid_amount: 0,
          status: 'Unpaid',
          discount_applied: discountAmount,
          barcode_ref: refNo,
          created_at: new Date().toISOString()
        });
      }

      if (newChallans.length === 0) {
        toast.info(`All students already have a fee receipt generated for ${selectedMonth}.`);
        setGenerating(false);
        return;
      }

      const updatedChallans = [...newChallans, ...currentChallans];
      setChallans(updatedChallans);
      setStoredData('fee_challans', updatedChallans);

      try {
        await supabase.from('fee_challans').insert(newChallans);
      } catch {}

      toast.success(`Generated ${newChallans.length} fee receipts for ${selectedMonth}!`);
    } catch (err: any) {
      toast.error('Failed to generate receipts');
    } finally {
      setGenerating(false);
    }
  };

  // Mark as Paid directly
  const handleConfirmPayment = async () => {
    if (!payModalChallan) return;
    setPayProcessing(true);

    try {
      const updatedList = challans.map(c => {
        if (c.id === payModalChallan.id) {
          return {
            ...c,
            status: 'Paid',
            paid_amount: c.net_payable,
            payment_method: payMethod,
            payment_ref: payRef || 'RECEPTION-CASH',
            paid_at: new Date().toISOString()
          };
        }
        return c;
      });

      setChallans(updatedList);
      setStoredData('fee_challans', updatedList);

      try {
        await supabase.from('fee_challans').update({
          status: 'Paid',
          paid_amount: payModalChallan.net_payable,
          paid_at: new Date().toISOString()
        }).eq('id', payModalChallan.id);
      } catch {}

      // Log transaction
      const newTx = {
        id: crypto.randomUUID(),
        challan_id: payModalChallan.id,
        student_id: payModalChallan.student_id,
        amount_paid: payModalChallan.net_payable,
        payment_method: payMethod,
        transaction_ref: payRef || `TX-${Date.now()}`,
        status: 'Success',
        payment_date: new Date().toISOString()
      };

      const prevTx = getStoredData('fee_transactions', []);
      setStoredData('fee_transactions', [newTx, ...prevTx]);
      try {
        await supabase.from('fee_transactions').insert([newTx]);
      } catch {}

      toast.success(`Fee marked as PAID for ${getStudentInfo(payModalChallan.student_id).name}!`);
      
      const updatedChallanObj = updatedList.find(c => c.id === payModalChallan.id);
      setPayModalChallan(null);
      setPayRef('');

      // Auto preview parent receipt
      if (updatedChallanObj) {
        setPrintReceipt(updatedChallanObj);
      }
    } catch {
      toast.error('Failed to record payment');
    } finally {
      setPayProcessing(false);
    }
  };

  const filteredChallans = useMemo(() => {
    return challans.filter(c => {
      const st = getStudentInfo(c.student_id);
      const matchesSearch = !search.trim() ||
        st.name.toLowerCase().includes(search.toLowerCase()) ||
        (st.roll_number || '').toLowerCase().includes(search.toLowerCase()) ||
        (st.class_name || '').toLowerCase().includes(search.toLowerCase()) ||
        (c.barcode_ref || '').toLowerCase().includes(search.toLowerCase()) ||
        (c.month_year || '').toLowerCase().includes(search.toLowerCase());

      const matchesStatus = statusFilter === 'All' || c.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [challans, search, statusFilter, students]);

  const handlePrint = (challan: any) => {
    setPrintReceipt(challan);
    setTimeout(() => {
      window.print();
    }, 250);
  };

  return (
    <>
      {/* Print Specific CSS to format dedicated single-page Parent Receipt */}
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          body * {
            visibility: hidden !important;
          }
          .printable-parent-receipt, .printable-parent-receipt * {
            visibility: visible !important;
          }
          .printable-parent-receipt {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            max-width: 800px !important;
            margin: 0 auto !important;
            display: block !important;
            background: white !important;
            padding: 24px !important;
            font-size: 12px !important;
            color: #0f172a !important;
          }
          .hide-on-print {
            display: none !important;
          }
        }
      `}} />

      <div className="space-y-6 max-w-7xl mx-auto font-sans hide-on-print px-2 sm:px-4 lg:px-6">
        
        {/* Header & Controls (Pure Light Theme) */}
        <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 shadow-2xs">
              <Receipt size={24} />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-display font-black text-slate-900">
                Fee Management &amp; Parent Receipts
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                Issue official Parent Receipts, record payments, and manage monthly billing vouchers.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
            <select 
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
            >
              {[...Array(6)].map((_, i) => {
                const now = new Date();
                const d = new Date(now.getFullYear(), now.getMonth() - 2 + i, 1);
                const m = d.toLocaleString('default', { month: 'long', year: 'numeric' });
                return <option key={`${m}-${i}`} value={m}>{m}</option>;
              })}
            </select>

            <button
              onClick={handleGenerateMonthly}
              disabled={generating}
              className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-600/20 flex items-center gap-1.5 transition-all disabled:opacity-50 cursor-pointer"
            >
              {generating ? <AlertCircle size={15} className="animate-spin" /> : <Plus size={15} />}
              Generate {selectedMonth} Receipts
            </button>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative w-full sm:w-80">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              value={search} 
              onChange={e => setSearch(e.target.value)}
              placeholder="Search student, roll no, ref..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 text-slate-900 placeholder:text-slate-400 rounded-2xl focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none text-xs font-semibold shadow-inner"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1">
            {(['All', 'Paid', 'Unpaid', 'Overdue'] as const).map(st => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                  statusFilter === st 
                    ? 'bg-blue-600 text-white shadow-xs' 
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200'
                }`}
              >
                {st === 'All' ? `All (${challans.length})` : st}
              </button>
            ))}
          </div>
        </div>

        {/* Receipts Table */}
        <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-slate-900 text-white font-black uppercase text-[11px]">
                  <th className="py-3.5 px-4">Receipt Ref</th>
                  <th className="py-3.5 px-4">Student &amp; Parent</th>
                  <th className="py-3.5 px-4">Class Program</th>
                  <th className="py-3.5 px-4">Fee Month</th>
                  <th className="py-3.5 px-4 text-right">Net Amount</th>
                  <th className="py-3.5 px-4 text-center">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="py-16 text-center text-slate-400 font-bold">
                      Loading fee receipts and accounts records...
                    </td>
                  </tr>
                ) : filteredChallans.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-16 text-center text-slate-400 space-y-2">
                      <FileText size={36} className="mx-auto text-slate-300" />
                      <p className="font-bold text-slate-700 text-sm">No fee receipts found.</p>
                      <p className="text-xs text-slate-400">Click &quot;Generate Receipts&quot; to issue monthly billing vouchers for active students.</p>
                    </td>
                  </tr>
                ) : (
                  filteredChallans.map(c => {
                    const s = getStudentInfo(c.student_id);
                    return (
                      <tr key={c.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3.5 px-4 font-mono font-bold text-blue-900">
                          {c.barcode_ref}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-slate-900 text-sm">{s.name}</div>
                          <div className="text-[10px] text-slate-500 font-medium">S/O {s.father_name || 'Guardian'} &bull; Roll: {s.roll_number}</div>
                        </td>
                        <td className="py-3.5 px-4 font-semibold text-slate-700">
                          {s.class_name}
                        </td>
                        <td className="py-3.5 px-4 font-medium text-slate-800">
                          {c.month_year}
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono font-black text-slate-900 text-sm">
                          Rs. {Number(c.net_payable).toLocaleString()}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                            c.status === 'Paid' ? 'bg-emerald-100 text-emerald-800 border-emerald-200' :
                            c.status === 'Overdue' ? 'bg-red-100 text-red-800 border-red-200' :
                            'bg-amber-100 text-amber-800 border-amber-200'
                          }`}>
                            {c.status === 'Paid' ? <CheckCircle2 size={12} /> : null}
                            {c.status}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {c.status !== 'Paid' && (
                              <button
                                onClick={() => setPayModalChallan(c)}
                                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs flex items-center gap-1 shadow-xs cursor-pointer"
                              >
                                <CreditCard size={13} /> Collect Fee
                              </button>
                            )}

                            <button
                              onClick={() => handlePrint(c)}
                              title="Print Official Parent Receipt"
                              className="px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-600 hover:text-white rounded-xl font-bold text-xs flex items-center gap-1 border border-blue-200 transition-colors cursor-pointer"
                            >
                              <Printer size={13} /> Parent Receipt
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* Quick Collect Fee Modal */}
      {payModalChallan && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-5 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                  <CreditCard size={18} />
                </div>
                <h3 className="font-bold text-slate-900 text-base">Record Fee Payment</h3>
              </div>
              <button onClick={() => setPayModalChallan(null)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X size={18} />
              </button>
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Student:</span>
                <span className="font-bold text-slate-900">{getStudentInfo(payModalChallan.student_id).name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Class:</span>
                <span className="font-semibold text-slate-700">{getStudentInfo(payModalChallan.student_id).class_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Month:</span>
                <span className="font-semibold text-slate-700">{payModalChallan.month_year}</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-slate-200 text-sm">
                <span className="font-bold text-slate-800">Total Payable:</span>
                <span className="font-black text-emerald-700 font-mono">Rs. {Number(payModalChallan.net_payable).toLocaleString()}</span>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">Payment Method</label>
                <select
                  value={payMethod}
                  onChange={e => setPayMethod(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  <option value="Cash">Cash at Reception</option>
                  <option value="Online Bank Transfer">Online Bank Transfer (Meezan / HBL)</option>
                  <option value="JazzCash">JazzCash</option>
                  <option value="EasyPaisa">EasyPaisa</option>
                  <option value="Cheque / Pay Order">Cheque / Pay Order</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">Transaction Ref / Slip No. (Optional)</label>
                <input
                  type="text"
                  value={payRef}
                  onChange={e => setPayRef(e.target.value)}
                  placeholder="e.g. REC-94821 or Bank Tx ID"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setPayModalChallan(null)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmPayment}
                disabled={payProcessing}
                className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 flex items-center justify-center gap-1.5"
              >
                {payProcessing ? 'Recording...' : 'Confirm & Print Receipt'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DEDICATED OFFICIAL PARENT / STUDENT RECEIPT (PRINTABLE FULL PAGE) */}
      {printReceipt && (
        <div className="hidden printable-parent-receipt">
          {(() => {
            const st = getStudentInfo(printReceipt.student_id);
            const isPaid = printReceipt.status === 'Paid';
            return (
              <div className="border-2 border-slate-800 p-6 rounded-2xl bg-white space-y-5 font-sans">
                
                {/* Header with Institute Info */}
                <div className="flex items-start justify-between border-b-2 border-slate-800 pb-4">
                  <div className="flex items-center gap-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src="/foundation-logo.png" alt="Logo" className="w-16 h-16 object-contain" />
                    <div>
                      <h2 className="text-xl font-display font-black tracking-tight text-slate-900">THE FOUNDATION COLLEGIATE</h2>
                      <p className="text-[10px] font-bold text-blue-900 uppercase tracking-widest">Premier Coaching &amp; Academic Institute Karachi</p>
                      <p className="text-[9px] text-slate-600 mt-0.5">House# 1704, Sector 11-E, Muslim Town, North Karachi, Karachi, Pakistan</p>
                      <p className="text-[9px] text-slate-600">Phone: 0333-3439458 &bull; Email: foundationcollegiate@gmail.com</p>
                    </div>
                  </div>

                  <div className="text-right space-y-1">
                    <span className="inline-block px-3 py-1 bg-blue-900 text-white font-mono font-black text-xs rounded-md uppercase tracking-wider">
                      PARENT / STUDENT COPY
                    </span>
                    <p className="text-[10px] font-mono font-bold text-slate-700">Receipt Ref: {printReceipt.barcode_ref}</p>
                    <p className="text-[9px] text-slate-500">Date: {new Date().toLocaleDateString('en-PK')}</p>
                  </div>
                </div>

                {/* Title Banner */}
                <div className="text-center py-1 bg-slate-100 rounded-lg border border-slate-300">
                  <h3 className="font-bold text-slate-900 text-sm uppercase tracking-wide">
                    OFFICIAL STUDENT FEE RECEIPT &bull; SESSION 2026-2027
                  </h3>
                </div>

                {/* Student Credentials Grid */}
                <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-xs bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <div>
                    <span className="text-slate-500 font-medium">Student Name:</span>{' '}
                    <strong className="text-slate-900 text-sm uppercase">{st.name}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 font-medium">Roll Number:</span>{' '}
                    <strong className="font-mono text-blue-900 font-black">{st.roll_number}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 font-medium">Father / Guardian Name:</span>{' '}
                    <strong className="text-slate-800 uppercase">{st.father_name || 'Guardian'}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 font-medium">Class / Program:</span>{' '}
                    <strong className="text-slate-900">{st.class_name}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 font-medium">Billing Month:</span>{' '}
                    <strong className="text-blue-900 font-bold">{printReceipt.month_year}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 font-medium">Due Date:</span>{' '}
                    <strong className="font-mono text-slate-800">{printReceipt.due_date}</strong>
                  </div>
                </div>

                {/* Financial Particulars Breakdown */}
                <table className="w-full text-xs border-collapse border border-slate-300">
                  <thead>
                    <tr className="bg-slate-900 text-white font-bold uppercase text-[10px]">
                      <th className="py-2 px-3 text-left">Fee Particulars / Descriptions</th>
                      <th className="py-2 px-3 text-right w-36">Amount (PKR)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    <tr>
                      <td className="py-2 px-3 font-semibold text-slate-800">
                        Monthly Tuition Fee ({printReceipt.month_year})
                      </td>
                      <td className="py-2 px-3 text-right font-mono font-bold text-slate-900">
                        Rs. {(Number(printReceipt.net_payable) + Number(printReceipt.discount_applied || 0)).toLocaleString()}
                      </td>
                    </tr>
                    {printReceipt.discount_applied > 0 && (
                      <tr className="bg-emerald-50/50">
                        <td className="py-2 px-3 text-emerald-800 font-bold">
                          Merit Scholarship / Fee Concession Applied
                        </td>
                        <td className="py-2 px-3 text-right font-mono font-bold text-emerald-800">
                          -Rs. {Number(printReceipt.discount_applied).toLocaleString()}
                        </td>
                      </tr>
                    )}
                  </tbody>
                  <tfoot>
                    <tr className="bg-slate-100 font-black text-slate-900 text-sm border-t-2 border-slate-800">
                      <td className="py-2.5 px-3 uppercase text-xs">Total Net Payable Amount</td>
                      <td className="py-2.5 px-3 text-right font-mono text-blue-950">
                        Rs. {Number(printReceipt.net_payable).toLocaleString()}
                      </td>
                    </tr>
                  </tfoot>
                </table>

                {/* Payment Status & Instructions */}
                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="space-y-0.5 text-[10px] text-slate-600 max-w-sm">
                    <p className="font-bold text-slate-800">• Important Notice for Parents:</p>
                    <p>• Retain this receipt as official proof of payment for the current academic month.</p>
                    <p>• Fee once paid is non-refundable and non-transferable.</p>
                  </div>

                  <div className="text-center">
                    <span className={`inline-block px-5 py-2 rounded-xl text-base font-black uppercase tracking-wider border-2 ${
                      isPaid 
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-600' 
                        : 'bg-amber-50 text-amber-800 border-amber-500'
                    }`}>
                      {isPaid ? 'PAID ✓' : 'PAYMENT DUE'}
                    </span>
                    {isPaid && printReceipt.payment_method && (
                      <p className="text-[9px] text-slate-500 font-bold mt-1">Paid via {printReceipt.payment_method}</p>
                    )}
                  </div>
                </div>

                {/* Footer Signatures and Seals */}
                <div className="pt-6 border-t-2 border-slate-300 grid grid-cols-2 gap-8 text-[10px]">
                  <div className="text-left space-y-6">
                    <div className="font-mono text-[9px] text-slate-400">
                      Receipt Generated By: TFC Accounts System<br />
                      Verification Code: {printReceipt.barcode_ref}
                    </div>
                    <div>
                      <div className="border-b border-slate-400 w-40 mb-1"></div>
                      <span className="font-bold text-slate-700">Accounts Officer Signature</span>
                    </div>
                  </div>

                  <div className="text-right space-y-4">
                    <div className="font-serif italic font-bold text-blue-950 text-base">
                      Dr. Asif Iqbal
                    </div>
                    <div>
                      <div className="border-b border-slate-400 w-44 ml-auto mb-1"></div>
                      <span className="font-bold text-slate-800">Director &amp; Principal Seal</span>
                      <p className="text-[8px] text-slate-400">The Foundation Collegiate</p>
                    </div>
                  </div>
                </div>

              </div>
            );
          })()}
        </div>
      )}
    </>
  );
}
