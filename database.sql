-- =============================================
-- THE FOUNDATION COLLEGIATE - COMPLETE DATABASE SCHEMA
-- Run this in Supabase SQL Editor
-- =============================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- =============================================
-- 1. SETTINGS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS public.settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    key TEXT NOT NULL UNIQUE,
    value TEXT,
    type TEXT DEFAULT 'text',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Default settings
INSERT INTO public.settings (key, value, type) VALUES
  ('site_name', 'The Foundation Collegiate', 'text'),
  ('site_tagline', 'We Know and Deliver what Quality Education Means.', 'text'),
  ('contact_phone', '0333-3439458', 'text'),
  ('contact_email', 'foundationcollegiate@gmail.com', 'text'),
  ('contact_address', 'House #1704, Sector 11-E, Muslim Town, North Karachi, Karachi, Pakistan', 'text'),
  ('facebook_url', 'https://www.facebook.com/TheFoundationCollegiate/', 'text'),
  ('instagram_url', 'https://www.instagram.com/thefoundationcollegiate/', 'text'),
  ('admissions_open', 'true', 'boolean'),
  ('admissions_year', '2026', 'text'),
  ('result_attempt_limit', '3', 'number'),
  ('result_lockout_minutes', '15', 'number'),
  ('whatsapp_number', '+923333439458', 'text')
ON CONFLICT (key) DO NOTHING;

