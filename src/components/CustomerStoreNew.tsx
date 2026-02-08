import { useEffect, useState, useCallback, useMemo, memo } from "react";
import {
  Filter,
  Star,
  Package,
  ShoppingCart,
  Heart,
  Search,
  ChevronDown,
  X,
} from "lucide-react";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { supabase } from "../lib/supabase";
import { useCart } from "../contexts/CartContext";
import { useAuth } from "../contexts/AuthContext";
import { ProductSkeleton } from "./LoadingSkeletons";
import { useDebounceValue } from "../hooks/usePerformance";
import Navbar from "./Navbar";
import HeroSection from "./HeroSectionNew";
import CartSidebar from "./CartSidebar";
import AuthModal from "./AuthModal";
import ProductQuickView from "./ProductQuickView";
import CheckoutModal from "./CheckoutModal";
import OptimizedImage from "./OptimizedImage";
import compactToast from "../utils/compactToast";
import type { Product } from "../types";
import type { Database } from "../lib/database.types";

type Order = Database["public"]["Tables"]["orders"]["Row"];

interface CustomerStoreProps {
  onCheckout?: () => void;
  onAdminClick?: () => void;
}

const ProductCard = memo(
  ({
    product,
    onAddToCart,
    onQuickView,
    index = 0,
  }: {
    product: Product;
    onAddToCart: (product: Product) => void;
    onQuickView?: (product: Product) => void;
    index?: number;
  }) => {
    const [isLiked, setIsLiked] = useState(false);
    const [isAddingToCart, setIsAddingToCart] = useState(false);

    const handleAddToCart = useCallback(async () => {
      setIsAddingToCart(true);
      await new Promise((resolve) => setTimeout(resolve, 300));
      onAddToCart(product);
      setIsAddingToCart(false);
    }, [product, onAddToCart]);

    const toggleLike = useCallback(() => {
      setIsLiked((prev) => !prev);
      if (!isLiked) {
        compactToast.addToWishlist();
      }
    }, [isLiked]);

    const handleQuickView = useCallback(() => {
      onQuickView?.(product);
    }, [onQuickView, product]);

    const isOutOfStock = product.quantity_in_stock === 0;
    const isLowStock = product.quantity_in_stock <= product.reorder_level;

    return (
      <div
        data-product-id={product.id}
        className="bg-white dark:bg-slate-800 rounded-lg sm:rounded-xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden group border border-slate-200 dark:border-slate-700 hover:border-amber-400 dark:hover:border-amber-500 flex flex-col h-full"
      >
        {/* Product Image Container */}
        <div
          className="relative overflow-hidden cursor-pointer bg-slate-50 dark:bg-slate-700 aspect-square"
          onClick={handleQuickView}
        >
          <OptimizedImage
            src={product.image_url}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
            fallbackClassName="w-full h-full"
            onClick={handleQuickView}
            priority={index < 3}
            preload={index < 6}
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          />

          {/* Overlay on Hover */}
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleQuickView();
              }}
              className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white px-4 py-2 rounded-full font-semibold text-sm sm:text-base transform scale-75 sm:scale-100 group-hover:scale-100 transition-transform duration-300 shadow-lg hover:bg-amber-400"
            >
              Quick View
            </button>
          </div>

          {/* Wishlist Button */}
          <button
            onClick={toggleLike}
            className={`absolute top-2 right-2 sm:top-3 sm:right-3 w-8 h-8 sm:w-10 sm:h-10 rounded-full transition-all duration-300 flex items-center justify-center shadow-md ${
              isLiked
                ? "bg-rose-500 text-white"
                : "bg-white/90 dark:bg-slate-800/90 text-slate-600 dark:text-slate-300 hover:bg-amber-400 hover:text-white"
            }`}
          >
            <Heart
              className={`w-4 h-4 sm:w-5 sm:h-5 ${
                isLiked ? "fill-current" : ""
              }`}
            />
          </button>

          {/* Featured Badge */}
          {product.featured && (
            <div className="absolute top-2 left-2 sm:top-3 sm:left-3 bg-amber-500 text-white px-2 py-1 rounded-full text-xs font-bold flex items-center space-x-1 shadow-md">
              <Star className="w-3 h-3 fill-current" />
              <span>Featured</span>
            </div>
          )}

          {/* Low Stock Badge */}
          {isLowStock && !isOutOfStock && (
            <div className="absolute bottom-2 left-2 sm:bottom-3 sm:left-3 bg-rose-500 text-white px-2 py-1 rounded-full text-xs font-bold shadow-md">
              Only {product.quantity_in_stock} left
            </div>
          )}

          {/* Out of Stock Overlay */}
          {isOutOfStock && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <span className="bg-red-600 text-white px-4 py-2 rounded-full font-bold text-sm">
                Out of Stock
              </span>
            </div>
          )}
        </div>

        {/* Product Info - Flex grow to push button to bottom */}
        <div className="p-3 sm:p-4 flex flex-col flex-grow">
          {/* Category */}
          <div className="mb-2">
            <span className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
              {product.category}
            </span>
          </div>

          {/* Product Name */}
          <h3 className="font-bold text-slate-900 dark:text-white text-xs sm:text-base mb-1 line-clamp-2 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
            {product.name}
          </h3>

          {/* Price */}
          <div className="mb-2 mt-auto pt-2">
            <p className="text-base sm:text-xl font-bold text-amber-600 dark:text-amber-400">
              KES {product.selling_price.toLocaleString()}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              In stock: {product.quantity_in_stock}
            </p>
          </div>

          {/* Add to Cart Button */}
          <button
            onClick={handleAddToCart}
            disabled={isOutOfStock || isAddingToCart}
            className={`w-full py-2.5 px-3 rounded-lg font-bold text-sm transition-all duration-300 flex items-center justify-center gap-2 ${
              isOutOfStock
                ? "bg-slate-200 text-slate-500 cursor-not-allowed dark:bg-slate-700 dark:text-slate-400"
                : isAddingToCart
                ? "bg-green-500 text-white animate-pulse"
                : "bg-gradient-to-r from-amber-500 to-amber-600 text-white hover:from-amber-600 hover:to-amber-700 active:scale-95 shadow-md hover:shadow-lg"
            }`}
          >
            <ShoppingCart className="w-4 h-4" />
            <span className="hidden sm:inline">
              {isOutOfStock
                ? "Unavailable"
                : isAddingToCart
                ? "Adding..."
                : "Add"}
            </span>
          </button>
        </div>
      </div>
    );
  },
);

