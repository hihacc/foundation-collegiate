'use client';
export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { Search, UserCog, Check, X, Users, BookOpen } from 'lucide-react';
import { getStoredData, setStoredData } from '@/lib/utils/storage';

const defaultStructures = [
  { id: '1', class_name: 'Matric Science (Class 9 & 10)', admission_fee: 10000, monthly_tuition_fee: 6500, annual_charges: 6000, examination_fee: 2500 },
  { id: '2', class_name: 'Matric Computer (Class 9 & 10)', admission_fee: 10000, monthly_tuition_fee: 6500, annual_charges: 6000, examination_fee: 2500 },
  { id: '3', class_name: 'XI & XII Pre-Medical', admission_fee: 15000, monthly_tuition_fee: 9500, annual_charges: 8000, examination_fee: 3000 },
  { id: '4', class_name: 'XI & XII Pre-Engineering', admission_fee: 15000, monthly_tuition_fee: 9500, annual_charges: 8000, examination_fee: 3000 },
  { id: '5', class_name: 'XI & XII Computer Science / Commerce', admission_fee: 12000, monthly_tuition_fee: 8500, annual_charges: 7000, examination_fee: 2500 },
  { id: '6', class_name: 'Diploma in Information Technology (DIT)', admission_fee: 8000, monthly_tuition_fee: 5500, annual_charges: 4000, examination_fee: 2000 }
];

