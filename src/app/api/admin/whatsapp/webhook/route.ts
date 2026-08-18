import { NextRequest, NextResponse } from 'next/server';
import { processInboundWhatsAppMessage, normalizePhone } from '@/lib/whatsapp/enterpriseDb';
import { findOrCreateConversation, appendMessage } from '@/lib/whatsapp/persistentStore';
import { supabase } from '@/lib/supabase/client';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * TFC WhatsApp Inbound Webhook
 * Receives incoming messages, delivery reports, and status events from the Baileys WhatsApp microservice.
 */

export async function GET(req: NextRequest) {
  // Health & Verification endpoint
  return NextResponse.json({
    status: 'online',
    service: 'TFC WhatsApp Enterprise Inbound Webhook',
    timestamp: new Date().toISOString(),
    supportedEvents: ['MESSAGE_RECEIVED', 'MESSAGES_UPSERT', 'MESSAGE_STATUS', 'CONNECTION_UPDATE']
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const eventType = body.event || body.type || body.action || 'MESSAGE_RECEIVED';
    const payload = body.data || body.payload || body;

    // 1. Inbound Message Event
    if (
      eventType === 'MESSAGE_RECEIVED' ||
      eventType === 'MESSAGES_UPSERT' ||
      eventType === 'messages.upsert' ||
      payload.message ||
      payload.text ||
      payload.body
    ) {
      const senderPhone = payload.from || payload.sender || payload.remoteJid || payload.phone;
      if (!senderPhone) {
        return NextResponse.json({ success: false, error: 'Missing sender phone number' }, { status: 400 });
      }

      // Ignore status broadcasts or group messages unless specifically configured
      if (typeof senderPhone === 'string' && (senderPhone.includes('status@broadcast') || senderPhone.includes('@g.us'))) {
        return NextResponse.json({ success: true, ignored: true, reason: 'Status broadcast or group message' });
      }

      const rawText = payload.text || payload.body || payload.message?.conversation || payload.message?.extendedTextMessage?.text || '';
      
      // Detect Media Type
      let messageType: any = 'text';
      let mediaUrl = payload.mediaUrl || payload.fileUrl;
      let mediaMimeType = payload.mimeType || payload.mimetype;
      let mediaFilename = payload.fileName || payload.filename;
      let mediaSize = payload.fileSize || payload.filesize;

      if (payload.message?.imageMessage || mediaMimeType?.startsWith('image/')) {
        messageType = 'image';
        mediaFilename = mediaFilename || `image_${Date.now()}.jpg`;
      } else if (payload.message?.documentMessage || mediaMimeType === 'application/pdf' || mediaMimeType?.includes('document')) {
        messageType = 'document';
        mediaFilename = mediaFilename || `document_${Date.now()}.pdf`;
      } else if (payload.message?.audioMessage || mediaMimeType?.startsWith('audio/')) {
        messageType = 'audio';
        mediaFilename = mediaFilename || `audio_${Date.now()}.mp3`;
      } else if (payload.message?.videoMessage || mediaMimeType?.startsWith('video/')) {
        messageType = 'video';
        mediaFilename = mediaFilename || `video_${Date.now()}.mp4`;
      }

      const providerId = payload.id || payload.messageId || payload.key?.id || `prov_${Date.now()}`;
      const normDigits = normalizePhone(String(senderPhone));

      console.log(`[WHATSAPP][INBOUND] provider_message_id=${providerId} phone=${normDigits} type=${messageType}`);

      // 1. Process with Enterprise DB
      const result = await processInboundWhatsAppMessage({
        senderPhone: String(senderPhone),
        senderName: payload.pushName || payload.senderName || payload.name,
        messageText: rawText || `[${messageType.toUpperCase()}]`,
        messageType,
        providerMessageId: providerId,
        mediaUrl,
        mediaMimeType,
        mediaFilename,
        mediaSize,
        timestamp: payload.timestamp ? new Date(payload.timestamp * 1000).toISOString() : new Date().toISOString()
      });

      console.log(`[WHATSAPP][MATCH] phone=${normDigits} match=${(result as any).match?.role || 'Unknown'}`);

      // 2. Persist to Persistent Store
      try {
        const conv = await findOrCreateConversation(normDigits, payload.pushName || payload.senderName);
        const msgRecord = {
          id: `msg_in_${Date.now()}`,
          conversation_id: conv.id,
          direction: 'inbound' as const,
          sender: normDigits,
          recipient: 'TFC_OFFICIAL',
          message_type: messageType,
          content: rawText || `[${messageType.toUpperCase()}]`,
          status: 'read' as const,
          provider_message_id: providerId,
          media_url: mediaUrl,
          media_filename: mediaFilename,
          media_mime_type: mediaMimeType,
          media_size: mediaSize,
          created_at: new Date().toISOString()
        };
        appendMessage(msgRecord);
        console.log(`[WHATSAPP][DB] conversation_id=${conv.id} message_id=${msgRecord.id}`);
      } catch (e: any) {
        console.error('[WHATSAPP_WEBHOOK] Persistent store error:', e.message);
      }

      return NextResponse.json({
        event: 'MESSAGE_PROCESSED',
        ...result
      });
    }

    // 2. Message Status Event (Sent / Delivered / Read / Failed)
    if (eventType === 'MESSAGE_STATUS' || eventType === 'messages.update' || payload.status) {
      const providerId = payload.id || payload.messageId || payload.key?.id;
      const newStatus = (payload.status || 'delivered').toLowerCase();

      if (providerId) {
        try {
          await supabase
            .from('whatsapp_messages')
            .update({ status: newStatus })
            .eq('provider_message_id', providerId);
        } catch {}
      }

      return NextResponse.json({ success: true, event: 'STATUS_UPDATED', providerId, newStatus });
    }

    // 3. Connection Update Event
    if (eventType === 'CONNECTION_UPDATE' || eventType === 'connection.update') {
      const accountStatus = payload.connection || payload.status;
      return NextResponse.json({ success: true, event: 'CONNECTION_ACKNOWLEDGED', accountStatus });
    }

    return NextResponse.json({ success: true, event: 'UNKNOWN_EVENT_IGNORED' });

  } catch (error: any) {
    console.error('WhatsApp Inbound Webhook Error:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Webhook processing failed'
    }, { status: 500 });
  }
}
