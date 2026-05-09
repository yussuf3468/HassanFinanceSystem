import { useEffect, useState, useCallback, useMemo, memo } from "react";
import {
  Filter,
  Star,
  Package,
  ShoppingCart,
  Heart,
  X,
  Zap,
  TrendingUp,
  Sparkles,
} from "lucide-react";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { getPublishedProductsInStock } from "../api";
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

/** Converts whole-number prices to the .99 psychological pricing format (500 → 499.99) */
const formatPrice = (p: number): string => {
  const adjusted = Number.isInteger(p) ? p - 0.01 : p;
  const [whole, dec] = adjusted.toFixed(2).split(".");
  return `${Number(whole).toLocaleString()}.${dec}`;
};

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
    const [justAdded, setJustAdded] = useState(false);

    const starRating = useMemo(() => {
      const hash = (product.id ?? "").split("").reduce((a, c) => a + c.charCodeAt(0), 0);
      return 4 + (hash % 10 < 7 ? 1 : 0);
    }, [product.id]);

    const handleAddToCart = useCallback(async () => {
      setIsAddingToCart(true);
      await new Promise((r) => setTimeout(r, 280));
      onAddToCart(product);
      setIsAddingToCart(false);
      setJustAdded(true);
      setTimeout(() => setJustAdded(false), 1800);
    }, [product, onAddToCart]);

    const toggleLike = useCallback(
      (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsLiked((prev) => !prev);
        if (!isLiked) compactToast.addToWishlist();
      },
      [isLiked],
    );

    const handleQuickView = useCallback(() => {
      onQuickView?.(product);
    }, [onQuickView, product]);

    const isOutOfStock = product.quantity_in_stock === 0;
    const isLowStock =
      !isOutOfStock && product.quantity_in_stock <= product.reorder_level;
    const isTrending = index < 4 && product.featured;

    return (
      <div
        data-product-id={product.id}
        className="group relative bg-white dark:bg-slate-800/90 rounded-2xl overflow-hidden flex flex-col h-full transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[0_20px_60px_-10px_rgba(245,158,11,0.25)] shadow-sm border border-slate-100 dark:border-slate-700/60"
      >
        {/* ── Image container ── */}
        <div
          className="relative overflow-hidden cursor-pointer bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-700 dark:to-slate-800"
          style={{ aspectRatio: "1 / 1" }}
          onClick={handleQuickView}
        >
          <OptimizedImage
            src={product.image_url}
            alt={product.name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            fallbackClassName="w-full h-full"
            priority={index < 3}
            preload={index < 6}
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          />

          {/* Gradient overlay on hover */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

          {/* Quick View pill — slides up from bottom */}
          <div className="absolute bottom-0 left-0 right-0 flex justify-center pb-3 translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300 z-10">
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleQuickView();
              }}
              className="bg-white/95 backdrop-blur-sm text-slate-900 px-4 py-2 rounded-full font-bold text-xs shadow-xl hover:bg-amber-400 hover:text-white transition-colors duration-200 flex items-center gap-1.5 border border-white/50"
            >
              <Sparkles className="w-3 h-3" />
              Quick View
            </button>
          </div>

          {/* Wishlist heart — top right */}
          <button
            onClick={toggleLike}
            className={`absolute top-2 right-2 z-20 w-8 h-8 rounded-full flex items-center justify-center shadow-lg transition-all duration-200 ${
              isLiked
                ? "bg-rose-500 text-white scale-110"
                : "bg-white/90 dark:bg-slate-900/80 text-slate-400 hover:bg-rose-500 hover:text-white hover:scale-110"
            }`}
          >
            <Heart className={`w-3.5 h-3.5 ${isLiked ? "fill-current" : ""}`} />
          </button>

          {/* Badges — top left stack */}
          <div className="absolute top-2 left-2 z-20 flex flex-col gap-1">
            {product.featured && (
              <span className="bg-gradient-to-r from-amber-500 to-orange-500 text-white px-2 py-0.5 rounded-full text-[10px] font-black tracking-wide shadow-md">
                ★ TOP PICK
              </span>
            )}
            {isTrending && (
              <span className="bg-gradient-to-r from-violet-600 to-pink-500 text-white px-2 py-0.5 rounded-full text-[10px] font-black shadow-md flex items-center gap-1">
                <TrendingUp className="w-2.5 h-2.5" />
                HOT
              </span>
            )}
            {isLowStock && (
              <span className="bg-rose-600 text-white px-2 py-0.5 rounded-full text-[10px] font-black shadow-md">
                {product.quantity_in_stock} left!
              </span>
            )}
          </div>

          {/* Out of stock veil */}
          {isOutOfStock && (
            <div className="absolute inset-0 bg-black/60 backdrop-blur-[1px] flex items-center justify-center z-10">
              <span className="bg-white/10 border border-white/30 text-white px-4 py-1.5 rounded-full font-bold text-sm backdrop-blur-sm">
                Out of Stock
              </span>
            </div>
          )}
        </div>

        {/* ── Content ── */}
        <div className="flex flex-col flex-grow p-3 sm:p-4">
          {/* Category + stars row */}
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] font-black text-amber-600 dark:text-amber-400 uppercase tracking-widest">
              {product.category}
            </span>
            <div className="flex gap-px">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`w-2.5 h-2.5 ${
                    i < starRating
                      ? "text-amber-400 fill-amber-400"
                      : "text-slate-200 dark:text-slate-600"
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Product name */}
          <h3 className="font-bold text-slate-800 dark:text-slate-100 text-xs sm:text-sm leading-snug line-clamp-2 mb-3 group-hover:text-amber-600 dark:group-hover:text-amber-300 transition-colors">
            {product.name}
          </h3>

          {/* Price block */}
          <div className="mt-auto mb-3">
            <div className="flex items-end justify-between">
              <div>
                <div className="flex items-center gap-1.5 mb-0.5">
                  <span className="text-[10px] text-slate-400 line-through font-medium tabular-nums">
                    KES {formatPrice(Math.ceil(product.selling_price * 1.18))}
                  </span>
                  <span className="text-[9px] font-black bg-rose-500 text-white px-1.5 py-0.5 rounded-full uppercase tracking-wide">
                    SALE
                  </span>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-[10px] text-amber-600/70 dark:text-amber-500/70 font-bold">
                    KES
                  </span>
                  <span className="text-lg sm:text-xl font-black text-amber-600 dark:text-amber-400 leading-none tabular-nums">
                    {formatPrice(product.selling_price)}
                  </span>
                </div>
              </div>
              {!isOutOfStock && (
                <span className="text-[10px] text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded-full font-medium">
                  {product.quantity_in_stock} left
                </span>
              )}
            </div>
          </div>

          {/* Add to Cart CTA */}
          <button
            onClick={handleAddToCart}
            disabled={isOutOfStock || isAddingToCart}
            className={`w-full py-2.5 rounded-xl font-bold text-sm transition-all duration-250 flex items-center justify-center gap-2 select-none ${
              isOutOfStock
                ? "bg-slate-100 dark:bg-slate-700 text-slate-400 cursor-not-allowed"
                : justAdded
                ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/30 scale-[0.98]"
                : isAddingToCart
                ? "bg-amber-400 text-white scale-[0.97]"
                : "bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:from-amber-600 hover:to-orange-600 hover:shadow-lg hover:shadow-amber-500/30 active:scale-[0.97]"
            }`}
          >
            {justAdded ? (
              <>
                <span className="text-base">✓</span>
                <span>Added to Cart</span>
              </>
            ) : isAddingToCart ? (
              <>
                <ShoppingCart className="w-4 h-4 animate-bounce" />
                <span>Adding…</span>
              </>
            ) : isOutOfStock ? (
              <span>Not Available</span>
            ) : (
              <>
                <ShoppingCart className="w-4 h-4" />
                <span>Add to Cart</span>
              </>
            )}
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
          <div className="fixed inset-0 bg-black/40 z-30 sm:hidden" onClick={onClose} />
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

export default function CustomerStore({ onCheckout, onAdminClick }: CustomerStoreProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [showCart, setShowCart] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);
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
      const data = await getPublishedProductsInStock();
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
          product.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
          product.category.toLowerCase().includes(debouncedSearchTerm.toLowerCase()),
      );
    }

    if (selectedCategory !== "all") {
      filtered = filtered.filter((product) => product.category === selectedCategory);
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
        {/* ── Flash Deals Banner ── */}
        <div className="mb-8 relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border border-amber-500/20 shadow-xl">
          <div
            className="absolute inset-0 opacity-10"
            style={{
              backgroundImage: "radial-gradient(circle,#f59e0b 1px,transparent 1px)",
              backgroundSize: "30px 30px",
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-amber-500/10 via-transparent to-orange-500/10 pointer-events-none" />
          <div className="relative flex flex-col sm:flex-row items-center justify-between gap-4 p-4 sm:p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center flex-shrink-0 shadow-lg shadow-amber-500/30">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-white font-black text-base leading-tight">
                  🔥 Flash Deals Active
                </p>
                <p className="text-amber-400/80 text-xs font-somali">
                  Qiimaha gaar ah maanta — Today's Special Prices
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 flex-wrap justify-center sm:justify-end">
              <span className="bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-bold px-3 py-1.5 rounded-full">
                Free delivery on KES 2,000+
              </span>
              <button
                onClick={() =>
                  document
                    .getElementById("products-grid")
                    ?.scrollIntoView({ behavior: "smooth" })
                }
                className="bg-gradient-to-r from-amber-500 to-orange-500 text-white text-sm font-bold px-5 py-2 rounded-xl hover:from-amber-600 hover:to-orange-600 transition-all shadow-lg shadow-amber-500/25 hover:scale-105 active:scale-95 flex items-center gap-2 whitespace-nowrap"
              >
                <Sparkles className="w-3.5 h-3.5" />
                Explore Now
              </button>
            </div>
          </div>
        </div>

        {/* ── Section Header ── */}
        <div className="mb-8 sm:mb-10">
          <div className="flex flex-col gap-4 mb-6">
            <div>
              <p className="text-amber-600 dark:text-amber-400 font-bold text-xs tracking-widest uppercase mb-1">
                ✦ Our Collection
              </p>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
                Shop Our Products
              </h2>
              <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
                Premium books, stationery &amp; electronics at unbeatable prices
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
            <div className="flex items-center justify-between mb-5">
              <p className="text-slate-600 dark:text-slate-400 text-sm">
                <span className="font-bold text-slate-900 dark:text-white">
                  {filteredProducts.length}
                </span>{" "}
                products found
                {selectedCategory !== "all" && (
                  <span className="text-amber-600 dark:text-amber-400 ml-1">
                    in {selectedCategory}
                  </span>
                )}
              </p>
              <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                <TrendingUp className="w-3.5 h-3.5 text-amber-500" />
                <span>Featured first</span>
              </div>
            </div>
            <div
              id="products-grid"
              className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-4 mb-8"
            >
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
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
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
      <footer className="bg-slate-900 dark:bg-slate-950 text-white mt-16">
        {/* Newsletter/CTA strip */}
        <div className="bg-gradient-to-r from-amber-600 to-orange-600">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex flex-col sm:flex-row items-center justify-between gap-6">
            <div>
              <h3 className="text-white font-black text-xl sm:text-2xl">
                Ready to shop?
              </h3>
              <p className="text-amber-100 text-sm mt-1">
                Visit us in-store or call to place your order today
              </p>
            </div>
            <a
              href="tel:+254722979547"
              className="flex-shrink-0 bg-white text-amber-700 font-black px-8 py-3 rounded-2xl hover:bg-amber-50 transition-colors shadow-xl text-base"
            >
              📞 Call Now: +254 722 979 547
            </a>
          </div>
        </div>

        <div className="py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
              <div>
                <h3 className="text-lg font-black mb-3 text-amber-400">
                  HASSAN BOOKSHOP
                </h3>
                <p className="text-slate-400 text-sm leading-relaxed">
                  Your trusted partner for books, stationery, electronics and more.
                  Serving students across Nairobi since 2010.
                </p>
                <p className="text-slate-500 text-xs font-somali mt-2">
                  Dukaanka Buugaagta ee la isku halleeyo
                </p>
              </div>

              <div>
                <h4 className="font-bold mb-4 text-slate-200">Contact Us</h4>
                <div className="space-y-2 text-slate-400 text-sm">
                  <p>
                    <a
                      href="tel:+254722979547"
                      className="hover:text-amber-400 transition-colors"
                    >
                      📞 +254 722 979 547
                    </a>
                  </p>
                  <p>
                    <a
                      href="mailto:yussufh080@gmail.com"
                      className="hover:text-amber-400 transition-colors"
                    >
                      ✉️ yussufh080@gmail.com
                    </a>
                  </p>
                </div>
              </div>

              <div>
                <h4 className="font-bold mb-4 text-slate-200">Location</h4>
                <p className="text-slate-400 text-sm leading-relaxed">
                  📍 Global Apartments, Eastleigh Section 1,
                  <br />
                  Nairobi
                </p>
                <p className="text-slate-500 text-xs font-somali mt-2">
                  Sharq Lee, Nairobi
                </p>
              </div>

              <div>
                <h4 className="font-bold mb-4 text-slate-200">Hours</h4>
                <div className="text-slate-400 text-sm space-y-1">
                  <p>Mon–Sat: 8:00 AM – 8:00 PM</p>
                  <p>Sunday: 9:00 AM – 6:00 PM</p>
                </div>
                <div className="mt-3">
                  <h4 className="font-bold mb-2 text-slate-200 text-sm">Powered by</h4>
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
            </div>

            <div className="border-t border-slate-800 pt-6 text-center text-slate-500 text-sm">
              <p>
                &copy; {new Date().getFullYear()} HASSAN BOOKSHOP. All rights reserved.
              </p>
            </div>
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
