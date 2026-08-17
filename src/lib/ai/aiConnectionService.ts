import { supabase } from '@/lib/supabase/client';
import { encryptApiKey, decryptApiKey, maskApiKey } from '@/lib/utils/encryption';
import { AiConnectionConfig } from './modelRegistry';
import fs from 'fs';
import path from 'path';

const LOCAL_AI_CONFIG_FILE = path.join(process.cwd(), '.system_ai_connections.json');

// Default initial config
const DEFAULT_CONNECTIONS: AiConnectionConfig[] = [
  {
    id: 'default-local-engine',
    name: 'Unlimited Local Engine (100% Free)',
    provider: 'local',
    encrypted_key: '',
    masked_key: 'No API Key Required',
    model_id: 'local-wasm-tesseract',
    is_active: true,
    is_default: true,
    status: 'working',
    latency_ms: 250,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
];

export async function getAllAiConnections(): Promise<AiConnectionConfig[]> {
  // 1. Try Supabase settings table
  try {
    const { data, error } = await supabase
      .from('settings')
      .select('*')
      .eq('key', 'ai_connections')
      .maybeSingle();

    if (!error && data && data.value) {
      const parsed = JSON.parse(data.value);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (supabaseErr) {
    console.warn('Supabase fetch notice for ai_connections:', supabaseErr);
  }

  // 2. Fallback to local encrypted config file
  try {
    if (fs.existsSync(LOCAL_AI_CONFIG_FILE)) {
      const raw = fs.readFileSync(LOCAL_AI_CONFIG_FILE, 'utf8');
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch {}

  return DEFAULT_CONNECTIONS;
}

export async function saveAiConnections(connections: AiConnectionConfig[]): Promise<boolean> {
  const jsonString = JSON.stringify(connections, null, 2);

  // 1. Save to Supabase settings table
  try {
    const { error } = await supabase
      .from('settings')
      .upsert(
        {
          key: 'ai_connections',
          value: jsonString,
          updated_at: new Date().toISOString()
        },
        { onConflict: 'key' }
      );

    if (error) {
      console.warn('Supabase save error for ai_connections:', error.message);
    }
  } catch (err: any) {
    console.warn('Supabase upsert exception for ai_connections:', err.message);
  }

  // 2. Save to local fallback file
  try {
    fs.writeFileSync(LOCAL_AI_CONFIG_FILE, jsonString, 'utf8');
  } catch {}

  return true;
}

export async function getActiveAiConnection(): Promise<{ connection: AiConnectionConfig; decryptedKey: string }> {
  const connections = await getAllAiConnections();
  let active = connections.find(c => c.is_default && c.is_active);
  if (!active) active = connections.find(c => c.is_active);
  if (!active) active = connections[0] || DEFAULT_CONNECTIONS[0];

  const decryptedKey = decryptApiKey(active.encrypted_key);
  return { connection: active, decryptedKey };
}

export async function addOrUpdateAiConnection(payload: {
  id?: string;
  name: string;
  provider: 'openrouter' | 'huggingface' | 'google' | 'groq' | 'local';
  plain_api_key?: string;
  model_id: string;
  is_default?: boolean;
}): Promise<AiConnectionConfig> {
  const existing = await getAllAiConnections();
  const id = payload.id || crypto.randomUUID();

  let encrypted = '';
  let masked = '';

  const oldConn = existing.find(c => c.id === id);

  if (payload.plain_api_key && payload.plain_api_key.trim()) {
    encrypted = encryptApiKey(payload.plain_api_key.trim());
    masked = maskApiKey(payload.plain_api_key.trim());
  } else if (oldConn) {
    encrypted = oldConn.encrypted_key;
    masked = oldConn.masked_key;
  }

  if (payload.is_default) {
    existing.forEach(c => (c.is_default = false));
  }

  const updatedConn: AiConnectionConfig = {
    id,
    name: payload.name.trim(),
    provider: payload.provider,
    encrypted_key: encrypted,
    masked_key: masked,
    model_id: payload.model_id,
    is_active: true,
    is_default: payload.is_default !== undefined ? payload.is_default : (existing.length === 0 || !existing.some(c => c.is_default)),
    status: 'not_tested',
    created_at: oldConn?.created_at || new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  const filtered = existing.filter(c => c.id !== id);
  const resultList = [updatedConn, ...filtered];

  await saveAiConnections(resultList);
  return updatedConn;
}
