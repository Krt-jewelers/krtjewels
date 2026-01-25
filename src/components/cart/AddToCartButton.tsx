import { useState } from 'react';
import { ShoppingBag, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCart } from '@/hooks/useCart';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';

interface AddToCartButtonProps {
  productId: string;
  quantity?: number;
  className?: string;
  showText?: boolean;
  size?: 'default' | 'sm' | 'lg' | 'icon';
  onSuccess?: () => void;
}

export function AddToCartButton({ 
  productId, 
  quantity = 1, 
  className = '',
  showText = true,
  size = 'default',
  onSuccess
}: AddToCartButtonProps) {
  const { addToCart, isAdding } = useCart();
  const { isAuthenticated } = useAuth();
  const [isAdded, setIsAdded] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!isAuthenticated) return;
    
    setIsAnimating(true);
    addToCart({ productId, quantity });
    
    setTimeout(() => {
      setIsAdded(true);
      setIsAnimating(false);
      onSuccess?.();
      
      setTimeout(() => {
        setIsAdded(false);
      }, 2000);
    }, 500);
  };

  return (
    <Button
      onClick={handleAddToCart}
      disabled={isAdding || !isAuthenticated}
      size={size}
      className={cn(
        'btn-premium gap-2 relative overflow-hidden transition-all duration-300',
        isAnimating && 'animate-pulse',
        isAdded && 'bg-green-600 hover:bg-green-700',
        className
      )}
    >
      <span className={cn(
        'flex items-center gap-2 transition-transform duration-300',
        isAnimating && 'translate-x-full opacity-0',
        isAdded && 'translate-x-0 opacity-100'
      )}>
        {isAdded ? (
          <>
            <Check className="w-4 h-4" />
            {showText && <span>Added!</span>}
          </>
        ) : (
          <>
            <ShoppingBag className={cn(
              'w-4 h-4 transition-transform',
              isAnimating && 'animate-bounce'
            )} />
            {showText && (
              <span className="hidden sm:inline">
                {isAuthenticated ? 'Add to Cart' : 'Sign in'}
              </span>
            )}
          </>
        )}
      </span>
      
      {/* Van animation overlay */}
      {isAnimating && (
        <span className="absolute inset-0 flex items-center justify-center">
          <span className="animate-slide-in-right text-lg">🛒</span>
        </span>
      )}
    </Button>
  );
}
