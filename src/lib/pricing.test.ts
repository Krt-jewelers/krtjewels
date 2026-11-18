import { describe, it, expect } from 'vitest';
import {
  buildVariantOptions,
  calculateProductPrice,
  computeVariationState,
  getBaseWeightGrams,
  priceCartLine,
  priceWithVariation,
  splitGst,
  sumLines,
  type PricingProduct,
  type PricingVariation,
  type SelectedOptions,
} from './pricing';

const goldRate = { rate_22k: 9000, rate_24k: 9818, rate_18k: 7364 };
const metalTypes = [
  { id: 'mt22', slug: 'gold_22k', name: '22K Gold', rate_per_gram: 9100 },
  { id: 'mt18', slug: 'gold_18k', name: '18K Gold', rate_per_gram: 7450 },
];

const ring: PricingProduct = {
  id: 'ring',
  category: 'rings',
  metal_type: 'gold_18k',
  weight_grams: 4.2,
  making_charge_percent: 14,
  diamond_cost: 0,
  stone_cost: 500,
  specifications: {
    pricing_options: {
      metals: [{ slug: 'gold_18k', weight_grams: 4.2 }, { slug: 'gold_22k', weight_grams: 4.8 }],
      diamond_qualities: [{ label: 'VVS-EF', rate_per_carat: 85000, is_default: true }, { label: 'VS-GH', rate_per_carat: 62000 }],
      carat_weights: [{ value: 0.5, is_default: true }, { value: 1 }],
      attributes: [{ label: 'Yellow', price: 0, is_default: true }, { label: 'Rose', price: 1500 }],
    },
  },
};

const sizeVariations: PricingVariation[] = [
  { id: 'v12', product_id: 'ring', variation_type: 'size', size_value: '12', size_label: 'Ring Size', metal_type: null, price_adjustment: 0, weight_adjustment: 0, is_available: true, is_default: false, image_url: null },
  { id: 'v14', product_id: 'ring', variation_type: 'size', size_value: '14', size_label: 'Ring Size', metal_type: null, price_adjustment: 750, weight_adjustment: 0.2, is_available: true, is_default: false, image_url: null },
];

// What the product page does: build options, apply the customer's clicks.
function productPageSelection(product: PricingProduct, variations: PricingVariation[], picks: Partial<Record<string, unknown>>) {
  const baseWeightGrams = getBaseWeightGrams(product);
  const options = buildVariantOptions({
    category: product.category,
    baseMetalType: product.metal_type,
    baseWeightGrams,
    specifications: product.specifications,
    variations,
    metalTypes,
  });
  const state = computeVariationState({
    options,
    selected: {
      metal: 'gold_18k', size: '', gemstone: 'VVS-EF', gemstones: [], carat: '0.5', carats: [],
      attributes: ['Yellow'], addOns: [], ...picks,
    } as never,
    metalTypes,
    baseMetalType: product.metal_type,
    baseWeightGrams,
    baseRatePerGram: 7450,
  });
  const shown = priceWithVariation({ product, variationState: state, goldRate, gstRate: 3, metalTypes });
  return { state, shown };
}

describe('calculateProductPrice', () => {
  it('prices metal, making, diamonds, stones and default colour', () => {
    const p = calculateProductPrice(ring, goldRate, undefined, 3, metalTypes);
    // 4.2 g × ₹7450 = 31290; making 14% = 4380.6; diamonds 85000 × 0.5 = 42500; stones 500
    expect(p.gold_rate_applied).toBe(7450);
    expect(p.subtotal).toBe(Math.round(31290 + 4380.6 + 42500 + 500));
    expect(p.gst).toBe(Math.round(p.subtotal * 0.03));
    expect(p.total).toBe(p.subtotal + p.gst);
  });

  it('falls back to the gold_rates table when a metal has no rate', () => {
    const p = calculateProductPrice({ ...ring, specifications: null, metal_type: 'gold_24k' }, goldRate, undefined, 3, metalTypes);
    expect(p.gold_rate_applied).toBe(9818);
  });

  it('shows zero until the gold rate loads', () => {
    expect(calculateProductPrice(ring, null).total).toBe(0);
  });
});

