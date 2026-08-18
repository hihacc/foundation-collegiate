import { supabase } from '@/lib/supabase/client';
import { getStoredData, setStoredData } from '@/lib/utils/storage';

export interface WhatsAppContactRecord {
  id: string;
  name: string;
  phone: string;
  normalized_phone: string;
  role: 'Student' | 'Parent' | 'Faculty' | 'Inquiry' | 'Unknown';
  student_id?: string | null;
  relationship: 'Self' | 'Father' | 'Mother' | 'Guardian' | 'Inquiry' | 'Faculty' | 'Unknown';
  avatar_url?: string | null;
  notes?: string | null;
  metadata?: Record<string, any>;
  created_at?: string;
  updated_at?: string;
}

export interface WhatsAppConversationRecord {
  id: string;
  contact_id?: string | null;
  phone: string;
  normalized_phone: string;
  contact_name: string;
  student_name?: string | null;
  student_roll?: string | null;
  student_class?: string | null;
  relationship: string;
  assigned_staff_id?: string | null;
  assigned_staff_name?: string | null;
  status: 'new' | 'open' | 'waiting_for_tfc' | 'waiting_for_customer' | 'resolved' | 'archived';
  priority: 'normal' | 'high' | 'urgent';
  tags: string[];
  unread_count: number;
  last_message_text?: string | null;
  last_message_at: string;
  last_message_direction: 'inbound' | 'outbound';
  created_at?: string;
  updated_at?: string;
}

export interface WhatsAppMessageRecord {
  id: string;
  conversation_id: string;
  provider_message_id?: string | null;
  direction: 'inbound' | 'outbound';
  sender: string;
  recipient: string;
  message_type: 'text' | 'image' | 'document' | 'video' | 'audio' | 'voice' | 'template' | 'location';
  content: string;
  status: 'queued' | 'sending' | 'sent' | 'delivered' | 'read' | 'failed';
  media_url?: string | null;
  media_mime_type?: string | null;
  media_filename?: string | null;
  media_size?: number | null;
  is_internal_note?: boolean;
  ai_generated?: boolean;
  reply_to_message_id?: string | null;
  staff_id?: string | null;
  staff_name?: string | null;
  metadata?: Record<string, any>;
  created_at: string;
}

export interface WhatsAppAttachmentRecord {
  id: string;
  message_id: string;
  filename: string;
  mime_type: string;
  size: number;
  storage_path?: string | null;
  public_url: string;
  thumbnail_url?: string | null;
  created_at: string;
}

// 1. Phone Normalizer
export function normalizePhone(rawPhone: string | null | undefined): string {
  if (!rawPhone) return '';
  let digits = rawPhone.replace(/\D/g, '');
  if (digits.startsWith('0092')) {
    digits = '92' + digits.slice(4);
  } else if (digits.startsWith('03')) {
    digits = '92' + digits.slice(1);
  } else if (digits.startsWith('3') && digits.length === 10) {
    digits = '92' + digits;
  }
  return digits;
}

export function formatDisplayPhone(rawPhone: string | null | undefined): string {
  if (!rawPhone) return '';
  const digits = rawPhone.replace(/\D/g, '');
  let local11 = '';
  if (digits.startsWith('92') && digits.length === 12) {
    local11 = '0' + digits.slice(2);
  } else if (digits.startsWith('0') && digits.length === 11) {
    local11 = digits;
  } else {
    return rawPhone;
  }
  return `${local11.slice(0, 4)}-${local11.slice(4)}`;
}

