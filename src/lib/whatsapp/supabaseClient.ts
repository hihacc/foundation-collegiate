import { createClient } from '@supabase/supabase-js';

const SUPABASE_WHATSAPP_URL = process.env.NEXT_PUBLIC_WHATSAPP_SUPABASE_URL || 'https://jjdtimkrjpmvkypjtxli.supabase.co';
const SUPABASE_WHATSAPP_KEY = process.env.NEXT_PUBLIC_WHATSAPP_SUPABASE_KEY || 'sb_publishable_1Fxmt6u-If7rsnmkgQaUsQ_fWll30HX';

export const whatsappSupabase = createClient(SUPABASE_WHATSAPP_URL, SUPABASE_WHATSAPP_KEY);
