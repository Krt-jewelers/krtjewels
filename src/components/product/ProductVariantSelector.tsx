import { useState, useEffect, useMemo } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { SizeGuideDialog } from '@/components/product/SizeGuideDialog';
import type { ProductCategory } from '@/lib/types';
import {
  buildVariantOptions,
  computeVariationState,
  type SelectedOptions,
  type VariationState,
} from '@/lib/pricing';
import { useProductVariations } from '@/hooks/useProductVariations';
import { useSizeChart } from '@/hooks/useSizeCharts';
import { Skeleton } from '@/components/ui/skeleton';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import type { Json } from '@/integrations/supabase/types';
import { useMetalTypes } from '@/hooks/useMetalTypes';

interface ProductVariantSelectorProps {
  productId: string;
  category: ProductCategory;
  baseMetalType: string;
  baseWeightGrams: number;
  baseRatePerGram?: number;
  specifications: Record<string, any> | Json | null;
  onVariationChange?: (variation: VariationState & { selectedOptions?: SelectedOptions }) => void;
}

export function ProductVariantSelector({
  productId,
  category,
  baseMetalType,
  baseWeightGrams,
  baseRatePerGram,
  specifications,
  onVariationChange,
}: ProductVariantSelectorProps) {
  const { data: variations = [], isLoading } = useProductVariations(productId);
  const { data: metalTypes = [] } = useMetalTypes();
  const { data: sizeChart } = useSizeChart(category || '');

  const [selectedMetal, setSelectedMetal] = useState<string>('');
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [selectedGemstone, setSelectedGemstone] = useState<string>('');
  const [selectedCarat, setSelectedCarat] = useState<string>('');
  const [selectedGemstones, setSelectedGemstones] = useState<string[]>([]);
  const [selectedCarats, setSelectedCarats] = useState<string[]>([]);
  const [selectedAttributes, setSelectedAttributes] = useState<string[]>([]);
  const [isSizeGuideOpen, setIsSizeGuideOpen] = useState(false);
  const [selectedCustomAddons, setSelectedCustomAddons] = useState<string[]>([]);
  const [isEngravingOpen, setIsEngravingOpen] = useState(false);
  const [engravingText, setEngravingText] = useState('');
  const [engravingFont, setEngravingFont] = useState<'script' | 'block'>('script');

  // Options come from the shared pricing module so the server prices the same
  // options the customer picked. Memoised so the effects below stay stable.
  const variantOptions = useMemo(
    () =>
      buildVariantOptions({
        category,
        baseMetalType,
        baseWeightGrams,
        specifications,
        variations,
        metalTypes,
        sizeChartRows: sizeChart?.chart_data as Record<string, unknown>[] | undefined,
      }),
    [category, baseMetalType, baseWeightGrams, specifications, variations, metalTypes, sizeChart]
  );
  const {
    availableMetals,
    sizeOptions,
    gemstoneOptions,
    caratOptions,
    attributeOptions,
    customOptions,
    sizeLabel,
  } = variantOptions;

  // Debug: log variations and computed options to help diagnose issues
  if (process.env.NODE_ENV !== 'production') {
    // eslint-disable-next-line no-console
    console.debug('ProductVariantSelector debug', { productId, variations, sizeOptions, availableMetals });
  }

  // Set default selections only when there's a single option
  // Pick the default metal, and pick again if the options change under us
  // (the fallback list shows while variations load, then real options replace it).
  const selectedMetalIsCurrent = availableMetals.some(m => m.value === selectedMetal);
  useEffect(() => {
    if (availableMetals.length > 0 && !selectedMetalIsCurrent) {
      const defaultMetal = availableMetals.find(m => m.isDefault) || availableMetals[0];
      if (defaultMetal) setSelectedMetal(defaultMetal.value);
    }
  }, [availableMetals, selectedMetalIsCurrent]);

  useEffect(() => {
    if (sizeOptions.length === 1 && !selectedSize) {
      setSelectedSize(sizeOptions[0].value);
    }
  }, [sizeOptions, selectedSize]);

  useEffect(() => {
    if (gemstoneOptions.length === 1 && !selectedGemstone) {
      const defaultGem = gemstoneOptions[0];
      setSelectedGemstone(defaultGem.value);
      if (defaultGem.selectionMode === 'multi') {
        setSelectedGemstones([defaultGem.value]);
      }
    }
  }, [gemstoneOptions, selectedGemstone]);

  useEffect(() => {
    if (caratOptions.length === 1 && !selectedCarat) {
      const defaultCarat = caratOptions[0];
      setSelectedCarat(defaultCarat.value);
      if (defaultCarat.selectionMode === 'multi') {
        setSelectedCarats([defaultCarat.value]);
      }
    }
  }, [caratOptions, selectedCarat]);

  useEffect(() => {
    if (gemstoneOptions.length > 1 && !selectedGemstone && selectedGemstones.length === 0) {
      const defaults = gemstoneOptions.filter(g => g.isDefault).map(g => g.value);
      if (defaults.length > 0) {
        if (gemstoneOptions[0]?.selectionMode === 'multi') {
          setSelectedGemstones(defaults);
        } else {
          setSelectedGemstone(defaults[0]);
        }
      }
    }
  }, [gemstoneOptions, selectedGemstone, selectedGemstones.length]);

  useEffect(() => {
    if (caratOptions.length > 1 && !selectedCarat && selectedCarats.length === 0) {
      const defaults = caratOptions.filter(c => c.isDefault).map(c => c.value);
      if (defaults.length > 0) {
        if (caratOptions[0]?.selectionMode === 'multi') {
          setSelectedCarats(defaults);
        } else {
          setSelectedCarat(defaults[0]);
        }
      }
    }
  }, [caratOptions, selectedCarat, selectedCarats.length]);

  useEffect(() => {
    if (attributeOptions.length > 0 && selectedAttributes.length === 0) {
      const defaults = attributeOptions.filter(c => c.isDefault).map(c => c.value);
      if (defaults.length > 0) {
        setSelectedAttributes(defaults);
      }
    }
  }, [attributeOptions, selectedAttributes.length]);

  useEffect(() => {
    if (customOptions.length > 0 && selectedCustomAddons.length === 0) {
      const defaults = customOptions.filter(c => c.isDefault).map(c => c.value);
      if (defaults.length > 0) {
        setSelectedCustomAddons(defaults);
      }
    }
  }, [customOptions]);

  const variationState = useMemo(
    () =>
      computeVariationState({
        options: variantOptions,
        selected: {
          metal: selectedMetal,
          size: selectedSize,
          gemstone: selectedGemstone,
          gemstones: selectedGemstones,
          carat: selectedCarat,
          carats: selectedCarats,
          attributes: selectedAttributes,
          addOns: selectedCustomAddons,
          engravingText,
          engravingFont,
        },
        metalTypes,
        baseMetalType,
        baseWeightGrams,
        baseRatePerGram,
      }),
    [
      variantOptions,
      selectedMetal,
      selectedSize,
      selectedGemstone,
      selectedGemstones,
      selectedCarat,
      selectedCarats,
      selectedAttributes,
      selectedCustomAddons,
      engravingText,
      engravingFont,
      metalTypes,
      baseMetalType,
      baseWeightGrams,
      baseRatePerGram,
    ]
  );

  // Report only real changes; reporting on every render re-rendered the page in a loop.
  const variationSignature = JSON.stringify(variationState);
  useEffect(() => {
    onVariationChange?.(variationState);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [variationSignature]);

  const selectedMetalOption = availableMetals.find(m => m.value === selectedMetal);

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
      {/* Gemstone Quality */}
      {gemstoneOptions.length > 0 && (
        <div className="border border-border rounded-lg p-3">
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-medium text-foreground">
              {gemstoneOptions[0]?.groupLabel || 'Gemstone Quality'}
              {(() => {
                const labels = gemstoneOptions[0]?.selectionMode === 'multi'
                  ? gemstoneOptions.filter(g => selectedGemstones.includes(g.value)).map(g => g.label || g.value)
                  : gemstoneOptions.find(g => g.value === selectedGemstone)?.label
                  ? [gemstoneOptions.find(g => g.value === selectedGemstone)!.label]
                  : gemstoneOptions.find(g => g.value === selectedGemstone)?.value
                  ? [String(gemstoneOptions.find(g => g.value === selectedGemstone)!.value)]
                  : [];
                return labels.length > 0 ? (
                  <>
                    {': '}
                    <span className="text-primary font-semibold">{labels.join(', ')}</span>
                  </>
                ) : null;
              })()}
            </label>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 snap-x scrollbar-thin">
            {gemstoneOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  if (option.selectionMode === 'multi') {
                    setSelectedGemstones((prev) =>
                      prev.includes(option.value)
                        ? prev.filter((id) => id !== option.value)
                        : [...prev, option.value]
                    );
                  } else {
                    setSelectedGemstone(option.value);
                  }
                }}
                className={cn(
                  'shrink-0 snap-start flex min-h-14 flex-col items-start justify-center gap-0.5 rounded-md border-2 px-4 py-2 transition-all text-left',
                  (option.selectionMode === 'multi'
                    ? selectedGemstones.includes(option.value)
                    : selectedGemstone === option.value)
                    ? 'border-primary bg-primary text-primary-foreground shadow-md'
                    : 'border-foreground/30 bg-background text-foreground hover:border-primary hover:bg-accent/30'
                )}
              >
                <span className="text-xs font-medium">
                  {option.label || option.value || 'Option'}
                </span>
                <span className="text-xs opacity-80">
                  {(option as any).subtitle || ' '}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Total Carat Weight */}
      {caratOptions.length > 0 && (
        <div className="border border-border rounded-lg p-3">
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-medium text-foreground">
              {caratOptions[0]?.groupLabel || 'Total Carat Weight'}
              {(() => {
                const labels = caratOptions[0]?.selectionMode === 'multi'
                  ? caratOptions.filter(c => selectedCarats.includes(c.value)).map(c => c.label)
                  : caratOptions.find(c => c.value === selectedCarat)?.label
                  ? [caratOptions.find(c => c.value === selectedCarat)!.label]
                  : [];
                return labels.length > 0 ? (
                  <>
                    {': '}
                    <span className="text-primary font-semibold">{labels.join(', ')}</span>
                  </>
                ) : null;
              })()}
            </label>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 snap-x scrollbar-thin">
            {caratOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  if (option.selectionMode === 'multi') {
                    setSelectedCarats((prev) =>
                      prev.includes(option.value)
                        ? prev.filter((id) => id !== option.value)
                        : [...prev, option.value]
                    );
                  } else {
                    setSelectedCarat(option.value);
                  }
                }}
                className={cn(
                  'shrink-0 snap-start flex min-h-12 items-center justify-center rounded-md border-2 px-4 py-2 transition-all',
                  (option.selectionMode === 'multi'
                    ? selectedCarats.includes(option.value)
                    : selectedCarat === option.value)
                    ? 'border-primary bg-primary text-primary-foreground shadow-md'
                    : 'border-foreground/30 bg-background text-foreground hover:border-primary hover:bg-accent/30'
                )}
              >
                <span className="text-xs font-medium">{option.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Metal Type Selector — text only */}
      {availableMetals.length > 0 && (
        <div className="border border-border rounded-lg p-3">
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-medium text-foreground">
              Metal Type:{' '}
              <span className="text-primary font-semibold">
                {selectedMetalOption?.label || 'Select Metal Type'}
              </span>
            </label>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 snap-x scrollbar-thin">
            {availableMetals.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setSelectedMetal(option.value)}
                className={cn(
                  'shrink-0 snap-start relative min-h-12 rounded-md border-2 px-4 py-2 text-xs font-medium transition-all duration-200 whitespace-nowrap',
                  selectedMetal === option.value
                    ? 'border-primary bg-primary text-primary-foreground shadow-md'
                    : 'border-foreground/30 bg-background text-foreground hover:border-primary hover:bg-accent/30'
                )}
                aria-pressed={selectedMetal === option.value}
                data-metal-type={option.metalType}
                style={{ zIndex: 1 }}
              >
                <span>{option.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Size Selector — Angara style compact pills */}
      {sizeOptions.length > 0 && (
        <div className="border border-border rounded-lg p-3">
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-medium text-foreground">
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
          <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 snap-x scrollbar-thin">
            {sizeOptions.map((size) => (
              <button
                key={size.value}
                type="button"
                onClick={() => setSelectedSize(size.value)}
                disabled={size.stock <= 0}
                className={cn(
                  'shrink-0 snap-start relative overflow-hidden rounded-md border-2 transition-all duration-200',
                  selectedSize === size.value
                    ? 'border-primary bg-primary text-primary-foreground shadow-md'
                    : size.stock <= 0
                    ? 'border-foreground/20 bg-muted opacity-50 cursor-not-allowed'
                    : 'border-foreground/30 bg-background text-foreground hover:border-primary hover:bg-accent/30'
                )}
              >
                {/* Show image if available, otherwise show text pill */}
                {size.imageUrl ? (
                  <div className="flex flex-col items-center p-1">
                    <div className="w-10 h-10 rounded overflow-hidden">
                      <img src={size.imageUrl} alt={size.value} className="w-full h-full object-cover" />
                    </div>
                    <span className="text-xs font-medium mt-0.5">{size.value}</span>
                  </div>
                ) : (
                  <div className="h-10 min-w-[3rem] px-3 flex items-center justify-center">
                    <span className="text-xs font-medium">{size.value}</span>
                  </div>
                )}
                {size.priceAdjustment !== 0 && (
                  <span className="text-xs opacity-80 block text-center pb-0.5">
                    {size.priceAdjustment > 0 ? '+' : ''}₹{Math.abs(size.priceAdjustment)}
                  </span>
                )}
              </button>
            ))}
          </div>
          
          {/* Size Guide Dialog */}
          <SizeGuideDialog
            open={isSizeGuideOpen}
            onOpenChange={setIsSizeGuideOpen}
            category={category}
            selectedSize={selectedSize}
            onSelectSize={(size) => setSelectedSize(size)}
          />
        </div>
      )}

      {/* Add Certificate */}
      {attributeOptions.length > 0 && (
        <div className="border border-border rounded-lg p-3">
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-medium text-foreground">
              {attributeOptions[0]?.groupLabel || 'Gold Colour'}
            </label>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 snap-x scrollbar-thin">
            {attributeOptions.map((cert) => {
              const isMulti = cert.selectionMode === 'multi';
              const selected = selectedAttributes.includes(cert.value);
              return (
                <button
                  key={cert.value}
                  type="button"
                  onClick={() => {
                    setSelectedAttributes((prev) => {
                      if (isMulti) {
                        return prev.includes(cert.value)
                          ? prev.filter((id) => id !== cert.value)
                          : [...prev, cert.value];
                      }
                      return prev.includes(cert.value) ? [] : [cert.value];
                    });
                  }}
                  className={cn(
                    'shrink-0 snap-start flex min-h-12 items-center justify-between gap-2 rounded-md border-2 px-3 py-2 text-left transition-all whitespace-nowrap',
                    selected
                      ? 'border-primary bg-primary text-primary-foreground shadow-md'
                      : 'border-foreground/30 bg-background text-foreground hover:border-primary hover:bg-accent/30'
                  )}
                >
                  <div className="flex items-center gap-2">
                    {cert.imageUrl && (
                      <img src={cert.imageUrl} alt={cert.label} className="w-8 h-8 object-contain" />
                    )}
                      <span className="text-xs font-medium">{cert.label}</span>
                  </div>
                  {cert.priceAdjustment !== 0 && (
                     <span className="text-xs opacity-80">
                      +₹{cert.priceAdjustment.toLocaleString('en-IN')}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Add Ons */}
      {customOptions.length > 0 && (
        <div className="border border-border rounded-lg p-3">
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-medium text-foreground">
              {customOptions[0]?.groupLabel || 'Add Ons'}
            </label>
          </div>
          <div className="grid grid-cols-1 gap-2">
            {customOptions.map((opt) => {
              const isEngraving = opt.label.toLowerCase().includes('engraving') || opt.value.toLowerCase().includes('engraving');
              const isMulti = opt.selectionMode === 'multi';
              const selected = selectedCustomAddons.includes(opt.value);
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    if (isEngraving) {
                      if (!selected) {
                        setSelectedCustomAddons((prev) => [...prev, opt.value]);
                      }
                      setIsEngravingOpen(true);
                      return;
                    }
                    setSelectedCustomAddons((prev) => {
                      if (isMulti) {
                        return prev.includes(opt.value)
                          ? prev.filter((id) => id !== opt.value)
                          : [...prev, opt.value];
                      }
                      return prev.includes(opt.value) ? [] : [opt.value];
                    });
                  }}
                  className={cn(
                    'flex items-center justify-between gap-2 rounded-md border-2 p-2 text-left transition-all',
                    selected ? 'border-primary shadow-md' : 'border-border hover:border-primary/50'
                  )}
                >
                <div className="flex items-center gap-2">
                    {opt.imageUrl && (
                      <img src={opt.imageUrl} alt={opt.label} className="w-8 h-8 object-contain" />
                    )}
                    <span className="text-xs font-medium">{opt.label}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {opt.priceAdjustment === 0 && isEngraving && (
                      <span className="rounded-full bg-primary px-2 py-0.5 text-xs text-primary-foreground">FREE</span>
                    )}
                    {opt.priceAdjustment !== 0 && (
                      <span className="text-xs text-muted-foreground">
                        +₹{opt.priceAdjustment.toLocaleString('en-IN')}
                      </span>
                    )}
                    <span className="text-muted-foreground">+</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Engraving Modal */}
      <Dialog open={isEngravingOpen} onOpenChange={setIsEngravingOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Free Engraving</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="relative h-28 rounded overflow-hidden bg-gradient-to-b from-zinc-200 to-zinc-100 border">
              <div className="absolute inset-0 opacity-90 bg-[radial-gradient(circle_at_top,#f5f5f5,transparent_60%)]" />
              <div className="absolute inset-0 flex items-center justify-center">
                <span
                  className={cn(
                    'text-lg text-zinc-800 select-none',
                    engravingFont === 'script' ? 'font-engrave-script' : 'font-engrave-block'
                  )}
                >
                  {engravingText.trim() || 'Your Text Here'}
                </span>
              </div>
              <div className="absolute bottom-2 left-0 right-0 text-center text-xs text-muted-foreground">
                Preview
              </div>
            </div>
            <div>
              <Label>Enter Text</Label>
              <div className="flex items-center gap-2 mt-1">
                <Input
                  value={engravingText}
                  onChange={(e) => setEngravingText(e.target.value.slice(0, 15))}
                  placeholder="Your Text Here"
                />
                <span className="text-xs text-muted-foreground">
                  {engravingText.length}/15
                </span>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                variant={engravingFont === 'script' ? 'default' : 'outline'}
                onClick={() => setEngravingFont('script')}
                className={cn('px-4', engravingFont === 'script' ? '' : 'bg-transparent')}
              >
                <span className="font-engrave-script text-base">Aa</span>
              </Button>
              <Button
                type="button"
                variant={engravingFont === 'block' ? 'default' : 'outline'}
                onClick={() => setEngravingFont('block')}
                className={cn('px-4', engravingFont === 'block' ? '' : 'bg-transparent')}
              >
                <span className="font-engrave-block text-base">Aa</span>
              </Button>
            </div>
            <div className="text-xs text-muted-foreground space-y-1">
              <p>*Engraved items are not eligible for exchange and returns.</p>
              <p>*An additional day will be added to the estimated delivery time for engraving.</p>
            </div>
            <Button
              type="button"
              className="w-full"
              onClick={() => {
                const text = engravingText.trim();
                if (!text) {
                  setSelectedCustomAddons((prev) =>
                    prev.filter((id) =>
                      !customOptions.find((opt) => opt.value === id)?.label.toLowerCase().includes('engraving')
                    )
                  );
                  setEngravingText('');
                }
                setIsEngravingOpen(false);
              }}
            >
              Save Text
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Weight Display */}
      <div className="flex items-center justify-between py-3 border-t border-border">
        <span className="text-sm text-muted-foreground">Net Weight</span>
        <span className="font-semibold">
          {(baseWeightGrams + 
            (availableMetals.find(m => m.value === selectedMetal)?.weightAdjustment || 0) +
            (sizeOptions.find(s => s.value === selectedSize)?.weightAdjustment || 0)
          ).toFixed(2)} grams
        </span>
      </div>
    </div>
  );
}
