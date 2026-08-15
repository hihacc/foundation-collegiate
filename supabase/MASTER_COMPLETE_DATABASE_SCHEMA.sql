-- =================================================================
-- THE FOUNDATION COLLEGIATE (TFC) — MASTER COMPLETE DATABASE SCHEMA
-- Version 9.0 (100% Complete Schema including Student Fee Profiles)
-- Execute this single SQL script in your Supabase SQL Editor:
-- https://supabase.com/dashboard/project/qiqpqmumkevhwqqfgchz/sql/new
-- =================================================================

-- =================================================================
-- SECTION 1: EXTENSIONS
-- =================================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- =================================================================
-- SECTION 2: TABLES (STRICT PARENT-TO-CHILD DEPENDENCY ORDER)
-- =================================================================

-- 1. Settings Table
CREATE TABLE IF NOT EXISTS public.settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  value TEXT,
  type TEXT DEFAULT 'text',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Admin Users Table
CREATE TABLE IF NOT EXISTS public.admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  role TEXT DEFAULT 'Super Admin',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Principal Profile Table
CREATE TABLE IF NOT EXISTS public.principal_profile (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL DEFAULT 'Dr. Asif Iqbal',
  title TEXT NOT NULL DEFAULT 'Director & Principal, The Foundation Collegiate',
  credentials TEXT NOT NULL DEFAULT 'PhD, M.Phil, MBA (HR), M.Ed, MA (IR), MA (IS), B.Sc (Hons), IDCS, IAD',
  photo_url TEXT,
  message TEXT NOT NULL DEFAULT 'Quality education is not merely about passing examinations; it is about building intellectual discipline, conceptual clarity, and unshakeable confidence in every student. Welcome to The Foundation Collegiate.',
  is_published BOOLEAN DEFAULT TRUE,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Homepage Content Table
CREATE TABLE IF NOT EXISTS public.homepage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  data JSONB DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Academic Classes Parent Table (IX, X, XI, XII)
CREATE TABLE IF NOT EXISTS public.academic_classes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Academic Groups / Streams Parent Table
CREATE TABLE IF NOT EXISTS public.academic_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  class_id UUID REFERENCES public.academic_classes(id) ON DELETE SET NULL,
  description TEXT,
  icon TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Academic Subjects Child Table (References academic_classes & academic_groups)
CREATE TABLE IF NOT EXISTS public.academic_subjects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  class_id UUID REFERENCES public.academic_classes(id) ON DELETE SET NULL,
  group_id UUID REFERENCES public.academic_groups(id) ON DELETE SET NULL,
  is_compulsory BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Programs Child Table (References academic_classes & academic_groups)
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
  program_type TEXT DEFAULT 'academic_stream',
  duration TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. Program Subjects Bridge Table (References programs & academic_subjects)
CREATE TABLE IF NOT EXISTS public.program_subjects (
  program_id UUID REFERENCES public.programs(id) ON DELETE CASCADE,
  subject_id UUID REFERENCES public.academic_subjects(id) ON DELETE CASCADE,
  PRIMARY KEY (program_id, subject_id)
);

-- 10. Teachers Table
CREATE TABLE IF NOT EXISTS public.teachers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  subject TEXT NOT NULL,
  qualification TEXT,
  experience_years INT DEFAULT 5,
  bio TEXT,
  photo_url TEXT,
  staff_type TEXT DEFAULT 'faculty',
  is_active BOOLEAN DEFAULT TRUE,
  display_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. Courses Table
CREATE TABLE IF NOT EXISTS public.courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  level TEXT NOT NULL,
  classes TEXT NOT NULL,
  description TEXT,
  subjects JSONB DEFAULT '[]'::jsonb,
  fee_per_month NUMERIC DEFAULT 0,
  icon TEXT,
  type TEXT DEFAULT 'Course',
  is_active BOOLEAN DEFAULT TRUE,
  display_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 12. Students Table
CREATE TABLE IF NOT EXISTS public.students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  father_name TEXT NOT NULL,
  roll_number TEXT UNIQUE NOT NULL,
  class_name TEXT NOT NULL,
  section TEXT DEFAULT 'A',
  phone TEXT,
  email TEXT,
  photo_url TEXT,
  gender TEXT,
  date_of_birth DATE,
  address TEXT,
  status TEXT DEFAULT 'active',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 13. Admissions Table
CREATE TABLE IF NOT EXISTS public.admissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_name TEXT NOT NULL,
  father_name TEXT NOT NULL,
  date_of_birth DATE,
  gender TEXT,
  class_applied TEXT NOT NULL,
  previous_school TEXT,
  parent_phone TEXT NOT NULL,
  parent_email TEXT,
  address TEXT NOT NULL,
  photo_url TEXT,
  status TEXT DEFAULT 'pending',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 14. Fee Structures Table
CREATE TABLE IF NOT EXISTS public.fee_structures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_name TEXT NOT NULL UNIQUE,
  monthly_tuition INTEGER DEFAULT 0,
  admission_fee INTEGER DEFAULT 0,
  exam_fee INTEGER DEFAULT 0,
  lab_fee INTEGER DEFAULT 0,
  library_fee INTEGER DEFAULT 0,
  sports_fee INTEGER DEFAULT 0,
  miscellaneous_fee INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 15. Fee Challans Table (References students)
CREATE TABLE IF NOT EXISTS public.fee_challans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
  month_year TEXT NOT NULL,
  issue_date DATE NOT NULL,
  due_date DATE NOT NULL,
  total_amount INTEGER NOT NULL,
  discount_applied INTEGER DEFAULT 0,
  fine_applied INTEGER DEFAULT 0,
  net_payable INTEGER NOT NULL,
  paid_amount INTEGER DEFAULT 0,
  status TEXT DEFAULT 'Pending',
  barcode_ref TEXT UNIQUE NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 16. Fee Transactions Table (References fee_challans)
CREATE TABLE IF NOT EXISTS public.fee_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  challan_id UUID REFERENCES public.fee_challans(id) ON DELETE CASCADE,
  amount_paid INTEGER NOT NULL,
  payment_method TEXT DEFAULT 'Cash',
  transaction_date TIMESTAMPTZ DEFAULT NOW(),
  remarks TEXT,
  status TEXT DEFAULT 'Success'
);

