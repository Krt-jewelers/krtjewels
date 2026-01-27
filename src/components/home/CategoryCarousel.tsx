import { Link } from 'react-router-dom';
import { useRef, useEffect, useState, useCallback } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Category {
  name: string;
  slug: string;
  icon: string;
}

const categories: Category[] = [
  { name: 'Rings', slug: 'rings', icon: '💍' },
  { name: 'Necklaces', slug: 'necklaces', icon: '📿' },
  { name: 'Earrings', slug: 'earrings', icon: '✨' },
  { name: 'Bangles', slug: 'bangles', icon: '⭕' },
  { name: 'Bracelets', slug: 'bracelets', icon: '🔗' },
  { name: 'Chains', slug: 'chains', icon: '⛓️' },
  { name: 'Pendants', slug: 'pendants', icon: '💎' },
  { name: 'Wedding Sets', slug: 'wedding-bridal', icon: '💒' },
  { name: 'Diamond', slug: 'diamond-jewellery', icon: '💠' },
  { name: "Men's", slug: 'mens-jewellery', icon: '👔' },
];

export function CategoryCarousel() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const autoPlayRef = useRef<NodeJS.Timeout | null>(null);

  const scroll = useCallback((direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const container = scrollRef.current;
      const scrollAmount = 120;
      
      if (direction === 'right') {
        // Check if we're at the end
        if (container.scrollLeft + container.clientWidth >= container.scrollWidth - 10) {
          container.scrollTo({ left: 0, behavior: 'smooth' });
        } else {
          container.scrollBy({ left: scrollAmount, behavior: 'smooth' });
        }
      } else {
        // Check if we're at the start
        if (container.scrollLeft <= 10) {
          container.scrollTo({ left: container.scrollWidth, behavior: 'smooth' });
        } else {
          container.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
        }
      }
    }
  }, []);

  // Auto-scroll effect
  useEffect(() => {
    if (!isAutoPlaying) return;

    autoPlayRef.current = setInterval(() => {
      scroll('right');
    }, 3000);

    return () => {
      if (autoPlayRef.current) {
        clearInterval(autoPlayRef.current);
      }
    };
  }, [isAutoPlaying, scroll]);

  const handleInteractionStart = () => {
    setIsAutoPlaying(false);
    if (autoPlayRef.current) {
      clearInterval(autoPlayRef.current);
    }
  };

  const handleInteractionEnd = () => {
    // Resume auto-play after 5 seconds of no interaction
    setTimeout(() => {
      setIsAutoPlaying(true);
    }, 5000);
  };

  return (
    <section className="py-4 md:py-6 bg-background border-b">
      <div className="container mx-auto px-2 md:px-4">
        <div className="relative">
          {/* Scroll Buttons - Hidden on mobile, visible on desktop */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              handleInteractionStart();
              scroll('left');
              handleInteractionEnd();
            }}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-background/90 backdrop-blur-sm shadow-md hidden md:flex hover:bg-background h-8 w-8"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              handleInteractionStart();
              scroll('right');
              handleInteractionEnd();
            }}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-background/90 backdrop-blur-sm shadow-md hidden md:flex hover:bg-background h-8 w-8"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>

          {/* Categories Container */}
          <div
            ref={scrollRef}
            onMouseEnter={handleInteractionStart}
            onMouseLeave={handleInteractionEnd}
            onTouchStart={handleInteractionStart}
            onTouchEnd={handleInteractionEnd}
            className="flex gap-3 md:gap-5 overflow-x-auto scrollbar-hide px-1 md:px-10 snap-x snap-mandatory"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {categories.map((category) => (
              <Link
                key={category.slug}
                to={`/collections/${category.slug}`}
                className="flex-shrink-0 group snap-start"
                onClick={handleInteractionStart}
              >
                <div className="flex flex-col items-center gap-2">
                  {/* Circular Icon Container - Responsive sizes */}
                  <div className="w-14 h-14 sm:w-16 sm:h-16 md:w-18 md:h-18 lg:w-20 lg:h-20 rounded-full bg-gradient-to-br from-secondary to-secondary/50 border-2 border-transparent group-hover:border-primary group-hover:from-primary/10 group-hover:to-primary/5 flex items-center justify-center transition-all duration-300 group-hover:shadow-gold group-hover:scale-105">
                    <span className="text-xl sm:text-2xl md:text-2xl lg:text-3xl">{category.icon}</span>
                  </div>
                  {/* Category Name */}
                  <span className="text-[10px] sm:text-xs md:text-sm font-medium text-center whitespace-nowrap group-hover:text-primary transition-colors max-w-[60px] sm:max-w-[80px] truncate">
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
