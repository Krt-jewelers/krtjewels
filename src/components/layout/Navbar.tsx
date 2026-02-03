import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Menu, Search, Heart, ShoppingBag, User, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from '@/components/ui/navigation-menu';
import { cn } from '@/lib/utils';

// Category route slugs
const categoryRoutes: Record<ProductCategory, string> = {
  necklaces: 'necklaces',
  earrings: 'earrings',
  rings: 'rings',
  bangles: 'bangles',
  bracelets: 'bracelets',
  chains: 'chains',
  pendants: 'pendants',
  wedding_sets: 'wedding-bridal',
  diamond_jewellery: 'diamond-jewellery',
  mens_jewellery: 'mens-jewellery',
};

// Category images for mega menu
const categoryImages: Record<ProductCategory, string> = {
  necklaces: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=300&h=200&fit=crop',
  earrings: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=300&h=200&fit=crop',
  rings: 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=300&h=200&fit=crop',
  bangles: 'https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=300&h=200&fit=crop',
  bracelets: 'https://images.unsplash.com/photo-1573408301185-9146fe634ad0?w=300&h=200&fit=crop',
  chains: 'https://images.unsplash.com/photo-1602751584552-8ba73aad10e1?w=300&h=200&fit=crop',
  pendants: 'https://images.unsplash.com/photo-1599458252573-56ae36120de1?w=300&h=200&fit=crop',
  wedding_sets: 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=300&h=200&fit=crop',
  diamond_jewellery: 'https://images.unsplash.com/photo-1603561591411-07134e71a2a9?w=300&h=200&fit=crop',
  mens_jewellery: 'https://images.unsplash.com/photo-1619119069152-a2b331eb392a?w=300&h=200&fit=crop',
};

const navLinks = [
  { name: 'Shop', href: '/shop' },
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

            {/* Desktop Navigation with Mega Menu */}
            <nav className="hidden lg:flex items-center gap-6">
              {/* Shop Link */}
              <Link
                to="/shop"
                className={cn(
                  "text-sm font-medium transition-colors link-elegant",
                  location.pathname === '/shop'
                    ? 'text-primary'
                    : 'text-foreground/80 hover:text-foreground'
                )}
              >
                Shop
              </Link>

              {/* Collections Mega Menu */}
              <NavigationMenu>
                <NavigationMenuList>
                  <NavigationMenuItem>
                    <NavigationMenuTrigger 
                      className={cn(
                        "text-sm font-medium bg-transparent hover:bg-transparent focus:bg-transparent data-[state=open]:bg-transparent",
                        location.pathname.startsWith('/collections')
                          ? 'text-primary'
                          : 'text-foreground/80 hover:text-foreground'
                      )}
                    >
                      Collections
                    </NavigationMenuTrigger>
                    <NavigationMenuContent>
                      <div className="w-[800px] p-6">
                        <div className="mb-4">
                          <h3 className="font-serif text-lg font-semibold text-foreground">Shop by Category</h3>
                          <p className="text-sm text-muted-foreground">Explore our exquisite collections</p>
                        </div>
                        <div className="grid grid-cols-5 gap-3">
                          {(Object.entries(CATEGORY_NAMES) as [ProductCategory, string][]).map(([category, name]) => (
                            <Link
                              key={category}
                              to={`/collections/${categoryRoutes[category]}`}
                              className="group block"
                            >
                              <div className="relative overflow-hidden rounded-lg aspect-[4/3] mb-2">
                                <img
                                  src={categoryImages[category]}
                                  alt={name}
                                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                              </div>
                              <span className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">
                                {name}
                              </span>
                            </Link>
                          ))}
                        </div>
                        <div className="mt-4 pt-4 border-t flex justify-between items-center">
                          <Link 
                            to="/shop" 
                            className="text-sm text-primary hover:underline font-medium"
                          >
                            View All Products →
                          </Link>
                          <Link 
                            to="/collections/wedding-bridal" 
                            className="text-sm text-primary hover:underline font-medium"
                          >
                            Bridal Collection →
                          </Link>
                        </div>
                      </div>
                    </NavigationMenuContent>
                  </NavigationMenuItem>
                </NavigationMenuList>
              </NavigationMenu>

              {/* Other Nav Links */}
              {navLinks.slice(1).map((link) => (
                <Link
                  key={link.name}
                  to={link.href}
                  className={cn(
                    "text-sm font-medium transition-colors link-elegant",
                    location.pathname.startsWith(link.href)
                      ? 'text-primary'
                      : 'text-foreground/80 hover:text-foreground'
                  )}
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