-- 17. Results Table (References students)
CREATE TABLE IF NOT EXISTS public.results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES public.students(id) ON DELETE SET NULL,
  student_name TEXT NOT NULL,
  father_name TEXT NOT NULL,
  roll_number TEXT NOT NULL,
  class_name TEXT NOT NULL,
  exam_name TEXT DEFAULT 'Monthly Test',
  month TEXT DEFAULT 'August 2026',
  exam_date DATE DEFAULT CURRENT_DATE,
  subjects JSONB DEFAULT '[]'::jsonb,
  total_marks NUMERIC DEFAULT 0,
  obtained_marks NUMERIC DEFAULT 0,
  percentage NUMERIC DEFAULT 0,
  grade TEXT DEFAULT 'F',
  position TEXT,
  remarks TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 18. Pins Table (References students)
CREATE TABLE IF NOT EXISTS public.pins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
  roll_number TEXT UNIQUE NOT NULL,
  pin_code TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 19. Achievers Table
CREATE TABLE IF NOT EXISTS public.achievers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  position TEXT NOT NULL,
  board TEXT NOT NULL,
  percentage TEXT NOT NULL,
  photo_url TEXT NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  display_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 20. Notices Table
CREATE TABLE IF NOT EXISTS public.notices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  type TEXT DEFAULT 'important',
  is_pinned BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 21. Gallery Table
