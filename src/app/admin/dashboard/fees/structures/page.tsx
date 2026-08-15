'use client';
export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { Plus, Edit2, Trash2, BookOpen, X, Printer, Search, Calculator, CheckCircle, ShieldCheck } from 'lucide-react';
import { getStoredData, setStoredData } from '@/lib/utils/storage';

const defaultStructures = [
  { 
    id: '1', 
    class_name: 'Matric Science (Class 9 & 10)', 
    admission_fee: 10000, 
    monthly_tuition_fee: 6500, 
    annual_charges: 6000, 
    examination_fee: 2500,
    registration_fee: 2000,
    library_fee: 1000,
    sports_fee: 1000,
    lab_fee: 2000
  },
  { 
    id: '2', 
    class_name: 'Matric Computer (Class 9 & 10)', 
    admission_fee: 10000, 
    monthly_tuition_fee: 6500, 
    annual_charges: 6000, 
    examination_fee: 2500,
    registration_fee: 2000,
    library_fee: 1000,
    sports_fee: 1000,
    lab_fee: 2500
  },
  { 
    id: '3', 
    class_name: 'XI & XII Pre-Medical', 
    admission_fee: 15000, 
    monthly_tuition_fee: 9500, 
    annual_charges: 8000, 
    examination_fee: 3000,
    registration_fee: 3000,
    library_fee: 1500,
    sports_fee: 1500,
    lab_fee: 3500
  },
  { 
    id: '4', 
    class_name: 'XI & XII Pre-Engineering', 
    admission_fee: 15000, 
    monthly_tuition_fee: 9500, 
    annual_charges: 8000, 
    examination_fee: 3000,
    registration_fee: 3000,
    library_fee: 1500,
    sports_fee: 1500,
    lab_fee: 3500
  },
  { 
    id: '5', 
    class_name: 'XI & XII Computer Science / Commerce', 
    admission_fee: 12000, 
    monthly_tuition_fee: 8500, 
    annual_charges: 7000, 
    examination_fee: 2500,
    registration_fee: 2500,
    library_fee: 1200,
    sports_fee: 1200,
    lab_fee: 2000
  },
  { 
    id: '6', 
    class_name: 'Diploma in Information Technology (DIT)', 
    admission_fee: 8000, 
    monthly_tuition_fee: 5500, 
    annual_charges: 4000, 
    examination_fee: 2000,
    registration_fee: 2000,
    library_fee: 1000,
    sports_fee: 500,
    lab_fee: 3000
  }
];

