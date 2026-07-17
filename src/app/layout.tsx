import type { Metadata } from "next";
import "./globals.css";
import ClientLayout from "@/components/layout/ClientLayout";
import { Toaster } from "sonner";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://thefoundationcollegiate.com'),
  title: {
    default: "The Foundation Collegiate | Premier Coaching Institute in Karachi",
    template: "%s | The Foundation Collegiate"
  },
  description: "We Know and Deliver what Quality Education Means. North Karachi's leading coaching institute offering Matriculation & Intermediate preparation.",
  keywords: ["coaching institute", "north karachi", "matric coaching", "intermediate coaching", "foundation collegiate", "tuition center karachi"],
  authors: [{ name: "The Foundation Collegiate" }],
  openGraph: {
    type: "website",
    locale: "en_PK",
    url: "https://thefoundationcollegiate.com",
    siteName: "The Foundation Collegiate",
    title: "The Foundation Collegiate | Premier Coaching Institute",
    description: "We Know and Deliver what Quality Education Means.",
  },
  twitter: {
    card: "summary_large_image",
    title: "The Foundation Collegiate",
    description: "We Know and Deliver what Quality Education Means.",
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
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="min-h-screen flex flex-col antialiased bg-background text-foreground font-sans">
        <Toaster position="top-right" richColors closeButton />
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  );
}
