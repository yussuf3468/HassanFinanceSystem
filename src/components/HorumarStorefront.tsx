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
import ProductDetailsPage from "./ecommerce/ProductDetailsPage";
import OrderTrackingModal from "./OrderTrackingModal";
import CustomerDashboard from "./ecommerce/CustomerDashboard";
import StorefrontFooter from "./ecommerce/StorefrontFooter";
import CartSidebar from "./CartSidebar";
import AuthModal from "./AuthModal";
import CheckoutModal from "./CheckoutModal";
import compactToast from "../utils/compactToast";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

type PageView = "home" | "catalog" | "dashboard" | "product";

interface HorumarStorefrontProps {
  onAdminClick?: () => void;
}

export default function HorumarStorefront({ onAdminClick }: HorumarStorefrontProps) {
  const { data: products = [], isLoading } = usePublicProducts();
  const cart = useCart();

  const [currentPage, setCurrentPage] = useState<PageView>("home");
  const [catalogFiltersOpen, setCatalogFiltersOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [showCart, setShowCart] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [showOrderTracking, setShowOrderTracking] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  const handleAddToCart = useCallback(
    (product: Product) => {
      cart.addItem(product);
      compactToast.addToCart(product.name);
    },
    [cart],
  );

  const handleProductSelect = useCallback((product: Product) => {
    setSelectedProduct(product);
    setCurrentPage("product");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const handleCheckout = () => {
    setShowCart(false);
    setShowCheckout(true);
  };

  const handleCategoryClick = useCallback((category: string) => {
    setSelectedCategory(category);
    setSearchTerm("");
    setCurrentPage("catalog");
    // Scroll to top
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const handleShopNow = useCallback(() => {
    setCurrentPage("catalog");
    setSelectedCategory("all");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const navigateToHome = useCallback(() => {
    setCurrentPage("home");
    setSelectedCategory("all");
    setSearchTerm("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const openOrderTracking = useCallback(() => {
    setShowOrderTracking(true);
  }, []);

  const navigateToDashboard = useCallback(() => {
    setCurrentPage("dashboard");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const handleSearchSubmit = useCallback((query: string, category: string) => {
    setSearchTerm(query);
    setSelectedCategory(category);
    setCurrentPage("catalog");
    setCatalogFiltersOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const handleSearchChange = useCallback((value: string) => {
    setSearchTerm(value);
  }, []);

  const handleSearchCategoryChange = useCallback((category: string) => {
    setSelectedCategory(category);
  }, []);

  const relatedProducts = selectedProduct
    ? products.filter(
        (product) =>
          product.id !== selectedProduct.id &&
          (product.category === selectedProduct.category || product.featured),
      )
    : [];

  const heroProducts = products
    .filter((product) => product.quantity_in_stock > 0)
    .sort((a, b) => {
      const aScore = (a.featured ? 1000 : 0) + a.quantity_in_stock;
      const bScore = (b.featured ? 1000 : 0) + b.quantity_in_stock;
      return bScore - aScore;
    })
    .slice(0, 3);

  const seoTitle =
    currentPage === "home"
      ? "Horumar - Your Business, Your Progress"
      : currentPage === "catalog"
        ? searchTerm.trim()
          ? `Search results for ${searchTerm} - Horumar`
          : "Shop All Products - Horumar"
        : currentPage === "product" && selectedProduct
          ? `${selectedProduct.name} - Horumar`
          : "My Dashboard - Horumar";

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <SEO
        title={seoTitle}
        description="Premium educational materials, stationery, and electronics in Eastleigh, Nairobi. Quality products for students and professionals. Shop online with fast delivery."
        keywords="Horumar, bookstore, Kenya, Nairobi, Eastleigh, textbooks, stationery, electronics, school supplies, online shopping"
      />

      {/* Navigation */}
      <StorefrontNavbar
        products={products}
        searchValue={searchTerm}
        selectedSearchCategory={selectedCategory}
        onCartClick={() => setShowCart(true)}
        onLoginClick={() => setShowAuth(true)}
        onLogoClick={navigateToHome}
        onTrackOrderClick={openOrderTracking}
        onDashboardClick={navigateToDashboard}
        onSearchChange={handleSearchChange}
        onSearchCategoryChange={handleSearchCategoryChange}
        onSearchSubmit={handleSearchSubmit}
        onProductSelect={handleProductSelect}
      />

      {/* Main Content */}
      <main>
        {currentPage === "home" && (
          <>
            <Hero
              featuredProducts={heroProducts}
              onShopNow={handleShopNow}
              onTrackOrder={openOrderTracking}
              onViewFeatured={handleProductSelect}
            />
            <CategoryGrid onCategoryClick={handleCategoryClick} />
            <FeaturedProducts
              products={products}
              onAddToCart={handleAddToCart}
              onProductSelect={handleProductSelect}
              onViewAll={handleShopNow}
              isLoading={isLoading}
            />
          </>
        )}

        {currentPage === "catalog" && (
          <ProductCatalog
            products={products}
            searchTerm={searchTerm}
            selectedCategory={selectedCategory}
            showFilters={catalogFiltersOpen}
            onSearchTermChange={setSearchTerm}
            onCategoryChange={setSelectedCategory}
            onToggleFilters={() => setCatalogFiltersOpen((current) => !current)}
            onAddToCart={handleAddToCart}
            onProductSelect={handleProductSelect}
            isLoading={isLoading}
          />
        )}

        {currentPage === "product" && selectedProduct && (
          <ProductDetailsPage
            product={selectedProduct}
            relatedProducts={relatedProducts}
            onBack={() => setCurrentPage("catalog")}
            onAddToCart={handleAddToCart}
            onProductSelect={handleProductSelect}
          />
        )}

        {currentPage === "dashboard" && (
          <CustomerDashboard onLoginClick={() => setShowAuth(true)} />
        )}
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

      <OrderTrackingModal
        isOpen={showOrderTracking}
        onClose={() => setShowOrderTracking(false)}
      />

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
