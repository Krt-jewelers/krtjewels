import { useState, useEffect, lazy, Suspense } from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useRealtimeSync } from '@/hooks/useRealtimeSync';
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import NetworkWatcher from '@/components/dev/NetworkWatcher';
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import { ScrollToTop } from "@/components/layout/ScrollToTop";
import { SplashScreen } from "@/components/layout/SplashScreen";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import AuthPage from "./pages/Auth";
import CollectionPage from "./pages/Collection";
import ShopPage from "./pages/Shop";
import ProductDetail from "./pages/ProductDetail";
import GoldRatePage from "./pages/GoldRate";
import CartPage from "./pages/Cart";
import WishlistPage from "./pages/Wishlist";
import StoresPage from "./pages/Stores";
import AboutPage from "./pages/About";
import ContactPage from "./pages/Contact";
import TrackOrderPage from "./pages/TrackOrder";
import CheckoutPage from "./pages/Checkout";
import OrderSuccess from "./pages/OrderSuccess";
import ComparePage from "./pages/Compare";
import ChitFundLookupPage from "./pages/ChitFundLookup";
import BlogPage from "./pages/Blog";
import BlogPostPage from "./pages/BlogPost";
import SitePage from "./pages/SitePage";

// Customer Account Pages
import AccountDashboard from "./pages/account/Dashboard";
import AccountOrders from "./pages/account/Orders";
import AccountProfile from "./pages/account/Profile";
import AccountAddresses from "./pages/account/Addresses";
import AccountCoupons from "./pages/account/Coupons";
import OrderInvoice from "./pages/account/OrderInvoice";

// Lazy-loaded Admin Pages (shoppers do not download this heavy code)
const AdminLogin = lazy(() => import("./pages/admin/Login"));
const AdminDashboard = lazy(() => import("./pages/admin/Dashboard"));
const AdminGoldRates = lazy(() => import("./pages/admin/GoldRates"));
const AdminProducts = lazy(() => import("./pages/admin/Products"));
const AdminProductForm = lazy(() => import("./pages/admin/ProductForm"));
const AdminMakingCharges = lazy(() => import("./pages/admin/MakingCharges"));
const AdminOrders = lazy(() => import("./pages/admin/Orders"));
const AdminInvoices = lazy(() => import("./pages/admin/Invoices"));
const AdminChitFunds = lazy(() => import("./pages/admin/ChitFunds"));
const AdminUsers = lazy(() => import("./pages/admin/Users"));
const AdminReviews = lazy(() => import("./pages/admin/Reviews"));
const AdminInventory = lazy(() => import("./pages/admin/InventoryAlerts"));
const AdminCoupons = lazy(() => import("./pages/admin/Coupons"));
const AdminShippingSettings = lazy(() => import("./pages/admin/ShippingSettings"));
const AdminTaxSettings = lazy(() => import("./pages/admin/TaxSettings"));
const AdminEnquiries = lazy(() => import("./pages/admin/Enquiries"));
const AdminMegamenu = lazy(() => import("./pages/admin/Megamenu"));
const AdminMenuCategories = lazy(() => import("./pages/admin/MenuCategories"));
const AdminCarouselCategories = lazy(() => import("./pages/admin/CarouselCategories"));
const AdminCollectionBanners = lazy(() => import("./pages/admin/CollectionBanners"));
const AdminAttributes = lazy(() => import("./pages/admin/Attributes"));
const AdminAnalytics = lazy(() => import("./pages/admin/Analytics"));
const AdminMediaUsage = lazy(() => import("./pages/admin/MediaUsage"));
const AdminMedia = lazy(() => import("./pages/admin/Media"));
const AdminPaymentSettings = lazy(() => import("./pages/admin/PaymentSettings"));
const AdminPaymentVerification = lazy(() => import("./pages/admin/PaymentVerification"));
const AdminHeroSlides = lazy(() => import("./pages/admin/HeroSlides"));
const AdminSizeCharts = lazy(() => import("./pages/admin/SizeCharts"));
const AdminBlog = lazy(() => import("./pages/admin/Blog"));
const AdminSitePages = lazy(() => import("./pages/admin/SitePages"));
const AdminFooterSettings = lazy(() => import("./pages/admin/FooterSettings"));
const AdminMaintenance = lazy(() => import("./pages/admin/Maintenance"));
import { MaintenanceGate } from "@/components/maintenance/MaintenanceGate";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 30, // 30 seconds
      refetchOnWindowFocus: true,
      retry: 2,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
    },
  },
});

// Luxury fallback while admin chunks load
function AdminLoadingFallback() {
  return (
    <div className="min-h-screen bg-rich-black text-ivory flex flex-col items-center justify-center p-6 space-y-4">
      <div className="w-10 h-10 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      <p className="font-serif text-sm tracking-widest text-gold-light uppercase">Loading Portal...</p>
    </div>
  );
}

