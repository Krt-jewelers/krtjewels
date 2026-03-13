import { Link } from 'react-router-dom';
import { useState } from 'react';
import { Heart, Sparkles, Star, Gem, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useWishlist } from '@/hooks/useWishlist';
import { useAuth } from '@/hooks/useAuth';
import { formatPrice } from '@/lib/types';
import { ProductCardSlider } from './ProductCardSlider';
import { AuthPromptModal } from '@/components/product/AuthPromptModal';
import { ProductQuickViewDialog } from './ProductQuickViewDialog';
import type { ProductWithPrice } from '@/lib/types';

interface ProductCardProps {
  product: ProductWithPrice;
}

export function ProductCard({ product }: ProductCardProps) {
  const { isInWishlist, toggleWishlist } = useWishlist();
  const { isAuthenticated } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isQuickViewOpen, setIsQuickViewOpen] = useState(false);
  const inWishlist = isInWishlist(product.id);
  const isOutOfStock = (product.stock_quantity ?? 1) <= 0;

  const handleToggleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isAuthenticated) {
      setShowAuthModal(true);
      return;
    }
    toggleWishlist(product.id);
  };

  const handleQuickView = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsQuickViewOpen(true);
  };

  const images = product.images.length > 0 ? product.images : ['/placeholder.svg'];

  return (
    <>
      <Link to={`/product/${product.slug}`} className="group block select-none h-full">
        <div className={`bg-card rounded-2xl overflow-hidden border border-border/50 hover:border-border/80 transition-colors select-none cursor-default h-full flex flex-col ${isOutOfStock ? 'opacity-75' : ''}`}>
          {/* Image Container with Slider */}
          <div className="relative aspect-[4/5] overflow-hidden bg-white">
            <ProductCardSlider images={images} productName={product.name} />

            <Button
              variant="secondary"
              size="sm"
              onClick={handleQuickView}
              className="absolute bottom-2 left-1/2 z-20 h-8 -translate-x-1/2 rounded-full border border-border bg-background/95 px-3 text-xs font-medium text-foreground shadow-sm transition md:opacity-0 md:group-hover:opacity-100"
            >
              <Eye className="mr-1.5 h-3.5 w-3.5" />
              Quick View
            </Button>
            
            {/* Out of Stock Overlay */}
            {isOutOfStock && (
              <div className="absolute inset-0 bg-rich-black/40 flex items-center justify-center z-20">
                <span className="bg-rich-black/80 text-ivory px-4 py-2 rounded-full text-sm font-semibold">
                  Out of Stock
                </span>
              </div>
            )}

            {/* Status Icons - Minimal */}
            <div className="absolute top-2 left-2 sm:top-3 sm:left-3 flex items-center gap-1.5 z-10">
              {product.is_new_arrival && (
                <div
                  className="w-7 h-7 sm:w-9 sm:h-9 rounded-full bg-white/90 text-foreground shadow-sm flex items-center justify-center"
                  title="New"
                >
                  <Sparkles className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                </div>
              )}
              {product.is_bestseller && (
                <div
                  className="w-7 h-7 sm:w-9 sm:h-9 rounded-full bg-white/90 text-foreground shadow-sm flex items-center justify-center"
                  title="Bestseller"
                >
                  <Star className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                </div>
              )}
              {product.is_bridal && (
                <div
                  className="w-7 h-7 sm:w-9 sm:h-9 rounded-full bg-white/90 text-foreground shadow-sm flex items-center justify-center"
                  title="Bridal"
                >
                  <Gem className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                </div>
              )}
            </div>

            {/* Wishlist - Minimal */}
            <Button
              variant="secondary"
              size="icon"
              onClick={handleToggleWishlist}
              className={`absolute top-2 right-2 sm:top-3 sm:right-3 w-7 h-7 sm:w-9 sm:h-9 rounded-full shadow-sm ${
                inWishlist 
                  ? 'bg-red-500 text-white hover:bg-red-600' 
                  : 'bg-white/90 hover:bg-white text-foreground'
              }`}
            >
              <Heart className={`w-3 h-3 sm:w-3.5 sm:h-3.5 ${inWishlist ? 'fill-current' : ''}`} />
            </Button>
          </div>

          {/* Content - Enhanced */}
          <div className="p-4 md:p-5 bg-white flex flex-col flex-1">
            {/* Name */}
            <h3 className="font-serif text-base md:text-lg font-medium text-foreground line-clamp-2 mb-3 leading-snug">
              {product.name}
            </h3>

            {/* Price & Action */}
            <div className="mt-auto">
              <p className="price-tag text-lg md:text-xl text-foreground font-semibold">
                {formatPrice(product.calculated_price.total)}
              </p>
            </div>
          </div>
        </div>
      </Link>

      <ProductQuickViewDialog
        open={isQuickViewOpen}
        onOpenChange={setIsQuickViewOpen}
        product={product}
      />

      {/* Auth Prompt Modal */}
      <AuthPromptModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        action="save items to your wishlist"
      />
    </>
  );
}

