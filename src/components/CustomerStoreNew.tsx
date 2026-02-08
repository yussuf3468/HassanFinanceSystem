import { useEffect, useState, useCallback, useMemo, memo } from "react";
import {
  Filter,
  Star,
  Package,
  ShoppingCart,
  Heart,
  X,
  Grid,
  List,
  Eye,
  ChevronDown,
  Search,
  Truck,
  RotateCcw,
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

    return (
      <div
        data-product-id={product.id}
        className="flex flex-col h-full bg-white dark:bg-slate-800 rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden group border border-slate-200 dark:border-slate-700 hover:border-amber-300 dark:hover:border-amber-600"
      >
        {/* Product Image Container */}
        <div
          className="relative w-full aspect-square overflow-hidden bg-slate-50 dark:bg-slate-700 cursor-pointer"
          onClick={handleQuickView}
        >
          <OptimizedImage
            src={product.image_url}
            alt={product.name}
            className="w-full h-full object-contain p-2 sm:p-3 group-hover:scale-110 transition-transform duration-500"
            fallbackClassName="w-full h-full"
            onClick={handleQuickView}
            priority={index < 4}
            preload={index < 8}
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw"
          />

          {/* Badges */}
          <div className="absolute top-2 left-2 right-2 flex items-start justify-between gap-2">
            {product.featured && (
              <span className="flex items-center gap-1 bg-gradient-to-r from-amber-500 to-amber-600 text-white px-2 py-1 rounded-lg text-xs font-bold shadow-md">
                <Star className="w-3 h-3 fill-current" />
                <span className="hidden xs:inline">Featured</span>
              </span>
            )}
            {isOutOfStock && (
              <span className="ml-auto bg-rose-500 text-white px-2 py-1 rounded-lg text-xs font-bold shadow-md">
                Out of Stock
              </span>
            )}
            {!product.featured &&
              !isOutOfStock &&
              product.quantity_in_stock <= product.reorder_level && (
                <span className="bg-orange-500 text-white px-2 py-1 rounded-lg text-xs font-bold shadow-md">
                  Low Stock
                </span>
              )}
          </div>

          {/* Wishlist Button */}
          <button
            onClick={toggleLike}
            className={`absolute bottom-2 right-2 w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center transition-all duration-300 shadow-md ${
              isLiked
                ? "bg-rose-500 text-white"
                : "bg-white dark:bg-slate-600 text-slate-600 dark:text-slate-300 hover:bg-amber-50 dark:hover:bg-slate-500"
            }`}
          >
            <Heart className={`w-4 h-4 sm:w-5 sm:h-5 ${isLiked ? "fill-current" : ""}`} />
          </button>

          {/* Quick View Overlay */}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300 flex items-center justify-center">
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleQuickView();
              }}
              className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-white dark:bg-slate-800 text-slate-900 dark:text-white px-4 py-2 rounded-full font-semibold text-xs sm:text-sm shadow-lg hover:scale-105 transform"
            >
              Quick View
            </button>
          </div>
        </div>

        {/* Product Info */}
        <div className="flex flex-col flex-1 p-3 sm:p-4">
          {/* Category */}
          <span className="text-xs font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider mb-1">
            {product.category}
          </span>

          {/* Product Name */}
          <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white line-clamp-2 mb-1 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
            {product.name}
          </h3>

          {/* Description - hidden on mobile */}
          {product.description && (
            <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 mb-2 hidden sm:block">
              {product.description}
            </p>
          )}

          {/* Stock Info */}
          <div className="text-xs text-slate-600 dark:text-slate-400 mb-3 flex items-center gap-1">
            <Package className="w-3 h-3" />
            <span>{product.quantity_in_stock} in stock</span>
          </div>

          {/* Price & Button Container */}
          <div className="mt-auto space-y-2">
            {/* Price */}
            <div className="flex items-baseline gap-2">
              <p className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
                KES {product.selling_price.toLocaleString()}
              </p>
            </div>

            {/* Add to Cart Button */}
            <button
              onClick={handleAddToCart}
              disabled={isOutOfStock || isAddingToCart}
              className={`w-full py-2.5 px-3 rounded-xl font-semibold text-xs sm:text-sm transition-all duration-300 flex items-center justify-center gap-2 ${
                isOutOfStock
                  ? "bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 cursor-not-allowed"
                  : isAddingToCart
                  ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/30"
                  : "bg-gradient-to-r from-amber-500 to-amber-600 text-white hover:from-amber-600 hover:to-amber-700 shadow-md hover:shadow-lg hover:shadow-amber-500/30 active:scale-95"
              }`}
            >
              <ShoppingCart className={`w-4 h-4 ${isAddingToCart ? "animate-pulse" : ""}`} />
              <span>
                {isOutOfStock ? "Out of Stock" : isAddingToCart ? "Adding..." : "Add"}
              </span>
            </button>
          </div>
        </div>
      </div>
    );
  }
);

