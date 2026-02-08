import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, ZoomIn, Play, Pause, RotateCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

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

// Helper to detect if a URL is a video
const isVideoUrl = (url: string): boolean => {
  if (!url) return false;
  const videoExtensions = ['.mp4', '.webm', '.ogg', '.mov'];
  const lowercaseUrl = url.toLowerCase();
  return videoExtensions.some(ext => lowercaseUrl.includes(ext)) || 
         lowercaseUrl.includes('youtube') || 
         lowercaseUrl.includes('vimeo');
};

export function ProductImageGallery({
  images,
  productName,
  videoUrl,
  variationImageUrl,
  badges,
  onOpenLightbox,
}: ProductImageGalleryProps) {
  const [selectedImage, setSelectedImage] = useState(0);

  // When a variation image is provided, show it as the displayed image
  const displayImages = variationImageUrl
    ? [variationImageUrl, ...images.filter(img => img !== variationImageUrl)]
    : images;
  const [isHovering, setIsHovering] = useState(false);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [showVideo, setShowVideo] = useState(false);

  // Reset to first image when variation image changes
  useEffect(() => {
    setSelectedImage(0);
    setShowVideo(false);
  }, [variationImageUrl]);

  const handlePrev = () => {
    setShowVideo(false);
    setSelectedImage((prev) => (prev === 0 ? displayImages.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setShowVideo(false);
    setSelectedImage((prev) => (prev === displayImages.length - 1 ? 0 : prev + 1));
  };

  const handleVideoToggle = () => {
    setShowVideo(true);
    setIsVideoPlaying(!isVideoPlaying);
  };

  const currentIsVideo = displayImages[selectedImage] && isVideoUrl(displayImages[selectedImage]);

  return (
    <div className="space-y-4">
      {/* Main Image */}
      <div
        className="relative aspect-square rounded-2xl overflow-hidden bg-gradient-to-br from-secondary/50 to-secondary/20 group"
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
      >
        {/* Show video if video tab is selected or current media is video */}
        {(showVideo && videoUrl) || currentIsVideo ? (
          <div className="w-full h-full flex items-center justify-center bg-rich-black">
            <video
              src={showVideo ? videoUrl! : displayImages[selectedImage]}
              className="w-full h-full object-contain"
              controls
              autoPlay={isVideoPlaying}
              loop
              playsInline
              onPlay={() => setIsVideoPlaying(true)}
              onPause={() => setIsVideoPlaying(false)}
            >
              Your browser does not support the video tag.
            </video>
          </div>
        ) : (
          <>
            <img
              src={displayImages[selectedImage] || '/placeholder.svg'}
              alt={`${productName} - Image ${selectedImage + 1}`}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 cursor-zoom-in"
              onClick={() => onOpenLightbox(selectedImage)}
            />

            {/* Hover Overlay */}
            <div 
              className="absolute inset-0 bg-rich-black/0 group-hover:bg-rich-black/10 transition-colors flex items-center justify-center pointer-events-none"
            >
              <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 rounded-full p-4 shadow-lg">
                <ZoomIn className="w-6 h-6 text-foreground" />
              </div>
            </div>
          </>
        )}

        {/* Video/360° Button - Only show if videoUrl exists */}
        {videoUrl && !showVideo && !currentIsVideo && (
          <div className="absolute top-4 right-4 z-10">
            <Button
              variant="secondary"
              size="sm"
              className="gap-2 bg-white/90 hover:bg-white shadow-lg"
              onClick={handleVideoToggle}
            >
              <RotateCw className="w-4 h-4" />
              360° View
            </Button>
          </div>
        )}

        {/* Back to Images button when video is playing */}
        {(showVideo || currentIsVideo) && (
          <div className="absolute top-4 right-4 z-10">
            <Button
              variant="secondary"
              size="sm"
              className="gap-2 bg-white/90 hover:bg-white shadow-lg"
              onClick={() => {
                setShowVideo(false);
                setIsVideoPlaying(false);
                if (currentIsVideo && displayImages.length > 1) {
                  const firstImageIndex = displayImages.findIndex(img => !isVideoUrl(img));
                  if (firstImageIndex >= 0) setSelectedImage(firstImageIndex);
                }
              }}
            >
              <ZoomIn className="w-4 h-4" />
              View Images
            </Button>
          </div>
        )}

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
        {displayImages.length > 1 && !showVideo && (
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
        {!showVideo && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/50 text-white px-3 py-1 rounded-full text-sm">
            {selectedImage + 1} / {displayImages.length}
            {videoUrl && ' • Video available'}
          </div>
        )}
      </div>

      {/* Thumbnail Gallery */}
      {displayImages.length > 1 && (
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-luxury">
          {/* Video thumbnail if video exists */}
          {videoUrl && (
            <button
              onClick={() => {
                setShowVideo(true);
                setIsVideoPlaying(true);
              }}
              className={cn(
                'flex-shrink-0 w-20 h-20 md:w-24 md:h-24 rounded-xl overflow-hidden border-2 transition-all duration-300 relative',
                showVideo
                  ? 'border-primary ring-2 ring-primary/30 scale-105'
                  : 'border-transparent hover:border-primary/50'
              )}
            >
              <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                <div className="bg-primary/90 rounded-full p-2">
                  <Play className="w-4 h-4 text-primary-foreground fill-current" />
                </div>
              </div>
              <span className="absolute bottom-1 left-1/2 -translate-x-1/2 text-[10px] font-medium text-foreground bg-white/80 px-1.5 rounded">
                360°
              </span>
            </button>
          )}
          
          {displayImages.map((image, index) => (
            <button
              key={index}
              onClick={() => {
                setShowVideo(false);
                setSelectedImage(index);
              }}
              className={cn(
                'flex-shrink-0 w-20 h-20 md:w-24 md:h-24 rounded-xl overflow-hidden border-2 transition-all duration-300 relative',
                selectedImage === index && !showVideo
                  ? 'border-primary ring-2 ring-primary/30 scale-105'
                  : 'border-transparent hover:border-primary/50'
              )}
            >
              {isVideoUrl(image) ? (
                <div className="w-full h-full bg-gradient-to-br from-secondary to-secondary/50 flex items-center justify-center">
                  <Play className="w-6 h-6 text-foreground/70" />
                </div>
              ) : (
                <img src={image} alt="" className="w-full h-full object-cover" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
