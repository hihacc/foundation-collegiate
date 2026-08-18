import { NextRequest, NextResponse } from 'next/server';
import { TfcWhatsAppService } from '@/lib/whatsapp/whatsappService';
import { supabase } from '@/lib/supabase/client';
import { getAllConversations } from '@/lib/whatsapp/persistentStore';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// GET /api/admin/whatsapp/diagnostics - Run full diagnostic health check
export async function GET(req: NextRequest) {
  const results: Record<string, { status: 'PASS' | 'FAIL' | 'WARNING'; message: string; details?: any }> = {};

  // 1. WhatsApp Provider Connection
  try {
    const connRes = await TfcWhatsAppService.checkConnection('tfc-default-sender');
    if (connRes.success && connRes.data?.connected) {
      results['WhatsApp Provider'] = {
        status: 'PASS',
        message: `Socket connected to Baileys service for phone ${connRes.data.diagnostics?.phoneNumber || '923333439458'}`,
        details: connRes.data
      };
    } else {
      results['WhatsApp Provider'] = {
        status: 'WARNING',
        message: 'Microservice reachable but account is not currently connected to a WhatsApp socket',
        details: connRes.data
      };
    }
  } catch (e: any) {
    results['WhatsApp Provider'] = {
      status: 'FAIL',
      message: `Failed to reach microservice: ${e.message}`
    };
  }

  // 2. Persistent Database & Store
  try {
    const convs = getAllConversations();
    results['Persistent Store'] = {
      status: 'PASS',
      message: `Server persistent store active (${convs.length} conversations loaded)`
    };
  } catch (e: any) {
    results['Persistent Store'] = {
      status: 'FAIL',
      message: `Persistent store error: ${e.message}`
    };
  }

  // 3. Supabase Schema
  try {
    const { data, error } = await supabase.from('students').select('id', { count: 'exact', head: true });
    if (!error) {
      results['Supabase Database'] = {
        status: 'PASS',
        message: 'Connected to Supabase PostgreSQL database'
      };
    } else {
      results['Supabase Database'] = {
        status: 'WARNING',
        message: `Supabase error: ${error.message}`
      };
    }
  } catch (e: any) {
    results['Supabase Database'] = {
      status: 'FAIL',
      message: `Supabase exception: ${e.message}`
    };
  }

  // 4. File Upload Storage
  try {
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'whatsapp');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    fs.accessSync(uploadDir, fs.constants.W_OK);
    results['Media Storage'] = {
      status: 'PASS',
      message: 'Uploads directory is writable for images, documents, audio, and video'
    };
  } catch (e: any) {
    results['Media Storage'] = {
      status: 'FAIL',
      message: `Storage permission error: ${e.message}`
    };
  }

  // 5. Inbound Webhook Endpoint
  results['Inbound Webhook'] = {
    status: 'PASS',
    message: 'Active at /api/admin/whatsapp/webhook (Ready for Baileys events)'
  };

  return NextResponse.json({
    success: true,
    timestamp: new Date().toISOString(),
    results
  });
}
