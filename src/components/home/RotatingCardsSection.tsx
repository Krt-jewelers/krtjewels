import { useEffect, useRef, useState } from 'react';

const showcaseItems = [
  {
    id: 1,
    image: 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=500&h=600&fit=crop',
    title: 'Diamond Necklace',
    subtitle: 'Timeless Elegance',
  },
  {
    id: 2,
    image: 'https://images.unsplash.com/photo-1602173574767-37ac01994b2a?w=500&h=600&fit=crop',
    title: 'Gold Bangles',
    subtitle: 'Traditional Beauty',
  },
  {
    id: 3,
    image: 'https://images.unsplash.com/photo-1603561591411-07134e71a2a9?w=500&h=600&fit=crop',
    title: 'Wedding Sets',
    subtitle: 'Bridal Collection',
  },
  {
    id: 4,
    image: 'https://images.unsplash.com/photo-1611652022419-a9419f74343d?w=500&h=600&fit=crop',
    title: 'Pearl Earrings',
    subtitle: 'Classic Charm',
  },
  {
    id: 5,
    image: 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=500&h=600&fit=crop',
    title: 'Temple Jewellery',
    subtitle: 'Divine Grace',
  },
];

export function RotatingCardsSection() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      if (!containerRef.current) return;
      
      const rect = containerRef.current.getBoundingClientRect();
      const windowHeight = window.innerHeight;
      const sectionHeight = rect.height;
      
      // Calculate progress: 0 when section enters viewport, 1 when it exits
      const progress = Math.max(0, Math.min(1, 
        (windowHeight - rect.top) / (windowHeight + sectionHeight)
      ));
      
      setScrollProgress(progress);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // Initial calculation
    
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const getCardStyle = (index: number) => {
    const totalCards = showcaseItems.length;
    const centerIndex = Math.floor(totalCards / 2);
    const distanceFromCenter = index - centerIndex;
    
    // Calculate horizontal spread that moves with scroll (left to right and back)
    // scrollProgress goes from 0 to 1, so we make it oscillate between -1 and 1
    const scrollOffset = (scrollProgress - 0.5) * 2; // -1 to 1
    
    // Base horizontal position from center
    const baseSpread = distanceFromCenter * 140;
    
    // Dynamic horizontal movement based on scroll (moves all cards left/right)
    const scrollMovement = scrollOffset * 200;
    
    // Base rotation based on position
    const baseRotation = distanceFromCenter * 8;
    
    // Scroll-based rotation that changes as you scroll
    const scrollRotation = scrollOffset * distanceFromCenter * 6;
    
    // Final rotation combines base and scroll
    const rotation = baseRotation + scrollRotation;
    
    // Scale based on distance from center - cards further out are slightly smaller
    const scale = 1 - Math.abs(distanceFromCenter) * 0.05;
    
    // Z-index for proper stacking - center card on top
    const zIndex = totalCards - Math.abs(distanceFromCenter);
    
    return {
      transform: `translateX(${baseSpread + scrollMovement}px) rotate(${rotation}deg) scale(${scale})`,
      zIndex,
      opacity: 1 - Math.abs(distanceFromCenter) * 0.1,
    };
  };

  return (
    <section 
      ref={containerRef}
      className="py-20 md:py-32 bg-gradient-to-b from-secondary/20 via-background to-secondary/30 overflow-hidden w-full"
    >
      <div className="w-full px-4">
        {/* Header */}
        <div className="text-center mb-16 container mx-auto">
          <span className="inline-flex items-center gap-2 text-primary text-sm uppercase tracking-[0.3em] font-medium mb-3">
            <span className="w-8 h-px bg-primary" />
            Our Showcase
            <span className="w-8 h-px bg-primary" />
          </span>
          <h2 className="font-serif text-4xl md:text-5xl font-semibold section-heading mb-6">
            Exquisite Artistry
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Each piece is a masterpiece, crafted with generations of expertise and adorned with the finest materials.
          </p>
        </div>

        {/* Rotating Cards - Full Width */}
        <div className="relative h-[500px] md:h-[600px] flex items-center justify-center w-full">
          {showcaseItems.map((item, index) => (
            <div
              key={item.id}
              className="absolute transition-all duration-500 ease-out cursor-pointer group"
              style={getCardStyle(index)}
            >
              <div className="w-48 sm:w-56 md:w-64 lg:w-72 aspect-[3/4] rounded-2xl overflow-hidden shadow-luxury bg-card border border-border/50">
                <div className="relative h-full">
                  <img
                    src={item.image}
                    alt={item.title}
                    loading="lazy"
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-rich-black/80 via-transparent to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-5 text-ivory">
                    <p className="text-primary text-xs uppercase tracking-wider mb-1">
                      {item.subtitle}
                    </p>
                    <h3 className="font-serif text-lg md:text-xl font-semibold">
                      {item.title}
                    </h3>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