CREATE TABLE IF NOT EXISTS public.gallery (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  category TEXT DEFAULT 'Campus',
  image_url TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  display_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 22. Downloads Table
CREATE TABLE IF NOT EXISTS public.downloads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  category TEXT DEFAULT 'General',
  file_url TEXT NOT NULL,
  file_type TEXT DEFAULT 'PDF',
  file_size TEXT DEFAULT '1 MB',
  description TEXT,
  downloads_count INT DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 23. Contacts Table
CREATE TABLE IF NOT EXISTS public.contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT DEFAULT 'Pending',
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 24. Student Fee Profiles Table (References students & fee_structures)
CREATE TABLE IF NOT EXISTS public.student_fee_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
  fee_structure_id UUID REFERENCES public.fee_structures(id) ON DELETE SET NULL,
  discount_type TEXT DEFAULT 'None',
  discount_value NUMERIC DEFAULT 0,
  transport_fee NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =================================================================
-- SECTION 3: COMPREHENSIVE AUTO-MIGRATING ALTER TABLE ADD COLUMNS
-- =================================================================

-- Settings
ALTER TABLE public.settings ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'text';
ALTER TABLE public.settings ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Fee Structures
ALTER TABLE public.fee_structures ADD COLUMN IF NOT EXISTS class_name TEXT;
ALTER TABLE public.fee_structures ADD COLUMN IF NOT EXISTS monthly_tuition INTEGER DEFAULT 0;
ALTER TABLE public.fee_structures ADD COLUMN IF NOT EXISTS admission_fee INTEGER DEFAULT 0;
ALTER TABLE public.fee_structures ADD COLUMN IF NOT EXISTS exam_fee INTEGER DEFAULT 0;
ALTER TABLE public.fee_structures ADD COLUMN IF NOT EXISTS lab_fee INTEGER DEFAULT 0;
ALTER TABLE public.fee_structures ADD COLUMN IF NOT EXISTS library_fee INTEGER DEFAULT 0;
ALTER TABLE public.fee_structures ADD COLUMN IF NOT EXISTS sports_fee INTEGER DEFAULT 0;
ALTER TABLE public.fee_structures ADD COLUMN IF NOT EXISTS miscellaneous_fee INTEGER DEFAULT 0;

-- Student Fee Profiles
ALTER TABLE public.student_fee_profiles ADD COLUMN IF NOT EXISTS student_id UUID REFERENCES public.students(id) ON DELETE CASCADE;
ALTER TABLE public.student_fee_profiles ADD COLUMN IF NOT EXISTS fee_structure_id UUID REFERENCES public.fee_structures(id) ON DELETE SET NULL;
ALTER TABLE public.student_fee_profiles ADD COLUMN IF NOT EXISTS discount_type TEXT DEFAULT 'None';
ALTER TABLE public.student_fee_profiles ADD COLUMN IF NOT EXISTS discount_value NUMERIC DEFAULT 0;
ALTER TABLE public.student_fee_profiles ADD COLUMN IF NOT EXISTS transport_fee NUMERIC DEFAULT 0;

-- Academic Classes
ALTER TABLE public.academic_classes ADD COLUMN IF NOT EXISTS slug TEXT;
ALTER TABLE public.academic_classes ADD COLUMN IF NOT EXISTS sort_order INT DEFAULT 0;

-- Academic Groups
ALTER TABLE public.academic_groups ADD COLUMN IF NOT EXISTS slug TEXT;
ALTER TABLE public.academic_groups ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE public.academic_groups ADD COLUMN IF NOT EXISTS icon TEXT;
ALTER TABLE public.academic_groups ADD COLUMN IF NOT EXISTS class_id UUID REFERENCES public.academic_classes(id) ON DELETE SET NULL;
ALTER TABLE public.academic_groups ALTER COLUMN class_id DROP NOT NULL;

-- Academic Subjects
ALTER TABLE public.academic_subjects ADD COLUMN IF NOT EXISTS class_id UUID REFERENCES public.academic_classes(id) ON DELETE SET NULL;
ALTER TABLE public.academic_subjects ADD COLUMN IF NOT EXISTS group_id UUID REFERENCES public.academic_groups(id) ON DELETE SET NULL;
ALTER TABLE public.academic_subjects ALTER COLUMN class_id DROP NOT NULL;
ALTER TABLE public.academic_subjects ALTER COLUMN group_id DROP NOT NULL;

-- Programs
ALTER TABLE public.programs ADD COLUMN IF NOT EXISTS slug TEXT;
ALTER TABLE public.programs ADD COLUMN IF NOT EXISTS class_id UUID REFERENCES public.academic_classes(id) ON DELETE SET NULL;
ALTER TABLE public.programs ADD COLUMN IF NOT EXISTS group_id UUID REFERENCES public.academic_groups(id) ON DELETE SET NULL;
ALTER TABLE public.programs ADD COLUMN IF NOT EXISTS program_type TEXT DEFAULT 'academic_stream';
ALTER TABLE public.programs ADD COLUMN IF NOT EXISTS duration TEXT;
ALTER TABLE public.programs ADD COLUMN IF NOT EXISTS summary TEXT;
ALTER TABLE public.programs ADD COLUMN IF NOT EXISTS fee_amount NUMERIC DEFAULT 0;
ALTER TABLE public.programs ADD COLUMN IF NOT EXISTS is_published BOOLEAN DEFAULT TRUE;
ALTER TABLE public.programs ALTER COLUMN class_id DROP NOT NULL;
ALTER TABLE public.programs ALTER COLUMN group_id DROP NOT NULL;

-- Teachers
ALTER TABLE public.teachers ADD COLUMN IF NOT EXISTS staff_type TEXT DEFAULT 'faculty';
ALTER TABLE public.teachers ADD COLUMN IF NOT EXISTS display_order INT DEFAULT 0;
ALTER TABLE public.teachers ADD COLUMN IF NOT EXISTS experience_years INT DEFAULT 5;

-- Principal Profile
ALTER TABLE public.principal_profile ADD COLUMN IF NOT EXISTS credentials TEXT;
ALTER TABLE public.principal_profile ADD COLUMN IF NOT EXISTS is_published BOOLEAN DEFAULT TRUE;

-- Safely add UNIQUE constraints on slug & class_name columns if not present
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'academic_classes_slug_key') THEN
    ALTER TABLE public.academic_classes ADD CONSTRAINT academic_classes_slug_key UNIQUE (slug);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'academic_groups_slug_key') THEN
    ALTER TABLE public.academic_groups ADD CONSTRAINT academic_groups_slug_key UNIQUE (slug);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'programs_slug_key') THEN
    ALTER TABLE public.programs ADD CONSTRAINT programs_slug_key UNIQUE (slug);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'teachers_name_subject_key') THEN
    ALTER TABLE public.teachers ADD CONSTRAINT teachers_name_subject_key UNIQUE (name, subject);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fee_structures_class_name_key') THEN
    ALTER TABLE public.fee_structures ADD CONSTRAINT fee_structures_class_name_key UNIQUE (class_name);
  END IF;
