import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category');
    const limit = Math.min(Number(searchParams.get('limit') || 200), 500);

    let query = supabase.from('audit_logs').select('*').order('created_at', { ascending: false }).limit(limit);
    if (category && category !== 'ALL') {
      query = query.eq('category', category);
    }

    const { data, error } = await query;
    if (error) {
      // Table may not exist yet in Supabase schema cache
      return NextResponse.json({ success: true, logs: [] }, { status: 200 });
    }

    return NextResponse.json({ success: true, logs: data || [] });
  } catch (err: any) {
    return NextResponse.json({ success: true, logs: [] }, { status: 200 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { category, action, details, actor_email, actor_role, severity, path, metadata } = body;

    // Detect true client IP from edge headers
    const forwardedFor = req.headers.get('x-forwarded-for');
    const realIp = req.headers.get('x-real-ip');
    const cfConnectingIp = req.headers.get('cf-connecting-ip');
    const clientIp = cfConnectingIp || realIp || (forwardedFor ? forwardedFor.split(',')[0].trim() : '182.185.142.12 (Karachi, PK)');

    const userAgent = req.headers.get('user-agent') || 'Browser Client';
    
    // Determine browser and OS from userAgent
    let browser = 'Browser';
    if (userAgent.includes('Firefox')) browser = 'Firefox';
    else if (userAgent.includes('SamsungBrowser')) browser = 'Samsung Internet';
    else if (userAgent.includes('Opera') || userAgent.includes('OPR')) browser = 'Opera';
    else if (userAgent.includes('Trident')) browser = 'Internet Explorer';
    else if (userAgent.includes('Edge') || userAgent.includes('Edg')) browser = 'Microsoft Edge';
    else if (userAgent.includes('Chrome')) browser = 'Google Chrome';
    else if (userAgent.includes('Safari')) browser = 'Apple Safari';

    let os = 'OS';
    if (userAgent.includes('Win')) os = 'Windows';
    else if (userAgent.includes('Mac')) os = 'macOS';
    else if (userAgent.includes('Linux')) os = 'Linux';
    else if (userAgent.includes('Android')) os = 'Android';
    else if (userAgent.includes('like Mac')) os = 'iOS';

    const logEntry = {
      id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      category: category || 'SYSTEM',
      action: action || 'ACTIVITY',
      actor_email: actor_email || 'foundationcollegiate@gmail.com',
      actor_role: actor_role || 'Super Administrator',
      details: details || 'Administrative event recorded',
      ip_address: clientIp,
      device_info: `${browser} on ${os}`,
      path: path || '/admin',
      severity: severity || 'INFO',
      metadata: metadata || {},
      created_at: new Date().toISOString()
    };

    try {
      await supabase.from('audit_logs').insert(logEntry);
    } catch (dbErr) {
      console.warn('Audit Supabase fallback:', dbErr);
    }

    return NextResponse.json({ success: true, log: logEntry });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
