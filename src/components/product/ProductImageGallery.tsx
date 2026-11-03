import { useState, useEffect, useRef, useCallback, memo } from 'react';
import { Play, Sparkles, Star, Gem, ZoomIn } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { cld } from '@/lib/imageOptim';

interface ProductImageGalleryProps {
  images: string[];
  productName: string;
  videoUrl?: string | null;
  variationImageUrl?: string | null;
  badges?: {
    isNewArrival?: boolean;
    isBestseller?: boolean;
    isBridal?: boolean;
  };
  onOpenLightbox: (index: number) => void;
}

interface LensImageProps {
  src: string;
  alt: string;
  priority?: boolean;
  showZoomHint?: boolean;
}

const LensImage = memo(function LensImage({ 
  src, 
  alt, 
  priority = false,
  showZoomHint = false 
}: LensImageProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [lens, setLens] = useState({ x: 50, y: 50, visible: false });
  const [isDragging, setIsDragging] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [imgSrc, setImgSrc] = useState(src);
  const lensSize = 160;

  useEffect(() => {
    setImgSrc(src);
    setIsLoaded(false);
  }, [src]);

  const updateLensFromPoint = useCallback((clientX: number, clientY: number) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = Math.min(Math.max(clientX - rect.left, 0), rect.width);
    const y = Math.min(Math.max(clientY - rect.top, 0), rect.height);

    setLens({
      x: (x / rect.width) * 100,
      y: (y / rect.height) * 100,
      visible: true,
    });
  }, []);

  const hideLens = useCallback(() => {
    setIsDragging(false);
    setLens((prev) => ({ ...prev, visible: false }));
  }, []);

  const imgRefCallback = useCallback((img: HTMLImageElement | null) => {
    if (img && img.complete && img.naturalWidth > 0) {
      setIsLoaded(true);
    }
  }, []);

  const optimizedSrc = cld(imgSrc, { w: 700, quality: 'auto', crop: 'fit' }) || '/placeholder.svg';

  return (
    <div
      ref={containerRef}
      className={cn(
        'relative w-full h-full overflow-hidden select-none',
        // High-contrast luxury framing: warm subtle backdrop, crisp border, soft shadow
        'bg-[#FAF8F5] dark:bg-stone-900/60 border border-stone-200/90 dark:border-stone-800 rounded-2xl shadow-sm transition-all duration-300 hover:shadow-md hover:border-primary/50',
        isDragging ? 'cursor-grabbing' : 'cursor-crosshair'
      )}
      onPointerEnter={(e) => updateLensFromPoint(e.clientX, e.clientY)}
      onPointerMove={(e) => updateLensFromPoint(e.clientX, e.clientY)}
      onPointerDown={(e) => {
        e.preventDefault();
        setIsDragging(true);
        updateLensFromPoint(e.clientX, e.clientY);
      }}
      onPointerUp={() => setIsDragging(false)}
      onPointerCancel={hideLens}
      onPointerLeave={hideLens}
    >
      {!isLoaded && (
        <div className="absolute inset-0 animate-pulse bg-muted/70" aria-hidden="true" />
      )}

      <img
        ref={imgRefCallback}
        src={optimizedSrc}
        alt={alt}
        className={cn(
          'relative w-full h-full object-contain p-4 will-change-transform transition-all duration-300',
          isLoaded ? 'opacity-100' : 'opacity-0',
          lens.visible ? 'scale-[1.95]' : 'scale-100'
        )}
        loading={priority ? 'eager' : 'lazy'}
        fetchPriority={priority ? 'high' : 'low'}
        decoding="async"
        onLoad={() => setIsLoaded(true)}
        onError={() => {
          if (imgSrc !== '/placeholder.svg') {
            setImgSrc('/placeholder.svg');
          }
          setIsLoaded(true);
        }}
        style={{
          transformOrigin: `${lens.x}% ${lens.y}%`,
          transition: lens.visible ? 'transform 80ms linear' : 'transform 300ms ease',
        }}
        draggable={false}
      />

      {/* Floating Zoom Hint (hides during active zoom) */}
      {showZoomHint && !lens.visible && (
        <div className="absolute bottom-3 right-3 pointer-events-none transition-opacity duration-200 opacity-90 group-hover:opacity-100">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-background/90 text-foreground/80 shadow-sm border border-border/60 backdrop-blur-sm">
            <ZoomIn className="w-3.5 h-3.5 text-primary" />
            <span>Hover to zoom</span>
          </span>
        </div>
      )}

      {/* High-Contrast Luxury Magnifying Lens */}
      {lens.visible && (
        <div
          className="pointer-events-none absolute rounded-full border-2 border-primary bg-primary/5 shadow-2xl ring-2 ring-background/90 backdrop-contrast-125"
          style={{
            width: `${lensSize}px`,
            height: `${lensSize}px`,
            left: `calc(${lens.x}% - ${lensSize / 2}px)`,
            top: `calc(${lens.y}% - ${lensSize / 2}px)`,
          }}
        />
      )}
    </div>
  );
});

