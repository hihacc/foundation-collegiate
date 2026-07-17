import type { Metadata } from "next";

export const metadata: Metadata = { title: "Terms of Use" };

export default function TermsPage() {
  return <article className="container mx-auto max-w-3xl px-4 py-32"><h1 className="font-display text-4xl font-bold">Terms of Use</h1><p className="mt-6 text-slate-600">Information on this website is provided for general guidance. Admissions, course availability, and fees remain subject to confirmation by The Foundation Collegiate.</p></article>;
}
