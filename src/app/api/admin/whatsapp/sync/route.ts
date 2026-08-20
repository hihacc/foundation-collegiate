import { NextRequest, NextResponse } from 'next/server';
import { TfcWhatsAppService } from '@/lib/whatsapp/whatsappService';
import { findOrCreateConversation, appendMessage, saveConversation } from '@/lib/whatsapp/persistentStore';
import { normalizePhone } from '@/lib/whatsapp/enterpriseDb';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

function extractMessageBodyAndMedia(em: any) {
  let content = em.messageBody || em.content || '';
  let mediaUrl = em.mediaUrl || em.url || '';
  let mediaType = (em.messageType || 'text').toLowerCase();
  let mediaFilename = em.mediaFilename || em.filename || '';
  let mediaMime = em.mediaMimeType || em.mimeType || '';
  let mediaSize = em.mediaSize || 0;

  const raw = em.metadata?.rawMessage || em.rawMessage;
  if (raw) {
    if (raw.conversation) {
      content = raw.conversation;
      mediaType = 'text';
    } else if (raw.extendedTextMessage?.text) {
      content = raw.extendedTextMessage.text;
      mediaType = 'text';
    } else if (raw.imageMessage) {
      content = raw.imageMessage.caption || (content !== '[IMAGE]' ? content : '');
      mediaType = 'image';
      mediaUrl = raw.imageMessage.url || mediaUrl;
      mediaMime = raw.imageMessage.mimetype || 'image/jpeg';
    } else if (raw.audioMessage) {
      mediaType = 'audio';
      mediaUrl = raw.audioMessage.url || mediaUrl;
      mediaMime = raw.audioMessage.mimetype || 'audio/ogg';
      if (content === '[AUDIO]') content = '';
    } else if (raw.documentMessage) {
      mediaType = 'document';
      mediaUrl = raw.documentMessage.url || mediaUrl;
      mediaFilename = raw.documentMessage.fileName || raw.documentMessage.title || mediaFilename || 'Document.pdf';
      mediaMime = raw.documentMessage.mimetype || 'application/pdf';
      mediaSize = raw.documentMessage.fileLength || mediaSize;
      if (content === '[DOCUMENT]') content = '';
    } else if (raw.videoMessage) {
      mediaType = 'video';
      mediaUrl = raw.videoMessage.url || mediaUrl;
      mediaMime = raw.videoMessage.mimetype || 'video/mp4';
      content = raw.videoMessage.caption || (content !== '[VIDEO]' ? content : '');
    }
  }

  // Clean up legacy fallback string markers
  if (content === '[TEXT]') content = '';
  if (!content && mediaType === 'image') content = '📷 Photo';
  if (!content && mediaType === 'audio') content = '🎙️ Voice Note';
  if (!content && mediaType === 'document') content = `📄 ${mediaFilename || 'Document'}`;
  if (!content && mediaType === 'video') content = '🎥 Video';

  return { content, mediaUrl, mediaType, mediaFilename, mediaMime, mediaSize };
}

// POST /api/admin/whatsapp/sync - Fetch recent messages from microservice and sync with local store
export async function POST(req: NextRequest) {
  try {
    const listRes = await TfcWhatsAppService.listMessages({ limit: 100 });
    
    if (!listRes.success || !listRes.data?.messages) {
      return NextResponse.json({
        success: true,
        syncedCount: 0,
        message: 'No external messages to sync or service unavailable'
      });
    }

    const extMessages = listRes.data.messages;
    let syncedCount = 0;

    for (const em of extMessages) {
      if (!em.recipient && !em.sender) continue;
      const targetPhone = em.recipient || em.sender;
      const norm = normalizePhone(targetPhone);
      if (!norm) continue;

      const pushName = em.metadata?.pushName || em.pushName;

      try {
        const conv = await findOrCreateConversation(norm, pushName || undefined);

        // If conversation has default placeholder name but pushName is now available, update it!
        if (pushName && conv.contact_name && (conv.contact_name.startsWith('WhatsApp Contact') || conv.contact_name === 'Unknown Contact')) {
          conv.contact_name = pushName;
          await saveConversation(conv);
        }

        const extracted = extractMessageBodyAndMedia(em);

        const msgRecord = {
          id: `msg_sync_${em.id || em.providerMessageId || Date.now()}`,
          conversation_id: conv.id,
          direction: (em.direction === 'inbound' || (em.sender && em.sender !== 'TFC_OFFICIAL') ? 'inbound' : 'outbound') as any,
          sender: em.sender || 'TFC_OFFICIAL',
          recipient: norm,
          message_type: extracted.mediaType as any,
          content: extracted.content || '[Message]',
          media_url: extracted.mediaUrl || undefined,
          media_filename: extracted.mediaFilename || undefined,
          media_mime_type: extracted.mediaMime || undefined,
          media_size: extracted.mediaSize || undefined,
          status: (em.status?.toLowerCase() || 'delivered') as any,
          provider_message_id: em.providerMessageId || em.id,
          created_at: em.createdAt || em.sentAt || new Date().toISOString()
        };

        await appendMessage(msgRecord);
        syncedCount++;
      } catch (e: any) {
        console.warn('[SYNC] Error syncing individual message:', e.message);
      }
    }

    return NextResponse.json({
      success: true,
      syncedCount,
      totalAvailable: extMessages.length
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message || 'Sync failed'
    }, { status: 500 });
  }
}
