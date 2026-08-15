'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import SectionHeader from '@/components/ui/SectionHeader';
import { ArrowRight, CheckCircle2, BookOpen, Calculator, ShieldCheck, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { getStoredData } from '@/lib/utils/storage';

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

export default function FeeStructurePage() {
  const [structures, setStructures] = useState<any[]>(() => getStoredData('fee_structures', defaultStructures));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const fetchFees = async () => {
      try {
        const { data, error } = await supabase.from('fee_structures').select('*').order('created_at', { ascending: true });
        if (isMounted && !error && data && data.length > 0) {
          setStructures(data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchFees();
    return () => { isMounted = false; };
  }, []);

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

  return (
    <div className="py-20 bg-[var(--background)]">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
        <SectionHeader
          badge="Official Fee Schedule"
          title="Academic"
          titleHighlight="Fee Structure"
          description="Transparent and affordable education rates managed directly by administration for all programs and classes."
          className="mb-16"
        />

        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin mb-4 text-blue-600" />
            <p className="text-sm font-semibold">Loading official fee schedules...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
            {structures.map((tier) => {
              const totalFirstMonth = calculateFirstMonthTotal(tier);
              return (
                <div key={tier.id} className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-md hover:shadow-xl transition-all flex flex-col justify-between group">
                  <div>
                    <div className="p-8 border-b border-slate-100 bg-slate-50/80 text-center relative">
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-100 text-blue-700 font-bold text-[11px] uppercase tracking-wider mb-3">
                        <BookOpen size={13} /> {tier.class_name}
                      </div>
                      <div className="flex items-end justify-center gap-1">
                        <span className="text-sm font-bold text-slate-500 mb-1">PKR</span>
                        <span className="text-4xl font-black text-blue-600">{(tier.monthly_tuition_fee || 0).toLocaleString()}</span>
                        <span className="text-sm font-bold text-slate-500 mb-1">/mo</span>
                      </div>
                      <p className="text-xs font-semibold text-slate-500 mt-2">
                        Admission Fee: <strong className="text-slate-800">PKR {(tier.admission_fee || 0).toLocaleString()}</strong>
                      </p>
                    </div>

                    <div className="p-8 space-y-3 text-sm">
                      <div className="flex justify-between items-center py-1 border-b border-dashed border-slate-100">
                        <span className="text-slate-600 font-medium">Annual Session Fee</span>
                        <span className="font-bold text-slate-800">Rs. {(tier.annual_charges || 0).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between items-center py-1 border-b border-dashed border-slate-100">
                        <span className="text-slate-600 font-medium">Examination Fee</span>
                        <span className="font-bold text-slate-800">Rs. {(tier.examination_fee || 0).toLocaleString()}</span>
                      </div>
                      {tier.lab_fee > 0 && (
                        <div className="flex justify-between items-center py-1 border-b border-dashed border-slate-100">
                          <span className="text-slate-600 font-medium">Laboratory & IT Fee</span>
                          <span className="font-bold text-slate-800">Rs. {(tier.lab_fee || 0).toLocaleString()}</span>
                        </div>
                      )}
                      {tier.library_fee > 0 && (
                        <div className="flex justify-between items-center py-1 border-b border-dashed border-slate-100">
                          <span className="text-slate-600 font-medium">Library Access</span>
                          <span className="font-bold text-slate-800">Rs. {(tier.library_fee || 0).toLocaleString()}</span>
                        </div>
                      )}
                      {tier.registration_fee > 0 && (
                        <div className="flex justify-between items-center py-1 border-b border-dashed border-slate-100">
                          <span className="text-slate-600 font-medium">Board Registration</span>
                          <span className="font-bold text-slate-800">Rs. {(tier.registration_fee || 0).toLocaleString()}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="p-6 bg-slate-50 border-t border-slate-100 space-y-4">
                    <div className="flex justify-between items-center text-xs bg-white p-3 rounded-xl border border-slate-200 shadow-xs">
                      <span className="text-slate-600 font-bold flex items-center gap-1.5">
                        <Calculator size={14} className="text-blue-600" /> Initial Joining Total:
                      </span>
                      <span className="font-black text-slate-900 text-sm">Rs. {totalFirstMonth.toLocaleString()}</span>
                    </div>

                    <Link 
                      href="/admissions" 
                      className="block w-full py-3.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold text-center rounded-xl transition-all shadow-md shadow-blue-600/20 group-hover:-translate-y-0.5"
                    >
                      Apply Now for {tier.class_name}
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
        
        <div className="bg-amber-50 border border-amber-200 rounded-3xl p-6 sm:p-8 text-amber-900 text-sm flex gap-4 items-start shadow-sm">
          <ShieldCheck size={24} className="text-amber-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="font-bold text-base text-amber-900">Official Fee Policy</h4>
            <p className="leading-relaxed text-amber-800 text-xs sm:text-sm">
              All fee structures shown above are updated directly by the accounts department. Fee dues must be cleared before the 10th of each calendar month. Sibling discounts and financial aid are subject to administration approval during physical verification.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
