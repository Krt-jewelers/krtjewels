import { ReactNode, useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { hardResetPWA } from '@/lib/pwaRecovery';
import { Navbar } from './Navbar';
import { Footer } from './Footer';
import { FloatingContactMenu } from '@/components/ui/FloatingContactMenu';
import { ComparisonBar } from '@/components/products/ComparisonBar';
import { usePageViewTracker } from '@/hooks/useAnalyticsTracker';
import { CookieConsent } from './CookieConsent';


interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const touchStartY = useRef<number | null>(null);
  const [pullDistance, setPullDistance] = useState(0);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const location = useLocation();
  usePageViewTracker();

  useEffect(() => {
    const onTouchStart = (e: TouchEvent) => {
      if (window.scrollY > 0) return;
      touchStartY.current = e.touches[0]?.clientY ?? null;
    };

    const onTouchMove = (e: TouchEvent) => {
      if (touchStartY.current == null) return;
      const currentY = e.touches[0]?.clientY ?? touchStartY.current;
      const delta = currentY - touchStartY.current;
      if (delta > 0) {
        setPullDistance(Math.min(delta, 120));
      }
    };

    const onTouchEnd = () => {
      if (pullDistance > 80) {
        void hardResetPWA('pull-to-refresh');
      }
      setPullDistance(0);
      touchStartY.current = null;
    };

    window.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchmove', onTouchMove, { passive: true });
    window.addEventListener('touchend', onTouchEnd);
    return () => {
      window.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
    };
  }, [pullDistance]);

  // Pages render straight away; ones that need sign-in (account, admin,
  // checkout) wait for auth themselves. Waiting here delayed every page.
  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* The skip link lives at the top of Navbar. */}
      <div
        className="fixed top-0 left-0 right-0 z-50 flex items-center justify-center pointer-events-none transition-transform"
        style={{ transform: `translateY(${pullDistance - 60}px)` }}
      >
        {pullDistance > 0 && (
          <div className="px-3 py-1 rounded-full bg-rich-black text-ivory text-xs shadow-lg">
            {pullDistance > 80 ? 'Release to refresh' : 'Pull to refresh'}
          </div>
        )}
      </div>
      <Navbar isCartOpen={isCartOpen} onCartOpenChange={setIsCartOpen} />
      <main id="main-content" tabIndex={-1} className="flex-1 scroll-mt-24 outline-none">{children}</main>
      <Footer />
      {!isCartOpen &&
        location.pathname !== '/cart' &&
        location.pathname !== '/checkout' &&
        !location.pathname.startsWith('/product/') && <FloatingContactMenu />}
      <ComparisonBar />
      <CookieConsent />
    </div>
          

  );
}
