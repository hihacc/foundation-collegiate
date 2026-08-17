-- Migration: Create Inquiries Table for The Foundation Collegiate
-- Handles prospective students visiting for admission inquiries

CREATE TABLE IF NOT EXISTS public.inquiries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sr_no TEXT,
  date TEXT NOT NULL DEFAULT CURRENT_DATE::text,
  name TEXT NOT NULL,
  class_name TEXT NOT NULL,
  contact TEXT NOT NULL,
  institute TEXT DEFAULT '',
  ref TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'PENDING',
  remarks TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast lookup by date, contact, status, and class
CREATE INDEX IF NOT EXISTS idx_inquiries_date ON public.inquiries (date);
CREATE INDEX IF NOT EXISTS idx_inquiries_contact ON public.inquiries (contact);
CREATE INDEX IF NOT EXISTS idx_inquiries_status ON public.inquiries (status);
CREATE INDEX IF NOT EXISTS idx_inquiries_class ON public.inquiries (class_name);

-- Enable RLS
ALTER TABLE public.inquiries ENABLE ROW LEVEL SECURITY;

-- Allow read and write for authenticated & public admin workflows
CREATE POLICY "Allow public read access to inquiries" ON public.inquiries FOR SELECT USING (true);
CREATE POLICY "Allow public insert to inquiries" ON public.inquiries FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update to inquiries" ON public.inquiries FOR UPDATE USING (true);
CREATE POLICY "Allow public delete to inquiries" ON public.inquiries FOR DELETE USING (true);