export function ProductImageGallery({
  images,
  productName,
  videoUrl,
  variationImageUrl,
  badges,
  onOpenLightbox,
}: ProductImageGalleryProps) {
  const [selectedImage, setSelectedImage] = useState(0);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [mobileScale, setMobileScale] = useState(1);
  const [mobileTranslate, setMobileTranslate] = useState({ x: 0, y: 0 });
  const pinchStartRef = useRef<{ distance: number; scale: number } | null>(null);
  const panStartRef = useRef<{ x: number; y: number; startX: number; startY: number } | null>(null);
  const isGestureRef = useRef(false);

  const displayImages = variationImageUrl
    ? [variationImageUrl, ...images.filter((img) => img !== variationImageUrl)]
    : images;

  useEffect(() => {
    setSelectedImage(0);
    setMobileScale(1);
    setMobileTranslate({ x: 0, y: 0 });
  }, [variationImageUrl]);

  useEffect(() => {
    setMobileScale(1);
    setMobileTranslate({ x: 0, y: 0 });
  }, [selectedImage]);

  const mediaItems: Array<{ type: 'image' | 'video'; url: string; index?: number }> = [
    ...(videoUrl ? [{ type: 'video' as const, url: videoUrl }] : []),
    ...displayImages.map((url, index) => ({ type: 'image' as const, url, index })),
  ];

  return (
    <div className="space-y-4">
      {/* Mobile Single Image Carousel */}
      <div className="block md:hidden">
        <div
          className="relative aspect-square rounded-2xl overflow-hidden bg-[#FAF8F5] dark:bg-stone-900/60 border border-stone-200/90 dark:border-stone-800 shadow-sm group"
          style={{ touchAction: 'none' }}
          onTouchStart={(e) => {
            if (e.touches.length === 2) {
              const t1 = e.touches[0];
              const t2 = e.touches[1];
              const dx = t1.clientX - t2.clientX;
              const dy = t1.clientY - t2.clientY;
              pinchStartRef.current = { distance: Math.hypot(dx, dy), scale: mobileScale };
              panStartRef.current = null;
              isGestureRef.current = true;
              return;
            }
            if (e.touches.length === 1) {
              setTouchStartX(e.touches[0]?.clientX ?? null);
              if (mobileScale > 1) {
                panStartRef.current = {
                  x: e.touches[0].clientX,
                  y: e.touches[0].clientY,
                  startX: mobileTranslate.x,
                  startY: mobileTranslate.y,
                };
                isGestureRef.current = true;
              } else {
                isGestureRef.current = false;
              }
            }
          }}
          onTouchMove={(e) => {
            if (e.touches.length === 2 && pinchStartRef.current) {
              e.preventDefault();
              const t1 = e.touches[0];
              const t2 = e.touches[1];
              const dx = t1.clientX - t2.clientX;
              const dy = t1.clientY - t2.clientY;
              const distance = Math.hypot(dx, dy);
              const nextScale = Math.min(3, Math.max(1, (distance / pinchStartRef.current.distance) * pinchStartRef.current.scale));
              setMobileScale(nextScale);
              return;
            }
            if (e.touches.length === 1 && panStartRef.current && mobileScale > 1) {
              e.preventDefault();
              const touch = e.touches[0];
              const dx = touch.clientX - panStartRef.current.x;
              const dy = touch.clientY - panStartRef.current.y;
              setMobileTranslate({
                x: panStartRef.current.startX + dx,
                y: panStartRef.current.startY + dy,
              });
            }
          }}
          onTouchEnd={(e) => {
            pinchStartRef.current = null;
            panStartRef.current = null;
            if (mobileScale > 1 || isGestureRef.current) {
              setTouchStartX(null);
              isGestureRef.current = false;
              return;
            }
            if (touchStartX == null) return;
            const endX = e.changedTouches[0]?.clientX ?? touchStartX;
            const delta = touchStartX - endX;
            const threshold = 40;
            if (Math.abs(delta) > threshold) {
              if (delta > 0) {
                setSelectedImage((prev) => (prev === displayImages.length - 1 ? 0 : prev + 1));
              } else {
                setSelectedImage((prev) => (prev === 0 ? displayImages.length - 1 : prev - 1));
              }
            } else {
              onOpenLightbox(selectedImage);
            }
            setTouchStartX(null);
          }}
          onTouchCancel={() => {
            pinchStartRef.current = null;
            panStartRef.current = null;
            setTouchStartX(null);
            isGestureRef.current = false;
          }}
          onClick={() => onOpenLightbox(selectedImage)}
        >
          <img
            src={cld(displayImages[selectedImage], { w: 700, quality: 'auto', crop: 'fit' }) || '/placeholder.svg'}
            alt={`${productName} - Image ${selectedImage + 1}`}
            className="w-full h-full object-contain p-4 transition-transform duration-500 group-hover:scale-105"
            loading="eager"
            decoding="async"
            style={{
              transform: `translate3d(${mobileTranslate.x}px, ${mobileTranslate.y}px, 0) scale(${mobileScale})`,
              transformOrigin: 'center',
              transition: isGestureRef.current ? 'none' : undefined,
            }}
            draggable={false}
          />

          {selectedImage === 0 && (
            <div className="absolute top-3 left-3 flex items-center gap-2">
              {badges?.isNewArrival && (
                <Badge className="badge-luxury w-8 h-8 p-0 rounded-full flex items-center justify-center" title="New Arrival">
                  <Sparkles className="w-4 h-4" />
                </Badge>
              )}
              {badges?.isBestseller && (
                <Badge className="bg-accent text-accent-foreground w-8 h-8 p-0 rounded-full flex items-center justify-center" title="Bestseller">
                  <Star className="w-4 h-4" />
                </Badge>
              )}
              {badges?.isBridal && (
                <Badge className="bg-maroon text-ivory w-8 h-8 p-0 rounded-full flex items-center justify-center" title="Bridal">
                  <Gem className="w-4 h-4" />
                </Badge>
              )}
            </div>
          )}
        </div>

        {displayImages.length > 1 && (
          <div className="mt-3 flex items-center justify-center gap-2">
            {displayImages.map((_, index) => (
              <button
                key={`dot-${index}`}
                type="button"
                aria-label={`Go to image ${index + 1}`}
                onClick={() => setSelectedImage(index)}
                className={cn(
                  'h-2 w-2 rounded-full transition-colors',
                  selectedImage === index ? 'bg-primary w-4' : 'bg-stone-300 dark:bg-stone-700'
                )}
              />
            ))}
          </div>
        )}
      </div>

      {/* Desktop Gallery Grid */}
      {mediaItems.length === 1 && mediaItems[0]?.type === 'image' ? (
        <div
          role="button"
          tabIndex={0}
          className="hidden md:block relative aspect-square rounded-2xl overflow-hidden group cursor-crosshair"
          onClick={() => onOpenLightbox(mediaItems[0]?.index ?? 0)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              onOpenLightbox(mediaItems[0]?.index ?? 0);
            }
          }}
        >
          <LensImage
            src={mediaItems[0]?.url || '/placeholder.svg'}
            alt={`${productName} - Image 1`}
            priority
            showZoomHint
          />
          <div className="absolute top-3 left-3 flex items-center gap-2 pointer-events-none">
            {badges?.isNewArrival && (
              <Badge className="badge-luxury w-8 h-8 p-0 rounded-full flex items-center justify-center" title="New Arrival">
                <Sparkles className="w-4 h-4" />
              </Badge>
            )}
            {badges?.isBestseller && (
              <Badge className="bg-accent text-accent-foreground w-8 h-8 p-0 rounded-full flex items-center justify-center" title="Bestseller">
                <Star className="w-4 h-4" />
              </Badge>
            )}
            {badges?.isBridal && (
              <Badge className="bg-maroon text-ivory w-8 h-8 p-0 rounded-full flex items-center justify-center" title="Bridal">
                <Gem className="w-4 h-4" />
              </Badge>
            )}
          </div>
        </div>
      ) : (
        <div className="hidden md:grid grid-cols-1 sm:grid-cols-2 gap-4">
          {mediaItems.map((item, idx) => {
            if (item.type === 'video') {
              return (
                <div
                  key={`video-${idx}`}
                  className="relative aspect-square rounded-2xl overflow-hidden bg-[#FAF8F5] dark:bg-stone-900/60 border border-stone-200/90 dark:border-stone-800 shadow-sm"
                >
                  <div className="absolute inset-0 flex items-center justify-center bg-black/10 z-10 pointer-events-none">
                    <div className="bg-white/90 rounded-full p-3 shadow-lg">
                      <Play className="w-5 h-5 text-foreground" />
                    </div>
                  </div>
                  <video
                    src={item.url}
                    className="w-full h-full object-contain p-2"
                    controls
                    playsInline
                  />
                </div>
              );
            }

            const imageIndex = item.index ?? 0;
            const isPriority = idx < 2;

            return (
              <div
                key={`image-${imageIndex}`}
                role="button"
                tabIndex={0}
                className="relative aspect-square rounded-2xl overflow-hidden group cursor-crosshair"
                onClick={() => {
                  setSelectedImage(imageIndex);
                  onOpenLightbox(imageIndex);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setSelectedImage(imageIndex);
                    onOpenLightbox(imageIndex);
                  }
                }}
              >
                <LensImage
                  src={item.url || '/placeholder.svg'}
                  alt={`${productName} - Image ${imageIndex + 1}`}
                  priority={isPriority}
                  showZoomHint={idx === 0}
                />
                {imageIndex === 0 && (
                  <div className="absolute top-3 left-3 flex items-center gap-2 pointer-events-none">
                    {badges?.isNewArrival && (
                      <Badge className="badge-luxury w-8 h-8 p-0 rounded-full flex items-center justify-center" title="New Arrival">
                        <Sparkles className="w-4 h-4" />
                      </Badge>
                    )}
                    {badges?.isBestseller && (
                      <Badge className="bg-accent text-accent-foreground w-8 h-8 p-0 rounded-full flex items-center justify-center" title="Bestseller">
                        <Star className="w-4 h-4" />
                      </Badge>
                    )}
                    {badges?.isBridal && (
                      <Badge className="bg-maroon text-ivory w-8 h-8 p-0 rounded-full flex items-center justify-center" title="Bridal">
                        <Gem className="w-4 h-4" />
                      </Badge>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