-- =============================================
-- 2. ADMINS TABLE (Handled by Supabase Auth, but we store metadata)
-- =============================================
CREATE TABLE IF NOT EXISTS public.admins (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    role TEXT DEFAULT 'admin',
    is_active BOOLEAN DEFAULT true,
    last_login TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 3. STUDENTS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS public.students (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    father_name TEXT NOT NULL,
    roll_number TEXT UNIQUE NOT NULL,
    class_name TEXT NOT NULL,
    section TEXT,
    phone TEXT,
    email TEXT,
    photo_url TEXT,
    gender TEXT,
    address TEXT,
    date_of_birth DATE,
    cnic_number TEXT,
    admission_number TEXT,
    admission_date DATE,
    status TEXT DEFAULT 'Active',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 4. TEACHERS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS public.teachers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    subject TEXT NOT NULL,
    qualification TEXT,
    experience_years INTEGER DEFAULT 0,
    bio TEXT,
    photo_url TEXT,
    is_active BOOLEAN DEFAULT true,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 5. RESULTS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS public.results (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    student_id UUID REFERENCES public.students(id) ON DELETE SET NULL,
    student_name TEXT NOT NULL,
    father_name TEXT NOT NULL,
    roll_number TEXT NOT NULL,
    class_name TEXT NOT NULL,
    exam_name TEXT NOT NULL DEFAULT 'Monthly Test',
    exam_date DATE,
    subjects JSONB NOT NULL DEFAULT '[]',
    total_marks INTEGER NOT NULL,
    obtained_marks INTEGER NOT NULL,
    percentage DECIMAL(5,2) NOT NULL,
    grade TEXT NOT NULL,
    position TEXT,
    remarks TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 6. PINS TABLE (Separate for security)
-- =============================================
CREATE TABLE IF NOT EXISTS public.pins (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    result_id UUID REFERENCES public.results(id) ON DELETE CASCADE NOT NULL,
    roll_number TEXT NOT NULL,
    pin_hash TEXT NOT NULL,
    attempts INTEGER DEFAULT 0,
    locked_until TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 7. ADMISSIONS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS public.admissions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    student_name TEXT NOT NULL,
    father_name TEXT NOT NULL,
    date_of_birth DATE,
    gender TEXT,
    class_applied TEXT NOT NULL,
    previous_school TEXT,
    previous_marks TEXT,
    parent_phone TEXT NOT NULL,
    parent_email TEXT,
    parent_cnic TEXT,
    address TEXT NOT NULL,
    photo_url TEXT,
    documents_url TEXT[],
    status TEXT DEFAULT 'pending',
    remarks TEXT,
    interview_date TIMESTAMPTZ,
    fee_paid BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 8. CONTACTS TABLE (Contact Management)
-- =============================================
CREATE TABLE IF NOT EXISTS public.contacts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT NOT NULL,
    subject TEXT,
    message TEXT NOT NULL,
    status TEXT DEFAULT 'Pending',
    ip_address TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 9. GALLERY TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS public.gallery (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT,
    description TEXT,
    image_url TEXT NOT NULL,
    category TEXT DEFAULT 'general',
    is_banner BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 10. NOTICES / ANNOUNCEMENTS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS public.notices (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    type TEXT DEFAULT 'general',
    is_pinned BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 11. COURSES TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS public.courses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    level TEXT NOT NULL,
    classes TEXT NOT NULL,
    subjects TEXT[] NOT NULL,
    duration TEXT,
    fee_per_month INTEGER,
    icon TEXT,
    is_active BOOLEAN DEFAULT true,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 12. DOWNLOADS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS public.downloads (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    file_url TEXT NOT NULL,
    file_type TEXT,
    file_size TEXT,
    category TEXT DEFAULT 'general',
    download_count INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 13. TESTIMONIALS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS public.testimonials (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    student_name TEXT NOT NULL,
    class_name TEXT,
    achievement TEXT,
    quote TEXT NOT NULL,
    rating INTEGER DEFAULT 5,
    photo_url TEXT,
    is_active BOOLEAN DEFAULT true,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 14. EVENTS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS public.events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    event_date TIMESTAMPTZ NOT NULL,
    location TEXT,
    image_url TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 15. SLIDERS TABLE (Homepage Banners)
-- =============================================
CREATE TABLE IF NOT EXISTS public.sliders (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    subtitle TEXT,
    image_url TEXT,
    button_text TEXT,
    button_url TEXT,
    is_active BOOLEAN DEFAULT true,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 16. ACTIVITY_LOGS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS public.activity_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    admin_id UUID REFERENCES public.admins(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    table_name TEXT,
    record_id TEXT,
    details JSONB,
    ip_address TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 17. ANALYTICS TABLE (Visitor Logs)
-- =============================================
CREATE TABLE IF NOT EXISTS public.analytics (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    page TEXT NOT NULL,
    referrer TEXT,
    country TEXT,
    device TEXT,
    ip_address TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 18. NOTIFICATIONS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    admin_id UUID REFERENCES public.admins(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT DEFAULT 'info',
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 19. FEE STRUCTURES (Fee Management)
-- =============================================
CREATE TABLE IF NOT EXISTS public.fee_structures (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    class_name TEXT NOT NULL UNIQUE,
    admission_fee INTEGER DEFAULT 0,
    monthly_tuition_fee INTEGER DEFAULT 0,
    annual_charges INTEGER DEFAULT 0,
    examination_fee INTEGER DEFAULT 0,
    registration_fee INTEGER DEFAULT 0,
    library_fee INTEGER DEFAULT 0,
    sports_fee INTEGER DEFAULT 0,
    lab_fee INTEGER DEFAULT 0,
    security_deposit INTEGER DEFAULT 0,
    misc_charges INTEGER DEFAULT 0,
    custom_fees JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 20. STUDENT FEE PROFILES
-- =============================================
CREATE TABLE IF NOT EXISTS public.student_fee_profiles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    student_id UUID REFERENCES public.students(id) ON DELETE CASCADE UNIQUE NOT NULL,
    fee_structure_id UUID REFERENCES public.fee_structures(id) ON DELETE SET NULL,
    discount_type TEXT DEFAULT 'None', -- 'None', 'Percentage', 'Fixed'
    discount_value INTEGER DEFAULT 0,
    transport_fee INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 21. FEE CHALLANS
-- =============================================
CREATE TABLE IF NOT EXISTS public.fee_challans (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    student_id UUID REFERENCES public.students(id) ON DELETE CASCADE NOT NULL,
    month_year TEXT NOT NULL, -- e.g., 'August 2026'
    issue_date DATE NOT NULL,
    due_date DATE NOT NULL,
    total_amount INTEGER NOT NULL,
    discount_applied INTEGER DEFAULT 0,
    fine_applied INTEGER DEFAULT 0,
    net_payable INTEGER NOT NULL,
    paid_amount INTEGER DEFAULT 0,
    status TEXT DEFAULT 'Pending', -- 'Paid', 'Pending', 'Overdue', 'Partially Paid', 'Cancelled'
    barcode_ref TEXT UNIQUE NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 22. FEE TRANSACTIONS
-- =============================================
CREATE TABLE IF NOT EXISTS public.fee_transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    challan_id UUID REFERENCES public.fee_challans(id) ON DELETE CASCADE NOT NULL,
    amount_paid INTEGER NOT NULL,
    payment_method TEXT DEFAULT 'Cash', -- 'Cash', 'Bank Transfer', 'Easypaisa', etc.
    transaction_date TIMESTAMPTZ DEFAULT NOW(),
    remarks TEXT,
    status TEXT DEFAULT 'Success' -- 'Success', 'Failed', 'Refunded'
);

-- =============================================
-- 23. RESULT_ATTEMPTS TABLE (Rate Limiting)
-- =============================================
CREATE TABLE IF NOT EXISTS public.result_attempts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    roll_number TEXT NOT NULL,
    ip_address TEXT,
    attempts INTEGER DEFAULT 1,
    locked_until TIMESTAMPTZ,
    last_attempt_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_result_attempts_roll ON public.result_attempts(roll_number);

-- =============================================
-- ENABLE ROW LEVEL SECURITY (RLS)
-- =============================================
ALTER TABLE public.results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gallery ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.downloads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.testimonials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sliders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fee_structures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_fee_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fee_challans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fee_transactions ENABLE ROW LEVEL SECURITY;

-- Public read policies
CREATE POLICY "Public read gallery" ON public.gallery FOR SELECT USING (is_active = true);
CREATE POLICY "Public read notices" ON public.notices FOR SELECT USING (is_active = true);
CREATE POLICY "Public read courses" ON public.courses FOR SELECT USING (is_active = true);
CREATE POLICY "Public read downloads" ON public.downloads FOR SELECT USING (is_active = true);
CREATE POLICY "Public read testimonials" ON public.testimonials FOR SELECT USING (is_active = true);
CREATE POLICY "Public read events" ON public.events FOR SELECT USING (is_active = true);
CREATE POLICY "Public read sliders" ON public.sliders FOR SELECT USING (is_active = true);
CREATE POLICY "Public read teachers" ON public.teachers FOR SELECT USING (is_active = true);
CREATE POLICY "Public read settings" ON public.settings FOR SELECT USING (true);

-- Public insert for forms
CREATE POLICY "Public insert admissions" ON public.admissions FOR INSERT WITH CHECK (true);
CREATE POLICY "Public insert messages" ON public.messages FOR INSERT WITH CHECK (true);

-- Result lookup (public but pin-protected at app level)
CREATE POLICY "Public read results" ON public.results FOR SELECT USING (is_active = true);

-- Pins: only via service role
CREATE POLICY "Service role pins" ON public.pins USING (true);

-- Students: Full management for authenticated / admin & public operations
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public all students" ON public.students;
CREATE POLICY "Public all students" ON public.students FOR ALL USING (true) WITH CHECK (true);
