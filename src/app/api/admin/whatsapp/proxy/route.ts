import { NextRequest, NextResponse } from 'next/server';
import { TfcWhatsAppService } from '@/lib/whatsapp/whatsappService';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

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
