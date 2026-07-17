import { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.NEXT_PUBLIC_SITE_URL || 'https://thefoundationcollegiate.com';
  return [
    { url: base, lastModified: new Date(), changeFrequency: 'weekly', priority: 1 },
    { url: `${base}/about`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.8 },
    { url: `${base}/courses`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.9 },
    { url: `${base}/admissions`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.95 },
    { url: `${base}/results`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.9 },
    { url: `${base}/gallery`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.6 },
    { url: `${base}/notices`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.7 },
    { url: `${base}/downloads`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.6 },
    { url: `${base}/contact`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.7 },
  ];
}
