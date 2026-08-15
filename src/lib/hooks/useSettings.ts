'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';

export interface SiteSettings {
  site_name: string;
  site_tagline: string;
  contact_phone: string;
  contact_email: string;
  contact_address: string;
  whatsapp_number: string;
  admissions_open: string;
  admissions_year: string;
  facebook_url: string;
  instagram_url: string;
  [key: string]: string | undefined;
}

export const defaultSettings: SiteSettings = {
  site_name: 'The Foundation Collegiate',
  site_tagline: 'We Know and Deliver What Quality Education Means. Foundation Collegiate is North Karachi\'s premier coaching institute, dedicated to shaping futures through expert Matriculation & Intermediate tutoring.',
  contact_phone: '0333-3439458',
  contact_email: 'foundationcollegiate@gmail.com',
  contact_address: 'House #1704, Sector 11-E, Muslim Town, North Karachi, Karachi, Pakistan',
  whatsapp_number: '+923333439458',
  admissions_open: 'true',
  admissions_year: '2026',
  facebook_url: 'https://www.facebook.com/TheFoundationCollegiate/',
  instagram_url: 'https://www.instagram.com/thefoundationcollegiate/',
};

export function useSettings() {
  const [settings, setSettings] = useState<SiteSettings>(defaultSettings);

  useEffect(() => {
    let isMounted = true;

    async function loadSettings() {
      try {
        const { data, error } = await supabase.from('settings').select('*');
        if (!error && data && data.length > 0) {
          const map: Record<string, string> = {};
          data.forEach((item: any) => {
            if (item.key && item.value !== undefined) {
              map[item.key] = item.value;
            }
          });
          if (isMounted) {
            setSettings(prev => ({ ...prev, ...map }));
          }
        }
      } catch (err) {
        // Fallback to defaultSettings
      }
    }

    loadSettings();

    return () => {
      isMounted = false;
    };
  }, []);

  return settings;
}
