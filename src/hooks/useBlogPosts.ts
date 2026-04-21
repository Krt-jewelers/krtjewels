import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string | null;
  cover_image_url: string | null;
  author: string | null;
  category: string | null;
  is_published: boolean;
  display_order: number;
  published_at: string;
  created_at: string;
  updated_at: string;
}

export function useBlogPosts(opts: { publishedOnly?: boolean; limit?: number } = {}) {
  const { publishedOnly = false, limit } = opts;
  return useQuery({
    queryKey: ['blog-posts', { publishedOnly, limit }],
    queryFn: async () => {
      let q = supabase.from('blog_posts').select('*').order('display_order', { ascending: true }).order('published_at', { ascending: false });
      if (publishedOnly) q = q.eq('is_published', true);
      if (limit) q = q.limit(limit);
      const { data, error } = await q;
      if (error) throw error;
      return (data || []) as BlogPost[];
    },
  });
}

export function useUpsertBlogPost() {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (post: Partial<BlogPost> & { title: string; slug: string }) => {
      const payload = {
        title: post.title,
        slug: post.slug,
        excerpt: post.excerpt || null,
        content: post.content || null,
        cover_image_url: post.cover_image_url || null,
        author: post.author || 'KRT Jewellers',
        category: post.category || null,
        is_published: post.is_published ?? true,
        display_order: post.display_order ?? 0,
      };
      if (post.id) {
        const { error } = await supabase.from('blog_posts').update(payload).eq('id', post.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('blog_posts').insert([payload]);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['blog-posts'] });
      toast({ title: 'Saved', description: 'Blog post saved.' });
    },
    onError: (e: Error) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  });
}

export function useDeleteBlogPost() {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('blog_posts').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['blog-posts'] });
      toast({ title: 'Deleted', description: 'Blog post removed.' });
    },
    onError: (e: Error) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  });
}
