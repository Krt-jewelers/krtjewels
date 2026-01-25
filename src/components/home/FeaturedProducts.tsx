import { Link } from 'react-router-dom';
import { useFeaturedProducts } from '@/hooks/useProducts';
import { ProductGrid } from '@/components/products/ProductGrid';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';

export function FeaturedProducts() {
  const { data: products, isLoading } = useFeaturedProducts();

  return (
    <section className="py-20">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-12">
          <div>
            <span className="text-primary text-sm uppercase tracking-[0.3em] font-medium">
              Curated Selection
            </span>
            <h2 className="font-serif text-4xl md:text-5xl font-semibold mt-2">
              Featured Pieces
            </h2>
          </div>
          <Link to="/collections/necklaces">
            <Button variant="ghost" className="group text-primary hover:text-primary/80">
              View All Collection
              <ArrowRight className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-1" />
            </Button>
          </Link>
        </div>

        {/* Products */}
        <ProductGrid 
          products={products?.slice(0, 8) || []} 
          isLoading={isLoading}
          emptyMessage="No featured products available"
        />
      </div>
    </section>
  );
}