describe('cart lines use the product page price', () => {
  it('prices the customer selection exactly as the product page showed it', () => {
    const { state, shown } = productPageSelection(ring, sizeVariations, {
      metal: 'gold_22k', gemstone: 'VS-GH', carat: '1', attributes: ['Rose'], size: '14',
    });
    const line = priceCartLine({
      product: ring, variations: sizeVariations, metalTypes, goldRate, gstRate: 3,
      selection: state.selectedOptions, quantity: 2,
    });
    expect(line.error).toBeNull();
    expect(line.unitTotal).toBe(shown.total);
    expect(line.lineTotal).toBe(shown.total * 2);
    // 22K at 4.8 g plus the size 14 weight
    expect(line.weightGrams).toBeCloseTo(5.0, 5);
  });

  it('re-prices carts saved before option ids were stored (matched by label)', () => {
    const { state, shown } = productPageSelection(ring, sizeVariations, { metal: 'gold_22k', size: '14' });
    const legacy = { ...(state.selectedOptions as SelectedOptions) };
    delete legacy._optionValues;
    const line = priceCartLine({ product: ring, variations: sizeVariations, metalTypes, goldRate, gstRate: 3, selection: legacy, quantity: 1 });
    expect(line.error).toBeNull();
    expect(line.unitTotal).toBe(shown.total);
  });

  it('ignores any price the browser stored with the item', () => {
    const { state, shown } = productPageSelection(ring, sizeVariations, {});
    const tampered = { ...state.selectedOptions, variation_price_adjustment: -80000, priceAdjustment: -80000 };
    const line = priceCartLine({ product: ring, variations: sizeVariations, metalTypes, goldRate, gstRate: 3, selection: tampered, quantity: 1 });
    expect(line.unitTotal).toBe(shown.total);
  });

  it('flags an option that no longer exists', () => {
    const { state } = productPageSelection(ring, sizeVariations, {});
    const selection = { ...state.selectedOptions, _optionValues: { ...state.selectedOptions!._optionValues!, gemstones: ['Fake'] } };
    const line = priceCartLine({ product: ring, variations: sizeVariations, metalTypes, goldRate, gstRate: 3, selection, quantity: 1 });
    expect(line.error).toBe('OPTION_UNAVAILABLE');
  });

  it('items added from a product card use the card price', () => {
    const card = calculateProductPrice(ring, goldRate, undefined, 3, metalTypes);
    const line = priceCartLine({ product: ring, variations: [], metalTypes, goldRate, gstRate: 3, selection: {}, quantity: 3 });
    expect(line.unitTotal).toBe(card.total);
    expect(line.lineSubtotal).toBe(card.subtotal * 3);
  });
});

describe('product page keeps a fixed diamond cost', () => {
  it('matches the card price for a product with a fixed diamond cost and no diamond options', () => {
    const pendant: PricingProduct = {
      id: 'pendant', category: 'pendants', metal_type: 'gold_22k', weight_grams: 6,
      making_charge_percent: 12, diamond_cost: 20000, stone_cost: 0, specifications: {},
    };
    const card = calculateProductPrice(pendant, goldRate, undefined, 3, metalTypes);
    const options = buildVariantOptions({
      category: pendant.category, baseMetalType: pendant.metal_type, baseWeightGrams: 6,
      specifications: pendant.specifications, variations: [], metalTypes,
    });
    const state = computeVariationState({
      options,
      selected: { metal: 'gold_22k', size: '', gemstone: '', gemstones: [], carat: '', carats: [], attributes: [], addOns: [] },
      metalTypes, baseMetalType: 'gold_22k', baseWeightGrams: 6,
    });
    const page = priceWithVariation({ product: pendant, variationState: state, goldRate, gstRate: 3, metalTypes });
    expect(page.diamond_cost).toBe(20000);
    expect(page.total).toBe(card.total);
  });
});

describe('totals and GST', () => {
  it('adds up lines', () => {
    const a = priceCartLine({ product: ring, variations: [], metalTypes, goldRate, gstRate: 3, selection: {}, quantity: 1 });
    const t = sumLines([a, a]);
    expect(t.total).toBe(a.lineTotal * 2);
    expect(t.subtotal + t.gst).toBe(t.total);
  });

  it('splits GST into CGST + SGST inside Tamil Nadu and IGST elsewhere', () => {
    expect(splitGst(3001, 'tamil nadu', 'Tamil Nadu')).toEqual({ intraState: true, cgst: 1500.5, sgst: 1500.5, igst: 0 });
    expect(splitGst(3000, 'Kerala', 'Tamil Nadu')).toEqual({ intraState: false, cgst: 0, sgst: 0, igst: 3000 });
  });
});
