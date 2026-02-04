import { useState } from 'react';
import { ChevronLeft, ChevronRight, ZoomIn, Play, Pause } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface ProductImageGalleryProps {
  images: string[];
  productName: string;
  badges?: {
    isNewArrival?: boolean;
    isBestseller?: boolean;
    isBridal?: boolean;
  };
  onOpenLightbox: (index: number) => void;
}

export function ProductImageGallery({
  images,
  productName,
  badges,
  onOpenLightbox,
}: ProductImageGalleryProps) {
  const [selectedImage, setSelectedImage] = useState(0);
  const [isHovering, setIsHovering] = useState(false);

  const handlePrev = () => {
    setSelectedImage((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setSelectedImage((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  return (
    <div className="space-y-4">
      {/* Main Image */}
      <div
        className="relative aspect-square rounded-2xl overflow-hidden bg-gradient-to-br from-secondary/50 to-secondary/20 cursor-zoom-in group"
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
        onClick={() => onOpenLightbox(selectedImage)}
      >
        <img
          src={images[selectedImage] || '/placeholder.svg'}
          alt={`${productName} - Image ${selectedImage + 1}`}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />

        {/* Hover Overlay */}
        <div className="absolute inset-0 bg-rich-black/0 group-hover:bg-rich-black/10 transition-colors flex items-center justify-center">
          <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 rounded-full p-4 shadow-lg">
            <ZoomIn className="w-6 h-6 text-foreground" />
          </div>
        </div>

        {/* Badges Overlay */}
        <div className="absolute top-4 left-4 flex flex-col gap-2">
          {badges?.isNewArrival && (
            <Badge className="badge-luxury">✨ New Arrival</Badge>
          )}
          {badges?.isBestseller && (
            <Badge className="bg-accent text-accent-foreground">🔥 Bestseller</Badge>
          )}
          {badges?.isBridal && (
            <Badge className="bg-maroon text-ivory">💍 Bridal</Badge>
          )}
        </div>

        {/* Navigation Arrows */}
        {images.length > 1 && (
          <>
            <Button
              variant="ghost"
              size="icon"
              className="absolute left-3 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={(e) => {
                e.stopPropagation();
                handlePrev();
              }}
            >
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-3 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={(e) => {
                e.stopPropagation();
                handleNext();
              }}
            >
              <ChevronRight className="w-5 h-5" />
            </Button>
          </>
        )}

        {/* Image Counter */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/50 text-white px-3 py-1 rounded-full text-sm">
          {selectedImage + 1} / {images.length}
        </div>
      </div>

      {/* Thumbnail Gallery */}
      {images.length > 1 && (
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-luxury">
          {images.map((image, index) => (
            <button
              key={index}
              onClick={() => setSelectedImage(index)}
              className={cn(
                'flex-shrink-0 w-20 h-20 md:w-24 md:h-24 rounded-xl overflow-hidden border-2 transition-all duration-300',
                selectedImage === index
                  ? 'border-primary ring-2 ring-primary/30 scale-105'
                  : 'border-transparent hover:border-primary/50'
              )}
            >
              <img src={image} alt="" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
