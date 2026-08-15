-- Phase 4 Taxonomy & Diploma Schema Migration

-- 1. Add program_type and duration columns to programs table
ALTER TABLE public.programs ADD COLUMN IF NOT EXISTS program_type TEXT CHECK (program_type IN ('academic_stream','diploma')) DEFAULT 'academic_stream';
ALTER TABLE public.programs ADD COLUMN IF NOT EXISTS duration TEXT;

-- 2. Seed Academic Classes (X, XI, XII)
INSERT INTO public.academic_classes (name, slug, sort_order) VALUES
  ('Class X', 'x', 1),
  ('Class XI', 'xi', 2),
  ('Class XII', 'xii', 3)
ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, sort_order = EXCLUDED.sort_order;

-- 3. Seed Academic Groups (Computer Science, Biology, Commerce, Pre-Medical, Pre-Engineering)
INSERT INTO public.academic_groups (name, slug, description, icon) VALUES
  ('Computer Science', 'computer-science', 'Computer science, programming, physics, and mathematics', 'Laptop'),
  ('Biology', 'biology', 'Biological sciences, chemistry, and physics', 'Stethoscope'),
  ('Commerce', 'commerce', 'Accounting, economics, business math, and commercial geography', 'Calculator'),
  ('Pre-Medical', 'pre-medical', 'Biology, physics, chemistry for medical university preparation', 'Stethoscope'),
  ('Pre-Engineering', 'pre-engineering', 'Advanced mathematics, physics, and chemistry for engineering', 'Compass')
ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description;

-- 4. Seed Programs Rows (Class X: CS, Bio | Class XI & XII: Commerce, CS, Pre-Medical, Pre-Engineering | Diploma)
INSERT INTO public.programs (title, slug, summary, fee_amount, is_published, sort_order, program_type, duration) VALUES
  -- Class X
  ('Class X — Computer Science', 'x-computer-science', 'BSEK Class X Matriculation in Computer Science stream.', 3500, true, 10, 'academic_stream', '1 year'),
  ('Class X — Biology', 'x-biology', 'BSEK Class X Matriculation in Biology & General Science stream.', 3500, true, 11, 'academic_stream', '1 year'),
  
  -- Class XI
  ('Class XI — Commerce', 'xi-commerce', 'BIEK Class XI Intermediate Part 1 Commerce stream.', 4000, true, 20, 'academic_stream', '1 year'),
  ('Class XI — Computer Science', 'xi-computer-science', 'BIEK Class XI Intermediate Part 1 ICS Computer Science stream.', 4500, true, 21, 'academic_stream', '1 year'),
  ('Class XI — Pre-Medical', 'xi-pre-medical', 'BIEK Class XI Intermediate Part 1 FSc Pre-Medical stream.', 4500, true, 22, 'academic_stream', '1 year'),
  ('Class XI — Pre-Engineering', 'xi-pre-engineering', 'BIEK Class XI Intermediate Part 1 FSc Pre-Engineering stream.', 4500, true, 23, 'academic_stream', '1 year'),

  -- Class XII
  ('Class XII — Commerce', 'xii-commerce', 'BIEK Class XII Intermediate Part 2 Commerce stream.', 4000, true, 30, 'academic_stream', '1 year'),
  ('Class XII — Computer Science', 'xii-computer-science', 'BIEK Class XII Intermediate Part 2 ICS Computer Science stream.', 4500, true, 31, 'academic_stream', '1 year'),
  ('Class XII — Pre-Medical', 'xii-pre-medical', 'BIEK Class XII Intermediate Part 2 FSc Pre-Medical stream.', 4500, true, 32, 'academic_stream', '1 year'),
  ('Class XII — Pre-Engineering', 'xii-pre-engineering', 'BIEK Class XII Intermediate Part 2 FSc Pre-Engineering stream.', 4500, true, 33, 'academic_stream', '1 year'),

  -- Standalone Diploma Program
  ('Diploma in Accounting & Finance', 'diploma-accounting-finance', 'Comprehensive professional diploma in accounting, taxation, financial reporting, and computerized software.', 6000, true, 40, 'diploma', '1 year')
ON CONFLICT (slug) DO NOTHING;
