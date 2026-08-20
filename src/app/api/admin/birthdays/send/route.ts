import { NextRequest, NextResponse } from 'next/server';
import { TfcWhatsAppService } from '@/lib/whatsapp/whatsappService';
import { findOrCreateConversation, appendMessage } from '@/lib/whatsapp/persistentStore';
import { normalizePhone, formatDisplayPhone } from '@/lib/whatsapp/enterpriseDb';
import { supabase } from '@/lib/supabase/client';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const BIRTHDAY_LOG_FILE = path.join(process.cwd(), 'data', 'birthday_wishes_log.json');

function getBirthdayLogs(): any[] {
  try {
    if (fs.existsSync(BIRTHDAY_LOG_FILE)) {
      const raw = fs.readFileSync(BIRTHDAY_LOG_FILE, 'utf-8');
      return JSON.parse(raw);
    }
  } catch {}
  return [];
}

function saveBirthdayLog(logEntry: any) {
  try {
    const dir = path.dirname(BIRTHDAY_LOG_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    const logs = getBirthdayLogs();
    logs.unshift(logEntry);
    fs.writeFileSync(BIRTHDAY_LOG_FILE, JSON.stringify(logs.slice(0, 500), null, 2), 'utf-8');
  } catch (e: any) {
    console.error('[BIRTHDAY_LOG] Error saving log:', e.message);
  }
}

export const BIRTHDAY_TEMPLATES = {
  formal: (name: string, className?: string) => 
    `🎉 *Happy Birthday, ${name}!* 🎂\n\n` +
    `The faculty, staff, and administration of *The Foundation Collegiate* extend our warmest and happiest birthday greetings to you!\n\n` +
    `May this year bring you wisdom, good health, and outstanding success in your academic journey (${className || 'Academic Session 2026'}). ✨\n\n` +
    `Warm regards,\n` +
    `*Dr. Asif Iqbal & Academic Directorate*\n` +
    `*The Foundation Collegiate*`,

  inspirational: (name: string) => 
    `🌟 *Happy Birthday ${name}!* 🎂🎈\n\n` +
    `"Your future is as bright as your dedication." On your special day, *The Foundation Collegiate* family celebrates you and wishes you limitless success and happiness!\n\n` +
    `Keep shining and reaching new heights! 🚀✨\n\n` +
    `- With best prayers & blessings,\n` +
    `*Management & Faculty*\n*The Foundation Collegiate*`,

  bilingual: (name: string) => 
    `🎉 *Happy Birthday ${name}!* 🎂\n\n` +
    `سالگرہ بہت بہت مبارک ہو! اللہ تعالی آپ کو صحت، کامیابی اور درخشاں مستقبل عطا فرمائے۔\n\n` +
    `May this new year of your life be filled with knowledge, growth, and joy.\n\n` +
    `Warm regards,\n` +
    `*The Foundation Collegiate Family* 🎓`,

  achiever: (name: string, rollNumber?: string) => 
    `🏆 *Salutations & Happy Birthday ${name}!* 🎂🎉\n\n` +
    `Wishing our distinguished scholar (${rollNumber || 'TFC Student'}) a magnificent birthday filled with achievements and joyous moments.\n\n` +
    `Proud to have you as part of *The Foundation Collegiate*!\n\n` +
    `Directorate of Student Affairs,\n` +
    `*The Foundation Collegiate*`
};

// POST /api/admin/birthdays/send
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { 
      student_id, 
      student_name, 
      phone, 
      parent_phone, 
      class_name, 
      roll_number,
      custom_message, 
      template_type = 'formal',
      students_batch // Array of students for bulk send
    } = body;

    // Batch send mode
    if (Array.isArray(students_batch) && students_batch.length > 0) {
      const results = [];
      let successCount = 0;
      let failCount = 0;

      for (const st of students_batch) {
        const rawPhone = st.phone || st.parent_phone;
        const normPhone = normalizePhone(rawPhone || '');

        if (!normPhone) {
          results.push({ student_id: st.id, name: st.name, status: 'FAILED', error: 'No valid phone number' });
          failCount++;
          continue;
        }

        const msgText = st.custom_message || BIRTHDAY_TEMPLATES[template_type as keyof typeof BIRTHDAY_TEMPLATES]?.(st.name, st.class_name) || BIRTHDAY_TEMPLATES.formal(st.name, st.class_name);

        try {
          // 1. Create/Find conversation in WhatsApp database
          const conv = await findOrCreateConversation(normPhone, st.name);
          
          // 2. Append message
          const msgRecord = {
            id: `msg_bday_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
            conversation_id: conv.id,
            direction: 'outbound' as const,
            sender: 'TFC_OFFICIAL',
            recipient: normPhone,
            message_type: 'text' as const,
            content: msgText,
            status: 'sending' as const,
            is_internal_note: false,
            created_at: new Date().toISOString()
          };

          await appendMessage(msgRecord);

          // 3. Dispatch to WhatsApp microservice API
          const sendRes = await TfcWhatsAppService.sendMessage({
            accountId: 'tfc-default-sender',
            recipient: normPhone,
            messageBody: msgText,
            messageType: 'TEXT',
            metadata: {
              studentId: st.id,
              studentName: st.name,
              category: 'BIRTHDAY_GREETING'
            }
          });

          const isDelivered = sendRes.success;

          // 4. Save to birthday log
          saveBirthdayLog({
            id: `bday_log_${Date.now()}_${st.id}`,
            student_id: st.id,
            student_name: st.name,
            phone: formatDisplayPhone(normPhone),
            message: msgText,
            status: isDelivered ? 'DELIVERED' : 'QUEUED_SENT',
            provider_status: sendRes.success ? 'API_SUCCESS' : 'SAVED_TO_INBOX',
            sent_at: new Date().toISOString()
          });

          results.push({
            student_id: st.id,
            name: st.name,
            phone: normPhone,
            status: 'SUCCESS',
            provider_response: sendRes
          });
          successCount++;
        } catch (err: any) {
          results.push({ student_id: st.id, name: st.name, status: 'FAILED', error: err.message });
          failCount++;
        }
      }

      return NextResponse.json({
        success: true,
        batch: true,
        total: students_batch.length,
        successCount,
        failCount,
        results
      });
    }

    // Single send mode
    if (!student_name) {
      return NextResponse.json({ success: false, error: 'student_name is required' }, { status: 400 });
    }

    const rawPhone = phone || parent_phone;
    const normPhone = normalizePhone(rawPhone || '');

    if (!normPhone) {
      return NextResponse.json({ 
        success: false, 
        error: `No valid phone number found for ${student_name}` 
      }, { status: 400 });
    }

    const messageContent = custom_message || 
      (BIRTHDAY_TEMPLATES[template_type as keyof typeof BIRTHDAY_TEMPLATES]?.(student_name, class_name) || BIRTHDAY_TEMPLATES.formal(student_name, class_name));

    // 1. WhatsApp DB integration
    const conv = await findOrCreateConversation(normPhone, student_name);
    const msgId = `msg_bday_${Date.now()}`;
    const msgRecord = {
      id: msgId,
      conversation_id: conv.id,
      direction: 'outbound' as const,
      sender: 'TFC_OFFICIAL',
      recipient: normPhone,
      message_type: 'text' as const,
      content: messageContent,
      status: 'sending' as const,
      is_internal_note: false,
      created_at: new Date().toISOString()
    };

    await appendMessage(msgRecord);

    // 2. WhatsApp API Microservice Direct Dispatch
    let apiStatus = 'SENT';
    try {
      const sendRes = await TfcWhatsAppService.sendMessage({
        accountId: 'tfc-default-sender',
        recipient: normPhone,
        messageBody: messageContent,
        messageType: 'TEXT',
        metadata: {
          studentId: student_id,
          studentName: student_name,
          category: 'BIRTHDAY_GREETING'
        }
      });
      if (sendRes.success) {
        apiStatus = 'DELIVERED';
      }
    } catch (apiErr: any) {
      console.warn('[BIRTHDAY_SEND] Microservice direct call notice:', apiErr.message);
    }

    // 3. Log to audit file
    saveBirthdayLog({
      id: `bday_log_${Date.now()}`,
      student_id: student_id || 'manual',
      student_name,
      phone: formatDisplayPhone(normPhone),
      message: messageContent,
      status: apiStatus,
      sent_at: new Date().toISOString()
    });

    return NextResponse.json({
      success: true,
      message: `Birthday greeting dispatched directly via WhatsApp API to ${student_name} (${formatDisplayPhone(normPhone)})!`,
      data: {
        student_name,
        phone: formatDisplayPhone(normPhone),
        conversation_id: conv.id,
        message_id: msgId,
        status: apiStatus,
        sent_at: new Date().toISOString()
      }
    });

  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to dispatch birthday greeting'
    }, { status: 500 });
  }
}
