CREATE TABLE IF NOT EXISTS public.homepage (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  data jsonb NOT NULL DEFAULT '{}'::jsonb
);

-- Insert a single empty row if table is empty
INSERT INTO public.homepage (data)
SELECT '{}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM public.homepage);
