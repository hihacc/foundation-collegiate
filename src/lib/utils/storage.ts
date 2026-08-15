// Helper to persist admin changes to localStorage so reloads keep all additions/edits intact!

export function getStoredData<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const item = window.localStorage.getItem(`tfc_admin_${key}`);
    if (item !== null && item !== undefined && item !== '') {
      const parsed = JSON.parse(item);
      if (parsed !== null && parsed !== undefined) {
        return parsed as T;
      }
    }
    return fallback;
  } catch {
    return fallback;
  }
}

export function setStoredData<T>(key: string, data: T): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(`tfc_admin_${key}`, JSON.stringify(data));
  } catch (err) {
    console.warn('LocalStorage save error:', err);
  }
}
