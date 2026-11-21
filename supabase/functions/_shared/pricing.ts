// Single source of truth for jewellery pricing.
//
// The storefront (product page, cart, checkout) and the place-order edge
// function both import this file, so the price a customer sees is the price
// the server charges. Keep it free of imports: it must run unchanged in Deno
// (edge functions) and in Vite (the storefront).
//
// The option-building and selection logic was moved here from
// src/components/product/ProductVariantSelector.tsx and the adjusted-price
// logic from src/pages/ProductDetail.tsx, keeping their behaviour, with three
// deliberate changes:
//   1. GST is worked out on the rounded subtotal and total = subtotal + GST,
//      so every price on an invoice adds up (changes totals by at most ₹1).
//   2. On the product page a product's fixed diamond cost is no longer dropped
//      when it has no diamond-quality options (the listing already included it).
//   3. The cart now uses metal_types rates like the product page does.

/* eslint-disable @typescript-eslint/no-explicit-any */

export const METAL_TYPE_NAMES: Record<string, string> = {
  gold_22k: '22K Gold',
  gold_24k: '24K Gold',
  gold_18k: '18K Gold',
  silver: 'Silver',
  platinum: 'Platinum',
};

export const CATEGORY_SIZE_OPTIONS: Record<string, { label: string; sizes: string[] }> = {
  rings: { label: 'Ring Size', sizes: ['5', '6', '7', '8', '9', '10', '11', '12', '13', '14', '15', '16', '17', '18'] },
  bangles: { label: 'Bangle Size', sizes: ['2.2', '2.4', '2.6', '2.8', '3.0'] },
  bracelets: { label: 'Bracelet Length', sizes: ['6"', '6.5"', '7"', '7.5"', '8"', '8.5"'] },
  necklaces: { label: 'Chain Length', sizes: ['16"', '18"', '20"', '22"', '24"', '26"', '28"', '30"'] },
  chains: { label: 'Chain Length', sizes: ['16"', '18"', '20"', '22"', '24"', '26"', '28"', '30"'] },
};

// Metal type options shown when a product has no metal options of its own.
export const METAL_OPTIONS: { type: string; label: string }[] = [
  { type: 'gold_24k', label: '24K Gold' },
  { type: 'gold_22k', label: '22K Gold' },
  { type: 'gold_18k', label: '18K Gold' },
  { type: 'silver', label: 'Silver' },
  { type: 'platinum', label: 'Platinum' },
];

// Longest engraving the product page accepts.
export const MAX_ENGRAVING_LENGTH = 15;

export interface PricingProduct {
  id?: string;
  name?: string;
  category?: string | null;
  metal_type: string;
  metal_type_id?: string | null;
  weight_grams: number;
  making_charge_percent?: number | null;
  diamond_cost?: number | null;
  stone_cost?: number | null;
  specifications?: unknown;
}

export interface PricingGoldRate {
  rate_22k: number;
  rate_24k: number;
  rate_18k: number | null;
}

export interface PricingMetalType {
  id: string;
  slug: string;
  name?: string;
  rate_per_gram: number;
}

export interface PricingVariation {
  id: string;
  product_id?: string;
  variation_type: string;
  size_value: string | null;
  size_label: string | null;
  metal_type: string | null;
  metal_label?: string | null;
  price_adjustment: number | null;
  weight_adjustment: number | null;
  stock_quantity?: number | null;
  is_available: boolean | null;
  is_default: boolean | null;
  image_url: string | null;
  variation_group?: string | null;
  selection_mode?: string | null;
}

export interface CalculatedPrice {
  gold_value: number;
  making_charges: number;
  subtotal: number;
  gst: number;
  total: number;
  gold_rate_applied: number;
}

export interface PriceBreakdown extends CalculatedPrice {
  metal_slug: string;
  metal_weight_grams: number;
  making_charge_percent: number;
  diamond_cost: number;
  stone_cost: number;
  attribute_extra: number;
}

const num = (value: unknown): number => {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
};

export function getPricingOptions(specifications: unknown): Record<string, any> {
  const spec = specifications as Record<string, any> | null | undefined;
  const options = spec && typeof spec === 'object' ? spec.pricing_options : null;
  return options && typeof options === 'object' ? options : {};
}