const App = () => {
  const [showSplash, setShowSplash] = useState(false);

  useEffect(() => {
    const hasVisited = localStorage.getItem('krt_visited');
    if (!hasVisited) {
      setShowSplash(true);
    }
  }, []);
  
  const handleSplashComplete = () => {
    localStorage.setItem('krt_visited', 'true');
    setShowSplash(false);
  };
  
  return (
    <QueryClientProvider client={queryClient}>
      {import.meta.env.DEV && <NetworkWatcher />}
      {(() => {
        function RealtimeSyncInvoker() {
          useRealtimeSync();
          return null;
        }
        return <RealtimeSyncInvoker />;
      })()}
      <TooltipProvider>
        <Toaster />
        <Sonner />
        {showSplash && <SplashScreen onComplete={handleSplashComplete} />}
        <BrowserRouter>
          <ScrollToTop />
          <MaintenanceGate>
            <Suspense fallback={<AdminLoadingFallback />}>
              <Routes>
                {/* Public Routes */}
                <Route path="/" element={<Index />} />
                <Route path="/auth" element={<AuthPage />} />
                <Route path="/collections/:category" element={<CollectionPage />} />
                <Route path="/shop" element={<ShopPage />} />
                <Route path="/:category/:subcategory" element={<ShopPage />} />
                <Route path="/product/:slug" element={<ProductDetail />} />
                <Route path="/gold-rate" element={<GoldRatePage />} />
                <Route path="/cart" element={<CartPage />} />
                <Route path="/checkout" element={<CheckoutPage />} />
                <Route path="/order-success" element={<OrderSuccess />} />
                <Route path="/wishlist" element={<WishlistPage />} />
                <Route path="/stores" element={<StoresPage />} />
                <Route path="/about" element={<AboutPage />} />
                <Route path="/contact" element={<ContactPage />} />
                <Route path="/track-order" element={<TrackOrderPage />} />
                <Route path="/compare" element={<ComparePage />} />
                <Route path="/chit-fund" element={<ChitFundLookupPage />} />
                <Route path="/blog" element={<BlogPage />} />
                <Route path="/blog/:slug" element={<BlogPostPage />} />
                <Route path="/privacy-policy" element={<SitePage slug="privacy-policy" />} />
                <Route path="/terms-and-conditions" element={<SitePage slug="terms-and-conditions" />} />
                <Route path="/shipping-policy" element={<SitePage slug="shipping-policy" />} />
                <Route path="/return-policy" element={<SitePage slug="return-policy" />} />
                <Route path="/faq" element={<SitePage slug="faq" />} />
                <Route path="/page/:slug" element={<SitePage />} />
                
                {/* Customer Account Routes */}
                <Route path="/account" element={<AccountDashboard />} />
                <Route path="/account/orders" element={<AccountOrders />} />
                <Route path="/account/orders/:orderId/invoice" element={<OrderInvoice />} />
                <Route path="/admin/orders/:orderId/invoice" element={<OrderInvoice />} />
                <Route path="/account/profile" element={<AccountProfile />} />
                <Route path="/account/addresses" element={<AccountAddresses />} />
                <Route path="/account/coupons" element={<AccountCoupons />} />
                
                {/* Admin Routes (Lazy Loaded) */}
                <Route path="/admin/login" element={<AdminLogin />} />
                <Route path="/admin" element={<AdminDashboard />} />
                <Route path="/admin/gold-rates" element={<AdminGoldRates />} />
                <Route path="/admin/products" element={<AdminProducts />} />
                <Route path="/admin/products/new" element={<AdminProductForm />} />
                <Route path="/admin/products/:id" element={<AdminProductForm />} />
                <Route path="/admin/inventory" element={<AdminInventory />} />
                <Route path="/admin/making-charges" element={<AdminMakingCharges />} />
                <Route path="/admin/orders" element={<AdminOrders />} />
                <Route path="/admin/invoices" element={<AdminInvoices />} />
                <Route path="/admin/chit-funds" element={<AdminChitFunds />} />
                <Route path="/admin/users" element={<AdminUsers />} />
                <Route path="/admin/reviews" element={<AdminReviews />} />
                <Route path="/admin/coupons" element={<AdminCoupons />} />
                <Route path="/admin/shipping" element={<AdminShippingSettings />} />
                <Route path="/admin/tax-settings" element={<AdminTaxSettings />} />
                <Route path="/admin/enquiries" element={<AdminEnquiries />} />
                <Route path="/admin/megamenu" element={<AdminMegamenu />} />
                <Route path="/admin/menu-categories" element={<AdminMenuCategories />} />
                <Route path="/admin/carousel-categories" element={<AdminCarouselCategories />} />
                <Route path="/admin/collection-banners" element={<AdminCollectionBanners />} />
                <Route path="/admin/attributes" element={<AdminAttributes />} />
                <Route path="/admin/analytics" element={<AdminAnalytics />} />
                <Route path="/admin/media-usage" element={<AdminMediaUsage />} />
                <Route path="/admin/media" element={<AdminMedia />} />
                <Route path="/admin/payment-settings" element={<AdminPaymentSettings />} />
                <Route path="/admin/payment-verification" element={<AdminPaymentVerification />} />
                <Route path="/admin/hero-slides" element={<AdminHeroSlides />} />
                <Route path="/admin/size-charts" element={<AdminSizeCharts />} />
                <Route path="/admin/blog" element={<AdminBlog />} />
                <Route path="/admin/site-pages" element={<AdminSitePages />} />
                <Route path="/admin/footer-settings" element={<AdminFooterSettings />} />
                <Route path="/admin/maintenance" element={<AdminMaintenance />} />

                {/* Legacy Policy URL Redirects */}
                <Route path="/terms" element={<Navigate to="/terms-and-conditions" replace />} />
                <Route path="/privacy" element={<Navigate to="/privacy-policy" replace />} />
                <Route path="/returns" element={<Navigate to="/return-policy" replace />} />
                <Route path="/shipping" element={<Navigate to="/shipping-policy" replace />} />
                
                {/* 404 Wildcard */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </MaintenanceGate>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
