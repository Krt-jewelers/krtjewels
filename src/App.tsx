import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import AuthPage from "./pages/Auth";
import CollectionPage from "./pages/Collection";
import ProductDetail from "./pages/ProductDetail";
import GoldRatePage from "./pages/GoldRate";
import CartPage from "./pages/Cart";
import WishlistPage from "./pages/Wishlist";
import StoresPage from "./pages/Stores";
import AboutPage from "./pages/About";
import ContactPage from "./pages/Contact";
import TrackOrderPage from "./pages/TrackOrder";
import CheckoutPage from "./pages/Checkout";
// Customer Account Pages
import AccountDashboard from "./pages/account/Dashboard";
import AccountOrders from "./pages/account/Orders";
import AccountProfile from "./pages/account/Profile";
import AccountAddresses from "./pages/account/Addresses";
import AccountCoupons from "./pages/account/Coupons";
// Admin Pages
import AdminLogin from "./pages/admin/Login";
import AdminDashboard from "./pages/admin/Dashboard";
import AdminGoldRates from "./pages/admin/GoldRates";
import AdminProducts from "./pages/admin/Products";
import AdminProductForm from "./pages/admin/ProductForm";
import AdminMakingCharges from "./pages/admin/MakingCharges";
import AdminOrders from "./pages/admin/Orders";
import AdminChitFunds from "./pages/admin/ChitFunds";
import AdminUsers from "./pages/admin/Users";
import AdminReviews from "./pages/admin/Reviews";
import AdminCoupons from "./pages/admin/Coupons";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Index />} />
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/collections/:category" element={<CollectionPage />} />
          <Route path="/product/:slug" element={<ProductDetail />} />
          <Route path="/gold-rate" element={<GoldRatePage />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="/wishlist" element={<WishlistPage />} />
          <Route path="/stores" element={<StoresPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/track-order" element={<TrackOrderPage />} />
          
          {/* Customer Account Routes */}
          <Route path="/account" element={<AccountDashboard />} />
          <Route path="/account/orders" element={<AccountOrders />} />
          <Route path="/account/profile" element={<AccountProfile />} />
          <Route path="/account/addresses" element={<AccountAddresses />} />
          <Route path="/account/coupons" element={<AccountCoupons />} />
          
          {/* Admin Routes */}
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/gold-rates" element={<AdminGoldRates />} />
          <Route path="/admin/products" element={<AdminProducts />} />
          <Route path="/admin/products/new" element={<AdminProductForm />} />
          <Route path="/admin/products/:id" element={<AdminProductForm />} />
          <Route path="/admin/making-charges" element={<AdminMakingCharges />} />
          <Route path="/admin/orders" element={<AdminOrders />} />
          <Route path="/admin/chit-funds" element={<AdminChitFunds />} />
          <Route path="/admin/users" element={<AdminUsers />} />
          <Route path="/admin/reviews" element={<AdminReviews />} />
          <Route path="/admin/coupons" element={<AdminCoupons />} />
          
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
