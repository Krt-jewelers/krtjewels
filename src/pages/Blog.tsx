import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { SEO } from '@/components/layout/SEO';
import { useBlogPosts } from '@/hooks/useBlogPosts';
import { Skeleton } from '@/components/ui/skeleton';

function formatDate(s: string) {
  try {
    return new Date(s).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
  } catch { return ''; }
}

export default function Blog() {
  const { data: posts = [], isLoading } = useBlogPosts({ publishedOnly: true });
  const [featured, ...rest] = posts;

  return (
    <Layout>
      <SEO 
        title="The KRT Journal – Stories, Style & Jewellery Guides"
        description="Explore the world of fine jewellery — from craftsmanship secrets to bridal trends and styling guides curated by KRT Jewellers."
        path="/blog"
      />

      {/* Hero */}
      <section className="bg-gradient-to-b from-secondary/40 to-background py-16 md:py-24 border-b border-border">
        <div className="max-w-5xl mx-auto px-4 md:px-8 text-center">
          <span className="text-primary text-xs md:text-sm tracking-[0.3em] uppercase mb-3 md:mb-4 block font-medium">
            The KRT Journal
          </span>
          <h1 className="font-serif text-4xl md:text-6xl text-foreground leading-tight mb-4">
            Stories, Style & Inspiration
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto text-base md:text-lg leading-relaxed">
            Explore the world of fine jewellery — from craftsmanship secrets to bridal trends and styling guides curated by our experts.
          </p>
        </div>
      </section>

      <section className="py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="space-y-3">
                  <Skeleton className="aspect-[4/5] w-full rounded-lg" />
                  <Skeleton className="h-6 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                </div>
              ))}
            </div>
          ) : posts.length === 0 ? (
            <div className="text-center py-20 text-muted-foreground">
              No journal entries yet. Check back soon.
            </div>
          ) : (
            <>
              {/* Featured post */}
              {featured && (
                <Link to={`/blog/${featured.slug}`} className="group grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12 mb-16 md:mb-24 items-center">
                  <div className="aspect-[4/3] w-full overflow-hidden rounded-lg bg-secondary order-2 lg:order-1">
                    {featured.cover_image_url ? (
                      <img
                        src={featured.cover_image_url}
                        alt={featured.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-secondary to-muted" />
                    )}
                  </div>
                  <div className="order-1 lg:order-2">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground tracking-wider uppercase mb-3">
                      <span className="text-primary font-medium">Featured</span>
                      {featured.category && <><span>·</span><span className="text-primary font-medium">{featured.category}</span></>}
                      <span>·</span>
                      <span>{formatDate(featured.published_at)}</span>
                    </div>
                    <h2 className="font-serif text-3xl md:text-4xl lg:text-5xl text-foreground leading-tight mb-4 group-hover:text-primary transition-colors">
                      {featured.title}
                    </h2>
                    {featured.excerpt && (
                      <p className="text-muted-foreground leading-relaxed text-base md:text-lg mb-6 line-clamp-4">
                        {featured.excerpt}
                      </p>
                    )}
                    <span className="inline-flex items-center gap-2 text-sm text-primary tracking-wider uppercase font-medium">
                      Read Article <ArrowRight className="w-4 h-4" />
                    </span>
                  </div>
                </Link>
              )}

              {/* Grid */}
              {rest.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-10">
                  {rest.map((post) => (
                    <Link key={post.id} to={`/blog/${post.slug}`} className="group">
                      <div className="aspect-[4/5] w-full overflow-hidden rounded-lg bg-secondary mb-5">
                        {post.cover_image_url ? (
                          <img
                            src={post.cover_image_url}
                            alt={post.title}
                            loading="lazy"
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-secondary to-muted" />
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground tracking-wider uppercase mb-2">
                        {post.category && <span className="text-primary font-medium">{post.category}</span>}
                        {post.category && <span>·</span>}
                        <span>{formatDate(post.published_at)}</span>
                      </div>
                      <h3 className="font-serif text-xl md:text-2xl text-foreground leading-snug mb-2 group-hover:text-primary transition-colors">
                        {post.title}
                      </h3>
                      {post.excerpt && (
                        <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2">
                          {post.excerpt}
                        </p>
                      )}
                    </Link>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </section>
    </Layout>
  );
}