// Price of a product at the current rates. Without `options.selection` it uses
// the product's own default pricing options (what product cards show).
export function calculateProductPrice(
  product: PricingProduct,
  goldRate: PricingGoldRate | null | undefined,
  categoryMakingCharge?: number,
  gstRatePercent?: number,
  metalTypes?: PricingMetalType[],
  options?: {
    selection?: {
      metalSlug?: string;
      diamondCost?: number;
      attributeExtra?: number;
      metalWeightGrams?: number;
    };
    usePricingOptionsDefaults?: boolean;
  },
): PriceBreakdown {
  if (!goldRate) {
    return {
      gold_value: 0,
      making_charges: 0,
      subtotal: 0,
      gst: 0,
      total: 0,
      gold_rate_applied: 0,
      metal_slug: product.metal_type,
      metal_weight_grams: num(product.weight_grams),
      making_charge_percent: 0,
      diamond_cost: 0,
      stone_cost: 0,
      attribute_extra: 0,
    };
  }

  const useDefaults = options?.usePricingOptionsDefaults !== false;
  const pricingOptions = getPricingOptions(product.specifications);
  const defaultMetalSlug =
    useDefaults && Array.isArray(pricingOptions.metals) && pricingOptions.metals.length > 0
      ? (typeof pricingOptions.metals[0] === 'string'
          ? pricingOptions.metals[0]
          : pricingOptions.metals[0]?.slug || pricingOptions.metals[0]?.metal_type)
      : null;
  const selectedMetalSlug: string = options?.selection?.metalSlug || defaultMetalSlug || product.metal_type;

  const defaultDiamondQuality = useDefaults && Array.isArray(pricingOptions.diamond_qualities)
    ? pricingOptions.diamond_qualities.find((q: any) => q?.is_default) || pricingOptions.diamond_qualities[0]
    : null;
  const defaultCaratWeight = useDefaults && Array.isArray(pricingOptions.carat_weights)
    ? pricingOptions.carat_weights.find((w: any) => w?.is_default)?.value ?? pricingOptions.carat_weights[0]?.value ?? pricingOptions.carat_weights[0]
    : null;
  const defaultDiamondCost = defaultDiamondQuality && defaultCaratWeight
    ? (Number(defaultDiamondQuality.rate_per_carat) || 0) * (Number(defaultCaratWeight) || 0)
    : 0;

  const defaultAttributeExtra = useDefaults && Array.isArray(pricingOptions.attributes)
    ? pricingOptions.attributes
        .filter((a: any) => a?.is_default)
        .reduce((sum: number, a: any) => sum + (Number(a.price) || 0), 0)
    : 0;

  // Rate from metal_types first (managed in admin), falling back to gold_rates.
  let goldRatePerGram = 0;
  const metalTypeRecord =
    metalTypes?.find((mt) => mt.slug === selectedMetalSlug) ||
    (product.metal_type_id ? metalTypes?.find((mt) => mt.id === product.metal_type_id) : undefined);
  if (metalTypeRecord && num(metalTypeRecord.rate_per_gram) > 0) {
    goldRatePerGram = num(metalTypeRecord.rate_per_gram);
  } else {
    switch (selectedMetalSlug) {
      case 'gold_24k':
        goldRatePerGram = num(goldRate.rate_24k);
        break;
      case 'gold_18k':
        goldRatePerGram = num(goldRate.rate_18k) || num(goldRate.rate_22k) * 0.75;
        break;
      case 'gold_22k':
      default:
        goldRatePerGram = num(goldRate.rate_22k);
        break;
    }
  }

  // Metal-specific weight (pricing_options.metals can store per-metal weights).
  let metalWeightGrams = num(product.weight_grams);
  let defaultMetalWeight = num(product.weight_grams);
  if (Array.isArray(pricingOptions.metals) && pricingOptions.metals.length > 0) {
    const first = pricingOptions.metals[0];
    if (first && typeof first === 'object') {
      const firstWeight = Number(first.weight_grams);
      if (Number.isFinite(firstWeight) && firstWeight > 0) {
        defaultMetalWeight = firstWeight;
      }
    }
  }

  if (typeof options?.selection?.metalWeightGrams === 'number' && Number.isFinite(options.selection.metalWeightGrams)) {
    metalWeightGrams = options.selection.metalWeightGrams;
  } else if (Array.isArray(pricingOptions.metals)) {
    let foundWeight = false;
    for (const m of pricingOptions.metals) {
      if (m && typeof m === 'object') {
        const slug = m.slug || m.metal_type;
        const weight = Number(m.weight_grams);
        if (slug === selectedMetalSlug && Number.isFinite(weight) && weight > 0) {
          metalWeightGrams = weight;
          foundWeight = true;
          break;
        }
      }
    }
    if (!foundWeight) {
      metalWeightGrams = defaultMetalWeight;
    }
  }

  const goldValue = metalWeightGrams * goldRatePerGram;

  // Product-specific making charge, else the category default, else 12%.
  const makingChargePercent = num(product.making_charge_percent) || categoryMakingCharge || 12;
  const makingCharges = goldValue * (makingChargePercent / 100);

  const resolvedDiamondCost =
    typeof options?.selection?.diamondCost === 'number'
      ? options.selection.diamondCost
      : defaultDiamondCost > 0
      ? defaultDiamondCost
      : num(product.diamond_cost);
  const resolvedAttributeExtra =
    typeof options?.selection?.attributeExtra === 'number'
      ? options.selection.attributeExtra
      : defaultAttributeExtra;
  const stoneCost = num(product.stone_cost);

  const subtotal = Math.round(goldValue + makingCharges + resolvedDiamondCost + stoneCost + resolvedAttributeExtra);
  const gstRate = typeof gstRatePercent === 'number' ? gstRatePercent : 3;
  const gst = Math.round(subtotal * (gstRate / 100));

  return {
    gold_value: Math.round(goldValue),
    making_charges: Math.round(makingCharges),
    subtotal,
    gst,
    total: subtotal + gst,
    gold_rate_applied: goldRatePerGram,
    metal_slug: selectedMetalSlug,
    metal_weight_grams: metalWeightGrams,
    making_charge_percent: makingChargePercent,
    diamond_cost: resolvedDiamondCost,
    stone_cost: stoneCost,
    attribute_extra: resolvedAttributeExtra,
  };
}

// ---------------------------------------------------------------------------
// Variant options (moved from ProductVariantSelector)
// ---------------------------------------------------------------------------

export interface VariantOption {
  value: string;
  label: string;
  subtitle?: string;
  metalType?: string;
  priceAdjustment: number;
  weightAdjustment?: number;
  stock?: number;
  isDefault: boolean;
  imageUrl: string | null;
  selectionMode?: string;
  groupLabel?: string;
}

export interface VariantOptions {
  useSpecOptions: boolean;
  sizeLabel: string;
  availableMetals: VariantOption[];
  sizeOptions: VariantOption[];
  gemstoneOptions: VariantOption[];
  caratOptions: VariantOption[];
  attributeOptions: VariantOption[];
  customOptions: VariantOption[];
}

export interface BuildVariantOptionsInput {
  category?: string | null;
  baseMetalType: string;
  baseWeightGrams: number;
  specifications: unknown;
  variations: PricingVariation[];
  metalTypes: PricingMetalType[];
  // Rows of the admin size chart for the category; the first column is the size.
  sizeChartRows?: Record<string, unknown>[] | null;
}

