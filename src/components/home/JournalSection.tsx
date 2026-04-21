import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useBlogPosts } from '@/hooks/useBlogPosts';
import { Skeleton } from '@/components/ui/skeleton';

function formatDate(s: string) {
  try {
    return new Date(s).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch { return ''; }
}

export function JournalSection() {
  const { data: posts = [], isLoading } = useBlogPosts({ publishedOnly: true, limit: 3 });

  if (!isLoading && posts.length === 0) return null;

  return (
    <section className="py-16 md:py-24 bg-background">
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        <div className="flex items-end justify-between mb-10 md:mb-14">
          <div>
            <span className="text-primary text-xs md:text-sm tracking-[0.3em] uppercase mb-2 md:mb-3 block font-medium">
              From Our Journal
            </span>
            <h2 className="font-serif text-3xl md:text-4xl lg:text-5xl text-foreground leading-tight">
              Stories, Style & Inspiration
            </h2>
          </div>
          <Link to="/blog" className="hidden md:inline-flex items-center gap-2 text-xs text-primary tracking-wider uppercase font-medium hover:gap-3 transition-all">
            View All <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
          {isLoading
            ? Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="space-y-3">
                  <Skeleton className="aspect-[4/5] w-full rounded-lg" />
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-6 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                </div>
              ))
            : posts.map((post) => (
                <Link to={`/blog/${post.slug}`} key={post.id} className="group cursor-pointer block">
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
                  <span className="inline-flex items-center gap-1 mt-4 text-xs text-primary tracking-wider uppercase font-medium">
                    Read More <ArrowRight className="w-3 h-3" />
                  </span>
                </Link>
              ))}
        </div>

        <div className="mt-10 md:hidden text-center">
          <Link to="/blog" className="inline-flex items-center gap-2 text-xs text-primary tracking-wider uppercase font-medium border-b border-primary pb-1">
            View All Articles <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
