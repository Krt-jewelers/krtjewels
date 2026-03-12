import { useState } from 'react';
import { ChevronDown, ChevronUp, FileText, Award, ShieldCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ProductWithPrice, MetalType, CalculatedPrice } from '@/lib/types';
import { METAL_TYPE_NAMES } from '@/lib/types';
import { useGstSettings } from '@/hooks/useSiteSettings';
import { useMetalTypes } from '@/hooks/useMetalTypes';

interface ProductTabsProps {
  product: ProductWithPrice;
  calculatedPrice?: CalculatedPrice;
  pricingMeta?: {
    metalLabel?: string;
    metalRatePerGram?: number;
    metalWeightGrams?: number;
    diamondRatePerCarat?: number;
    diamondCaratWeight?: number;
    diamondCost?: number;
    diamondQualityLabel?: string;
    extras?: { label: string; amount: number; type: 'certificate' | 'addon' | 'size' | 'metal' }[];
  };
}

export function ProductTabs({ product, calculatedPrice, pricingMeta }: ProductTabsProps) {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['product-details']));
  const { data: gstSettings } = useGstSettings();
  const gstRate = gstSettings?.rate ?? 3;
  const { data: metalTypes = [] } = useMetalTypes();
  const excludedSpecKeys = new Set(['certificate_items', 'manufacturer_info', 'pricing_options']);
  const metalDisplayName =
    pricingMeta?.metalLabel ||
    (product.metal_type_id && metalTypes.find(mt => mt.id === product.metal_type_id)?.name) ||
    METAL_TYPE_NAMES[product.metal_type as MetalType] ||
    product.metal_type;
  const effectivePrice = calculatedPrice || product.calculated_price;

  const formatSpecValue = (value: unknown) => {
    if (Array.isArray(value)) {
      const parts = value
        .map((item) => {
          if (item == null) return '';
          if (typeof item === 'string' || typeof item === 'number') return String(item);
          if (typeof item === 'object') {
            const obj = item as Record<string, unknown>;
            const preferred = obj.label ?? obj.title ?? obj.name ?? obj.value;
            return preferred ? String(preferred) : '';
          }
          return '';
        })
        .filter(Boolean);
      return parts.length > 0 ? parts.join(', ') : '—';
    }

    if (value && typeof value === 'object') {
      const obj = value as Record<string, unknown>;
      const preferred = obj.label ?? obj.title ?? obj.name ?? obj.value;
      return preferred ? String(preferred) : '—';
    }

    return String(value);
  };

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

  const sections = [
    {
      id: 'product-details',
      icon: FileText,
      title: 'Product Details',
      content: (
        <div className="space-y-4">
          {product.description && (
            <p className="text-sm text-muted-foreground leading-relaxed">{product.description}</p>
          )}
          {product.specifications && Object.keys(product.specifications).length > 0 && (
            <div className="grid grid-cols-2 gap-3">
              {Object.entries(product.specifications)
                .filter(([key]) => !excludedSpecKeys.has(key))
                .map(([key, value]) => (
                  <div key={key} className="flex justify-between text-sm py-1.5 border-b border-border/50">
                    <span className="text-muted-foreground capitalize">{key.replace(/_/g, ' ')}</span>
                    <span className="font-medium">{formatSpecValue(value)}</span>
                  </div>
                ))}
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex justify-between text-sm py-1.5 border-b border-border/50">
              <span className="text-muted-foreground">Weight</span>
              <span className="font-medium">{product.weight_grams}g</span>
            </div>
            <div className="flex justify-between text-sm py-1.5 border-b border-border/50">
              <span className="text-muted-foreground">Purity</span>
              <span className="font-medium">{metalDisplayName}</span>
            </div>
            <div className="flex justify-between text-sm py-1.5 border-b border-border/50">
              <span className="text-muted-foreground">SKU</span>
              <span className="font-medium">{product.sku || 'N/A'}</span>
            </div>
            <div className="flex justify-between text-sm py-1.5 border-b border-border/50">
              <span className="text-muted-foreground">Hallmark</span>
              <span className="font-medium">BIS Certified</span>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'price-breakdown',
      icon: Award,
      title: 'Price Breakdown',
      content: (() => {
        const stones = Array.isArray((product as any).stones) ? (product as any).stones : [];
        const hasStones = stones.length > 0;
        const diamondCostFromSelection = pricingMeta?.diamondCost ?? 0;
        const diamondRate = pricingMeta?.diamondRatePerCarat ?? 0;
        const diamondCarat = pricingMeta?.diamondCaratWeight ?? 0;
        const diamondQuality = pricingMeta?.diamondQualityLabel || 'Diamond';
        const showSelectedDiamond = diamondCostFromSelection > 0 && diamondCarat > 0;
        const extras = (pricingMeta?.extras || []).filter(e => e.amount !== 0);
        const metalRate = pricingMeta?.metalRatePerGram ?? effectivePrice.gold_rate_applied;
        const metalWeight = pricingMeta?.metalWeightGrams ?? product.weight_grams;
        return (
          <div className="overflow-x-auto">
            <table className="w-full text-sm border border-border rounded-lg overflow-hidden">
              <thead>
                <tr className="bg-muted/50">
                  <th className="text-left p-3 font-medium text-muted-foreground uppercase text-xs">Component</th>
                  <th className="text-left p-3 font-medium text-muted-foreground uppercase text-xs">Rate</th>
                  <th className="text-left p-3 font-medium text-muted-foreground uppercase text-xs">Weight</th>
                  <th className="text-right p-3 font-medium text-muted-foreground uppercase text-xs">Value</th>
                </tr>
              </thead>
              <tbody>
                {/* Metal */}
                <tr className="border-t border-border">
                  <td colSpan={4} className="p-3 text-primary font-semibold text-xs uppercase">Metals</td>
                </tr>
                <tr className="border-t border-border/50">
                  <td className="p-3">{metalDisplayName}</td>
                  <td className="p-3">₹{metalRate.toLocaleString('en-IN')}</td>
                  <td className="p-3">{metalWeight} g</td>
                  <td className="p-3 text-right">₹{effectivePrice.gold_value.toLocaleString('en-IN')}</td>
                </tr>

                {/* Stones */}
                {(hasStones || product.stone_cost > 0 || product.diamond_cost > 0 || showSelectedDiamond) && (
                  <>
                    <tr className="border-t border-border">
                      <td colSpan={4} className="p-3 text-primary font-semibold text-xs uppercase">Stones</td>
                    </tr>
                    {showSelectedDiamond && (
                      <tr className="border-t border-border/50">
                        <td className="p-3">{diamondQuality}</td>
                        <td className="p-3">₹{diamondRate.toLocaleString('en-IN')}/ct</td>
                        <td className="p-3">{diamondCarat} ct</td>
                        <td className="p-3 text-right">₹{Math.round(diamondCostFromSelection).toLocaleString('en-IN')}</td>
                      </tr>
                    )}
                    {hasStones ? stones.map((stone: any, idx: number) => (
                      <tr key={idx} className="border-t border-border/50">
                        <td className="p-3">{stone.name}{stone.quantity > 1 ? ` x ${stone.quantity}` : ''}{stone.shape ? ` (${stone.shape})` : ''}</td>
                        <td className="p-3">₹{Number(stone.per_carat_price).toLocaleString('en-IN')}/ct</td>
                        <td className="p-3">{stone.carat_weight} ct.w</td>
                        <td className="p-3 text-right">₹{Math.round(stone.carat_weight * stone.per_carat_price * stone.quantity).toLocaleString('en-IN')}</td>
                      </tr>
                    )) : (
                      <>
                        {product.diamond_cost > 0 && !showSelectedDiamond && (
                          <tr className="border-t border-border/50">
                            <td className="p-3">Diamond</td>
                            <td className="p-3">–</td>
                            <td className="p-3">–</td>
                            <td className="p-3 text-right">₹{product.diamond_cost.toLocaleString('en-IN')}</td>
                          </tr>
                        )}
                        {product.stone_cost > 0 && (
                          <tr className="border-t border-border/50">
                            <td className="p-3">Other Stones</td>
                            <td className="p-3">–</td>
                            <td className="p-3">–</td>
                            <td className="p-3 text-right">₹{product.stone_cost.toLocaleString('en-IN')}</td>
                          </tr>
                        )}
                      </>
                    )}
                  </>
                )}

                {extras.length > 0 && (
                  <>
                    <tr className="border-t border-border">
                      <td colSpan={4} className="p-3 text-primary font-semibold text-xs uppercase">Add-ons</td>
                    </tr>
                    {extras.map((extra, idx) => (
                      <tr key={`${extra.label}-${idx}`} className="border-t border-border/50">
                        <td className="p-3">{extra.label}</td>
                        <td className="p-3">–</td>
                        <td className="p-3">–</td>
                        <td className="p-3 text-right">₹{extra.amount.toLocaleString('en-IN')}</td>
                      </tr>
                    ))}
                  </>
                )}

                {/* Making Charges */}
                <tr className="border-t border-border bg-muted/30">
                  <td className="p-3 text-primary font-semibold text-xs uppercase">Making Charges</td>
                  <td className="p-3">–</td>
                  <td className="p-3">–</td>
                  <td className="p-3 text-right">₹{effectivePrice.making_charges.toLocaleString('en-IN')}</td>
                </tr>

                {/* Subtotal */}
                <tr className="border-t border-border bg-muted/30">
                  <td className="p-3 text-primary font-semibold text-xs uppercase">Subtotal</td>
                  <td className="p-3">–</td>
                  <td className="p-3">–</td>
                  <td className="p-3 text-right font-medium">₹{effectivePrice.subtotal.toLocaleString('en-IN')}</td>
                </tr>

                {/* GST */}
                <tr className="border-t border-border bg-muted/30">
                  <td className="p-3 text-primary font-semibold text-xs uppercase">GST ({gstRate}%)</td>
                  <td className="p-3">–</td>
                  <td className="p-3">–</td>
                  <td className="p-3 text-right">₹{effectivePrice.gst.toLocaleString('en-IN')}</td>
                </tr>

                {/* Total */}
                <tr className="border-t-2 border-primary/30 bg-primary/5">
                  <td className="p-3 font-bold uppercase text-xs">Total</td>
                  <td className="p-3">–</td>
                  <td className="p-3">–</td>
                  <td className="p-3 text-right text-lg font-serif font-bold text-primary">₹{effectivePrice.total.toLocaleString('en-IN')}</td>
                </tr>
              </tbody>
            </table>
          </div>
        );
      })(),
    },
    {
      id: 'certificate',
      icon: ShieldCheck,
      title: 'Certificate & Authenticity',
      content: (() => {
        const specs = (product.specifications || {}) as Record<string, any>;
        const items = Array.isArray(specs.certificate_items) && specs.certificate_items.length > 0
          ? specs.certificate_items
          : [
              { title: 'BIS Hallmark Certified', desc: 'Guaranteeing purity and authenticity of the gold.' },
              { title: 'Certificate of Authenticity', desc: 'Includes weight, purity, and making charges.' },
              { title: 'Detailed Invoice', desc: 'Itemized breakdown for gold, making charges, and taxes.' },
              { title: 'Lifetime Exchange', desc: '100% gold value buyback and lifetime exchange.' },
            ];
        return (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {items.map((item: any) => (
              <div key={item.title} className="flex gap-3">
                <ShieldCheck className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium">{item.title}</p>
                  <p className="text-xs text-muted-foreground">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        );
      })(),
    },
    {
      id: 'manufacturer',
      icon: FileText,
      title: 'Manufacturer & Origin',
      content: (() => {
        const specs = (product.specifications || {}) as Record<string, any>;
        const items = Array.isArray(specs.manufacturer_info) && specs.manufacturer_info.length > 0
          ? specs.manufacturer_info
          : [
              { label: 'Manufacturer', value: 'KRT Jewels' },
              { label: 'Country', value: 'India' },
              { label: 'Imported By', value: 'N/A (Domestic)' },
              { label: 'Packer', value: 'KRT Jewels' },
            ];
        return (
          <div className="grid grid-cols-2 gap-3">
            {items.map((item: any) => (
              <div key={item.label} className="flex justify-between text-sm py-1.5 border-b border-border/50">
                <span className="text-muted-foreground">{item.label}</span>
                <span className="font-medium">{item.value}</span>
              </div>
            ))}
          </div>
        );
      })(),
    },
  ];

  return (
    <div className="border border-border rounded-xl overflow-hidden">
      {sections.map((section) => (
        <div key={section.id} className="border-b border-border last:border-b-0">
          <button
            onClick={() => toggleSection(section.id)}
            className="w-full flex items-center justify-between px-4 py-3 hover:bg-secondary/30 transition-colors"
          >
            <span className="font-medium text-sm">{section.title}</span>
            {expandedSections.has(section.id) ? (
              <ChevronUp className="w-4 h-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="w-4 h-4 text-muted-foreground" />
            )}
          </button>
          <div
            className={cn(
              'overflow-hidden transition-all duration-300',
              expandedSections.has(section.id) ? 'max-h-none opacity-100' : 'max-h-0 opacity-0'
            )}
          >
            <div className="px-4 pb-4">{section.content}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
