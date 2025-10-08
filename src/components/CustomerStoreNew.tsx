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
import HeroSection from "./HeroSection";
import CartSidebar from "./CartSidebar";
import AuthModal from "./AuthModal";
import ProductQuickView from "./ProductQuickView";
import LoadingSkeleton from "./LoadingSkeleton";
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
  }: {
    product: Product;
    onAddToCart: (product: Product) => void;
    onQuickView?: (product: Product) => void;
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
        className="bg-white rounded-xl shadow-md hover:shadow-2xl transition-all duration-500 hover:scale-105 overflow-hidden group border border-slate-100 ring-highlight-target"
      >
        {/* Product Image */}
        <div
          className="relative overflow-hidden cursor-pointer"
          onClick={handleQuickView}
        >
          <OptimizedImage
            src={product.image_url}
            alt={product.name}
            className="w-full h-48 object-cover group-hover:scale-110 transition-transform duration-500"
            fallbackClassName="w-full h-48"
            onClick={handleQuickView}
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />

          {/* Quick View Overlay */}
          <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleQuickView();
              }}
              className="bg-white text-slate-900 px-4 py-2 rounded-lg font-medium transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300"
            >
              Quick View
            </button>
          </div>

          {/* Wishlist Button */}
          <button
            onClick={toggleLike}
            className={`absolute top-3 right-3 p-2 rounded-full backdrop-blur-sm transition-all duration-300 ${
              isLiked
                ? "bg-red-500 text-white shadow-lg scale-110"
                : "bg-white/80 text-slate-600 hover:bg-red-50 hover:text-red-500"
            }`}
          >
            <Heart className={`w-4 h-4 ${isLiked ? "fill-current" : ""}`} />
          </button>

          {/* Featured Badge */}
          {product.featured && (
            <div className="absolute top-3 left-3 bg-gradient-to-r from-yellow-400 to-yellow-500 text-white px-3 py-1 rounded-full text-xs font-bold flex items-center space-x-1 shadow-lg">
              <Star className="w-3 h-3 fill-current" />
              <span>FEATURED</span>
            </div>
          )}

          {/* Low Stock Warning */}
          {product.quantity_in_stock <= product.reorder_level && (
            <div className="absolute bottom-3 left-3 bg-gradient-to-r from-red-500 to-red-600 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg animate-pulse">
              Only {product.quantity_in_stock} left!
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="p-5">
          <h3 className="font-bold text-slate-900 text-lg mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors duration-300">
            {product.name}
          </h3>
          <p className="text-slate-500 text-sm mb-3 bg-slate-50 px-2 py-1 rounded-lg inline-block">
            {product.category}
          </p>

          {/* Price & Stock */}
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-2xl font-black text-transparent bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text">
                KES {product.selling_price.toLocaleString()}
              </p>
              <p className="text-sm text-slate-500 flex items-center">
                <Package className="w-3 h-3 mr-1" />
                Stock: {product.quantity_in_stock}
              </p>
            </div>
          </div>

          {/* Add to Cart Button */}
          <button
            onClick={handleAddToCart}
            disabled={product.quantity_in_stock === 0 || isAddingToCart}
            className={`w-full py-3 px-4 rounded-xl font-bold text-sm transition-all duration-300 flex items-center justify-center space-x-2 ${
              product.quantity_in_stock === 0
                ? "bg-slate-200 text-slate-500 cursor-not-allowed"
                : isAddingToCart
                ? "bg-green-500 text-white transform scale-95"
                : "bg-gradient-to-r from-blue-500 via-blue-600 to-purple-600 text-white hover:from-blue-600 hover:via-purple-600 hover:to-blue-700 hover:shadow-xl hover:shadow-blue-500/25 hover:scale-105 active:scale-95"
            }`}
          >
            <ShoppingCart
              className={`w-4 h-4 ${isAddingToCart ? "animate-bounce" : ""}`}
            />
            <span>
              {product.quantity_in_stock === 0
                ? "Out of Stock"
                : isAddingToCart
                ? "Adding..."
                : "Add to Cart"}
            </span>
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

  // Pagination constants
  const PRODUCTS_PER_PAGE = 12;

  // Debounced search term for performance
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
      "Erasers",
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

    // Filter by search term (using debounced value)
    if (debouncedSearchTerm) {
      filtered = filtered.filter(
        (product) =>
          product.name
            .toLowerCase()
            .includes(debouncedSearchTerm.toLowerCase()) ||
          product.category
            .toLowerCase()
            .includes(debouncedSearchTerm.toLowerCase())
      );
    }

    // Filter by category
    if (selectedCategory !== "all") {
      filtered = filtered.filter(
        (product) => product.category === selectedCategory
      );
    }

    return filtered;
  }, [products, debouncedSearchTerm, selectedCategory]);

  // Paginated products
  const paginatedProducts = useMemo(() => {
    const startIndex = (currentPage - 1) * PRODUCTS_PER_PAGE;
    const endIndex = startIndex + PRODUCTS_PER_PAGE;
    return filteredProducts.slice(startIndex, endIndex);
  }, [filteredProducts, currentPage, PRODUCTS_PER_PAGE]);

  // Total pages
  const totalPages = Math.ceil(filteredProducts.length / PRODUCTS_PER_PAGE);

  const handleAddToCart = useCallback(
    (product: Product) => {
      cart.addItem(product);

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
    setCurrentPage(1); // Reset to first page on category change
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
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-100">
        {/* Navbar Skeleton */}
        <div className="bg-white shadow-lg border-b border-slate-200 sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <div className="h-8 bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200 bg-[length:200%_100%] animate-shimmer rounded-lg w-48"></div>
              <div className="h-10 bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200 bg-[length:200%_100%] animate-shimmer rounded-lg w-64"></div>
              <div className="flex space-x-4">
                <div className="h-10 w-10 bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200 bg-[length:200%_100%] animate-shimmer rounded-full"></div>
                <div className="h-10 w-20 bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200 bg-[length:200%_100%] animate-shimmer rounded-lg"></div>
              </div>
            </div>
          </div>
        </div>

        {/* Hero Skeleton */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center mb-12">
            <div className="h-12 bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200 bg-[length:200%_100%] animate-shimmer rounded-lg w-96 mx-auto mb-4"></div>
            <div className="h-6 bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200 bg-[length:200%_100%] animate-shimmer rounded-lg w-64 mx-auto mb-8"></div>
          </div>

          {/* Products Skeleton */}
          <ProductSkeleton count={8} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-100">
      {/* Navbar */}
      <Navbar
        searchTerm={searchTerm}
        onSearchChange={handleSearchChange}
        onCartClick={handleCartClick}
        onAuthClick={handleAuthClick}
        onAdminClick={user ? onAdminClick : undefined}
        products={products}
        onProductSelect={handleProductSelect}
      />

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
        {/* Section Header */},
        <div className="text-center mb-12">
          <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-blue-100 to-purple-100 text-blue-800 px-4 py-2 rounded-full text-sm font-medium mb-4">
            <Package className="w-4 h-4" />
            <span>Premium Collection</span>
          </div>
          <h2 className="text-4xl sm:text-5xl font-black text-transparent bg-gradient-to-r from-slate-900 via-blue-600 to-purple-600 bg-clip-text mb-4">
            Our Products
          </h2>
          <p className="text-xl text-slate-600 mb-2">Alaabteenna</p>
          <p className="text-slate-500 max-w-2xl mx-auto">
            Discover our carefully curated collection of books, stationery, and
            electronics. Quality guaranteed, prices unmatched.
          </p>
        </div>
        {/* Category Filter */}
        <div className="mb-12">
          {/* Mobile Filter Design */}
          <div className="block lg:hidden">
            <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-4 mb-6">
              <div className="flex items-center mb-4">
                <Filter className="w-5 h-5 text-slate-600 mr-2" />
                <span className="text-lg font-bold text-slate-700">
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
                        ? "bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg transform scale-105"
                        : "bg-slate-50 text-slate-600 hover:bg-blue-50 hover:text-blue-600 hover:scale-105 border border-slate-200"
                    }`}
                  >
                    {category === "all" ? "All" : category}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Desktop Filter Design */}
          <div className="hidden lg:flex items-center justify-center space-x-3 overflow-x-auto pb-4">
            <div className="flex items-center space-x-2 bg-white rounded-full p-1 shadow-lg border border-slate-200">
              <Filter className="w-5 h-5 text-slate-600 ml-3" />
              <div className="flex space-x-1 pr-3">
                {categories.map((category) => (
                  <button
                    key={category}
                    onClick={() => handleCategoryChange(category)}
                    className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-all duration-300 ${
                      selectedCategory === category
                        ? "bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-xl transform scale-105"
                        : "text-slate-600 hover:bg-blue-50 hover:text-blue-600 hover:scale-105"
                    }`}
                  >
                    {category === "all" ? "All / Dhammaan" : category}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
        {/* Products Grid */}
        {filteredProducts.length === 0 ? (
          <div className="text-center py-16">
            <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-3xl p-12 max-w-md mx-auto">
              <Package className="w-20 h-20 text-slate-300 mx-auto mb-6" />
              <h3 className="text-2xl font-bold text-slate-700 mb-3">
                No products found
              </h3>
              <p className="text-slate-500 mb-6">
                Ma jiro alaab la helay - Try adjusting your search or filters
              </p>
              <button
                onClick={() => {
                  setSearchTerm("");
                  handleCategoryChange("all");
                }}
                className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-6 py-3 rounded-xl hover:from-blue-600 hover:to-purple-600 transition-all duration-300 font-semibold"
              >
                Show All Products
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {paginatedProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onAddToCart={handleAddToCart}
                onQuickView={handleQuickViewMain}
              />
            ))}
          </div>
        )}
        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center space-x-4 mt-12">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 border border-slate-300 rounded-lg text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>

            <div className="flex space-x-2">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                (page) => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`px-3 py-2 rounded-lg ${
                      page === currentPage
                        ? "bg-blue-500 text-white"
                        : "text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    {page}
                  </button>
                )
              )}
            </div>

            <button
              onClick={() =>
                setCurrentPage(Math.min(totalPages, currentPage + 1))
              }
              disabled={currentPage === totalPages}
              className="px-4 py-2 border border-slate-300 rounded-lg text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
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
              <h3 className="text-xl font-bold mb-4">Hassan Muse BookShop</h3>
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
                    href="mailto:Yussufh080@gmail.com"
                    className="hover:text-white transition-colors"
                  >
                    Yussufh080@gmail.com
                  </a>
                </p>
                <p className="flex items-center space-x-2">
                  <span>📍</span>
                  <span>Nairobi, Kenya</span>
                </p>
                <p className="flex items-center space-x-2">
                  <span>🚚</span>
                  <span>Free delivery over KES 2,000</span>
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

          <div className="border-t border-slate-700 mt-8 pt-8 text-center text-slate-400">
            <p>&copy; 2025 Hassan Muse BookShop. All rights reserved.</p>
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
