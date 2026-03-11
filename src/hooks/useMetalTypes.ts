import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface MetalType {
  id: string;
  name: string;
  slug: string;
  rate_per_gram: number;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export function useMetalTypes() {
  return useQuery({
    queryKey: ['metalTypes'],
    queryFn: async (): Promise<MetalType[]> => {
      const { data, error } = await supabase
        .from('metal_types')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true });

      if (error) throw error;
      return (data || []) as MetalType[];
    },
    staleTime: 1000 * 60 * 5,
  });
}

export function useAllMetalTypes() {
  return useQuery({
    queryKey: ['allMetalTypes'],
    queryFn: async (): Promise<MetalType[]> => {
      const { data, error } = await supabase
        .from('metal_types')
        .select('*')
        .order('display_order', { ascending: true });

      if (error) throw error;
      return (data || []) as MetalType[];
    },
  });
}

export function useCreateMetalType() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (metalType: Partial<MetalType>) => {
      const { data, error } = await supabase
        .from('metal_types')
        .insert(metalType as any)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['metalTypes'] });
      qc.invalidateQueries({ queryKey: ['allMetalTypes'] });
    },
  });
}

export function useUpdateMetalType() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<MetalType> & { id: string }) => {
      const { data, error } = await supabase
        .from('metal_types')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['metalTypes'] });
      qc.invalidateQueries({ queryKey: ['allMetalTypes'] });
      qc.invalidateQueries({ queryKey: ['products'] });
      qc.invalidateQueries({ queryKey: ['adminProducts'] });
    },
  });
}

export function useDeleteMetalType() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('metal_types')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['metalTypes'] });
      qc.invalidateQueries({ queryKey: ['allMetalTypes'] });
    },
  });
}

export function useBulkUpdateMetalRates() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (rates: { id: string; rate_per_gram: number }[]) => {
      for (const rate of rates) {
        const { error } = await supabase
          .from('metal_types')
          .update({ rate_per_gram: rate.rate_per_gram })
          .eq('id', rate.id);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['metalTypes'] });
      qc.invalidateQueries({ queryKey: ['allMetalTypes'] });
      qc.invalidateQueries({ queryKey: ['goldRate'] });
      qc.invalidateQueries({ queryKey: ['products'] });
      qc.invalidateQueries({ queryKey: ['adminProducts'] });
    },
  });
}
