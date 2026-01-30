import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { Json } from '@/integrations/supabase/types';

interface FreeShippingSettings {
  amount: number;
  enabled: boolean;
}

export function useFreeShippingSettings() {
  return useQuery({
    queryKey: ['site-settings', 'free_shipping_threshold'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('site_settings')
        .select('value')
        .eq('key', 'free_shipping_threshold')
        .single();

      if (error) {
        // Return default if not found
        return { amount: 50000, enabled: true } as FreeShippingSettings;
      }
      
      // Parse the JSON value
      const value = data.value as { amount?: number; enabled?: boolean };
      return {
        amount: value.amount ?? 50000,
        enabled: value.enabled ?? true
      } as FreeShippingSettings;
    },
  });
}

export function useUpdateFreeShippingSettings() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (settings: FreeShippingSettings) => {
      const { data: existing } = await supabase
        .from('site_settings')
        .select('id')
        .eq('key', 'free_shipping_threshold')
        .single();

      // Create a JSON-compatible value
      const jsonValue: Json = {
        amount: settings.amount,
        enabled: settings.enabled
      };

      if (existing) {
        const { error } = await supabase
          .from('site_settings')
          .update({ 
            value: jsonValue,
            updated_at: new Date().toISOString()
          })
          .eq('key', 'free_shipping_threshold');

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('site_settings')
          .insert([{
            key: 'free_shipping_threshold',
            value: jsonValue,
            description: 'Free shipping threshold amount in INR'
          }]);

        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['site-settings', 'free_shipping_threshold'] });
      toast({
        title: 'Settings Updated',
        description: 'Free shipping settings have been saved.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update settings',
        variant: 'destructive',
      });
    },
  });
}
