import { useParams, Link } from 'react-router-dom';
import { useState } from 'react';
import { Layout } from '@/components/layout/Layout';
import { useProduct, useBestsellerProducts } from '@/hooks/useProducts';
import { formatPrice, METAL_TYPE_NAMES, CATEGORY_NAMES } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { ProductGrid } from '@/components/products/ProductGrid';
import { ProductReviews } from '@/components/products/ProductReviews';
import { ImageLightbox } from '@/components/products/ImageLightbox';
import { ProductActions } from '@/components/product/ProductActions';
import { StockBadge } from '@/components/product/StockBadge';
import { ChevronRight, Truck, Shield, RefreshCw, ZoomIn, Award, Gem } from 'lucide-react';

export default function ProductDetail() {
  const { slug } = useParams<{ slug: string }>();
  const { data: product, isLoading } = useProduct(slug || '');
  const { data: relatedProducts } = useBestsellerProducts();

  const [selectedImage, setSelectedImage] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  if (isLoading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <Skeleton className="aspect-square rounded-2xl" />
            <div className="space-y-6">
              <Skeleton className="h-8 w-32" />
              <Skeleton className="h-12 w-3/4" />
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-64 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (!product) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-20 text-center">
          <h1 className="font-serif text-3xl mb-4">Product Not Found</h1>
          <p className="text-muted-foreground mb-8">The product you're looking for doesn't exist.</p>
          <Link to="/collections/necklaces">
            <Button className="btn-premium">Browse Collections</Button>
          </Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      {/* Breadcrumb */}
      <div className="bg-secondary/30 py-3">
        <div className="container mx-auto px-4">
          <nav className="flex items-center gap-2 text-sm text-muted-foreground overflow-x-auto">
            <Link to="/" className="hover:text-foreground whitespace-nowrap">Home</Link>
            <ChevronRight className="w-4 h-4 flex-shrink-0" />
            <Link to={`/collections/${product.category.replace('_', '-')}`} className="hover:text-foreground whitespace-nowrap">
              {CATEGORY_NAMES[product.category]}
            </Link>
            <ChevronRight className="w-4 h-4 flex-shrink-0" />
            <span className="text-foreground line-clamp-1">{product.name}</span>
          </nav>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 md:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16">
          {/* Images - Left Column */}
          <div className="space-y-4">
            {/* Main Image */}
            <div 
              className="relative aspect-square rounded-2xl overflow-hidden bg-gradient-to-br from-secondary/50 to-secondary/20 cursor-zoom-in group"
              onClick={() => setIsLightboxOpen(true)}
            >
              <img
                src={product.images[selectedImage] || '/placeholder.svg'}
                alt={product.name}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-rich-black/0 group-hover:bg-rich-black/20 transition-colors flex items-center justify-center">
                <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 rounded-full p-4 shadow-lg">
                  <ZoomIn className="w-6 h-6 text-foreground" />
                </div>
              </div>
              
              {/* Badges Overlay */}
              <div className="absolute top-4 left-4 flex flex-col gap-2">
                {product.is_new_arrival && (
                  <Badge className="badge-luxury">✨ New Arrival</Badge>
                )}
                {product.is_bestseller && (
                  <Badge className="bg-accent text-accent-foreground">🔥 Bestseller</Badge>
                )}
                {product.is_bridal && (
                  <Badge className="bg-maroon text-ivory">💍 Bridal</Badge>
                )}
              </div>
            </div>
            
            {/* Thumbnail Gallery */}
            {product.images.length > 1 && (
              <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-luxury">
                {product.images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImage(index)}
                    className={`flex-shrink-0 w-20 h-20 md:w-24 md:h-24 rounded-xl overflow-hidden border-2 transition-all duration-300 ${
                      selectedImage === index 
                        ? 'border-primary ring-2 ring-primary/30 scale-105' 
                        : 'border-transparent hover:border-primary/50'
                    }`}
                  >
                    <img src={image} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Details - Right Column */}
          <div className="space-y-6">
            {/* Header */}
            <div>
              <div className="flex items-center gap-3 mb-3">
                <span className="text-primary font-medium uppercase tracking-wider text-sm">
                  {METAL_TYPE_NAMES[product.metal_type]}
                </span>
                <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/30" />
                <span className="text-muted-foreground text-sm">{product.weight_grams}g</span>
                {product.sku && (
                  <>
                    <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/30" />
                    <span className="text-muted-foreground text-sm">SKU: {product.sku}</span>
                  </>
                )}
              </div>
              
              <h1 className="font-serif text-3xl md:text-4xl lg:text-5xl font-semibold mb-4 leading-tight">
                {product.name}
              </h1>
              
              {/* Stock Badge */}
              <StockBadge stockQuantity={product.stock_quantity} showCount />
            </div>

            {/* Description */}
            {product.description && (
              <p className="text-muted-foreground text-lg leading-relaxed">
                {product.description}
              </p>
            )}

            {/* Price Breakdown Card */}
            <div className="bg-gradient-to-br from-secondary/50 to-secondary/30 rounded-2xl p-6 md:p-8 border border-border/50">
              <h3 className="font-serif text-xl font-semibold mb-6 flex items-center gap-2">
                <Gem className="w-5 h-5 text-primary" />
                Price Breakdown
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Gold Rate ({METAL_TYPE_NAMES[product.metal_type]})</span>
                  <span className="font-medium">{formatPrice(product.calculated_price.gold_rate_applied)}/g</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Weight × Rate</span>
                  <span className="font-medium">{product.weight_grams}g × {formatPrice(product.calculated_price.gold_rate_applied)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Gold Value</span>
                  <span>{formatPrice(product.calculated_price.gold_value)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Making Charges ({product.making_charge_percent || 12}%)</span>
                  <span>{formatPrice(product.calculated_price.making_charges)}</span>
                </div>
                {product.diamond_cost > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Diamond Cost</span>
                    <span>{formatPrice(product.diamond_cost)}</span>
                  </div>
                )}
                {product.stone_cost > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Stone Cost</span>
                    <span>{formatPrice(product.stone_cost)}</span>
                  </div>
                )}
                <div className="flex justify-between pt-3 border-t border-border/50 text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>{formatPrice(product.calculated_price.subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">GST (3%)</span>
                  <span>{formatPrice(product.calculated_price.gst)}</span>
                </div>
                <div className="flex justify-between pt-4 border-t border-primary/30">
                  <span className="text-xl font-semibold">Total</span>
                  <span className="text-3xl font-serif font-bold text-primary">
                    {formatPrice(product.calculated_price.total)}
                  </span>
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-4 flex items-center gap-1">
                <RefreshCw className="w-3 h-3" />
                Prices update automatically based on today's gold rate
              </p>
            </div>

            {/* Product Actions - Full Width Premium Buttons */}
            <ProductActions product={product} />

            {/* Trust Features */}
            <div className="grid grid-cols-3 gap-4 pt-6 border-t border-border/50">
              <div className="text-center p-4 rounded-xl bg-secondary/30">
                <Truck className="w-6 h-6 mx-auto mb-2 text-primary" />
                <p className="text-xs text-muted-foreground font-medium">Free Shipping</p>
              </div>
              <div className="text-center p-4 rounded-xl bg-secondary/30">
                <Shield className="w-6 h-6 mx-auto mb-2 text-primary" />
                <p className="text-xs text-muted-foreground font-medium">BIS Hallmarked</p>
              </div>
              <div className="text-center p-4 rounded-xl bg-secondary/30">
                <Award className="w-6 h-6 mx-auto mb-2 text-primary" />
                <p className="text-xs text-muted-foreground font-medium">Certified</p>
              </div>
            </div>

            {/* Specifications */}
            {product.specifications && Object.keys(product.specifications).length > 0 && (
              <div className="pt-6 border-t border-border/50">
                <h3 className="font-serif text-xl font-semibold mb-4">Specifications</h3>
                <div className="grid grid-cols-2 gap-4">
                  {Object.entries(product.specifications).map(([key, value]) => (
                    <div key={key} className="p-3 bg-secondary/30 rounded-lg">
                      <span className="text-muted-foreground text-xs capitalize block mb-1">
                        {key.replace(/_/g, ' ')}
                      </span>
                      <p className="font-medium text-sm">{String(value)}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Product Reviews */}
        <div className="mt-16 pt-12 border-t border-border">
          <ProductReviews productId={product.id} productName={product.name} />
        </div>

        {/* Related Products */}
        {relatedProducts && relatedProducts.length > 0 && (
          <section className="mt-20 pt-12 border-t border-border">
            <h2 className="font-serif text-3xl font-semibold mb-8 section-heading">
              You May Also Like
            </h2>
            <ProductGrid 
              products={relatedProducts.filter(p => p.id !== product.id).slice(0, 4)} 
              isLoading={false}
            />
          </section>
        )}
      </div>

      {/* Image Lightbox */}
      <ImageLightbox
        images={product.images}
        initialIndex={selectedImage}
        isOpen={isLightboxOpen}
        onClose={() => setIsLightboxOpen(false)}
      />
    </Layout>
  );
}
