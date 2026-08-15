'use client';
export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { Search, Wallet, CheckCircle2, AlertCircle, RefreshCw, Printer, Download, X, Receipt, History, FileCheck, Plus, ShieldCheck } from 'lucide-react';
import { getStoredData, setStoredData } from '@/lib/utils/storage';

const defaultFallbackStudents = [
  { id: 's1', name: 'Asif Khan', roll_number: 'FC-2026-101', class_name: 'Matric Science' },
  { id: 's2', name: 'Zainab Ahmed', roll_number: 'FC-2026-102', class_name: 'XI Pre-Medical' },
  { id: 's3', name: 'Bilal Hassan', roll_number: 'FC-2026-103', class_name: 'XII Pre-Engineering' },
  { id: 's4', name: 'Hamza Malik', roll_number: 'FC-2026-104', class_name: 'Diploma in IT (DIT)' }
];

export default function FeePaymentsPage() {
  const [searchRef, setSearchRef] = useState('');
  const [challan, setChallan] = useState<any | null>(null);
  const [student, setStudent] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);

  const [paymentAmount, setPaymentAmount] = useState<number | ''>('');
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [remarks, setRemarks] = useState('');

  // Transactions & Receipt State
  const [recentTransactions, setRecentTransactions] = useState<any[]>([]);
  const [activeReceipt, setActiveReceipt] = useState<any | null>(null);
  const [allChallans, setAllChallans] = useState<any[]>([]);
  const [allStudents, setAllStudents] = useState<any[]>(() => getStoredData('students', defaultFallbackStudents));

  // Manual Receipt State
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [manualForm, setManualForm] = useState({
    student_id: '',
    custom_name: '',
    roll_number: '',
    class_name: 'Matric Science',
    month_year: 'August 2026',
    net_payable: 8500,
    amount_paid: 8500,
    payment_method: 'Cash',
    remarks: 'Manual Fee Receipt Issued'
  });

  const fetchTransactions = async () => {
    try {
      const [txRes, cRes, sRes] = await Promise.all([
        supabase.from('fee_transactions').select('*').order('created_at', { ascending: false }),
        supabase.from('fee_challans').select('*'),
        supabase.from('students').select('*')
      ]);

      const txs = txRes.data || getStoredData('fee_transactions', []);
      const chs = cRes.data || getStoredData('fee_challans', []);
      const sts = (sRes.data && sRes.data.length > 0) ? sRes.data : getStoredData('students', defaultFallbackStudents);

      setRecentTransactions(txs);
      setAllChallans(chs);
      setAllStudents(sts);
    } catch {
      setRecentTransactions(getStoredData('fee_transactions', []));
      setAllChallans(getStoredData('fee_challans', []));
      setAllStudents(getStoredData('students', defaultFallbackStudents));
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  const searchChallan = async () => {
    if (!searchRef) return;
    const cleanRef = searchRef.trim().replace(/[*()]/g, '');
    if (!cleanRef) return toast.error('Invalid search reference');

    setLoading(true);
    setChallan(null);
    setStudent(null);
    setPaymentAmount('');
    try {
      let foundChallan = null;
      try {
        const { data: cData } = await supabase.from('fee_challans').select('*').ilike('barcode_ref', `%${cleanRef}%`).limit(1).maybeSingle();
        foundChallan = cData;
      } catch {}

      if (!foundChallan) {
        const local = getStoredData('fee_challans', []);
        foundChallan = local.find((c: any) => 
          (c.barcode_ref || '').toLowerCase().includes(cleanRef.toLowerCase())
        );
      }

      if (foundChallan) {
        setChallan(foundChallan);
        const remaining = Number(foundChallan.net_payable) - Number(foundChallan.paid_amount || 0);
        setPaymentAmount(remaining > 0 ? remaining : '');

        const { data: sData } = await supabase.from('students').select('*').eq('id', foundChallan.student_id).single();
        if (sData) setStudent(sData);
        else {
          const sLocal = getStoredData('students', defaultFallbackStudents);
          setStudent(sLocal.find((s: any) => s.id === foundChallan.student_id));
        }
      } else {
        toast.error('Challan not found');
      }
    } catch {
      toast.error('Search failed');
    } finally {
      setLoading(false);
    }
  };

  const processPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!challan || !paymentAmount) return;
    
    const amount = Number(paymentAmount);
    if (amount <= 0) return toast.error('Amount must be greater than 0');

    setProcessing(true);
    try {
      const currentPaid = Number(challan.paid_amount || 0);
      const newPaid = currentPaid + amount;
      const net = Number(challan.net_payable || amount);
      
      let newStatus = 'Pending';
      if (newPaid >= net) {
        newStatus = 'Paid';
      } else if (newPaid > 0) {
        newStatus = 'Partially Paid';
      }

      const txId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `tx-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

      const tx = {
        id: txId,
        challan_id: challan.id || 'MANUAL',
        amount_paid: amount,
        payment_method: paymentMethod || 'Cash',
        remarks: remarks || '',
        status: 'completed',
        payment_date: new Date().toISOString(),
        created_at: new Date().toISOString()
      };

      try {
        const { error } = await supabase.from('fee_transactions').insert([tx]);
        if (error) console.warn('Fee transaction insert warning:', error.message);
      } catch (err: any) {
        console.warn('Fee transaction error:', err);
      }

      const localTx = getStoredData('fee_transactions', []);
      const updatedTxList = [tx, ...localTx];
      setStoredData('fee_transactions', updatedTxList);
      setRecentTransactions(updatedTxList);

      try {
        await supabase.from('fee_challans').update({
          paid_amount: newPaid,
          status: newStatus
        }).eq('id', challan.id);
      } catch {}
      
      const localCh = getStoredData('fee_challans', []);
      const updatedLocalCh = localCh.map((c: any) => c.id === challan.id ? { ...c, paid_amount: newPaid, status: newStatus } : c);
      setStoredData('fee_challans', updatedLocalCh);

      const sName = student?.name || 'Student';
      const sRoll = student?.roll_number || 'N/A';
      const sClass = student?.class_name || 'N/A';
      const sEmail = student?.email || student?.parent_email;

      if (sEmail) {
        const remaining = Math.max(0, net - newPaid);
        fetch('/api/send-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'fee_payment',
            payload: {
              email: sEmail,
              student_name: sName,
              month_year: challan.month_year || 'Current Month',
              barcode_ref: challan.barcode_ref || 'FC-OFFICIAL',
              payment_method: paymentMethod,
              amount_paid: amount,
              remaining
            }
          })
        }).catch(() => {});
      }

      toast.success('Payment Processed Successfully!');

      const receiptPayload = {
        receipt_no: `REC-${txId.substring(0, 8).toUpperCase()}`,
        transaction_id: txId,
        date: (tx as any).payment_date || (tx as any).created_at || new Date().toISOString(),
        student_name: sName,
        roll_number: sRoll,
        class_name: sClass,
        month_year: challan.month_year || 'Current Month',
        barcode_ref: challan.barcode_ref || 'FC-OFFICIAL',
        net_payable: net,
        previous_paid: currentPaid,
        amount_paid: amount,
        total_paid: newPaid,
        remaining_balance: Math.max(0, net - newPaid),
        payment_method: paymentMethod,
        remarks: remarks || 'Fee Payment Received'
      };
      
      setActiveReceipt(receiptPayload);
      setChallan({ ...challan, paid_amount: newPaid, status: newStatus });
      setPaymentAmount('');
      setRemarks('');
      
    } catch (err: any) {
      console.error('Payment processing error details:', err);
      toast.error('Failed to process payment: ' + (err?.message || 'Unknown error'));
    } finally {
      setProcessing(false);
    }
  };

  const handleManualReceiptSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualForm.custom_name.trim() && !manualForm.student_id) {
      return toast.error('Please select or enter a student name');
    }

    const selectedStudentObj = allStudents.find(s => s.id === manualForm.student_id);
    const sName = selectedStudentObj ? selectedStudentObj.name : manualForm.custom_name.trim();
    const sRoll = selectedStudentObj ? selectedStudentObj.roll_number : (manualForm.roll_number.trim() || 'MANUAL-REC');
    const sClass = selectedStudentObj ? selectedStudentObj.class_name : manualForm.class_name;

    const txId = crypto.randomUUID();
    const nowIso = new Date().toISOString();

    const manualTx = {
      id: txId,
      challan_id: 'MANUAL',
      amount_paid: Number(manualForm.amount_paid),
      payment_method: manualForm.payment_method,
      remarks: manualForm.remarks,
      status: 'completed',
      payment_date: nowIso,
      created_at: nowIso,
      manual_student_name: sName,
      manual_roll_number: sRoll,
      manual_class_name: sClass,
      manual_month_year: manualForm.month_year
    };

    const localTx = getStoredData('fee_transactions', []);
    const updatedTxList = [manualTx, ...localTx];
    setStoredData('fee_transactions', updatedTxList);
    setRecentTransactions(updatedTxList);

    const receiptPayload = {
      receipt_no: `REC-${txId.substring(0, 8).toUpperCase()}`,
      transaction_id: txId,
      date: nowIso,
      student_name: sName,
      roll_number: sRoll,
      class_name: sClass,
      month_year: manualForm.month_year,
      barcode_ref: `MANUAL-${Math.floor(100000 + Math.random() * 900000)}`,
      net_payable: Number(manualForm.net_payable),
      previous_paid: 0,
      amount_paid: Number(manualForm.amount_paid),
      total_paid: Number(manualForm.amount_paid),
      remaining_balance: Math.max(0, Number(manualForm.net_payable) - Number(manualForm.amount_paid)),
      payment_method: manualForm.payment_method,
      remarks: manualForm.remarks || 'Manual Fee Receipt Issued'
    };

    setIsManualModalOpen(false);
    setActiveReceipt(receiptPayload);
    toast.success(`Manual Fee Receipt Created for ${sName}!`);
  };

  const remainingBalance = challan ? Number(challan.net_payable) - Number(challan.paid_amount || 0) : 0;

  const openTxReceipt = (tx: any) => {
    const ch = allChallans.find(c => c.id === tx.challan_id) || challan;
    const st = allStudents.find(s => s.id === ch?.student_id) || student;

    const receiptPayload = {
      receipt_no: `REC-${tx.id.substring(0, 8).toUpperCase()}`,
      transaction_id: tx.id,
      date: tx.payment_date || tx.created_at || new Date().toISOString(),
      student_name: tx.manual_student_name || st?.name || 'Student',
      roll_number: tx.manual_roll_number || st?.roll_number || 'N/A',
      class_name: tx.manual_class_name || st?.class_name || 'N/A',
      month_year: tx.manual_month_year || ch?.month_year || 'N/A',
      barcode_ref: ch?.barcode_ref || 'MANUAL',
      net_payable: ch?.net_payable || tx.amount_paid,
      previous_paid: (ch?.paid_amount || tx.amount_paid) - tx.amount_paid,
      amount_paid: tx.amount_paid,
      total_paid: ch?.paid_amount || tx.amount_paid,
      remaining_balance: Math.max(0, (ch?.net_payable || tx.amount_paid) - (ch?.paid_amount || tx.amount_paid)),
      payment_method: tx.payment_method || 'Cash',
      remarks: tx.remarks || 'Fee Payment Receipt'
    };
    setActiveReceipt(receiptPayload);
  };

  const handlePrint = () => {
    window.print();
  };

  const renderReceiptCardView = (copyTitle: string) => (
    <div className="relative bg-white text-slate-900 border-2 border-slate-900 rounded-2xl p-6 overflow-hidden shadow-sm">
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none opacity-[0.06] z-0">
        <img src="/foundation-logo.png" alt="Watermark" className="w-72 h-72 object-contain" />
      </div>

      <div className="relative z-10 space-y-4">
        <div className="border-b-2 border-slate-900 pb-4 flex justify-between items-start">
          <div className="flex items-center gap-3">
            <img src="/foundation-logo.png" alt="Logo" className="w-12 h-12 object-contain shrink-0" />
            <div>
              <h2 className="font-serif font-bold text-xl tracking-wide uppercase text-slate-900 leading-tight">The Foundation Collegiate</h2>
              <p className="text-[11px] text-slate-600 font-medium">House #1704, Sector 11-E, Muslim Town, North Karachi</p>
              <p className="text-[10px] text-slate-500 font-mono">Ph: 0333-3439458 | Email: foundationcollegiate@gmail.com</p>
            </div>
          </div>
          <div className="text-right shrink-0">
            <span className="inline-block bg-blue-900 text-white font-bold text-[10px] uppercase tracking-wider px-2.5 py-1 rounded-md mb-1 shadow-xs">
              {copyTitle}
            </span>
            <div className="font-mono font-bold text-xs text-slate-800">{activeReceipt.receipt_no}</div>
            <p className="text-[10px] text-slate-500">Date: {new Date(activeReceipt.date).toLocaleDateString()}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 bg-slate-50/90 p-3 rounded-xl border border-slate-200 text-xs">
          <div>
            <span className="text-slate-500 block uppercase tracking-wider text-[9px] font-bold">Student Name</span>
            <span className="font-bold text-slate-900 text-sm">{activeReceipt.student_name}</span>
          </div>
          <div>
            <span className="text-slate-500 block uppercase tracking-wider text-[9px] font-bold">Roll Number</span>
            <span className="font-mono font-bold text-blue-900 text-sm">{activeReceipt.roll_number}</span>
          </div>
          <div>
            <span className="text-slate-500 block uppercase tracking-wider text-[9px] font-bold">Class / Program</span>
            <span className="font-semibold text-slate-800">{activeReceipt.class_name}</span>
          </div>
          <div>
            <span className="text-slate-500 block uppercase tracking-wider text-[9px] font-bold">Fee Month / Session</span>
            <span className="font-semibold text-slate-800">{activeReceipt.month_year}</span>
          </div>
        </div>

        <table className="w-full border-collapse text-xs">
          <thead>
            <tr className="bg-slate-900 text-white">
              <th className="py-2 px-3 text-left">Description</th>
              <th className="py-2 px-3 text-right">Amount (Rs.)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 border border-slate-200">
            <tr>
              <td className="py-1.5 px-3 text-slate-700">Total Net Fee Structure</td>
              <td className="py-1.5 px-3 text-right font-semibold">Rs. {activeReceipt.net_payable}</td>
            </tr>
            <tr>
              <td className="py-1.5 px-3 text-slate-700">Payment Channel / Method</td>
              <td className="py-1.5 px-3 text-right font-bold text-blue-700">{activeReceipt.payment_method}</td>
            </tr>
            <tr className="bg-emerald-50">
              <td className="py-2 px-3 font-bold text-emerald-800">Amount Received (Paid)</td>
              <td className="py-2 px-3 text-right font-bold text-emerald-700 text-sm">Rs. {activeReceipt.amount_paid}</td>
            </tr>
            <tr className={activeReceipt.remaining_balance > 0 ? "bg-amber-50" : "bg-slate-50"}>
              <td className="py-1.5 px-3 font-bold text-slate-800">Remaining Balance Dues</td>
              <td className={`py-1.5 px-3 text-right font-bold ${activeReceipt.remaining_balance > 0 ? 'text-amber-700' : 'text-slate-600'}`}>
                Rs. {activeReceipt.remaining_balance}
              </td>
            </tr>
          </tbody>
        </table>

        <div className="pt-4 flex justify-between items-end border-t border-slate-200">
          <div className="text-center">
            <div className="inline-block border-2 border-emerald-600 text-emerald-700 px-3 py-1 rounded-lg font-bold uppercase tracking-widest text-[10px] rotate-[-2deg] bg-emerald-50/50">
              ✓ OFFICIAL VERIFIED RECEIPT
            </div>
            <p className="text-[9px] text-slate-400 mt-1">Ref: {activeReceipt.barcode_ref}</p>
          </div>
          <div className="text-center w-40">
            <div className="border-b border-slate-800 pb-0.5 mb-1 font-semibold text-xs text-slate-800">Cashier Signature</div>
            <p className="text-[9px] text-slate-500">Accounts Department</p>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-8 max-w-5xl mx-auto hide-on-print">
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          @page {
            size: A4 portrait;
            margin: 8mm 6mm;
          }
          html, body {
            background: white !important;
            color: black !important;
            height: auto !important;
            min-height: 100% !important;
            overflow: visible !important;
          }
          .fixed {
            position: static !important;
            inset: auto !important;
            background: transparent !important;
            backdrop-filter: none !important;
            max-height: none !important;
            overflow: visible !important;
          }
          .printable-receipt-portal {
            position: static !important;
            display: block !important;
            visibility: visible !important;
            width: 100% !important;
            max-height: none !important;
            overflow: visible !important;
            background: white !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          .printable-receipt-portal * {
            visibility: visible !important;
          }
          .hide-on-print {
            display: none !important;
          }
        }
      `}} />

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-display font-bold text-slate-800">Fee Payment & Receipt Center</h1>
          <p className="text-slate-500 text-sm mt-1">Scan challans, process payments, and issue official fee receipts (&quot;repit&quot;).</p>
        </div>

        <button
          onClick={() => setIsManualModalOpen(true)}
          className="flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-md shadow-emerald-500/20 transition-all active:scale-95"
        >
          <Plus size={18} /> Issue Manual Receipt
        </button>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <label className="block text-sm font-semibold text-slate-700 mb-2">Scan or Enter Challan Ref Number</label>
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              value={searchRef} 
              onChange={e => setSearchRef(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && searchChallan()}
              placeholder="e.g. FC-1234567890"
              className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 text-slate-800 placeholder:text-slate-400 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none text-base shadow-inner font-mono"
            />
          </div>
          <button 
            onClick={searchChallan}
            disabled={loading || !searchRef}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl disabled:opacity-50 transition-colors shadow-md shadow-blue-500/20"
          >
            {loading ? <RefreshCw className="animate-spin" /> : 'Search'}
          </button>
        </div>
      </div>

      {challan && student && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
            <div className="p-5 border-b border-slate-100 bg-slate-50/50">
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <AlertCircle size={18} className="text-blue-500" /> Challan Details
              </h3>
            </div>
            <div className="p-5 space-y-4 text-sm">
              <div className="flex justify-between border-b border-dashed border-slate-100 pb-2">
                <span className="text-slate-500">Student</span>
                <span className="font-bold text-slate-800 text-right">{student.name} <br/><span className="text-xs text-slate-400 font-normal">{student.roll_number}</span></span>
              </div>
              <div className="flex justify-between border-b border-dashed border-slate-100 pb-2">
                <span className="text-slate-500">Month</span>
                <span className="font-medium text-slate-800">{challan.month_year}</span>
              </div>
              <div className="flex justify-between border-b border-dashed border-slate-100 pb-2">
                <span className="text-slate-500">Net Payable</span>
                <span className="font-bold text-slate-800">Rs. {challan.net_payable}</span>
              </div>
              <div className="flex justify-between border-b border-dashed border-slate-100 pb-2">
                <span className="text-slate-500">Amount Paid</span>
                <span className="font-bold text-emerald-600">Rs. {challan.paid_amount || 0}</span>
              </div>
              <div className="flex justify-between pt-2">
                <span className="text-slate-800 font-bold">Remaining Balance</span>
                <span className="font-bold text-red-600 text-lg">Rs. {remainingBalance}</span>
              </div>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
            <div className="p-5 border-b border-slate-100 bg-slate-50/50">
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <Wallet size={18} className="text-emerald-500" /> New Payment & Issue Receipt
              </h3>
            </div>
            <form onSubmit={processPayment} className="p-5 space-y-4">
              {remainingBalance <= 0 ? (
                <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 p-4 rounded-xl flex items-center gap-3">
                  <CheckCircle2 size={24} />
                  <div>
                    <h4 className="font-bold">Fully Paid</h4>
                    <p className="text-sm text-emerald-600">There is no remaining balance for this challan.</p>
                  </div>
                </div>
              ) : (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">Amount to Pay (Rs)</label>
                    <input
                      type="number"
                      required
                      min="1"
                      max={remainingBalance}
                      value={paymentAmount}
                      onChange={e => setPaymentAmount(Number(e.target.value))}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 text-slate-800 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none text-lg font-bold shadow-inner"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">Payment Method</label>
                    <select
                      value={paymentMethod}
                      onChange={e => setPaymentMethod(e.target.value)}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 text-slate-800 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none text-sm"
                    >
                      <option value="Cash">Cash</option>
                      <option value="Bank Transfer">Bank Transfer</option>
                      <option value="Easypaisa">Easypaisa</option>
                      <option value="JazzCash">JazzCash</option>
                      <option value="Card">Debit/Credit Card</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">Remarks (Optional)</label>
                    <input
                      type="text"
                      value={remarks}
                      onChange={e => setRemarks(e.target.value)}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 text-slate-800 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none text-sm"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={processing}
                    className="w-full mt-4 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md shadow-emerald-500/20 transition-all disabled:opacity-50 flex items-center justify-center gap-2 text-base"
                  >
                    {processing ? <RefreshCw className="animate-spin" size={20} /> : <Receipt size={20} />}
                    Process Payment & Issue Receipt
                  </button>
                </>
              )}
            </form>
          </div>
        </div>
      )}

      {/* Recent Fee Transactions Log */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-bold text-slate-800 flex items-center gap-2">
            <History size={18} className="text-blue-600" /> Recent Payment Transactions Log
          </h3>
          <span className="text-xs text-slate-500 font-medium">{recentTransactions.length} records</span>
        </div>

        <div className="overflow-x-auto">
          <table className="admin-table w-full text-sm">
            <thead>
              <tr className="bg-slate-50 text-slate-600 border-b border-slate-200">
                <th className="py-3 px-4 text-left font-bold">Transaction Ref</th>
                <th className="py-3 px-4 text-left font-bold">Student Name</th>
                <th className="py-3 px-4 text-left font-bold">Method</th>
                <th className="py-3 px-4 text-left font-bold">Date</th>
                <th className="py-3 px-4 text-right font-bold">Amount Paid</th>
                <th className="py-3 px-4 text-right font-bold">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {recentTransactions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-slate-400">No payment transactions recorded yet.</td>
                </tr>
              ) : recentTransactions.slice(0, 15).map((tx) => {
                const ch = allChallans.find(c => c.id === tx.challan_id);
                const st = allStudents.find(s => s.id === ch?.student_id);
                const displayName = tx.manual_student_name || st?.name || 'Student';
                const displayClass = tx.manual_class_name || st?.class_name || 'N/A';

                return (
                  <tr key={tx.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4 font-mono text-xs text-slate-600">
                      REC-{tx.id.substring(0, 8).toUpperCase()}
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-800">
                      {displayName} <span className="text-xs font-normal text-slate-400">({displayClass})</span>
                    </td>
                    <td className="py-3 px-4 text-slate-700">
                      <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-xs font-bold text-slate-700 border border-slate-200">
                        {tx.payment_method || 'Cash'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-xs text-slate-500">
                      {tx.payment_date ? new Date(tx.payment_date).toLocaleDateString() : tx.created_at ? new Date(tx.created_at).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-emerald-600">
                      Rs. {tx.amount_paid}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => openTxReceipt(tx)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-600 text-blue-600 hover:text-white rounded-lg text-xs font-bold transition-all shadow-xs"
                      >
                        <Printer size={14} /> Print Receipt
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE MANUAL FEE RECEIPT MODAL */}
      {isManualModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-6">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                <Receipt className="text-emerald-600" size={20} /> Create Manual Fee Receipt
              </h3>
              <button onClick={() => setIsManualModalOpen(false)} className="p-1.5 bg-slate-100 hover:bg-slate-200 rounded-full text-slate-600 transition-colors">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleManualReceiptSubmit} className="space-y-4 text-sm">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Select Registered Student OR Type Name *</label>
                <select
                  value={manualForm.student_id}
                  onChange={e => {
                    const sid = e.target.value;
                    const found = allStudents.find(s => s.id === sid);
                    if (found) {
                      setManualForm(prev => ({
                        ...prev,
                        student_id: sid,
                        custom_name: found.name,
                        roll_number: found.roll_number || 'FC-2026-101',
                        class_name: found.class_name || 'Matric Science',
                        net_payable: 8500,
                        amount_paid: 8500
                      }));
                    } else {
                      setManualForm(prev => ({
                        ...prev,
                        student_id: ''
                      }));
                    }
                  }}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 text-slate-800 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none mb-2 font-semibold"
                >
                  <option value="">-- Type Custom Student Entry Below --</option>
                  {allStudents.map(s => (
                    <option key={s.id} value={s.id}>{s.name} ({s.roll_number} - {s.class_name})</option>
                  ))}
                </select>

                {!manualForm.student_id && (
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      type="text"
                      required
                      placeholder="Student Full Name *"
                      value={manualForm.custom_name}
                      onChange={e => setManualForm(prev => ({ ...prev, custom_name: e.target.value }))}
                      className="px-4 py-2.5 bg-slate-50 border border-slate-200 text-slate-800 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none font-semibold"
                    />
                    <input
                      type="text"
                      placeholder="Roll No (e.g. FC-2026-101)"
                      value={manualForm.roll_number}
                      onChange={e => setManualForm(prev => ({ ...prev, roll_number: e.target.value }))}
                      className="px-4 py-2.5 bg-slate-50 border border-slate-200 text-slate-800 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                    />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Class / Program</label>
                  <input
                    type="text"
                    value={manualForm.class_name}
                    onChange={e => setManualForm(prev => ({ ...prev, class_name: e.target.value }))}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 text-slate-800 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Month / Description</label>
                  <input
                    type="text"
                    value={manualForm.month_year}
                    onChange={e => setManualForm(prev => ({ ...prev, month_year: e.target.value }))}
                    placeholder="e.g. August 2026 Tuition"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 text-slate-800 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Total Net Fee (Rs)</label>
                  <input
                    type="number"
                    min="1"
                    value={manualForm.net_payable}
                    onChange={e => setManualForm(prev => ({ ...prev, net_payable: Number(e.target.value) }))}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 text-slate-800 font-bold rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Amount Paid (Rs) *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={manualForm.amount_paid}
                    onChange={e => setManualForm(prev => ({ ...prev, amount_paid: Number(e.target.value) }))}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 text-emerald-700 font-bold text-base rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Payment Method</label>
                  <select
                    value={manualForm.payment_method}
                    onChange={e => setManualForm(prev => ({ ...prev, payment_method: e.target.value }))}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 text-slate-800 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                  >
                    <option value="Cash">Cash</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="Easypaisa">Easypaisa</option>
                    <option value="JazzCash">JazzCash</option>
                    <option value="Card">Debit/Credit Card</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Remarks / Details</label>
                  <input
                    type="text"
                    value={manualForm.remarks}
                    onChange={e => setManualForm(prev => ({ ...prev, remarks: e.target.value }))}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 text-slate-800 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsManualModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-500/20"
                >
                  Generate Receipt
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Active Receipt Voucher Modal (2-Copy Voucher) */}
      {activeReceipt && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[95vh] overflow-hidden shadow-2xl border border-slate-200 flex flex-col">
            
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center hide-on-print">
              <div className="flex items-center gap-2 font-bold text-slate-800 text-sm">
                <ShieldCheck className="text-emerald-600" size={20} /> Official Payment Receipt (&quot;Repit&quot;) with Logo & Watermark
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrint}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs flex items-center gap-2 shadow-md shadow-blue-500/20 transition-all active:scale-95"
                >
                  <Printer size={16} /> Print Receipt Voucher
                </button>
                <button
                  onClick={() => setActiveReceipt(null)}
                  className="p-2 bg-slate-200 hover:bg-slate-300 rounded-full text-slate-700 transition-colors"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            <div className="p-6 overflow-y-auto printable-receipt-portal space-y-6">
              {renderReceiptCardView("Parent / Student Copy")}
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