END $$;

-- =================================================================
-- SECTION 4: ROW LEVEL SECURITY (RLS) POLICIES
-- =================================================================
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.principal_profile ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS cnic TEXT;
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS religion TEXT;
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS nationality TEXT;
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS parent_phone TEXT;
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS father_occupation TEXT;
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS previous_school TEXT;

ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.homepage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.academic_classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.academic_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.academic_subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gallery ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.achievers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.downloads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fee_structures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_fee_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public read settings') THEN
    CREATE POLICY "Public read settings" ON public.settings FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public read principal_profile') THEN
    CREATE POLICY "Public read principal_profile" ON public.principal_profile FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public read homepage') THEN
    CREATE POLICY "Public read homepage" ON public.homepage FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public read academic_classes') THEN
    CREATE POLICY "Public read academic_classes" ON public.academic_classes FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public read academic_groups') THEN
    CREATE POLICY "Public read academic_groups" ON public.academic_groups FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public read academic_subjects') THEN
    CREATE POLICY "Public read academic_subjects" ON public.academic_subjects FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public read programs') THEN
    CREATE POLICY "Public read programs" ON public.programs FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public read teachers') THEN
    CREATE POLICY "Public read teachers" ON public.teachers FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public read courses') THEN
    CREATE POLICY "Public read courses" ON public.courses FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public read results') THEN
    CREATE POLICY "Public read results" ON public.results FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public read notices') THEN
    CREATE POLICY "Public read notices" ON public.notices FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public read gallery') THEN
    CREATE POLICY "Public read gallery" ON public.gallery FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public read achievers') THEN
    CREATE POLICY "Public read achievers" ON public.achievers FOR SELECT USING (true);
  END IF;
-- Enable universal public read/write/delete access on all tables dynamically
DO $$
DECLARE
  t text;
BEGIN
  FOR t IN SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', t);
    EXECUTE format('DROP POLICY IF EXISTS "Public all %I" ON public.%I;', t, t);
    EXECUTE format('DROP POLICY IF EXISTS "Public read %I" ON public.%I;', t, t);
    EXECUTE format('CREATE POLICY "Public all %I" ON public.%I FOR ALL USING (true) WITH CHECK (true);', t, t);
  END LOOP;
END $$;

-- =================================================================
-- SECTION 5: SEED DATA (DEPENDENCY ORDERED WITH EXPLICIT CONFLICT HANDLERS)
-- =================================================================

