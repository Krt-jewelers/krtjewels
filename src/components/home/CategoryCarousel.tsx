import { Link } from 'react-router-dom';
import { useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Category {
  name: string;
  slug: string;
  icon: string;
  image?: string;
}

const categories: Category[] = [
  { name: 'Rings', slug: 'rings', icon: '💍' },
  { name: 'Necklaces', slug: 'necklaces', icon: '📿' },
  { name: 'Earrings', slug: 'earrings', icon: '✨' },
  { name: 'Bangles', slug: 'bangles', icon: '⭕' },
  { name: 'Bracelets', slug: 'bracelets', icon: '🔗' },
  { name: 'Chains', slug: 'chains', icon: '⛓️' },
  { name: 'Pendants', slug: 'pendants', icon: '💎' },
  { name: 'Wedding Sets', slug: 'wedding-sets', icon: '💒' },
  { name: 'Diamond', slug: 'diamond-jewellery', icon: '💠' },
  { name: "Men's", slug: 'mens-jewellery', icon: '👔' },
];

export function CategoryCarousel() {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = 200;
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  return (
    <section className="py-6 bg-background border-b">
      <div className="container mx-auto px-4">
        <div className="relative">
          {/* Scroll Buttons */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => scroll('left')}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-background/80 backdrop-blur-sm shadow-sm hidden md:flex"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => scroll('right')}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-background/80 backdrop-blur-sm shadow-sm hidden md:flex"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>

          {/* Categories */}
          <div
            ref={scrollRef}
            className="flex gap-4 md:gap-6 overflow-x-auto scrollbar-hide px-2 md:px-8 snap-x snap-mandatory"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {categories.map((category) => (
              <Link
                key={category.slug}
                to={`/collections/${category.slug}`}
                className="flex-shrink-0 group snap-start"
              >
                <div className="flex flex-col items-center gap-2">
                  {/* Circular Icon Container */}
                  <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-secondary/50 border-2 border-transparent group-hover:border-primary flex items-center justify-center transition-all duration-300 group-hover:shadow-gold">
                    <span className="text-2xl md:text-3xl">{category.icon}</span>
                  </div>
                  {/* Category Name */}
                  <span className="text-xs md:text-sm font-medium text-center whitespace-nowrap group-hover:text-primary transition-colors">
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
