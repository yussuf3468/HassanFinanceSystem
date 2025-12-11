import { useEffect, useState, useCallback, useMemo, memo } from "react";
import { Filter, Star, Package, ShoppingCart, Heart } from "lucide-react";
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
import AdvancedFilters from "./AdvancedFilters";
import compactToast from "../utils/compactToast";
import type { Product } from "../types";
import type { Database } from "../lib/database.types";
import {
  searchProducts,
  sortProducts,
  filterProducts,
  getCategories,
  getPriceRange,
  type FilterOptions,
  type SortOption,
} from "../utils/searchUtils";

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
    onAddToCart: (product: Product, quantity?: number) => void;
    onQuickView?: (product: Product) => void;
    index?: number;
  }) => {
    const [isLiked, setIsLiked] = useState(false);
    const [isAddingToCart, setIsAddingToCart] = useState(false);

    const handleAddToCart = useCallback(async () => {
      setIsAddingToCart(true);

      // Simulate a slight delay for better UX
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

    return (
      <div
        data-product-id={product.id}
        className="bg-gradient-to-br from-white/10 via-purple-900/20 to-white/5 backdrop-blur-xl rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-500 overflow-hidden group border-2 border-white/20 hover:border-purple-500/40 ring-highlight-target transform hover:scale-105 hover:-translate-y-2 animate-slide-up"
        style={{ animationDelay: `${index * 50}ms` }}
      >
        {/* Product Image */}
        <div
          className="relative overflow-hidden cursor-pointer bg-gradient-to-br from-white/5 to-purple-900/10"
          onClick={handleQuickView}
        >
          <OptimizedImage
            src={product.image_url}
            alt={product.name}
            className="w-full h-52 sm:h-56 md:h-64 object-contain p-3 sm:p-4 group-hover:scale-110 transition-transform duration-700 ease-out"
            fallbackClassName="w-full h-52 sm:h-56 md:h-64"
            onClick={handleQuickView}
            priority={index < 3}
            preload={index < 6}
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />

          {/* Elegant Quick View Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-purple-900/80 via-purple-900/40 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500 flex items-end justify-center pb-6">
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleQuickView();
              }}
              className="bg-white text-slate-900 px-6 py-3 rounded-2xl font-bold text-sm transform translate-y-8 group-hover:translate-y-0 transition-all duration-500 shadow-2xl hover:shadow-white/30 border-2 border-white hover:scale-110"
            >
              👁️ Quick View
            </button>
          </div>

          {/* Wishlist Button */}
          <button
            onClick={toggleLike}
            className={`absolute top-4 right-4 w-11 h-11 rounded-full backdrop-blur-xl transition-all duration-300 flex items-center justify-center shadow-lg hover:scale-125 ${
              isLiked
                ? "bg-gradient-to-r from-rose-500 to-pink-500 text-white shadow-rose-500/50"
                : "bg-white/90 text-slate-400 hover:bg-white hover:text-rose-500"
            }`}
          >
            <Heart
              className={`w-5 h-5 ${
                isLiked ? "fill-current animate-scale-in" : ""
              }`}
            />
          </button>

          {/* Featured Badge */}
          {product.featured && (
            <div className="absolute top-4 left-4 bg-gradient-to-r from-amber-400 to-yellow-500 text-amber-900 px-3 py-2 rounded-2xl text-xs font-bold flex items-center space-x-1.5 shadow-lg shadow-amber-500/50 animate-bounce-subtle">
              <Star className="w-4 h-4 fill-current" />
              <span>⭐ Featured</span>
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="p-5 sm:p-6">
          {/* Category Tag */}
          <div className="mb-3">
            <span className="inline-flex items-center gap-1 text-xs font-bold text-purple-300 bg-purple-500/20 px-3 py-1.5 rounded-full uppercase tracking-wide border border-purple-500/30">
              📚 {product.category}
            </span>
          </div>

          {/* Product Name */}
          <h3 className="font-bold text-white text-lg sm:text-xl mb-3 line-clamp-2 leading-tight group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-purple-200 group-hover:to-blue-200 group-hover:bg-clip-text transition-all duration-300">
            {product.name}
          </h3>

          {/* Product Description */}
          {product.description && (
            <p className="text-sm text-slate-300/90 mb-4 line-clamp-2 leading-relaxed">
              {product.description}
            </p>
          )}

          {/* Price */}
          <div className="mb-5">
            <p className="text-3xl font-black text-transparent bg-gradient-to-r from-purple-300 via-blue-300 to-purple-300 bg-clip-text animate-gradient-x">
              KES {product.selling_price.toLocaleString()}
            </p>
          </div>

          {/* Add to Cart Button */}
          <button
            onClick={handleAddToCart}
            disabled={isAddingToCart}
            className={`w-full py-4 px-4 rounded-2xl font-bold text-base transition-all duration-300 flex items-center justify-center space-x-2 shadow-lg hover:shadow-2xl ${
              isAddingToCart
                ? "bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-green-500/50 scale-105"
                : "bg-gradient-to-r from-purple-600 via-purple-500 to-blue-600 text-white hover:from-purple-700 hover:via-purple-600 hover:to-blue-700 hover:shadow-purple-500/50 active:scale-95 hover:scale-105"
            }`}
          >
            {isAddingToCart ? (
              <>
                <span className="animate-spin text-xl">⚡</span>
                <span>Adding...</span>
              </>
            ) : (
              <>
                <ShoppingCart className="w-5 h-5" />
                <span>Add to Cart</span>
              </>
            )}
          </button>
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
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(
    null
  );

  // Enhanced search and filter states
  const [filters, setFilters] = useState<FilterOptions>({});
  const [sortBy, setSortBy] = useState<SortOption>("relevance");

  // Pagination constants
  const PRODUCTS_PER_PAGE = 12;

  // Debounced search term for performance
  const debouncedSearchTerm = useDebounceValue(searchTerm, 300);

  const cart = useCart();
  const { user } = useAuth();

  // Get dynamic categories from products
  const categories = useMemo(() => getCategories(products), [products]);

  // Get price range from products
  const priceRange = useMemo(() => getPriceRange(products), [products]);

  const loadProducts = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("published", true)
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

  // Auto-scroll to products section when search term changes and results are ready
  useEffect(() => {
    if (debouncedSearchTerm.trim()) {
      setTimeout(() => {
        const productsSection = document.getElementById("products-section");
        if (productsSection) {
          const navbarHeight = 140; // Account for fixed navbar height
          const elementPosition = productsSection.getBoundingClientRect().top;
          const offsetPosition =
            elementPosition + window.pageYOffset - navbarHeight;

          window.scrollTo({
            top: offsetPosition,
            behavior: "smooth",
          });
        }
      }, 200);
    }
  }, [debouncedSearchTerm]);

  // Enhanced filtering and search with fuzzy matching
  const filteredProducts = useMemo(() => {
    let filtered = products;

    // Apply category filter first
    if (filters.category && filters.category !== "all") {
      filtered = filtered.filter(
        (product) => product.category === filters.category
      );
    } else if (selectedCategory !== "all") {
      filtered = filtered.filter(
        (product) => product.category === selectedCategory
      );
    }

    // Apply other filters (price, stock, featured)
    filtered = filterProducts(filtered, filters);

    // Apply search with fuzzy matching if there's a search term
    if (debouncedSearchTerm) {
      const searchResults = searchProducts(filtered, debouncedSearchTerm, {
        fuzzyThreshold: 0.7,
        includeDescription: true,
        maxResults: 1000,
      });

      // Sort search results
      const sortedResults = sortProducts(searchResults, sortBy);

      return sortedResults.map((result) => result.product);
    }

    // If no search term, just return filtered products
    // Sort by price or name if selected
    if (sortBy !== "relevance") {
      const mockResults = filtered.map((product) => ({
        product,
        score: 1,
        matchType: "exact" as const,
        matchedFields: [] as string[],
      }));
      const sorted = sortProducts(mockResults, sortBy);
      return sorted.map((r) => r.product);
    }

    return filtered;
  }, [products, debouncedSearchTerm, selectedCategory, filters, sortBy]);

  // Paginated products
  const paginatedProducts = useMemo(() => {
    const startIndex = (currentPage - 1) * PRODUCTS_PER_PAGE;
    const endIndex = startIndex + PRODUCTS_PER_PAGE;
    return filteredProducts.slice(startIndex, endIndex);
  }, [filteredProducts, currentPage, PRODUCTS_PER_PAGE]);

  // Total pages
  const totalPages = Math.ceil(filteredProducts.length / PRODUCTS_PER_PAGE);

  const handleAddToCart = useCallback(
    (product: Product, quantity = 1) => {
      cart.addItem(product, quantity);

      // Show success toast notification with feedback
      compactToast.addToCart(product.name);
    },
    [cart]
  );

  const handleSearchChange = useCallback((value: string) => {
    setSearchTerm(value);
    setCurrentPage(1); // Reset to first page on search
  }, []);

  const handleCategoryChange = useCallback((category: string) => {
    setSelectedCategory(category);
    setFilters((prev) => ({ ...prev, category: undefined })); // Clear advanced filter
    setCurrentPage(1); // Reset to first page on category change

    // Scroll to products section
    setTimeout(() => {
      const productsSection = document.getElementById("products-section");
      if (productsSection) {
        const navbarHeight = 140;
        const elementPosition = productsSection.getBoundingClientRect().top;
        const offsetPosition =
          elementPosition + window.pageYOffset - navbarHeight;
        window.scrollTo({ top: offsetPosition, behavior: "smooth" });
      }
    }, 100);
  }, []);

  const handleFilterChange = useCallback((newFilters: FilterOptions) => {
    setFilters(newFilters);
    setCurrentPage(1); // Reset to first page on filter change

    // Scroll to products section
    setTimeout(() => {
      const productsSection = document.getElementById("products-section");
      if (productsSection) {
        const navbarHeight = 140;
        const elementPosition = productsSection.getBoundingClientRect().top;
        const offsetPosition =
          elementPosition + window.pageYOffset - navbarHeight;
        window.scrollTo({ top: offsetPosition, behavior: "smooth" });
      }
    }, 100);
  }, []);

  const handleSortChange = useCallback((newSortBy: SortOption) => {
    setSortBy(newSortBy);
    setCurrentPage(1); // Reset to first page on sort change

    // Scroll to products section
    setTimeout(() => {
      const productsSection = document.getElementById("products-section");
      if (productsSection) {
        const navbarHeight = 140;
        const elementPosition = productsSection.getBoundingClientRect().top;
        const offsetPosition =
          elementPosition + window.pageYOffset - navbarHeight;
        window.scrollTo({ top: offsetPosition, behavior: "smooth" });
      }
    }, 100);
  }, []);

  const handleCartClick = useCallback(() => {
    setShowCart(true);
  }, []);

  const handleAuthClick = useCallback(() => {
    setShowAuth(true);
  }, []);

  const handleShopNowClick = useCallback(() => {
    const productsSection = document.getElementById("products-section");
    if (productsSection) {
      productsSection.scrollIntoView({ behavior: "smooth" });
    }
  }, []);

  const handleQuickViewMain = useCallback((product: Product) => {
    setQuickViewProduct(product);
  }, []);

  const handleCloseQuickView = useCallback(() => {
    setQuickViewProduct(null);
  }, []);

  const handleProductSelect = useCallback((product: Product) => {
    // This will trigger the highlighting in Navbar through the data-product-id attribute
    console.log("Product selected:", product.name);
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
      console.log("Order completed:", order.order_number);
      compactToast.orderSuccess(order.order_number);
      onCheckout?.();
    },
    [onCheckout]
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        {/* Navbar Skeleton */}
        <div className="bg-white/10 backdrop-blur-xl shadow-lg border-b border-white/20 sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <div className="h-8 bg-gradient-to-r from-white/20 via-white/10 to-white/20 bg-[length:200%_100%] animate-shimmer rounded-lg w-48"></div>
              <div className="h-10 bg-gradient-to-r from-white/20 via-white/10 to-white/20 bg-[length:200%_100%] animate-shimmer rounded-lg w-64"></div>
              <div className="flex space-x-4">
                <div className="h-10 w-10 bg-gradient-to-r from-white/20 via-white/10 to-white/20 bg-[length:200%_100%] animate-shimmer rounded-full"></div>
                <div className="h-10 w-20 bg-gradient-to-r from-white/20 via-white/10 to-white/20 bg-[length:200%_100%] animate-shimmer rounded-lg"></div>
              </div>
            </div>
          </div>
        </div>

        {/* Hero Skeleton */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center mb-12">
            <div className="h-12 bg-gradient-to-r from-white/20 via-white/10 to-white/20 bg-[length:200%_100%] animate-shimmer rounded-lg w-96 mx-auto mb-4"></div>
            <div className="h-6 bg-gradient-to-r from-white/20 via-white/10 to-white/20 bg-[length:200%_100%] animate-shimmer rounded-lg w-64 mx-auto mb-8"></div>
          </div>

          {/* Products Skeleton */}
          <ProductSkeleton count={8} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 overflow-x-hidden">
      {/* Navbar - Fixed */}
      <Navbar
        searchTerm={searchTerm}
        onSearchChange={handleSearchChange}
        onCartClick={handleCartClick}
        onAuthClick={handleAuthClick}
        onAdminClick={user ? onAdminClick : undefined}
        products={products}
        onProductSelect={handleProductSelect}
      />

      {/* Spacer for fixed navbar */}
      <div className="h-[120px] md:h-[88px]"></div>

      {/* Hero Section */}
      <HeroSection
        onShopNowClick={handleShopNowClick}
        onAddToCart={handleAddToCart}
        onQuickView={handleQuickViewMain}
      />

      {/* Products Section */}
      <section
        id="products-section"
        className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16"
      >
        {/* Section Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center space-x-2 bg-white/10 backdrop-blur-xl border border-white/20 text-purple-300 px-4 py-2 rounded-full text-sm font-medium mb-4">
            <Package className="w-4 h-4" />
            <span>Premium Collection</span>
          </div>
          <h2 className="text-4xl sm:text-5xl font-black text-transparent bg-gradient-to-r from-white via-purple-200 to-blue-200 bg-clip-text mb-4">
            Our Products
          </h2>
          <p className="text-xl text-purple-300 mb-2 font-somali">
            Alaabteenna
          </p>
          <p className="text-slate-300 max-w-2xl mx-auto">
            Discover our carefully curated collection of books, stationery, and
            electronics. Quality guaranteed, prices unmatched.
          </p>
        </div>

        {/* Advanced Filters and Sort */}
        <AdvancedFilters
          categories={categories}
          priceRange={priceRange}
          activeFilters={filters}
          activeSortBy={sortBy}
          onFilterChange={handleFilterChange}
          onSortChange={handleSortChange}
          resultCount={filteredProducts.length}
        />

        {/* Category Filter (Legacy - kept for quick access) */}
        <div className="mb-12">
          {/* Mobile Filter Design */}
          <div className="block lg:hidden">
            <div className="bg-white/10 backdrop-blur-xl rounded-2xl shadow-lg border border-white/20 p-4 mb-6">
              <div className="flex items-center mb-4">
                <Filter className="w-5 h-5 text-purple-300 mr-2" />
                <span className="text-lg font-bold text-white">
                  Filter by Category
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {categories.map((category) => (
                  <button
                    key={category}
                    onClick={() => handleCategoryChange(category)}
                    className={`px-3 py-2 rounded-xl text-sm font-bold transition-all duration-300 ${
                      selectedCategory === category
                        ? "bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg transform scale-105"
                        : "bg-white/10 text-slate-300 hover:bg-white/20 hover:text-white hover:scale-105 border border-white/20"
                    }`}
                  >
                    {category === "all" ? "All" : category}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Desktop Filter Design */}
          <div className="hidden lg:block">
            <div className="overflow-x-auto scrollbar-hide pb-4">
              <div className="flex items-center justify-center space-x-3 min-w-max mx-auto">
                <div className="flex items-center space-x-2 bg-white/10 backdrop-blur-xl rounded-full p-1 shadow-lg border border-white/20">
                  <Filter className="w-5 h-5 text-purple-300 ml-3 flex-shrink-0" />
                  <div className="flex space-x-1 pr-3">
                    {categories.map((category) => (
                      <button
                        key={category}
                        onClick={() => handleCategoryChange(category)}
                        className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-all duration-300 ${
                          selectedCategory === category
                            ? "bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-xl transform scale-105"
                            : "text-slate-300 hover:bg-white/10 hover:text-white hover:scale-105"
                        }`}
                      >
                        {category === "all" ? "All" : category}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        {/* Products Grid */}
        {filteredProducts.length === 0 ? (
          <div className="text-center py-16">
            <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-12 max-w-md mx-auto border border-white/20">
              <Package className="w-20 h-20 text-slate-400 mx-auto mb-6" />
              <h3 className="text-2xl font-bold text-white mb-3">
                No products found
              </h3>
              <p className="text-slate-300 mb-6">
                Try adjusting your search or filters to find what you're looking
                for
              </p>
              <button
                onClick={() => {
                  setSearchTerm("");
                  handleCategoryChange("all");
                }}
                className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-3 rounded-xl hover:from-purple-700 hover:to-blue-700 transition-all duration-300 font-semibold"
              >
                Show All Products
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
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
        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-3 mt-12 px-4">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 border border-white/20 bg-white/10 backdrop-blur-xl rounded-lg text-white hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium"
            >
              Previous
            </button>

            <div className="flex items-center gap-2">
              <span className="text-white font-medium px-3 py-2 bg-white/10 backdrop-blur-xl rounded-lg border border-white/20">
                Page {currentPage} of {totalPages}
              </span>
            </div>

            <button
              onClick={() =>
                setCurrentPage(Math.min(totalPages, currentPage + 1))
              }
              disabled={currentPage === totalPages}
              className="px-4 py-2 border border-white/20 bg-white/10 backdrop-blur-xl rounded-lg text-white hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium"
            >
              Next
            </button>
          </div>
        )}
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h3 className="text-xl font-bold mb-4">HASSAN BOOKSHOP</h3>
              <p className="text-slate-300">
                Your trusted partner for books, stationery, and more. Quality
                products, fast delivery, best prices.
              </p>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Contact / Xiriir</h4>
              <div className="space-y-2 text-slate-300">
                <p className="flex items-center space-x-2">
                  <span>📞</span>
                  <a
                    href="tel:+254722979547"
                    className="hover:text-white transition-colors"
                  >
                    +254 722 979 547
                  </a>
                </p>
                <p className="flex items-center space-x-2">
                  <span>📧</span>
                  <a
                    href="mailto:yussufh080@gmail.com"
                    className="hover:text-white transition-colors"
                  >
                    yussufh080@gmail.com
                  </a>
                </p>
                <p className="flex items-center space-x-2">
                  <span>📍</span>
                  <span>Nairobi, Kenya</span>
                </p>
                <p className="flex items-center space-x-2">
                  <span>⚡</span>
                  <span>Made with ❤️ by Lenzro</span>
                </p>
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Categories</h4>
              <div className="grid grid-cols-2 gap-2 text-slate-300">
                <p>📚 Books</p>
                <p>🎒 Backpacks</p>
                <p>🖊️ Stationery</p>
                <p>📱 Electronics</p>
              </div>
            </div>
          </div>

          <div className="border-t border-slate-700 mt-8 pt-8">
            <div className="flex flex-col sm:flex-row items-center justify-center sm:justify-between gap-3 text-sm">
              <p className="text-slate-400 text-center sm:text-left">
                &copy; {new Date().getFullYear()} HASSAN BOOKSHOP. All rights
                reserved.
              </p>
              <div className="flex items-center gap-2">
                <span className="text-slate-500">Powered by</span>
                <a
                  href="https://lenzro.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-purple-600/30 to-blue-600/30 hover:from-purple-600/40 hover:to-blue-600/40 border border-purple-500/40 hover:border-purple-400/60 rounded-lg transition-all hover:scale-105 font-bold text-purple-300 hover:text-purple-200 shadow-xl"
                >
                  <span className="text-lg">⚡</span>
                  <span>Lenzro</span>
                  <span className="text-xs text-purple-400">
                    Digital Agency
                  </span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </footer>

      {/* Cart Sidebar */}
      <CartSidebar
        isOpen={showCart}
        onClose={() => setShowCart(false)}
        onCheckout={handleCheckoutClick}
      />

      {/* Auth Modal */}
      <AuthModal isOpen={showAuth} onClose={() => setShowAuth(false)} />

      {/* Checkout Modal */}
      <CheckoutModal
        isOpen={showCheckout}
        onClose={handleCloseCheckout}
        onOrderComplete={handleOrderComplete}
      />

      {/* Product Quick View Modal */}
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
        toastClassName="!rounded-lg !shadow-lg !min-h-12 !text-sm !p-2"
        progressClassName="!bg-gradient-to-r !from-blue-500 !to-purple-500"
        style={{
          fontSize: "14px",
        }}
      />
    </div>
  );
}
