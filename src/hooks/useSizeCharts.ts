import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface SizeChartRow {
  [key: string]: string;
}

export interface SizeChart {
  id: string;
  category: string;
  chart_data: SizeChartRow[];
  column_headers: string[];
  instructions: string;
  guide_image_url: string | null;
  created_at: string;
  updated_at: string;
}

export function useSizeChart(category: string) {
  return useQuery({
    queryKey: ['size-chart', category],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('size_charts')
        .select('*')
        .eq('category', category)
        .maybeSingle();
      if (error) throw error;
      if (!data) return null;
      return {
        ...data,
        chart_data: (data.chart_data as SizeChartRow[]) || [],
        column_headers: (data.column_headers as string[]) || [],
        instructions: data.instructions || '',
      } as SizeChart;
    },
    enabled: !!category,
  });
}

export function useSizeCharts() {
  return useQuery({
    queryKey: ['size-charts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('size_charts')
        .select('*')
        .order('category');
      if (error) throw error;
      return (data || []).map(d => ({
        ...d,
        chart_data: (d.chart_data as SizeChartRow[]) || [],
        column_headers: (d.column_headers as string[]) || [],
        instructions: d.instructions || '',
      })) as SizeChart[];
    },
  });
}

export function useUpsertSizeChart() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (chart: Partial<SizeChart> & { category: string }) => {
      const { data: existing } = await supabase
        .from('size_charts')
        .select('id')
        .eq('category', chart.category)
        .maybeSingle();

      const payload = {
        category: chart.category,
        chart_data: chart.chart_data as any,
        column_headers: chart.column_headers as any,
        instructions: chart.instructions || '',
        guide_image_url: chart.guide_image_url || null,
      };

      if (existing) {
        const { error } = await supabase
          .from('size_charts')
          .update(payload)
          .eq('id', existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('size_charts')
          .insert([payload]);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['size-charts'] });
      queryClient.invalidateQueries({ queryKey: ['size-chart'] });
      toast({ title: 'Saved', description: 'Size chart updated successfully.' });
    },
    onError: (e: Error) => {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    },
  });
}
