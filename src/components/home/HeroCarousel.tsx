import { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

const slides = [
  {
    id: 1,
    title: 'Timeless Elegance',
    subtitle: 'Wedding Collection 2025',
    description: 'Discover our exquisite bridal sets, handcrafted with love and tradition for your most special day.',
    image: 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=1920&h=1080&fit=crop',
    cta: { text: 'Explore Bridal', href: '/collections/wedding-bridal' },
  },
  {
    id: 2,
    title: 'Pure Gold Craftsmanship',
    subtitle: '22K Gold Collection',
    description: 'Every piece tells a story of heritage and mastery, passed down through generations of master artisans.',
    image: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=1920&h=1080&fit=crop',
    cta: { text: 'Shop Gold', href: '/collections/necklaces' },
  },
  {
    id: 3,
    title: 'Diamond Dreams',
    subtitle: 'Certified Diamond Jewellery',
    description: 'Brilliant cuts, exceptional clarity. Our diamonds are hand-selected for their unmatched brilliance.',
    image: 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=1920&h=1080&fit=crop',
    cta: { text: 'View Diamonds', href: '/collections/diamond-jewellery' },
  },
];

export function HeroCarousel() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  const goToSlide = useCallback((index: number) => {
    if (isAnimating) return;
    setIsAnimating(true);
    setCurrentSlide(index);
    setTimeout(() => setIsAnimating(false), 700);
  }, [isAnimating]);

  const nextSlide = useCallback(() => {
    goToSlide((currentSlide + 1) % slides.length);
  }, [currentSlide, goToSlide]);

  const prevSlide = useCallback(() => {
    goToSlide((currentSlide - 1 + slides.length) % slides.length);
  }, [currentSlide, goToSlide]);

  useEffect(() => {
    const timer = setInterval(nextSlide, 6000);
    return () => clearInterval(timer);
  }, [nextSlide]);

  const slide = slides[currentSlide];

  return (
    <section className="relative h-[70vh] md:h-[85vh] overflow-hidden">
      {/* Background Images */}
      {slides.map((s, index) => (
        <div
          key={s.id}
          className={`absolute inset-0 transition-opacity duration-700 ${
            index === currentSlide ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <div 
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${s.image})` }}
          />
          {/* Overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-rich-black/80 via-rich-black/50 to-transparent" />
        </div>
      ))}

      {/* Content */}
      <div className="relative h-full container mx-auto px-4 flex items-center">
        <div className="max-w-2xl">
          <span 
            key={`subtitle-${currentSlide}`}
            className="inline-block text-gold-light text-sm md:text-base uppercase tracking-[0.3em] mb-4 animate-fade-in-up"
          >
            {slide.subtitle}
          </span>
          
          <h1 
            key={`title-${currentSlide}`}
            className="font-serif text-4xl md:text-6xl lg:text-7xl text-ivory font-semibold mb-6 animate-fade-in-up text-shadow-luxury"
            style={{ animationDelay: '100ms' }}
          >
            {slide.title}
          </h1>
          
          <p 
            key={`desc-${currentSlide}`}
            className="text-ivory/80 text-lg md:text-xl mb-8 max-w-lg animate-fade-in-up"
            style={{ animationDelay: '200ms' }}
          >
            {slide.description}
          </p>
          
          <div 
            key={`cta-${currentSlide}`}
            className="flex gap-4 animate-fade-in-up"
            style={{ animationDelay: '300ms' }}
          >
            <Link to={slide.cta.href}>
              <Button className="btn-premium text-lg px-8 py-6">
                {slide.cta.text}
              </Button>
            </Link>
            <Link to="/gold-rate">
              <Button 
                variant="outline" 
                className="text-lg px-8 py-6 border-2 border-ivory/30 text-ivory hover:bg-ivory/10 hover:border-ivory/50"
              >
                Gold Rate
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Navigation Arrows */}
      <button
        onClick={prevSlide}
        className="absolute left-4 md:left-8 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-ivory/10 backdrop-blur-sm border border-ivory/20 flex items-center justify-center text-ivory hover:bg-ivory/20 transition-colors"
        aria-label="Previous slide"
      >
        <ChevronLeft className="w-6 h-6" />
      </button>
      <button
        onClick={nextSlide}
        className="absolute right-4 md:right-8 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-ivory/10 backdrop-blur-sm border border-ivory/20 flex items-center justify-center text-ivory hover:bg-ivory/20 transition-colors"
        aria-label="Next slide"
      >
        <ChevronRight className="w-6 h-6" />
      </button>

      {/* Slide Indicators */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-3">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              index === currentSlide 
                ? 'w-12 bg-primary' 
                : 'w-6 bg-ivory/40 hover:bg-ivory/60'
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-8 right-8 hidden md:flex flex-col items-center gap-2 text-ivory/60 text-xs">
        <span className="writing-vertical tracking-widest uppercase">Scroll</span>
        <div className="w-px h-12 bg-ivory/30 relative overflow-hidden">
          <div className="absolute top-0 w-full h-1/2 bg-ivory animate-[pulse_1.5s_ease-in-out_infinite]" />
        </div>
      </div>
    </section>
  );
}
