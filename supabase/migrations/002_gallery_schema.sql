-- SQL Migration: Gallery System Update (Social Media Sync)
-- Run this script in your Supabase SQL Editor

-- 1. Alter the existing gallery table to support social media posts
ALTER TABLE public.gallery
ADD COLUMN IF NOT EXISTS source VARCHAR(50) DEFAULT 'admin', -- 'admin', 'instagram', 'facebook'
ADD COLUMN IF NOT EXISTS source_post_id VARCHAR(255) UNIQUE, -- Unique ID from IG/FB to prevent duplicates
ADD COLUMN IF NOT EXISTS post_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(), -- The actual date the photo was posted
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- 2. Create an index on source_post_id to make duplicate checking fast during sync
CREATE INDEX IF NOT EXISTS idx_gallery_source_post_id ON public.gallery(source_post_id);
CREATE INDEX IF NOT EXISTS idx_gallery_post_date ON public.gallery(post_date DESC);

-- 3. Create a table to track synchronization logs (Optional but good for Admin Panel)
CREATE TABLE IF NOT EXISTS public.gallery_sync_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    status VARCHAR(50) NOT NULL, -- 'success', 'error'
    items_added INTEGER DEFAULT 0,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on sync logs
ALTER TABLE public.gallery_sync_logs ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to view sync logs
CREATE POLICY "Auth users can view sync logs" ON public.gallery_sync_logs FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth users can insert sync logs" ON public.gallery_sync_logs FOR INSERT TO authenticated WITH CHECK (true);

-- Ensure public can still read the gallery
-- (This should already exist from previous setup, but ensuring it here)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'gallery' AND policyname = 'Public can view active gallery items'
    ) THEN
        CREATE POLICY "Public can view active gallery items" ON public.gallery FOR SELECT USING (is_active = true);
    END IF;
END $$;
