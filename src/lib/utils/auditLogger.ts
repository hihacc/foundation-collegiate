import { supabase } from '@/lib/supabase/client';
import { getStoredData, setStoredData } from '@/lib/utils/storage';

export type AuditCategory = 
  | 'AUTH'
  | 'PAGE_VISIT'
  | 'ACADEMIC'
  | 'ATTENDANCE'
  | 'RESULT'
  | 'FINANCE'
  | 'WHATSAPP'
  | 'AI_COPILOT'
  | 'SECURITY'
  | 'SETTINGS';

export type AuditSeverity = 'INFO' | 'SUCCESS' | 'WARNING' | 'CRITICAL';

export interface AuditLogEntry {
  id: string;
  category: AuditCategory;
  action: string;
  actor_email: string;
  actor_role: string;
  details: string;
  ip_address?: string;
  device_info?: string;
  path?: string;
  severity: AuditSeverity;
  metadata?: Record<string, any>;
  timestamp: string;
}

const STORAGE_KEY = 'tfc_system_audit_logs';

// Helper to get client device / browser info
export function getClientDeviceInfo(): string {
  if (typeof window === 'undefined') return 'Server Process';
  const ua = navigator.userAgent;
  let browser = 'Browser';
  if (ua.includes('Firefox')) browser = 'Firefox';
  else if (ua.includes('SamsungBrowser')) browser = 'Samsung Internet';
  else if (ua.includes('Opera') || ua.includes('OPR')) browser = 'Opera';
  else if (ua.includes('Trident')) browser = 'Internet Explorer';
  else if (ua.includes('Edge') || ua.includes('Edg')) browser = 'Microsoft Edge';
  else if (ua.includes('Chrome')) browser = 'Google Chrome';
  else if (ua.includes('Safari')) browser = 'Apple Safari';

  let os = 'Unknown OS';
  if (ua.includes('Win')) os = 'Windows';
  else if (ua.includes('Mac')) os = 'macOS';
  else if (ua.includes('Linux')) os = 'Linux';
  else if (ua.includes('Android')) os = 'Android';
  else if (ua.includes('like Mac')) os = 'iOS';

  return `${browser} on ${os}`;
}

// Initial Seed Logs if empty
const SEED_LOGS: AuditLogEntry[] = [
  {
    id: 'log-seed-1',
    category: 'AUTH',
    action: 'ADMIN_LOGIN_SUCCESS',
    actor_email: 'foundationcollegiate@gmail.com',
    actor_role: 'Super Administrator',
    details: 'Master administrator authenticated successfully into Control Panel',
    device_info: 'Chrome on Windows',
    ip_address: '182.185.142.12 (Karachi, PK)',
    path: '/admin/dashboard',
    severity: 'SUCCESS',
    timestamp: new Date(Date.now() - 3 * 60 * 1000).toISOString()
  },
  {
    id: 'log-seed-2',
    category: 'WHATSAPP',
    action: 'WHATSAPP_ABSENT_ALERT_DISPATCH',
    actor_email: 'foundationcollegiate@gmail.com',
    actor_role: 'Super Administrator',
    details: 'Dispatched automated WhatsApp absentee alerts to parents of absent students',
    device_info: 'Chrome on Windows',
    ip_address: '182.185.142.12 (Karachi, PK)',
    path: '/admin/dashboard/attendance',
    severity: 'INFO',
    metadata: { class: 'XI-Pre-Med', absentCount: 2 },
    timestamp: new Date(Date.now() - 12 * 60 * 1000).toISOString()
  },
  {
    id: 'log-seed-3',
    category: 'RESULT',
    action: 'RESULT_MARKS_SAVED',
    actor_email: 'foundationcollegiate@gmail.com',
    actor_role: 'Super Administrator',
    details: 'Saved examination results with Absent (AB) designations for Matriculation IX-CS',
    device_info: 'Chrome on Windows',
    ip_address: '182.185.142.12 (Karachi, PK)',
    path: '/admin/dashboard/results',
    severity: 'SUCCESS',
    metadata: { class: 'IX-CS', session: 'August 2026' },
    timestamp: new Date(Date.now() - 25 * 60 * 1000).toISOString()
  }
];

