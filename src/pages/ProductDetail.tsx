import { useParams, Link } from 'react-router-dom';
import { useState } from 'react';
import { Layout } from '@/components/layout/Layout';
import { useProduct, useBestsellerProducts } from '@/hooks/useProducts';
import { useCart } from '@/hooks/useCart';
import { useWishlist } from '@/hooks/useWishlist';
import { useAuth } from '@/hooks/useAuth';
import { useGoldRate } from '@/hooks/useGoldRate';
import { formatPrice, METAL_TYPE_NAMES, CATEGORY_NAMES } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ProductGrid } from '@/components/products/ProductGrid';
import { Heart, ShoppingBag, Minus, Plus, MessageCircle, Share2, ChevronRight, Truck, Shield, RefreshCw } from 'lucide-react';

export default function ProductDetail() {
  const { slug } = useParams<{ slug: string }>();
  const { data: product, isLoading } = useProduct(slug || '');
  const { data: relatedProducts } = useBestsellerProducts();
  const { data: goldRate } = useGoldRate();
  const { addToCart, isAdding } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();
  const { isAuthenticated } = useAuth();

  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);

  if (isLoading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <Skeleton className="aspect-square rounded-xl" />
            <div className="space-y-4">
              <Skeleton className="h-8 w-32" />
              <Skeleton className="h-12 w-3/4" />
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-16 w-48" />
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

  const inWishlist = isInWishlist(product.id);

  const handleAddToCart = () => {
    addToCart({ productId: product.id, quantity });
  };

  const handleWhatsAppEnquiry = () => {
    const message = `Hi! I'm interested in the ${product.name} (${formatPrice(product.calculated_price.total)}). Can you please provide more details?`;
    window.open(`https://wa.me/911234567890?text=${encodeURIComponent(message)}`, '_blank');
  };

  return (
    <Layout>
      {/* Breadcrumb */}
      <div className="bg-secondary/30 py-3">
        <div className="container mx-auto px-4">
          <nav className="flex items-center gap-2 text-sm text-muted-foreground">
            <Link to="/" className="hover:text-foreground">Home</Link>
            <ChevronRight className="w-4 h-4" />
            <Link to={`/collections/${product.category.replace('_', '-')}`} className="hover:text-foreground">
              {CATEGORY_NAMES[product.category]}
            </Link>
            <ChevronRight className="w-4 h-4" />
            <span className="text-foreground">{product.name}</span>
          </nav>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Images */}
          <div className="space-y-4">
            <div className="aspect-square rounded-xl overflow-hidden bg-secondary/30">
              <img
                src={product.images[selectedImage] || '/placeholder.svg'}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            </div>
            {product.images.length > 1 && (
              <div className="flex gap-3">
                {product.images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImage(index)}
                    className={`w-20 h-20 rounded-lg overflow-hidden border-2 transition-colors ${
                      selectedImage === index ? 'border-primary' : 'border-transparent'
                    }`}
                  >
                    <img src={image} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Details */}
          <div>
            {/* Badges */}
            <div className="flex flex-wrap gap-2 mb-4">
              {product.is_new_arrival && <Badge className="badge-luxury">New Arrival</Badge>}
              {product.is_bestseller && <Badge className="bg-accent text-accent-foreground">Bestseller</Badge>}
              {product.is_bridal && <Badge className="bg-maroon text-ivory">Bridal Collection</Badge>}
            </div>

            {/* Name */}
            <h1 className="font-serif text-3xl md:text-4xl font-semibold mb-2">{product.name}</h1>
            
            {/* SKU & Metal */}
            <div className="flex items-center gap-4 text-muted-foreground mb-4">
              {product.sku && <span>SKU: {product.sku}</span>}
              <span>•</span>
              <span>{METAL_TYPE_NAMES[product.metal_type]}</span>
            </div>

            {/* Description */}
            <p className="text-muted-foreground mb-6">{product.description}</p>

            {/* Price Breakdown */}
            <div className="bg-secondary/50 rounded-xl p-6 mb-6">
              <h3 className="font-serif text-lg font-semibold mb-4">Price Breakdown</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Weight</span>
                  <span className="font-medium">{product.weight_grams} grams</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Gold Rate ({METAL_TYPE_NAMES[product.metal_type]})</span>
                  <span className="font-medium">{formatPrice(product.calculated_price.gold_rate_applied)}/g</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Gold Value</span>
                  <span>{formatPrice(product.calculated_price.gold_value)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Making Charges ({product.making_charge_percent || 12}%)</span>
                  <span>{formatPrice(product.calculated_price.making_charges)}</span>
                </div>
                {product.diamond_cost > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Diamond Cost</span>
                    <span>{formatPrice(product.diamond_cost)}</span>
                  </div>
                )}
                {product.stone_cost > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Stone Cost</span>
                    <span>{formatPrice(product.stone_cost)}</span>
                  </div>
                )}
                <div className="flex justify-between pt-2 border-t border-border">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>{formatPrice(product.calculated_price.subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">GST (3%)</span>
                  <span>{formatPrice(product.calculated_price.gst)}</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-border text-lg font-semibold">
                  <span>Total</span>
                  <span className="text-primary price-tag text-2xl">
                    {formatPrice(product.calculated_price.total)}
                  </span>
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-3">
                * Prices update automatically based on today's gold rate
              </p>
            </div>

            {/* Quantity & Add to Cart */}
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="flex items-center border rounded-lg">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  disabled={quantity <= 1}
                >
                  <Minus className="w-4 h-4" />
                </Button>
                <span className="w-12 text-center font-medium">{quantity}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setQuantity(quantity + 1)}
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              <Button
                onClick={handleAddToCart}
                disabled={isAdding || !isAuthenticated}
                className="btn-premium flex-1 py-6 text-lg gap-2"
              >
                <ShoppingBag className="w-5 h-5" />
                {isAuthenticated ? 'Add to Cart' : 'Sign in to Purchase'}
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => toggleWishlist(product.id)}
                disabled={!isAuthenticated}
                className={`h-14 w-14 ${inWishlist ? 'bg-accent text-accent-foreground' : ''}`}
              >
                <Heart className={`w-5 h-5 ${inWishlist ? 'fill-current' : ''}`} />
              </Button>
            </div>

            {/* WhatsApp Enquiry */}
            <Button
              variant="outline"
              onClick={handleWhatsAppEnquiry}
              className="w-full py-6 gap-2 border-2"
            >
              <MessageCircle className="w-5 h-5" />
              Enquire on WhatsApp
            </Button>

            {/* Trust Badges */}
            <div className="grid grid-cols-3 gap-4 mt-8 pt-8 border-t border-border">
              <div className="text-center">
                <Truck className="w-6 h-6 mx-auto mb-2 text-primary" />
                <p className="text-xs text-muted-foreground">Free Insured Shipping</p>
              </div>
              <div className="text-center">
                <Shield className="w-6 h-6 mx-auto mb-2 text-primary" />
                <p className="text-xs text-muted-foreground">BIS Hallmarked</p>
              </div>
              <div className="text-center">
                <RefreshCw className="w-6 h-6 mx-auto mb-2 text-primary" />
                <p className="text-xs text-muted-foreground">Easy Returns</p>
              </div>
            </div>

            {/* Specifications */}
            {product.specifications && Object.keys(product.specifications).length > 0 && (
              <div className="mt-8 pt-8 border-t border-border">
                <h3 className="font-serif text-lg font-semibold mb-4">Specifications</h3>
                <div className="grid grid-cols-2 gap-4">
                  {Object.entries(product.specifications).map(([key, value]) => (
                    <div key={key}>
                      <span className="text-muted-foreground text-sm capitalize">
                        {key.replace(/_/g, ' ')}
                      </span>
                      <p className="font-medium">{String(value)}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Related Products */}
        {relatedProducts && relatedProducts.length > 0 && (
          <section className="mt-20 pt-12 border-t border-border">
            <h2 className="font-serif text-3xl font-semibold mb-8">You May Also Like</h2>
            <ProductGrid 
              products={relatedProducts.filter(p => p.id !== product.id).slice(0, 4)} 
              isLoading={false}
            />
          </section>
        )}
      </div>
    </Layout>
  );
}
