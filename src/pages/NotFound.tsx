import { Link } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Compass, Home, Sparkles, Phone } from 'lucide-react';

export default function NotFound() {
  return (
    <Layout>
      <div className="min-h-[70vh] flex items-center justify-center py-16 px-4 bg-gradient-to-b from-rich-black via-charcoal to-rich-black text-ivory">
        <div className="max-w-xl mx-auto text-center space-y-6">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/20 border border-primary/30 text-primary">
            <Compass className="w-10 h-10 animate-spin-slow" />
          </div>

          <div className="space-y-2">
            <span className="text-gold-light text-xs uppercase tracking-[0.3em]">
              404 • Page Not Found
            </span>
            <h1 className="font-serif text-4xl md:text-5xl font-normal text-ivory">
              A Rare Piece, <br />
              <span className="text-gold-gradient italic">Yet to Be Found</span>
            </h1>
            <p className="text-ivory/70 text-sm md:text-base max-w-md mx-auto pt-2">
              The page or exquisite jewel you are looking for may have been moved, renamed, or is currently being curated.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
            <Button asChild className="btn-luxury w-full sm:w-auto h-12 px-6">
              <Link to="/" className="flex items-center gap-2">
                <Home className="w-4 h-4" />
                Return to Home
              </Link>
            </Button>
            <Button asChild variant="outline" className="border-gold/40 text-ivory hover:bg-white/10 w-full sm:w-auto h-12 px-6">
              <Link to="/shop" className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary" />
                Explore Jewellery
              </Link>
            </Button>
          </div>

          <div className="pt-8 border-t border-white/10 text-xs text-ivory/50 flex items-center justify-center gap-6">
            <Link to="/gold-rate" className="hover:text-primary transition-colors">Today's Gold Rate</Link>
            <span>•</span>
            <Link to="/contact" className="hover:text-primary transition-colors flex items-center gap-1">
              <Phone className="w-3 h-3" /> Need Assistance?
            </Link>
          </div>
        </div>
      </div>
    </Layout>
  );
}
