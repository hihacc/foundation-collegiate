import fs from 'fs';
import path from 'path';
import { WhatsAppConversationRecord, WhatsAppMessageRecord, normalizePhone, matchContactFromDatabase, formatDisplayPhone } from './enterpriseDb';
import { supabase } from '@/lib/supabase/client';

const DATA_DIR = path.join(process.cwd(), 'data', 'whatsapp');
const CONVERSATIONS_FILE = path.join(DATA_DIR, 'conversations.json');
const MESSAGES_FILE = path.join(DATA_DIR, 'messages.json');

// Ensure storage directory and files exist
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
    console.error('[WHATSAPP_STORE] Failed to initialize storage files:', e);
  }
}

// Read All Conversations
export function getAllConversations(): WhatsAppConversationRecord[] {
  ensureStorage();
  try {
    const raw = fs.readFileSync(CONVERSATIONS_FILE, 'utf-8');
    const convs: WhatsAppConversationRecord[] = JSON.parse(raw);
    return convs.sort((a, b) => new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime());
  } catch {
    return [];
  }
}

// Read Messages by Conversation ID
export function getMessagesByConversationId(conversationId: string): WhatsAppMessageRecord[] {
  ensureStorage();
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

// Save or Update Conversation
export function saveConversation(conv: WhatsAppConversationRecord): WhatsAppConversationRecord {
  ensureStorage();
  try {
    const convs = getAllConversations();
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
    console.error('[WHATSAPP_STORE] Error saving conversation:', e);
    return conv;
  }
}

// Append Message and Update Conversation Metadata
export function appendMessage(msg: WhatsAppMessageRecord): WhatsAppMessageRecord {
  ensureStorage();
  try {
    const raw = fs.readFileSync(MESSAGES_FILE, 'utf-8');
    const allMsgs: WhatsAppMessageRecord[] = JSON.parse(raw);

    // Prevent duplicate provider message ID
    if (msg.provider_message_id) {
      const exists = allMsgs.some(m => m.provider_message_id === msg.provider_message_id);
      if (exists) {
        console.log(`[WHATSAPP_STORE] Deduplicated message provider ID: ${msg.provider_message_id}`);
        return msg;
      }
    }

    allMsgs.push(msg);
    fs.writeFileSync(MESSAGES_FILE, JSON.stringify(allMsgs, null, 2), 'utf-8');

    // Update corresponding conversation
    const convs = getAllConversations();
    const convIdx = convs.findIndex(c => c.id === msg.conversation_id);

    if (convIdx >= 0) {
      convs[convIdx].last_message_text = msg.content;
      convs[convIdx].last_message_at = msg.created_at;
      convs[convIdx].last_message_direction = msg.direction;
      if (msg.direction === 'inbound') {
        convs[convIdx].unread_count = (convs[convIdx].unread_count || 0) + 1;
        if (convs[convIdx].status === 'resolved' || convs[convIdx].status === 'archived') {
          convs[convIdx].status = 'open';
        }
      }
      fs.writeFileSync(CONVERSATIONS_FILE, JSON.stringify(convs, null, 2), 'utf-8');
    }

    return msg;
  } catch (e) {
    console.error('[WHATSAPP_STORE] Error appending message:', e);
    return msg;
  }
}

// Find or Create Conversation for a Phone Number with Full Contact/Student Matching
export async function findOrCreateConversation(rawPhone: string, initialName?: string): Promise<WhatsAppConversationRecord> {
  const normPhone = normalizePhone(rawPhone);
  if (!normPhone) {
    throw new Error('Invalid phone number format');
  }

  const existingConvs = getAllConversations();
  const existing = existingConvs.find(c => c.normalized_phone === normPhone);
  if (existing) {
    return existing;
  }

  // Deep match against live student and contact database
  const match = await matchContactFromDatabase(normPhone);

  const newConv: WhatsAppConversationRecord = {
    id: `conv_${normPhone}`,
    phone: formatDisplayPhone(rawPhone),
    normalized_phone: normPhone,
    contact_name: match.contactName || initialName || formatDisplayPhone(rawPhone),
    student_id: match.studentId,
    student_name: match.studentName,
    student_roll: match.studentRoll,
    student_class: match.studentClass,
    relationship: match.relationship || 'Inquiry',
    status: 'open',
    priority: 'normal',
    tags: match.role ? [match.role] : ['New Contact'],
    unread_count: 0,
    last_message_text: 'Started conversation',
    last_message_at: new Date().toISOString(),
    last_message_direction: 'outbound'
  };

  saveConversation(newConv);

  // Attempt Supabase insert in background
  try {
    await supabase.from('whatsapp_conversations').insert([newConv]);
  } catch {}

  return newConv;
}
