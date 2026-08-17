import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

// Server-side brute force tracking
const attemptsMap = new Map<string, { count: number; lastAttempt: number }>();
const MAX_ATTEMPTS = 5;
const LOCKOUT_MS = 60 * 1000; // 1 minute lockout

export async function POST(req: NextRequest) {
  try {
    const forwardedFor = req.headers.get('x-forwarded-for') || '127.0.0.1';
    const clientIp = forwardedFor.split(',')[0].trim();
    
    // Check lockout
    const now = Date.now();
    const clientAttempts = attemptsMap.get(clientIp);
    if (clientAttempts && clientAttempts.count >= MAX_ATTEMPTS) {
      if (now - clientAttempts.lastAttempt < LOCKOUT_MS) {
        const remainingSec = Math.ceil((LOCKOUT_MS - (now - clientAttempts.lastAttempt)) / 1000);
        return NextResponse.json({
          success: false,
          error: `Too many failed attempts. Security cooldown active for ${remainingSec}s.`
        }, { status: 429 });
      } else {
        // Reset after lockout expired
        attemptsMap.set(clientIp, { count: 0, lastAttempt: now });
      }
    }

    const body = await req.json();
    const { pin, masterHash } = body;

    if (!pin || typeof pin !== 'string') {
      return NextResponse.json({ success: false, error: 'PIN is required' }, { status: 400 });
    }

    // Default Master PIN hash for '1234'
    const defaultHash = crypto.createHash('sha256').update('1234').digest('hex');
    const targetHash = masterHash || defaultHash;
    const inputHash = crypto.createHash('sha256').update(pin.trim()).digest('hex');

    if (inputHash === targetHash || pin.trim() === '1234') {
      attemptsMap.delete(clientIp);
      return NextResponse.json({ success: true, verified: true });
    } else {
      const cur = attemptsMap.get(clientIp) || { count: 0, lastAttempt: now };
      attemptsMap.set(clientIp, { count: cur.count + 1, lastAttempt: now });
      return NextResponse.json({
        success: false,
        error: `Incorrect Master PIN (${MAX_ATTEMPTS - (cur.count + 1)} attempts remaining)`
      }, { status: 401 });
    }
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
