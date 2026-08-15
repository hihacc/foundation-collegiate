'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase/client';
import { getStoredData, setStoredData } from '@/lib/utils/storage';
import { Mail, MapPin, Phone, Clock, Send, CheckCircle2 } from 'lucide-react';
import SectionHeader from '@/components/ui/SectionHeader';
import Button from '@/components/ui/Button';
import { useSettings } from '@/lib/hooks/useSettings';

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
  name: z.string().min(2, 'Full Name is required'),
  phone: z.string().min(10, 'Valid phone number required (03XX-XXXXXXX)'),
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
  subject: z.string().optional(),
  message: z.string().min(10, 'Message must be at least 10 characters'),
});

type FormData = z.infer<typeof schema>;

export default function ContactPage() {
  const settings = useSettings();
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      const msgRecord = {
        id: crypto.randomUUID(),
        ...data,
        status: 'Pending',
        created_at: new Date().toISOString()
      };

      // 1. Supabase Insert
      try {
        await supabase.from('contacts').insert([msgRecord]);
      } catch (sbErr) {
        console.warn('Supabase contact insert fallback:', sbErr);
      }

      // 2. Persist in localStorage for Admin view
      const current = getStoredData<any[]>('messages', []);
      setStoredData('messages', [msgRecord, ...current]);

      // 3. Trigger Email Notification
      try {
        await fetch('/api/send-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type: 'contact', payload: msgRecord }),
        });
      } catch (e) {
        console.error('Failed to send email notification', e);
      }

      setSent(true);
      toast.success('Message sent successfully! We will contact you soon.');
      reset();
    } catch {
      toast.error('Failed to send message. Please call us directly.');
    } finally {
      setLoading(false);
    }
  };

  const phone = settings.contact_phone || '0333-3439458';
  const email = settings.contact_email || 'foundationcollegiate@gmail.com';
  const address = 'House# 1704, Sector 11-E, Muslim Town, North Karachi, Karachi, Pakistan';

  const contactInfo = [
    { icon: Phone, label: 'Phone', value: phone, href: `tel:${phone}` },
    { icon: Mail, label: 'Email', value: email, href: `mailto:${email}` },
    { icon: MapPin, label: 'Address', value: address, href: 'https://maps.google.com/?q=House+1704+Sector+11-E+Muslim+Town+North+Karachi' },
    { icon: Clock, label: 'Hours', value: 'Mon–Sat: 3:00 PM – 8:30 PM', href: null },
  ];

  return (
    <div className="py-20 bg-[var(--background)]">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
        <SectionHeader
          badge="Get In Touch"
          title="Contact"
          titleHighlight="The Foundation Collegiate"
          description="Have questions about admissions or programs? We're here to help you every step of the way."
          className="mb-16"
        />

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-12 items-start">
          {/* Left Column — Contact Information Cards */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white border border-slate-200 shadow-sm p-6 sm:p-8 rounded-3xl">
              <h3 className="text-xl font-bold text-slate-800 mb-6">Contact Us</h3>
              
              <div className="space-y-6">
                {contactInfo.map((item) => (
                  <div key={item.label} className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center shrink-0">
                      <item.icon size={22} />
                    </div>
                    <div>
                      <div className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-1">{item.label}</div>
                      {item.href ? (
                        <a href={item.href} className="font-semibold text-slate-800 hover:text-blue-600 transition-colors break-all text-sm sm:text-base">
                          {item.value}
                        </a>
                      ) : (
                        <p className="font-semibold text-slate-800 text-sm sm:text-base">{item.value}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Social Accounts (If available) */}
            <div className="bg-white border border-slate-200 shadow-sm p-6 sm:p-8 rounded-3xl">
              <div className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4">Follow Us</div>
              <div className="flex gap-3">
                {settings.facebook_url && (
                  <a href={settings.facebook_url} target="_blank" rel="noreferrer"
                    className="w-11 h-11 bg-[#1877F2] text-white rounded-xl flex items-center justify-center hover:scale-110 transition-transform shadow-md"
                    aria-label="Facebook">
                    <FacebookIcon />
                  </a>
                )}
                {settings.instagram_url && (
                  <a href={settings.instagram_url} target="_blank" rel="noreferrer"
                    className="w-11 h-11 text-white rounded-xl flex items-center justify-center hover:scale-110 transition-transform shadow-md"
                    style={{ background: 'linear-gradient(45deg, #f09433, #e6683c, #dc2743, #cc2366, #bc1888)' }}
                    aria-label="Instagram">
                    <InstagramIcon />
                  </a>
                )}
                {/* Fallback defaults if settings empty */}
                {!settings.facebook_url && !settings.instagram_url && (
                  <>
                    <a href="https://www.facebook.com/TheFoundationCollegiate/" target="_blank" rel="noreferrer"
                      className="w-11 h-11 bg-[#1877F2] text-white rounded-xl flex items-center justify-center hover:scale-110 transition-transform shadow-md"
                      aria-label="Facebook">
                      <FacebookIcon />
                    </a>
                    <a href="https://www.instagram.com/thefoundationcollegiate/" target="_blank" rel="noreferrer"
                      className="w-11 h-11 text-white rounded-xl flex items-center justify-center hover:scale-110 transition-transform shadow-md"
                      style={{ background: 'linear-gradient(45deg, #f09433, #e6683c, #dc2743, #cc2366, #bc1888)' }}
                      aria-label="Instagram">
                      <InstagramIcon />
                    </a>
                  </>
                )}
              </div>
            </div>

            {/* Google Map View */}
            <div className="rounded-3xl overflow-hidden border border-slate-200 shadow-md h-60">
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3616.9877745598405!2d67.06762917515563!3d24.96653057786022!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3eb3411dcdd9a5f5%3A0x4e580fc2ebeb060d!2sFoundation%20Valley!5e0!3m2!1sen!2s!4v1784972719803!5m2!1sen!2s"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="strict-origin-when-cross-origin"
                title="The Foundation Collegiate Location"
              />
            </div>
          </div>

          {/* Right Column — Send a Message Form */}
          <div className="lg:col-span-3">
            {sent ? (
              <div className="bg-white border border-emerald-500/30 shadow-md p-10 md:p-14 rounded-3xl text-center flex flex-col items-center justify-center min-h-[450px]">
                <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-6">
                  <CheckCircle2 size={40} />
                </div>
                <h3 className="text-3xl font-bold text-slate-800 mb-3">Message Sent!</h3>
                <p className="text-slate-600 mb-8 max-w-md">Thank you for reaching out to The Foundation Collegiate. Our admissions office will get back to you within 24 hours.</p>
                <Button onClick={() => setSent(false)} variant="outline" className="px-6 py-3 font-bold">
                  Send Another Message
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit(onSubmit)} className="bg-white border border-slate-200 p-8 md:p-10 rounded-3xl shadow-md space-y-6">
                <div>
                  <h3 className="text-2xl font-bold text-slate-800">Send a Message</h3>
                  <p className="text-slate-500 text-sm mt-1">Fill in the fields below and our counseling team will respond promptly.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="text-sm font-bold text-slate-700 block mb-1.5">Full Name *</label>
                    <input 
                      {...register('name')} 
                      placeholder="Your name" 
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 text-sm outline-none transition-all" 
                    />
                    {errors.name && <p className="text-red-500 text-xs mt-1 font-semibold">{errors.name.message}</p>}
                  </div>

                  <div>
                    <label className="text-sm font-bold text-slate-700 block mb-1.5">Phone *</label>
                    <input 
                      {...register('phone')} 
                      placeholder="03XX-XXXXXXX" 
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 text-sm outline-none transition-all" 
                    />
                    {errors.phone && <p className="text-red-500 text-xs mt-1 font-semibold">{errors.phone.message}</p>}
                  </div>

                  <div>
                    <label className="text-sm font-bold text-slate-700 block mb-1.5">Email</label>
                    <input 
                      {...register('email')} 
                      type="email" 
                      placeholder="optional@email.com" 
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 text-sm outline-none transition-all" 
                    />
                    {errors.email && <p className="text-red-500 text-xs mt-1 font-semibold">{errors.email.message}</p>}
                  </div>

                  <div>
                    <label className="text-sm font-bold text-slate-700 block mb-1.5">Subject</label>
                    <input 
                      {...register('subject')} 
                      placeholder="Admissions / Results / General" 
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 text-sm outline-none transition-all" 
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-bold text-slate-700 block mb-1.5">Your Message *</label>
                  <textarea 
                    {...register('message')} 
                    rows={5} 
                    placeholder="How can we help you?" 
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 text-sm outline-none transition-all resize-none" 
                  />
                  {errors.message && <p className="text-red-500 text-xs mt-1 font-semibold">{errors.message.message}</p>}
                </div>

                <Button type="submit" size="lg" className="w-full bg-blue-600 hover:bg-blue-700 font-bold text-base py-4 shadow-lg shadow-blue-600/20" isLoading={loading}>
                  <Send size={18} className="mr-2" /> Send Message
                </Button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
