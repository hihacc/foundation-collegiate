import { NextRequest, NextResponse } from 'next/server';
import { 
  getMessagesByConversationId, 
  appendMessage, 
  getAllConversations, 
  saveConversation 
} from '@/lib/whatsapp/persistentStore';
import { TfcWhatsAppService } from '@/lib/whatsapp/whatsappService';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// GET /api/admin/whatsapp/messages?conversationId=...
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const conversationId = searchParams.get('conversationId');

    if (!conversationId) {
      return NextResponse.json({ success: false, error: 'conversationId parameter is required' }, { status: 400 });
    }

    const messages = await getMessagesByConversationId(conversationId);

    // Reset unread count for this conversation
    const convs = await getAllConversations();
    const conv = convs.find(c => c.id === conversationId);
    if (conv && conv.unread_count > 0) {
      conv.unread_count = 0;
      await saveConversation(conv);
    }

    return NextResponse.json({
      success: true,
      data: messages,
      total: messages.length
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to fetch messages'
    }, { status: 500 });
  }
}

// POST /api/admin/whatsapp/messages - Send a message or record internal note
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      conversationId,
      content,
      isInternalNote,
      mediaUrl,
      mediaFilename,
      mediaMimeType,
      mediaSize
    } = body;

    if (!conversationId) {
      return NextResponse.json({ success: false, error: 'conversationId is required' }, { status: 400 });
    }

    const convs = await getAllConversations();
    const conv = convs.find(c => c.id === conversationId);
    if (!conv) {
      return NextResponse.json({ success: false, error: 'Conversation not found' }, { status: 404 });
    }

    if (!content && !mediaUrl) {
      return NextResponse.json({ success: false, error: 'Message content or attachment is required' }, { status: 400 });
    }

    let msgType: any = 'text';
    if (mediaUrl) {
      if (mediaMimeType?.startsWith('image/')) msgType = 'image';
      else if (mediaMimeType?.startsWith('audio/')) msgType = 'audio';
      else if (mediaMimeType?.startsWith('video/')) msgType = 'video';
      else msgType = 'document';
    }

    const newMsg = {
      id: `msg_out_${Date.now()}`,
      conversation_id: conv.id,
      direction: 'outbound' as const,
      sender: 'TFC_OFFICIAL',
      recipient: conv.normalized_phone,
      message_type: msgType,
      content: content || `[${msgType.toUpperCase()}]`,
      status: isInternalNote ? ('delivered' as const) : ('sending' as const),
      media_url: mediaUrl,
      media_filename: mediaFilename,
      media_mime_type: mediaMimeType,
      media_size: mediaSize,
      is_internal_note: !!isInternalNote,
      created_at: new Date().toISOString()
    };

    await appendMessage(newMsg);

    // If not internal note, dispatch to WhatsApp provider service
    if (!isInternalNote) {
      try {
        const sendRes = await TfcWhatsAppService.sendMessage({
          accountId: 'tfc-default-sender',
          recipient: conv.normalized_phone,
          messageBody: newMsg.content,
          messageType: msgType === 'text' ? 'TEXT' : 'DOCUMENT',
          metadata: {
            attachmentUrl: mediaUrl,
            attachmentName: mediaFilename
          }
        });
        if (sendRes.success) {
          newMsg.status = 'delivered';
        }
      } catch (e: any) {
        console.warn('[MESSAGE_SEND] WhatsApp dispatch notice:', e.message);
      }
    }

    return NextResponse.json({
      success: true,
      data: newMsg
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to send message'
    }, { status: 500 });
  }
}
