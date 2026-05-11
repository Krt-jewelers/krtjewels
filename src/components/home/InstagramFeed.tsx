import { useEffect, useState } from 'react';
import { Instagram, ExternalLink, Play } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { cld } from '@/lib/imageOptim';

interface IgPost {
  id: string;
  caption?: string;
  media_type: 'IMAGE' | 'VIDEO' | 'CAROUSEL_ALBUM';
  media_url: string;
  thumbnail_url?: string;
  permalink: string;
  timestamp: string;
}

const fallbackPosts: IgPost[] = [
  { id: 'f1', media_type: 'IMAGE', media_url: 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=600&h=600&fit=crop', permalink: 'https://www.instagram.com/krtjewellers/', timestamp: '', caption: 'Stunning diamond necklace ✨' },
  { id: 'f2', media_type: 'IMAGE', media_url: 'https://images.unsplash.com/photo-1602173574767-37ac01994b2a?w=600&h=600&fit=crop', permalink: 'https://www.instagram.com/krtjewellers/', timestamp: '', caption: 'Traditional gold bangles 💛' },
  { id: 'f3', media_type: 'IMAGE', media_url: 'https://images.unsplash.com/photo-1603561591411-07134e71a2a9?w=600&h=600&fit=crop', permalink: 'https://www.instagram.com/krtjewellers/', timestamp: '', caption: 'Bridal collection 💍' },
  { id: 'f4', media_type: 'IMAGE', media_url: 'https://images.unsplash.com/photo-1611652022419-a9419f74343d?w=600&h=600&fit=crop', permalink: 'https://www.instagram.com/krtjewellers/', timestamp: '', caption: 'Pearl elegance 🤍' },
  { id: 'f5', media_type: 'IMAGE', media_url: 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=600&h=600&fit=crop', permalink: 'https://www.instagram.com/krtjewellers/', timestamp: '', caption: 'Temple jewellery 🙏' },
  { id: 'f6', media_type: 'IMAGE', media_url: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=600&h=600&fit=crop', permalink: 'https://www.instagram.com/krtjewellers/', timestamp: '', caption: 'New arrivals 🌟' },
];

export function InstagramFeed() {
  const instagramUrl = 'https://www.instagram.com/krtjewellers/';
  const [posts, setPosts] = useState<IgPost[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data } = await supabase.functions.invoke('instagram-feed');
        if (!cancelled && data?.posts?.length) {
          setPosts(data.posts.slice(0, 6));
        } else if (!cancelled) {
          setPosts(fallbackPosts);
        }
      } catch {
        if (!cancelled) setPosts(fallbackPosts);
      } finally {
        if (!cancelled) setLoaded(true);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const display = loaded ? posts : fallbackPosts;

  return (
    <section className="py-16 md:py-24 bg-secondary/30">
      <div className="container mx-auto px-4">
        <div className="flex flex-col items-center gap-4 text-center mb-12">
          <span className="inline-flex items-center gap-2 text-primary text-sm uppercase tracking-[0.3em] font-medium">
            <span className="w-8 h-px bg-primary" />
            Follow Us
            <span className="w-8 h-px bg-primary" />
          </span>
          <h2 className="font-serif text-4xl md:text-5xl font-medium section-heading">
            @krtjewellers
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Live from our Instagram. Tag us in your photos for a chance to be featured!
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 md:gap-4">
          {display.map((post) => {
            const img = post.media_type === 'VIDEO'
              ? (post.thumbnail_url || post.media_url)
              : post.media_url;
            return (
              <a
                key={post.id}
                href={post.permalink || instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="group relative aspect-square overflow-hidden rounded-xl bg-secondary"
              >
                <img
                  src={cld(img, { w: 500, h: 500 })}
                  alt={post.caption || 'Instagram post'}
                  width={500}
                  height={500}
                  loading="lazy"
                  decoding="async"
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
                {post.media_type === 'VIDEO' && (
                  <div className="absolute top-2 right-2 z-10 bg-rich-black/60 backdrop-blur-sm rounded-full p-1.5">
                    <Play className="w-3 h-3 text-ivory fill-ivory" />
                  </div>
                )}
                <div className="absolute inset-0 bg-rich-black/0 group-hover:bg-rich-black/60 transition-colors duration-300 flex items-center justify-center">
                  <Instagram className="w-8 h-8 text-ivory opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </div>
              </a>
            );
          })}
        </div>

        <div className="text-center mt-10">
          <a
            href={instagramUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-purple-600 via-pink-600 to-orange-500 text-white font-semibold rounded-full hover:shadow-lg hover:scale-105 transition-all duration-300"
          >
            <Instagram className="w-5 h-5" />
            Follow @krtjewellers
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      </div>
    </section>
  );
}
