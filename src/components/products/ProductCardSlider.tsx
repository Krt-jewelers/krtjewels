import { useState, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { cld } from '@/lib/imageOptim';

interface ProductCardSliderProps {
  images: string[];
  productName: string;
}

export function ProductCardSlider({ images, productName }: ProductCardSliderProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovering, setIsHovering] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);
  const [loadedImages, setLoadedImages] = useState<Set<number>>(new Set());
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);

  const hasMultipleImages = images.length > 1;
  const mountedIndices = new Set([
    0,
    ...(hasInteracted ? [currentIndex, (currentIndex + 1) % images.length, (currentIndex - 1 + images.length) % images.length] : []),
  ]);

  const goToNext = (e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    if (hasMultipleImages) {
      setCurrentIndex((prev) => (prev + 1) % images.length);
    }
  };

  const goToPrevious = (e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    if (hasMultipleImages) {
      setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    touchEndX.current = e.changedTouches[0].clientX;
    const diff = touchStartX.current - touchEndX.current;
    
    if (Math.abs(diff) > 50) {
      if (diff > 0) {
        goToNext();
      } else {
        goToPrevious();
      }
    }
  };

  return (
    <div
      className="relative w-full h-full overflow-hidden"
      onMouseEnter={() => {
        setIsHovering(true);
        setHasInteracted(true);
      }}
      onMouseLeave={() => setIsHovering(false)}
      onTouchStart={(e) => {
        setHasInteracted(true);
        handleTouchStart(e);
      }}
      onTouchEnd={handleTouchEnd}
    >
      {/* Images container */}
      <div 
        className="flex transition-transform duration-300 ease-out h-full"
        style={{ transform: `translateX(-${currentIndex * 100}%)` }}
      >
        {images.map((image, index) => {
          if (!mountedIndices.has(index)) {
            return <div key={index} className="w-full h-full flex-shrink-0 bg-muted" aria-hidden="true" />;
          }

          const isLoaded = loadedImages.has(index);
          return (
            <div key={index} className="relative w-full h-full flex-shrink-0 bg-muted">
              {!isLoaded && <div className="absolute inset-0 animate-pulse bg-muted" aria-hidden="true" />}
              <img
                src={cld(image, { w: 500, quality: 'auto', crop: 'fill' }) || '/placeholder.svg'}
                alt={`${productName} ${index + 1}`}
                className={cn('relative w-full h-full object-cover transition-opacity duration-300', isLoaded ? 'opacity-100' : 'opacity-0')}
                loading={index === 0 ? 'eager' : 'lazy'}
                decoding="async"
                onLoad={() => setLoadedImages((previous) => new Set(previous).add(index))}
              />
            </div>
          );
        })}
      </div>

      {/* Navigation arrows */}
      {hasMultipleImages && isHovering && (
        <>
          <button
            onClick={goToPrevious}
            className="absolute left-1 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-white/90 shadow-md flex items-center justify-center hover:bg-white transition-colors z-10"
          >
            <ChevronLeft className="w-4 h-4 text-foreground" />
          </button>
          <button
            onClick={goToNext}
            className="absolute right-1 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-white/90 shadow-md flex items-center justify-center hover:bg-white transition-colors z-10"
          >
            <ChevronRight className="w-4 h-4 text-foreground" />
          </button>
        </>
      )}

      {/* Dots indicator */}
      {hasMultipleImages && (
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1 z-10">
          {images.slice(0, 5).map((_, index) => (
            <button
              key={index}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setCurrentIndex(index);
              }}
              className={cn(
                'w-1.5 h-1.5 rounded-full transition-all',
                index === currentIndex
                  ? 'bg-white w-3'
                  : 'bg-white/60 hover:bg-white/80'
              )}
            />
          ))}
          {images.length > 5 && (
            <span className="text-white text-[10px] leading-none">+{images.length - 5}</span>
          )}
        </div>
      )}
    </div>
  );
}
