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

export default function HorumarStorefront({
  onAdminClick,
}: HorumarStorefrontProps) {
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

      <CheckoutModal
        isOpen={showCheckout}
        onClose={() => setShowCheckout(false)}
      />

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

      {/* Admin Button (Floating) */}
      {onAdminClick && (
        <button
          onClick={onAdminClick}
          className="fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-br from-slate-800 to-slate-900 text-white rounded-full shadow-2xl hover:shadow-3xl hover:scale-110 transition-all duration-300 flex items-center justify-center z-40 group"
          title="Admin Panel"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
          <span className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full animate-pulse" />
        </button>
      )}
    </div>
  );
}
