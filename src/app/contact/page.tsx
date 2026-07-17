'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase/client';
import { Mail, MapPin, Phone, Clock, Send } from 'lucide-react';
import SectionHeader from '@/components/ui/SectionHeader';
import Button from '@/components/ui/Button';

const FacebookIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>
  </svg>
);

const InstagramIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
  </svg>
);

const schema = z.object({
  name: z.string().min(2, 'Name is required'),
  phone: z.string().min(10, 'Valid phone number required'),
  email: z.string().email().optional().or(z.literal('')),
  subject: z.string().optional(),
  message: z.string().min(10, 'Message must be at least 10 characters'),
});

type FormData = z.infer<typeof schema>;

export default function ContactPage() {
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      const { error } = await supabase.from('messages').insert([data]);
      if (error) throw error;
      setSent(true);
      toast.success('Message sent! We will get back to you soon.');
      reset();
    } catch {
      toast.error('Failed to send. Please call us directly.');
    } finally {
      setLoading(false);
    }
  };

  const contactInfo = [
    { icon: Phone, label: 'Phone', value: '0333-3439458', href: 'tel:+923333439458' },
    { icon: Mail, label: 'Email', value: 'foundationcollegiate@gmail.com', href: 'mailto:foundationcollegiate@gmail.com' },
    { icon: MapPin, label: 'Address', value: 'House #1704, Sector 11-E, Muslim Town, North Karachi', href: 'https://maps.google.com/?q=North+Karachi+Muslim+Town' },
    { icon: Clock, label: 'Hours', value: 'Mon–Sat: 3:00 PM – 8:30 PM', href: null },
  ];

  return (
    <div className="py-20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeader
          badge="Get In Touch"
          title="Contact"
          titleHighlight="Us"
          description="Have questions about admissions or programs? We're here to help you every step of the way."
          className="mb-16"
        />

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-12">
          {/* Left — Contact Cards */}
          <div className="lg:col-span-2 space-y-6">
            {contactInfo.map((item) => (
              <div key={item.label} className="glass-card p-5 rounded-2xl flex items-start gap-4 hover:border-primary/30 transition-all">
                <div className="w-11 h-11 bg-primary/10 text-primary rounded-xl flex items-center justify-center shrink-0">
                  <item.icon size={22} />
                </div>
                <div>
                  <div className="text-xs font-bold uppercase tracking-widest text-muted mb-1">{item.label}</div>
                  {item.href ? (
                    <a href={item.href} className="font-semibold text-foreground hover:text-primary transition-colors break-all">{item.value}</a>
                  ) : (
                    <p className="font-semibold text-foreground">{item.value}</p>
                  )}
                </div>
              </div>
            ))}

            <div className="glass-card p-5 rounded-2xl">
              <div className="text-xs font-bold uppercase tracking-widest text-muted mb-4">Follow Us</div>
              <div className="flex gap-3">
                <a href="https://www.facebook.com/TheFoundationCollegiate/" target="_blank" rel="noreferrer"
                  className="w-11 h-11 bg-[#1877F2] text-white rounded-xl flex items-center justify-center hover:scale-110 transition-transform shadow-md">
                  <FacebookIcon />
                </a>
                <a href="https://www.instagram.com/thefoundationcollegiate/" target="_blank" rel="noreferrer"
                  className="w-11 h-11 text-white rounded-xl flex items-center justify-center hover:scale-110 transition-transform shadow-md"
                  style={{ background: 'linear-gradient(45deg, #f09433, #e6683c, #dc2743, #cc2366, #bc1888)' }}>
                  <InstagramIcon />
                </a>
              </div>
            </div>

            {/* Google Maps */}
            <div className="rounded-2xl overflow-hidden border border-border shadow-md h-56">
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3620.5!2d67.04!3d24.98!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMjTCsDU4JzUxLjYiTiA2N8KwMDInMjQuMCJF!5e0!3m2!1sen!2spk!4v1700000000000!5m2!1sen!2spk"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="The Foundation Collegiate Location"
              />
            </div>
          </div>

          {/* Right — Form */}
          <div className="lg:col-span-3">
            {sent ? (
              <div className="glass-card p-12 rounded-3xl text-center h-full flex flex-col items-center justify-center">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6 text-green-600">
                  <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                </div>
                <h3 className="text-2xl font-bold mb-3">Message Sent!</h3>
                <p className="text-muted mb-6">Thank you for reaching out. We&apos;ll contact you within 24 hours.</p>
                <Button onClick={() => setSent(false)} variant="outline">Send Another</Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit(onSubmit)} className="glass-card p-8 rounded-3xl shadow-xl space-y-5">
                <h3 className="text-2xl font-bold mb-2">Send a Message</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="text-sm font-semibold block mb-1.5">Full Name *</label>
                    <input {...register('name')} placeholder="Your name" className="w-full px-4 py-3 rounded-xl border border-border bg-background focus:ring-2 focus:ring-primary focus:outline-none" />
                    {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
                  </div>
                  <div>
                    <label className="text-sm font-semibold block mb-1.5">Phone *</label>
                    <input {...register('phone')} placeholder="03XX-XXXXXXX" className="w-full px-4 py-3 rounded-xl border border-border bg-background focus:ring-2 focus:ring-primary focus:outline-none" />
                    {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone.message}</p>}
                  </div>
                  <div>
                    <label className="text-sm font-semibold block mb-1.5">Email</label>
                    <input {...register('email')} type="email" placeholder="optional@email.com" className="w-full px-4 py-3 rounded-xl border border-border bg-background focus:ring-2 focus:ring-primary focus:outline-none" />
                  </div>
                  <div>
                    <label className="text-sm font-semibold block mb-1.5">Subject</label>
                    <input {...register('subject')} placeholder="Admissions / Results / General" className="w-full px-4 py-3 rounded-xl border border-border bg-background focus:ring-2 focus:ring-primary focus:outline-none" />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-semibold block mb-1.5">Your Message *</label>
                  <textarea {...register('message')} rows={5} placeholder="How can we help you?" className="w-full px-4 py-3 rounded-xl border border-border bg-background focus:ring-2 focus:ring-primary focus:outline-none resize-none" />
                  {errors.message && <p className="text-red-500 text-xs mt-1">{errors.message.message}</p>}
                </div>

                <Button type="submit" size="lg" className="w-full" isLoading={loading}>
                  <Send size={18} /> Send Message
                </Button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