ProductCard.displayName = "ProductCard";

// Mobile Filter Drawer Component
const FilterDrawer = memo(
  ({
    isOpen,
    categories,
    selectedCategory,
    onCategoryChange,
    onClose,
  }: {
    isOpen: boolean;
    categories: string[];
    selectedCategory: string;
    onCategoryChange: (category: string) => void;
    onClose: () => void;
  }) => {
    return (
      <>
        {/* Backdrop */}
        {isOpen && (
          <div
            className="fixed inset-0 bg-black/40 z-30 sm:hidden"
            onClick={onClose}
          />
        )}

        {/* Drawer */}
        <div
          className={`fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-800 rounded-t-3xl shadow-2xl z-40 sm:hidden transition-all duration-300 ${
            isOpen ? "translate-y-0" : "translate-y-full"
          }`}
        >
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                Filter by Category
              </h3>
              <button
                onClick={onClose}
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 max-h-96 overflow-y-auto">
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => {
                    onCategoryChange(category);
                    onClose();
                  }}
                  className={`px-4 py-3 rounded-lg font-semibold transition-all duration-200 ${
                    selectedCategory === category
                      ? "bg-amber-500 text-white shadow-md scale-105"
                      : "bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white hover:bg-amber-100 dark:hover:bg-slate-600"
                  }`}
                >
                  {category === "all" ? "All Products" : category}
                </button>
              ))}
            </div>
          </div>
        </div>
      </>
    );
  },
);

FilterDrawer.displayName = "FilterDrawer";

