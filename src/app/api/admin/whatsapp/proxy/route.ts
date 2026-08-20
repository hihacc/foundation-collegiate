import { NextRequest, NextResponse } from 'next/server';
import { TfcWhatsAppService } from '@/lib/whatsapp/whatsappService';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// GET /api/admin/whatsapp/proxy?url=... - Proxy media to prevent CORS or certificate issues
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const mediaUrl = searchParams.get('url');

    if (!mediaUrl) {
      return NextResponse.json({ success: false, error: 'url query parameter is required' }, { status: 400 });
    }

    // If local URL, redirect
    if (mediaUrl.startsWith('/')) {
      return NextResponse.redirect(new URL(mediaUrl, req.url));
    }

    const response = await fetch(mediaUrl, {
      headers: {
        'User-Agent': 'TFC-WhatsApp-Proxy/1.0'
      }
    });

    if (!response.ok) {
      return NextResponse.json({ success: false, error: `Upstream media failed with status ${response.status}` }, { status: response.status });
    }

    const contentType = response.headers.get('content-type') || 'application/octet-stream';
    const buffer = await response.arrayBuffer();

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=86400, stale-while-revalidate=604800',
        'Access-Control-Allow-Origin': '*'
      }
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || 'Media proxy error' }, { status: 500 });
  }
}

// POST /api/admin/whatsapp/proxy - Proxy actions to WhatsApp Service
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, payload } = body;

    switch (action) {
      case 'CHECK_STATUS': {
        const res = await TfcWhatsAppService.getStatus();
        return NextResponse.json(res);
      }

      case 'CHECK_HEALTH': {
        const res = await TfcWhatsAppService.checkHealth();
        return NextResponse.json(res);
      }

      case 'LIST_ACCOUNTS': {
        const res = await TfcWhatsAppService.listAccounts();
        return NextResponse.json(res);
      }

      case 'CREATE_ACCOUNT': {
        const res = await TfcWhatsAppService.createAccount(payload.name, payload.phoneNumber);
        return NextResponse.json(res);
      }

      case 'CONNECT_ACCOUNT': {
        const res = await TfcWhatsAppService.connectAccount(payload.accountId);
        return NextResponse.json(res);
      }

      case 'GET_QR': {
        const res = await TfcWhatsAppService.getQrCode(payload.accountId);
        return NextResponse.json(res);
      }

      case 'REQUEST_PAIRING_CODE': {
        const res = await TfcWhatsAppService.requestPairingCode(payload.accountId, payload.phoneNumber);
        return NextResponse.json(res);
      }

      case 'CHECK_CONNECTION': {
        const res = await TfcWhatsAppService.checkConnection(payload.accountId);
        return NextResponse.json(res);
      }

      case 'RECONNECT_ACCOUNT': {
        const res = await TfcWhatsAppService.reconnectAccount(payload.accountId);
        return NextResponse.json(res);
      }

      case 'DISCONNECT_ACCOUNT': {
        const res = await TfcWhatsAppService.disconnectAccount(payload.accountId);
        return NextResponse.json(res);
      }

      case 'SEND_MESSAGE': {
        const res = await TfcWhatsAppService.sendMessage(payload);
        return NextResponse.json(res);
      }

      case 'SEND_BULK': {
        const res = await TfcWhatsAppService.sendBulkMessages(payload);
        return NextResponse.json(res);
      }

      case 'LIST_MESSAGES': {
        const res = await TfcWhatsAppService.listMessages(payload);
        return NextResponse.json(res);
      }

      case 'TRIGGER_AUTOMATION': {
        const res = await TfcWhatsAppService.triggerAutomation(payload);
        return NextResponse.json(res);
      }

      case 'SCHEDULE_MESSAGE': {
        const res = await TfcWhatsAppService.scheduleMessage(payload);
        return NextResponse.json(res);
      }

      case 'RETRY_MESSAGE': {
        const res = await TfcWhatsAppService.retryMessage(payload.messageId);
        return NextResponse.json(res);
      }

      default:
        return NextResponse.json({ 
          success: false, 
          error: { code: 'UNKNOWN_ACTION', message: `Unknown WhatsApp action: ${action}` } 
        }, { status: 400 });
    }
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: { code: 'PROXY_INTERNAL_ERROR', message: error.message || 'Internal proxy error' }
    }, { status: 500 });
  }
}
