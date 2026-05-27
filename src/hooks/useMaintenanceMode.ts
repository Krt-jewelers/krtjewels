import { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface MaintenanceSettings {
  enabled: boolean;
  ends_at: string | null; // ISO
  message: string;
  title: string;
}

const DEFAULTS: MaintenanceSettings = {
  enabled: false,
  ends_at: null,
  message: 'We are polishing our showcase. We will be back shortly with something beautiful for you.',
  title: 'We will be right back',
};

export function useMaintenanceMode() {
  const qc = useQueryClient();
  const [now, setNow] = useState(() => Date.now());

  const query = useQuery({
    queryKey: ['site-settings', 'maintenance_mode'],
    queryFn: async (): Promise<MaintenanceSettings> => {
      const { data } = await supabase
        .from('site_settings')
        .select('value')
        .eq('key', 'maintenance_mode')
        .maybeSingle();
      const v = (data?.value as Partial<MaintenanceSettings>) ?? {};
      return { ...DEFAULTS, ...v };
    },
    staleTime: 15_000,
  });

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel('maintenance-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'site_settings', filter: 'key=eq.maintenance_mode' },
        () => qc.invalidateQueries({ queryKey: ['site-settings', 'maintenance_mode'] })
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [qc]);

  // Tick every second when an end-time is set so the countdown / auto-reveal works
  useEffect(() => {
    if (!query.data?.enabled || !query.data?.ends_at) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [query.data?.enabled, query.data?.ends_at]);

  const settings = query.data ?? DEFAULTS;
  const endsAtMs = settings.ends_at ? new Date(settings.ends_at).getTime() : null;
  const expired = endsAtMs != null && now >= endsAtMs;
  const isActive = settings.enabled && !expired;

  return {
    settings,
    isActive,
    expired,
    endsAtMs,
    now,
    isLoaded: !query.isLoading,
  };
}