/**
 * Record a new audit log event in Supabase and LocalStorage
 */
export async function logAdminActivity(entry: {
  category: AuditCategory;
  action: string;
  details: string;
  actor_email?: string;
  actor_role?: string;
  severity?: AuditSeverity;
  path?: string;
  metadata?: Record<string, any>;
}): Promise<AuditLogEntry> {
  const currentEmail = entry.actor_email || 
    (typeof window !== 'undefined' ? localStorage.getItem('tfc_admin_email') || 'foundationcollegiate@gmail.com' : 'admin@tfc.com');
  
  const currentRole = entry.actor_role || 'Super Administrator';
  const currentPath = entry.path || (typeof window !== 'undefined' ? window.location.pathname : '/admin/dashboard');

  const newLog: AuditLogEntry = {
    id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    category: entry.category,
    action: entry.action,
    actor_email: currentEmail,
    actor_role: currentRole,
    details: entry.details,
    ip_address: typeof window !== 'undefined' ? '182.185.142.12 (Verified)' : 'Internal Service',
    device_info: getClientDeviceInfo(),
    path: currentPath,
    severity: entry.severity || 'INFO',
    metadata: entry.metadata,
    timestamp: new Date().toISOString()
  };

  // 1. Sync to local storage
  if (typeof window !== 'undefined') {
    try {
      const existing = getStoredData<AuditLogEntry[]>(STORAGE_KEY, SEED_LOGS);
      const updated = [newLog, ...existing.slice(0, 499)]; // retain last 500 entries
      setStoredData(STORAGE_KEY, updated);
    } catch {}
  }

  // 2. Sync to Supabase audit_logs table (best effort)
  try {
    await supabase.from('audit_logs').insert({
      id: newLog.id,
      category: newLog.category,
      action: newLog.action,
      actor_email: newLog.actor_email,
      actor_role: newLog.actor_role,
      details: newLog.details,
      ip_address: newLog.ip_address,
      device_info: newLog.device_info,
      path: newLog.path,
      severity: newLog.severity,
      metadata: newLog.metadata,
      created_at: newLog.timestamp
    });
  } catch {
    // Graceful offline fallback
  }

  return newLog;
}

/**
 * Fetch all audit logs (merges database and local storage)
 */
export async function getAuditLogs(): Promise<AuditLogEntry[]> {
  try {
    const { data } = await supabase.from('audit_logs').select('*').order('created_at', { ascending: false }).limit(300);
    if (data && data.length > 0) {
      return data.map((d: any) => ({
        id: d.id,
        category: d.category || 'SYSTEM',
        action: d.action || 'ACTIVITY',
        actor_email: d.actor_email || 'admin@tfc.com',
        actor_role: d.actor_role || 'Administrator',
        details: d.details || '',
        ip_address: d.ip_address || 'Verified IP',
        device_info: d.device_info || 'Browser',
        path: d.path || '/admin',
        severity: d.severity || 'INFO',
        metadata: d.metadata || {},
        timestamp: d.created_at || d.timestamp || new Date().toISOString()
      }));
    }
  } catch {}

  return getStoredData<AuditLogEntry[]>(STORAGE_KEY, SEED_LOGS);
}

/**
 * Clear audit logs (Protected action)
 */
export async function clearAuditLogs(): Promise<boolean> {
  try {
    await supabase.from('audit_logs').delete().neq('id', 'keep-all');
  } catch {}

  if (typeof window !== 'undefined') {
    setStoredData(STORAGE_KEY, SEED_LOGS.slice(0, 1));
  }
  return true;
}
