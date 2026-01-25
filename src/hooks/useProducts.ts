import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Product, ProductCategory, MetalType, CalculatedPrice, ProductWithPrice } from '@/lib/types';
import { useGoldRate } from './useGoldRate';

interface ProductFilters {
  category?: ProductCategory;
  metalType?: MetalType;
  minWeight?: number;
  maxWeight?: number;
  minPrice?: number;
  maxPrice?: number;
  isFeatured?: boolean;
  isBestseller?: boolean;
  isNewArrival?: boolean;
  isBridal?: boolean;
  search?: string;
}

// Calculate price for a product based on current gold rate
export function calculateProductPrice(
  product: Product,
  goldRate: { rate_22k: number; rate_24k: number; rate_18k: number | null } | null,
  categoryMakingCharge?: number
): CalculatedPrice {
  if (!goldRate) {
    return {
      gold_value: 0,
      making_charges: 0,
      subtotal: 0,
      gst: 0,
      total: 0,
      gold_rate_applied: 0,
    };
  }

  // Get the applicable gold rate based on metal type
  let goldRatePerGram: number;
  switch (product.metal_type) {
    case 'gold_24k':
      goldRatePerGram = goldRate.rate_24k;
      break;
    case 'gold_18k':
      goldRatePerGram = goldRate.rate_18k || goldRate.rate_22k * 0.75;
      break;
    case 'gold_22k':
    default:
      goldRatePerGram = goldRate.rate_22k;
      break;
  }

  // Calculate gold value
  const goldValue = product.weight_grams * goldRatePerGram;

  // Calculate making charges (use product-specific or category default)
  const makingChargePercent = product.making_charge_percent || categoryMakingCharge || 12;
  const makingCharges = goldValue * (makingChargePercent / 100);

  // Calculate subtotal (gold + making + diamond + stone costs)
  const subtotal = goldValue + makingCharges + product.diamond_cost + product.stone_cost;

  // GST at 3% for gold jewellery
  const gst = subtotal * 0.03;

  // Total price
  const total = subtotal + gst;

  return {
    gold_value: Math.round(goldValue),
    making_charges: Math.round(makingCharges),
    subtotal: Math.round(subtotal),
    gst: Math.round(gst),
    total: Math.round(total),
    gold_rate_applied: goldRatePerGram,
  };
}

export function useProducts(filters?: ProductFilters) {
  const { data: goldRate } = useGoldRate();

  return useQuery({
    queryKey: ['products', filters],
    queryFn: async (): Promise<ProductWithPrice[]> => {
      let query = supabase
        .from('products')
        .select('*')
        .eq('is_active', true);

      // Apply filters
      if (filters?.category) {
        query = query.eq('category', filters.category);
      }
      if (filters?.metalType) {
        query = query.eq('metal_type', filters.metalType);
      }
      if (filters?.minWeight) {
        query = query.gte('weight_grams', filters.minWeight);
      }
      if (filters?.maxWeight) {
        query = query.lte('weight_grams', filters.maxWeight);
      }
      if (filters?.isFeatured) {
        query = query.eq('is_featured', true);
      }
      if (filters?.isBestseller) {
        query = query.eq('is_bestseller', true);
      }
      if (filters?.isNewArrival) {
        query = query.eq('is_new_arrival', true);
      }
      if (filters?.isBridal) {
        query = query.eq('is_bridal', true);
      }
      if (filters?.search) {
        query = query.or(`name.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
      }

      query = query.order('created_at', { ascending: false });

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching products:', error);
        throw error;
      }

      // Calculate prices for each product
      const productsWithPrices = (data || []).map((product) => ({
        ...product,
        specifications: (product.specifications as Record<string, any>) || {},
        calculated_price: calculateProductPrice(product as any, goldRate || null),
      })) as ProductWithPrice[];

      // Apply price filters after calculation
      let filteredProducts = productsWithPrices;
      if (filters?.minPrice) {
        filteredProducts = filteredProducts.filter(
          (p) => p.calculated_price.total >= (filters.minPrice || 0)
        );
      }
      if (filters?.maxPrice) {
        filteredProducts = filteredProducts.filter(
          (p) => p.calculated_price.total <= (filters.maxPrice || Infinity)
        );
      }

      return filteredProducts;
    },
    enabled: !!goldRate,
  });
}

export function useProduct(slug: string) {
  const { data: goldRate } = useGoldRate();

  return useQuery({
    queryKey: ['product', slug],
    queryFn: async (): Promise<ProductWithPrice | null> => {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('slug', slug)
        .eq('is_active', true)
        .maybeSingle();

      if (error) {
        console.error('Error fetching product:', error);
        throw error;
      }

      if (!data) return null;

      return {
        ...data,
        specifications: (data.specifications as Record<string, any>) || {},
        calculated_price: calculateProductPrice(data as any, goldRate || null),
      } as ProductWithPrice;
    },
    enabled: !!goldRate && !!slug,
  });
}

export function useFeaturedProducts() {
  return useProducts({ isFeatured: true });
}

export function useBestsellerProducts() {
  return useProducts({ isBestseller: true });
}

export function useNewArrivals() {
  return useProducts({ isNewArrival: true });
}

export function useBridalProducts() {
  return useProducts({ isBridal: true });
}
