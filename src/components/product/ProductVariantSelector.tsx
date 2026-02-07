import { useState, useEffect } from 'react';
import { Check, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { 
  METAL_TYPE_NAMES, 
  CATEGORY_SIZE_OPTIONS,
  type MetalType, 
  type ProductCategory,
} from '@/lib/types';
import { useProductVariations } from '@/hooks/useProductVariations';
import { Skeleton } from '@/components/ui/skeleton';

interface ProductVariantSelectorProps {
  productId: string;
  category: ProductCategory;
  baseMetalType: MetalType;
  baseWeightGrams: number;
  specifications: Record<string, any> | null;
  onVariationChange?: (variation: { 
    metalType: MetalType; 
    size: string | null;
    priceAdjustment: number;
    weightAdjustment: number;
  }) => void;
}

// Metal type options with colors
const METAL_OPTIONS: { type: MetalType; label: string; color: string }[] = [
  { type: 'gold_24k', label: '24K Yellow Gold', color: 'bg-amber-400' },
  { type: 'gold_22k', label: '22K Yellow Gold', color: 'bg-amber-500' },
  { type: 'gold_18k', label: '18K White Gold', color: 'bg-gray-200' },
];

export function ProductVariantSelector({
  productId,
  category,
  baseMetalType,
  baseWeightGrams,
  specifications,
  onVariationChange,
}: ProductVariantSelectorProps) {
  const { data: variations = [], isLoading } = useProductVariations(productId);
  
  const [selectedMetal, setSelectedMetal] = useState<MetalType>(baseMetalType);
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [isSizeGuideOpen, setIsSizeGuideOpen] = useState(false);

  // Get variations by type
  const sizeVariations = variations.filter(v => v.variation_type === 'size');
  const metalVariations = variations.filter(v => v.variation_type === 'metal_type');

  const categoryConfig = CATEGORY_SIZE_OPTIONS[category];
  const hasSizeVariations = sizeVariations.length > 0;
  const hasMetalVariations = metalVariations.length > 0;

  const sizeOptions = hasSizeVariations 
    ? sizeVariations.filter(v => v.is_available).map(v => ({
        value: v.size_value || '',
        label: v.size_label || '',
        priceAdjustment: v.price_adjustment || 0,
        weightAdjustment: v.weight_adjustment || 0,
        stock: v.stock_quantity || 0,
        isDefault: v.is_default,
        imageUrl: v.image_url || null,
      }))
    : categoryConfig?.sizes.map(s => ({
        value: s,
        label: categoryConfig.label,
        priceAdjustment: 0,
        weightAdjustment: 0,
        stock: 1,
        isDefault: false,
        imageUrl: null,
      })) || [];

  const availableMetals = hasMetalVariations
    ? METAL_OPTIONS.filter(m => 
        metalVariations.some(v => v.metal_type === m.type && v.is_available)
      ).map(m => {
        const variation = metalVariations.find(v => v.metal_type === m.type);
        return {
          ...m,
          priceAdjustment: variation?.price_adjustment || 0,
          weightAdjustment: variation?.weight_adjustment || 0,
          isDefault: variation?.is_default || false,
          imageUrl: variation?.image_url || null,
        };
      })
    : METAL_OPTIONS.map(m => ({
        ...m,
        priceAdjustment: 0,
        weightAdjustment: 0,
        isDefault: m.type === baseMetalType,
        imageUrl: null,
      }));

  const sizeLabel = categoryConfig?.label || 'Size';

  // Set default selections
  useEffect(() => {
    if (availableMetals.length > 0) {
      const defaultMetal = availableMetals.find(m => m.isDefault) || availableMetals[0];
      if (defaultMetal && selectedMetal !== defaultMetal.type) {
        setSelectedMetal(defaultMetal.type);
      }
    }
  }, [availableMetals]);

  useEffect(() => {
    if (sizeOptions.length > 0 && !selectedSize) {
      const defaultSize = sizeOptions.find(s => s.isDefault) || sizeOptions[0];
      if (defaultSize) {
        setSelectedSize(defaultSize.value);
      }
    }
  }, [sizeOptions]);

  // Notify parent of changes
  useEffect(() => {
    const selectedMetalOption = availableMetals.find(m => m.type === selectedMetal);
    const selectedSizeOption = sizeOptions.find(s => s.value === selectedSize);

    onVariationChange?.({
      metalType: selectedMetal,
      size: selectedSize || null,
      priceAdjustment: (selectedMetalOption?.priceAdjustment || 0) + (selectedSizeOption?.priceAdjustment || 0),
      weightAdjustment: (selectedMetalOption?.weightAdjustment || 0) + (selectedSizeOption?.weightAdjustment || 0),
    });
  }, [selectedMetal, selectedSize]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-4 w-32" />
        <div className="flex gap-3">
          <Skeleton className="h-16 w-16" />
          <Skeleton className="h-16 w-16" />
          <Skeleton className="h-16 w-16" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Metal Type Selector — Angara style with image swatches */}
      {availableMetals.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <label className="text-sm font-medium text-foreground">
              Metal Type: <span className="text-primary font-semibold">{METAL_TYPE_NAMES[selectedMetal]}</span>
            </label>
          </div>
          <div className="flex flex-wrap gap-3">
            {availableMetals.map((option) => (
              <button
                key={option.type}
                onClick={() => setSelectedMetal(option.type)}
                className={cn(
                  'relative flex flex-col items-center gap-1 rounded-lg border-2 transition-all duration-200 p-1',
                  selectedMetal === option.type
                    ? 'border-primary shadow-md'
                    : 'border-border hover:border-primary/50'
                )}
              >
                {/* Show image if available, otherwise show color swatch */}
                {option.imageUrl ? (
                  <div className="w-14 h-14 rounded overflow-hidden">
                    <img 
                      src={option.imageUrl} 
                      alt={option.label} 
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className={cn('w-14 h-14 rounded flex items-center justify-center', option.color)}>
                    {selectedMetal === option.type && (
                      <Check className="w-5 h-5 text-foreground/80" />
                    )}
                  </div>
                )}
                <span className="text-[10px] text-muted-foreground leading-tight text-center max-w-[70px]">
                  {option.label.split(' ').slice(-2).join(' ')}
                </span>
                {option.priceAdjustment !== 0 && (
                  <span className="text-[9px] text-muted-foreground">
                    {option.priceAdjustment > 0 ? '+' : ''}₹{option.priceAdjustment.toLocaleString('en-IN')}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Size Selector — Angara style compact pills */}
      {sizeOptions.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <label className="text-sm font-medium text-foreground">
              {sizeLabel}
              {selectedSize && <span className="text-primary font-semibold ml-1">: {selectedSize}</span>}
            </label>
            <button 
              className="text-xs text-primary hover:underline"
              onClick={() => setIsSizeGuideOpen(!isSizeGuideOpen)}
            >
              Size Guide
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {sizeOptions.map((size) => (
              <button
                key={size.value}
                onClick={() => setSelectedSize(size.value)}
                disabled={size.stock <= 0}
                className={cn(
                  'relative rounded-lg border-2 transition-all duration-200 overflow-hidden',
                  selectedSize === size.value
                    ? 'border-primary shadow-md'
                    : size.stock <= 0
                    ? 'border-border bg-muted opacity-50 cursor-not-allowed'
                    : 'border-border hover:border-primary/50'
                )}
              >
                {/* Show image if available, otherwise show text pill */}
                {size.imageUrl ? (
                  <div className="flex flex-col items-center p-1">
                    <div className="w-12 h-12 rounded overflow-hidden">
                      <img src={size.imageUrl} alt={size.value} className="w-full h-full object-cover" />
                    </div>
                    <span className="text-[10px] font-medium mt-0.5">{size.value}</span>
                  </div>
                ) : (
                  <div className="min-w-[44px] h-10 px-3 flex items-center justify-center">
                    <span className="text-sm font-medium">{size.value}</span>
                  </div>
                )}
                {size.priceAdjustment !== 0 && (
                  <span className="text-[9px] text-muted-foreground block text-center pb-0.5">
                    {size.priceAdjustment > 0 ? '+' : ''}₹{Math.abs(size.priceAdjustment)}
                  </span>
                )}
              </button>
            ))}
          </div>
          
          {/* Size Guide Collapsible */}
          <Collapsible open={isSizeGuideOpen} onOpenChange={setIsSizeGuideOpen}>
            <CollapsibleContent className="mt-4">
              <div className="bg-secondary/50 rounded-xl p-4 text-sm text-muted-foreground">
                {category === 'rings' && (
                  <div>
                    <p className="font-medium text-foreground mb-2">Ring Size Guide</p>
                    <p>Measure the inside diameter of a ring that fits you, then match it to our size chart.</p>
                  </div>
                )}
                {category === 'bangles' && (
                  <div>
                    <p className="font-medium text-foreground mb-2">Bangle Size Guide</p>
                    <p>Measure your hand at its widest point (knuckles) with your thumb tucked in.</p>
                  </div>
                )}
                {(category === 'necklaces' || category === 'chains') && (
                  <div>
                    <p className="font-medium text-foreground mb-2">Chain Length Guide</p>
                    <ul className="space-y-1">
                      <li>16" - Choker length</li>
                      <li>18" - Princess length, most popular</li>
                      <li>20-22" - Matinee length</li>
                      <li>24-30" - Opera length</li>
                    </ul>
                  </div>
                )}
                {category === 'bracelets' && (
                  <div>
                    <p className="font-medium text-foreground mb-2">Bracelet Size Guide</p>
                    <p>Measure your wrist and add 0.5" to 1" for comfort.</p>
                  </div>
                )}
                {!['rings', 'bangles', 'necklaces', 'chains', 'bracelets'].includes(category) && (
                  <div>
                    <p className="font-medium text-foreground mb-2">Size Information</p>
                    <p>Contact us for detailed sizing information.</p>
                  </div>
                )}
              </div>
            </CollapsibleContent>
          </Collapsible>
        </div>
      )}

      {/* Weight Display */}
      <div className="flex items-center justify-between py-3 border-t border-border">
        <span className="text-sm text-muted-foreground">Net Weight</span>
        <span className="font-semibold">
          {(baseWeightGrams + 
            (availableMetals.find(m => m.type === selectedMetal)?.weightAdjustment || 0) +
            (sizeOptions.find(s => s.value === selectedSize)?.weightAdjustment || 0)
          ).toFixed(2)} grams
        </span>
      </div>
    </div>
  );
}
