import type { Metadata } from "next";
import "./globals.css";
import ClientLayout from "@/components/layout/ClientLayout";
import SplashScreen from "@/components/ui/SplashScreen";
import { Toaster } from "sonner";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://thefoundationcollegiate.com'),
  title: {
    default: "The Foundation Collegiate | Premier Coaching Institute in Karachi",
    template: "%s | The Foundation Collegiate"
  },
  description: "We Know and Deliver What Quality Education Means. North Karachi's premier coaching institute offering Matriculation & Intermediate preparation.",
  keywords: ["coaching institute", "north karachi", "matric coaching", "intermediate coaching", "foundation collegiate", "tuition center karachi", "Dr Asif Iqbal"],
  authors: [{ name: "The Foundation Collegiate" }],
  openGraph: {
    type: "website",
    locale: "en_PK",
    url: "https://thefoundationcollegiate.com",
    siteName: "The Foundation Collegiate",
    title: "The Foundation Collegiate | Premier Coaching Institute in Karachi",
    description: "We Know and Deliver What Quality Education Means.",
  },
  twitter: {
    card: "summary_large_image",
    title: "The Foundation Collegiate | Premier Coaching Institute in Karachi",
    description: "We Know and Deliver What Quality Education Means.",
  },
  icons: {
    icon: [{ url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' }, { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' }],
    apple: [{ url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
  },
  manifest: '/site.webmanifest',
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="scroll-smooth" data-scroll-behavior="smooth" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Atkinson+Hyperlegible:ital,wght@0,400;0,700;1,400;1,700&family=Crimson+Pro:ital,wght@0,400..700;1,400..700&display=swap" rel="stylesheet" />
      </head>
      <body className="antialiased min-h-screen bg-[var(--background)] text-[var(--foreground)] font-sans" suppressHydrationWarning>
        <SplashScreen />
        <Toaster position="top-right" richColors closeButton />
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  );
}