ProductCard.displayName = "ProductCard";

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
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [gridView, setGridView] = useState(true);

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
    []
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
          product.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
          product.category.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
      );
    }

    if (selectedCategory !== "all") {
      filtered = filtered.filter(
        (product) => product.category === selectedCategory
      );
    }

    return filtered;
  }, [products, debouncedSearchTerm, selectedCategory]);

  const paginatedProducts = useMemo(() => {
    const startIndex = (currentPage - 1) * PRODUCTS_PER_PAGE;
    const endIndex = startIndex + PRODUCTS_PER_PAGE;
    return filteredProducts.slice(startIndex, endIndex);
  }, [filteredProducts, currentPage, PRODUCTS_PER_PAGE]);

  const totalPages = Math.ceil(filteredProducts.length / PRODUCTS_PER_PAGE);

  const handleAddToCart = useCallback(
    (product: Product) => {
      cart.addItem(product);
      compactToast.addToCart(product.name);
    },
    [cart]
  );

  const handleSearchChange = useCallback((value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  }, []);

  const handleCategoryChange = useCallback((category: string) => {
    setSelectedCategory(category);
    setCurrentPage(1);
  }, []);

  const handleCartClick = useCallback(() => {
    setShowCart(true);
  }, []);

  const handleAuthClick = useCallback(() => {
    setShowAuth(true);
  }, []);

  const handleQuickViewMain = useCallback((product: Product) => {
    setQuickViewProduct(product);
  }, []);

  const handleCloseQuickView = useCallback(() => {
    setQuickViewProduct(null);
  }, []);

  const handleCheckoutClick = useCallback(() => {
    setShowCart(false);
    setShowCheckout(true);
  }, []);

  const handleCloseCheckout = useCallback(() => {
    setShowCheckout(false);
  }, []);

  const handleOrderComplete = useCallback(
    (order: Order) => {
      compactToast.orderSuccess(order.order_number);
      onCheckout?.();
    },
    [onCheckout]
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-slate-900">
        <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded-lg w-40"></div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 py-8">
          <ProductSkeleton count={8} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-slate-900">
      {/* Navbar */}
      <Navbar
        searchTerm={searchTerm}
        onSearchChange={handleSearchChange}
        onCartClick={handleCartClick}
        onAuthClick={handleAuthClick}
        onAdminClick={user ? onAdminClick : undefined}
        products={products}
        onProductSelect={handleQuickViewMain}
      />

      {/* Hero Section */}
      <HeroSection
        onShopNowClick={() => {
          const section = document.getElementById("products-section");
          section?.scrollIntoView({ behavior: "smooth" });
        }}
        onAddToCart={handleAddToCart}
        onQuickView={handleQuickViewMain}
      />

      {/* Products Section */}
      <section id="products-section" className="relative py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Section Header */}
          <div className="mb-6 sm:mb-8">
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white mb-2">
              Shop Our Collection
            </h2>
            <p className="text-slate-600 dark:text-slate-400 text-sm sm:text-base max-w-lg">
              Discover quality books, stationery, and electronics at unbeatable prices
            </p>
          </div>

          {/* Mobile Filter & View Toggle */}
          <div className="flex gap-2 mb-6 sm:hidden">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 px-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-semibold text-sm text-slate-900 dark:text-white hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
            >
              <Filter className="w-4 h-4" />
              Filters
            </button>
            <button
              onClick={() => setGridView(!gridView)}
              className="flex items-center justify-center py-2.5 px-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-semibold text-sm text-slate-900 dark:text-white hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
            >
              {gridView ? (
                <List className="w-4 h-4" />
              ) : (
                <Grid className="w-4 h-4" />
              )}
            </button>
          </div>

          {/* Filter Drawer - Mobile */}
          {showFilters && (
            <div className="mb-6 sm:hidden bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-slate-900 dark:text-white">
                  Categories
                </h3>
                <button
                  onClick={() => setShowFilters(false)}
                  className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                >
                  <X className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {categories.map((category) => (
                  <button
                    key={category}
                    onClick={() => {
                      handleCategoryChange(category);
                      setShowFilters(false);
                    }}
                    className={`py-2 px-3 rounded-lg text-sm font-semibold transition-all ${
                      selectedCategory === category
                        ? "bg-amber-500 text-white shadow-md"
                        : "bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white hover:bg-amber-50 dark:hover:bg-slate-600"
                    }`}
                  >
                    {category === "all" ? "All Products" : category}
                  </button>
                ))}
              </div>
              <button
                onClick={() => {
                  setSelectedCategory("all");
                  setSearchTerm("");
                  setShowFilters(false);
                }}
                className="w-full mt-4 py-2 px-3 flex items-center justify-center gap-2 bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white rounded-lg font-semibold text-sm hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
                Clear Filters
              </button>
            </div>
          )}

          {/* Desktop Filter Bar */}
          <div className="hidden sm:block mb-8 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
            <div className="flex items-center gap-3 overflow-x-auto pb-2">
              <span className="text-sm font-semibold text-slate-600 dark:text-slate-400 whitespace-nowrap">
                Categories:
              </span>
              <div className="flex gap-2">
                {categories.map((category) => (
                  <button
                    key={category}
                    onClick={() => handleCategoryChange(category)}
                    className={`whitespace-nowrap py-1.5 px-4 rounded-lg text-sm font-semibold transition-all ${
                      selectedCategory === category
                        ? "bg-amber-500 text-white shadow-md"
                        : "bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white hover:bg-amber-50 dark:hover:bg-slate-600"
                    }`}
                  >
                    {category === "all" ? "All" : category}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Products Grid */}
          {filteredProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-4">
              <Package className="w-16 h-16 text-slate-400 mb-4" />
              <h3 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mb-2">
                No products found
              </h3>
              <p className="text-slate-600 dark:text-slate-400 text-center mb-6 max-w-sm">
                Try adjusting your search or filters to find what you're looking for
              </p>
              <button
                onClick={() => {
                  setSearchTerm("");
                  handleCategoryChange("all");
                }}
                className="flex items-center gap-2 bg-amber-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-amber-600 transition-colors shadow-md"
              >
                <RotateCcw className="w-4 h-4" />
                Show All Products
              </button>
            </div>
          ) : (
            <>
              {/* Grid View */}
              {gridView && (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
                  {paginatedProducts.map((product, index) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      onAddToCart={handleAddToCart}
                      onQuickView={handleQuickViewMain}
                      index={index}
                    />
                  ))}
                </div>
              )}

              {/* List View */}
              {!gridView && (
                <div className="space-y-3">
                  {paginatedProducts.map((product) => (
                    <div
                      key={product.id}
                      className="flex gap-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4 hover:shadow-md transition-shadow"
                    >
                      {/* Image */}
                      <div
                        className="w-24 h-24 bg-slate-100 dark:bg-slate-700 rounded-lg flex-shrink-0 cursor-pointer overflow-hidden"
                        onClick={() => handleQuickViewMain(product)}
                      >
                        <OptimizedImage
                          src={product.image_url}
                          alt={product.name}
                          className="w-full h-full object-contain p-2"
                          fallbackClassName="w-full h-full"
                        />
                      </div>

                      {/* Info */}
                      <div className="flex-1 flex flex-col justify-between">
                        <div>
                          <span className="text-xs font-bold text-amber-700 dark:text-amber-400 uppercase">
                            {product.category}
                          </span>
                          <h3 className="font-bold text-slate-900 dark:text-white line-clamp-2">
                            {product.name}
                          </h3>
                          <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-1">
                            {product.description}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-lg font-bold text-slate-900 dark:text-white">
                            KES {product.selling_price.toLocaleString()}
                          </span>
                          {product.quantity_in_stock <= product.reorder_level && (
                            <span className="text-xs bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 px-2 py-1 rounded">
                              Only {product.quantity_in_stock} left
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex flex-col gap-2 justify-center">
                        <button
                          onClick={() => handleQuickViewMain(product)}
                          className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                        >
                          <Eye className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                        </button>
                        <button
                          onClick={() => handleAddToCart(product)}
                          disabled={product.quantity_in_stock === 0}
                          className="p-2 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white rounded-lg transition-colors"
                        >
                          <ShoppingCart className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-8 p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="w-full sm:w-auto px-4 py-2.5 bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
              >
                ← Previous
              </button>

              <span className="text-sm font-semibold text-slate-600 dark:text-slate-400">
                Page <span className="text-slate-900 dark:text-white">{currentPage}</span> of{" "}
                <span className="text-slate-900 dark:text-white">{totalPages}</span>
              </span>

              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="w-full sm:w-auto px-4 py-2.5 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg font-semibold transition-colors"
              >
                Next →
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Trust Section */}
      <section className="bg-slate-50 dark:bg-slate-800 py-8 sm:py-12 px-4">
        <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
          <div className="flex items-center gap-3 sm:gap-4">
            <Truck className="w-8 h-8 sm:w-10 sm:h-10 text-amber-500 flex-shrink-0" />
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-sm sm:text-base">
                Fast Delivery
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                Quick and reliable shipping
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 sm:gap-4">
            <RotateCcw className="w-8 h-8 sm:w-10 sm:h-10 text-amber-500 flex-shrink-0" />
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-sm sm:text-base">
                Easy Returns
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                30-day return guarantee
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 sm:gap-4">
            <Star className="w-8 h-8 sm:w-10 sm:h-10 text-amber-500 flex-shrink-0" />
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-sm sm:text-base">
                Quality Products
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                Premium items guaranteed
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-white py-8 sm:py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 mb-8">
            {/* Brand */}
            <div>
              <h3 className="text-lg sm:text-xl font-bold mb-2 text-amber-400">
                HASSAN BOOKSHOP
              </h3>
              <p className="text-slate-400 text-sm">
                Your trusted partner for quality books, stationery, and electronics.
              </p>
            </div>

            {/* Contact */}
            <div>
              <h4 className="font-bold mb-3 text-slate-100">Contact</h4>
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
                    📧 yussufh080@gmail.com
                  </a>
                </p>
                <p>📍 Nairobi, Kenya</p>
              </div>
            </div>

            {/* Categories */}
            <div>
              <h4 className="font-bold mb-3 text-slate-100">Shop</h4>
              <div className="space-y-2 text-slate-400 text-sm">
                <p>📚 Books & Notebooks</p>
                <p>🎒 Backpacks & Bags</p>
                <p>🖊️ Writing Supplies</p>
                <p>📱 Electronics</p>
              </div>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="border-t border-slate-700 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs sm:text-sm text-slate-400">
            <p>© {new Date().getFullYear()} HASSAN BOOKSHOP. All rights reserved.</p>
            <a
              href="https://lenzro.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-amber-400 hover:text-amber-300 font-semibold transition-colors"
            >
              Made with ❤️ by Lenzro
            </a>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <CartSidebar
        isOpen={showCart}
        onClose={() => setShowCart(false)}
        onCheckout={handleCheckoutClick}
      />

      <AuthModal isOpen={showAuth} onClose={() => setShowAuth(false)} />

      <CheckoutModal
        isOpen={showCheckout}
        onClose={handleCloseCheckout}
        onOrderComplete={handleOrderComplete}
      />

      <ProductQuickView
        product={quickViewProduct}
        isOpen={!!quickViewProduct}
        onClose={handleCloseQuickView}
        onAddToCart={handleAddToCart}
      />

      {/* Toast Container */}
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
        toastClassName="!rounded-xl !shadow-lg !min-h-12 !text-sm !p-2"
        progressClassName="!bg-gradient-to-r !from-blue-500 !to-amber-500"
      />
    </div>
  );
}