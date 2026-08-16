import crypto from 'crypto';

// Secret server-side salt/key derived from Supabase Anon Key or fallback secret
const ENCRYPTION_SECRET = process.env.ENCRYPTION_SECRET || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'tfc-foundation-secure-ai-key-salt-2026';
const ALGORITHM = 'aes-256-cbc';
const KEY = crypto.createHash('sha256').update(ENCRYPTION_SECRET).digest();

export function encryptApiKey(plainKey: string): string {
  if (!plainKey) return '';
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, KEY, iv);
  let encrypted = cipher.update(plainKey.trim(), 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return `${iv.toString('hex')}:${encrypted}`;
}

export function decryptApiKey(encryptedData: string): string {
  if (!encryptedData) return '';
  try {
    const [ivHex, encryptedText] = encryptedData.split(':');
    if (!ivHex || !encryptedText) return '';
    const iv = Buffer.from(ivHex, 'hex');
    const decipher = crypto.createDecipheriv(ALGORITHM, KEY, iv);
    let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted.trim();
  } catch (err) {
    console.error('Decryption error:', err);
    return '';
  }
}

export function maskApiKey(plainOrMasked: string): string {
  if (!plainOrMasked) return '••••••••••••';
  const clean = plainOrMasked.trim();
  if (clean.length <= 8) return '••••••••••••';
  const start = clean.slice(0, 4);
  const end = clean.slice(-4);
  return `${start}••••••••••••${end}`;
}