const isUuidLike = (value?: string | null) =>
  !!value && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);

const looksLikeUrl = (value?: string | null) => !!value && /^https?:\/\//i.test(value);

const normalizeLabel = (label?: string | null, value?: string | null) => {
  const trimmedLabel = label?.trim();
  if (trimmedLabel) return trimmedLabel;
  if (value && !isUuidLike(value) && !looksLikeUrl(value)) return value;
  return 'Option';
};

const inferImageUrl = (explicit: string | null, fallbackA?: string | null, fallbackB?: string | null) => {
  if (explicit) return explicit;
  if (looksLikeUrl(fallbackA)) return fallbackA as string;
  if (looksLikeUrl(fallbackB)) return fallbackB as string;
  return null;
};

export const parseCaratWeight = (value?: string | null, label?: string | null) => {
  const candidate = `${value || ''} ${label || ''}`.trim();
  const match = candidate.match(/([0-9]*\.?[0-9]+)/);
  if (!match) return 0;
  const parsed = parseFloat(match[1]);
  return Number.isFinite(parsed) ? parsed : 0;
};

export function buildVariantOptions(input: BuildVariantOptionsInput): VariantOptions {
  const { category, baseMetalType, baseWeightGrams, specifications, variations, metalTypes } = input;
  const pricingOptions = getPricingOptions(specifications);

  const specMetals: { slug: string; weightGrams?: number }[] = Array.isArray(pricingOptions.metals)
    ? pricingOptions.metals
        .map((m: any) => {
          if (typeof m === 'string') return { slug: m };
          if (m && typeof m.slug === 'string') return { slug: m.slug, weightGrams: Number(m.weight_grams) };
          if (m && typeof m.metal_type === 'string') return { slug: m.metal_type, weightGrams: Number(m.weight_grams) };
          return null;
        })
        .filter((m: any) => m && typeof m.slug === 'string') as { slug: string; weightGrams?: number }[]
    : [];
  const specDiamondQualities: { label: string; subtitle: string; rate_per_carat: number; is_default: boolean }[] =
    Array.isArray(pricingOptions.diamond_qualities)
      ? pricingOptions.diamond_qualities
          .filter((q: any) => q && typeof q.label === 'string')
          .map((q: any) => ({
            label: q.label,
            subtitle: typeof q.subtitle === 'string' ? q.subtitle : '',
            rate_per_carat: Number(q.rate_per_carat) || 0,
            is_default: !!q.is_default,
          }))
      : [];
  const specCaratWeights: { value: number; is_default: boolean }[] = Array.isArray(pricingOptions.carat_weights)
    ? pricingOptions.carat_weights
        .map((w: any) => {
          if (typeof w === 'number') return { value: w, is_default: false };
          if (w && typeof w.value === 'number') return { value: Number(w.value) || 0, is_default: !!w.is_default };
          return null;
        })
        .filter((w: any) => w && Number.isFinite(w.value) && w.value > 0) as { value: number; is_default: boolean }[]
    : [];
  const specAttributes: { label: string; price: number; is_default: boolean }[] = Array.isArray(pricingOptions.attributes)
    ? pricingOptions.attributes
        .filter((c: any) => c && typeof c.label === 'string')
        .map((c: any) => ({ label: c.label, price: Number(c.price) || 0, is_default: !!c.is_default }))
    : [];
  const useSpecOptions =
    specMetals.length > 0 || specDiamondQualities.length > 0 || specCaratWeights.length > 0 || specAttributes.length > 0;

  const sizeVariations = variations.filter((v) => v.variation_type === 'size');
  const metalVariations = variations.filter((v) => v.variation_type === 'metal_type');
  const gemstoneVariations = variations.filter((v) => v.variation_type === 'gemstone_quality');
  const caratVariations = variations.filter((v) => v.variation_type === 'carat_weight');
  const certificateVariations = variations.filter((v) => v.variation_type === 'certificate');
  const customVariations = variations.filter((v) => v.variation_type === 'custom');

  const categoryConfig = category ? CATEGORY_SIZE_OPTIONS[category] : undefined;

  const rawSizeOptions: VariantOption[] = sizeVariations.length > 0
    ? sizeVariations.filter((v) => v.is_available).map((v) => ({
        value: v.size_value || '',
        label: v.size_label || '',
        priceAdjustment: v.price_adjustment || 0,
        weightAdjustment: v.weight_adjustment || 0,
        stock: v.stock_quantity || 0,
        isDefault: !!v.is_default,
        imageUrl: v.image_url || null,
      }))
    : categoryConfig?.sizes.map((s) => ({
        value: s,
        label: categoryConfig.label,
        priceAdjustment: 0,
        weightAdjustment: 0,
        stock: 1,
        isDefault: false,
        imageUrl: null,
      })) || [];

  const sizeVariationMap = new Map(rawSizeOptions.map((option) => [String(option.value).trim(), option]));

  // If a size chart exists, it is the source of truth for the visible sizes.
  const chartRows = Array.isArray(input.sizeChartRows) ? input.sizeChartRows : [];
  const sizeOptions: VariantOption[] = chartRows.length
    ? (chartRows
        .map((row) => {
          const firstKey = Object.keys(row)[0];
          const sizeValue = String(row[firstKey] ?? '').trim();
          if (!sizeValue) return null;
          const matchedVariation = sizeVariationMap.get(sizeValue);
          return {
            value: sizeValue,
            label: matchedVariation?.label || categoryConfig?.label || 'Size',
            priceAdjustment: matchedVariation?.priceAdjustment || 0,
            weightAdjustment: matchedVariation?.weightAdjustment || 0,
            stock: matchedVariation ? matchedVariation.stock : 1,
            isDefault: matchedVariation?.isDefault || false,
            imageUrl: matchedVariation?.imageUrl || null,
          };
        })
        .filter(Boolean) as VariantOption[])
    : rawSizeOptions;

  const defaultSpecMetalSlug = Array.isArray(pricingOptions.metals) && pricingOptions.metals.length > 0
    ? (typeof pricingOptions.metals[0] === 'string'
        ? pricingOptions.metals[0]
        : pricingOptions.metals[0]?.slug || pricingOptions.metals[0]?.metal_type)
    : null;
  const defaultSpecMetalWeight = (() => {
    if (defaultSpecMetalSlug) {
      const match = specMetals.find((m) => m.slug === defaultSpecMetalSlug);
      if (match && Number.isFinite(match.weightGrams) && (match.weightGrams as number) > 0) {
        return match.weightGrams as number;
      }
    }
    const anyWeight = specMetals.find((m) => Number.isFinite(m.weightGrams) && (m.weightGrams as number) > 0);
    return anyWeight?.weightGrams ?? baseWeightGrams;
  })();

  const specMetalOptions: VariantOption[] = specMetals.map((metal) => {
    const mt = metalTypes.find((m) => m.slug === metal.slug);
    const label = mt?.name || METAL_TYPE_NAMES[metal.slug] || metal.slug;
    const resolvedWeight = Number.isFinite(metal.weightGrams) && (metal.weightGrams as number) > 0
      ? (metal.weightGrams as number)
      : defaultSpecMetalWeight;
    return {
      value: metal.slug,
      label,
      metalType: metal.slug,
      priceAdjustment: 0,
      weightAdjustment: resolvedWeight - baseWeightGrams,
      isDefault: metal.slug === baseMetalType,
      imageUrl: null,
    };
  });

  const availableMetals: VariantOption[] = useSpecOptions && specMetals.length > 0
    ? specMetalOptions
    : metalVariations.length > 0
    ? metalVariations
        .filter((v) => v.is_available)
        .map((v) => ({
          value: v.id,
          label:
            v.metal_label ||
            (v.metal_type ? METAL_TYPE_NAMES[v.metal_type] : null) ||
            v.size_label ||
            v.size_value ||
            'Metal',
          metalType: v.metal_type || baseMetalType,
          priceAdjustment: v.price_adjustment || 0,
          weightAdjustment: v.weight_adjustment || 0,
          isDefault: v.is_default || false,
          imageUrl: v.image_url || null,
        }))
    : METAL_OPTIONS.map((m) => ({
        value: m.type,
        label: m.label,
        metalType: m.type,
        priceAdjustment: 0,
        weightAdjustment: 0,
        isDefault: m.type === baseMetalType,
        imageUrl: null,
      }));

  const gemstoneOptions: VariantOption[] = useSpecOptions && specDiamondQualities.length > 0
    ? specDiamondQualities.map((q) => ({
        value: q.label,
        label: q.label,
        subtitle: q.subtitle,
        priceAdjustment: q.rate_per_carat,
        weightAdjustment: 0,
        isDefault: q.is_default,
        imageUrl: null,
        selectionMode: 'single',
        groupLabel: 'Diamond Quality',
      }))
    : gemstoneVariations.length > 0
    ? gemstoneVariations.filter((v) => v.is_available).map((v) => ({
        value: v.size_value || v.size_label || v.id,
        label: normalizeLabel(v.size_label || v.size_value || v.metal_label || '', v.size_value || v.size_label || v.id),
        priceAdjustment: v.price_adjustment || 0,
        weightAdjustment: v.weight_adjustment || 0,
        isDefault: !!v.is_default,
        imageUrl: inferImageUrl(v.image_url || null, v.size_value, v.size_label),
        selectionMode: v.selection_mode || 'single',
        groupLabel: v.variation_group || 'Gemstone Quality',
      }))
    : [];

  const caratOptions: VariantOption[] = useSpecOptions && specCaratWeights.length > 0
    ? specCaratWeights.map((w) => ({
        value: String(w.value),
        label: `${w.value} ct`,
        priceAdjustment: 0,
        weightAdjustment: 0,
        isDefault: w.is_default,
        imageUrl: null,
        selectionMode: 'single',
        groupLabel: 'Total Carat Weight',
      }))
    : caratVariations.length > 0
    ? caratVariations.filter((v) => v.is_available).map((v) => ({
        value: v.size_value || v.size_label || v.id,
        label: normalizeLabel(v.size_label || v.size_value || '', v.size_value || v.size_label || v.id),
        priceAdjustment: v.price_adjustment || 0,
        weightAdjustment: v.weight_adjustment || 0,
        isDefault: !!v.is_default,
        imageUrl: inferImageUrl(v.image_url || null, v.size_value, v.size_label),
        selectionMode: v.selection_mode || 'single',
        groupLabel: v.variation_group || 'Total Carat Weight',
      }))
    : [];

  const attributeOptions: VariantOption[] = useSpecOptions && specAttributes.length > 0
    ? specAttributes.map((c) => ({
        value: c.label,
        label: c.label,
        priceAdjustment: c.price,
        imageUrl: null,
        isDefault: c.is_default,
        selectionMode: 'single',
        groupLabel: 'Gold Colour',
      }))
    : certificateVariations.length > 0
    ? certificateVariations.filter((v) => v.is_available).map((v) => ({
        value: v.id,
        label: normalizeLabel(v.size_label || v.size_value || '', v.id),
        priceAdjustment: v.price_adjustment || 0,
        imageUrl: inferImageUrl(v.image_url || null, v.size_value, v.size_label),
        isDefault: !!v.is_default,
        selectionMode: v.selection_mode || 'single',
        groupLabel: v.variation_group || 'Gold Colour',
      }))
    : [];

  const customOptions: VariantOption[] = customVariations.length > 0
    ? customVariations.filter((v) => v.is_available).map((v) => ({
        value: v.id,
        label: normalizeLabel(v.size_label || v.size_value || '', v.id),
        priceAdjustment: v.price_adjustment || 0,
        imageUrl: inferImageUrl(v.image_url || null, v.size_value, v.size_label),
        isDefault: !!v.is_default,
        selectionMode: v.selection_mode || 'multi',
        groupLabel: v.variation_group || 'Add Ons',
      }))
    : [];

  return {
    useSpecOptions,
    sizeLabel: categoryConfig?.label || 'Size',
    availableMetals,
    sizeOptions,
    gemstoneOptions,
    caratOptions,
    attributeOptions,
    customOptions,
  };
}

