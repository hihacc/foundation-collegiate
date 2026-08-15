-- =============================================
-- PHASE 3 DATABASE MIGRATION SCRIPT
-- Additive Schema Enhancements for TFC
-- =============================================

-- Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Academic Classes (IX, X, XI, XII)
CREATE TABLE IF NOT EXISTS public.academic_classes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed Academic Classes
INSERT INTO public.academic_classes (name, slug, sort_order) VALUES
  ('Class IX', 'ix', 1),
  ('Class X', 'x', 2),
  ('Class XI', 'xi', 3),
  ('Class XII', 'xii', 4)
ON CONFLICT (slug) DO NOTHING;

-- 2. Academic Groups / Streams (Pre-Medical, Pre-Engineering, CS, Commerce)
CREATE TABLE IF NOT EXISTS public.academic_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  icon TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed Academic Groups
INSERT INTO public.academic_groups (name, slug, description, icon) VALUES
  ('FSc Pre-Medical', 'pre-medical', 'Coaching in Biology, Physics, and Chemistry for Board ranks & MDCAT', 'Stethoscope'),
  ('FSc Pre-Engineering', 'pre-engineering', 'Advanced mathematics, physics, and chemistry tailored for ECAT', 'Compass'),
  ('ICS Computer Science', 'computer-science', 'Computer science, programming, physics, and mathematics for tech aspirants', 'Laptop'),
  ('I.Com Commerce', 'commerce', 'Accounting, economics, business math, and commercial geography', 'Calculator')
ON CONFLICT (slug) DO NOTHING;

-- 3. Academic Subjects
CREATE TABLE IF NOT EXISTS public.academic_subjects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  class_id UUID REFERENCES public.academic_classes(id) ON DELETE SET NULL,
  group_id UUID REFERENCES public.academic_groups(id) ON DELETE SET NULL,
  is_compulsory BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Programs (Public-facing academic offerings on /programs)
CREATE TABLE IF NOT EXISTS public.programs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  class_id UUID REFERENCES public.academic_classes(id) ON DELETE SET NULL,
  group_id UUID REFERENCES public.academic_groups(id) ON DELETE SET NULL,
  summary TEXT,
  fee_amount NUMERIC DEFAULT 0,
  is_published BOOLEAN DEFAULT TRUE,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed Default Programs
INSERT INTO public.programs (title, slug, summary, fee_amount, is_published, sort_order) VALUES
  ('FSc Pre-Medical Program', 'pre-medical', 'Rigorous coaching in Biology, Physics, and Chemistry designed for Board rank success and MDCAT preparation.', 4500, true, 1),
  ('FSc Pre-Engineering Program', 'pre-engineering', 'Advanced mathematics, physics, and chemistry sessions tailored for engineering universities and ECAT success.', 4500, true, 2),
  ('ICS Computer Science Program', 'computer-science', 'Covers computer science fundamentals, programming logic, physics, and mathematics for tech aspirants.', 4500, true, 3),
  ('I.Com Commerce Program', 'commerce', 'Accounting, economics, business math, and commercial geography for future finance professionals.', 4000, true, 4)
ON CONFLICT (slug) DO NOTHING;

-- 5. Program Subjects Bridge Table
CREATE TABLE IF NOT EXISTS public.program_subjects (
  program_id UUID REFERENCES public.programs(id) ON DELETE CASCADE,
  subject_id UUID REFERENCES public.academic_subjects(id) ON DELETE CASCADE,
  PRIMARY KEY (program_id, subject_id)
);

-- 6. Add staff_type column to teachers table (faculty | staff)
ALTER TABLE public.teachers ADD COLUMN IF NOT EXISTS staff_type TEXT CHECK (staff_type IN ('faculty', 'staff')) DEFAULT 'faculty';

-- 7. Principal Profile Table
CREATE TABLE IF NOT EXISTS public.principal_profile (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL DEFAULT 'Dr. Asif Iqbal',
  title TEXT NOT NULL DEFAULT 'Director & Principal, The Foundation Collegiate',
  credentials TEXT NOT NULL DEFAULT 'PhD, M.Phil, MBA (HR), M.Ed, MA (IR), MA (IS), B.Sc (Hons), IDCS, IAD',
  photo_url TEXT,
  message TEXT NOT NULL DEFAULT 'DRAFT — PENDING APPROVAL: Quality education is not merely about passing examinations; it is about building intellectual discipline, conceptual clarity, and unshakeable confidence in every student. Welcome to The Foundation Collegiate.',
  is_published BOOLEAN DEFAULT TRUE,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed initial Principal Profile row if missing
INSERT INTO public.principal_profile (name, title, credentials, message, is_published)
SELECT 'Dr. Asif Iqbal', 'Director & Principal, The Foundation Collegiate', 'PhD, M.Phil, MBA (HR), M.Ed, MA (IR), MA (IS), B.Sc (Hons), IDCS, IAD', 'DRAFT — PENDING APPROVAL: Quality education is not merely about passing examinations; it is about building intellectual discipline, conceptual clarity, and unshakeable confidence in every student. Welcome to The Foundation Collegiate.', true
WHERE NOT EXISTS (SELECT 1 FROM public.principal_profile);
