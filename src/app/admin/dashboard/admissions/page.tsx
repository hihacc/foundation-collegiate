'use client';
export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { Check, X, Eye, Search, ClipboardList, Download, Printer, Save, MessageCircle } from 'lucide-react';
import { getStoredData, setStoredData } from '@/lib/utils/storage';
import { Student } from '@/lib/types';
import Button from '@/components/ui/Button';

const isUUID = (str: any) => typeof str === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);

export default function AdminAdmissionsPage() {
  const [admissions, setAdmissions] = useState<any[]>(() => getStoredData('admissions', []));
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<any | null>(null);
  
  // For Official Use Editing
  const [officialData, setOfficialData] = useState<any>({});
  const [isSavingOfficial, setIsSavingOfficial] = useState(false);

  const fetchAdmissions = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.from('admissions').select('*').order('created_at', { ascending: false });
      if (!error && data && data.length > 0) {
        const mapped = data.map((d: any) => {
          let parsedMeta = d.metadata;
          if (!parsedMeta && d.notes) {
            try {
              parsedMeta = JSON.parse(d.notes);
            } catch {
              parsedMeta = {};
            }
          }
          return {
            ...d,
            metadata: parsedMeta || {}
          };
        });
        setAdmissions(mapped);
        setStoredData('admissions', mapped);
      }
    } catch {
      // keep stored data
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAdmissions(); }, []);

  // When a modal opens, load its official data to state
  useEffect(() => {
    if (selected) {
      const meta = selected.metadata || {};
      setOfficialData(meta.official_use || {
        remarks: '', gr_no: '', section: '', class: '', date_of_admission: '', admission_fee: '', monthly_fee: '',
        fee_grid: Array.from({ length: 12 }).map((_, i) => ({ month: ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][i], date: '', receipt_no: '', amount: '' }))
      });
    }
  }, [selected]);

  const updateStatus = async (id: string, status: string) => {
    if (isUUID(id)) {
      try {
        await supabase.from('admissions').update({ status }).eq('id', id);
      } catch { /* Silent fallback */ }
    }
    const updated = admissions.map(a => a.id === id ? { ...a, status } : a);
    setAdmissions(updated);
    setStoredData('admissions', updated);
    if (selected?.id === id) setSelected({ ...selected, status });

    if (status === 'approved') {
      const target = admissions.find(a => a.id === id);
      if (target) {
        const currentStudents = getStoredData<Student[]>('students', []);
        const alreadyExists = currentStudents.some(s => (s.name || '').toLowerCase() === (target.student_name || '').toLowerCase());
        if (!alreadyExists) {
          const generatedRoll = target.metadata?.official_use?.gr_no || `FC-2026-${(id || '').slice(0, 4).toUpperCase()}`;
          const newStudent: Student = {
            id: crypto.randomUUID(),
            name: target.student_name,
            father_name: target.father_name || 'N/A',
            roll_number: generatedRoll,
            class_name: target.class_applied || 'Matric Science',
            phone: target.parent_phone || '',
            status: 'active',
            is_active: true,
            created_at: new Date().toISOString(),
          };
          const updatedStudents = [newStudent, ...currentStudents];
          const { error } = await supabase.from('students').insert([newStudent]);
          if (error) console.warn('Supabase DB Insert Warning:', error.message);
          
          if (target.parent_email) {
            fetch('/api/send-email', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                type: 'welcome',
                payload: { email: target.parent_email, student_name: target.student_name, class_name: target.class_applied, roll_number: generatedRoll }
              })
            }).catch(() => {});
          }

          if (target.parent_phone) {
            const welcomeMsg = `🎓 *CONGRATULATIONS! ADMISSION CONFIRMED*\n*THE FOUNDATION COLLEGIATE (TFC)*\n\nDear Parent of *${target.student_name}*,\nWe are pleased to inform you that the admission application for *${target.student_name}* has been *APPROVED* for *${target.class_applied || 'Selected Program'}*.\n\n🆔 *Assigned Roll Number:* ${generatedRoll}\n📅 *Session:* 2026–2027\n\nPlease visit the college administration desk with original educational documents to complete final enrollment formalities.\n\n👉 Student Portal: https://foundation-collegiate.vercel.app\n\n*Principal & Admissions Committee*\n*The Foundation Collegiate*`;

            fetch('/api/admin/whatsapp/proxy', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                action: 'SEND_MESSAGE',
                payload: {
                  accountId: 'tfc-default-sender',
                  recipient: target.parent_phone,
                  messageBody: welcomeMsg,
                  metadata: { type: 'ADMISSION_APPROVED', roll: generatedRoll, name: target.student_name }
                }
              })
            }).catch(() => {});
          }

          toast.success(`Approved! Student "${target.student_name}" enrolled and WhatsApp & Email alerts sent.`);
          return;
        }
      }
    }
    toast.success(`Application status updated to ${status}`);
  };

  const handleSendWhatsAppOffer = async (app: any) => {
    const targetPhone = app.parent_phone;
    if (!targetPhone) return toast.error('No parent phone number provided');

    const offerMsg = `🎓 *ADMISSION OFFER LETTER — THE FOUNDATION COLLEGIATE*\n\nDear Parent of *${app.student_name}*,\nWe are reviewing your admission application for *${app.class_applied || 'TFC Academic Program'}*.\n\nStatus: *${(app.status || 'Under Review').toUpperCase()}*\nPrevious School: *${app.previous_school || 'N/A'}*\n\nPlease visit our campus Monday to Thursday 8:30 AM to 2:00 PM for interview and document verification.\n\n*Admissions Desk, The Foundation Collegiate*`;

    try {
      const res = await fetch('/api/admin/whatsapp/proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'SEND_MESSAGE',
          payload: {
            accountId: 'tfc-default-sender',
            recipient: targetPhone,
            messageBody: offerMsg,
            metadata: { type: 'ADMISSION_OFFER', applicationId: app.id, name: app.student_name }
          }
        })
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`Admission offer sent via WhatsApp to ${app.student_name}'s parent!`);
      } else {
        const clean = targetPhone.replace(/\D/g, '');
        window.open(`https://wa.me/${clean}?text=${encodeURIComponent(offerMsg)}`, '_blank');
        toast.info('Opened direct WhatsApp chat');
      }
    } catch {
      const clean = targetPhone.replace(/\D/g, '');
      window.open(`https://wa.me/${clean}?text=${encodeURIComponent(offerMsg)}`, '_blank');
    }
  };

  const saveOfficialData = async () => {
    if (!selected) return;
    setIsSavingOfficial(true);
    try {
      const updatedMetadata = {
        ...selected.metadata,
        official_use: officialData
      };

      if (isUUID(selected.id)) {
        await supabase.from('admissions').update({ notes: JSON.stringify(updatedMetadata) }).eq('id', selected.id);
      }
      
      const updatedApp = { ...selected, metadata: updatedMetadata };
      const updatedAdmissions = admissions.map(a => a.id === selected.id ? updatedApp : a);
      
      setAdmissions(updatedAdmissions);
      setStoredData('admissions', updatedAdmissions);
      setSelected(updatedApp);
      toast.success('Official Data Saved successfully!');
    } catch (err) {
      toast.error('Failed to save official data');
    } finally {
      setIsSavingOfficial(false);
    }
  };

  const handleFeeGridChange = (index: number, field: string, value: string) => {
    const newGrid = [...(officialData.fee_grid || [])];
    if (newGrid[index]) {
      newGrid[index][field] = value;
      setOfficialData({ ...officialData, fee_grid: newGrid });
    }
  };

  const statusColor: Record<string, string> = {
    pending:    'bg-amber-50 text-amber-700 border border-amber-200',
    approved:   'bg-emerald-50 text-emerald-700 border border-emerald-200',
    rejected:   'bg-red-50 text-red-700 border border-red-200',
  };

  const filtered = admissions.filter(a =>
    a.student_name?.toLowerCase().includes(search.toLowerCase()) ||
    a.parent_phone?.includes(search) ||
    a.class_applied?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-display font-bold text-slate-800">Admissions Management</h1>
          <p className="text-slate-500 text-sm mt-1">{admissions.length} total applications received</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hide-on-print">
        <div className="relative">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            value={search} 
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by student name or phone..."
            className="w-full sm:w-80 pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 text-slate-800 placeholder:text-slate-400 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm shadow-inner"
          />
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="admin-table w-full text-sm">
            <thead>
              <tr className="bg-slate-50 text-slate-600 border-b border-slate-200">
                <th className="py-3.5 px-4 font-bold text-left">Student & Parent</th>
                <th className="py-3.5 px-4 font-bold text-left">Class Applied</th>
                <th className="py-3.5 px-4 font-bold text-left">Contact</th>
                <th className="py-3.5 px-4 font-bold text-left">Status</th>
                <th className="py-3.5 px-4 font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                [...Array(4)].map((_, i) => (
                  <tr key={i}>
                    {[...Array(5)].map((_, j) => <td key={j} className="px-4 py-4"><div className="h-6 rounded-md bg-slate-100 animate-pulse" /></td>)}
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-16 text-slate-400">
                    <ClipboardList size={40} className="mx-auto mb-3 text-slate-300" />
                    <p className="text-slate-500 font-medium">No admission applications found</p>
                  </td>
                </tr>
              ) : filtered.map((a) => (
                <tr key={a.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-4 px-4">
                    <div className="font-bold text-slate-800">{a.student_name}</div>
                    <div className="text-xs text-slate-500">Father: {a.father_name || 'N/A'}</div>
                  </td>
                  <td className="py-4 px-4">
                    <div className="font-semibold text-blue-600">{a.class_applied}</div>
                    <div className="text-xs text-slate-400">{a.previous_school || 'N/A'}</div>
                  </td>
                  <td className="py-4 px-4">
                    <div className="text-slate-800 font-mono text-xs">{a.parent_phone}</div>
                    <div className="text-xs text-slate-400 truncate max-w-[150px]">{a.parent_email || '-'}</div>
                  </td>
                  <td className="py-4 px-4">
                    <span className={`text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider ${statusColor[a.status] || 'bg-slate-100 text-slate-600'}`}>
                      {a.status}
                    </span>
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex justify-end gap-2">
                      <button onClick={() => handleSendWhatsAppOffer(a)} title="Send WhatsApp Admission Offer / Invitation to Parent" className="w-8 h-8 bg-emerald-50 hover:bg-emerald-600 text-emerald-600 hover:text-white rounded-lg flex items-center justify-center transition-colors">
                        <MessageCircle size={16} />
                      </button>
                      <button onClick={() => updateStatus(a.id, 'approved')} title="Approve & Send to Student Directory" className="w-8 h-8 bg-emerald-50 hover:bg-emerald-600 text-emerald-600 hover:text-white rounded-lg flex items-center justify-center transition-colors">
                        <Check size={16} />
                      </button>
                      <button onClick={() => updateStatus(a.id, 'rejected')} title="Reject Application" className="w-8 h-8 bg-red-50 hover:bg-red-600 text-red-600 hover:text-white rounded-lg flex items-center justify-center transition-colors">
                        <X size={16} />
                      </button>
                      <button onClick={() => setSelected(a)} title="View Details" className="w-8 h-8 bg-blue-50 hover:bg-blue-600 text-blue-600 hover:text-white rounded-lg flex items-center justify-center transition-colors">
                        <Eye size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {selected && (
        <div className="fixed inset-0 z-[100] bg-slate-900/50 backdrop-blur-sm flex justify-center overflow-y-auto pt-10 pb-10 px-4">
          <div className="bg-white rounded-2xl max-w-4xl w-full shadow-2xl border border-slate-200 relative my-auto">
            
            {/* Sticky Header */}
            <div className="sticky top-0 bg-white/90 backdrop-blur-md border-b border-slate-200 p-6 rounded-t-2xl flex justify-between items-center z-10">
              <h2 className="text-2xl font-bold text-slate-800 font-display">Admission Form Review</h2>
              <button onClick={() => setSelected(null)} className="p-2 bg-slate-100 hover:bg-slate-200 rounded-full text-slate-600 transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="p-6 md:p-8 space-y-10">
              {/* STATUS BANNER */}
              <div className={`p-4 rounded-xl border flex items-center justify-between ${statusColor[selected.status] || 'bg-slate-50 border-slate-200'}`}>
                <div>
                  <p className="text-xs uppercase font-bold tracking-wider mb-1 opacity-70">Application Status</p>
                  <p className="text-lg font-bold capitalize">{selected.status}</p>
                </div>
                {selected.metadata?.photo_url && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={selected.metadata.photo_url} alt="Student" className="w-16 h-16 object-cover rounded-xl shadow-sm border border-slate-200" />
                )}
              </div>

              {/* 1. Particulars of Student */}
              <div>
                <h3 className="text-lg font-bold text-slate-800 border-b border-slate-200 pb-2 mb-4">Particulars of Student</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                  <div><p className="text-xs text-slate-500 font-bold uppercase">Name</p><p className="font-semibold text-slate-800">{selected.student_name}</p></div>
                  <div><p className="text-xs text-slate-500 font-bold uppercase">Date of Birth</p><p className="font-semibold text-slate-800">{selected.metadata?.dob || 'N/A'}</p></div>
                  <div><p className="text-xs text-slate-500 font-bold uppercase">Religion / Nationality</p><p className="font-semibold text-slate-800">{selected.metadata?.religion || 'N/A'} / {selected.metadata?.nationality || 'N/A'}</p></div>
                  <div><p className="text-xs text-slate-500 font-bold uppercase">CNIC #</p><p className="font-semibold text-slate-800">{selected.metadata?.cnic || 'N/A'}</p></div>
                  <div><p className="text-xs text-slate-500 font-bold uppercase">Student Cell</p><p className="font-semibold text-slate-800">{selected.metadata?.student_phone || 'N/A'}</p></div>
                  <div><p className="text-xs text-slate-500 font-bold uppercase">Previous School</p><p className="font-semibold text-slate-800">{selected.previous_school || 'N/A'}</p></div>
                  <div className="col-span-2 md:col-span-3"><p className="text-xs text-slate-500 font-bold uppercase">Residential Address</p><p className="font-semibold text-slate-800 bg-slate-50 p-3 mt-1 rounded-lg border border-slate-200">{selected.address}</p></div>
                </div>
              </div>

              {/* 2. Particulars of Parents */}
              <div>
                <h3 className="text-lg font-bold text-slate-800 border-b border-slate-200 pb-2 mb-4">Particulars of Parents / Guardian</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                  <div><p className="text-xs text-slate-500 font-bold uppercase">Father Name</p><p className="font-semibold text-slate-800">{selected.father_name}</p></div>
                  <div><p className="text-xs text-slate-500 font-bold uppercase">Occupation</p><p className="font-semibold text-slate-800">{selected.metadata?.father_occupation || 'N/A'}</p></div>
                  <div><p className="text-xs text-slate-500 font-bold uppercase">Phone Res.</p><p className="font-semibold text-slate-800">{selected.parent_phone}</p></div>
                  <div><p className="text-xs text-slate-500 font-bold uppercase">Phone Office</p><p className="font-semibold text-slate-800">{selected.metadata?.father_office_phone || 'N/A'}</p></div>
                  <div><p className="text-xs text-slate-500 font-bold uppercase">Cell #</p><p className="font-semibold text-slate-800">{selected.metadata?.father_cell_phone || 'N/A'}</p></div>
                  <div><p className="text-xs text-slate-500 font-bold uppercase">Email</p><p className="font-semibold text-slate-800">{selected.parent_email || 'N/A'}</p></div>
                  <div className="col-span-2 md:col-span-3"><p className="text-xs text-slate-500 font-bold uppercase">Professional Address</p><p className="font-semibold text-slate-800">{selected.metadata?.father_profession_address || 'N/A'}</p></div>
                </div>
              </div>

              {/* 3. Admission Required In */}
              <div>
                <h3 className="text-lg font-bold text-slate-800 border-b border-slate-200 pb-2 mb-4">Admission Details</h3>
                <div className="space-y-4">
                  <div><p className="text-xs text-slate-500 font-bold uppercase">Class</p><p className="font-semibold text-blue-600 text-lg">{selected.class_applied}</p></div>
                  <div>
                    <p className="text-xs text-slate-500 font-bold uppercase mb-2">Subjects Selected</p>
                    <div className="flex flex-wrap gap-2">
                      {(selected.metadata?.subjects || []).map((sub: string) => (
                        <span key={sub} className="px-3 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded-full text-sm font-semibold">{sub}</span>
                      ))}
                      {(!selected.metadata?.subjects || selected.metadata.subjects.length === 0) && (
                        <span className="text-slate-400 italic">No subjects selected</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* 4. Official Use */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 shadow-inner mt-8">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-slate-800">For Official Use</h3>
                  <Button onClick={saveOfficialData} isLoading={isSavingOfficial} size="sm"><Save size={16} /> Save Data</Button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mb-8">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-600 uppercase">Remarks (Recommended/Not)</label>
                    <input value={officialData.remarks || ''} onChange={e => setOfficialData({...officialData, remarks: e.target.value})} className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500 text-sm" placeholder="Remarks" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-600 uppercase">G.R. No.</label>
                    <input value={officialData.gr_no || ''} onChange={e => setOfficialData({...officialData, gr_no: e.target.value})} className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500 text-sm font-mono" placeholder="GR-XXXX" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-600 uppercase">Section</label>
                    <input value={officialData.section || ''} onChange={e => setOfficialData({...officialData, section: e.target.value})} className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500 text-sm" placeholder="Section A" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-600 uppercase">Date of Admission</label>
                    <input type="date" value={officialData.date_of_admission || ''} onChange={e => setOfficialData({...officialData, date_of_admission: e.target.value})} className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500 text-sm" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-600 uppercase">Admission Fee</label>
                    <input value={officialData.admission_fee || ''} onChange={e => setOfficialData({...officialData, admission_fee: e.target.value})} className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500 text-sm" placeholder="Amount" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-600 uppercase">Monthly Fee</label>
                    <input value={officialData.monthly_fee || ''} onChange={e => setOfficialData({...officialData, monthly_fee: e.target.value})} className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500 text-sm" placeholder="Amount" />
                  </div>
                </div>

                {/* Monthly Fee Grid */}
                <h4 className="text-sm font-bold text-slate-700 uppercase mb-3">Monthly Fee Record</h4>
                <div className="overflow-x-auto bg-white border border-slate-200 rounded-xl">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-slate-100 text-slate-700 border-b border-slate-200">
                      <tr>
                        <th className="px-4 py-2 font-bold w-24 border-r border-slate-200">Month</th>
                        <th className="px-4 py-2 font-bold border-r border-slate-200">Date</th>
                        <th className="px-4 py-2 font-bold border-r border-slate-200">Receipt No.</th>
                        <th className="px-4 py-2 font-bold">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {(officialData.fee_grid || []).map((row: any, idx: number) => (
                        <tr key={idx} className="hover:bg-slate-50 transition-colors">
                          <td className="px-4 py-2 font-bold text-slate-700 bg-slate-50 border-r border-slate-200">{row.month}</td>
                          <td className="p-1 border-r border-slate-200">
                            <input value={row.date} onChange={e => handleFeeGridChange(idx, 'date', e.target.value)} type="date" className="w-full px-2 py-1.5 bg-transparent focus:bg-white focus:outline-none rounded" />
                          </td>
                          <td className="p-1 border-r border-slate-200">
                            <input value={row.receipt_no} onChange={e => handleFeeGridChange(idx, 'receipt_no', e.target.value)} placeholder="Rcpt #" className="w-full px-2 py-1.5 bg-transparent focus:bg-white focus:outline-none rounded font-mono text-xs" />
                          </td>
                          <td className="p-1">
                            <input value={row.amount} onChange={e => handleFeeGridChange(idx, 'amount', e.target.value)} placeholder="Rs." className="w-full px-2 py-1.5 bg-transparent focus:bg-white focus:outline-none rounded text-slate-800 font-semibold" />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  );
}
