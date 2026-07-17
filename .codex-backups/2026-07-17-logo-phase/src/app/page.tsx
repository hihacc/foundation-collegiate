import type { Metadata } from 'next';
import HeroSection from '@/components/home/HeroSection';
import StatsSection from '@/components/home/StatsSection';
import CoursesSection from '@/components/home/CoursesSection';
import FacultySection from '@/components/home/FacultySection';
import NoticeBoardSection from '@/components/home/NoticeBoardSection';
import TestimonialsSection from '@/components/home/TestimonialsSection';
import AchievementsSection from '@/components/home/AchievementsSection';
import GalleryPreview from '@/components/home/GalleryPreview';
import FAQSection from '@/components/home/FAQSection';
import CTASection from '@/components/home/CTASection';
import AdmissionsBanner from '@/components/home/AdmissionsBanner';

export const metadata: Metadata = {
  title: 'The Foundation Collegiate | Premier Coaching Institute in North Karachi',
  description: 'We Know and Deliver what Quality Education Means. Join The Foundation Collegiate for expert Matriculation & Intermediate coaching in North Karachi.',
};

export default function HomePage() {
  return (
    <>
      <HeroSection />
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
    </>
  );
}
