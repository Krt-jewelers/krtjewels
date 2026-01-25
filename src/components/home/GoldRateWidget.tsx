import { useGoldRate } from '@/hooks/useGoldRate';
import { formatPrice } from '@/lib/types';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export function GoldRateWidget() {
  const { data: goldRate, isLoading } = useGoldRate();

  if (isLoading) {
    return (
      <section className="py-12 bg-secondary/50">
        <div className="container mx-auto px-4">
          <div className="animate-pulse flex items-center justify-center gap-8">
            <div className="h-8 w-40 bg-muted rounded" />
            <div className="h-8 w-40 bg-muted rounded" />
          </div>
        </div>
      </section>
    );
  }

  if (!goldRate) return null;

  return (
    <section className="py-12 bg-gradient-to-r from-rich-black via-charcoal to-rich-black relative overflow-hidden">
      {/* Decorative Elements */}
      <div className="absolute inset-0 bg-pattern-dots opacity-10" />
      
      <div className="container mx-auto px-4 relative">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="text-center md:text-left">
            <h3 className="font-serif text-2xl text-ivory mb-1">Today's Gold Rate</h3>
            <p className="text-ivory/60 text-sm">
              Updated: {new Date(goldRate.effective_date).toLocaleDateString('en-IN', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </p>
          </div>

          <div className="flex items-center gap-8">
            <div className="text-center">
              <span className="text-gold-light text-sm uppercase tracking-wider">22K Gold</span>
              <div className="flex items-center gap-2 mt-1">
                <span className="font-serif text-3xl md:text-4xl text-gold-gradient font-bold">
                  {formatPrice(goldRate.rate_22k)}
                </span>
                <span className="text-ivory/60 text-sm">/gram</span>
              </div>
            </div>

            <div className="h-12 w-px bg-ivory/20" />

            <div className="text-center">
              <span className="text-gold-light text-sm uppercase tracking-wider">24K Gold</span>
              <div className="flex items-center gap-2 mt-1">
                <span className="font-serif text-3xl md:text-4xl text-gold-gradient font-bold">
                  {formatPrice(goldRate.rate_24k)}
                </span>
                <span className="text-ivory/60 text-sm">/gram</span>
              </div>
            </div>
          </div>

          <Link to="/gold-rate">
            <Button className="btn-premium">
              View Rate History
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
