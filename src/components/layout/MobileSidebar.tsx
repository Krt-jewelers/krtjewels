import { Link, useNavigate } from 'react-router-dom';
import { X, ChevronRight, User, MapPin, Phone, RefreshCw, Package, Heart, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { CATEGORY_NAMES } from '@/lib/types';

interface MobileSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const menuCategories = [
  { name: 'Rings', href: '/collections/rings', icon: '💍' },
  { name: 'Earrings', href: '/collections/earrings', icon: '✨' },
  { name: 'Necklaces', href: '/collections/necklaces', icon: '📿' },
  { name: 'Bangles & Bracelets', href: '/collections/bangles', icon: '⭕' },
  { name: 'Chains', href: '/collections/chains', icon: '🔗' },
  { name: 'Pendants', href: '/collections/pendants', icon: '💎' },
  { name: 'Engagement & Wedding', href: '/collections/wedding-sets', icon: '💒' },
  { name: 'Diamond Jewellery', href: '/collections/diamond-jewellery', icon: '💠' },
  { name: "Men's Jewellery", href: '/collections/mens-jewellery', icon: '👔' },
];

const quickLinks = [
  { name: 'Login / Sign Up', href: '/auth', icon: User },
  { name: 'Track Your Order', href: '/track-order', icon: Package },
  { name: 'Gold Rates', href: '/gold-rate', icon: Sparkles },
  { name: 'My Wishlist', href: '/wishlist', icon: Heart },
  { name: 'Store Locator', href: '/stores', icon: MapPin },
  { name: 'Contact Us', href: '/contact', icon: Phone },
];

export function MobileSidebar({ isOpen, onClose }: MobileSidebarProps) {
  const { isAuthenticated, user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleNavigation = (href: string) => {
    navigate(href);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 z-40 bg-rich-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Sidebar */}
      <div className="fixed inset-y-0 left-0 z-50 w-[85%] max-w-sm bg-background shadow-luxury animate-slide-in-right overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-background z-10 flex items-center justify-between p-4 border-b">
          <Link to="/" onClick={onClose} className="font-serif text-2xl font-bold text-primary">
            KRT Jewels
          </Link>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* User Section */}
        {isAuthenticated ? (
          <div className="p-4 bg-secondary/30 border-b">
            <p className="text-sm text-muted-foreground">Welcome back,</p>
            <p className="font-medium truncate">{user?.email}</p>
          </div>
        ) : null}

        {/* Categories */}
        <div className="py-4">
          <nav className="space-y-1">
            {menuCategories.map((item) => (
              <button
                key={item.name}
                onClick={() => handleNavigation(item.href)}
                className="flex items-center justify-between w-full px-4 py-3 hover:bg-secondary/50 transition-colors text-left group"
              >
                <div className="flex items-center gap-3">
                  <span className="text-lg">{item.icon}</span>
                  <span className="font-medium tracking-wide">{item.name.toUpperCase()}</span>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
              </button>
            ))}
          </nav>
        </div>

        <div className="h-px bg-border mx-4" />

        {/* Quick Links */}
        <div className="py-4">
          <nav className="space-y-1">
            {quickLinks.map((item) => {
              const Icon = item.icon;
              // Skip login link if authenticated
              if (item.name === 'Login / Sign Up' && isAuthenticated) return null;
              
              return (
                <button
                  key={item.name}
                  onClick={() => handleNavigation(item.href)}
                  className="flex items-center gap-3 w-full px-4 py-3 hover:bg-secondary/50 transition-colors text-left"
                >
                  <Icon className="w-5 h-5 text-muted-foreground" />
                  <span>{item.name}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Sign Out Button */}
        {isAuthenticated && (
          <div className="p-4 border-t">
            <Button
              variant="outline"
              className="w-full"
              onClick={() => {
                signOut();
                onClose();
              }}
            >
              Sign Out
            </Button>
          </div>
        )}

        {/* Trust Badges */}
        <div className="p-4 mt-auto border-t bg-secondary/30">
          <div className="grid grid-cols-2 gap-4 text-center">
            <div>
              <p className="text-xs text-muted-foreground">BIS Hallmarked</p>
              <p className="font-medium text-sm">916 Gold</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Trusted Since</p>
              <p className="font-medium text-sm">30+ Years</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
