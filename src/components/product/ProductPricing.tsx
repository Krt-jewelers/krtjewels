import { formatPrice } from '@/lib/types';
import { RefreshCw, Tag, Percent } from 'lucide-react';
import type { CalculatedPrice } from '@/lib/types';

interface ProductPricingProps {
  calculatedPrice: CalculatedPrice;
  quantity: number;
}

export function ProductPricing({ calculatedPrice, quantity }: ProductPricingProps) {
  const totalPrice = calculatedPrice.total * quantity;
  
  return (
    <div className="space-y-4">
      {/* Main Price */}
      <div className="flex items-baseline gap-3">
        <span className="text-3xl md:text-4xl font-serif font-bold text-primary">
          {formatPrice(totalPrice)}
        </span>
        {quantity > 1 && (
          <span className="text-sm text-muted-foreground">
            ({formatPrice(calculatedPrice.total)} × {quantity})
          </span>
        )}
      </div>

      {/* EMI Info */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Percent className="w-4 h-4" />
        <span>EMI from ₹{Math.round(totalPrice / 12).toLocaleString('en-IN')}/month</span>
      </div>

      {/* Price Update Notice */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground bg-secondary/50 rounded-lg px-3 py-2">
        <RefreshCw className="w-3 h-3" />
        <span>Price updates automatically based on today's gold rate</span>
      </div>

      {/* Exclusive Offer */}
      <div className="flex items-center gap-2 bg-accent/20 border border-accent/30 rounded-lg px-3 py-2">
        <Tag className="w-4 h-4 text-accent-foreground" />
        <span className="text-sm text-foreground">
          Exclusive Offer: Flat ₹1,000 off on first purchase!
        </span>
      </div>
    </div>
  );
}