-- Seed Admin Users
INSERT INTO public.admin_users (id, name, email, password, role) VALUES
  ('110e8400-e29b-41d4-a716-446655440001', 'The Foundation Collegiate Admin', 'foundationcollegiate@gmail.com', 'admin123', 'Super Admin'),
  ('110e8400-e29b-41d4-a716-446655440002', 'TFC Master Admin', 'tfc@tfc.com', 'admin123', 'Super Admin')
ON CONFLICT (email) DO UPDATE SET password = EXCLUDED.password;

-- Seed Settings
INSERT INTO public.settings (key, value, type) VALUES
  ('site_name', 'The Foundation Collegiate', 'text'),
  ('site_tagline', 'We Know and Deliver what Quality Education Means.', 'text'),
  ('contact_phone', '0333-3439458', 'text'),
  ('contact_email', 'foundationcollegiate@gmail.com', 'text'),
  ('contact_address', 'House #1704, Sector 11-E, Muslim Town, North Karachi, Karachi, Pakistan', 'text'),
  ('whatsapp_number', '+923333439458', 'text'),
  ('facebook_url', 'https://www.facebook.com/TheFoundationCollegiate/', 'text'),
  ('instagram_url', 'https://www.instagram.com/thefoundationcollegiate/', 'text'),
  ('admissions_open', 'true', 'boolean'),
  ('admissions_year', '2026', 'text')
ON CONFLICT (key) DO NOTHING;

-- Seed Principal Profile
INSERT INTO public.principal_profile (name, title, credentials, message, is_published)
SELECT 'Dr. Asif Iqbal', 'Director & Principal, The Foundation Collegiate', 'PhD, M.Phil, MBA (HR), M.Ed, MA (IR), MA (IS), B.Sc (Hons), IDCS, IAD', 'Quality education is not merely about passing examinations; it is about building intellectual discipline, conceptual clarity, and unshakeable confidence in every student. Welcome to The Foundation Collegiate.', true
WHERE NOT EXISTS (SELECT 1 FROM public.principal_profile);

-- Seed Academic Classes (IX, X, XI, XII)
INSERT INTO public.academic_classes (name, slug, sort_order) VALUES
  ('Class IX', 'ix', 1),
  ('Class X', 'x', 2),
  ('Class XI', 'xi', 3),
  ('Class XII', 'xii', 4)
ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, sort_order = EXCLUDED.sort_order;

-- Seed Academic Groups
INSERT INTO public.academic_groups (name, slug, description, icon) VALUES
  ('Computer Science', 'computer-science', 'Computer science, programming, physics, and mathematics', 'Laptop'),
  ('Biology', 'biology', 'Biological sciences, chemistry, and physics', 'Stethoscope'),
  ('Commerce', 'commerce', 'Accounting, economics, business math, and commercial geography', 'Calculator'),
  ('Pre-Medical', 'pre-medical', 'Biology, physics, chemistry for medical university preparation', 'Stethoscope'),
  ('Pre-Engineering', 'pre-engineering', 'Advanced mathematics, physics, and chemistry for engineering', 'Compass')
ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description;

