import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export function BridalBanner() {
  return (
    <section className="py-20 relative overflow-hidden">
      <div className="absolute inset-0">
        <img 
          src="https://images.unsplash.com/photo-1596944924616-7b38e7cfac36?w=1920&h=800&fit=crop"
          alt="Bridal Collection"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-maroon-dark/90 via-maroon/80 to-transparent" />
      </div>

      <div className="container mx-auto px-4 relative">
        <div className="max-w-xl">
          <span className="inline-block text-gold-light text-sm uppercase tracking-[0.3em] mb-4">
            Exclusive Collection
          </span>
          <h2 className="font-serif text-4xl md:text-5xl lg:text-6xl text-ivory font-semibold mb-6 text-shadow-luxury">
            Wedding & Bridal
          </h2>
          <p className="text-ivory/80 text-lg mb-8 max-w-md">
            Make your special day unforgettable with our exquisite bridal sets. Each piece 
            is handcrafted to celebrate the beginning of your beautiful journey.
          </p>
          <div className="flex gap-4">
            <Link to="/collections/wedding-sets">
              <Button className="btn-premium text-lg px-8 py-6">
                Explore Bridal Sets
              </Button>
            </Link>
            <Link to="/contact">
              <Button 
                variant="outline" 
                className="text-lg px-8 py-6 border-2 border-ivory/30 text-ivory hover:bg-ivory/10"
              >
                Book Consultation
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
