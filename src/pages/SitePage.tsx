import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Helmet } from 'react-helmet-async';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { supabase } from '@/integrations/supabase/client';
import { Layout } from '@/components/layout/Layout';
import { Skeleton } from '@/components/ui/skeleton';

export default function SitePage({ slug: slugProp }: { slug?: string }) {
  const params = useParams();
  const slug = slugProp ?? params.slug!;

  const { data, isLoading } = useQuery({
    queryKey: ['site_page', slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('site_pages')
        .select('*')
        .eq('slug', slug)
        .eq('is_published', true)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  return (
    <Layout>
      <Helmet>
        <title>{data?.title ? `${data.title} | KRT Jewellers` : 'KRT Jewellers'}</title>
        {data?.meta_description && <meta name="description" content={data.meta_description} />}
        <link rel="canonical" href={`https://krtgold.lovable.app/${slug}`} />
      </Helmet>
      <div className="container mx-auto px-4 py-12 max-w-3xl">
        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-10 w-2/3" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-4 w-4/6" />
          </div>
        ) : !data ? (
          <div className="text-center py-20">
            <h1 className="font-serif text-3xl mb-3">Page not found</h1>
            <p className="text-muted-foreground">This page hasn't been published yet.</p>
          </div>
        ) : (
          <article className="prose prose-lg max-w-none prose-headings:font-serif prose-headings:text-imli-brown prose-a:text-primary">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{data.content}</ReactMarkdown>
          </article>
        )}
      </div>
    </Layout>
  );
}
