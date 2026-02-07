import { useParams, Link } from 'react-router-dom';
import { useState } from 'react';
import { Layout } from '@/components/layout/Layout';
import { useProduct, useBestsellerProducts } from '@/hooks/useProducts';
import { formatPrice, METAL_TYPE_NAMES, CATEGORY_NAMES } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { ProductGrid } from '@/components/products/ProductGrid';
import { ImageLightbox } from '@/components/products/ImageLightbox';
import { ProductImageGallery } from '@/components/product/ProductImageGallery';
import { ProductVariantSelector } from '@/components/product/ProductVariantSelector';
import { ProductPricing } from '@/components/product/ProductPricing';
import { ProductActions } from '@/components/product/ProductActions';
import { ProductTabs } from '@/components/product/ProductTabs';
import { TrustPromise } from '@/components/product/TrustPromise';
import { StockBadge } from '@/components/product/StockBadge';
import { ProductReviews } from '@/components/products/ProductReviews';
import { ChevronRight, Truck, Shield, RefreshCw, Award } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { MetalType } from '@/lib/types';

export default function ProductDetail() {
  const { slug } = useParams<{ slug: string }>();
  const { data: product, isLoading } = useProduct(slug || '');
  const { data: relatedProducts } = useBestsellerProducts();

  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [variationState, setVariationState] = useState<{
    metalType: MetalType;
    size: string | null;
    priceAdjustment: number;
    weightAdjustment: number;
  } | null>(null);

  const handleOpenLightbox = (index: number) => {
    setLightboxIndex(index);
    setIsLightboxOpen(true);
  };

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
          <Link to="/shop">
            <Button className="btn-premium">Browse Collections</Button>
          </Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      {/* Breadcrumb — clean, minimal like Angara */}
      <div className="border-b border-border">
        <div className="container mx-auto px-4 py-3">
          <nav className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Link to="/" className="hover:text-foreground">Home</Link>
            <ChevronRight className="w-3 h-3" />
            <Link to="/shop" className="hover:text-foreground">Jewellery</Link>
            <ChevronRight className="w-3 h-3" />
            <Link to={`/collections/${product.category.replace('_', '-')}`} className="hover:text-foreground">
              {CATEGORY_NAMES[product.category]}
            </Link>
            <ChevronRight className="w-3 h-3" />
            <span className="text-foreground font-medium truncate max-w-[200px]">{product.name}</span>
          </nav>
        </div>
      </div>

      {/* Main Product Section — Angara two-column layout */}
      <div className="container mx-auto px-4 py-6 md:py-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-12">
          {/* Left — Image Gallery */}
          <ProductImageGallery
            images={product.images.length > 0 ? product.images : ['/placeholder.svg']}
            productName={product.name}
            videoUrl={(product as any).video_url}
            badges={{
              isNewArrival: product.is_new_arrival,
              isBestseller: product.is_bestseller,
              isBridal: product.is_bridal,
            }}
            onOpenLightbox={handleOpenLightbox}
          />

          {/* Right — Product Info (Angara style: compact, structured) */}
          <div className="space-y-5">
            {/* Product Title */}
            <div>
              <h1 className="font-serif text-xl md:text-2xl lg:text-3xl font-semibold leading-tight mb-2">
                {product.name}
              </h1>
              <div className="flex items-center gap-3 flex-wrap">
                <StockBadge stockQuantity={product.stock_quantity} showCount />
                {product.sku && (
                  <span className="text-xs text-muted-foreground">SKU: {product.sku}</span>
                )}
              </div>
            </div>

            {/* Price — Angara style: prominent with offer */}
            <ProductPricing
              calculatedPrice={{
                ...product.calculated_price,
                total: product.calculated_price.total + (variationState?.priceAdjustment || 0),
              }}
              quantity={1}
            />

            {/* Variant Selectors — Angara style inline */}
            <ProductVariantSelector
              productId={product.id}
              category={product.category}
              baseMetalType={product.metal_type}
              baseWeightGrams={product.weight_grams}
              specifications={product.specifications}
              onVariationChange={setVariationState}
            />

            {/* Actions (Quantity + Add to Cart + Wishlist + WhatsApp) */}
            <ProductActions product={product} />

            {/* Trust strip — Angara style horizontal icons */}
            <div className="grid grid-cols-4 gap-2 pt-3 border-t border-border">
              {[
                { icon: Truck, label: 'Free Shipping' },
                { icon: Shield, label: 'BIS Hallmarked' },
                { icon: RefreshCw, label: 'Easy Returns' },
                { icon: Award, label: 'Certified' },
              ].map(({ icon: Icon, label }) => (
                <div key={label} className="flex flex-col items-center gap-1 text-center p-2">
                  <Icon className="w-4 h-4 text-primary" />
                  <span className="text-[10px] text-muted-foreground leading-tight">{label}</span>
                </div>
              ))}
            </div>

            {/* Accordion Tabs — Angara style: Product Details, Price Breakdown, Certificate, Manufacturer */}
            <ProductTabs product={product} />
          </div>
        </div>
      </div>

      {/* Trust Promise Section */}
      <TrustPromise />

      {/* Verified Customer Reviews — Full width section like Angara */}
      <section className="py-12 bg-background border-t border-border">
        <div className="container mx-auto px-4">
          <div className="text-center mb-8">
            <h2 className="font-serif text-2xl md:text-3xl font-semibold">Verified Customer Reviews</h2>
          </div>
          <ProductReviews productId={product.id} productName={product.name} />
        </div>
      </section>

      {/* Related Products — Angara "You May Also Like" */}
      {relatedProducts && relatedProducts.length > 0 && (
        <section className="py-12 bg-secondary/20 border-t border-border">
          <div className="container mx-auto px-4">
            <h2 className="font-serif text-2xl md:text-3xl font-semibold text-center mb-8">
              You May Also Like
            </h2>
            <Tabs defaultValue="bestsellers" className="w-full">
              <TabsList className="w-full justify-center mb-6 bg-transparent gap-2">
                <TabsTrigger value="bestsellers" className="text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-full px-4">
                  Bestsellers
                </TabsTrigger>
                <TabsTrigger value="same-category" className="text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-full px-4">
                  {CATEGORY_NAMES[product.category]}
                </TabsTrigger>
                <TabsTrigger value="bridal" className="text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-full px-4">
                  Bridal
                </TabsTrigger>
              </TabsList>
              <TabsContent value="bestsellers">
                <ProductGrid products={relatedProducts.filter(p => p.id !== product.id).slice(0, 5)} isLoading={false} />
              </TabsContent>
              <TabsContent value="same-category">
                <ProductGrid products={relatedProducts.filter(p => p.id !== product.id && p.category === product.category).slice(0, 5)} isLoading={false} />
              </TabsContent>
              <TabsContent value="bridal">
                <ProductGrid products={relatedProducts.filter(p => p.id !== product.id && p.is_bridal).slice(0, 5)} isLoading={false} />
              </TabsContent>
            </Tabs>
          </div>
        </section>
      )}

      {/* Lightbox */}
      <ImageLightbox
        images={product.images.length > 0 ? product.images : ['/placeholder.svg']}
        initialIndex={lightboxIndex}
        isOpen={isLightboxOpen}
        onClose={() => setIsLightboxOpen(false)}
      />
    </Layout>
  );
}
