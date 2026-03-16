import { useState, useCallback } from "react";
import { usePublicProducts } from "../hooks/useSupabaseQuery";
import { useCart } from "../contexts/CartContext";
import { Product } from "../types";
import SEO from "./ecommerce/SEO";
import StorefrontNavbar from "./ecommerce/StorefrontNavbar";
import Hero from "./ecommerce/Hero";
import CategoryGrid from "./ecommerce/CategoryGrid";
import FeaturedProducts from "./ecommerce/FeaturedProducts";
import ProductCatalog from "./ecommerce/ProductCatalog";
import OrderTracking from "./ecommerce/OrderTracking";
import CustomerDashboard from "./ecommerce/CustomerDashboard";
import StorefrontFooter from "./ecommerce/StorefrontFooter";
import CartSidebar from "./CartSidebar";
import AuthModal from "./AuthModal";
import ProductQuickView from "./ProductQuickView";
import CheckoutModal from "./CheckoutModal";
import compactToast from "../utils/compactToast";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

type PageView = "home" | "catalog" | "orders" | "dashboard";

interface HorumarStorefrontProps {
  onAdminClick?: () => void;
}

export default function HorumarStorefront({ onAdminClick }: HorumarStorefrontProps) {
  const { data: products = [], isLoading } = usePublicProducts();
  const cart = useCart();

  const [currentPage, setCurrentPage] = useState<PageView>("home");
  const [showCart, setShowCart] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  const handleAddToCart = useCallback(
    (product: Product) => {
      cart.addItem(product);
      compactToast.addToCart(product.name);
    },
    [cart],
  );

  const handleQuickView = useCallback((product: Product) => {
    setSelectedProduct(product);
  }, []);

  const handleCheckout = () => {
    setShowCart(false);
    setShowCheckout(true);
  };

  const handleCategoryClick = useCallback((category: string) => {
    setSelectedCategory(category);
    setCurrentPage("catalog");
    // Scroll to top
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const handleShopNow = useCallback(() => {
    setCurrentPage("catalog");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const navigateToHome = useCallback(() => {
    setCurrentPage("home");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const navigateToOrders = useCallback(() => {
    setCurrentPage("orders");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const navigateToDashboard = useCallback(() => {
    setCurrentPage("dashboard");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  // Get filtered products based on selected category
  const filteredProducts =
    selectedCategory === "all"
      ? products
      : products.filter((p) => p.category === selectedCategory);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <SEO
        title={
          currentPage === "home"
            ? "Horumar - Your Business, Your Progress"
            : currentPage === "catalog"
              ? "Shop All Products - Horumar"
              : currentPage === "orders"
                ? "Track Your Order - Horumar"
                : "My Dashboard - Horumar"
        }
        description="Premium educational materials, stationery, and electronics in Eastleigh, Nairobi. Quality products for students and professionals. Shop online with fast delivery."
        keywords="Horumar, bookstore, Kenya, Nairobi, Eastleigh, textbooks, stationery, electronics, school supplies, online shopping"
      />

      {/* Navigation */}
      <StorefrontNavbar
        onCartClick={() => setShowCart(true)}
        onLoginClick={() => setShowAuth(true)}
        onLogoClick={navigateToHome}
        onTrackOrderClick={navigateToOrders}
        onDashboardClick={navigateToDashboard}
      />

      {/* Main Content */}
      <main>
        {currentPage === "home" && (
          <>
            <Hero onShopNow={handleShopNow} onTrackOrder={navigateToOrders} />
            <CategoryGrid onCategoryClick={handleCategoryClick} />
            <FeaturedProducts
              products={products}
              onAddToCart={handleAddToCart}
              onQuickView={handleQuickView}
              onViewAll={handleShopNow}
              isLoading={isLoading}
            />
          </>
        )}

        {currentPage === "catalog" && (
          <ProductCatalog
            products={filteredProducts}
            onAddToCart={handleAddToCart}
            onQuickView={handleQuickView}
            isLoading={isLoading}
          />
        )}

        {currentPage === "orders" && <OrderTracking />}

        {currentPage === "dashboard" && <CustomerDashboard />}
      </main>

      {/* Footer */}
      <StorefrontFooter />

      {/* Modals & Sidebars */}
      <CartSidebar
        isOpen={showCart}
        onClose={() => setShowCart(false)}
        onCheckout={handleCheckout}
      />

      <AuthModal isOpen={showAuth} onClose={() => setShowAuth(false)} />

      <CheckoutModal isOpen={showCheckout} onClose={() => setShowCheckout(false)} />

      {selectedProduct && (
        <ProductQuickView
          product={selectedProduct}
          isOpen={!!selectedProduct}
          onClose={() => setSelectedProduct(null)}
          onAddToCart={handleAddToCart}
        />
      )}

      {/* Toast Notifications */}
      <ToastContainer
        position="bottom-right"
        autoClose={2000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss={false}
        draggable
        pauseOnHover
        theme="light"
        toastClassName="!bg-white dark:!bg-slate-800 !rounded-xl !shadow-2xl"
      />
    </div>
  );
}
