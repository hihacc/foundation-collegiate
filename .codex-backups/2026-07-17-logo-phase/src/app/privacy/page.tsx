import type { Metadata } from "next";

export const metadata: Metadata = { title: "Privacy Policy" };

export default function PrivacyPage() {
  return <article className="container mx-auto max-w-3xl px-4 py-32"><h1 className="font-display text-4xl font-bold">Privacy Policy</h1><p className="mt-6 text-slate-600">The Foundation Collegiate uses submitted contact and admissions information solely to respond to enquiries and administer applications. We do not sell personal information.</p><h2 className="mt-8 text-2xl font-bold">Your information</h2><p className="mt-3 text-slate-600">You may request correction or deletion of your submitted information by contacting the institute directly.</p></article>;
}