// 2. Contact Matcher Engine
export async function matchContactFromDatabase(normalizedPhone: string): Promise<{
  contactName: string;
  studentName?: string;
  studentRoll?: string;
  studentClass?: string;
  role: WhatsAppContactRecord['role'];
  relationship: WhatsAppContactRecord['relationship'];
  studentId?: string;
}> {
  const normDigits = normalizedPhone.replace(/\D/g, '');
  const local11 = normDigits.startsWith('92') ? '0' + normDigits.slice(2) : normDigits;
  const last7 = normDigits.slice(-7);

  try {
    // 1. Search Students Database
    const { data: students } = await supabase.from('students').select('*');
    if (students && students.length > 0) {
      for (const s of students) {
        const sPhone = normalizePhone(s.phone);
        const pPhone = normalizePhone(s.parent_phone);
        const secPhone = normalizePhone(s.secondary_phone || s.emergency_contact);

        // Matched Student Direct
        if (sPhone && (sPhone === normDigits || sPhone.endsWith(last7))) {
          return {
            contactName: s.name,
            studentName: s.name,
            studentRoll: s.roll_number,
            studentClass: s.class_name,
            role: 'Student',
            relationship: 'Self',
            studentId: s.id
          };
        }

        // Matched Parent Phone
        if (pPhone && (pPhone === normDigits || pPhone.endsWith(last7))) {
          return {
            contactName: s.father_name ? `Father of ${s.name} (${s.father_name})` : `Parent of ${s.name}`,
            studentName: s.name,
            studentRoll: s.roll_number,
            studentClass: s.class_name,
            role: 'Parent',
            relationship: 'Father',
            studentId: s.id
          };
        }

        // Matched Alternate Phone
        if (secPhone && (secPhone === normDigits || secPhone.endsWith(last7))) {
          return {
            contactName: `Guardian of ${s.name}`,
            studentName: s.name,
            studentRoll: s.roll_number,
            studentClass: s.class_name,
            role: 'Parent',
            relationship: 'Guardian',
            studentId: s.id
          };
        }
      }
    }

    // 2. Search Admission Inquiries
    const { data: inquiries } = await supabase.from('inquiries').select('*');
    if (inquiries && inquiries.length > 0) {
      const matchedInq = inquiries.find((iq: any) => {
        const iqPhone = normalizePhone(iq.phone || iq.contact_number);
        return iqPhone && (iqPhone === normDigits || iqPhone.endsWith(last7));
      });

      if (matchedInq) {
        return {
          contactName: matchedInq.name || matchedInq.student_name || 'Prospective Student',
          studentName: matchedInq.name || matchedInq.student_name,
          studentClass: matchedInq.class_name || matchedInq.interested_class,
          role: 'Inquiry',
          relationship: 'Inquiry'
        };
      }
    }

    // 3. Search Faculty / Teachers
    const { data: teachers } = await supabase.from('teachers').select('*');
    if (teachers && teachers.length > 0) {
      const matchedTeacher = teachers.find((t: any) => {
        const tPhone = normalizePhone(t.phone);
        return tPhone && (tPhone === normDigits || tPhone.endsWith(last7));
      });

      if (matchedTeacher) {
        return {
          contactName: `${matchedTeacher.name} (${matchedTeacher.subject || 'Faculty'})`,
          role: 'Faculty',
          relationship: 'Faculty'
        };
      }
    }
  } catch (err) {
    console.warn('Database contact matching notice:', err);
  }

  // Fallback to Unknown Contact
  return {
    contactName: `WhatsApp Contact (${formatDisplayPhone(normalizedPhone)})`,
    role: 'Unknown',
    relationship: 'Unknown'
  };
}

