import { useState } from 'react';
import { Check, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { METAL_TYPE_NAMES, type MetalType, type ProductCategory } from '@/lib/types';

interface ProductVariantSelectorProps {
  category: ProductCategory;
  metalType: MetalType;
  weightGrams: number;
  specifications: Record<string, any> | null;
  onMetalTypeChange?: (type: MetalType) => void;
  onSizeChange?: (size: string) => void;
}

// Ring sizes
const RING_SIZES = ['5', '6', '7', '8', '9', '10', '11', '12', '13', '14', '15', '16', '17'];

// Bangle sizes
const BANGLE_SIZES = ['2.2', '2.4', '2.6', '2.8', '3.0'];

// Chain/Necklace lengths
const CHAIN_LENGTHS = ['16"', '18"', '20"', '22"', '24"', '26"', '28"', '30"'];

// Metal type options with colors
const METAL_OPTIONS: { type: MetalType; label: string; color: string }[] = [
  { type: 'gold_24k', label: '24K Yellow Gold', color: 'bg-amber-400' },
  { type: 'gold_22k', label: '22K Yellow Gold', color: 'bg-amber-500' },
  { type: 'gold_18k', label: '18K White Gold', color: 'bg-gray-200' },
];

export function ProductVariantSelector({
  category,
  metalType,
  weightGrams,
  specifications,
  onMetalTypeChange,
  onSizeChange,
}: ProductVariantSelectorProps) {
  const [selectedMetal, setSelectedMetal] = useState<MetalType>(metalType);
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [isSizeGuideOpen, setIsSizeGuideOpen] = useState(false);

  // Determine which size options to show based on category
  const getSizeOptions = () => {
    switch (category) {
      case 'rings':
        return RING_SIZES;
      case 'bangles':
        return BANGLE_SIZES;
      case 'necklaces':
      case 'chains':
        return CHAIN_LENGTHS;
      default:
        return null;
    }
  };

  const sizeOptions = getSizeOptions();
  const sizeLabel = category === 'rings' ? 'Ring Size' : 
                    category === 'bangles' ? 'Bangle Size' : 
                    category === 'necklaces' || category === 'chains' ? 'Chain Length' : 'Size';

  const handleMetalChange = (type: MetalType) => {
    setSelectedMetal(type);
    onMetalTypeChange?.(type);
  };

  const handleSizeChange = (size: string) => {
    setSelectedSize(size);
    onSizeChange?.(size);
  };

  return (
    <div className="space-y-6">
      {/* Metal Type Selector */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <label className="text-sm font-medium text-foreground">
            Metal Type: <span className="text-primary">{METAL_TYPE_NAMES[selectedMetal]}</span>
          </label>
          <button className="text-xs text-primary hover:underline">Compare</button>
        </div>
        <div className="flex flex-wrap gap-3">
          {METAL_OPTIONS.map((option) => (
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
              {selectedMetal === option.type && (
                <Check className="w-4 h-4 text-primary ml-1" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Size Selector */}
      {sizeOptions && (
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
                key={size}
                onClick={() => handleSizeChange(size)}
                className={cn(
                  'min-w-[48px] h-12 px-4 rounded-lg border-2 font-medium transition-all duration-200',
                  selectedSize === size
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-border hover:border-primary/50 bg-card'
                )}
              >
                {size}
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
              </div>
            </CollapsibleContent>
          </Collapsible>
        </div>
      )}

      {/* Weight Display */}
      <div className="flex items-center justify-between py-3 border-t border-border">
        <span className="text-sm text-muted-foreground">Total Carat Weight</span>
        <span className="font-semibold">{weightGrams} grams</span>
      </div>
    </div>
  );
}
