import { Link } from 'react-router-dom';
import { Heart, Eye, Scale } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useWishlist } from '@/hooks/useWishlist';
import { useAuth } from '@/hooks/useAuth';
import { useProductComparison } from '@/hooks/useProductComparison';
import { formatPrice, METAL_TYPE_NAMES } from '@/lib/types';
import { ProductCardSlider } from './ProductCardSlider';
import { AddToCartButton } from '@/components/cart/AddToCartButton';
import { useToast } from '@/hooks/use-toast';
import type { ProductWithPrice } from '@/lib/types';

interface ProductCardProps {
  product: ProductWithPrice;
}

export function ProductCard({ product }: ProductCardProps) {
  const { isInWishlist, toggleWishlist } = useWishlist();
  const { isAuthenticated } = useAuth();
  const { addProduct, removeProduct, isInComparison } = useProductComparison();
  const { toast } = useToast();
  const inWishlist = isInWishlist(product.id);
  const inComparison = isInComparison(product.id);

  const handleToggleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleWishlist(product.id);
  };

  const handleToggleCompare = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (inComparison) {
      removeProduct(product.id);
      toast({ title: 'Removed from comparison' });
    } else {
      const added = addProduct(product);
      if (!added) {
        toast({ title: 'Limit reached', description: 'You can compare up to 3 products', variant: 'destructive' });
      } else {
        toast({ title: 'Added to comparison' });
      }
    }
  };

  const images = product.images.length > 0 ? product.images : ['/placeholder.svg'];

  return (
    <Link to={`/product/${product.slug}`} className="group block">
      <div className="card-luxury bg-card rounded-2xl overflow-hidden border border-border/50 hover:border-primary/30 transition-colors">
        {/* Image Container with Slider */}
        <div className="relative aspect-square overflow-hidden bg-gradient-to-br from-secondary/50 to-secondary/20">
          <ProductCardSlider images={images} productName={product.name} />
          
          {/* Badges - Premium styling */}
          <div className="absolute top-3 left-3 flex flex-col gap-2 z-10">
            {product.is_new_arrival && (
              <span className="inline-flex items-center px-3 py-1.5 text-xs font-semibold rounded-full bg-gradient-to-r from-primary to-gold-shimmer text-rich-black shadow-md">
                ✨ New
              </span>
            )}
            {product.is_bestseller && (
              <span className="inline-flex items-center px-3 py-1.5 text-xs font-semibold rounded-full bg-accent text-accent-foreground shadow-md">
                🔥 Bestseller
              </span>
            )}
            {product.is_bridal && (
              <span className="inline-flex items-center px-3 py-1.5 text-xs font-semibold rounded-full bg-maroon text-ivory shadow-md">
                💍 Bridal
              </span>
            )}
          </div>

          {/* Quick Actions - Premium styling */}
          <div className="absolute top-3 right-3 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-2 group-hover:translate-x-0 z-10">
            <Button
              variant="secondary"
              size="icon"
              onClick={handleToggleWishlist}
              className={`w-10 h-10 rounded-full shadow-lg backdrop-blur-md ${
                inWishlist 
                  ? 'bg-red-500 text-white hover:bg-red-600' 
                  : 'bg-white/90 hover:bg-white text-foreground'
              }`}
              disabled={!isAuthenticated}
            >
              <Heart className={`w-4 h-4 ${inWishlist ? 'fill-current' : ''}`} />
            </Button>
            <Button
              variant="secondary"
              size="icon"
              onClick={handleToggleCompare}
              className={`w-10 h-10 rounded-full shadow-lg backdrop-blur-md ${
                inComparison 
                  ? 'bg-primary text-primary-foreground hover:bg-primary/90' 
                  : 'bg-white/90 hover:bg-white text-foreground'
              }`}
            >
              <Scale className="w-4 h-4" />
            </Button>
          </div>

          {/* View Details Overlay - Enhanced */}
          <div className="absolute inset-0 bg-gradient-to-t from-rich-black/60 via-rich-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500 flex items-end justify-center pb-6 pointer-events-none z-[5]">
            <div className="flex items-center gap-2 text-ivory font-medium bg-primary/90 px-5 py-2.5 rounded-full shadow-lg backdrop-blur-sm transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
              <Eye className="w-4 h-4" />
              <span className="text-sm">View Details</span>
            </div>
          </div>
        </div>

        {/* Content - Enhanced */}
        <div className="p-4 md:p-5">
          {/* Category & Metal */}
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs text-primary font-medium uppercase tracking-wider">
              {METAL_TYPE_NAMES[product.metal_type]}
            </span>
            <span className="w-1 h-1 rounded-full bg-muted-foreground/30" />
            <span className="text-xs text-muted-foreground">
              {product.weight_grams}g
            </span>
          </div>

          {/* Name */}
          <h3 className="font-serif text-lg font-semibold text-foreground line-clamp-2 mb-1 group-hover:text-primary transition-colors leading-snug">
            {product.name}
          </h3>

          {/* Short Description */}
          {product.short_description && (
            <p className="text-sm text-muted-foreground line-clamp-1 mb-4">
              {product.short_description}
            </p>
          )}

          {/* Price & Action */}
          <div className="flex items-end justify-between pt-3 border-t border-border/50">
            <div>
              <p className="price-tag text-xl md:text-2xl text-primary font-bold">
                {formatPrice(product.calculated_price.total)}
              </p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Incl. {formatPrice(product.calculated_price.gst)} GST
              </p>
            </div>

            {/* Add to Cart */}
            <AddToCartButton
              productId={product.id}
              size="sm"
              showText={false}
            />
          </div>
        </div>
      </div>
    </Link>
  );
}