// 3. Inbound Message Processing Pipeline
export async function processInboundWhatsAppMessage(payload: {
  senderPhone: string;
  senderName?: string;
  messageText: string;
  messageType?: WhatsAppMessageRecord['message_type'];
  providerMessageId?: string;
  mediaUrl?: string;
  mediaMimeType?: string;
  mediaFilename?: string;
  mediaSize?: number;
  timestamp?: string;
}): Promise<{ success: boolean; conversationId: string; messageId: string }> {
  const normPhone = normalizePhone(payload.senderPhone);
  const formattedPhone = formatDisplayPhone(normPhone);
  const msgTime = payload.timestamp || new Date().toISOString();

  // Match contact context
  const matched = await matchContactFromDatabase(normPhone);
  const contactName = payload.senderName || matched.contactName;

  let conversationId = '';
  let existingConv: WhatsAppConversationRecord | null = null;

  // Try finding existing conversation in Supabase
  try {
    const { data: convData } = await supabase
      .from('whatsapp_conversations')
      .select('*')
      .eq('normalized_phone', normPhone)
      .maybeSingle();

    if (convData) {
      existingConv = convData;
      conversationId = convData.id;
    }
  } catch {}

  // Upsert Conversation
  if (existingConv) {
    const updatedUnread = (existingConv.unread_count || 0) + 1;
    const updatePayload = {
      contact_name: contactName || existingConv.contact_name,
      student_name: matched.studentName || existingConv.student_name,
      student_roll: matched.studentRoll || existingConv.student_roll,
      student_class: matched.studentClass || existingConv.student_class,
      relationship: matched.relationship || existingConv.relationship,
      last_message_text: payload.messageText || `[${payload.messageType || 'Attachment'}]`,
      last_message_at: msgTime,
      last_message_direction: 'inbound',
      unread_count: updatedUnread,
      status: existingConv.status === 'resolved' || existingConv.status === 'archived' ? 'open' : existingConv.status || 'open',
      updated_at: new Date().toISOString()
    };

    try {
      await supabase.from('whatsapp_conversations').update(updatePayload).eq('id', conversationId);
    } catch {}
  } else {
    // Create new conversation
    conversationId = `conv_${normPhone}_${Date.now()}`;
    const newConv: Partial<WhatsAppConversationRecord> = {
      id: conversationId,
      phone: formattedPhone,
      normalized_phone: normPhone,
      contact_name: contactName,
      student_name: matched.studentName || null,
      student_roll: matched.studentRoll || null,
      student_class: matched.studentClass || null,
      relationship: matched.relationship,
      status: 'new',
      priority: 'normal',
      tags: matched.role !== 'Unknown' ? [matched.role] : [],
      unread_count: 1,
      last_message_text: payload.messageText || `[${payload.messageType || 'Attachment'}]`,
      last_message_at: msgTime,
      last_message_direction: 'inbound',
      created_at: msgTime,
      updated_at: msgTime
    };

    try {
      await supabase.from('whatsapp_conversations').insert([newConv]);
    } catch {}
  }

  // Insert Inbound Message
  const messageId = `msg_in_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const newMsg: Partial<WhatsAppMessageRecord> = {
    id: messageId,
    conversation_id: conversationId,
    provider_message_id: payload.providerMessageId || messageId,
    direction: 'inbound',
    sender: normPhone,
    recipient: 'TFC_OFFICIAL',
    message_type: payload.messageType || 'text',
    content: payload.messageText,
    status: 'delivered',
    media_url: payload.mediaUrl || null,
    media_mime_type: payload.mediaMimeType || null,
    media_filename: payload.mediaFilename || null,
    media_size: payload.mediaSize || null,
    is_internal_note: false,
    ai_generated: false,
    created_at: msgTime
  };

  try {
    await supabase.from('whatsapp_messages').insert([newMsg]);
  } catch {}

  // If media exists, insert attachment record
  if (payload.mediaUrl && payload.mediaFilename) {
    try {
      await supabase.from('whatsapp_attachments').insert([{
        id: `att_${Date.now()}`,
        message_id: messageId,
        filename: payload.mediaFilename,
        mime_type: payload.mediaMimeType || 'application/octet-stream',
        size: payload.mediaSize || 0,
        public_url: payload.mediaUrl,
        created_at: msgTime
      }]);
    } catch {}
  }

  // Sync to local fallback storage
  try {
    const localConvs = getStoredData<WhatsAppConversationRecord[]>('tfc_whatsapp_conversations', []);
    const idx = localConvs.findIndex(c => c.normalized_phone === normPhone);
    const convObj: WhatsAppConversationRecord = {
      id: conversationId,
      phone: formattedPhone,
      normalized_phone: normPhone,
      contact_name: contactName,
      student_name: matched.studentName || null,
      student_roll: matched.studentRoll || null,
      student_class: matched.studentClass || null,
      relationship: matched.relationship,
      status: 'open',
      priority: 'normal',
      tags: matched.role !== 'Unknown' ? [matched.role] : [],
      unread_count: idx >= 0 ? (localConvs[idx].unread_count || 0) + 1 : 1,
      last_message_text: payload.messageText || `[${payload.messageType || 'Attachment'}]`,
      last_message_at: msgTime,
      last_message_direction: 'inbound',
      created_at: idx >= 0 ? localConvs[idx].created_at : msgTime,
      updated_at: msgTime
    };

    if (idx >= 0) {
      localConvs[idx] = convObj;
    } else {
      localConvs.unshift(convObj);
    }
    setStoredData('tfc_whatsapp_conversations', localConvs);

    const localMsgs = getStoredData<WhatsAppMessageRecord[]>(`tfc_whatsapp_messages_${conversationId}`, []);
    localMsgs.push(newMsg as WhatsAppMessageRecord);
    setStoredData(`tfc_whatsapp_messages_${conversationId}`, localMsgs);
  } catch {}

  return { success: true, conversationId, messageId };
}
