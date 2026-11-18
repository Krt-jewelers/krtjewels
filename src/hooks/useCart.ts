import { useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useGoldRate } from './useGoldRate';
import { useMetalTypes } from './useMetalTypes';
import {
  calculateProductPrice,
  priceCartLine,
  sumLines,
  type PricedLine,
  type PricingVariation,
} from '@/lib/pricing';
import type { CartItem, Product, ProductWithPrice } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { useGstSettings } from './useSiteSettings';

export interface CartItemWithProduct extends CartItem {
  product: ProductWithPrice;
  // Priced with the same function the place-order edge function uses.
  line: PricedLine;
}

interface CartData {
  items: CartItemWithProductRaw[];
  variations: PricingVariation[];
}

interface CartItemWithProductRaw extends CartItem {
  product: Product;
}

interface GuestCartItem {
  id: string;
  product_id: string;
  quantity: number;
  created_at: string;
  selected_variations?: Record<string, any> | null;
  variation_signature?: string;
  variation_price_adjustment?: number;
  variation_weight_adjustment?: number;
}

const GUEST_CART_KEY = 'krt_guest_cart_v1';

const readGuestCart = (): GuestCartItem[] => {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(GUEST_CART_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as GuestCartItem[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const writeGuestCart = (items: GuestCartItem[]) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(GUEST_CART_KEY, JSON.stringify(items));
};

export function useCart() {
  const { user, authReady } = useAuth();
  const { data: goldRate } = useGoldRate();
  const { data: gstSettings } = useGstSettings();
  const gstRate = gstSettings?.rate ?? 3;
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const supabaseAny = supabase as any;

  const { data: metalTypes } = useMetalTypes();

  // Fetch the cart's items, products and their options. Pricing is applied
  // below, so a new gold rate re-prices the cart without refetching it.
  const cartQuery = useQuery({
    queryKey: ['cart', user?.id ?? 'guest'],
    queryFn: async (): Promise<CartData> => {
      let rawItems: CartItemWithProductRaw[] = [];

      if (!user) {
        const guestItems = readGuestCart();
        if (guestItems.length === 0) return { items: [], variations: [] };

        const productIds = Array.from(new Set(guestItems.map((item) => item.product_id)));
        const { data: products, error } = await supabaseAny
          .from('products')
          .select('*')
          .in('id', productIds);

        if (error) {
          console.error('Error fetching guest cart products:', error);
          throw error;
        }

        const productMap = new Map(((products || []) as Product[]).map((product) => [product.id, product]));
        rawItems = guestItems
          .map((item) => {
            const product = productMap.get(item.product_id);
            if (!product) return null;
            return { ...item, user_id: 'guest', product };
          })
          .filter(Boolean) as CartItemWithProductRaw[];
      } else {
        const { data, error } = await supabaseAny
          .from('cart_items')
          .select(`
            *,
            product:products(*)
          `)
          .eq('user_id', user.id);

        if (error) {
          console.error('Error fetching cart:', error);
          throw error;
        }
        // Items whose product was removed or hidden come back without one.
        rawItems = ((data || []) as CartItemWithProductRaw[]).filter((item) => !!item.product);
      }

      const productIds = Array.from(new Set(rawItems.map((item) => item.product_id)));
      let variations: PricingVariation[] = [];
      if (productIds.length > 0) {
        const { data: variationRows, error: variationError } = await supabaseAny
          .from('product_variations')
          .select('*')
          .in('product_id', productIds);
        if (variationError) {
          console.error('Error fetching cart product options:', variationError);
          throw variationError;
        }
        variations = (variationRows || []) as PricingVariation[];
      }

      return { items: rawItems, variations };
    },
    enabled: authReady,
  });

  const cartItems: CartItemWithProduct[] = useMemo(() => {
    const data = cartQuery.data;
    if (!data) return [];
    const byProduct = new Map<string, PricingVariation[]>();
    for (const variation of data.variations) {
      const list = byProduct.get(variation.product_id as string) || [];
      list.push(variation);
      byProduct.set(variation.product_id as string, list);
    }
    return data.items.map((item) => ({
      ...item,
      product: {
        ...item.product,
        calculated_price: calculateProductPrice(item.product, goldRate || null, undefined, gstRate, metalTypes || []),
      },
      line: priceCartLine({
        product: item.product,
        variations: byProduct.get(item.product_id) || [],
        metalTypes: metalTypes || [],
        goldRate: goldRate || null,
        gstRate,
        selection: item.selected_variations,
        quantity: item.quantity,
      }),
    }));
  }, [cartQuery.data, goldRate, gstRate, metalTypes]);

  const addToCartMutation = useMutation({
    mutationFn: async ({
      productId,
      quantity = 1,
      variation,
    }: {
      productId: string;
      quantity?: number;
      variation?: {
        priceAdjustment?: number;
        weightAdjustment?: number;
        imageUrl?: string | null;
        selectedOptions?: Record<string, any> | null;
      };
    }) => {
      const selectedVariations = variation?.selectedOptions || {};
      const variationSignature = JSON.stringify({
        ...selectedVariations,
        priceAdjustment: variation?.priceAdjustment || 0,
        weightAdjustment: variation?.weightAdjustment || 0,
      });

      if (!user) {
        // Guest cart (localStorage)
        const guestItems = readGuestCart();

        // Check product stock before adding
        const { data: product } = await supabaseAny
          .from('products')
          .select('stock_quantity, name')
          .eq('id', productId)
          .single();

        if (!product) throw new Error('Product not found');

        const availableStock = product.stock_quantity ?? 99;
        const existingIndex = guestItems.findIndex(
          (item) =>
            item.product_id === productId &&
            item.variation_signature === variationSignature
        );
        const currentCartQty = existingIndex >= 0 ? guestItems[existingIndex].quantity : 0;
        const totalRequestedQty = currentCartQty + quantity;

        if (totalRequestedQty > availableStock) {
          throw new Error(`Only ${availableStock} items available. You already have ${currentCartQty} in your cart.`);
        }

        if (existingIndex >= 0) {
          guestItems[existingIndex] = {
            ...guestItems[existingIndex],
            quantity: guestItems[existingIndex].quantity + quantity,
          };
        } else {
          guestItems.push({
            id: `guest_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
            product_id: productId,
            quantity,
            created_at: new Date().toISOString(),
            selected_variations: selectedVariations,
            variation_signature: variationSignature,
            variation_price_adjustment: variation?.priceAdjustment || 0,
            variation_weight_adjustment: variation?.weightAdjustment || 0,
          });
        }

        writeGuestCart(guestItems);
        return;
      }

      // Check product stock before adding
      const { data: product } = await supabaseAny
        .from('products')
        .select('stock_quantity, name')
        .eq('id', productId)
        .single();

      if (!product) throw new Error('Product not found');

      const availableStock = product.stock_quantity ?? 99;
      
      // Check if item already exists in cart
      const { data: existing } = await supabaseAny
        .from('cart_items')
        .select('id, quantity')
        .eq('user_id', user.id)
        .eq('product_id', productId)
        .eq('variation_signature', variationSignature)
        .maybeSingle();

      const currentCartQty = existing?.quantity || 0;
      const totalRequestedQty = currentCartQty + quantity;

      // Block oversell
      if (totalRequestedQty > availableStock) {
        throw new Error(`Only ${availableStock} items available. You already have ${currentCartQty} in your cart.`);
      }

      if (existing) {
        // Update quantity
        const { error } = await supabaseAny
          .from('cart_items')
          .update({ quantity: existing.quantity + quantity })
          .eq('id', existing.id);
        
        if (error) throw error;
      } else {
        // Insert new item
        const { error } = await supabaseAny
          .from('cart_items')
          .insert({
            user_id: user.id,
            product_id: productId,
            quantity,
            selected_variations: selectedVariations,
            variation_signature: variationSignature,
            variation_price_adjustment: variation?.priceAdjustment || 0,
            variation_weight_adjustment: variation?.weightAdjustment || 0,
          });
        
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      toast({
        title: 'Added to cart',
        description: 'Item has been added to your cart.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to add to cart',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const updateQuantityMutation = useMutation({
    mutationFn: async ({ itemId, quantity }: { itemId: string; quantity: number }) => {
      if (!user) {
        const guestItems = readGuestCart();
        const nextItems = guestItems
          .map((item) =>
            item.id === itemId ? { ...item, quantity } : item
          )
          .filter((item) => item.quantity > 0);

        writeGuestCart(nextItems);
        return;
      }

      if (quantity < 1) {
        // Remove item if quantity is 0
        const { error } = await supabaseAny
          .from('cart_items')
          .delete()
          .eq('id', itemId);
        
        if (error) throw error;
      } else {
        const { error } = await supabaseAny
          .from('cart_items')
          .update({ quantity })
          .eq('id', itemId);
        
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
    },
  });

  const removeFromCartMutation = useMutation({
    mutationFn: async (itemId: string) => {
      if (!user) {
        const guestItems = readGuestCart().filter((item) => item.id !== itemId);
        writeGuestCart(guestItems);
        return;
      }

      const { error } = await supabaseAny
        .from('cart_items')
        .delete()
        .eq('id', itemId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      toast({
        title: 'Removed from cart',
        description: 'Item has been removed from your cart.',
      });
    },
  });

  const clearCartMutation = useMutation({
    mutationFn: async () => {
      if (!user) {
        writeGuestCart([]);
        return;
      }

      const { error } = await supabaseAny
        .from('cart_items')
        .delete()
        .eq('user_id', user.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
    },
  });

  // Totals add up the priced lines, exactly as the server does.
  const totals = sumLines(cartItems.map((item) => item.line));
  const subtotal = totals.subtotal;
  const gstTotal = totals.gst;
  const total = totals.total;
  const itemCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const hasPricingIssue = cartItems.some((item) => item.line.error && item.line.error !== 'NO_RATE');

  return {
    items: cartItems,
    itemCount,
    subtotal,
    gstTotal,
    total,
    isLoading: cartQuery.isLoading,
    // Prices need the current gold rate; until it loads every price is 0.
    isPricing: !goldRate,
    hasPricingIssue,
    refetch: cartQuery.refetch,
    addToCart: addToCartMutation.mutate,
    updateQuantity: updateQuantityMutation.mutate,
    removeFromCart: removeFromCartMutation.mutate,
    clearCart: clearCartMutation.mutate,
    isAdding: addToCartMutation.isPending,
  };
}
