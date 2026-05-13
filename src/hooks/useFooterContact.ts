import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface FooterContact {
  address_line1: string;
  address_line2: string;
  phones: string[];
  email: string;
  map_share_url: string;
  place_id?: string;
}

const DEFAULTS: FooterContact = {
  address_line1: '1154, Big Bazaar Street, Prakasam',
  address_line2: 'Town Hall, Coimbatore, Tamil Nadu 641001',
  phones: ['+91 98430 10986', '+91 422 2390505'],
  email: 'info@krtjewels.com',
  map_share_url: 'https://share.google/JX7VmoorksTO98o9m',
  place_id: 'ChIJX0yR63xeUjoRgA_6Yatp91k',
};

export function useFooterContact() {
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ['site-settings', 'footer_contact'],
    queryFn: async (): Promise<FooterContact> => {
      const { data } = await supabase
        .from('site_settings')
        .select('value')
        .eq('key', 'footer_contact')
        .maybeSingle();
      const v = (data?.value as Partial<FooterContact>) ?? {};
      return { ...DEFAULTS, ...v, phones: v.phones?.length ? v.phones : DEFAULTS.phones };
    },
    staleTime: 60_000,
  });

  // Realtime: refresh whenever footer_contact OR any site_pages row changes
  useEffect(() => {
    const channel = supabase
      .channel('footer-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'site_settings', filter: 'key=eq.footer_contact' },
        () => qc.invalidateQueries({ queryKey: ['site-settings', 'footer_contact'] })
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'site_pages' },
        () => qc.invalidateQueries({ queryKey: ['site_page'] })
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [qc]);

  return query;
}
