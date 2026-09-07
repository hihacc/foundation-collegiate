-- ==============================================================================
-- 004_students_bulk_import_and_rls.sql
-- Ensure date_of_birth exists and grant full RLS access to students table
-- ==============================================================================

-- 1. Ensure students table exists and has date_of_birth and metadata columns
ALTER TABLE IF EXISTS public.students ADD COLUMN IF NOT EXISTS date_of_birth DATE;
ALTER TABLE IF EXISTS public.students ADD COLUMN IF NOT EXISTS cnic TEXT;
ALTER TABLE IF EXISTS public.students ADD COLUMN IF NOT EXISTS cnic_number TEXT;
ALTER TABLE IF EXISTS public.students ADD COLUMN IF NOT EXISTS religion TEXT;
ALTER TABLE IF EXISTS public.students ADD COLUMN IF NOT EXISTS nationality TEXT;
ALTER TABLE IF EXISTS public.students ADD COLUMN IF NOT EXISTS parent_phone TEXT;
ALTER TABLE IF EXISTS public.students ADD COLUMN IF NOT EXISTS secondary_phone TEXT;
ALTER TABLE IF EXISTS public.students ADD COLUMN IF NOT EXISTS emergency_contact TEXT;
ALTER TABLE IF EXISTS public.students ADD COLUMN IF NOT EXISTS father_occupation TEXT;
ALTER TABLE IF EXISTS public.students ADD COLUMN IF NOT EXISTS previous_school TEXT;
ALTER TABLE IF EXISTS public.students ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE IF EXISTS public.students ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';

-- 2. Ensure unique constraint on roll_number for upsert conflict resolution
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'students_roll_number_key'
  ) THEN
    ALTER TABLE public.students ADD CONSTRAINT students_roll_number_key UNIQUE (roll_number);
  END IF;
EXCEPTION
  WHEN OTHERS THEN NULL;
END $$;

-- 3. Configure Row Level Security (RLS) & Policies
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public all students" ON public.students;
DROP POLICY IF EXISTS "Public read students" ON public.students;
DROP POLICY IF EXISTS "Public insert students" ON public.students;
DROP POLICY IF EXISTS "Public update students" ON public.students;
DROP POLICY IF EXISTS "Public delete students" ON public.students;

CREATE POLICY "Public all students" ON public.students
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Grant appropriate table privileges
GRANT ALL ON public.students TO anon, authenticated, service_role;
