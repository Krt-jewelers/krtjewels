import { useState } from 'react';
import { ChevronDown, ChevronUp, FileText, Award, Star, MessageSquare, ShieldCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ProductReviews } from '@/components/products/ProductReviews';
import type { ProductWithPrice } from '@/lib/types';

interface ProductTabsProps {
  product: ProductWithPrice;
}

type TabType = 'details' | 'certificate' | 'reviews';

export function ProductTabs({ product }: ProductTabsProps) {
  const [activeTab, setActiveTab] = useState<TabType>('details');
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['product-details']));

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(section)) {
        newSet.delete(section);
      } else {
        newSet.add(section);
      }
      return newSet;
    });
  };

  return (
    <div className="mt-12">
      {/* Tab Headers - Accordion Style */}
      <div className="border border-border rounded-2xl overflow-hidden">
        {/* Product Details Section */}
        <div className="border-b border-border last:border-b-0">
          <button
            onClick={() => toggleSection('product-details')}
            className="w-full flex items-center justify-between p-5 bg-card hover:bg-secondary/30 transition-colors"
          >
            <div className="flex items-center gap-3">
              <FileText className="w-5 h-5 text-primary" />
              <span className="font-semibold text-lg">Product Details</span>
            </div>
            {expandedSections.has('product-details') ? (
              <ChevronUp className="w-5 h-5 text-muted-foreground" />
            ) : (
              <ChevronDown className="w-5 h-5 text-muted-foreground" />
            )}
          </button>
          
          <div className={cn(
            'overflow-hidden transition-all duration-300',
            expandedSections.has('product-details') ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'
          )}>
            <div className="p-6 bg-background">
              {/* Description */}
              {product.description && (
                <div className="mb-6">
                  <h4 className="font-medium text-foreground mb-2">Description</h4>
                  <p className="text-muted-foreground leading-relaxed">{product.description}</p>
                </div>
              )}

              {/* Specifications Grid */}
              {product.specifications && Object.keys(product.specifications).length > 0 && (
                <div className="mb-6">
                  <h4 className="font-medium text-foreground mb-3">Specifications</h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {Object.entries(product.specifications).map(([key, value]) => (
                      <div key={key} className="bg-secondary/30 rounded-lg p-3">
                        <span className="text-xs text-muted-foreground capitalize block mb-1">
                          {key.replace(/_/g, ' ')}
                        </span>
                        <p className="font-medium text-sm">{String(value)}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Standard Product Info */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-secondary/30 rounded-lg p-3">
                  <span className="text-xs text-muted-foreground block mb-1">SKU</span>
                  <p className="font-medium text-sm">{product.sku || 'N/A'}</p>
                </div>
                <div className="bg-secondary/30 rounded-lg p-3">
                  <span className="text-xs text-muted-foreground block mb-1">Weight</span>
                  <p className="font-medium text-sm">{product.weight_grams}g</p>
                </div>
                <div className="bg-secondary/30 rounded-lg p-3">
                  <span className="text-xs text-muted-foreground block mb-1">Purity</span>
                  <p className="font-medium text-sm">{product.metal_type.replace('_', ' ').toUpperCase()}</p>
                </div>
                <div className="bg-secondary/30 rounded-lg p-3">
                  <span className="text-xs text-muted-foreground block mb-1">Hallmark</span>
                  <p className="font-medium text-sm">BIS Certified</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Price Breakdown Section */}
        <div className="border-b border-border last:border-b-0">
          <button
            onClick={() => toggleSection('price-breakdown')}
            className="w-full flex items-center justify-between p-5 bg-card hover:bg-secondary/30 transition-colors"
          >
            <div className="flex items-center gap-3">
              <Award className="w-5 h-5 text-primary" />
              <span className="font-semibold text-lg">Price Breakdown</span>
            </div>
            {expandedSections.has('price-breakdown') ? (
              <ChevronUp className="w-5 h-5 text-muted-foreground" />
            ) : (
              <ChevronDown className="w-5 h-5 text-muted-foreground" />
            )}
          </button>
          
          <div className={cn(
            'overflow-hidden transition-all duration-300',
            expandedSections.has('price-breakdown') ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'
          )}>
            <div className="p-6 bg-background">
              <div className="max-w-md space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Gold Value ({product.weight_grams}g)</span>
                  <span className="font-medium">₹{product.calculated_price.gold_value.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Making Charges ({product.making_charge_percent || 12}%)</span>
                  <span className="font-medium">₹{product.calculated_price.making_charges.toLocaleString('en-IN')}</span>
                </div>
                {product.diamond_cost > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Diamond Cost</span>
                    <span className="font-medium">₹{product.diamond_cost.toLocaleString('en-IN')}</span>
                  </div>
                )}
                {product.stone_cost > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Stone Cost</span>
                    <span className="font-medium">₹{product.stone_cost.toLocaleString('en-IN')}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm pt-2 border-t border-border">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-medium">₹{product.calculated_price.subtotal.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">GST (3%)</span>
                  <span className="font-medium">₹{product.calculated_price.gst.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between pt-3 border-t border-primary/30">
                  <span className="text-lg font-semibold">Total</span>
                  <span className="text-2xl font-serif font-bold text-primary">
                    ₹{product.calculated_price.total.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Certificate & Authenticity Section */}
        <div className="border-b border-border last:border-b-0">
          <button
            onClick={() => toggleSection('certificate')}
            className="w-full flex items-center justify-between p-5 bg-card hover:bg-secondary/30 transition-colors"
          >
            <div className="flex items-center gap-3">
              <ShieldCheck className="w-5 h-5 text-primary" />
              <span className="font-semibold text-lg">Certificate & Authenticity</span>
            </div>
            {expandedSections.has('certificate') ? (
              <ChevronUp className="w-5 h-5 text-muted-foreground" />
            ) : (
              <ChevronDown className="w-5 h-5 text-muted-foreground" />
            )}
          </button>
          
          <div className={cn(
            'overflow-hidden transition-all duration-300',
            expandedSections.has('certificate') ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'
          )}>
            <div className="p-6 bg-background">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="flex gap-4">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <ShieldCheck className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">BIS Hallmark Certified</h4>
                    <p className="text-sm text-muted-foreground">
                      Every piece is BIS hallmarked, guaranteeing the purity and authenticity of the gold.
                    </p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Award className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">Certificate of Authenticity</h4>
                    <p className="text-sm text-muted-foreground">
                      Comes with a detailed certificate including weight, purity, and making charges.
                    </p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <FileText className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">Detailed Invoice</h4>
                    <p className="text-sm text-muted-foreground">
                      Transparent pricing with itemized breakdown for gold, making charges, and taxes.
                    </p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Star className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">Lifetime Exchange</h4>
                    <p className="text-sm text-muted-foreground">
                      100% gold value buyback and lifetime exchange on all jewellery purchases.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Manufacturer & Origin Section */}
        <div className="border-b border-border last:border-b-0">
          <button
            onClick={() => toggleSection('manufacturer')}
            className="w-full flex items-center justify-between p-5 bg-card hover:bg-secondary/30 transition-colors"
          >
            <div className="flex items-center gap-3">
              <FileText className="w-5 h-5 text-primary" />
              <span className="font-semibold text-lg">Manufacturer & Origin</span>
            </div>
            {expandedSections.has('manufacturer') ? (
              <ChevronUp className="w-5 h-5 text-muted-foreground" />
            ) : (
              <ChevronDown className="w-5 h-5 text-muted-foreground" />
            )}
          </button>
          
          <div className={cn(
            'overflow-hidden transition-all duration-300',
            expandedSections.has('manufacturer') ? 'max-h-[300px] opacity-100' : 'max-h-0 opacity-0'
          )}>
            <div className="p-6 bg-background">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-secondary/30 rounded-lg p-3">
                  <span className="text-xs text-muted-foreground block mb-1">Manufacturer</span>
                  <p className="font-medium text-sm">KRT Jewels</p>
                </div>
                <div className="bg-secondary/30 rounded-lg p-3">
                  <span className="text-xs text-muted-foreground block mb-1">Country of Origin</span>
                  <p className="font-medium text-sm">India</p>
                </div>
                <div className="bg-secondary/30 rounded-lg p-3">
                  <span className="text-xs text-muted-foreground block mb-1">Imported By</span>
                  <p className="font-medium text-sm">N/A (Domestic)</p>
                </div>
                <div className="bg-secondary/30 rounded-lg p-3">
                  <span className="text-xs text-muted-foreground block mb-1">Packer</span>
                  <p className="font-medium text-sm">KRT Jewels</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Reviews Section - Separate */}
      <div className="mt-8">
        <ProductReviews productId={product.id} productName={product.name} />
      </div>
    </div>
  );
}
