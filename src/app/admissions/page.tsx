'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase/client';
import { getStoredData, setStoredData } from '@/lib/utils/storage';
import SectionHeader from '@/components/ui/SectionHeader';
import Button from '@/components/ui/Button';
import { Upload, Image as ImageIcon, X, Loader2 } from 'lucide-react';
import { AcademicClass, AcademicGroup, AcademicSubject } from '@/types';

const formSchema = z.object({
  student_name: z.string().min(3, 'Name must be at least 3 characters'),
  dob: z.string().min(1, 'Date of Birth is required'),
  religion: z.string().min(1, 'Religion is required'),
  nationality: z.string().min(1, 'Nationality is required'),
  cnic: z.string().min(1, 'CNIC/B-Form is required'),
  address: z.string().min(10, 'Complete residential address is required'),
  parent_phone: z.string().min(11, 'Valid phone number is required'),
  student_phone: z.string().optional(),
  previous_school: z.string().min(3, 'Name of School/College is required'),

  father_name: z.string().min(3, 'Father/Guardian name must be at least 3 characters'),
  father_occupation: z.string().min(2, 'Occupation is required'),
  father_profession_address: z.string().optional(),
  father_office_phone: z.string().optional(),
  father_cell_phone: z.string().min(11, 'Cell number is required'),
  parent_email: z.string().email('Valid email is required').optional().or(z.literal('')),
  
  class_id: z.string().min(1, 'Please select a class'),
  group_id: z.string().min(1, 'Please select a program/group'),
  subjects: z.array(z.string()).min(1, 'Please select at least one subject'),
  
  photo_url: z.string().min(1, 'Student photograph is required'),
});

type FormData = z.infer<typeof formSchema>;

