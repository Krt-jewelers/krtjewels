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
import { ChevronRight, Truck, Shield, RefreshCw, Award, Clock, Gift } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function ProductDetail() {
  const { slug } = useParams<{ slug: string }>();
  const { data: product, isLoading } = useProduct(slug || '');
  const { data: relatedProducts } = useBestsellerProducts();

  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

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
      {/* Breadcrumb */}
      <div className="bg-secondary/30 py-3">
        <div className="container mx-auto px-4">
          <nav className="flex items-center gap-2 text-sm text-muted-foreground overflow-x-auto">
            <Link to="/" className="hover:text-foreground whitespace-nowrap">Home</Link>
            <ChevronRight className="w-4 h-4 flex-shrink-0" />
            <Link to="/shop" className="hover:text-foreground whitespace-nowrap">Shop</Link>
            <ChevronRight className="w-4 h-4 flex-shrink-0" />
            <Link to={`/collections/${product.category.replace('_', '-')}`} className="hover:text-foreground whitespace-nowrap">
              {CATEGORY_NAMES[product.category]}
            </Link>
            <ChevronRight className="w-4 h-4 flex-shrink-0" />
            <span className="text-foreground line-clamp-1">{product.name}</span>
          </nav>
        </div>
      </div>

      {/* Main Product Section */}
      <div className="container mx-auto px-4 py-8 md:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16">
          {/* Images - Left Column */}
          <ProductImageGallery
            images={product.images.length > 0 ? product.images : ['/placeholder.svg']}
            productName={product.name}
            badges={{
              isNewArrival: product.is_new_arrival,
              isBestseller: product.is_bestseller,
              isBridal: product.is_bridal,
            }}
            onOpenLightbox={handleOpenLightbox}
          />

          {/* Details - Right Column */}
          <div className="space-y-6">
            {/* Header */}
            <div>
              <div className="flex items-center gap-3 mb-2">
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

              <h1 className="font-serif text-2xl md:text-3xl lg:text-4xl font-semibold mb-3 leading-tight">
                {product.name}
              </h1>

              {/* Stock Badge */}
              <StockBadge stockQuantity={product.stock_quantity} showCount />
            </div>

            {/* Pricing */}
            <ProductPricing 
              calculatedPrice={product.calculated_price} 
              quantity={1} 
            />

            {/* Variant Selector */}
            <ProductVariantSelector
              category={product.category}
              metalType={product.metal_type}
              weightGrams={product.weight_grams}
              specifications={product.specifications}
            />

            {/* Product Actions */}
            <ProductActions product={product} />

            {/* Quick Trust Features */}
            <div className="grid grid-cols-3 gap-3 pt-4 border-t border-border">
              <div className="text-center p-3 rounded-xl bg-secondary/30">
                <Truck className="w-5 h-5 mx-auto mb-1.5 text-primary" />
                <p className="text-xs text-muted-foreground">Free Shipping</p>
              </div>
              <div className="text-center p-3 rounded-xl bg-secondary/30">
                <Shield className="w-5 h-5 mx-auto mb-1.5 text-primary" />
                <p className="text-xs text-muted-foreground">BIS Hallmarked</p>
              </div>
              <div className="text-center p-3 rounded-xl bg-secondary/30">
                <RefreshCw className="w-5 h-5 mx-auto mb-1.5 text-primary" />
                <p className="text-xs text-muted-foreground">Easy Returns</p>
              </div>
            </div>

            {/* Delivery Info */}
            <div className="flex items-center gap-3 p-4 bg-secondary/30 rounded-xl">
              <Clock className="w-5 h-5 text-primary" />
              <div>
                <p className="text-sm font-medium">Delivery Estimate</p>
                <p className="text-xs text-muted-foreground">
                  Standard delivery in 5-7 business days
                </p>
              </div>
            </div>

            {/* Gift Option */}
            <div className="flex items-center gap-3 p-4 border border-primary/30 rounded-xl bg-primary/5">
              <Gift className="w-5 h-5 text-primary" />
              <div>
                <p className="text-sm font-medium">Premium Gift Packaging</p>
                <p className="text-xs text-muted-foreground">
                  Complimentary luxury gift box with every purchase
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Product Tabs - Details, Certificate, Reviews */}
        <ProductTabs product={product} />
      </div>

      {/* Trust Promise Section */}
      <TrustPromise />

      {/* Related Products */}
      {relatedProducts && relatedProducts.length > 0 && (
        <section className="py-16 bg-background">
          <div className="container mx-auto px-4">
            <div className="text-center mb-8">
              <h2 className="font-serif text-2xl md:text-3xl font-semibold mb-2">
                You May Also Like
              </h2>
              <p className="text-muted-foreground">
                Discover more pieces from our collection
              </p>
            </div>
            
            {/* Category Tabs for Related */}
            <Tabs defaultValue="bestsellers" className="w-full">
              <TabsList className="w-full justify-center mb-8 bg-transparent">
                <TabsTrigger value="bestsellers" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                  Bestsellers
                </TabsTrigger>
                <TabsTrigger value="same-category" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                  {CATEGORY_NAMES[product.category]}
                </TabsTrigger>
                <TabsTrigger value="bridal" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                  Bridal Rings
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="bestsellers">
                <ProductGrid 
                  products={relatedProducts.filter(p => p.id !== product.id).slice(0, 4)} 
                  isLoading={false}
                />
              </TabsContent>
              
              <TabsContent value="same-category">
                <ProductGrid 
                  products={relatedProducts.filter(p => p.id !== product.id && p.category === product.category).slice(0, 4)} 
                  isLoading={false}
                />
              </TabsContent>
              
              <TabsContent value="bridal">
                <ProductGrid 
                  products={relatedProducts.filter(p => p.id !== product.id && p.is_bridal).slice(0, 4)} 
                  isLoading={false}
                />
              </TabsContent>
            </Tabs>
          </div>
        </section>
      )}

      {/* Image Lightbox */}
      <ImageLightbox
        images={product.images.length > 0 ? product.images : ['/placeholder.svg']}
        initialIndex={lightboxIndex}
        isOpen={isLightboxOpen}
        onClose={() => setIsLightboxOpen(false)}
      />
    </Layout>
  );
}
