import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Product, ProductCategory, MetalType, ProductWithPrice } from '@/lib/types';
import { calculateProductPrice } from '@/lib/pricing';
import { useGoldRate } from './useGoldRate';
import { useGstSettings } from './useSiteSettings';
import { useMetalTypes } from './useMetalTypes';

// Pricing lives in a module shared with the place-order edge function.
export { calculateProductPrice };

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
  tag?: string;
  search?: string;
}

export function useProducts(filters?: ProductFilters) {
  const { data: goldRate, isLoading: goldRateLoading } = useGoldRate();
  const { data: gstSettings } = useGstSettings();
  const { data: metalTypes } = useMetalTypes();
  const gstRate = gstSettings?.rate ?? 3;

  return useQuery({
    queryKey: ['products', filters, goldRate?.id, gstRate, metalTypes?.map(m => `${m.slug}:${m.rate_per_gram}`).join(',')],
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
      if (filters?.tag) {
        query = query.contains('tags', [filters.tag]);
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

      // Calculate prices for each product (use goldRate if available, otherwise show 0)
      const productsWithPrices = (data || []).map((product) => {
        // Ensure all required fields have default values
        const normalizedProduct = {
          ...product,
          diamond_cost: product.diamond_cost ?? 0,
          stone_cost: product.stone_cost ?? 0,
          images: product.images || [],
          tags: product.tags || [],
          specifications: (product.specifications as Record<string, string | number | boolean> | null) || {},
          stock_quantity: product.stock_quantity ?? 0,
          is_featured: product.is_featured ?? false,
          is_bestseller: product.is_bestseller ?? false,
          is_new_arrival: product.is_new_arrival ?? false,
          is_bridal: product.is_bridal ?? false,
        };
        return {
          ...normalizedProduct,
          calculated_price: calculateProductPrice(normalizedProduct as Product, goldRate || null, undefined, gstRate, metalTypes || []),
        };
      }) as ProductWithPrice[];

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
    // Allow query to run even without gold rate - prices will show 0 until rate loads
    enabled: true,
    staleTime: 1000 * 60 * 2, // 2 minutes
    refetchOnWindowFocus: false,
  });
}

export function useProduct(slug: string) {
  const { data: goldRate } = useGoldRate();
  const { data: gstSettings } = useGstSettings();
  const { data: metalTypes } = useMetalTypes();
  const gstRate = gstSettings?.rate ?? 3;

  return useQuery({
    queryKey: ['product', slug, goldRate?.id, gstRate, metalTypes?.map(m => `${m.slug}:${m.rate_per_gram}`).join(',')],
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

      // Normalize product data
      const normalizedProduct = {
        ...data,
        diamond_cost: data.diamond_cost ?? 0,
        stone_cost: data.stone_cost ?? 0,
        images: data.images || [],
        tags: data.tags || [],
        specifications: (data.specifications as Record<string, string | number | boolean> | null) || {},
        stock_quantity: data.stock_quantity ?? 0,
        is_featured: data.is_featured ?? false,
        is_bestseller: data.is_bestseller ?? false,
        is_new_arrival: data.is_new_arrival ?? false,
        is_bridal: data.is_bridal ?? false,
      };

      return {
        ...normalizedProduct,
        calculated_price: calculateProductPrice(normalizedProduct as Product, goldRate || null, undefined, gstRate, metalTypes || []),
      } as ProductWithPrice;
    },
    enabled: !!slug,
    staleTime: 1000 * 60 * 2,
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
