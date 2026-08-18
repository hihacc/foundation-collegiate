import { NextRequest, NextResponse } from 'next/server';
import { 
  getAllConversations, 
  findOrCreateConversation, 
  saveConversation, 
  appendMessage 
} from '@/lib/whatsapp/persistentStore';
import { normalizePhone, formatDisplayPhone } from '@/lib/whatsapp/enterpriseDb';
import { TfcWhatsAppService } from '@/lib/whatsapp/whatsappService';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// GET /api/admin/whatsapp/conversations - List all conversations
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = (searchParams.get('search') || '').toLowerCase().trim();
    const filter = (searchParams.get('filter') || 'all').toLowerCase();

    let convs = await getAllConversations();

    // Filter by Tab
    if (filter === 'unread') {
      convs = convs.filter(c => (c.unread_count || 0) > 0);
    } else if (filter === 'students') {
      convs = convs.filter(c => c.relationship === 'Student' || c.tags?.includes('Student'));
    } else if (filter === 'parents') {
      convs = convs.filter(c => c.relationship === 'Father' || c.relationship === 'Mother' || c.relationship === 'Guardian');
    } else if (filter === 'inquiries') {
      convs = convs.filter(c => c.relationship === 'Inquiry' || c.tags?.includes('Inquiry'));
    } else if (filter === 'faculty') {
      convs = convs.filter(c => c.relationship === 'Faculty');
    } else if (filter === 'archived') {
      convs = convs.filter(c => c.status === 'archived');
    } else if (filter !== 'all') {
      convs = convs.filter(c => c.status !== 'archived');
    }

    // Search query
    if (search) {
      convs = convs.filter(c => 
        c.contact_name.toLowerCase().includes(search) ||
        (c.student_name && c.student_name.toLowerCase().includes(search)) ||
        (c.student_roll && c.student_roll.toLowerCase().includes(search)) ||
        c.phone.includes(search) ||
        c.normalized_phone.includes(search) ||
        (c.last_message_text && c.last_message_text.toLowerCase().includes(search))
      );
    }

    return NextResponse.json({
      success: true,
      data: convs,
      total: convs.length
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to fetch conversations'
    }, { status: 500 });
  }
}

// POST /api/admin/whatsapp/conversations - Create or find conversation and send optional initial message
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { 
      phone, 
      name, 
      initialMessage, 
      attachmentUrl, 
      attachmentName, 
      attachmentType, 
      isInternalNote 
    } = body;

    if (!phone) {
      return NextResponse.json({ success: false, error: 'Phone number is required' }, { status: 400 });
    }

    const normPhone = normalizePhone(phone);
    if (!normPhone) {
      return NextResponse.json({ success: false, error: 'Invalid 11-digit Pakistan phone number format' }, { status: 400 });
    }

    // 1. Find or create conversation in persistent store
    const conv = await findOrCreateConversation(normPhone, name);

    // 2. If initial message or attachment provided, send and append
    if (initialMessage || attachmentUrl) {
      let msgType: any = 'text';
      if (attachmentUrl) {
        if (attachmentType?.startsWith('image/')) msgType = 'image';
        else if (attachmentType?.startsWith('audio/')) msgType = 'audio';
        else if (attachmentType?.startsWith('video/')) msgType = 'video';
        else msgType = 'document';
      }

      const newMsg = {
        id: `msg_out_${Date.now()}`,
        conversation_id: conv.id,
        direction: 'outbound' as const,
        sender: 'TFC_OFFICIAL',
        recipient: normPhone,
        message_type: msgType,
        content: initialMessage || `[${msgType.toUpperCase()}]`,
        status: isInternalNote ? ('delivered' as const) : ('sending' as const),
        media_url: attachmentUrl,
        media_filename: attachmentName,
        media_mime_type: attachmentType,
        is_internal_note: !!isInternalNote,
        created_at: new Date().toISOString()
      };

      appendMessage(newMsg);

      // Dispatch to WhatsApp service if not internal note
      if (!isInternalNote) {
        try {
          await TfcWhatsAppService.sendMessage({
            accountId: 'tfc-default-sender',
            recipient: normPhone,
            messageBody: newMsg.content,
            messageType: msgType === 'text' ? 'TEXT' : 'DOCUMENT',
            metadata: {
              attachmentUrl,
              attachmentName
            }
          });
          newMsg.status = 'delivered';
        } catch (e: any) {
          console.warn('[CONVERSATION_CREATE] WhatsApp dispatch notice:', e.message);
        }
      }
    }

    return NextResponse.json({
      success: true,
      data: conv
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to create conversation'
    }, { status: 500 });
  }
}
