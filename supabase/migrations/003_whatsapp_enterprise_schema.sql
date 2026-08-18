-- =================================================================
-- THE FOUNDATION COLLEGIATE (TFC) — WHATSAPP ENTERPRISE SCHEMA MIGRATION
-- Adds Full Inbound/Outbound WhatsApp Conversations, Messages, Contacts, and Attachments
-- =================================================================

-- 1. WhatsApp Contacts Table
CREATE TABLE IF NOT EXISTS public.whatsapp_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  normalized_phone TEXT NOT NULL,
  role TEXT DEFAULT 'Unknown', -- 'Student', 'Parent', 'Faculty', 'Inquiry', 'Unknown'
  student_id UUID REFERENCES public.students(id) ON DELETE SET NULL,
  relationship TEXT DEFAULT 'Unknown', -- 'Self', 'Father', 'Mother', 'Guardian', 'Inquiry', 'Faculty', 'Unknown'
  avatar_url TEXT,
  notes TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_whatsapp_contacts_norm_phone ON public.whatsapp_contacts (normalized_phone);
CREATE INDEX IF NOT EXISTS idx_whatsapp_contacts_student_id ON public.whatsapp_contacts (student_id);

-- 2. WhatsApp Conversations Table
CREATE TABLE IF NOT EXISTS public.whatsapp_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id UUID REFERENCES public.whatsapp_contacts(id) ON DELETE SET NULL,
  phone TEXT NOT NULL,
  normalized_phone TEXT NOT NULL,
  contact_name TEXT NOT NULL,
  student_name TEXT,
  student_roll TEXT,
  student_class TEXT,
  relationship TEXT DEFAULT 'Unknown',
  assigned_staff_id TEXT,
  assigned_staff_name TEXT DEFAULT 'Unassigned',
  status TEXT DEFAULT 'open', -- 'new', 'open', 'waiting_for_tfc', 'waiting_for_customer', 'resolved', 'archived'
  priority TEXT DEFAULT 'normal', -- 'normal', 'high', 'urgent'
  tags JSONB DEFAULT '[]'::jsonb,
  unread_count INT DEFAULT 0,
  last_message_text TEXT,
  last_message_at TIMESTAMPTZ DEFAULT NOW(),
  last_message_direction TEXT DEFAULT 'inbound', -- 'inbound', 'outbound'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_whatsapp_conv_norm_phone ON public.whatsapp_conversations (normalized_phone);
CREATE INDEX IF NOT EXISTS idx_whatsapp_conv_status ON public.whatsapp_conversations (status);
CREATE INDEX IF NOT EXISTS idx_whatsapp_conv_last_msg ON public.whatsapp_conversations (last_message_at DESC);

-- 3. WhatsApp Messages Table
CREATE TABLE IF NOT EXISTS public.whatsapp_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES public.whatsapp_conversations(id) ON DELETE CASCADE,
  provider_message_id TEXT UNIQUE,
  direction TEXT NOT NULL, -- 'inbound', 'outbound'
  sender TEXT NOT NULL,
  recipient TEXT NOT NULL,
  message_type TEXT DEFAULT 'text', -- 'text', 'image', 'document', 'video', 'audio', 'voice', 'template'
  content TEXT NOT NULL,
  status TEXT DEFAULT 'delivered', -- 'queued', 'sending', 'sent', 'delivered', 'read', 'failed'
  media_url TEXT,
  media_mime_type TEXT,
  media_filename TEXT,
  media_size INT,
  is_internal_note BOOLEAN DEFAULT FALSE,
  ai_generated BOOLEAN DEFAULT FALSE,
  reply_to_message_id TEXT,
  staff_id TEXT,
  staff_name TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_whatsapp_msg_conv_id ON public.whatsapp_messages (conversation_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_msg_created_at ON public.whatsapp_messages (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_whatsapp_msg_provider_id ON public.whatsapp_messages (provider_message_id);

-- 4. WhatsApp Attachments Table
CREATE TABLE IF NOT EXISTS public.whatsapp_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID REFERENCES public.whatsapp_messages(id) ON DELETE CASCADE,
  filename TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  size INT DEFAULT 0,
  storage_path TEXT,
  public_url TEXT NOT NULL,
  thumbnail_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_whatsapp_attach_msg ON public.whatsapp_attachments (message_id);

-- 5. RLS Policies
ALTER TABLE public.whatsapp_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_attachments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read whatsapp_contacts" ON public.whatsapp_contacts FOR SELECT USING (true);
CREATE POLICY "Allow public insert whatsapp_contacts" ON public.whatsapp_contacts FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update whatsapp_contacts" ON public.whatsapp_contacts FOR UPDATE USING (true);

CREATE POLICY "Allow public read whatsapp_conversations" ON public.whatsapp_conversations FOR SELECT USING (true);
CREATE POLICY "Allow public insert whatsapp_conversations" ON public.whatsapp_conversations FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update whatsapp_conversations" ON public.whatsapp_conversations FOR UPDATE USING (true);

CREATE POLICY "Allow public read whatsapp_messages" ON public.whatsapp_messages FOR SELECT USING (true);
CREATE POLICY "Allow public insert whatsapp_messages" ON public.whatsapp_messages FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update whatsapp_messages" ON public.whatsapp_messages FOR UPDATE USING (true);

CREATE POLICY "Allow public read whatsapp_attachments" ON public.whatsapp_attachments FOR SELECT USING (true);
CREATE POLICY "Allow public insert whatsapp_attachments" ON public.whatsapp_attachments FOR INSERT WITH CHECK (true);
