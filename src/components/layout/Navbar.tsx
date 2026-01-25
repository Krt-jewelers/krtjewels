import { Link } from 'react-router-dom';
import { Heart, ShoppingBag, User, Menu, X, Search, ChevronDown } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { useAuth } from '@/hooks/useAuth';
import { useCart } from '@/hooks/useCart';
import { useWishlist } from '@/hooks/useWishlist';
import { useGoldRate } from '@/hooks/useGoldRate';
import { formatPrice } from '@/lib/types';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const collections = [
  { name: 'Necklaces', href: '/collections/necklaces' },
  { name: 'Earrings', href: '/collections/earrings' },
  { name: 'Rings', href: '/collections/rings' },
  { name: 'Bangles', href: '/collections/bangles' },
  { name: 'Bracelets', href: '/collections/bracelets' },
  { name: 'Chains', href: '/collections/chains' },
  { name: 'Pendants', href: '/collections/pendants' },
];

const specialCollections = [
  { name: 'Wedding & Bridal', href: '/collections/wedding-bridal' },
  { name: 'Diamond Jewellery', href: '/collections/diamond-jewellery' },
  { name: "Men's Jewellery", href: '/collections/mens-jewellery' },
];

export function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, isAdmin, signOut } = useAuth();
  const { itemCount } = useCart();
  const { items: wishlistItems } = useWishlist();
  const { data: goldRate } = useGoldRate();

  return (
    <>
      {/* Gold Rate Ticker */}
      <div className="ticker-gold py-2 px-4 text-center text-sm font-medium">
        <div className="container mx-auto flex items-center justify-center gap-6">
          <span className="flex items-center gap-2">
            <span className="text-muted-foreground text-gold-light/70">Today's Gold Rate:</span>
            <span className="gold-shimmer px-2 py-0.5 rounded text-rich-black">
              22K: {goldRate ? formatPrice(goldRate.rate_22k) : '...'}/g
            </span>
            <span className="gold-shimmer px-2 py-0.5 rounded text-rich-black">
              24K: {goldRate ? formatPrice(goldRate.rate_24k) : '...'}/g
            </span>
          </span>
        </div>
      </div>

      {/* Main Navbar */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-md border-b border-border shadow-soft">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-20">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-gradient-gold flex items-center justify-center shadow-gold">
                <span className="text-rich-black font-serif font-bold text-xl">J</span>
              </div>
              <div className="hidden sm:block">
                <h1 className="font-serif text-2xl font-semibold text-foreground">
                  <span className="text-gold-gradient">Heritage</span> Jewels
                </h1>
                <p className="text-xs text-muted-foreground tracking-widest uppercase">Since 1960</p>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-8">
              <Link to="/" className="link-elegant text-sm font-medium text-foreground/80 hover:text-foreground transition-colors">
                Home
              </Link>
              
              {/* Collections Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger className="link-elegant flex items-center gap-1 text-sm font-medium text-foreground/80 hover:text-foreground transition-colors">
                  Collections <ChevronDown className="w-4 h-4" />
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56 bg-card border-border shadow-luxury">
                  <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Gold Jewellery
                  </div>
                  {collections.map((item) => (
                    <DropdownMenuItem key={item.name} asChild>
                      <Link to={item.href} className="cursor-pointer">{item.name}</Link>
                    </DropdownMenuItem>
                  ))}
                  <DropdownMenuSeparator />
                  <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Special Collections
                  </div>
                  {specialCollections.map((item) => (
                    <DropdownMenuItem key={item.name} asChild>
                      <Link to={item.href} className="cursor-pointer">{item.name}</Link>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              <Link to="/gold-rate" className="link-elegant text-sm font-medium text-foreground/80 hover:text-foreground transition-colors">
                Gold Rate
              </Link>

              <Link to="/stores" className="link-elegant text-sm font-medium text-foreground/80 hover:text-foreground transition-colors">
                Stores
              </Link>

              <Link to="/about" className="link-elegant text-sm font-medium text-foreground/80 hover:text-foreground transition-colors">
                About
              </Link>

              <Link to="/contact" className="link-elegant text-sm font-medium text-foreground/80 hover:text-foreground transition-colors">
                Contact
              </Link>
            </nav>

            {/* Right Actions */}
            <div className="flex items-center gap-4">
              {/* Search */}
              <Button variant="ghost" size="icon" className="hidden sm:flex hover:bg-secondary">
                <Search className="w-5 h-5" />
              </Button>

              {/* Wishlist */}
              <Link to="/wishlist" className="relative">
                <Button variant="ghost" size="icon" className="hover:bg-secondary">
                  <Heart className="w-5 h-5" />
                  {wishlistItems.length > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-accent text-accent-foreground text-xs flex items-center justify-center">
                      {wishlistItems.length}
                    </span>
                  )}
                </Button>
              </Link>

              {/* Cart */}
              <Link to="/cart" className="relative">
                <Button variant="ghost" size="icon" className="hover:bg-secondary">
                  <ShoppingBag className="w-5 h-5" />
                  {itemCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center">
                      {itemCount}
                    </span>
                  )}
                </Button>
              </Link>

              {/* User Menu */}
              {user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="hover:bg-secondary">
                      <User className="w-5 h-5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48 bg-card border-border shadow-luxury">
                    <DropdownMenuItem asChild>
                      <Link to="/account" className="cursor-pointer">My Account</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/orders" className="cursor-pointer">My Orders</Link>
                    </DropdownMenuItem>
                    {isAdmin && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem asChild>
                          <Link to="/admin" className="cursor-pointer text-accent">Admin Dashboard</Link>
                        </DropdownMenuItem>
                      </>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={signOut} className="cursor-pointer">
                      Sign Out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Link to="/auth">
                  <Button className="btn-premium text-sm px-6 hidden sm:flex">
                    Sign In
                  </Button>
                </Link>
              )}

              {/* Mobile Menu */}
              <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                <SheetTrigger asChild className="lg:hidden">
                  <Button variant="ghost" size="icon">
                    <Menu className="w-5 h-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-80 bg-card">
                  <div className="flex flex-col gap-6 mt-8">
                    <Link 
                      to="/" 
                      onClick={() => setMobileMenuOpen(false)}
                      className="text-lg font-medium"
                    >
                      Home
                    </Link>

                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                        Gold Jewellery
                      </p>
                      {collections.map((item) => (
                        <Link
                          key={item.name}
                          to={item.href}
                          onClick={() => setMobileMenuOpen(false)}
                          className="block py-2 text-foreground/80 hover:text-foreground"
                        >
                          {item.name}
                        </Link>
                      ))}
                    </div>

                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                        Special Collections
                      </p>
                      {specialCollections.map((item) => (
                        <Link
                          key={item.name}
                          to={item.href}
                          onClick={() => setMobileMenuOpen(false)}
                          className="block py-2 text-foreground/80 hover:text-foreground"
                        >
                          {item.name}
                        </Link>
                      ))}
                    </div>

                    <Link 
                      to="/gold-rate" 
                      onClick={() => setMobileMenuOpen(false)}
                      className="text-lg font-medium"
                    >
                      Gold Rate
                    </Link>

                    <Link 
                      to="/stores" 
                      onClick={() => setMobileMenuOpen(false)}
                      className="text-lg font-medium"
                    >
                      Stores
                    </Link>

                    <Link 
                      to="/about" 
                      onClick={() => setMobileMenuOpen(false)}
                      className="text-lg font-medium"
                    >
                      About
                    </Link>

                    <Link 
                      to="/contact" 
                      onClick={() => setMobileMenuOpen(false)}
                      className="text-lg font-medium"
                    >
                      Contact
                    </Link>

                    {!user && (
                      <Link to="/auth" onClick={() => setMobileMenuOpen(false)}>
                        <Button className="btn-premium w-full mt-4">Sign In</Button>
                      </Link>
                    )}
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </header>
    </>
  );
}
