import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Menu, Search, Heart, ShoppingBag, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { useCart } from '@/hooks/useCart';
import { useGoldRate } from '@/hooks/useGoldRate';
import { formatPrice } from '@/lib/types';
import { SearchOverlay } from './SearchOverlay';
import { MobileSidebar } from './MobileSidebar';
import { FlyingCart } from '@/components/cart/FlyingCart';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const navLinks = [
  { name: 'Collections', href: '/collections/necklaces' },
  { name: 'Gold Rate', href: '/gold-rate' },
  { name: 'Stores', href: '/stores' },
  { name: 'About', href: '/about' },
  { name: 'Contact', href: '/contact' },
];

export function Navbar() {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const { isAuthenticated, user, signOut, isAdmin } = useAuth();
  const { itemCount } = useCart();
  const { data: goldRate } = useGoldRate();
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <>
      {/* Gold Rate Ticker */}
      <div className="ticker-gold py-1.5 text-xs md:text-sm">
        <div className="container mx-auto px-4 flex items-center justify-center gap-4 md:gap-8">
          <div className="flex items-center gap-2">
            <span className="text-gold-light/70">22K Gold:</span>
            <span className="font-semibold text-gold-light">
              {goldRate ? `${formatPrice(goldRate.rate_22k)}/g` : '—'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-gold-light/70">24K Gold:</span>
            <span className="font-semibold text-gold-light">
              {goldRate ? `${formatPrice(goldRate.rate_24k)}/g` : '—'}
            </span>
          </div>
          <Link to="/gold-rate" className="text-gold-light hover:underline hidden md:block">
            View Today's Rates →
          </Link>
        </div>
      </div>

      {/* Main Navbar */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-md border-b border-border">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16 md:h-20">
            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setIsSidebarOpen(true)}
            >
              <Menu className="w-5 h-5" />
            </Button>

            {/* Logo */}
            <Link to="/" className="flex items-center">
              <h1 className="font-serif text-xl md:text-2xl font-bold text-foreground tracking-wide">
                <span className="text-primary">KRT</span> Jewels
              </h1>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-8">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  to={link.href}
                  className={`text-sm font-medium transition-colors link-elegant ${
                    location.pathname.startsWith(link.href)
                      ? 'text-primary'
                      : 'text-foreground/80 hover:text-foreground'
                  }`}
                >
                  {link.name}
                </Link>
              ))}
            </nav>

            {/* Actions */}
            <div className="flex items-center gap-1 md:gap-2">
              {/* Search - Premium Icon */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsSearchOpen(true)}
                className="relative group"
              >
                <div className="w-9 h-9 rounded-full border border-primary/30 flex items-center justify-center group-hover:border-primary group-hover:bg-primary/5 transition-all">
                  <Search className="w-4 h-4 text-primary" />
                </div>
              </Button>

              {/* Wishlist */}
              <Link to="/wishlist">
                <Button variant="ghost" size="icon">
                  <Heart className="w-5 h-5" />
                </Button>
              </Link>

              {/* Cart - Opens Sidebar */}
              <Button 
                variant="ghost" 
                size="icon" 
                className="relative"
                onClick={() => setIsCartOpen(true)}
              >
                <ShoppingBag className="w-5 h-5" />
                {itemCount > 0 && (
                  <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs badge-luxury">
                    {itemCount}
                  </Badge>
                )}
              </Button>

              {/* User Menu */}
              {isAuthenticated ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="hidden md:flex">
                      <User className="w-5 h-5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <div className="px-2 py-1.5 text-sm font-medium truncate">
                      {user?.email}
                    </div>
                    <DropdownMenuSeparator />
                    {isAdmin && (
                      <>
                        <DropdownMenuItem onClick={() => navigate('/admin')}>
                          Admin Dashboard
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                      </>
                    )}
                    <DropdownMenuItem onClick={() => navigate('/wishlist')}>
                      My Wishlist
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate('/cart')}>
                      My Cart
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={signOut}>
                      Sign Out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Link to="/auth" className="hidden md:block">
                  <Button variant="ghost" size="sm" className="gap-2">
                    <User className="w-4 h-4" />
                    <span>Login</span>
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Search Overlay */}
      <SearchOverlay isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />

      {/* Mobile Sidebar */}
      <MobileSidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      {/* Flying Cart Sidebar */}
      <FlyingCart isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
    </>
  );
}