// ---------------------------------------------------------------------------
// Selection → variation state (moved from ProductVariantSelector's effect)
// ---------------------------------------------------------------------------

export interface SelectedValues {
  metal: string;
  size: string;
  gemstone: string;
  gemstones: string[];
  carat: string;
  carats: string[];
  attributes: string[];
  addOns: string[];
  engravingText?: string;
  engravingFont?: 'script' | 'block';
}

export interface OptionValues {
  metal: string | null;
  size: string | null;
  gemstones: string[];
  carats: string[];
  attributes: string[];
  addOns: string[];
}

export interface SelectedOptions {
  gemstoneQuality?: string | string[] | null;
  caratWeight?: string | string[] | null;
  attributes?: string[];
  addOns?: string[];
  engraving?: { text: string; font: 'script' | 'block' };
  metalType: string;
  metalTypeSlug?: string;
  size?: string | null;
  // Exact option values, so the server can re-price the selection. Older carts
  // do not have this and are matched by label instead.
  _optionValues?: OptionValues;
}

export interface VariationExtra {
  label: string;
  amount: number;
  type: 'attribute' | 'addon' | 'size' | 'metal';
}

export interface VariationState {
  metalType: string;
  metalTypeSlug: string;
  size: string | null;
  priceAdjustment: number;
  weightAdjustment: number;
  imageUrl: string | null;
  isComplete?: boolean;
  pricing?: {
    metalRatePerGram: number;
    metalWeightGrams: number;
    diamondRatePerCarat: number;
    diamondCaratWeight: number;
    diamondCost: number;
    extras?: VariationExtra[];
    extraTotal?: number;
  };
  selectedOptions?: SelectedOptions;
}

