import { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { cld } from '@/lib/imageOptim';

// Static fallback imports
import heroSlide1 from '@/assets/hero-slide-1.png';
import heroSlide1Mobile from '@/assets/hero-slide-1-mobile.jpg';
import heroSlide2 from '@/assets/hero-slide-2.png';
import heroSlide2Mobile from '@/assets/hero-slide-2-mobile.png';
import heroSlide3 from '@/assets/hero-slide-3.png';
import heroSlide3Mobile from '@/assets/hero-slide-3-mobile.png';
import heroSlide4 from '@/assets/hero-slide-4.png';
import heroSlide4Mobile from '@/assets/hero-slide-4-mobile.png';
import heroSlide5 from '@/assets/hero-slide-5.png';
import heroSlide5Mobile from '@/assets/hero-slide-5-mobile.png';

interface Slide {
  id: string;
  desktop: string;
  mobile: string;
  alt: string;
  href: string;
}

const fallbackSlides: Slide[] = [
  { id: '1', desktop: heroSlide1, mobile: heroSlide1Mobile, alt: 'KRT Jewellery – Timeless. Graceful. Distinctive.', href: '/shop' },
  { id: '2', desktop: heroSlide2, mobile: heroSlide2Mobile, alt: 'KRT Jewellery – Elevate your style with intricate chokers.', href: '/shop' },
  { id: '3', desktop: heroSlide3, mobile: heroSlide3Mobile, alt: 'KRT Jewellery – Timeless Gold. Exquisite Diamonds.', href: '/shop' },
  { id: '4', desktop: heroSlide4, mobile: heroSlide4Mobile, alt: 'KRT Jewellery – Heritage. Tradition. Legacy.', href: '/shop' },
  { id: '5', desktop: heroSlide5, mobile: heroSlide5Mobile, alt: 'KRT Jewellery – Sparkle. Shine. Celebrate.', href: '/shop' },
];

export function HeroCarousel() {
  const [slides, setSlides] = useState<Slide[]>(fallbackSlides);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [loadedSlides, setLoadedSlides] = useState<Set<string>>(new Set());

  // Fetch dynamic slides from DB
  useEffect(() => {
    const fetchSlides = async () => {
      const { data, error } = await supabase
        .from('hero_slides')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true });

      if (!error && data && data.length > 0) {
        setSlides(data.map((s: any) => ({
          id: s.id,
          desktop: s.desktop_image_url,
          mobile: s.mobile_image_url || s.desktop_image_url,
          alt: s.alt_text || 'KRT Jewellery',
          href: s.link_url || '/shop',
        })));
      }
      // If no DB slides, keep fallback
    };
    fetchSlides();
  }, []);

  const goToSlide = useCallback((index: number) => {
    if (isAnimating) return;
    setIsAnimating(true);
    setCurrentSlide(index);
    setTimeout(() => setIsAnimating(false), 700);
  }, [isAnimating]);

  const nextSlide = useCallback(() => {
    goToSlide((currentSlide + 1) % slides.length);
  }, [currentSlide, goToSlide, slides.length]);

  const prevSlide = useCallback(() => {
    goToSlide((currentSlide - 1 + slides.length) % slides.length);
  }, [currentSlide, goToSlide, slides.length]);

  useEffect(() => {
    const timer = setInterval(nextSlide, 5000);
    return () => clearInterval(timer);
  }, [nextSlide]);

  if (slides.length === 0) return null;

  return (
    <section className="relative w-full overflow-hidden bg-background">
      <div className="relative w-full aspect-[9/14] md:aspect-[16/6]">
        <div className="absolute inset-0">
          {slides.map((slide, index) => (
            <Link
              key={slide.id}
              to={slide.href}
              className={`absolute inset-0 transition-opacity duration-700 ${
                index === currentSlide ? 'opacity-100 z-10' : 'opacity-0 z-0'
              }`}
              aria-hidden={index !== currentSlide}
            >
              {/* Desktop image */}
              <img
                src={cld(slide.desktop, { w: 1920, quality: 'auto', crop: 'fill' })}
                alt={slide.alt}
                loading={index === 0 ? 'eager' : 'lazy'}
                fetchPriority={index === currentSlide ? 'high' : 'auto'}
                decoding="async"
                onLoad={() => setLoadedSlides((previous) => new Set(previous).add(`${slide.id}-desktop`))}
                className={`hidden md:block w-full h-full object-cover object-center transition-opacity duration-300 ${loadedSlides.has(`${slide.id}-desktop`) ? 'opacity-100' : 'opacity-0'}`}
              />
              {/* Mobile image */}
              <img
                src={cld(slide.mobile, { w: 768, quality: 'auto', crop: 'fill' })}
                alt={slide.alt}
                loading={index === 0 ? 'eager' : 'lazy'}
                fetchPriority={index === currentSlide ? 'high' : 'auto'}
                decoding="async"
                onLoad={() => setLoadedSlides((previous) => new Set(previous).add(`${slide.id}-mobile`))}
                className={`block md:hidden w-full h-full object-cover object-top transition-opacity duration-300 ${loadedSlides.has(`${slide.id}-mobile`) ? 'opacity-100' : 'opacity-0'}`}
              />
              {!loadedSlides.has(`${slide.id}-desktop`) && !loadedSlides.has(`${slide.id}-mobile`) && (
                <div className="absolute inset-0 animate-pulse bg-muted" aria-hidden="true" />
              )}
            </Link>
          ))}
        </div>
      </div>

      {/* Navigation Arrows */}
      <button
        onClick={prevSlide}
        className="absolute left-3 md:left-6 top-1/2 -translate-y-1/2 z-20 w-9 h-9 md:w-11 md:h-11 rounded-full bg-background/30 backdrop-blur-sm border border-foreground/10 flex items-center justify-center text-foreground/70 hover:bg-background/50 transition-colors"
        aria-label="Previous slide"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>
      <button
        onClick={nextSlide}
        className="absolute right-3 md:right-6 top-1/2 -translate-y-1/2 z-20 w-9 h-9 md:w-11 md:h-11 rounded-full bg-background/30 backdrop-blur-sm border border-foreground/10 flex items-center justify-center text-foreground/70 hover:bg-background/50 transition-colors"
        aria-label="Next slide"
      >
        <ChevronRight className="w-5 h-5" />
      </button>

      {/* Slide Indicators */}
      <div className="absolute bottom-4 md:bottom-6 left-1/2 -translate-x-1/2 z-20 flex gap-2.5">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              index === currentSlide
                ? 'w-8 md:w-10 bg-primary'
                : 'w-4 md:w-5 bg-foreground/25 hover:bg-foreground/40'
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </section>
  );
}
