import { useState, useEffect, memo, useCallback } from "react";
import {
  Star,
  ShoppingCart,
  Flame,
  TrendingUp,
  Heart,
  Package,
} from "lucide-react";
import { toast } from "react-toastify";
import { supabase } from "../lib/supabase";
import OptimizedImage from "./OptimizedImage";
import type { Product } from "../types";

interface FeaturedProductsProps {
  onAddToCart?: (product: Product) => void;
  onQuickView?: (product: Product) => void;
}

const FeaturedProducts = memo(
  ({ onAddToCart, onQuickView }: FeaturedProductsProps) => {
    const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
      const fetchFeaturedProducts = async () => {
        try {
          // Get products ordered by stock quantity (most sold = less stock remaining)
          const { data, error } = await supabase
            .from("products")
            .select("*")
            .gt("quantity_in_stock", 0)
            .order("quantity_in_stock", { ascending: true }) // Products with less stock = more sold
            .limit(8);

          if (error) throw error;
          setFeaturedProducts(data || []);
        } catch (error) {
          console.error("Error fetching featured products:", error);
          setFeaturedProducts([]);
        } finally {
          setIsLoading(false);
        }
      };

      fetchFeaturedProducts();
    }, []);

    const badges = [
      "👑 #1 Best Seller",
      "🔥 Hot Sale",
      "⭐ Customer Favorite",
      "💫 Trending Now",
      "🎯 Limited Edition",
      "🏆 Award Winner",
      "✨ New Arrival",
      "💎 Premium Choice",
    ];

    const handleAddToCart = useCallback(
      (product: Product) => {
        if (onAddToCart) {
          onAddToCart(product);
        }
      },
      [onAddToCart]
    );

    const handleQuickView = useCallback(
      (product: Product) => {
        if (onQuickView) {
          onQuickView(product);
        }
      },
      [onQuickView]
    );

    // Individual Product Card Component with all features
    const FeaturedProductCard = memo(
      ({ product, index }: { product: Product; index: number }) => {
        const [isLiked, setIsLiked] = useState(false);
        const [isAddingToCart, setIsAddingToCart] = useState(false);

        const toggleLike = useCallback(() => {
          setIsLiked((prev) => !prev);
          if (!isLiked) {
            toast.success("Added to wishlist! ❤️", {
              position: "bottom-right",
              autoClose: 2000,
              hideProgressBar: false,
              closeOnClick: true,
              pauseOnHover: true,
              draggable: true,
            });
          }
        }, [isLiked]);

        const handleAddToCartClick = useCallback(async () => {
          setIsAddingToCart(true);
          await new Promise((resolve) => setTimeout(resolve, 300));
          handleAddToCart(product);
          setIsAddingToCart(false);
        }, [product]);

        const handleQuickViewClick = useCallback(() => {
          handleQuickView(product);
        }, [product]);

        return (
          <div
            key={product.id}
            className="group relative bg-white rounded-xl sm:rounded-2xl lg:rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-500 overflow-hidden border-2 border-transparent hover:border-gradient-to-r hover:from-blue-400 hover:to-purple-400 transform hover:-translate-y-2 hover:scale-105"
          >
            {/* Enhanced Badge */}
            <div className="absolute top-2 sm:top-3 lg:top-4 left-2 sm:left-3 lg:left-4 z-20">
              <div className="bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 text-white px-2 sm:px-3 lg:px-4 py-1 sm:py-2 rounded-full text-xs sm:text-sm lg:text-base font-bold shadow-lg animate-pulse glow">
                {badges[index % badges.length]}
              </div>
            </div>

            {/* Stock Badge */}
            {product.quantity_in_stock < 10 && (
              <div className="absolute top-12 sm:top-14 lg:top-16 right-2 sm:right-3 lg:right-4 z-20">
                <div className="bg-red-500 text-white px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-bold animate-bounce">
                  Only {product.quantity_in_stock} left!
                </div>
              </div>
            )}

            {/* Wishlist Button */}
            <button
              onClick={toggleLike}
              className={`absolute top-2 sm:top-3 lg:top-4 right-2 sm:right-3 lg:right-4 z-20 p-2 rounded-full backdrop-blur-sm transition-all duration-300 ${
                isLiked
                  ? "bg-red-500 text-white shadow-lg scale-110"
                  : "bg-white/80 text-slate-600 hover:bg-red-50 hover:text-red-500"
              }`}
            >
              <Heart
                className={`w-3 h-3 sm:w-4 sm:h-4 ${
                  isLiked ? "fill-current" : ""
                }`}
              />
            </button>

            {/* Shimmer Effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 shimmer"></div>

            {/* Product Image - Much Larger with Quick View */}
            <div
              className="relative overflow-hidden rounded-t-xl sm:rounded-t-2xl lg:rounded-t-3xl cursor-pointer"
              onClick={handleQuickViewClick}
            >
              <OptimizedImage
                src={product.image_url}
                alt={product.name}
                className="w-full h-40 sm:h-48 lg:h-56 xl:h-64 object-cover group-hover:scale-110 transition-transform duration-700"
                fallbackClassName="w-full h-40 sm:h-48 lg:h-56 xl:h-64"
                onClick={handleQuickViewClick}
                priority={index < 2} // Prioritize first 2 featured products
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw"
              />{" "}
              {/* Quick View Overlay */}
              <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleQuickViewClick();
                  }}
                  className="bg-white text-slate-900 px-3 sm:px-4 py-2 rounded-lg font-medium transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300 text-sm sm:text-base"
                >
                  Quick View
                </button>
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent"></div>
            </div>

            {/* Product Info */}
            <div className="p-3 sm:p-4 lg:p-6 space-y-2 sm:space-y-3 lg:space-y-4">
              <h4 className="text-sm sm:text-base lg:text-lg xl:text-xl font-bold text-slate-900 group-hover:text-blue-600 transition-colors duration-300 line-clamp-2">
                {product.name}
              </h4>

              <p className="text-xs sm:text-sm lg:text-base text-slate-600 line-clamp-1 group-hover:text-slate-700 transition-colors bg-slate-50 px-2 py-1 rounded-lg inline-block">
                {product.category}
              </p>

              {/* Rating */}
              <div className="flex items-center space-x-1 sm:space-x-2">
                <div className="flex space-x-1">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className="w-3 h-3 sm:w-4 sm:h-4 lg:w-5 lg:h-5 fill-yellow-400 text-yellow-400"
                    />
                  ))}
                </div>
                <span className="text-xs sm:text-sm lg:text-base text-slate-600 font-medium">
                  (4.9)
                </span>
              </div>

              {/* Price & Stock Info */}
              <div className="flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="text-lg sm:text-xl lg:text-2xl xl:text-3xl font-black text-transparent bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text">
                    KSH {product.selling_price?.toLocaleString()}
                  </span>
                  {product.buying_price &&
                    product.buying_price < product.selling_price && (
                      <span className="text-xs sm:text-sm lg:text-base text-slate-500 line-through">
                        KSH {product.buying_price.toLocaleString()}
                      </span>
                    )}
                  <p className="text-xs sm:text-sm text-slate-500 flex items-center mt-1">
                    <Package className="w-3 h-3 mr-1" />
                    Stock: {product.quantity_in_stock}
                  </p>
                </div>
              </div>

              {/* Add to Cart Button */}
              <button
                onClick={handleAddToCartClick}
                disabled={isAddingToCart}
                className={`w-full font-bold py-2 sm:py-3 lg:py-4 px-3 sm:px-4 lg:px-6 rounded-lg sm:rounded-xl lg:rounded-2xl transition-all duration-300 transform shadow-lg hover:shadow-xl text-sm sm:text-base lg:text-lg flex items-center justify-center space-x-2 ${
                  isAddingToCart
                    ? "bg-slate-400 cursor-not-allowed"
                    : "bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 hover:from-blue-600 hover:via-purple-600 hover:to-pink-600 text-white hover:scale-105 active:scale-95"
                }`}
              >
                <ShoppingCart
                  className={`w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 ${
                    isAddingToCart ? "animate-spin" : ""
                  }`}
                />
                <span>{isAddingToCart ? "Adding..." : "Add to Cart"}</span>
              </button>
            </div>
          </div>
        );
      }
    );

    if (isLoading) {
      return (
        <div className="py-8 sm:py-12 lg:py-16">
          <div className="relative bg-gradient-to-br from-white via-blue-50 to-purple-100 rounded-xl sm:rounded-2xl lg:rounded-3xl shadow-2xl p-4 sm:p-6 lg:p-8 border border-white/30 backdrop-blur-sm">
            <div className="animate-pulse">
              <div className="h-8 sm:h-10 bg-gray-300 rounded-lg mb-4 sm:mb-6"></div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="bg-white rounded-xl p-4 shadow-lg">
                    <div className="h-32 sm:h-40 lg:h-48 bg-gray-300 rounded-lg mb-4"></div>
                    <div className="h-4 bg-gray-300 rounded mb-2"></div>
                    <div className="h-6 bg-gray-300 rounded mb-2"></div>
                    <div className="h-8 bg-gray-300 rounded"></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="py-8 sm:py-12 lg:py-16">
        <div className="relative bg-gradient-to-br from-white via-blue-50 to-purple-100 rounded-xl sm:rounded-2xl lg:rounded-3xl shadow-2xl p-4 sm:p-6 lg:p-8 border border-white/30 backdrop-blur-sm overflow-hidden">
          {/* Decorative Background Elements */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute -top-10 sm:-top-20 -right-10 sm:-right-20 w-20 sm:w-40 h-20 sm:h-40 bg-gradient-to-br from-blue-300 to-purple-300 rounded-full opacity-20 blur-3xl animate-pulse"></div>
            <div className="absolute -bottom-10 sm:-bottom-20 -left-10 sm:-left-20 w-20 sm:w-40 h-20 sm:h-40 bg-gradient-to-br from-orange-300 to-red-300 rounded-full opacity-20 blur-3xl animate-pulse animation-delay-2000"></div>
          </div>

          {/* Header - Mobile Responsive */}
          <div className="relative z-10 mb-6 lg:mb-8">
            {/* Mobile Layout (stacked) */}
            <div className="block lg:hidden text-center">
              <div className="flex items-center justify-center space-x-3 mb-4">
                <div className="bg-gradient-to-r from-orange-400 via-red-500 to-pink-500 p-2 sm:p-3 rounded-full shadow-lg">
                  <Flame className="w-5 h-5 sm:w-6 sm:h-6 text-white animate-bounce" />
                </div>
                <div className="inline-flex items-center space-x-1 sm:space-x-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white px-3 sm:px-4 py-2 rounded-full text-sm sm:text-base font-bold shadow-lg animate-pulse">
                  <TrendingUp className="w-4 h-4" />
                  <span className="hidden sm:inline">🎯 Hot Deals</span>
                  <span className="sm:hidden">🎯 Hot</span>
                </div>
              </div>
              <h3 className="text-xl sm:text-2xl lg:text-3xl font-black text-slate-900 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
                🔥 Featured Products
              </h3>
              <p className="text-sm sm:text-base lg:text-lg font-medium text-slate-600 px-2">
                <span className="hidden sm:inline">
                  Most popular items • Limited stock • Best sellers
                </span>
                <span className="sm:hidden">Most popular • Limited stock</span>
              </p>
            </div>

            {/* Desktop Layout (side by side) */}
            <div className="hidden lg:flex items-center justify-between">
              <div className="flex items-center space-x-6">
                <div className="bg-gradient-to-r from-orange-400 via-red-500 to-pink-500 p-4 rounded-full shadow-lg">
                  <Flame className="w-8 h-8 text-white animate-bounce" />
                </div>
                <div>
                  <h3 className="text-4xl font-black text-slate-900 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
                    🔥 Featured Products
                  </h3>
                  <p className="text-lg font-medium text-slate-600">
                    Most popular items • Limited stock • Best sellers
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white px-6 py-3 rounded-full text-lg font-bold shadow-lg animate-pulse">
                  <TrendingUp className="w-5 h-5" />
                  <span>🎯 Hot Deals</span>
                </div>
              </div>
            </div>
          </div>

          {/* Products Grid - Enhanced Mobile Responsive */}
          <div className="relative z-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
            {featuredProducts.map((product, index) => (
              <FeaturedProductCard
                key={product.id}
                product={product}
                index={index}
              />
            ))}
          </div>

          {/* View All Button */}
          <div className="relative z-10 mt-8 sm:mt-10 lg:mt-12 text-center">
            <button className="inline-flex items-center space-x-3 bg-gradient-to-r from-indigo-500 via-blue-500 to-cyan-500 hover:from-indigo-600 hover:via-blue-600 hover:to-cyan-600 text-white font-bold py-3 sm:py-4 lg:py-5 px-6 sm:px-8 lg:px-10 rounded-full transition-all duration-300 transform hover:scale-105 shadow-xl hover:shadow-2xl text-base sm:text-lg lg:text-xl">
              <span>View All Products</span>
              <div className="w-2 h-2 sm:w-3 sm:h-3 bg-white rounded-full animate-bounce animation-delay-1000"></div>
              <div className="w-2 h-2 sm:w-3 sm:h-3 bg-white rounded-full animate-bounce animation-delay-2000"></div>
              <div className="w-2 h-2 sm:w-3 sm:h-3 bg-white rounded-full animate-bounce animation-delay-3000"></div>
            </button>
          </div>
        </div>
      </div>
    );
  }
);

FeaturedProducts.displayName = "FeaturedProducts";

export default FeaturedProducts;
