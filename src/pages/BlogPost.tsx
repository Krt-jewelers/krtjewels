import { useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Layout } from '@/components/layout/Layout';
import { SEO } from '@/components/layout/SEO';
import { useBlogPosts } from '@/hooks/useBlogPosts';
import { Skeleton } from '@/components/ui/skeleton';

function formatDate(s: string) {
  try {
    return new Date(s).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
  } catch { return ''; }
}

export default function BlogPost() {
  const { slug } = useParams<{ slug: string }>();
  const { data: posts = [], isLoading } = useBlogPosts({ publishedOnly: true });
  const post = posts.find((p) => p.slug === slug);
  const related = posts.filter((p) => p.slug !== slug).slice(0, 3);

  const articleSchema = useMemo(() => {
    if (!post) return undefined;
    return [
      {
        '@context': 'https://schema.org',
        '@type': 'BlogPosting',
        headline: post.title,
        description: post.excerpt || post.title,
        image: post.cover_image_url
          ? [post.cover_image_url]
          : ['https://www.krtjewellers.com/og-image.png'],
        datePublished: post.published_at || new Date().toISOString(),
        dateModified: post.published_at || new Date().toISOString(),
        author: {
          '@type': 'Person',
          name: post.author || 'KRT Jewellers',
        },
        publisher: {
          '@type': 'Organization',
          name: 'KRT Jewellers',
          logo: {
            '@type': 'ImageObject',
            url: 'https://www.krtjewellers.com/icon-512.png',
          },
        },
        mainEntityOfPage: {
          '@type': 'WebPage',
          '@id': `https://www.krtjewellers.com/blog/${post.slug}`,
        },
      },
      {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          {
            '@type': 'ListItem',
            position: 1,
            name: 'Home',
            item: 'https://www.krtjewellers.com',
          },
          {
            '@type': 'ListItem',
            position: 2,
            name: 'The Journal',
            item: 'https://www.krtjewellers.com/blog',
          },
          {
            '@type': 'ListItem',
            position: 3,
            name: post.title,
            item: `https://www.krtjewellers.com/blog/${post.slug}`,
          },
        ],
      },
    ];
  }, [post]);

  if (isLoading) {
    return (
      <Layout>
        <div className="max-w-3xl mx-auto px-4 md:px-8 py-16 space-y-6">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="aspect-[16/9] w-full rounded-lg" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
          <Skeleton className="h-4 w-4/6" />
        </div>
      </Layout>
    );
  }

  if (!post) {
    return (
      <Layout>
        <SEO
          title="Article Not Found – KRT Journal"
          description="The requested article could not be found."
          noindex={true}
        />
        <div className="max-w-3xl mx-auto px-4 md:px-8 py-24 text-center">
          <h1 className="font-serif text-3xl text-foreground mb-4">Article not found</h1>
          <Link to="/blog" className="inline-flex items-center gap-2 text-primary tracking-wider uppercase text-sm font-medium">
            <ArrowLeft className="w-4 h-4" /> Back to Journal
          </Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <SEO
        title={post.title}
        description={post.excerpt || `Read "${post.title}" on the KRT Jewellers Journal.`}
        path={`/blog/${post.slug}`}
        image={post.cover_image_url || 'https://www.krtjewellers.com/og-image.png'}
        type="article"
        schema={articleSchema}
      />

      <article className="py-12 md:py-20">
        <div className="max-w-3xl mx-auto px-4 md:px-8">
          <Link to="/blog" className="inline-flex items-center gap-2 text-xs md:text-sm text-muted-foreground hover:text-primary tracking-wider uppercase font-medium mb-8">
            <ArrowLeft className="w-4 h-4" /> The Journal
          </Link>

          <div className="flex items-center gap-2 text-xs text-muted-foreground tracking-wider uppercase mb-4">
            {post.category && <span className="text-primary font-medium">{post.category}</span>}
            {post.category && <span>·</span>}
            <span>{formatDate(post.published_at)}</span>
            {post.author && <><span>·</span><span>By {post.author}</span></>}
          </div>

          <h1 className="font-serif text-3xl md:text-5xl text-foreground leading-tight mb-6">
            {post.title}
          </h1>

          {post.excerpt && (
            <p className="text-lg md:text-xl text-muted-foreground leading-relaxed mb-10">
              {post.excerpt}
            </p>
          )}
        </div>

        {post.cover_image_url && (
          <div className="max-w-5xl mx-auto px-4 md:px-8 mb-12">
            <div className="aspect-[16/9] w-full overflow-hidden rounded-lg bg-secondary">
              <img src={post.cover_image_url} alt={post.title} className="w-full h-full object-cover" />
            </div>
          </div>
        )}

        <div className="max-w-3xl mx-auto px-4 md:px-8">
          {post.content ? (
            <div className="prose prose-lg max-w-none text-foreground/90 leading-relaxed prose-headings:font-serif prose-headings:text-foreground prose-h2:text-2xl md:prose-h2:text-3xl prose-h2:mt-10 prose-h2:mb-4 prose-h3:text-xl prose-h3:mt-6 prose-a:text-primary prose-strong:text-foreground prose-img:rounded-lg prose-table:text-sm">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{post.content}</ReactMarkdown>
            </div>
          ) : (
            <p className="text-muted-foreground">Full article coming soon.</p>
          )}
        </div>
      </article>

      {related.length > 0 && (
        <section className="py-16 md:py-24 border-t border-border bg-secondary/20">
          <div className="max-w-7xl mx-auto px-4 md:px-8">
            <div className="flex items-end justify-between mb-10">
              <h2 className="font-serif text-2xl md:text-4xl text-foreground">More from the Journal</h2>
              <Link to="/blog" className="hidden md:inline-flex items-center gap-2 text-xs text-primary tracking-wider uppercase font-medium">
                View All <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {related.map((p) => (
                <Link key={p.id} to={`/blog/${p.slug}`} className="group">
                  <div className="aspect-[16/10] w-full overflow-hidden rounded-lg bg-secondary mb-4">
                    {p.cover_image_url ? (
                      <img src={p.cover_image_url} alt={p.title} loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-secondary to-muted" />
                    )}
                  </div>
                  <h3 className="font-serif text-xl md:text-2xl text-foreground leading-snug group-hover:text-primary transition-colors">
                    {p.title}
                  </h3>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}
    </Layout>
  );
}
