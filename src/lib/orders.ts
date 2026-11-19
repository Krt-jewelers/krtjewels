import { FunctionsHttpError } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

export interface OrderFunctionError {
  code: string;
  message: string;
  totals?: { subtotal: number; gst: number; total: number };
}

export interface OrderQuote {
  subtotal: number;
  gst_amount: number;
  total_amount: number;
  gst_rate: number;
  item_count: number;
}

export interface QuoteResponse {
  quote: OrderQuote;
  // Signed by the server; sending it back with a UPI order keeps this price.
  quote_token: string;
  expires_at: string;
}

export interface PlacedOrder extends OrderQuote {
  success: true;
  // True when this checkout had already been saved (for example the first
  // reply was lost) and the server returned that order again.
  already_placed?: boolean;
  // Something the customer should know (price changed or an item sold out
  // while they were paying).
  notice?: string | null;
  order_id: string;
  order_number: string;
  created_at: string;
  status: string;
  payment_method: string;
  shipping_address: Record<string, string>;
  items: {
    product_name: string;
    product_image: string | null;
    quantity: number;
    unit_price: number;
    total_price: number;
    selected_variations: Record<string, unknown>;
  }[];
}

export interface OrderPayload {
  mode: 'quote' | 'place';
  items: { product_id: string; quantity: number; selected_variations?: unknown }[];
  shipping_address?: Record<string, string>;
  payment_method?: 'cod' | 'upi';
  payment?: { utr?: string; upi_phone?: string; upi_provider?: string };
  notes?: string | null;
  expected_total?: number;
  quote_token?: string | null;
  // One id per checkout attempt, so a retry cannot create a second order.
  checkout_ref?: string;
}

export function newCheckoutRef(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') return crypto.randomUUID();
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}-${Math.random().toString(36).slice(2, 12)}`;
}

const ORDERING_UNAVAILABLE =
  'Online ordering is not available right now. Please try again in a few minutes or call us on +91 98430 10986.';

// Calls the place-order edge function, which prices the cart on the server.
export async function callOrderFunction<T>(payload: OrderPayload): Promise<{ data: T | null; error: OrderFunctionError | null }> {
  const { data, error } = await supabase.functions.invoke('place-order', { body: payload });
  if (!error) return { data: data as T, error: null };

  if (error instanceof FunctionsHttpError) {
    try {
      const body = await error.context.json();
      // Our own errors carry a message in `error`. Anything else (for example
      // the function not being deployed yet) gets a plain explanation.
      if (typeof body.error !== 'string') {
        return { data: null, error: { code: 'UNAVAILABLE', message: ORDERING_UNAVAILABLE } };
      }
      return {
        data: null,
        error: { code: body.code || 'ERROR', message: body.error, totals: body.totals },
      };
    } catch {
      // fall through to the generic message
    }
  }
  return {
    data: null,
    error: { code: 'NETWORK', message: 'Could not reach our server. Check your connection and try again.' },
  };
}

// Same rules as the server (supabase/functions/_shared/order.ts).
export function normalizeIndianPhone(value: string): string | null {
  const digits = value.replace(/\D/g, '');
  const local = digits.length === 12 && digits.startsWith('91')
    ? digits.slice(2)
    : digits.length === 11 && digits.startsWith('0')
    ? digits.slice(1)
    : digits;
  return /^[6-9]\d{9}$/.test(local) ? local : null;
}

export const isValidPincode = (value: string) => /^[1-9]\d{5}$/.test(value.replace(/\s/g, ''));
