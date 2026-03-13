import { Link } from 'react-router-dom';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatPrice } from '@/lib/types';
import { ProductCardSlider } from './ProductCardSlider';
import type { ProductWithPrice } from '@/lib/types';

interface ProductQuickViewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: ProductWithPrice;
}

export function ProductQuickViewDialog({ open, onOpenChange, product }: ProductQuickViewDialogProps) {
  const images = product.images.length > 0 ? product.images : ['/placeholder.svg'];
  const isOutOfStock = (product.stock_quantity ?? 1) <= 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl overflow-hidden border-border bg-background p-0">
        <div className="grid gap-0 md:grid-cols-2">
          <div className="bg-secondary/30 p-4 md:p-6">
            <div className="aspect-[4/5] overflow-hidden rounded-xl bg-background">
              <ProductCardSlider images={images} productName={product.name} />
            </div>
          </div>

          <div className="p-5 md:p-6">
            <DialogHeader>
              <DialogTitle className="text-xl leading-snug">{product.name}</DialogTitle>
            </DialogHeader>

            <div className="mt-4 space-y-3">
              <p className="text-2xl font-semibold text-foreground">
                {formatPrice(product.calculated_price.total)}
              </p>

              {isOutOfStock && (
                <Badge variant="outline" className="border-destructive/40 text-destructive">
                  Out of stock
                </Badge>
              )}

              {product.short_description && (
                <p className="line-clamp-4 text-sm text-muted-foreground">{product.short_description}</p>
              )}
            </div>

            <div className="mt-6 flex flex-col gap-2 sm:flex-row">
              <Button asChild className="flex-1">
                <Link to={`/product/${product.slug}`} onClick={() => onOpenChange(false)}>
                  View full details
                </Link>
              </Button>
              <Button variant="outline" asChild className="flex-1">
                <Link to={`/product/${product.slug}`} onClick={() => onOpenChange(false)}>
                  Open product page
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
