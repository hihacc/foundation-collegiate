-- ==============================================================================
-- The Foundation Collegiate (TFC) - Audit Logs Database Table
-- Run this in your Supabase SQL Editor to enable cloud-synced audit trail
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.audit_logs (
    id TEXT PRIMARY KEY,
    category TEXT NOT NULL,
    action TEXT NOT NULL,
    actor_email TEXT NOT NULL,
    actor_role TEXT NOT NULL DEFAULT 'Super Administrator',
    details TEXT NOT NULL,
    ip_address TEXT,
    device_info TEXT,
    path TEXT,
    severity TEXT NOT NULL DEFAULT 'INFO',
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for fast category and time-series searching
CREATE INDEX IF NOT EXISTS idx_audit_logs_category ON public.audit_logs (category);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs (created_at DESC);

-- Enable Row Level Security (RLS)
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Allow public / anon client inserts and reads for logging
CREATE POLICY "Allow anon insert audit_logs" ON public.audit_logs
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow anon select audit_logs" ON public.audit_logs
    FOR SELECT USING (true);