export default function AdmissionsPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Dynamic Academic Data State
  const [classes, setClasses] = useState<AcademicClass[]>([]);
  const [groups, setGroups] = useState<AcademicGroup[]>([]);
  const [subjects, setSubjects] = useState<AcademicSubject[]>([]);
  
  const [loadingClasses, setLoadingClasses] = useState(true);
  const [loadingGroups, setLoadingGroups] = useState(false);
  const [loadingSubjects, setLoadingSubjects] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      subjects: []
    }
  });

  const photoUrl = watch('photo_url');
  const watchClassId = watch('class_id');
  const watchGroupId = watch('group_id');
  const watchSubjects = watch('subjects') || [];

  // 1. Fetch Classes on Mount
  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const res = await fetch('/api/academics/classes');
        const json = await res.json();
        setClasses((json.data || []).filter((c: AcademicClass) => c.is_active));
      } catch (err) {
        toast.error('Failed to load classes');
      } finally {
        setLoadingClasses(false);
      }
    };
    fetchClasses();
  }, []);

  // 2. Fetch Groups when Class changes
  useEffect(() => {
    if (!watchClassId) {
      setGroups([]);
      setValue('group_id', '');
      return;
    }
    const fetchGroups = async () => {
      setLoadingGroups(true);
      try {
        const res = await fetch(`/api/academics/groups?class_id=${watchClassId}`);
        const json = await res.json();
        setGroups((json.data || []).filter((g: AcademicGroup) => g.is_active));
        setValue('group_id', ''); // Reset group selection
        setValue('subjects', []); // Reset subject selection
      } catch (err) {
        toast.error('Failed to load groups');
      } finally {
        setLoadingGroups(false);
      }
    };
    fetchGroups();
  }, [watchClassId, setValue]);

  // 3. Fetch Subjects when Group changes
  useEffect(() => {
    if (!watchGroupId) {
      setSubjects([]);
      setValue('subjects', []);
      return;
    }
    const fetchSubjects = async () => {
      setLoadingSubjects(true);
      try {
        const res = await fetch(`/api/academics/subjects?group_id=${watchGroupId}`);
        const json = await res.json();
        const activeSubjects = (json.data || []).filter((s: AcademicSubject) => s.is_active);
        setSubjects(activeSubjects);
        
        // Auto-select compulsory subjects
        const compulsoryIds = activeSubjects.filter((s: AcademicSubject) => s.is_compulsory).map((s: AcademicSubject) => s.id);
        setValue('subjects', compulsoryIds, { shouldValidate: true });
      } catch (err) {
        toast.error('Failed to load subjects');
      } finally {
        setLoadingSubjects(false);
      }
    };
    fetchSubjects();
  }, [watchGroupId, setValue]);

  const handleSubjectToggle = (subjectId: string, isCompulsory: boolean) => {
    if (isCompulsory) return; // Prevent unchecking compulsory subjects
    
    const current = watchSubjects || [];
    if (current.includes(subjectId)) {
      setValue('subjects', current.filter(s => s !== subjectId), { shouldValidate: true });
    } else {
      setValue('subjects', [...current, subjectId], { shouldValidate: true });
    }
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image is too large. Maximum size is 5MB.');
      return;
    }

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      toast.error('Unsupported file format. Please upload JPG, PNG, or WEBP.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setValue('photo_url', event.target.result as string, { shouldValidate: true });
        toast.success('Photo loaded successfully');
      }
    };
    reader.readAsDataURL(file);
  };

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    try {
      const selectedClass = classes.find(c => c.id === data.class_id);
      const selectedGroup = groups.find(g => g.id === data.group_id);
      
      const isUUID = (str: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);

      const metadata = {
        dob: data.dob,
        religion: data.religion,
        nationality: data.nationality,
        cnic: data.cnic,
        student_phone: data.student_phone,
        father_occupation: data.father_occupation,
        father_profession_address: data.father_profession_address,
        father_office_phone: data.father_office_phone,
        father_cell_phone: data.father_cell_phone,
        subject_ids: data.subjects,
        photo_url: data.photo_url,
        official_use: {
          remarks: '',
          gr_no: '',
          section: '',
          date_of_admission: '',
          admission_fee: '',
          monthly_fee: '',
          fee_grid: []
        }
      };

      const classLabel = selectedClass 
        ? `${selectedClass.name}${selectedGroup ? ' - ' + selectedGroup.name : ''}` 
        : 'General Application';

      const dbPayload = {
        student_name: data.student_name,
        father_name: data.father_name,
        date_of_birth: data.dob || null,
        class_id: isUUID(data.class_id) ? data.class_id : null,
        group_id: isUUID(data.group_id) ? data.group_id : null,
        class_applied: classLabel,
        previous_school: data.previous_school,
        parent_phone: data.parent_phone,
        parent_email: data.parent_email || null,
        address: data.address,
        photo_url: data.photo_url || null,
        status: 'pending',
        notes: JSON.stringify(metadata)
      };

      let insertedId = crypto.randomUUID();
      try {
        const { data: insertedData, error: insertErr } = await supabase
          .from('admissions')
          .insert([dbPayload])
          .select();
        if (insertedData && insertedData[0]?.id) {
          insertedId = insertedData[0].id;
        } else if (insertErr) {
          console.warn('Supabase insert notice:', insertErr.message);
        }
      } catch (sbErr) {
        console.warn('Supabase insert fallback:', sbErr);
      }

      const newApp = {
        id: insertedId,
        ...dbPayload,
        metadata
      };

      const current = getStoredData<any[]>('admissions', []);
      setStoredData('admissions', [newApp, ...current]);

      setIsSuccess(true);
      toast.success('Admission Application Submitted Successfully!', {
        description: 'Our administration team will contact you shortly.'
      });
      reset();
    } catch (error: any) {
      toast.error('Failed to submit application', {
        description: error.message || 'Please try again later or contact support.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="py-20 bg-slate-50 min-h-screen">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-5xl">
        <SectionHeader
          badge="Admissions"
          title="Admission"
          titleHighlight="Form"
          description="The Foundation Collegiate - Strength of Experience. Fill out the comprehensive form below to apply."
        />

        {isSuccess ? (
          <div className="mt-12 bg-white border border-green-500/30 shadow-sm p-12 rounded-[2rem] text-center">
            <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-3xl font-bold mb-4 text-slate-800">Application Received!</h3>
            <p className="text-slate-600 text-lg mb-8">
              Thank you for choosing The Foundation Collegiate. Your application is under review. Our admission team will contact you soon.
            </p>
            <Button onClick={() => setIsSuccess(false)}>Submit Another Application</Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="mt-12 space-y-8">
            
            <div className="bg-white border border-slate-200 p-8 rounded-[2rem] shadow-sm">
              <h3 className="text-2xl font-display font-bold text-slate-800 mb-6 pb-4 border-b border-slate-100">Particulars of Student Seeking Admission</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-bold text-slate-700">1) Name (in capital letters) *</label>
                  <input {...register('student_name')} className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none uppercase" placeholder="ENTER NAME" />
                  {errors.student_name && <p className="text-red-500 text-xs">{errors.student_name.message}</p>}
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">2) Date of Birth *</label>
                  <input type="date" {...register('dob')} className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none" />
                  {errors.dob && <p className="text-red-500 text-xs">{errors.dob.message}</p>}
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">3) Religion *</label>
                  <input {...register('religion')} className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Religion" />
                  {errors.religion && <p className="text-red-500 text-xs">{errors.religion.message}</p>}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Nationality *</label>
                  <input {...register('nationality')} className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Nationality" />
                  {errors.nationality && <p className="text-red-500 text-xs">{errors.nationality.message}</p>}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">4) CNIC # / B-Form *</label>
                  <input {...register('cnic')} className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none" placeholder="XXXXX-XXXXXXX-X" />
                  {errors.cnic && <p className="text-red-500 text-xs">{errors.cnic.message}</p>}
                </div>

                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-bold text-slate-700">5) Residential Address *</label>
                  <input {...register('address')} className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Complete Address" />
                  {errors.address && <p className="text-red-500 text-xs">{errors.address.message}</p>}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">6) Ph. Res. / Cell # *</label>
                  <input {...register('parent_phone')} type="tel" className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none" placeholder="03XX-XXXXXXX" />
                  {errors.parent_phone && <p className="text-red-500 text-xs">{errors.parent_phone.message}</p>}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Student Cell #</label>
                  <input {...register('student_phone')} type="tel" className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Optional" />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-bold text-slate-700">7) Name of School / College *</label>
                  <input {...register('previous_school')} className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Previous Institution" />
                  {errors.previous_school && <p className="text-red-500 text-xs">{errors.previous_school.message}</p>}
                </div>
              </div>
            </div>

            <div className="bg-white border border-slate-200 p-8 rounded-[2rem] shadow-sm">
              <h3 className="text-2xl font-display font-bold text-slate-800 mb-6 pb-4 border-b border-slate-100">Particulars of Parents / Guardian</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-bold text-slate-700">1) Father / Guardian Name *</label>
                  <input {...register('father_name')} className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Name" />
                  {errors.father_name && <p className="text-red-500 text-xs">{errors.father_name.message}</p>}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">2) Occupation *</label>
                  <input {...register('father_occupation')} className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Occupation" />
                  {errors.father_occupation && <p className="text-red-500 text-xs">{errors.father_occupation.message}</p>}
                </div>

                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-bold text-slate-700">3) Professional Address</label>
                  <input {...register('father_profession_address')} className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Office / Business Address" />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">4) Phone Office</label>
                  <input {...register('father_office_phone')} type="tel" className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Phone Office" />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Cell # *</label>
                  <input {...register('father_cell_phone')} type="tel" className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Cell Number" />
                  {errors.father_cell_phone && <p className="text-red-500 text-xs">{errors.father_cell_phone.message}</p>}
                </div>
              </div>
            </div>

            <div className="bg-white border border-slate-200 p-8 rounded-[2rem] shadow-sm">
              <h3 className="text-2xl font-display font-bold text-slate-800 mb-6 pb-4 border-b border-slate-100">Academic Program Selection</h3>
              
              <div className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Select Class */}
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                      Class Level *
                      {loadingClasses && <Loader2 size={14} className="animate-spin text-blue-500" />}
                    </label>
                    <select 
                      {...register('class_id')} 
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none font-semibold text-slate-700"
                      disabled={loadingClasses}
                    >
                      <option value="">Select a Class</option>
                      {classes.map(cls => (
                        <option key={cls.id} value={cls.id}>{cls.name}</option>
                      ))}
                    </select>
                    {errors.class_id && <p className="text-red-500 text-xs">{errors.class_id.message}</p>}
                  </div>

                  {/* Select Group (Cascading) */}
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                      Program / Group *
                      {loadingGroups && <Loader2 size={14} className="animate-spin text-blue-500" />}
                    </label>
                    <select 
                      {...register('group_id')} 
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none font-semibold text-slate-700 disabled:opacity-50"
                      disabled={!watchClassId || loadingGroups || groups.length === 0}
                    >
                      <option value="">Select a Program</option>
                      {groups.map(grp => (
                        <option key={grp.id} value={grp.id}>{grp.name}</option>
                      ))}
                    </select>
                    {errors.group_id && <p className="text-red-500 text-xs">{errors.group_id.message}</p>}
                    {!watchClassId && <p className="text-xs text-slate-500">Please select a class first.</p>}
                    {watchClassId && !loadingGroups && groups.length === 0 && <p className="text-xs text-amber-600">No programs available for this class.</p>}
                  </div>
                </div>

                {/* Subjects (Cascading) */}
                {watchGroupId && (
                  <div className="space-y-4 pt-4 border-t border-slate-100">
                    <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                      Subjects *
                      {loadingSubjects && <Loader2 size={14} className="animate-spin text-blue-500" />}
                    </label>
                    
                    {subjects.length === 0 && !loadingSubjects ? (
                      <p className="text-sm text-slate-500 bg-slate-50 p-4 rounded-xl border border-slate-100">No subjects configured for this program.</p>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {subjects.map((sub) => (
                          <label 
                            key={sub.id} 
                            className={`flex items-start gap-3 p-3 rounded-xl border transition-colors ${sub.is_compulsory ? 'bg-blue-50/50 border-blue-100' : 'bg-slate-50 border-slate-100 hover:border-slate-300'} cursor-pointer`}
                          >
                            <input
                              type="checkbox"
                              checked={watchSubjects?.includes(sub.id)}
                              onChange={() => handleSubjectToggle(sub.id, sub.is_compulsory)}
                              disabled={sub.is_compulsory}
                              className="mt-1 w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500 disabled:opacity-70"
                            />
                            <div>
                              <span className="text-sm font-semibold text-slate-700 block">{sub.name}</span>
                              {sub.is_compulsory && <span className="text-[10px] uppercase font-bold text-blue-600 tracking-wider">Compulsory</span>}
                            </div>
                          </label>
                        ))}
                      </div>
                    )}
                    {errors.subjects && <p className="text-red-500 text-xs">{errors.subjects.message}</p>}
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white border border-slate-200 p-8 rounded-[2rem] shadow-sm flex flex-col items-center justify-center space-y-6">
              <div className="text-center">
                <h3 className="text-lg font-bold text-slate-800 mb-2">Student Photograph *</h3>
                <p className="text-sm text-slate-500 mb-6">Upload a passport-sized photograph (Required).</p>
                
                {photoUrl ? (
                  <div className="relative inline-block">
                    <img src={photoUrl} alt="Preview" className="w-32 h-32 object-cover rounded-xl border border-slate-200 shadow-sm" />
                    <button type="button" onClick={() => setValue('photo_url', '')} className="absolute -top-3 -right-3 w-8 h-8 bg-red-100 text-red-600 rounded-full flex items-center justify-center hover:bg-red-200 shadow-sm">
                      <X size={16} />
                    </button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center w-32 h-32 border-2 border-dashed border-slate-300 rounded-xl bg-slate-50 hover:bg-slate-100 cursor-pointer transition-colors group">
                    <ImageIcon className="text-slate-400 group-hover:text-blue-500 mb-2" size={32} />
                    <span className="text-xs font-semibold text-slate-500 group-hover:text-blue-500">Upload Photo</span>
                    <input type="file" accept="image/jpeg, image/png, image/webp" className="hidden" onChange={handlePhotoUpload} />
                  </label>
                )}
                {errors.photo_url && <p className="text-red-500 text-xs mt-2">{errors.photo_url.message}</p>}
              </div>

              <div className="w-full pt-6 border-t border-slate-100">
                <Button type="submit" size="lg" className="w-full text-lg shadow-sm" isLoading={isSubmitting}>
                  Submit Application Form
                </Button>
              </div>
            </div>

          </form>
        )}
      </div>
    </div>
  );
}
