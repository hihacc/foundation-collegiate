'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { Save, Settings } from 'lucide-react';
import Button from '@/components/ui/Button';

const settingFields = [
  { key: 'site_name', label: 'Site Name', type: 'text' },
  { key: 'site_tagline', label: 'Tagline', type: 'text' },
  { key: 'contact_phone', label: 'Phone Number', type: 'text' },
  { key: 'contact_email', label: 'Email Address', type: 'email' },
  { key: 'contact_address', label: 'Full Address', type: 'textarea' },
  { key: 'whatsapp_number', label: 'WhatsApp Number', type: 'text' },
  { key: 'facebook_url', label: 'Facebook URL', type: 'url' },
  { key: 'instagram_url', label: 'Instagram URL', type: 'url' },
  { key: 'admissions_open', label: 'Admissions Open?', type: 'boolean' },
  { key: 'admissions_year', label: 'Admissions Year', type: 'text' },
];

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    supabase.from('settings').select('*').then(({ data }) => {
      const map: Record<string, string> = {};
      data?.forEach(s => { map[s.key] = s.value; });
      setSettings(map);
      setLoading(false);
    });
  }, []);

  const handleSave = async () => {
    setSaving(true);
    const updates = Object.entries(settings).map(([key, value]) =>
      supabase.from('settings').upsert({ key, value }).eq('key', key)
    );
    await Promise.all(updates);
    toast.success('Settings saved!');
    setSaving(false);
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-white">Settings</h1>
          <p className="text-slate-400 text-sm mt-1">Configure your website settings</p>
        </div>
        <Button onClick={handleSave} isLoading={saving}>
          <Save size={16} /> Save Changes
        </Button>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
        {loading ? (
          [...Array(8)].map((_, i) => <div key={i} className="skeleton h-12 rounded-xl" />)
        ) : settingFields.map(field => (
          <div key={field.key} className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-start">
            <label className="text-sm font-semibold text-slate-300 sm:pt-3">{field.label}</label>
            <div className="sm:col-span-2">
              {field.type === 'boolean' ? (
                <div className="flex items-center gap-3 pt-2">
                  <button
                    onClick={() => setSettings(p => ({ ...p, [field.key]: p[field.key] === 'true' ? 'false' : 'true' }))}
                    className={`w-12 h-6 rounded-full transition-colors relative ${settings[field.key] === 'true' ? 'bg-primary' : 'bg-slate-700'}`}
                  >
                    <div className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${settings[field.key] === 'true' ? 'translate-x-7' : 'translate-x-1'}`} />
                  </button>
                  <span className="text-sm text-slate-400">{settings[field.key] === 'true' ? 'Yes — Admissions are open' : 'No — Admissions are closed'}</span>
                </div>
              ) : field.type === 'textarea' ? (
                <textarea
                  value={settings[field.key] || ''}
                  onChange={e => setSettings(p => ({ ...p, [field.key]: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 text-white rounded-xl focus:ring-2 focus:ring-primary focus:outline-none text-sm resize-none"
                />
              ) : (
                <input
                  type={field.type}
                  value={settings[field.key] || ''}
                  onChange={e => setSettings(p => ({ ...p, [field.key]: e.target.value }))}
                  className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 text-white rounded-xl focus:ring-2 focus:ring-primary focus:outline-none text-sm"
                />
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="flex justify-end">
        <Button onClick={handleSave} isLoading={saving} size="lg">
          <Save size={18} /> Save All Settings
        </Button>
      </div>
    </div>
  );
}
