"use client";

import HeroSection from '@/components/home/HeroSection';
import AchievementsSection from '@/components/home/AchievementsSection';
import GalleryPreview from '@/components/home/GalleryPreview';

export default function HomeClientSections({ heroData }: { heroData: any }) {
  return (
    <>
      <HeroSection heroData={heroData} />
      <AchievementsSection />
      <GalleryPreview />
    </>
  );
}
