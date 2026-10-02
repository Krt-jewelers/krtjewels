import { Link } from 'react-router-dom';
import { useRef, useEffect, useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { cld } from '@/lib/imageOptim';

interface Category {
  id: string;
  name: string;
  slug: string;
  image_url: string | null;
  is_view_all: boolean;
}

const defaultCategories: Category[] = [
  { id: '1', name: 'Rings', slug: 'rings', image_url: 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=200&h=200&fit=crop', is_view_all: false },
  { id: '2', name: 'Necklaces', slug: 'necklaces', image_url: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=200&h=200&fit=crop', is_view_all: false },
  { id: '3', name: 'Earrings', slug: 'earrings', image_url: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=200&h=200&fit=crop', is_view_all: false },
  { id: '4', name: 'Bangles', slug: 'bangles', image_url: 'https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=200&h=200&fit=crop', is_view_all: false },
  { id: '5', name: 'Bracelets', slug: 'bracelets', image_url: 'https://images.unsplash.com/photo-1573408301185-9146fe634ad0?w=200&h=200&fit=crop', is_view_all: false },
  { id: '6', name: 'Chains', slug: 'chains', image_url: 'https://images.unsplash.com/photo-1602751584552-8ba73aad10e1?w=200&h=200&fit=crop', is_view_all: false },
  { id: '7', name: 'Pendants', slug: 'pendants', image_url: 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=200&h=200&fit=crop', is_view_all: false },
  { id: '8', name: 'Wedding Sets', slug: 'wedding-bridal', image_url: 'https://images.unsplash.com/photo-1596944924616-7b38e7cfac36?w=200&h=200&fit=crop', is_view_all: false },
  { id: '9', name: 'Diamond', slug: 'diamond-jewellery', image_url: 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=200&h=200&fit=crop', is_view_all: false },
  { id: '10', name: "Men's", slug: 'mens-jewellery', image_url: 'https://images.unsplash.com/photo-1611085583191-a3b181a88401?w=200&h=200&fit=crop', is_view_all: false },
  { id: '11', name: 'View All', slug: 'shop', image_url: null, is_view_all: true },
];

export function CategoryCarousel() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const autoPlayRef = useRef<NodeJS.Timeout | null>(null);
  const [showArrows, setShowArrows] = useState(false);
  const [loadedCategories, setLoadedCategories] = useState<Set<string>>(new Set());

  const { data: categories, isLoading } = useQuery({
    queryKey: ['carouselCategories'],
    queryFn: async () => {
      const { data, error } = await (supabase as unknown as { from: (table: string) => any })
        .from('carousel_categories')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true });
      if (error) {
        console.error('Error fetching carousel categories:', error);
        return defaultCategories;
      }
      return (data && data.length > 0 ? data : defaultCategories) as Category[];
    },
    staleTime: 5 * 60 * 1000,
  });

  const displayCategories = categories || [];
  const visibleCategories = displayCategories.filter((category) => !category.is_view_all);
  const shouldStretchDesktop = !showArrows && visibleCategories.length > 0 && visibleCategories.length <= 7;

  // Check if scrolling is needed
  useEffect(() => {
    const checkOverflow = () => {
      if (scrollRef.current) {
        setShowArrows(scrollRef.current.scrollWidth > scrollRef.current.clientWidth);
      }
    };
    checkOverflow();
    window.addEventListener('resize', checkOverflow);
    return () => window.removeEventListener('resize', checkOverflow);
  }, []);

  const scroll = useCallback((direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const container = scrollRef.current;
      const scrollAmount = 120;
      
      if (direction === 'right') {
        if (container.scrollLeft + container.clientWidth >= container.scrollWidth - 10) {
          container.scrollTo({ left: 0, behavior: 'smooth' });
        } else {
          container.scrollBy({ left: scrollAmount, behavior: 'smooth' });
        }
      } else {
        if (container.scrollLeft <= 10) {
          container.scrollTo({ left: container.scrollWidth, behavior: 'smooth' });
        } else {
          container.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
        }
      }
    }
  }, []);

  useEffect(() => {
    // Disable auto-scrolling on mobile/touch devices to allow natural swipe
    const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    if (!isAutoPlaying || !showArrows || isTouchDevice) return;

    autoPlayRef.current = setInterval(() => {
      scroll('right');
    }, 3000);

    return () => {
      if (autoPlayRef.current) {
        clearInterval(autoPlayRef.current);
      }
    };
  }, [isAutoPlaying, scroll, showArrows]);

  const handleInteractionStart = () => {
    setIsAutoPlaying(false);
    if (autoPlayRef.current) {
      clearInterval(autoPlayRef.current);
    }
  };

  const handleInteractionEnd = () => {
    setTimeout(() => {
      setIsAutoPlaying(true);
    }, 5000);
  };

  return (
    <section className="py-4 md:py-6 bg-background border-b">
      <div className="w-full px-4 md:px-8">
        <div className="relative">
          <div
            ref={scrollRef}
            onMouseEnter={handleInteractionStart}
            onMouseLeave={handleInteractionEnd}
            onTouchStart={handleInteractionStart}
            onTouchEnd={handleInteractionEnd}
            className={cn(
              'flex gap-4 sm:gap-3 overflow-x-auto scrollbar-hide px-4 md:px-6 snap-x snap-mandatory',
              showArrows
                ? 'lg:flex-nowrap lg:justify-evenly lg:gap-0 lg:overflow-x-auto'
                : 'lg:flex-nowrap lg:justify-between lg:gap-3 lg:overflow-visible lg:px-1'
            )}
            style={{ 
              scrollbarWidth: 'none', 
              msOverflowStyle: 'none', 
              WebkitOverflowScrolling: 'touch',
              overscrollBehaviorX: 'contain',
              touchAction: 'pan-x',
            }}
          >
            {isLoading ? (
              Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="flex-shrink-0 lg:flex-shrink snap-start">
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-24 h-24 sm:w-20 sm:h-20 md:w-24 md:h-24 lg:w-32 lg:h-32 xl:w-36 xl:h-36 rounded-2xl bg-muted animate-pulse" />
                    <div className="w-12 h-3 bg-muted animate-pulse rounded" />
                  </div>
                </div>
              ))
            ) : visibleCategories.map((category) => (
              <Link
                key={category.slug}
                to={`/collections/${category.slug}`}
                className={cn(
                  'flex-shrink-0 lg:flex-shrink group snap-start',
                  shouldStretchDesktop && 'lg:flex-1 lg:max-w-[170px]'
                )}
                onClick={handleInteractionStart}
              >
                <div className="flex flex-col items-center gap-2">
                  <div className="w-24 h-24 sm:w-20 sm:h-20 md:w-24 md:h-24 lg:w-32 lg:h-32 xl:w-36 xl:h-36 rounded-2xl border-2 border-transparent group-hover:border-primary overflow-hidden transition-all duration-300 group-hover:shadow-gold group-hover:scale-105">
                    {!loadedCategories.has(category.slug) && <div className="absolute inset-0 animate-pulse bg-muted" aria-hidden="true" />}
                    <img
                      src={cld(category.image_url, { w: 320, h: 320, quality: 'auto', crop: 'fill' }) || '/placeholder.svg'}
                      alt={category.name}
                      className={cn('relative w-full h-full object-cover transition-opacity duration-300', loadedCategories.has(category.slug) ? 'opacity-100' : 'opacity-0')}
                      loading="lazy"
                      decoding="async"
                      onLoad={() => setLoadedCategories((previous) => new Set(previous).add(category.slug))}
                    />
                  </div>
                  <span className="text-xs md:text-sm font-medium text-center whitespace-nowrap group-hover:text-primary transition-colors select-none">
                    {category.name}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>

      <style>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </section>
  );
}

