import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Menu, Search, Heart, ShoppingBag, User, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/hooks/useAuth';
import { useCart } from '@/hooks/useCart';
import { useGoldRate } from '@/hooks/useGoldRate';
import { formatPrice, CATEGORY_NAMES, type ProductCategory } from '@/lib/types';
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
import { cn } from '@/lib/utils';

// Category route slugs for the navigation bar
const categoryNavItems: { name: string; href: string }[] = [
  { name: 'RINGS', href: '/collections/rings' },
  { name: 'EARRINGS', href: '/collections/earrings' },
  { name: 'NECKLACES', href: '/collections/necklaces' },
  { name: 'BANGLES & BRACELETS', href: '/collections/bangles' },
  { name: 'ENGAGEMENT & WEDDING', href: '/collections/wedding-bridal' },
  { name: 'COLLECTIONS', href: '/shop' },
  { name: 'GIFTS', href: '/collections/diamond-jewellery' },
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
      {/* ── GOLD RATE TICKER (both desktop + mobile) ── */}
      {goldRate && (
        <div className="sticky top-0 z-50 bg-rich-black text-ivory">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-center gap-4 md:gap-8 h-8 text-xs">
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                <span className="text-ivory/60 hidden sm:inline">Live</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-primary font-semibold">22K Gold:</span>
                <span className="text-ivory font-bold">₹{goldRate.rate_22k.toLocaleString('en-IN')}/g</span>
              </div>
              <span className="text-ivory/30">|</span>
              <div className="flex items-center gap-1">
                <span className="text-primary font-semibold">24K Gold:</span>
                <span className="text-ivory font-bold">₹{goldRate.rate_24k.toLocaleString('en-IN')}/g</span>
              </div>
              <Link to="/gold-rate" className="text-primary hover:underline hidden sm:inline">
                View History →
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* ── DESKTOP HEADER ── */}
      <header className={cn("hidden lg:block sticky z-40 bg-background border-b border-border", goldRate ? "top-8" : "top-0")}>
        {/* Row 1: Phone | Logo (center) | Search + Icons */}
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Left – Phone */}
            <div className="flex items-center gap-2 text-sm text-muted-foreground min-w-[200px]">
              <Phone className="w-4 h-4" />
              <span>+91-900-100-1313</span>
            </div>

            {/* Center – Logo */}
            <Link to="/" className="absolute left-1/2 -translate-x-1/2">
              <h1 className="font-serif text-2xl md:text-3xl font-bold tracking-[0.15em] text-foreground whitespace-nowrap">
                KRT JEWELS
              </h1>
            </Link>

            {/* Right – Search bar + icons */}
            <div className="flex items-center gap-3 min-w-[200px] justify-end">
              {/* Inline search */}
              <button
                onClick={() => setIsSearchOpen(true)}
                className="flex items-center gap-2 border border-border rounded px-3 py-1.5 text-sm text-muted-foreground hover:border-primary/50 transition-colors w-44"
              >
                <Search className="w-4 h-4" />
                <span>SEARCH</span>
              </button>

              {/* User */}
              {isAuthenticated ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-9 w-9">
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
                    <DropdownMenuItem onClick={() => navigate('/account')}>
                      My Account
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate('/account/orders')}>
                      My Orders
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate('/chit-fund')}>
                      Digital Gold Scheme
                    </DropdownMenuItem>
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
                <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => navigate('/auth')}>
                  <User className="w-5 h-5" />
                </Button>
              )}

              {/* Wishlist */}
              <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => navigate('/wishlist')}>
                <Heart className="w-5 h-5" />
              </Button>

              {/* Cart */}
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 relative"
                onClick={() => setIsCartOpen(true)}
              >
                <ShoppingBag className="w-5 h-5" />
                {itemCount > 0 && (
                  <Badge className="absolute -top-1 -right-1 h-4 w-4 flex items-center justify-center p-0 text-[10px] badge-luxury">
                    {itemCount}
                  </Badge>
                )}
              </Button>
            </div>
          </div>
        </div>

      </header>

      {/* ── MOBILE HEADER ── */}
      <header className={cn("lg:hidden sticky z-40 bg-background border-b border-border", goldRate ? "top-8" : "top-0")}>
        {/* Row 1: Hamburger + Logo (left) | Icons (right) */}
        <div className="flex items-center justify-between h-14 px-4">
          {/* Left – Menu + Logo */}
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9"
              onClick={() => setIsSidebarOpen(true)}
            >
              <Menu className="w-5 h-5" />
            </Button>
            <Link to="/">
              <h1 className="font-serif text-lg font-bold tracking-[0.15em] text-foreground whitespace-nowrap">
                KRT JEWELS
              </h1>
            </Link>
          </div>

          {/* Right – Icons */}
          <div className="flex items-center gap-0.5">
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9"
              onClick={() => setIsSearchOpen(true)}
            >
              <Search className="w-5 h-5" />
            </Button>
            <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => navigate('/wishlist')}>
              <Heart className="w-5 h-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 relative"
              onClick={() => setIsCartOpen(true)}
            >
              <ShoppingBag className="w-5 h-5" />
              {itemCount > 0 && (
                <Badge className="absolute -top-1 -right-1 h-4 w-4 flex items-center justify-center p-0 text-[10px] badge-luxury">
                  {itemCount}
                </Badge>
              )}
            </Button>
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