export default function CustomerStore({
  onCheckout,
  onAdminClick,
}: CustomerStoreProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [showCart, setShowCart] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(
    null,
  );
  const [showFilterDrawer, setShowFilterDrawer] = useState(false);

  const PRODUCTS_PER_PAGE = 12;
  const debouncedSearchTerm = useDebounceValue(searchTerm, 300);

  const cart = useCart();
  const { user } = useAuth();

  const categories = useMemo(
    () => [
      "all",
      "Books",
      "Backpacks",
      "Bottles",
      "Electronics",
      "Pens",
      "Notebooks",
      "Pencils",
      "Shapeners",
      "Markers",
      "Other",
    ],
    [],
  );

  const loadProducts = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("published", true)
        .gt("quantity_in_stock", 0)
        .order("featured", { ascending: false })
        .order("name");

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error("Error loading products:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  const filteredProducts = useMemo(() => {
    let filtered = products;

    if (debouncedSearchTerm) {
      filtered = filtered.filter(
        (product) =>
          product.name
            .toLowerCase()
            .includes(debouncedSearchTerm.toLowerCase()) ||
          product.category
            .toLowerCase()
            .includes(debouncedSearchTerm.toLowerCase()),
      );
    }

    if (selectedCategory !== "all") {
      filtered = filtered.filter(
        (product) => product.category === selectedCategory,
      );
    }

    return filtered;
  }, [products, debouncedSearchTerm, selectedCategory]);

  const paginatedProducts = useMemo(() => {
    const startIndex = (currentPage - 1) * PRODUCTS_PER_PAGE;
    const endIndex = startIndex + PRODUCTS_PER_PAGE;
    return filteredProducts.slice(startIndex, endIndex);
  }, [filteredProducts, currentPage]);

  const totalPages = Math.ceil(filteredProducts.length / PRODUCTS_PER_PAGE);

  const handleAddToCart = useCallback(
    (product: Product) => {
      cart.addItem(product);
      compactToast.addToCart(product.name);
    },
    [cart],
  );

  const handleSearchChange = useCallback((value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  }, []);

  const handleCategoryChange = useCallback((category: string) => {
    setSelectedCategory(category);
    setCurrentPage(1);
    setShowFilterDrawer(false);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <ProductSkeleton count={12} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-950">
      {/* Navbar */}
      <Navbar
        searchTerm={searchTerm}
        onSearchChange={handleSearchChange}
        onCartClick={() => setShowCart(true)}
        onAuthClick={() => setShowAuth(true)}
        onAdminClick={user ? onAdminClick : undefined}
        products={products}
        onProductSelect={() => {}}
      />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Header Section */}
        <div className="mb-8 sm:mb-10">
          <div className="flex flex-col gap-4 mb-6">
            <div>
              <h1 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white mb-2">
                Shop Our Collection
              </h1>
              <p className="text-slate-600 dark:text-slate-400 text-sm sm:text-base">
                Premium books, stationery & electronics at unbeatable prices
              </p>
            </div>
          </div>

          {/* Desktop Category Filter - Horizontal Scroll */}
          <div className="hidden sm:block overflow-x-auto pb-2 scrollbar-hide">
            <div className="flex gap-2 min-w-min">
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => handleCategoryChange(category)}
                  className={`px-4 py-2 rounded-full font-semibold text-sm whitespace-nowrap transition-all duration-300 ${
                    selectedCategory === category
                      ? "bg-amber-500 text-white shadow-lg shadow-amber-500/25"
                      : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700"
                  }`}
                >
                  {category === "all" ? "All" : category}
                </button>
              ))}
            </div>
          </div>

          {/* Mobile Filter Button */}
          <div className="sm:hidden flex gap-2">
            <button
              onClick={() => setShowFilterDrawer(true)}
              className="flex-1 flex items-center justify-center gap-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg py-3 font-semibold text-slate-900 dark:text-white hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
            >
              <Filter className="w-4 h-4" />
              Filter
              {selectedCategory !== "all" && (
                <span className="ml-auto bg-amber-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  1
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Products Grid - Mobile First: 3 columns */}
        {filteredProducts.length === 0 ? (
          <div className="text-center py-16">
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 sm:p-12 max-w-md mx-auto border border-slate-200 dark:border-slate-700">
              <Package className="w-16 h-16 text-slate-400 mx-auto mb-4" />
              <h3 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mb-2">
                No products found
              </h3>
              <p className="text-slate-600 dark:text-slate-400 mb-6 text-sm sm:text-base">
                Try adjusting your filters or search terms
              </p>
              <button
                onClick={() => {
                  setSearchTerm("");
                  handleCategoryChange("all");
                }}
                className="bg-amber-500 hover:bg-amber-600 text-white px-6 py-2.5 rounded-lg font-semibold transition-colors"
              >
                Clear Filters
              </button>
            </div>
          </div>
        ) : (
          <div>
            {/* Grid: 2 columns on mobile, 3 on tablet, 4 on desktop */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-4 mb-8">
              {paginatedProducts.map((product, index) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onAddToCart={handleAddToCart}
                  onQuickView={(p) => setQuickViewProduct(p)}
                  index={index}
                />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex flex-col sm:flex-row justify-center items-center gap-4 mt-12">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="px-4 py-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-semibold text-slate-900 dark:text-white hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Previous
                </button>

                <span className="text-slate-700 dark:text-slate-300 font-semibold text-sm sm:text-base">
                  Page {currentPage} of {totalPages}
                </span>

                <button
                  onClick={() =>
                    setCurrentPage(Math.min(totalPages, currentPage + 1))
                  }
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-semibold text-slate-900 dark:text-white hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Next
                </button>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Hero Section */}
      <HeroSection
        onShopNowClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        onAddToCart={handleAddToCart}
        onQuickView={(p) => setQuickViewProduct(p)}
      />

      {/* Footer */}
      <footer className="bg-slate-900 dark:bg-slate-950 text-white py-12 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
            <div>
              <h3 className="text-lg sm:text-xl font-bold mb-3">
                HASSAN BOOKSHOP
              </h3>
              <p className="text-slate-400 text-sm">
                Your trusted partner for books, stationery, and more.
              </p>
            </div>

            <div>
              <h4 className="font-semibold mb-4 text-slate-200">Contact</h4>
              <div className="space-y-2 text-slate-400 text-sm">
                <p>
                  <a
                    href="tel:+254722979547"
                    className="hover:text-amber-400 transition-colors"
                  >
                    +254 722 979 547
                  </a>
                </p>
                <p>
                  <a
                    href="mailto:yussufh080@gmail.com"
                    className="hover:text-amber-400 transition-colors"
                  >
                    yussufh080@gmail.com
                  </a>
                </p>
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-4 text-slate-200">Location</h4>
              <p className="text-slate-400 text-sm">Nairobi, Kenya</p>
            </div>

            <div>
              <h4 className="font-semibold mb-4 text-slate-200">Powered by</h4>
              <a
                href="https://lenzro.com"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block px-3 py-1.5 bg-amber-500/20 border border-amber-500/50 rounded-lg text-amber-400 hover:text-amber-300 text-sm font-semibold transition-colors"
              >
                ⚡ Lenzro
              </a>
            </div>
          </div>

          <div className="border-t border-slate-800 pt-6 text-center text-slate-400 text-sm">
            <p>
              &copy; {new Date().getFullYear()} HASSAN BOOKSHOP. All rights
              reserved.
            </p>
          </div>
        </div>
      </footer>

      {/* Modals & Sidebars */}
      <CartSidebar
        isOpen={showCart}
        onClose={() => setShowCart(false)}
        onCheckout={() => {
          setShowCart(false);
          setShowCheckout(true);
        }}
      />

      <AuthModal isOpen={showAuth} onClose={() => setShowAuth(false)} />

      <CheckoutModal
        isOpen={showCheckout}
        onClose={() => setShowCheckout(false)}
        onOrderComplete={(order) => {
          compactToast.orderSuccess(order.order_number);
          onCheckout?.();
        }}
      />

      <ProductQuickView
        product={quickViewProduct}
        isOpen={!!quickViewProduct}
        onClose={() => setQuickViewProduct(null)}
        onAddToCart={handleAddToCart}
      />

      {/* Filter Drawer - Mobile Only */}
      <FilterDrawer
        isOpen={showFilterDrawer}
        categories={categories}
        selectedCategory={selectedCategory}
        onCategoryChange={handleCategoryChange}
        onClose={() => setShowFilterDrawer(false)}
      />

      {/* Toast */}
      <ToastContainer
        position="bottom-right"
        autoClose={2500}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss={false}
        draggable
        pauseOnHover
        theme="light"
        className="!z-50"
        toastClassName="!rounded-lg !shadow-lg !min-h-12 !text-sm !p-2"
        progressClassName="!bg-amber-500"
      />
    </div>
  );
}
