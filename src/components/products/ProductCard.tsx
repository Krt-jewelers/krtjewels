import { Link } from 'react-router-dom';
import { Heart, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useWishlist } from '@/hooks/useWishlist';
import { useAuth } from '@/hooks/useAuth';
import { formatPrice, METAL_TYPE_NAMES } from '@/lib/types';
import { ProductCardSlider } from './ProductCardSlider';
import { AddToCartButton } from '@/components/cart/AddToCartButton';
import type { ProductWithPrice } from '@/lib/types';

interface ProductCardProps {
  product: ProductWithPrice;
}

export function ProductCard({ product }: ProductCardProps) {
  const { isInWishlist, toggleWishlist } = useWishlist();
  const { isAuthenticated } = useAuth();
  const inWishlist = isInWishlist(product.id);

  const handleToggleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleWishlist(product.id);
  };

  const images = product.images.length > 0 ? product.images : ['/placeholder.svg'];

  return (
    <Link to={`/product/${product.slug}`} className="group">
      <div className="card-luxury bg-card rounded-xl overflow-hidden">
        {/* Image Container with Slider */}
        <div className="relative aspect-square overflow-hidden bg-secondary/30">
          <ProductCardSlider images={images} productName={product.name} />
          
          {/* Badges */}
          <div className="absolute top-3 left-3 flex flex-col gap-2 z-10">
            {product.is_new_arrival && (
              <Badge className="badge-luxury">New</Badge>
            )}
            {product.is_bestseller && (
              <Badge className="bg-accent text-accent-foreground">Bestseller</Badge>
            )}
            {product.is_bridal && (
              <Badge className="bg-maroon text-ivory">Bridal</Badge>
            )}
          </div>

          {/* Quick Actions */}
          <div className="absolute top-3 right-3 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
            <Button
              variant="secondary"
              size="icon"
              onClick={handleToggleWishlist}
              className={`w-9 h-9 rounded-full shadow-soft ${
                inWishlist ? 'bg-accent text-accent-foreground' : 'bg-card/90 backdrop-blur-sm'
              }`}
              disabled={!isAuthenticated}
            >
              <Heart className={`w-4 h-4 ${inWishlist ? 'fill-current' : ''}`} />
            </Button>
          </div>

          {/* View Details Overlay */}
          <div className="absolute inset-0 bg-rich-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none z-[5]">
            <div className="flex items-center gap-2 text-ivory font-medium">
              <Eye className="w-5 h-5" />
              <span>View Details</span>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-4">
          {/* Category & Metal */}
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs text-muted-foreground uppercase tracking-wider">
              {METAL_TYPE_NAMES[product.metal_type]}
            </span>
            <span className="text-muted-foreground">•</span>
            <span className="text-xs text-muted-foreground">
              {product.weight_grams}g
            </span>
          </div>

          {/* Name */}
          <h3 className="font-serif text-lg font-semibold text-foreground line-clamp-2 mb-1 group-hover:text-primary transition-colors">
            {product.name}
          </h3>

          {/* Short Description */}
          {product.short_description && (
            <p className="text-sm text-muted-foreground line-clamp-1 mb-3">
              {product.short_description}
            </p>
          )}

          {/* Price */}
          <div className="flex items-end justify-between">
            <div>
              <p className="price-tag text-xl text-primary font-bold">
                {formatPrice(product.calculated_price.total)}
              </p>
              <p className="text-xs text-muted-foreground">
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
