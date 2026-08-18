import fs from 'fs';
import path from 'path';
import { WhatsAppConversationRecord, WhatsAppMessageRecord, normalizePhone, matchContactFromDatabase, formatDisplayPhone } from './enterpriseDb';
import { whatsappSupabase } from './supabaseClient';
import { supabase as academicSupabase } from '@/lib/supabase/client';

const DATA_DIR = path.join(process.cwd(), 'data', 'whatsapp');
const CONVERSATIONS_FILE = path.join(DATA_DIR, 'conversations.json');
const MESSAGES_FILE = path.join(DATA_DIR, 'messages.json');

// Ensure backup storage directory and files exist
function ensureStorage() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(CONVERSATIONS_FILE)) {
      fs.writeFileSync(CONVERSATIONS_FILE, JSON.stringify([], null, 2), 'utf-8');
    }
    if (!fs.existsSync(MESSAGES_FILE)) {
      fs.writeFileSync(MESSAGES_FILE, JSON.stringify([], null, 2), 'utf-8');
    }
  } catch (e) {
    console.error('[WHATSAPP_STORE] Storage init:', e);
  }
}

// 1. Read All Conversations (Supabase Database Source of Truth)
export async function getAllConversations(): Promise<WhatsAppConversationRecord[]> {
  ensureStorage();
  try {
    const { data, error } = await whatsappSupabase
      .from('whatsapp_conversations')
      .select('*')
      .order('last_message_at', { ascending: false });

    if (!error && Array.isArray(data) && data.length > 0) {
      // Sync to local cache
      try {
        fs.writeFileSync(CONVERSATIONS_FILE, JSON.stringify(data, null, 2), 'utf-8');
      } catch {}
      return data;
    }
  } catch (e) {
    console.warn('[WHATSAPP_DB] Supabase query notice, falling back to local store:', e);
  }

  // Fallback to local cache
  try {
    const raw = fs.readFileSync(CONVERSATIONS_FILE, 'utf-8');
    const convs: WhatsAppConversationRecord[] = JSON.parse(raw);
    return convs.sort((a, b) => new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime());
  } catch {
    return [];
  }
}

// 2. Read Messages by Conversation ID (Supabase Database Source of Truth)
export async function getMessagesByConversationId(conversationId: string): Promise<WhatsAppMessageRecord[]> {
  ensureStorage();
  try {
    const { data, error } = await whatsappSupabase
      .from('whatsapp_messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    if (!error && Array.isArray(data) && data.length > 0) {
      return data;
    }
  } catch (e) {
    console.warn('[WHATSAPP_DB] Supabase messages notice, falling back to local store:', e);
  }

  // Fallback to local cache
  try {
    const raw = fs.readFileSync(MESSAGES_FILE, 'utf-8');
    const allMsgs: WhatsAppMessageRecord[] = JSON.parse(raw);
    return allMsgs
      .filter(m => m.conversation_id === conversationId)
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
  } catch {
    return [];
  }
}

// 3. Save or Update Conversation in Supabase
export async function saveConversation(conv: WhatsAppConversationRecord): Promise<WhatsAppConversationRecord> {
  ensureStorage();
  try {
    const { data, error } = await whatsappSupabase
      .from('whatsapp_conversations')
      .upsert(conv, { onConflict: 'id' })
      .select()
      .maybeSingle();

    if (!error && data) {
      return data;
    }
  } catch (e) {
    console.error('[WHATSAPP_DB] Save conversation error:', e);
  }

  // Save to local file
  try {
    const raw = fs.readFileSync(CONVERSATIONS_FILE, 'utf-8');
    const convs: WhatsAppConversationRecord[] = JSON.parse(raw);
    const idx = convs.findIndex(c => c.id === conv.id || c.normalized_phone === conv.normalized_phone);

    if (idx >= 0) {
      convs[idx] = { ...convs[idx], ...conv, updated_at: new Date().toISOString() };
      fs.writeFileSync(CONVERSATIONS_FILE, JSON.stringify(convs, null, 2), 'utf-8');
      return convs[idx];
    } else {
      convs.unshift(conv);
      fs.writeFileSync(CONVERSATIONS_FILE, JSON.stringify(convs, null, 2), 'utf-8');
      return conv;
    }
  } catch (e) {
    console.error('[WHATSAPP_STORE] File write notice:', e);
    return conv;
  }
}

// 4. Append Message and Update Conversation Metadata
export async function appendMessage(msg: WhatsAppMessageRecord): Promise<WhatsAppMessageRecord> {
  ensureStorage();

  // Save to Supabase
  try {
    await whatsappSupabase
      .from('whatsapp_messages')
      .upsert(msg, { onConflict: 'id' });

    // Update conversation in Supabase
    await whatsappSupabase
      .from('whatsapp_conversations')
      .update({
        last_message_text: msg.content,
        last_message_at: msg.created_at,
        last_message_direction: msg.direction,
        updated_at: new Date().toISOString()
      })
      .eq('id', msg.conversation_id);
  } catch (e) {
    console.error('[WHATSAPP_DB] Append message DB notice:', e);
  }

  // Save to local cache
  try {
    const raw = fs.readFileSync(MESSAGES_FILE, 'utf-8');
    const allMsgs: WhatsAppMessageRecord[] = JSON.parse(raw);

    const exists = allMsgs.some(m => m.id === msg.id || (msg.provider_message_id && m.provider_message_id === msg.provider_message_id));
    if (!exists) {
      allMsgs.push(msg);
      fs.writeFileSync(MESSAGES_FILE, JSON.stringify(allMsgs, null, 2), 'utf-8');
    }
  } catch {}

  return msg;
}

// 5. Find or Create Conversation with Realtime Student Matching
export async function findOrCreateConversation(rawPhone: string, contactName?: string): Promise<WhatsAppConversationRecord> {
  const normalized = normalizePhone(rawPhone);
  const convId = `conv_${normalized}`;

  // Check Supabase
  try {
    const { data: existing } = await whatsappSupabase
      .from('whatsapp_conversations')
      .select('*')
      .eq('normalized_phone', normalized)
      .maybeSingle();

    if (existing) return existing;
  } catch {}

  // Match student from academic database
  const match = await matchContactFromDatabase(normalized);

  const newConv: WhatsAppConversationRecord = {
    id: convId,
    phone: formatDisplayPhone(rawPhone),
    normalized_phone: normalized,
    contact_name: contactName || match?.contactName || (match?.studentName ? `Parent of ${match.studentName}` : 'Unknown WhatsApp Contact'),
    relationship: match?.relationship || 'Inquiry',
    student_roll: match?.studentRoll || undefined,
    student_name: match?.studentName || undefined,
    student_class: match?.studentClass || undefined,
    status: 'open',
    priority: 'normal',
    tags: match?.studentName ? ['Student', match.relationship] : ['Inquiry'],
    unread_count: 0,
    last_message_text: '',
    last_message_at: new Date().toISOString(),
    last_message_direction: 'inbound',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  await saveConversation(newConv);
  return newConv;
}
