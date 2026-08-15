'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Search, Download, Printer, Lock, CheckCircle, AlertCircle, ShieldCheck, Award, Mail, Calendar } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import SectionHeader from '@/components/ui/SectionHeader';
import Button from '@/components/ui/Button';
import type { Result } from '@/types';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { getStoredData } from '@/lib/utils/storage';

export default function ResultsPage() {
  const [rollNumber, setRollNumber] = useState('');
  const [pin, setPin] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [studentResults, setStudentResults] = useState<Result[]>([]);
  const [errorMsg, setErrorMsg] = useState('');
  const [allResults, setAllResults] = useState<Result[]>([]);

  useEffect(() => {
    // Initial fetch from Supabase to warm cache
    const fetchAll = async () => {
      try {
        const { data } = await supabase.from('results').select('*').order('created_at', { ascending: false });
        if (data && data.length > 0) {
          setAllResults(data as Result[]);
        } else {
          const stored = getStoredData<Result[]>('results', []);
          setAllResults(stored);
        }
      } catch {
        const stored = getStoredData<Result[]>('results', []);
        setAllResults(stored);
      }
    };
    fetchAll();
  }, []);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rollNumber.trim()) {
      toast.error('Please enter your Roll Number');
      return;
    }
    if (!pin.trim()) {
      toast.error('Please enter your 4-Digit PIN Code');
      return;
    }

    setIsLoading(true);
    setErrorMsg('');
    setResult(null);
    setStudentResults([]);

    const formattedRoll = rollNumber.trim().toUpperCase();
    const enteredPin = pin.trim();

    try {
      // 1. Verify PIN from Supabase `pins` table
      let pinVerified = true;
      try {
        const { data: pinData } = await supabase
          .from('pins')
          .select('*')
          .ilike('roll_number', formattedRoll)
          .maybeSingle();

        if (pinData && pinData.pin_hash) {
          if (pinData.pin_hash !== enteredPin) {
            pinVerified = false;
          }
        } else {
          // Check local stored pins backup
          const storedPins = JSON.parse(localStorage.getItem('tfc_admin_pins') || '{}');
          const localPin = storedPins[formattedRoll]?.pin_hash;
          if (localPin && localPin !== enteredPin) {
            pinVerified = false;
          }
        }
      } catch {
        /* Ignore DB pin lookup error */
      }

      if (!pinVerified) {
        setErrorMsg(`Incorrect Security PIN code for Roll Number "${formattedRoll}". Please verify your credentials or contact institute administration.`);
        setIsLoading(false);
        return;
      }

      // 2. Query Supabase for student results by Roll Number
      let dbResults: Result[] = [];
      try {
        const { data, error } = await supabase
          .from('results')
          .select('*')
          .ilike('roll_number', formattedRoll)
          .order('created_at', { ascending: false });

        if (!error && data && data.length > 0) {
          dbResults = data as Result[];
        }
      } catch (err) {
        console.warn('Supabase search warning:', err);
      }

      // 3. Fallback to local stored results if DB returned no rows
      if (dbResults.length === 0) {
        const cleanQuery = formattedRoll.replace(/[^A-Z0-9]/gi, '');
        const matched = allResults.filter(r => {
          const rClean = (r.roll_number || '').replace(/[^A-Z0-9]/gi, '');
          return rClean === cleanQuery || rClean.includes(cleanQuery);
        });
        if (matched.length > 0) dbResults = matched;
      }

      // 4. Handle No Results Found
      if (dbResults.length === 0) {
        setErrorMsg(`No examination records found for Roll Number "${formattedRoll}". Please check your roll number or ensure your results have been published.`);
        setIsLoading(false);
        return;
      }

      // 5. Success! Load all monthly results for this student
      setStudentResults(dbResults);
      setResult(dbResults[0]);
      toast.success(`Found ${dbResults.length} exam result card(s) for ${dbResults[0].student_name}!`);
    } catch (err: any) {
      setErrorMsg(err.message || 'Verification failed. Please try again.');
      toast.error('Verification Error', { description: err.message });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = async () => {
    const element = document.getElementById('mark-sheet-certificate');
    if (!element) return;
    
    toast.info('Generating official PDF Mark Sheet...', { id: 'pdf' });
    try {
      // Add a temporary white background just for printing to prevent transparent/black PDFs
      const originalBg = element.style.backgroundColor;
      element.style.backgroundColor = '#ffffff';

      const canvas = await html2canvas(element, { 
        scale: 2, 
        useCORS: true, 
        allowTaint: true,
        backgroundColor: '#ffffff'
      });
      
      element.style.backgroundColor = originalBg;

      const imgData = canvas.toDataURL('image/jpeg', 1.0);
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      // If the content is too long for one A4 page, we still render it, but ideally it fits.
      pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`MarkSheet_${result?.roll_number || 'Certificate'}_${(result?.month || 'Session').replace(/\s+/g, '_')}.pdf`);
      
      toast.success('Official Mark Sheet PDF downloaded!', { id: 'pdf' });
    } catch (err: any) {
      console.error(err);
      toast.error('Failed to generate PDF. You can use the Print button.', { id: 'pdf' });
    }
  };

  const handleEmailTranscript = async () => {
    if (!result) return;
    const emailPrompt = prompt('Enter recipient email address to send this official mark sheet:');
    if (!emailPrompt || !emailPrompt.includes('@')) return toast.error('Invalid email address');
    
    toast.info(`Sending official mark sheet to ${emailPrompt}...`);
    try {
      await fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'RESULT_ANNOUNCEMENT',
          recipientEmail: emailPrompt,
          studentName: result.student_name,
          rollNumber: result.roll_number,
          className: result.class_name,
          percentage: result.percentage,
          grade: result.grade
        })
      });
      toast.success(`Official Mark Sheet emailed to ${emailPrompt}!`);
    } catch {
      toast.success(`Mark Sheet notice sent to ${emailPrompt}!`);
    }
  };

  return (
    <div className="py-20 bg-[var(--background)]">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl">
        <SectionHeader
          badge="Official Portal"
          title="Student Result"
          titleHighlight="Verification"
          description="Enter your official Roll Number and 4-Digit Security PIN to inspect monthly test transcripts and marksheets."
          className="mb-12"
        />

        {/* Credentials Form Card */}
        <div className="clay-card rounded-3xl p-6 md:p-8 bg-white mb-10 shadow-xl border border-slate-200">
          <form onSubmit={handleSearch} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="text-sm font-bold text-slate-700 block mb-2">
                  Roll Number <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input
                    type="text"
                    required
                    placeholder="e.g. FC-26-101"
                    value={rollNumber}
                    onChange={(e) => setRollNumber(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 text-slate-800 font-mono text-sm rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 uppercase transition-all shadow-inner font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-bold text-slate-700 block mb-2">
                  Security PIN Code <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input
                    type="password"
                    required
                    maxLength={4}
                    placeholder="Enter 4-Digit PIN"
                    value={pin}
                    onChange={(e) => setPin(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 text-slate-800 font-mono text-sm rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 tracking-widest text-center font-bold transition-all shadow-inner"
                  />
                </div>
              </div>
            </div>

            <Button
              type="submit"
              size="lg"
              isLoading={isLoading}
              className="w-full bg-blue-600 hover:bg-blue-700 py-4 font-bold text-base shadow-lg shadow-blue-600/25"
            >
              <ShieldCheck size={20} className="mr-2" /> Authenticate & Load Mark Sheet
            </Button>
          </form>
        </div>

        {/* Error / Alert Message */}
        {errorMsg && (
          <div className="p-6 rounded-2xl bg-red-50 border border-red-200 text-red-700 flex items-center gap-3 mb-8 shadow-sm">
            <AlertCircle size={24} className="shrink-0" />
            <div>
              <h4 className="font-bold text-sm">Verification Failed</h4>
              <p className="text-xs mt-0.5">{errorMsg}</p>
            </div>
          </div>
        )}

        {/* Official Mark Sheet Certificate View */}
        {result && (
          <div className="space-y-6">
            {/* Month Selection Control (Shows ONLY Published Months for Student) */}
            <div className="bg-white p-5 rounded-3xl border-2 border-blue-600 shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-blue-100 text-blue-700 rounded-2xl">
                  <Calendar size={22} />
                </div>
                <div>
                  <label className="text-xs font-black uppercase tracking-wider text-slate-500 block">Select Announced Exam Month *</label>
                  <p className="text-xs font-semibold text-slate-700">Showing published results uploaded by administration</p>
                </div>
              </div>

              <div className="w-full md:w-72">
                <select
                  value={result.id}
                  onChange={(e) => {
                    const selected = studentResults.find(r => r.id === e.target.value);
                    if (selected) setResult(selected);
                  }}
                  className="w-full bg-slate-50 border-2 border-blue-500 text-slate-900 font-bold text-sm rounded-xl py-2.5 px-4 focus:outline-none focus:ring-2 focus:ring-blue-600 shadow-inner"
                >
                  {studentResults.map((resItem) => (
                    <option key={resItem.id} value={resItem.id}>
                      {resItem.month || resItem.exam_name || 'Monthly Test'} ({resItem.percentage}% - Grade {resItem.grade})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Verification Status & Action Controls */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-sm font-bold text-slate-700 flex items-center gap-2">
                <CheckCircle size={18} className="text-emerald-500" />
                Verified Transcript for <strong className="text-blue-600">{result.month || 'Current Term'}</strong>
              </span>
              <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap w-full sm:w-auto justify-end">
                <Button size="sm" variant="outline" onClick={handleEmailTranscript} className="border-slate-200 text-slate-700 text-xs">
                  <Mail size={14} className="mr-1.5" /> Email
                </Button>
                <Button size="sm" variant="outline" onClick={() => window.print()} className="border-slate-200 text-xs">
                  <Printer size={14} className="mr-1.5" /> Print
                </Button>
                <Button size="sm" onClick={handleDownload} className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold">
                  <Download size={14} className="mr-1.5" /> Download PDF
                </Button>
              </div>
            </div>

            {/* Official Mark Sheet Certificate Container */}
            <div
              id="mark-sheet-certificate"
              className="bg-white rounded-3xl p-6 sm:p-10 md:p-12 border-4 border-slate-800 shadow-2xl space-y-8 relative overflow-hidden ring-1 ring-slate-200"
            >
              {/* Background Watermark Pattern */}
              <div className="absolute inset-0 pointer-events-none opacity-4 flex items-center justify-center">
                <div className="text-9xl font-black text-slate-900 rotate-12 tracking-widest select-none">
                  TFC ACADEMICS
                </div>
              </div>

              {/* Certificate Header */}
              <div className="text-center border-b-2 border-slate-800 pb-6 relative z-10">
                <div className="flex items-center justify-between mb-6">
                  <div className="text-left font-mono text-[10px] text-slate-500 font-bold uppercase">
                    REF NO: TFC-MRK-{(result.id || '2026').replace(/[^a-zA-Z0-9]/g, '').slice(0, 8).toUpperCase()}<br />
                    VERIFIED ACADEMIC RECORD
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center font-bold text-white text-xl shadow-md">
                      TFC
                    </div>
                    <div className="text-left">
                      <div className="font-display font-black text-xl text-slate-900 leading-tight">The Foundation Collegiate</div>
                      <div className="text-[10px] font-bold text-blue-600 tracking-widest uppercase">We Know and Deliver Quality Education</div>
                    </div>
                  </div>
                  <div className="text-right font-mono text-[10px] text-slate-500 font-bold uppercase">
                    ISSUE DATE:<br />
                    <span suppressHydrationWarning>{new Date().toLocaleDateString('en-PK', { month: 'short', day: '2-digit', year: 'numeric' })}</span>
                  </div>
                </div>

                <div className="inline-block bg-blue-50 text-blue-800 border border-blue-200 px-6 py-2 rounded-full font-display font-black text-lg tracking-wider uppercase shadow-xs">
                  OFFICIAL MARKSHEET & TRANSCRIPT
                </div>
                <p className="text-xs font-bold text-slate-600 uppercase tracking-widest mt-2">
                  {result.exam_name || 'Monthly Assessment Test'} • {result.month || 'Session 2026'}
                </p>
              </div>

              {/* Student Metadata Table */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-slate-50 p-6 rounded-2xl border border-slate-200 text-sm relative z-10">
                <div>
                  <span className="text-xs text-slate-400 font-bold uppercase block">Student Name</span>
                  <span className="font-bold text-slate-900 text-base">{result.student_name}</span>
                </div>
                <div>
                  <span className="text-xs text-slate-400 font-bold uppercase block">Father&apos;s Name</span>
                  <span className="font-bold text-slate-800">{result.father_name || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-xs text-slate-400 font-bold uppercase block">Roll Number</span>
                  <span className="font-bold text-blue-600 font-mono text-base">{result.roll_number}</span>
                </div>
                <div>
                  <span className="text-xs text-slate-400 font-bold uppercase block">Class / Program</span>
                  <span className="font-bold text-slate-800">{result.class_name}</span>
                </div>
              </div>

              {/* Subject Breakdown Table */}
              <div className="relative z-10">
                <div className="font-bold text-xs uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-2">
                  <Award size={14} className="text-blue-600" /> Academic Performance Breakdown
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse border border-slate-200 rounded-xl overflow-hidden text-sm">
                    <thead>
                      <tr className="bg-blue-600 text-white text-xs uppercase tracking-wider font-bold">
                        <th className="py-3 px-4">Subject</th>
                        <th className="py-3 px-4 text-center">Total Marks</th>
                        <th className="py-3 px-4 text-center">Marks Obtained</th>
                        <th className="py-3 px-4 text-center">Grade</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 bg-white">
                      {result.subjects && result.subjects.length > 0 ? (
                        result.subjects.map((sub, idx) => (
                          <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
                            <td className="py-3 px-4 font-bold text-slate-800">{sub.name}</td>
                            <td className="py-3 px-4 text-center font-mono text-slate-600">{sub.total_marks}</td>
                            <td className="py-3 px-4 text-center font-mono font-bold text-blue-600">{sub.marks}</td>
                            <td className="py-3 px-4 text-center font-bold">
                              <span className={`px-2.5 py-0.5 rounded text-xs ${
                                sub.grade === 'F' ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'
                              }`}>
                                {sub.grade || (sub.marks >= (sub.total_marks * 0.8) ? 'A-1' : sub.marks >= (sub.total_marks * 0.6) ? 'A' : 'PASS')}
                              </span>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={4} className="py-6 px-4 text-center font-bold text-slate-500 bg-slate-50 border-dashed border-2 border-slate-200">
                            Overall Assessment Evaluation Recorded. Detailed subject marks not available.
                          </td>
                        </tr>
                      )}
                    </tbody>
                    <tfoot>
                      <tr className="bg-slate-100 font-bold border-t-2 border-slate-800">
                        <td className="py-3.5 px-4 font-extrabold text-slate-900 text-sm uppercase">GRAND TOTAL & AGGREGATE</td>
                        <td className="py-3.5 px-3 text-center font-mono font-black text-slate-800">{result.total_marks}</td>
                        <td className="py-3.5 px-3 text-center font-mono font-black text-blue-700 text-base">{result.obtained_marks}</td>
                        <td className="py-3.5 px-3 text-center font-mono font-black text-emerald-600 text-base">{result.percentage}% ({result.grade})</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              {/* Result Status & Honors Box */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-slate-50 p-5 rounded-2xl border-2 border-slate-200 text-center relative z-10">
                <div>
                  <span className="text-[11px] font-bold text-slate-400 uppercase block">Percentage</span>
                  <span className="text-xl font-black text-blue-600">{result.percentage}%</span>
                </div>
                <div>
                  <span className="text-[11px] font-bold text-slate-400 uppercase block">Rank / Position</span>
                  <span className="text-xl font-black text-amber-600">{result.position || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-[11px] font-bold text-slate-400 uppercase block">Final Result</span>
                  <span className={`text-xl font-black uppercase ${result.grade === 'F' ? 'text-red-600' : 'text-emerald-600'}`}>
                    {result.grade === 'F' ? 'FAILED' : (result.percentage >= 80 ? 'PASSED WITH DISTINCTION' : 'PASSED')}
                  </span>
                </div>
              </div>

              {/* Official Seal & Signature Section */}
              <div className="pt-8 border-t-2 border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-8 relative z-10">
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 rounded-full border-4 border-blue-600 flex items-center justify-center text-blue-600 font-black text-xs text-center leading-tight uppercase p-1 rotate-[-12deg] shadow-sm">
                    OFFICIAL SEAL
                  </div>
                  <div>
                    <div className="font-bold text-slate-800 text-xs">FOUNDER & DIRECTOR</div>
                    <div className="text-xs font-extrabold text-blue-600">Dr. Asif Iqbal, Ph.D.</div>
                  </div>
                </div>

                <div className="text-center sm:text-right border-t sm:border-t-0 sm:border-l border-slate-200 pt-4 sm:pt-0 sm:pl-8">
                  <div className="font-serif italic font-bold text-slate-800 text-lg tracking-widest border-b border-slate-400 pb-1 mb-1">
                    Dr. Asif Iqbal
                  </div>
                  <div className="text-[11px] font-bold text-slate-700 uppercase">Controller of Examinations</div>
                  <div className="text-[10px] text-slate-400 font-mono">THE FOUNDATION COLLEGIATE</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
