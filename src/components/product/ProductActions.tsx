import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart, Minus, Plus, ShoppingBag, Check, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCart } from '@/hooks/useCart';
import { useWishlist } from '@/hooks/useWishlist';
import { useAuth } from '@/hooks/useAuth';
import { AuthPromptModal } from './AuthPromptModal';
import { formatPrice } from '@/lib/types';
import { cn } from '@/lib/utils';
import type { ProductWithPrice } from '@/lib/types';

interface ProductActionsProps {
  product: ProductWithPrice;
}

export function ProductActions({ product }: ProductActionsProps) {
  const { isAuthenticated } = useAuth();
  const { addToCart, isAdding } = useCart();
  const { isInWishlist, toggleWishlist, isToggling } = useWishlist();
  
  const [quantity, setQuantity] = useState(1);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authAction, setAuthAction] = useState('');
  const [isAdded, setIsAdded] = useState(false);
  
  const inWishlist = isInWishlist(product.id);
  const isOutOfStock = (product.stock_quantity ?? 1) <= 0;
  const maxQuantity = product.stock_quantity ?? 99;

  const handleAddToCart = () => {
    if (!isAuthenticated) {
      setAuthAction('add items to your cart');
      setShowAuthModal(true);
      return;
    }
    
    if (isOutOfStock) return;
    
    addToCart({ productId: product.id, quantity });
    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 2000);
  };

  const handleToggleWishlist = () => {
    if (!isAuthenticated) {
      setAuthAction('save items to your wishlist');
      setShowAuthModal(true);
      return;
    }
    toggleWishlist(product.id);
  };

  const handleWhatsAppEnquiry = () => {
    const message = `Hi KRT Jewels! I'm interested in the ${product.name} (${formatPrice(product.calculated_price.total)}). Can you please provide more details?`;
    window.open(`https://wa.me/919843010986?text=${encodeURIComponent(message)}`, '_blank');
  };

  return (
    <>
      <div className="space-y-4">
        {/* Stock Status */}
        {isOutOfStock ? (
          <div className="bg-destructive/10 border border-destructive/30 rounded-xl p-4 text-center">
            <p className="text-destructive font-semibold">Out of Stock</p>
            <p className="text-sm text-muted-foreground mt-1">This item is currently unavailable</p>
          </div>
        ) : (product.stock_quantity ?? 0) <= 5 && (product.stock_quantity ?? 0) > 0 ? (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-center">
            <p className="text-amber-700 font-medium text-sm">
              Only {product.stock_quantity} left in stock – order soon!
            </p>
          </div>
        ) : null}

        {/* Quantity Selector - Full Width Premium */}
        <div className="bg-secondary/50 rounded-xl p-4">
          <label className="text-sm text-muted-foreground mb-2 block">Quantity</label>
          <div className="flex items-center justify-between bg-card rounded-lg border border-border">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              disabled={quantity <= 1 || isOutOfStock}
              className="h-14 w-14 rounded-l-lg rounded-r-none hover:bg-secondary"
            >
              <Minus className="w-5 h-5" />
            </Button>
            <span className="flex-1 text-center text-2xl font-serif font-semibold">
              {quantity}
            </span>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setQuantity(Math.min(maxQuantity, quantity + 1))}
              disabled={quantity >= maxQuantity || isOutOfStock}
              className="h-14 w-14 rounded-r-lg rounded-l-none hover:bg-secondary"
            >
              <Plus className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Add to Cart - Full Width Premium */}
        <Button
          onClick={handleAddToCart}
          disabled={isAdding || isOutOfStock}
          className={cn(
            'w-full py-7 text-lg font-semibold gap-3 rounded-xl transition-all duration-300',
            isAdded 
              ? 'bg-green-600 hover:bg-green-700 text-white' 
              : 'btn-premium'
          )}
        >
          {isAdded ? (
            <>
              <Check className="w-6 h-6" />
              Added to Cart!
            </>
          ) : isOutOfStock ? (
            'Out of Stock'
          ) : !isAuthenticated ? (
            <>
              <ShoppingBag className="w-6 h-6" />
              Sign In to Add to Cart
            </>
          ) : (
            <>
              <ShoppingBag className="w-6 h-6" />
              Add to Cart – {formatPrice(product.calculated_price.total * quantity)}
            </>
          )}
        </Button>

        {/* Wishlist - Full Width */}
        <Button
          variant="outline"
          onClick={handleToggleWishlist}
          disabled={isToggling}
          className={cn(
            'w-full py-6 text-lg gap-3 rounded-xl border-2 transition-all duration-300',
            inWishlist 
              ? 'bg-red-50 border-red-300 text-red-600 hover:bg-red-100' 
              : 'hover:border-primary hover:bg-primary/5'
          )}
        >
          <Heart className={cn('w-5 h-5', inWishlist && 'fill-current')} />
          {inWishlist ? 'Saved to Wishlist' : 'Add to Wishlist'}
        </Button>

        {/* WhatsApp Enquiry */}
        <Button
          variant="outline"
          onClick={handleWhatsAppEnquiry}
          className="w-full py-6 text-lg gap-3 rounded-xl border-2 border-green-300 text-green-700 hover:bg-green-50"
        >
          <MessageCircle className="w-5 h-5" />
          Enquire on WhatsApp
        </Button>
      </div>

      {/* Auth Prompt Modal */}
      <AuthPromptModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        action={authAction}
      />
    </>
  );
}