export function computeVariationState(params: {
  options: VariantOptions;
  selected: SelectedValues;
  metalTypes: PricingMetalType[];
  baseMetalType: string;
  baseWeightGrams: number;
  baseRatePerGram?: number;
}): VariationState {
  const { options, selected, metalTypes, baseMetalType, baseWeightGrams, baseRatePerGram } = params;
  const { availableMetals, sizeOptions, gemstoneOptions, caratOptions, attributeOptions, customOptions, sizeLabel } = options;

  const selectedMetalOption = availableMetals.find((m) => m.value === selected.metal);
  // Compared trimmed: size chart values are trimmed, stored size values may not be.
  const selectedSizeOption = selected.size
    ? sizeOptions.find((s) => String(s.value).trim() === String(selected.size).trim())
    : undefined;
  const gemstoneIsMulti = gemstoneOptions[0]?.selectionMode === 'multi';
  const caratIsMulti = caratOptions[0]?.selectionMode === 'multi';
  const selectedGemOption = gemstoneOptions.find((g) => g.value === selected.gemstone);
  const selectedCaratOption = caratOptions.find((c) => c.value === selected.carat);
  const selectedGemOptions = gemstoneIsMulti
    ? gemstoneOptions.filter((g) => selected.gemstones.includes(g.value))
    : selectedGemOption
    ? [selectedGemOption]
    : [];
  const selectedCaratOptions = caratIsMulti
    ? caratOptions.filter((c) => selected.carats.includes(c.value))
    : selectedCaratOption
    ? [selectedCaratOption]
    : [];
  const selectedCertOptions = attributeOptions.filter((c) => selected.attributes.includes(c.value));
  const selectedCustomOptions = customOptions.filter((c) => selected.addOns.includes(c.value));
  const engravingOption = customOptions.find(
    (c) => c.label.toLowerCase().includes('engraving') || c.value.toLowerCase().includes('engraving'),
  );
  const engravingSelected = engravingOption ? selected.addOns.includes(engravingOption.value) : false;

  // Only metal/size images swap the main product image.
  const imageUrl = selectedMetalOption?.imageUrl || selectedSizeOption?.imageUrl || null;

  // A choice only counts when it matches a current option, so a value left
  // over from before the options loaded cannot be priced or ordered.
  const gemstoneComplete = gemstoneOptions.length === 0 || selectedGemOptions.length > 0;
  const caratComplete = caratOptions.length === 0 || selectedCaratOptions.length > 0;
  const metalComplete = availableMetals.length === 0 || !!selectedMetalOption;
  const sizeComplete = sizeOptions.length === 0 || !!selected.size;
  const isComplete = metalComplete && sizeComplete && gemstoneComplete && caratComplete;

  const getRateBySlug = (slug?: string | null) => metalTypes.find((mt) => mt.slug === slug)?.rate_per_gram ?? null;

  const baseRate = typeof baseRatePerGram === 'number' && baseRatePerGram > 0
    ? baseRatePerGram
    : getRateBySlug(baseMetalType) || 0;
  const selectedRate = getRateBySlug(selectedMetalOption?.metalType || baseMetalType) || baseRate;
  const metalRateDelta = baseRate > 0 ? (selectedRate - baseRate) * baseWeightGrams : 0;
  const explicitMetalAdjustment = selectedMetalOption?.priceAdjustment || 0;
  const metalPriceAdjustment = explicitMetalAdjustment !== 0 ? explicitMetalAdjustment : metalRateDelta;

  const certificatePrice = selectedCertOptions.reduce((sum, cert) => sum + (cert.priceAdjustment || 0), 0);
  const customPrice = selectedCustomOptions.reduce((sum, opt) => sum + (opt.priceAdjustment || 0), 0);
  const totalCaratWeight = selectedCaratOptions.reduce((sum, c) => sum + parseCaratWeight(c.value, c.label), 0);
  const perCaratRate = selectedGemOptions.reduce((sum, g) => sum + (g.priceAdjustment || 0), 0);
  const diamondCost = perCaratRate > 0 && totalCaratWeight > 0 ? perCaratRate * totalCaratWeight : 0;
  const gemstoneFallbackPrice = totalCaratWeight <= 0
    ? selectedGemOptions.reduce((sum, g) => sum + (g.priceAdjustment || 0), 0)
    : 0;
  const caratExtraPrice = selectedCaratOptions.reduce((sum, c) => sum + (c.priceAdjustment || 0), 0);

  const metalTypeSlug = selectedMetalOption?.metalType || baseMetalType;
  const metalTypeLabel = selectedMetalOption?.label || METAL_TYPE_NAMES[baseMetalType] || selected.metal;
  const metalWeightGrams =
    baseWeightGrams + (selectedMetalOption?.weightAdjustment || 0) + (selectedSizeOption?.weightAdjustment || 0);

  const extras: VariationExtra[] = [
    ...selectedCertOptions.map((c) => ({ label: c.label, amount: c.priceAdjustment || 0, type: 'attribute' as const })),
    ...selectedCustomOptions.map((o) => ({ label: o.label, amount: o.priceAdjustment || 0, type: 'addon' as const })),
    ...(selectedSizeOption?.priceAdjustment
      ? [{ label: `${sizeLabel} Adjustment`, amount: selectedSizeOption.priceAdjustment, type: 'size' as const }]
      : []),
    ...(explicitMetalAdjustment !== 0
      ? [{ label: `${metalTypeLabel} Adjustment`, amount: explicitMetalAdjustment, type: 'metal' as const }]
      : []),
  ];
  const extrasTotal = extras.reduce((sum, e) => sum + (e.amount || 0), 0);

  const engravingText = selected.engravingText?.trim() || '';

  return {
    metalType: metalTypeLabel,
    metalTypeSlug,
    size: selected.size || null,
    priceAdjustment:
      metalPriceAdjustment +
      (selectedSizeOption?.priceAdjustment || 0) +
      diamondCost +
      gemstoneFallbackPrice +
      caratExtraPrice +
      certificatePrice +
      customPrice,
    weightAdjustment: (selectedMetalOption?.weightAdjustment || 0) + (selectedSizeOption?.weightAdjustment || 0),
    imageUrl,
    isComplete,
    pricing: {
      metalRatePerGram: selectedRate,
      metalWeightGrams,
      diamondRatePerCarat: perCaratRate,
      diamondCaratWeight: totalCaratWeight,
      diamondCost,
      extras,
      extraTotal: extrasTotal,
    },
    selectedOptions: {
      gemstoneQuality: gemstoneIsMulti
        ? selectedGemOptions.map((g) => g.label)
        : selectedGemOption?.label || selectedGemOption?.value || null,
      caratWeight: caratIsMulti
        ? selectedCaratOptions.map((c) => c.label)
        : selectedCaratOption?.label || selectedCaratOption?.value || null,
      attributes: selectedCertOptions.map((cert) => cert.label),
      addOns: selectedCustomOptions.map((opt) => opt.label),
      engraving: engravingSelected && engravingText
        ? { text: engravingText, font: selected.engravingFont || 'script' }
        : undefined,
      metalType: metalTypeLabel,
      metalTypeSlug,
      size: selected.size || null,
      _optionValues: {
        metal: selectedMetalOption?.value ?? null,
        size: selected.size || null,
        gemstones: selectedGemOptions.map((g) => g.value),
        carats: selectedCaratOptions.map((c) => c.value),
        attributes: selectedCertOptions.map((c) => c.value),
        addOns: selectedCustomOptions.map((o) => o.value),
      },
    },
  };
}

