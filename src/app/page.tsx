import type { Metadata } from 'next';
import HeroSection from '@/components/home/HeroSection';
import AdmissionsBanner from '@/components/home/AdmissionsBanner';
import StatsSection from '@/components/home/StatsSection';
import CoursesSection from '@/components/home/CoursesSection';
import FacultySection from '@/components/home/FacultySection';
import AchievementsSection from '@/components/home/AchievementsSection';
import NoticeBoardSection from '@/components/home/NoticeBoardSection';
import GalleryPreview from '@/components/home/GalleryPreview';
import FAQSection from '@/components/home/FAQSection';
import CTASection from '@/components/home/CTASection';
import TestimonialsSection from '@/components/home/TestimonialsSection';
import { supabase } from '@/lib/supabase/client';

export const metadata: Metadata = {
  title: 'The Foundation Collegiate | Premier Coaching Institute in North Karachi',
  description: 'We Know and Deliver what Quality Education Means. Join The Foundation Collegiate for expert Matriculation & Intermediate coaching in North Karachi.',
};

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function HomePage() {
  let heroData = {};
  try {
    const { data } = await supabase.from('homepage').select('data').limit(1).maybeSingle();
    heroData = data?.data?.hero || {};
  } catch (err) {
    console.error('Error loading homepage data:', err);
  }

  return (
    <main className="bg-[var(--background)] min-h-screen text-[var(--foreground)]">
      <HeroSection heroData={heroData} />
      <AdmissionsBanner />
      <StatsSection />
      <CoursesSection />
      <FacultySection />
      <AchievementsSection />
      <NoticeBoardSection />
      <TestimonialsSection />
      <GalleryPreview />
      <FAQSection />
      <CTASection />
    </main>
  );
}
