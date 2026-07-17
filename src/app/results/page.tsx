'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Search, Download, Printer, Lock } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import SectionHeader from '@/components/ui/SectionHeader';
import Button from '@/components/ui/Button';
import type { Result } from '@/types';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export default function ResultsPage() {
  const [rollNumber, setRollNumber] = useState('');
  const [pin, setPin] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rollNumber || !pin) {
      toast.error('Please enter both Roll Number and PIN');
      return;
    }

    setIsLoading(true);
    setErrorMsg('');
    setResult(null);

    try {
      // 1. Verify PIN
      const { data: pinData, error: pinError } = await supabase
        .from('pins')
        .select('result_id')
        .eq('roll_number', rollNumber)
        .eq('pin_hash', pin) // Ideally this should be hashed, but for simplicity we match direct
        .single();

      if (pinError || !pinData) {
        throw new Error('Invalid Roll Number or PIN combination.');
      }

      // 2. Fetch Result
      const { data: resultData, error: resultError } = await supabase
        .from('results')
        .select('*')
        .eq('id', pinData.result_id)
        .eq('is_active', true)
        .single();

      if (resultError || !resultData) {
        throw new Error('Result not found or has been disabled.');
      }

      setResult(resultData as Result);
      toast.success('Result loaded successfully!');
    } catch (err: any) {
      setErrorMsg(err.message);
      toast.error('Verification Failed', { description: err.message });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = async () => {
    const element = document.getElementById('result-sheet');
    if (!element) return;
    
    toast.info('Generating PDF...', { id: 'pdf' });
    try {
      const canvas = await html2canvas(element, { scale: 2 });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`${result?.roll_number}_Result.pdf`);
      toast.success('PDF Downloaded!', { id: 'pdf' });
    } catch (err) {
      toast.error('Failed to generate PDF', { id: 'pdf' });
    }
  };

  return (
    <div className="py-20 min-h-[80vh] bg-muted-bg">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl">
        <SectionHeader
          badge="Portal"
          title="Secure Result"
          titleHighlight="Checker"
          description="Enter your assigned Roll Number and secure PIN to view your academic performance."
        />

        {!result ? (
          <div className="mt-12 max-w-md mx-auto glass-card p-8 rounded-3xl shadow-xl">
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center text-primary">
                <Lock size={32} />
              </div>
            </div>
            
            <form onSubmit={handleSearch} className="space-y-6">
              {errorMsg && (
                <div className="p-4 bg-red-50 text-red-600 rounded-xl text-sm font-medium border border-red-100 text-center">
                  {errorMsg}
                </div>
              )}
              
              <div className="space-y-2">
                <label className="text-sm font-bold text-foreground">Roll Number</label>
                <input
                  type="text"
                  value={rollNumber}
                  onChange={(e) => setRollNumber(e.target.value)}
                  placeholder="e.g. TFC-1024"
                  className="w-full px-4 py-3 rounded-xl border border-border bg-background focus:ring-2 focus:ring-primary focus:outline-none transition-all uppercase"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-foreground">Secure PIN</label>
                <input
                  type="password"
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  placeholder="Enter 4-digit PIN"
                  maxLength={4}
                  className="w-full px-4 py-3 rounded-xl border border-border bg-background focus:ring-2 focus:ring-primary focus:outline-none transition-all text-center tracking-[1em] font-mono text-xl"
                />
              </div>

              <Button type="submit" className="w-full" size="lg" isLoading={isLoading}>
                <Search size={18} /> View Result
              </Button>
            </form>
          </div>
        ) : (
          <div className="mt-12 space-y-6">
            {/* Toolbar */}
            <div className="flex justify-end gap-4">
              <Button variant="outline" onClick={() => setResult(null)}>
                Check Another
              </Button>
              <Button variant="secondary" onClick={() => window.print()}>
                <Printer size={18} /> Print
              </Button>
              <Button onClick={handleDownload}>
                <Download size={18} /> Download PDF
              </Button>
            </div>

            {/* Printable Result Sheet */}
            <div id="result-sheet" className="bg-white text-black p-8 md:p-12 rounded-2xl shadow-2xl border border-slate-200 print:shadow-none print:border-none">
              
              {/* Header */}
              <div className="text-center border-b-2 border-slate-800 pb-6 mb-8">
                <h1 className="font-display font-black text-3xl md:text-4xl uppercase tracking-widest text-[#1a3a8f] mb-2">
                  The Foundation Collegiate
                </h1>
                <p className="font-semibold text-slate-600">House #1704, Sector 11-E, Muslim Town, North Karachi</p>
                <p className="font-semibold text-slate-600">Ph: 0333-3439458</p>
                <div className="mt-6 inline-block bg-[#1a3a8f] text-white px-6 py-2 font-bold text-lg rounded-full uppercase tracking-wider">
                  {result.exam_name} Mark Sheet
                </div>
              </div>

              {/* Student Details */}
              <div className="grid grid-cols-2 gap-x-8 gap-y-4 mb-8 text-sm md:text-base border-b border-slate-200 pb-8">
                <div className="flex gap-2"><span className="font-bold w-32">Student Name:</span> <span>{result.student_name}</span></div>
                <div className="flex gap-2"><span className="font-bold w-32">Roll Number:</span> <span className="font-mono font-bold text-[#1a3a8f]">{result.roll_number}</span></div>
                <div className="flex gap-2"><span className="font-bold w-32">Father&apos;s Name:</span> <span>{result.father_name}</span></div>
                <div className="flex gap-2"><span className="font-bold w-32">Class/Program:</span> <span>{result.class_name}</span></div>
                <div className="flex gap-2"><span className="font-bold w-32">Date:</span> <span>{result.exam_date || 'N/A'}</span></div>
              </div>

              {/* Marks Table */}
              <table className="w-full text-left border-collapse mb-8">
                <thead>
                  <tr className="bg-slate-100 text-slate-800 border-y-2 border-slate-800">
                    <th className="py-3 px-4 font-bold">Subject</th>
                    <th className="py-3 px-4 font-bold text-center">Total Marks</th>
                    <th className="py-3 px-4 font-bold text-center">Obtained</th>
                    <th className="py-3 px-4 font-bold text-center">Grade</th>
                  </tr>
                </thead>
                <tbody className="border-b-2 border-slate-800">
                  {result.subjects.map((sub, idx) => (
                    <tr key={idx} className="border-b border-slate-200">
                      <td className="py-3 px-4 font-medium">{sub.name}</td>
                      <td className="py-3 px-4 text-center">{sub.total_marks}</td>
                      <td className="py-3 px-4 text-center font-bold">{sub.marks}</td>
                      <td className="py-3 px-4 text-center font-bold">{sub.grade || '-'}</td>
                    </tr>
                  ))}
                  {/* Total Row */}
                  <tr className="bg-slate-50 font-black text-lg">
                    <td className="py-4 px-4 uppercase text-[#1a3a8f]">Total Result</td>
                    <td className="py-4 px-4 text-center">{result.total_marks}</td>
                    <td className="py-4 px-4 text-center text-[#1a3a8f]">{result.obtained_marks}</td>
                    <td className="py-4 px-4 text-center">-</td>
                  </tr>
                </tbody>
              </table>

              {/* Summary Cards */}
              <div className="grid grid-cols-3 gap-6 mb-12">
                <div className="bg-slate-100 rounded-xl p-4 text-center border border-slate-200">
                  <div className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-1">Percentage</div>
                  <div className="text-3xl font-black text-[#1a3a8f]">{result.percentage}%</div>
                </div>
                <div className="bg-slate-100 rounded-xl p-4 text-center border border-slate-200">
                  <div className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-1">Grade</div>
                  <div className="text-3xl font-black text-amber-500">{result.grade}</div>
                </div>
                <div className="bg-slate-100 rounded-xl p-4 text-center border border-slate-200">
                  <div className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-1">Position</div>
                  <div className="text-3xl font-black text-emerald-600">{result.position || '-'}</div>
                </div>
              </div>

              {/* Footer Remarks */}
              <div className="flex justify-between items-end pt-8 mt-8 border-t border-slate-200">
                <div>
                  <div className="font-bold mb-1">Remarks:</div>
                  <div className="italic text-slate-600">{result.remarks || 'Keep up the good work!'}</div>
                </div>
                <div className="text-center">
                  <div className="border-b border-slate-800 w-48 mb-2 pb-6"></div>
                  <div className="font-bold text-sm uppercase">Principal Signature</div>
                </div>
              </div>
              
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