export default function StudentFeesPage() {
  const [students, setStudents] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<any[]>([]);
  const [structures, setStructures] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  // Modal State
  const [selectedStudent, setSelectedStudent] = useState<any | null>(null);
  const [formData, setFormData] = useState({
    fee_structure_id: '',
    discount_type: 'None',
    discount_value: 0,
    transport_fee: 0
  });

  const fetchData = async () => {
    setLoading(true);
    let st: any[] = getStoredData('students', []);
    let pr: any[] = getStoredData('student_fee_profiles', []);
    let stc: any[] = getStoredData('fee_structures', defaultStructures);

    try {
      const { data: sData } = await supabase.from('students').select('*');
      if (sData && sData.length > 0) st = sData;
    } catch {}

    try {
      const { data: pData, error } = await supabase.from('student_fee_profiles').select('*');
      if (!error && pData && pData.length > 0) pr = pData;
    } catch {}

    try {
      const { data: fData } = await supabase.from('fee_structures').select('*');
      if (fData && fData.length > 0) stc = fData;
    } catch {}

    setStudents(st);
    setProfiles(pr);
    setStructures(stc);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const handleOpenConfig = (student: any) => {
    const profile = profiles.find(p => p.student_id === student.id);
    setSelectedStudent(student);
    if (profile && profile.fee_structure_id) {
      setFormData({
        fee_structure_id: profile.fee_structure_id || '',
        discount_type: profile.discount_type || 'None',
        discount_value: profile.discount_value || 0,
        transport_fee: profile.transport_fee || 0
      });
    } else {
      // Auto-match class name if possible
      const matched = structures.find(s => (s.class_name || '').toLowerCase().includes((student.class_name || '').toLowerCase()));
      setFormData({
        fee_structure_id: matched ? matched.id : (structures[0]?.id || ''),
        discount_type: 'None',
        discount_value: 0,
        transport_fee: 0
      });
    }
  };

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.fee_structure_id) return toast.error('Please select a fee structure');

    try {
      const existing = profiles.find(p => p.student_id === selectedStudent.id);
      let updatedProfiles = [...profiles];
      
      const payload = {
        student_id: selectedStudent.id,
        ...formData
      };

      if (existing) {
        await supabase.from('student_fee_profiles').update(formData).eq('student_id', selectedStudent.id).catch(() => {});
        updatedProfiles = updatedProfiles.map(p => p.student_id === selectedStudent.id ? { ...p, ...formData } : p);
      } else {
        const newProfile = { id: crypto.randomUUID(), ...payload, created_at: new Date().toISOString() };
        await supabase.from('student_fee_profiles').insert([newProfile]).catch(() => {});
        updatedProfiles.push(newProfile);
      }
      
      setProfiles(updatedProfiles);
      setStoredData('student_fee_profiles', updatedProfiles);
      toast.success('Fee profile saved successfully!');
      setSelectedStudent(null);
    } catch (err) {
      const existing = profiles.find(p => p.student_id === selectedStudent.id);
      let updatedProfiles = [...profiles];
      if (existing) {
        updatedProfiles = updatedProfiles.map(p => p.student_id === selectedStudent.id ? { ...p, ...formData } : p);
      } else {
        updatedProfiles.push({ id: crypto.randomUUID(), student_id: selectedStudent.id, ...formData });
      }
      setProfiles(updatedProfiles);
      setStoredData('student_fee_profiles', updatedProfiles);
      toast.success('Fee profile saved (Local Mode)');
      setSelectedStudent(null);
    }
  };

  const [statusTab, setStatusTab] = useState<'active' | 'all' | 'inactive' | 'graduated'>('active');

  const filtered = students.filter(s => {
    const st = String(s.status || '').toLowerCase().trim();
    const isInactive = st === 'inactive';
    const isGraduated = st === 'graduated' || st === 'alumni';
    const isActive = !isInactive && !isGraduated && s.is_active !== false;

    if (statusTab === 'active' && !isActive) return false;
    if (statusTab === 'inactive' && !isInactive) return false;
    if (statusTab === 'graduated' && !isGraduated) return false;

    return (
      (s.name || '').toLowerCase().includes(search.toLowerCase()) ||
      (s.roll_number || '').toLowerCase().includes(search.toLowerCase()) ||
      (s.class_name || '').toLowerCase().includes(search.toLowerCase())
    );
  });

  const activeCount = students.filter(s => {
    const st = String(s.status || '').toLowerCase().trim();
    return st !== 'inactive' && st !== 'graduated' && st !== 'alumni' && s.is_active !== false;
  }).length;

  const inactiveCount = students.filter(s => String(s.status || '').toLowerCase().trim() === 'inactive').length;
  const graduatedCount = students.filter(s => {
    const st = String(s.status || '').toLowerCase().trim();
    return st === 'graduated' || st === 'alumni';
  }).length;

  const getProfileInfo = (studentId: string) => {
    const profile = profiles.find(p => p.student_id === studentId);
    if (!profile) return null;
    const structure = structures.find(s => s.id === profile.fee_structure_id);
    return { profile, structure };
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-2xl sm:text-3xl font-display font-bold text-slate-800">Student Fee Profiles</h1>
          <p className="text-slate-500 text-sm mt-1">Assign fee structures and manage individual discounts.</p>
        </div>
        <div className="relative">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            value={search} 
            onChange={e => setSearch(e.target.value)}
            placeholder="Search student or roll number..."
            className="w-full sm:w-80 pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 text-slate-800 placeholder:text-slate-400 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm shadow-inner"
          />
        </div>
      </div>

      {/* Status Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={() => setStatusTab('active')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            statusTab === 'active'
              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-500/20'
              : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          🟢 Active Enrolled ({activeCount})
        </button>
        <button
          onClick={() => setStatusTab('all')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            statusTab === 'all'
              ? 'bg-slate-900 text-white'
              : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          All Students ({students.length})
        </button>
        <button
          onClick={() => setStatusTab('inactive')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            statusTab === 'inactive'
              ? 'bg-rose-600 text-white shadow-md shadow-rose-500/20'
              : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          🔴 Inactive ({inactiveCount})
        </button>
        <button
          onClick={() => setStatusTab('graduated')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            statusTab === 'graduated'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
              : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          🎓 Graduated / Alumni ({graduatedCount})
        </button>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="admin-table w-full text-sm">
            <thead>
              <tr className="bg-slate-50 text-slate-600 border-b border-slate-200">
                <th className="py-3.5 px-4 font-bold text-left">Student Info</th>
                <th className="py-3.5 px-4 font-bold text-left">Class</th>
                <th className="py-3.5 px-4 font-bold text-left">Assigned Structure</th>
                <th className="py-3.5 px-4 font-bold text-left">Discounts</th>
                <th className="py-3.5 px-4 font-bold text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan={5} className="p-4 text-center text-slate-400">Loading...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={5} className="p-12 text-center text-slate-400">No students found</td></tr>
              ) : filtered.map(student => {
                const info = getProfileInfo(student.id);
                
                return (
                  <tr key={student.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-800">{student.name}</div>
                      <div className="text-xs text-slate-500">{student.roll_number}</div>
                    </td>
                    <td className="py-3 px-4 text-slate-700 font-medium">{student.class_name}</td>
                    <td className="py-3 px-4">
                      {info?.structure ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-blue-50 text-blue-700 text-xs font-semibold border border-blue-100">
                          <BookOpen size={12} /> {info.structure.class_name}
                        </span>
                      ) : (
                        <span className="text-xs text-red-500 font-medium px-2 py-1 bg-red-50 rounded-md border border-red-100">Not Assigned</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      {info?.profile && info.profile.discount_type !== 'None' ? (
                        <span className="text-xs font-bold text-emerald-600">
                          {info.profile.discount_type}: {info.profile.discount_type === 'Percentage' ? `${info.profile.discount_value}%` : `Rs.${info.profile.discount_value}`}
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400">-</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => handleOpenConfig(student)}
                        className="inline-flex items-center gap-2 bg-white border border-slate-200 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 text-slate-600 px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-sm"
                      >
                        <UserCog size={14} /> Configure
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {selectedStudent && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-xl border border-slate-200">
            <form onSubmit={handleSaveConfig} className="p-6">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-xl font-bold text-slate-800">Fee Profile Settings</h2>
                  <p className="text-sm text-slate-500 mt-0.5">{selectedStudent.name} ({selectedStudent.roll_number})</p>
                </div>
                <button type="button" onClick={() => setSelectedStudent(null)} className="p-2 bg-slate-100 hover:bg-slate-200 rounded-full text-slate-600 transition-colors">
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-5">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">Assign Fee Structure *</label>
                  <select
                    required
                    value={formData.fee_structure_id}
                    onChange={e => setFormData({ ...formData, fee_structure_id: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 text-slate-800 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm font-semibold"
                  >
                    <option value="" disabled>Select Structure</option>
                    {structures.map(s => (
                      <option key={s.id} value={s.id}>{s.class_name} (Rs. {s.monthly_tuition_fee}/mo)</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">Discount Type</label>
                    <select
                      value={formData.discount_type}
                      onChange={e => setFormData({ ...formData, discount_type: e.target.value })}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 text-slate-800 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm"
                    >
                      <option value="None">No Discount</option>
                      <option value="Percentage">Percentage (%)</option>
                      <option value="Fixed">Fixed Amount (Rs)</option>
                      <option value="Scholarship">100% Scholarship</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">Discount Value</label>
                    <input
                      type="number"
                      min="0"
                      disabled={formData.discount_type === 'None' || formData.discount_type === 'Scholarship'}
                      value={formData.discount_type === 'Scholarship' ? 100 : formData.discount_value}
                      onChange={e => setFormData({ ...formData, discount_value: Number(e.target.value) })}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 text-slate-800 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm disabled:opacity-50"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">Custom Transport Fee (Optional)</label>
                  <input
                    type="number"
                    value={formData.transport_fee}
                    onChange={e => setFormData({ ...formData, transport_fee: Number(e.target.value) })}
                    placeholder="E.g., 2000"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 text-slate-800 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">Leaves blank or 0 if student doesn&apos;t use transport.</p>
                </div>
              </div>

              <div className="mt-8 flex justify-end gap-3">
                <button type="button" onClick={() => setSelectedStudent(null)} className="px-5 py-2.5 rounded-xl font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors text-sm">
                  Cancel
                </button>
                <button type="submit" className="px-5 py-2.5 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-500/20 transition-all active:scale-95 text-sm flex items-center gap-2">
                  <Check size={16} /> Save Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