export default function FeeStructuresPage() {
  const [structures, setStructures] = useState<any[]>(() => getStoredData('fee_structures', defaultStructures));
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [printStruct, setPrintStruct] = useState<any | null>(null);

  const [formData, setFormData] = useState({
    class_name: '',
    admission_fee: 0,
    monthly_tuition_fee: 0,
    annual_charges: 0,
    examination_fee: 0,
    registration_fee: 0,
    library_fee: 0,
    sports_fee: 0,
    lab_fee: 0
  });

  const fetchStructures = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.from('fee_structures').select('*').order('created_at', { ascending: true });
      if (!error && data && data.length > 0) {
        setStructures(data);
        setStoredData('fee_structures', data);
      }
    } catch {
      // Keep local
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchStructures(); }, []);

  const handleOpenModal = (struct: any = null) => {
    if (struct) {
      setEditingId(struct.id);
      setFormData({
        class_name: struct.class_name,
        admission_fee: struct.admission_fee || 0,
        monthly_tuition_fee: struct.monthly_tuition_fee || 0,
        annual_charges: struct.annual_charges || 0,
        examination_fee: struct.examination_fee || 0,
        registration_fee: struct.registration_fee || 0,
        library_fee: struct.library_fee || 0,
        sports_fee: struct.sports_fee || 0,
        lab_fee: struct.lab_fee || 0
      });
    } else {
      setEditingId(null);
      setFormData({
        class_name: '', admission_fee: 0, monthly_tuition_fee: 0, annual_charges: 0,
        examination_fee: 0, registration_fee: 0, library_fee: 0, sports_fee: 0, lab_fee: 0
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        const { error } = await supabase.from('fee_structures').update(formData).eq('id', editingId);
        if (error) throw error;
        
        const updated = structures.map(s => s.id === editingId ? { ...s, ...formData } : s);
        setStructures(updated);
        setStoredData('fee_structures', updated);
        toast.success('Fee structure updated successfully!');
      } else {
        const newStruct = { id: crypto.randomUUID(), ...formData, created_at: new Date().toISOString() };
        await supabase.from('fee_structures').insert([newStruct]);
        
        const updated = [...structures, newStruct];
        setStructures(updated);
        setStoredData('fee_structures', updated);
        toast.success('Fee structure created successfully!');
      }
      setIsModalOpen(false);
    } catch (err: any) {
      if (editingId) {
        const updated = structures.map(s => s.id === editingId ? { ...s, ...formData } : s);
        setStructures(updated);
        setStoredData('fee_structures', updated);
      } else {
        const newStruct = { id: crypto.randomUUID(), ...formData, created_at: new Date().toISOString() };
        const updated = [...structures, newStruct];
        setStructures(updated);
        setStoredData('fee_structures', updated);
      }
      toast.success('Fee structure saved (Local mode)');
      setIsModalOpen(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this fee structure?')) return;
    try {
      await supabase.from('fee_structures').delete().eq('id', id);
    } catch {
      // Silent
    }
    const updated = structures.filter(s => s.id !== id);
    setStructures(updated);
    setStoredData('fee_structures', updated);
    toast.success('Deleted successfully');
  };

  const handlePrintSheet = (struct: any) => {
    setPrintStruct(struct);
    setTimeout(() => {
      window.print();
    }, 300);
  };

  const filtered = structures.filter(s => 
    (s.class_name || '').toLowerCase().includes(search.toLowerCase())
  );

  const calculateFirstMonthTotal = (s: any) => {
    return (
      (s.admission_fee || 0) +
      (s.monthly_tuition_fee || 0) +
      (s.annual_charges || 0) +
      (s.examination_fee || 0) +
      (s.registration_fee || 0) +
      (s.library_fee || 0) +
      (s.sports_fee || 0) +
      (s.lab_fee || 0)
    );
  };

  const renderInputField = (label: string, name: string, type = 'number', required = false) => (
    <div>
      <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">{label}</label>
      <input
        type={type}
        required={required}
        value={(formData as any)[name]}
        onChange={e => setFormData({ ...formData, [name]: type === 'number' ? Number(e.target.value) : e.target.value })}
        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 text-slate-800 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all shadow-inner text-sm"
      />
    </div>
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto hide-on-print">
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          body * { visibility: hidden; }
          .print-fee-sheet, .print-fee-sheet * { visibility: visible; }
          .print-fee-sheet { position: absolute; left: 0; top: 0; width: 100%; display: block !important; }
          .hide-on-print { display: none !important; }
        }
      `}} />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-2xl sm:text-3xl font-display font-bold text-slate-800">Fee Structures & Packages</h1>
          <p className="text-slate-500 text-sm mt-1">Manage class tuition fees, admission charges, and official prospectus rate sheets.</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              value={search} 
              onChange={e => setSearch(e.target.value)}
              placeholder="Search class..."
              className="w-full sm:w-64 pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 text-slate-800 placeholder:text-slate-400 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm shadow-inner"
            />
          </div>
          <button
            onClick={() => handleOpenModal()}
            className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-md shadow-blue-500/20 transition-all active:scale-95"
          >
            <Plus size={18} /> Add Fee Structure
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map(struct => {
          const totalFirstMonth = calculateFirstMonthTotal(struct);
          return (
            <div key={struct.id} className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
              <div>
                <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-1.5 text-blue-600 mb-1">
                      <BookOpen size={16} />
                      <span className="font-bold text-[10px] tracking-wider uppercase">Class Package</span>
                    </div>
                    <h3 className="text-lg font-bold text-slate-800 leading-tight">{struct.class_name}</h3>
                  </div>
                  <div className="flex gap-1 bg-white p-1 rounded-lg border border-slate-200 shadow-sm shrink-0">
                    <button onClick={() => handlePrintSheet(struct)} title="Print Fee Sheet" className="p-1.5 text-slate-400 hover:text-slate-800 rounded-md hover:bg-slate-100 transition-colors">
                      <Printer size={14} />
                    </button>
                    <button onClick={() => handleOpenModal(struct)} title="Edit Structure" className="p-1.5 text-slate-400 hover:text-blue-600 rounded-md hover:bg-blue-50 transition-colors">
                      <Edit2 size={14} />
                    </button>
                    <button onClick={() => handleDelete(struct.id)} title="Delete Structure" className="p-1.5 text-slate-400 hover:text-red-600 rounded-md hover:bg-red-50 transition-colors">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                <div className="p-5 space-y-2.5 text-xs">
                  <div className="flex justify-between items-center py-1 border-b border-dashed border-slate-100">
                    <span className="text-slate-500 font-medium">Monthly Tuition Fee</span>
                    <span className="font-bold text-emerald-600 text-sm">Rs. {struct.monthly_tuition_fee?.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-dashed border-slate-100">
                    <span className="text-slate-500">Admission Fee (One-time)</span>
                    <span className="font-semibold text-slate-800">Rs. {struct.admission_fee?.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-dashed border-slate-100">
                    <span className="text-slate-500">Annual Charges</span>
                    <span className="font-semibold text-slate-800">Rs. {struct.annual_charges?.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-dashed border-slate-100">
                    <span className="text-slate-500">Examination Fee</span>
                    <span className="font-semibold text-slate-800">Rs. {struct.examination_fee?.toLocaleString()}</span>
                  </div>
                  {struct.lab_fee > 0 && (
                    <div className="flex justify-between items-center py-1 border-b border-dashed border-slate-100">
                      <span className="text-slate-500">Lab / Computer Fee</span>
                      <span className="font-semibold text-slate-800">Rs. {struct.lab_fee?.toLocaleString()}</span>
                    </div>
                  )}
                  {struct.registration_fee > 0 && (
                    <div className="flex justify-between items-center py-1 border-b border-dashed border-slate-100">
                      <span className="text-slate-500">Registration Fee</span>
                      <span className="font-semibold text-slate-800">Rs. {struct.registration_fee?.toLocaleString()}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-between items-center text-xs">
                <span className="text-slate-600 font-semibold flex items-center gap-1">
                  <Calculator size={14} className="text-blue-600" /> First Month Package:
                </span>
                <span className="font-bold text-slate-900 text-sm">Rs. {totalFirstMonth.toLocaleString()}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-xl border border-slate-200">
            <form onSubmit={handleSubmit} className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-slate-800">{editingId ? 'Edit Fee Structure' : 'New Class Fee Structure'}</h2>
                <button type="button" onClick={() => setIsModalOpen(false)} className="p-2 bg-slate-100 hover:bg-slate-200 rounded-full text-slate-600 transition-colors">
                  <X size={20} />
                </button>
              </div>
              
              <div className="space-y-6">
                {renderInputField("Class / Course Name (e.g., XI Pre-Engineering)", "class_name", "text", true)}
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {renderInputField("Monthly Tuition Fee (Rs)", "monthly_tuition_fee", "number", true)}
                  {renderInputField("Admission Fee (One-Time) (Rs)", "admission_fee")}
                  {renderInputField("Annual Charges (Rs)", "annual_charges")}
                  {renderInputField("Examination Fee (Rs)", "examination_fee")}
                  {renderInputField("Registration Fee (Rs)", "registration_fee")}
                  {renderInputField("Library Charges (Rs)", "library_fee")}
                  {renderInputField("Sports Charges (Rs)", "sports_fee")}
                  {renderInputField("Lab / Computer Fee (Rs)", "lab_fee")}
                </div>
              </div>

              <div className="mt-8 flex justify-end gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-2.5 rounded-xl font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors">
                  Cancel
                </button>
                <button type="submit" className="px-6 py-2.5 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-500/20 transition-all active:scale-95">
                  Save Structure
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PRINTABLE PROSPECTUS FEE SHEET */}
      {printStruct && (
        <div className="hidden print-fee-sheet p-8 bg-white text-slate-900 max-w-3xl mx-auto border-2 border-slate-900">
          <div className="border-b-2 border-slate-900 pb-4 mb-6 flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-serif font-bold tracking-wide uppercase text-blue-950">The Foundation Collegiate</h1>
              <p className="text-xs text-slate-600 font-medium">North Karachi, Karachi | Official Prospectus Fee Schedule</p>
              <h3 className="text-base font-bold text-blue-700 mt-2">Class: {printStruct.class_name}</h3>
            </div>
            <div className="text-right text-xs">
              <span className="inline-block bg-slate-900 text-white font-bold px-3 py-1 uppercase text-[10px] rounded-xs mb-1">Official Document</span>
              <p className="text-slate-500">Date: {new Date().toLocaleDateString()}</p>
            </div>
          </div>

          <table className="w-full border-collapse text-xs mb-8">
            <thead>
              <tr className="bg-slate-900 text-white">
                <th className="py-2.5 px-3 text-left">Fee Head</th>
                <th className="py-2.5 px-3 text-left">Type</th>
                <th className="py-2.5 px-3 text-right">Amount (Rs)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-300 border border-slate-900">
              <tr>
                <td className="py-2 px-3 font-semibold">Monthly Tuition Fee</td>
                <td className="py-2 px-3 text-slate-600">Recurring Monthly</td>
                <td className="py-2 px-3 text-right font-bold text-emerald-700">Rs. {printStruct.monthly_tuition_fee?.toLocaleString()}</td>
              </tr>
              <tr>
                <td className="py-2 px-3 font-semibold">Admission Fee</td>
                <td className="py-2 px-3 text-slate-600">One-time at Admission</td>
                <td className="py-2 px-3 text-right font-semibold">Rs. {printStruct.admission_fee?.toLocaleString()}</td>
              </tr>
              <tr>
                <td className="py-2 px-3 font-semibold">Annual Charges</td>
                <td className="py-2 px-3 text-slate-600">Yearly Session Fee</td>
                <td className="py-2 px-3 text-right font-semibold">Rs. {printStruct.annual_charges?.toLocaleString()}</td>
              </tr>
              <tr>
                <td className="py-2 px-3 font-semibold">Examination Fee</td>
                <td className="py-2 px-3 text-slate-600">Per Session</td>
                <td className="py-2 px-3 text-right font-semibold">Rs. {printStruct.examination_fee?.toLocaleString()}</td>
              </tr>
              {printStruct.lab_fee > 0 && (
                <tr>
                  <td className="py-2 px-3 font-semibold">Lab / Computer Charges</td>
                  <td className="py-2 px-3 text-slate-600">Practical Facilities</td>
                  <td className="py-2 px-3 text-right font-semibold">Rs. {printStruct.lab_fee?.toLocaleString()}</td>
                </tr>
              )}
            </tbody>
            <tfoot>
              <tr className="bg-slate-900 text-white font-bold text-sm">
                <td colSpan={2} className="py-3 px-3 uppercase text-right">Total Initial Admission Package</td>
                <td className="py-3 px-3 text-right text-base">Rs. {calculateFirstMonthTotal(printStruct).toLocaleString()}</td>
              </tr>
            </tfoot>
          </table>

          <div className="pt-8 flex justify-between items-end text-xs">
            <div className="text-center w-48 border-t border-slate-900 pt-1 font-semibold">Admission Officer Sign</div>
            <div className="text-center w-48 border-t border-slate-900 pt-1 font-semibold">Principal Approval & Stamp</div>
          </div>
        </div>
      )}
    </div>
  );
}
