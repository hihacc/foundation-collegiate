'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase/client';
import SectionHeader from '@/components/ui/SectionHeader';
import Button from '@/components/ui/Button';

const formSchema = z.object({
  student_name: z.string().min(3, 'Name must be at least 3 characters'),
  father_name: z.string().min(3, 'Father name must be at least 3 characters'),
  class_applied: z.string().min(1, 'Please select a program'),
  previous_school: z.string().optional(),
  parent_phone: z.string().min(11, 'Valid phone number is required'),
  parent_email: z.string().email('Valid email is required').optional().or(z.literal('')),
  address: z.string().min(10, 'Complete address is required'),
});

type FormData = z.infer<typeof formSchema>;

export default function AdmissionsPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
  });

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    try {
      const { error } = await supabase.from('admissions').insert([data]);
      
      if (error) throw error;
      
      setIsSuccess(true);
      toast.success('Admission Application Submitted Successfully!', {
        description: 'Our team will contact you shortly.'
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
    <div className="py-20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl">
        <SectionHeader
          badge="Admissions 2026"
          title="Apply for"
          titleHighlight="Admission"
          description="Fill out the form below to secure your seat. Limited seats available for the upcoming session."
        />

        {isSuccess ? (
          <div className="mt-12 glass-card p-10 rounded-3xl text-center border-green-500/30 shadow-xl">
            <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-3xl font-bold mb-4">Application Received!</h3>
            <p className="text-muted text-lg mb-8">
              Thank you for choosing The Foundation Collegiate. Your application is under review. Our admission team will contact you at your provided phone number soon.
            </p>
            <Button onClick={() => setIsSuccess(false)}>Submit Another Application</Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="mt-12 glass-card p-8 md:p-10 rounded-3xl shadow-xl space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Student Name */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-foreground">Student&apos;s Full Name *</label>
                <input
                  {...register('student_name')}
                  className="w-full px-4 py-3 rounded-xl border border-border bg-background focus:ring-2 focus:ring-primary focus:outline-none transition-all"
                  placeholder="Enter student's name"
                />
                {errors.student_name && <p className="text-red-500 text-xs mt-1">{errors.student_name.message}</p>}
              </div>

              {/* Father Name */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-foreground">Father&apos;s Name *</label>
                <input
                  {...register('father_name')}
                  className="w-full px-4 py-3 rounded-xl border border-border bg-background focus:ring-2 focus:ring-primary focus:outline-none transition-all"
                  placeholder="Enter father's name"
                />
                {errors.father_name && <p className="text-red-500 text-xs mt-1">{errors.father_name.message}</p>}
              </div>

              {/* Program */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-foreground">Program Applying For *</label>
                <select
                  {...register('class_applied')}
                  className="w-full px-4 py-3 rounded-xl border border-border bg-background focus:ring-2 focus:ring-primary focus:outline-none transition-all"
                >
                  <option value="">Select a Program</option>
                  <option value="Matric Science">Matric Science (IX & X)</option>
                  <option value="Matric Computer">Matric Computer (IX & X)</option>
                  <option value="Pre-Medical">Intermediate Pre-Medical (XI & XII)</option>
                  <option value="Pre-Engineering">Intermediate Pre-Engineering (XI & XII)</option>
                  <option value="Commerce">Intermediate Commerce</option>
                </select>
                {errors.class_applied && <p className="text-red-500 text-xs mt-1">{errors.class_applied.message}</p>}
              </div>

              {/* Previous School */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-foreground">Previous School/College</label>
                <input
                  {...register('previous_school')}
                  className="w-full px-4 py-3 rounded-xl border border-border bg-background focus:ring-2 focus:ring-primary focus:outline-none transition-all"
                  placeholder="Name of previous institution"
                />
              </div>

              {/* Parent Phone */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-foreground">Parent/Guardian Phone *</label>
                <input
                  {...register('parent_phone')}
                  type="tel"
                  className="w-full px-4 py-3 rounded-xl border border-border bg-background focus:ring-2 focus:ring-primary focus:outline-none transition-all"
                  placeholder="03XX-XXXXXXX"
                />
                {errors.parent_phone && <p className="text-red-500 text-xs mt-1">{errors.parent_phone.message}</p>}
              </div>

              {/* Parent Email */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-foreground">Email Address (Optional)</label>
                <input
                  {...register('parent_email')}
                  type="email"
                  className="w-full px-4 py-3 rounded-xl border border-border bg-background focus:ring-2 focus:ring-primary focus:outline-none transition-all"
                  placeholder="example@email.com"
                />
                {errors.parent_email && <p className="text-red-500 text-xs mt-1">{errors.parent_email.message}</p>}
              </div>

              {/* Address */}
              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-semibold text-foreground">Complete Residential Address *</label>
                <textarea
                  {...register('address')}
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl border border-border bg-background focus:ring-2 focus:ring-primary focus:outline-none transition-all resize-none"
                  placeholder="House #, Street, Block, Area..."
                />
                {errors.address && <p className="text-red-500 text-xs mt-1">{errors.address.message}</p>}
              </div>
            </div>

            <div className="pt-6 border-t border-border">
              <Button type="submit" size="lg" className="w-full text-lg" isLoading={isSubmitting}>
                Submit Application
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
