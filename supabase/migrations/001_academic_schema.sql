-- SQL Migration: Academic Architecture
-- Run this script in your Supabase SQL Editor

-- 1. Create Academic Classes Table
CREATE TABLE IF NOT EXISTS public.academic_classes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL, -- e.g. "Class XI"
    short_name VARCHAR(100), -- e.g. "XI"
    description TEXT,
    level INTEGER, -- e.g. 11 for Grade 11
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create Academic Groups/Streams Table
CREATE TABLE IF NOT EXISTS public.academic_groups (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    class_id UUID NOT NULL REFERENCES public.academic_classes(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL, -- e.g. "Pre-Medical"
    description TEXT,
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Create Academic Subjects Table
CREATE TABLE IF NOT EXISTS public.academic_subjects (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    group_id UUID NOT NULL REFERENCES public.academic_groups(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL, -- e.g. "Biology"
    code VARCHAR(50), -- e.g. "BIO-11"
    is_compulsory BOOLEAN DEFAULT false,
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add Indexes for Performance
CREATE INDEX IF NOT EXISTS idx_academic_groups_class_id ON public.academic_groups(class_id);
CREATE INDEX IF NOT EXISTS idx_academic_subjects_group_id ON public.academic_subjects(group_id);

-- 4. Enable Row Level Security (RLS) and Create Policies
-- Note: Adjust policies according to your specific auth setup if necessary.
-- By default, public can read active records, but only authenticated admins should write.

ALTER TABLE public.academic_classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.academic_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.academic_subjects ENABLE ROW LEVEL SECURITY;

-- Allow public read access to active records
CREATE POLICY "Public can view active classes" ON public.academic_classes FOR SELECT USING (is_active = true);
CREATE POLICY "Public can view active groups" ON public.academic_groups FOR SELECT USING (is_active = true);
CREATE POLICY "Public can view active subjects" ON public.academic_subjects FOR SELECT USING (is_active = true);

-- Allow authenticated users to view all records (including inactive)
CREATE POLICY "Auth users can view all classes" ON public.academic_classes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth users can view all groups" ON public.academic_groups FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth users can view all subjects" ON public.academic_subjects FOR SELECT TO authenticated USING (true);

-- Allow authenticated users full CRUD operations
CREATE POLICY "Auth users can insert classes" ON public.academic_classes FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth users can update classes" ON public.academic_classes FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Auth users can delete classes" ON public.academic_classes FOR DELETE TO authenticated USING (true);

CREATE POLICY "Auth users can insert groups" ON public.academic_groups FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth users can update groups" ON public.academic_groups FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Auth users can delete groups" ON public.academic_groups FOR DELETE TO authenticated USING (true);

CREATE POLICY "Auth users can insert subjects" ON public.academic_subjects FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth users can update subjects" ON public.academic_subjects FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Auth users can delete subjects" ON public.academic_subjects FOR DELETE TO authenticated USING (true);

-- 5. Insert Sample Data
INSERT INTO public.academic_classes (id, name, short_name, level, display_order)
VALUES 
    ('11111111-1111-1111-1111-111111111111', 'Class IX', 'IX', 9, 1),
    ('22222222-2222-2222-2222-222222222222', 'Class X', 'X', 10, 2),
    ('33333333-3333-3333-3333-333333333333', 'Class XI', 'XI', 11, 3),
    ('44444444-4444-4444-4444-444444444444', 'Class XII', 'XII', 12, 4);

-- Insert Groups for Class XI
INSERT INTO public.academic_groups (id, class_id, name, display_order)
VALUES
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '33333333-3333-3333-3333-333333333333', 'Pre-Medical', 1),
    ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '33333333-3333-3333-3333-333333333333', 'Pre-Engineering', 2),
    ('cccccccc-cccc-cccc-cccc-cccccccccccc', '33333333-3333-3333-3333-333333333333', 'Computer Science', 3),
    ('dddddddd-dddd-dddd-dddd-dddddddddddd', '33333333-3333-3333-3333-333333333333', 'Commerce', 4);

-- Insert Subjects for XI Pre-Medical
INSERT INTO public.academic_subjects (group_id, name, is_compulsory, display_order)
VALUES
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'English', true, 1),
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Urdu', true, 2),
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Islamiat', true, 3),
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Biology', false, 4),
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Physics', false, 5),
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Chemistry', false, 6);

-- 6. Modify Admissions Table to support relational FKs
-- We add these as nullable initially to not break existing data
ALTER TABLE public.admissions ADD COLUMN IF NOT EXISTS class_id UUID REFERENCES public.academic_classes(id);
ALTER TABLE public.admissions ADD COLUMN IF NOT EXISTS group_id UUID REFERENCES public.academic_groups(id);

-- Update the existing 'class_applied' column to 'legacy_class_applied' to preserve old string data if needed,
-- or just keep it as a text backup and use the new fields moving forward.
