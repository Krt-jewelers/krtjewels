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
import AdminDashboard from "./pages/admin/Dashboard";
import AdminGoldRates from "./pages/admin/GoldRates";
import AdminProducts from "./pages/admin/Products";
import AdminMakingCharges from "./pages/admin/MakingCharges";
import AdminOrders from "./pages/admin/Orders";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/collections/:category" element={<CollectionPage />} />
          <Route path="/product/:slug" element={<ProductDetail />} />
          <Route path="/gold-rate" element={<GoldRatePage />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/wishlist" element={<WishlistPage />} />
          <Route path="/stores" element={<StoresPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/contact" element={<ContactPage />} />
          {/* Admin Routes */}
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/gold-rates" element={<AdminGoldRates />} />
          <Route path="/admin/products" element={<AdminProducts />} />
          <Route path="/admin/making-charges" element={<AdminMakingCharges />} />
          <Route path="/admin/orders" element={<AdminOrders />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