// The weight the product page treats as the base: the first pricing metal's
// weight when set, else the product weight.
export function getBaseWeightGrams(product: PricingProduct): number {
  const pricingOptions = getPricingOptions(product.specifications);
  const firstPricingMetal = Array.isArray(pricingOptions.metals) && pricingOptions.metals.length > 0
    ? pricingOptions.metals[0]
    : null;
  const defaultMetalWeight = firstPricingMetal && typeof firstPricingMetal === 'object'
    ? Number(firstPricingMetal.weight_grams) || 0
    : 0;
  return defaultMetalWeight > 0 ? defaultMetalWeight : num(product.weight_grams);
}

// Price of a product with the customer's chosen options (moved from ProductDetail).
export function priceWithVariation(params: {
  product: PricingProduct;
  variationState: VariationState | null;
  goldRate: PricingGoldRate | null | undefined;
  gstRate: number;
  metalTypes: PricingMetalType[];
}): PriceBreakdown {
  const { product, variationState, goldRate, gstRate, metalTypes } = params;
  const baseWeightGrams = getBaseWeightGrams(product);

  const selectedMetalSlug = variationState?.metalTypeSlug || product.metal_type;
  const selectedWeightGrams = baseWeightGrams + (variationState?.weightAdjustment || 0);
  const optionDiamondCost = num(variationState?.pricing?.diamondCost);
  const selectedDiamondCost = optionDiamondCost > 0 ? optionDiamondCost : num(product.diamond_cost);

  const effective = calculateProductPrice(
    {
      ...product,
      metal_type: selectedMetalSlug,
      weight_grams: selectedWeightGrams,
      diamond_cost: selectedDiamondCost,
    },
    goldRate,
    undefined,
    gstRate,
    metalTypes,
    variationState
      ? {
          selection: {
            metalSlug: selectedMetalSlug,
            diamondCost: selectedDiamondCost,
            attributeExtra: 0,
            metalWeightGrams: selectedWeightGrams,
          },
          usePricingOptionsDefaults: false,
        }
      : undefined,
  );

  if (!goldRate) return effective;

  const extraTotal = num(variationState?.pricing?.extraTotal);
  const subtotal = Math.round(effective.subtotal + extraTotal);
  const gst = Math.round(subtotal * (gstRate / 100));
  return {
    ...effective,
    subtotal,
    gst,
    total: subtotal + gst,
    attribute_extra: effective.attribute_extra + extraTotal,
  };
}

