import { NextRequest, NextResponse } from 'next/server';
import { TfcWhatsAppService } from '@/lib/whatsapp/whatsappService';
import { findOrCreateConversation, appendMessage } from '@/lib/whatsapp/persistentStore';
import { normalizePhone } from '@/lib/whatsapp/enterpriseDb';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// POST /api/admin/whatsapp/sync - Fetch recent messages from microservice and sync with local store
export async function POST(req: NextRequest) {
  try {
    const listRes = await TfcWhatsAppService.listMessages({ limit: 50 });
    
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

      try {
        const conv = await findOrCreateConversation(norm);
        const msgRecord = {
          id: `msg_sync_${em.id || em.providerMessageId || Date.now()}`,
          conversation_id: conv.id,
          direction: (em.direction === 'inbound' || em.sender ? 'inbound' : 'outbound') as any,
          sender: em.sender || 'TFC_OFFICIAL',
          recipient: norm,
          message_type: (em.messageType?.toLowerCase() || 'text') as any,
          content: em.messageBody || em.content || '[Message]',
          status: (em.status?.toLowerCase() || 'delivered') as any,
          provider_message_id: em.providerMessageId || em.id,
          created_at: em.createdAt || em.sentAt || new Date().toISOString()
        };

        appendMessage(msgRecord);
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