-- Seed Programs
INSERT INTO public.programs (title, slug, summary, fee_amount, is_published, sort_order, program_type, duration) VALUES
  ('Class IX — Computer Science', 'ix-computer-science', 'BSEK Class IX Matriculation in Computer Science stream.', 3500, true, 1, 'academic_stream', '1 year'),
  ('Class IX — Biology', 'ix-biology', 'BSEK Class IX Matriculation in Biology & General Science stream.', 3500, true, 2, 'academic_stream', '1 year'),
  ('Class X — Computer Science', 'x-computer-science', 'BSEK Class X Matriculation in Computer Science stream.', 3500, true, 10, 'academic_stream', '1 year'),
  ('Class X — Biology', 'x-biology', 'BSEK Class X Matriculation in Biology & Science stream.', 3500, true, 11, 'academic_stream', '1 year'),
  ('Class XI — Commerce', 'xi-commerce', 'BIEK Class XI Intermediate Part 1 Commerce stream.', 4000, true, 20, 'academic_stream', '1 year'),
  ('Class XI — Computer Science', 'xi-computer-science', 'BIEK Class XI Intermediate Part 1 ICS Computer Science stream.', 4500, true, 21, 'academic_stream', '1 year'),
  ('Class XI — Pre-Medical', 'xi-pre-medical', 'BIEK Class XI Intermediate Part 1 FSc Pre-Medical stream.', 4500, true, 22, 'academic_stream', '1 year'),
  ('Class XI — Pre-Engineering', 'xi-pre-engineering', 'BIEK Class XI Intermediate Part 1 FSc Pre-Engineering stream.', 4500, true, 23, 'academic_stream', '1 year'),
  ('Class XII — Commerce', 'xii-commerce', 'BIEK Class XII Intermediate Part 2 Commerce stream.', 4000, true, 30, 'academic_stream', '1 year'),
  ('Class XII — Computer Science', 'xii-computer-science', 'BIEK Class XII Intermediate Part 2 ICS Computer Science stream.', 4500, true, 31, 'academic_stream', '1 year'),
  ('Class XII — Pre-Medical', 'xii-pre-medical', 'BIEK Class XII Intermediate Part 2 FSc Pre-Medical stream.', 4500, true, 32, 'academic_stream', '1 year'),
  ('Class XII — Pre-Engineering', 'xii-pre-engineering', 'BIEK Class XII Intermediate Part 2 FSc Pre-Engineering stream.', 4500, true, 33, 'academic_stream', '1 year'),
  ('Diploma in Accounting & Finance', 'diploma-accounting-finance', 'Professional diploma in financial accounting, taxation, and software.', 6000, true, 40, 'diploma', '1 year')
ON CONFLICT (slug) DO NOTHING;

-- Seed Teachers
INSERT INTO public.teachers (id, name, subject, qualification, experience_years, staff_type, is_active, display_order) VALUES
  ('220e8400-e29b-41d4-a716-446655440001', 'Dr. Asif Iqbal', 'Physics & Leadership', 'Ph.D. in Physics & Education', 15, 'faculty', true, 1),
  ('220e8400-e29b-41d4-a716-446655440002', 'Prof. Muhammad Kamran', 'Chemistry', 'M.Sc. Organic Chemistry', 12, 'faculty', true, 2),
  ('220e8400-e29b-41d4-a716-446655440003', 'Prof. Shahzaib Khan', 'Mathematics', 'M.Sc. Applied Mathematics', 10, 'faculty', true, 3),
  ('220e8400-e29b-41d4-a716-446655440004', 'Dr. Fatima Tariq', 'Biology & MDCAT', 'MBBS / Senior Lecturer', 8, 'faculty', true, 4),
  ('220e8400-e29b-41d4-a716-446655440005', 'Engr. Bilal Ahmed', 'Computer Science & DIT', 'BS Computer Engineering', 9, 'faculty', true, 5),
  ('220e8400-e29b-41d4-a716-446655440006', 'Prof. Tariq Mahmood', 'English & Humanities', 'M.A. English Literature', 14, 'faculty', true, 6),
  ('220e8400-e29b-41d4-a716-446655440007', 'Muhammad Usman', 'Administration', 'M.Com Finance', 7, 'staff', true, 7),
  ('220e8400-e29b-41d4-a716-446655440008', 'Saima Raza', 'Student Affairs', 'B.A. Mass Communication', 5, 'staff', true, 8)
ON CONFLICT (id) DO UPDATE SET staff_type = EXCLUDED.staff_type, qualification = EXCLUDED.qualification;

-- Seed Fee Structures
INSERT INTO public.fee_structures (class_name, monthly_tuition, admission_fee, exam_fee, lab_fee) VALUES
  ('Class IX - Science', 3500, 5000, 1000, 500),
  ('Class IX - Computer', 3500, 5000, 1000, 500),
  ('Class X - Science', 3500, 5000, 1000, 500),
  ('Class X - Computer', 3500, 5000, 1000, 500),
  ('Class XI - Pre-Medical', 4500, 6000, 1500, 1000),
  ('Class XI - Pre-Engineering', 4500, 6000, 1500, 1000),
  ('Class XI - Commerce', 4000, 6000, 1500, 0),
  ('Class XII - Pre-Medical', 4500, 6000, 1500, 1000),
  ('Class XII - Pre-Engineering', 4500, 6000, 1500, 1000),
  ('Class XII - Commerce', 4000, 6000, 1500, 0)
ON CONFLICT (class_name) DO NOTHING;