// ---------------------------------------------------------------------------
// Cart lines (shared by the cart and the place-order function)
// ---------------------------------------------------------------------------

export type LineError = 'OPTION_UNAVAILABLE' | 'INCOMPLETE_SELECTION' | 'NO_RATE';

export interface PricedLine {
  unitSubtotal: number;
  unitGst: number;
  unitTotal: number;
  quantity: number;
  lineSubtotal: number;
  lineGst: number;
  lineTotal: number;
  goldRateApplied: number;
  goldValue: number;
  makingCharges: number;
  diamondCost: number;
  stoneCost: number;
  weightGrams: number;
  metalSlug: string;
  // Difference from the product's listing price, kept for order records.
  variationPriceAdjustment: number;
  variationWeightAdjustment: number;
  // The selection as stored on the order (labels only, no internal ids).
  selectedVariations: Record<string, unknown>;
  error: LineError | null;
}

const asArray = (value: unknown): string[] =>
  Array.isArray(value)
    ? value.filter((v) => v !== null && v !== undefined).map((v) => String(v))
    : value === null || value === undefined || value === ''
    ? []
    : [String(value)];

export function hasSelection(selection: unknown): selection is SelectedOptions {
  if (!selection || typeof selection !== 'object') return false;
  const s = selection as Record<string, unknown>;
  return typeof s.metalTypeSlug === 'string' || typeof s.metalType === 'string' || !!s._optionValues;
}

// Turns a stored selection back into option values. Returns null when an option
// it names no longer exists.
export function resolveSelection(options: VariantOptions, selection: SelectedOptions): SelectedValues | null {
  const stored = selection._optionValues;
  const gemIsMulti = options.gemstoneOptions[0]?.selectionMode === 'multi';
  const caratIsMulti = options.caratOptions[0]?.selectionMode === 'multi';
  // Engraving is the only free text a customer sends with an item: keep it to
  // the length the product page allows and to the two fonts on offer.
  const rawEngraving = (selection as { engraving?: { text?: unknown; font?: unknown } }).engraving;
  const engravingText = rawEngraving && typeof rawEngraving.text === 'string'
    ? rawEngraving.text.trim().slice(0, MAX_ENGRAVING_LENGTH)
    : undefined;
  const engravingFont: 'script' | 'block' = rawEngraving?.font === 'block' ? 'block' : 'script';

  const pickValues = (list: VariantOption[], values: string[]): string[] | null => {
    const found = values.filter((v) => list.some((o) => o.value === v));
    return found.length === values.length ? found : null;
  };
  const pickByLabels = (list: VariantOption[], labels: string[]): string[] | null => {
    const out: string[] = [];
    for (const label of labels) {
      const match = list.find((o) => o.label === label) || list.find((o) => o.value === label);
      if (!match) return null;
      out.push(match.value);
    }
    return out;
  };

  let metal = '';
  let gemstones: string[] | null;
  let carats: string[] | null;
  let attributes: string[] | null;
  let addOns: string[] | null;

  if (stored) {
    if (stored.metal) {
      if (!options.availableMetals.some((m) => m.value === stored.metal)) return null;
      metal = stored.metal;
    }
    gemstones = pickValues(options.gemstoneOptions, asArray(stored.gemstones));
    carats = pickValues(options.caratOptions, asArray(stored.carats));
    attributes = pickValues(options.attributeOptions, asArray(stored.attributes));
    addOns = pickValues(options.customOptions, asArray(stored.addOns));
  } else {
    const slug = selection.metalTypeSlug;
    const candidates = options.availableMetals.filter((m) => !slug || m.metalType === slug);
    const byLabel = candidates.find((m) => m.label === selection.metalType);
    const chosen = byLabel || candidates[0];
    if (options.availableMetals.length > 0) {
      if (!chosen) return null;
      metal = chosen.value;
    }
    gemstones = pickByLabels(options.gemstoneOptions, asArray(selection.gemstoneQuality));
    carats = pickByLabels(options.caratOptions, asArray(selection.caratWeight));
    attributes = pickByLabels(options.attributeOptions, asArray(selection.attributes));
    addOns = pickByLabels(options.customOptions, asArray(selection.addOns));
  }

  if (!gemstones || !carats || !attributes || !addOns) return null;

  const size = (stored ? stored.size : selection.size) || '';

  return {
    metal,
    size: size ? String(size).trim().slice(0, 20) : '',
    gemstone: gemIsMulti ? '' : gemstones[0] || '',
    gemstones: gemIsMulti ? gemstones : [],
    carat: caratIsMulti ? '' : carats[0] || '',
    carats: caratIsMulti ? carats : [],
    attributes,
    addOns,
    engravingText,
    engravingFont,
  };
}

function stripInternal(selection: SelectedOptions): Record<string, unknown> {
  const { _optionValues, ...rest } = selection;
  void _optionValues;
  return JSON.parse(JSON.stringify(rest));
}

