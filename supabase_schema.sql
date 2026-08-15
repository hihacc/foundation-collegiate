-- =================================================================
-- THE FOUNDATION COLLEGIATE - COMPLETE DATABASE RESET & UPGRADE SCHEMA
-- Execute this SQL script in your Supabase SQL Editor to DROP all old tables
-- and create the clean, upgraded production database schema from scratch!
-- =================================================================

-- 1. DROP ALL EXISTING TABLES (CLEAN DATABASE RESET)
DROP TABLE IF EXISTS public.admin_users CASCADE;
DROP TABLE IF EXISTS public.students CASCADE;
DROP TABLE IF EXISTS public.results CASCADE;
DROP TABLE IF EXISTS public.pins CASCADE;
DROP TABLE IF EXISTS public.attendance CASCADE;
DROP TABLE IF EXISTS public.teachers CASCADE;
DROP TABLE IF EXISTS public.achievers CASCADE;
DROP TABLE IF EXISTS public.downloads CASCADE;
DROP TABLE IF EXISTS public.notices CASCADE;
DROP TABLE IF EXISTS public.gallery CASCADE;
DROP TABLE IF EXISTS public.courses CASCADE;
DROP TABLE IF EXISTS public.admissions CASCADE;
DROP TABLE IF EXISTS public.fee_structures CASCADE;
DROP TABLE IF EXISTS public.fee_challans CASCADE;
DROP TABLE IF EXISTS public.fee_transactions CASCADE;
DROP TABLE IF EXISTS public.student_fee_profiles CASCADE;
DROP TABLE IF EXISTS public.contacts CASCADE;
DROP TABLE IF EXISTS public.settings CASCADE;

-- Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. CREATE ADMIN USERS TABLE
CREATE TABLE public.admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  role TEXT DEFAULT 'Super Admin',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed Sole Master Admin Account
INSERT INTO public.admin_users (id, name, email, password, role)
VALUES ('110e8400-e29b-41d4-a716-446655440001', 'The Foundation Collegiate Admin', 'foundationcollegiate@gmail.com', 'admin123', 'Super Admin');

-- 3. CREATE STUDENTS TABLE
CREATE TABLE public.students (
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

-- 4. CREATE RESULTS TABLE
CREATE TABLE public.results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES public.students(id) ON DELETE SET NULL,
  student_name TEXT NOT NULL,
  father_name TEXT NOT NULL,
  roll_number TEXT NOT NULL,
  class_name TEXT NOT NULL,
  exam_name TEXT DEFAULT 'Monthly Test',
  month TEXT DEFAULT 'July 2026',
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

-- 5. CREATE PINS TABLE
CREATE TABLE public.pins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  roll_number TEXT NOT NULL,
  pin_hash TEXT NOT NULL,
  result_id UUID REFERENCES public.results(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. CREATE ATTENDANCE TABLE
CREATE TABLE public.attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
  student_name TEXT NOT NULL,
  roll_number TEXT NOT NULL,
  class_name TEXT NOT NULL,
  date DATE DEFAULT CURRENT_DATE,
  month TEXT DEFAULT 'July 2026',
  status TEXT DEFAULT 'present',
  remarks TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_student_date UNIQUE (student_id, date)
);

-- 7. CREATE TEACHERS TABLE
CREATE TABLE public.teachers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  subject TEXT NOT NULL,
  qualification TEXT,
  experience_years NUMERIC DEFAULT 0,
  bio TEXT,
  photo_url TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  display_order INT DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. CREATE ACHIEVERS TABLE
CREATE TABLE public.achievers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  position TEXT NOT NULL,
  board TEXT NOT NULL,
  percentage TEXT NOT NULL,
  photo_url TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  display_order INT DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. CREATE DOWNLOADS TABLE
CREATE TABLE public.downloads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_type TEXT,
  file_size TEXT,
  description TEXT,
  download_count INT DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. CREATE NOTICES TABLE
CREATE TABLE public.notices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  type TEXT DEFAULT 'general',
  is_pinned BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. CREATE GALLERY TABLE
CREATE TABLE public.gallery (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  image_url TEXT NOT NULL,
  description TEXT,
  is_banner BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  display_order INT DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 12. CREATE COURSES TABLE
CREATE TABLE public.courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  level TEXT NOT NULL,
  classes TEXT NOT NULL,
  description TEXT,
  subjects JSONB DEFAULT '[]'::jsonb,
  fee_per_month NUMERIC DEFAULT 0,
  type TEXT DEFAULT 'Course',
  icon TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  display_order INT DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 13. CREATE ADMISSIONS TABLE
CREATE TABLE public.admissions (
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

-- 14. CREATE FEE STRUCTURES TABLE
CREATE TABLE public.fee_structures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_name TEXT UNIQUE NOT NULL,
  tuition_fee NUMERIC DEFAULT 0,
  admission_fee NUMERIC DEFAULT 0,
  exam_fee NUMERIC DEFAULT 0,
  other_fee NUMERIC DEFAULT 0,
  total_monthly NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 15. CREATE FEE CHALLANS TABLE
CREATE TABLE public.fee_challans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
  challan_number TEXT UNIQUE NOT NULL,
  month TEXT NOT NULL,
  year TEXT DEFAULT '2026',
  class_name TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  due_date DATE,
  status TEXT DEFAULT 'unpaid',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 16. CREATE FEE TRANSACTIONS TABLE
CREATE TABLE public.fee_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  challan_id UUID REFERENCES public.fee_challans(id) ON DELETE CASCADE,
  student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
  transaction_id TEXT UNIQUE NOT NULL,
  amount_paid NUMERIC NOT NULL,
  payment_method TEXT DEFAULT 'Cash',
  payment_date TIMESTAMPTZ DEFAULT NOW(),
  received_by TEXT DEFAULT 'Admin',
  status TEXT DEFAULT 'completed',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 17. CREATE STUDENT FEE PROFILES TABLE
CREATE TABLE public.student_fee_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
  tuition_fee NUMERIC DEFAULT 0,
  admission_fee NUMERIC DEFAULT 0,
  exam_fee NUMERIC DEFAULT 0,
  discount_amount NUMERIC DEFAULT 0,
  net_monthly NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 18. CREATE CONTACTS TABLE
CREATE TABLE public.contacts (
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

-- 19. CREATE SETTINGS TABLE
CREATE TABLE public.settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed Default Settings
INSERT INTO public.settings (key, value) VALUES
  ('site_name', 'The Foundation Collegiate'),
  ('site_tagline', 'We Know and Deliver what Quality Education Means'),
  ('contact_phone', '0333-1234567'),
  ('contact_email', 'foundationcollegiate@gmail.com'),
  ('contact_address', 'Sector 11-B, North Karachi'),
  ('whatsapp_number', '0333-1234567'),
  ('admissions_open', 'true');

-- =================================================================
-- DISABLE ROW LEVEL SECURITY FOR ALL TABLES FOR DIRECT ACCESS
-- =================================================================
ALTER TABLE public.admin_users DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.students DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.results DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.pins DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.teachers DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.achievers DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.downloads DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.notices DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.gallery DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.admissions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.fee_structures DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.fee_challans DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.fee_transactions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_fee_profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.contacts DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings DISABLE ROW LEVEL SECURITY;
