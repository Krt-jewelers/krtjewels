import { SEO } from '@/components/layout/SEO';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Compass, Home, Sparkles, Phone, Search } from 'lucide-react';
import { collectionPath } from '@/lib/categories';

const POPULAR = [
  { name: 'Necklaces', category: 'necklaces' },
  { name: 'Rings', category: 'rings' },
  { name: 'Earrings', category: 'earrings' },
  { name: 'Bangles', category: 'bangles' },
  { name: 'Wedding Sets', category: 'wedding_sets' },
];


export default function NotFound() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    navigate(q ? `/shop?q=${encodeURIComponent(q)}` : '/shop');
  };

  return (
    <Layout>
      <SEO title="404 – Page Not Found" noindex={true} />
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

          <form onSubmit={handleSearch} role="search" className="flex gap-2 max-w-md mx-auto pt-2">
            <label htmlFor="notfound-search" className="sr-only">Search jewellery</label>
            <input
              id="notfound-search"
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search rings, chains, bangles…"
              className="flex-1 h-12 rounded-md bg-white/10 border border-white/20 px-4 text-ivory placeholder:text-ivory/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            />
            <Button type="submit" className="btn-luxury h-12 px-4" aria-label="Search">
              <Search className="w-4 h-4" aria-hidden="true" />
            </Button>
          </form>

          <nav aria-label="Popular collections" className="flex flex-wrap justify-center gap-2">
            {POPULAR.map((c) => (
              <Link
                key={c.category}
                to={collectionPath(c.category)}
                className="inline-flex items-center min-h-11 px-4 rounded-full border border-white/20 text-sm text-ivory/80 hover:border-primary hover:text-primary transition-colors"
              >
                {c.name}
              </Link>
            ))}
          </nav>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
            <Button asChild className="btn-luxury w-full sm:w-auto h-12 px-6">
              <Link to="/" className="flex items-center gap-2">
                <Home className="w-4 h-4" />
                Return to Home
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              className="border-primary/50 bg-transparent text-ivory hover:bg-primary hover:text-rich-black hover:border-primary w-full sm:w-auto h-12 px-6 transition-all"
            >
              <Link to="/shop" className="flex items-center gap-2 group">
                <Sparkles className="w-4 h-4 text-primary group-hover:text-inherit transition-colors" />
                <span>Explore Jewellery</span>
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