export function priceCartLine(params: {
  product: PricingProduct;
  variations: PricingVariation[];
  metalTypes: PricingMetalType[];
  goldRate: PricingGoldRate | null | undefined;
  gstRate: number;
  selection: unknown;
  quantity: number;
  sizeChartRows?: Record<string, unknown>[] | null;
}): PricedLine {
  const { product, variations, metalTypes, goldRate, gstRate, selection } = params;
  const quantity = Math.max(0, Math.floor(num(params.quantity)));
  const listing = calculateProductPrice(product, goldRate, undefined, gstRate, metalTypes);

  let price: PriceBreakdown = listing;
  let selectedVariations: Record<string, unknown> = {};
  let error: LineError | null = goldRate ? null : 'NO_RATE';

  if (hasSelection(selection)) {
    selectedVariations = stripInternal(selection);
    const baseWeightGrams = getBaseWeightGrams(product);
    const options = buildVariantOptions({
      category: product.category,
      baseMetalType: product.metal_type,
      baseWeightGrams,
      specifications: product.specifications,
      variations,
      metalTypes,
      sizeChartRows: params.sizeChartRows,
    });
    const selected = resolveSelection(options, selection);
    if (!selected) {
      error = error || 'OPTION_UNAVAILABLE';
    } else {
      const state = computeVariationState({
        options,
        selected,
        metalTypes,
        baseMetalType: product.metal_type,
        baseWeightGrams,
        baseRatePerGram: listing.gold_rate_applied,
      });
      if (state.isComplete === false) error = error || 'INCOMPLETE_SELECTION';
      price = priceWithVariation({ product, variationState: state, goldRate, gstRate, metalTypes });
      // Keep the stored labels in step with the options actually priced.
      selectedVariations = stripInternal({ ...(state.selectedOptions as SelectedOptions), engraving: state.selectedOptions?.engraving });
    }
  }

  const unitSubtotal = price.subtotal;
  const unitGst = price.gst;
  const unitTotal = price.total;

  return {
    unitSubtotal,
    unitGst,
    unitTotal,
    quantity,
    lineSubtotal: unitSubtotal * quantity,
    lineGst: unitGst * quantity,
    lineTotal: unitTotal * quantity,
    goldRateApplied: price.gold_rate_applied,
    goldValue: price.gold_value,
    makingCharges: price.making_charges,
    diamondCost: price.diamond_cost,
    stoneCost: price.stone_cost,
    weightGrams: price.metal_weight_grams,
    metalSlug: price.metal_slug,
    variationPriceAdjustment: unitSubtotal - listing.subtotal,
    variationWeightAdjustment: price.metal_weight_grams - num(product.weight_grams),
    selectedVariations,
    error,
  };
}

export interface OrderTotals {
  subtotal: number;
  gst: number;
  total: number;
  itemCount: number;
}

export function sumLines(lines: PricedLine[]): OrderTotals {
  return lines.reduce(
    (acc, line) => ({
      subtotal: acc.subtotal + line.lineSubtotal,
      gst: acc.gst + line.lineGst,
      total: acc.total + line.lineTotal,
      itemCount: acc.itemCount + line.quantity,
    }),
    { subtotal: 0, gst: 0, total: 0, itemCount: 0 },
  );
}

// GST on jewellery is split into CGST + SGST for buyers in the seller's state
// and charged as IGST otherwise.
export function splitGst(gstAmount: number, buyerState: string | null | undefined, sellerState: string) {
  // Orders placed before the state dropdown hold whatever was typed ("TN",
  // "Tamilnadu"), so both sides go through the same matching first.
  const norm = (s: string | null | undefined) =>
    matchIndianState(s) || (s || '').trim().toLowerCase().replace(/\s+/g, ' ');
  const intraState = !!buyerState && norm(buyerState) === norm(sellerState);
  if (!intraState) return { intraState, cgst: 0, sgst: 0, igst: gstAmount };
  const cgst = Math.round((gstAmount / 2) * 100) / 100;
  return { intraState, cgst, sgst: Math.round((gstAmount - cgst) * 100) / 100, igst: 0 };
}

export const INDIAN_STATES: string[] = [
  'Andaman and Nicobar Islands',
  'Andhra Pradesh',
  'Arunachal Pradesh',
  'Assam',
  'Bihar',
  'Chandigarh',
  'Chhattisgarh',
  'Dadra and Nagar Haveli and Daman and Diu',
  'Delhi',
  'Goa',
  'Gujarat',
  'Haryana',
  'Himachal Pradesh',
  'Jammu and Kashmir',
  'Jharkhand',
  'Karnataka',
  'Kerala',
  'Ladakh',
  'Lakshadweep',
  'Madhya Pradesh',
  'Maharashtra',
  'Manipur',
  'Meghalaya',
  'Mizoram',
  'Nagaland',
  'Odisha',
  'Puducherry',
  'Punjab',
  'Rajasthan',
  'Sikkim',
  'Tamil Nadu',
  'Telangana',
  'Tripura',
  'Uttar Pradesh',
  'Uttarakhand',
  'West Bengal',
];

// Common short forms customers and old saved addresses use.
const STATE_ALIASES: Record<string, string> = {
  tn: 'Tamil Nadu',
  ka: 'Karnataka',
  kl: 'Kerala',
  ap: 'Andhra Pradesh',
  ts: 'Telangana',
  tg: 'Telangana',
  py: 'Puducherry',
  pondicherry: 'Puducherry',
  mh: 'Maharashtra',
  dl: 'Delhi',
  newdelhi: 'Delhi',
  orissa: 'Odisha',
};

// Maps what was typed ("tamilnadu", "TN") to the official state name, or ''.
export function matchIndianState(value: unknown): string {
  const key = String(value ?? '').toLowerCase().replace(/&/g, 'and').replace(/[^a-z]/g, '');
  if (!key) return '';
  return STATE_ALIASES[key] || INDIAN_STATES.find((st) => st.toLowerCase().replace(/[^a-z]/g, '') === key) || '';
}
