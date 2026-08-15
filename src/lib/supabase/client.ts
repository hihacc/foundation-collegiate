import { createBrowserClient } from '@supabase/ssr';

// Lazy singleton – never instantiated at module-load / build time
let _client: ReturnType<typeof createBrowserClient> | null = null;

const resilientFetch: typeof fetch = async (input, init) => {
  let attempts = 0;
  const maxAttempts = 3;
  while (attempts < maxAttempts) {
    try {
      attempts++;
      return await fetch(input, init);
    } catch (err: any) {
      if (attempts >= maxAttempts) {
        // Fallback gracefully without breaking React lifecycle
        throw err;
      }
      // Small backoff before retry
      await new Promise(resolve => setTimeout(resolve, 350 * attempts));
    }
  }
  return fetch(input, init);
};

export function createClient() {
  if (_client) return _client;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) {
    throw new Error(
      '@supabase/ssr: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY / NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY are required at runtime.'
    );
  }
  _client = createBrowserClient(url, key, {
    global: {
      fetch: resilientFetch
    }
  });
  return _client;
}

// Named export used throughout the codebase — lazy, never called at build time
export const supabase = new Proxy({} as ReturnType<typeof createBrowserClient>, {
  get(_target, prop) {
    return (createClient() as any)[prop];
  },
});
