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
  type ProductVariation,
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

  // Determine size options: use database variations or fall back to category defaults
  const categoryConfig = CATEGORY_SIZE_OPTIONS[category];
  const hasSizeVariations = sizeVariations.length > 0;
  const hasMetalVariations = metalVariations.length > 0;

  // Get size options from database or category config
  const sizeOptions = hasSizeVariations 
    ? sizeVariations.filter(v => v.is_available).map(v => ({
        value: v.size_value || '',
        label: v.size_label || '',
        priceAdjustment: v.price_adjustment || 0,
        weightAdjustment: v.weight_adjustment || 0,
        stock: v.stock_quantity || 0,
        isDefault: v.is_default,
      }))
    : categoryConfig?.sizes.map(s => ({
        value: s,
        label: categoryConfig.label,
        priceAdjustment: 0,
        weightAdjustment: 0,
        stock: 1,
        isDefault: false,
      })) || [];

  // Get available metal options from database or use defaults
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
        };
      })
    : METAL_OPTIONS.map(m => ({
        ...m,
        priceAdjustment: 0,
        weightAdjustment: 0,
        isDefault: m.type === baseMetalType,
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

    const totalPriceAdjustment = 
      (selectedMetalOption?.priceAdjustment || 0) + 
      (selectedSizeOption?.priceAdjustment || 0);
    
    const totalWeightAdjustment = 
      (selectedMetalOption?.weightAdjustment || 0) + 
      (selectedSizeOption?.weightAdjustment || 0);

    onVariationChange?.({
      metalType: selectedMetal,
      size: selectedSize || null,
      priceAdjustment: totalPriceAdjustment,
      weightAdjustment: totalWeightAdjustment,
    });
  }, [selectedMetal, selectedSize]);

  const handleMetalChange = (type: MetalType) => {
    setSelectedMetal(type);
  };

  const handleSizeChange = (size: string) => {
    setSelectedSize(size);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="space-y-3">
          <Skeleton className="h-4 w-32" />
          <div className="flex gap-3">
            <Skeleton className="h-12 w-40" />
            <Skeleton className="h-12 w-40" />
            <Skeleton className="h-12 w-40" />
          </div>
        </div>
        <div className="space-y-3">
          <Skeleton className="h-4 w-24" />
          <div className="flex gap-2 flex-wrap">
            {[1, 2, 3, 4, 5].map(i => (
              <Skeleton key={i} className="h-12 w-12" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Metal Type Selector */}
      {availableMetals.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <label className="text-sm font-medium text-foreground">
              Metal Type: <span className="text-primary">{METAL_TYPE_NAMES[selectedMetal]}</span>
            </label>
          </div>
          <div className="flex flex-wrap gap-3">
            {availableMetals.map((option) => (
              <button
                key={option.type}
                onClick={() => handleMetalChange(option.type)}
                className={cn(
                  'flex items-center gap-2 px-4 py-3 rounded-xl border-2 transition-all duration-300',
                  selectedMetal === option.type
                    ? 'border-primary bg-primary/5 shadow-md'
                    : 'border-border hover:border-primary/50'
                )}
              >
                <span className={cn('w-5 h-5 rounded-full border-2 border-foreground/20', option.color)} />
                <span className="text-sm font-medium">{option.label}</span>
                {option.priceAdjustment !== 0 && (
                  <span className="text-xs text-muted-foreground">
                    ({option.priceAdjustment > 0 ? '+' : ''}₹{option.priceAdjustment.toLocaleString('en-IN')})
                  </span>
                )}
                {selectedMetal === option.type && (
                  <Check className="w-4 h-4 text-primary ml-1" />
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Size Selector */}
      {sizeOptions.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <label className="text-sm font-medium text-foreground">
              Select {sizeLabel}
              {selectedSize && <span className="text-primary ml-1">: {selectedSize}</span>}
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
                onClick={() => handleSizeChange(size.value)}
                disabled={size.stock <= 0}
                className={cn(
                  'min-w-[48px] h-12 px-4 rounded-lg border-2 font-medium transition-all duration-200',
                  selectedSize === size.value
                    ? 'border-primary bg-primary text-primary-foreground'
                    : size.stock <= 0
                    ? 'border-border bg-muted text-muted-foreground cursor-not-allowed opacity-50'
                    : 'border-border hover:border-primary/50 bg-card'
                )}
              >
                <div className="flex flex-col items-center">
                  <span>{size.value}</span>
                  {size.priceAdjustment !== 0 && (
                    <span className="text-[10px] opacity-75">
                      {size.priceAdjustment > 0 ? '+' : ''}₹{Math.abs(size.priceAdjustment)}
                    </span>
                  )}
                </div>
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
                    <p>Measure the inside diameter of a ring that fits you, then match it to our size chart. For best results, measure at room temperature at the end of the day.</p>
                  </div>
                )}
                {category === 'bangles' && (
                  <div>
                    <p className="font-medium text-foreground mb-2">Bangle Size Guide</p>
                    <p>Measure your hand at its widest point (knuckles) with your thumb tucked in. The size refers to the internal diameter in inches.</p>
                  </div>
                )}
                {(category === 'necklaces' || category === 'chains') && (
                  <div>
                    <p className="font-medium text-foreground mb-2">Chain Length Guide</p>
                    <ul className="space-y-1">
                      <li>16" - Choker length, sits at collarbone</li>
                      <li>18" - Princess length, most popular</li>
                      <li>20-22" - Matinee length, falls below collarbone</li>
                      <li>24-30" - Opera length, falls at breastbone or lower</li>
                    </ul>
                  </div>
                )}
                {category === 'bracelets' && (
                  <div>
                    <p className="font-medium text-foreground mb-2">Bracelet Size Guide</p>
                    <p>Measure your wrist with a tape measure. Add 0.5" to 1" for comfort depending on how loose you prefer your bracelet.</p>
                  </div>
                )}
                {!['rings', 'bangles', 'necklaces', 'chains', 'bracelets'].includes(category) && (
                  <div>
                    <p className="font-medium text-foreground mb-2">Size Information</p>
                    <p>Contact us for detailed sizing information for this product category.</p>
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
