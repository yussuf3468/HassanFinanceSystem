import { useState, useEffect, memo, useCallback } from "react";
import {
  Star,
  ShoppingCart,
  Heart,
  Package,
  Flame,
  TrendingUp,
} from "lucide-react";
import compactToast from "../utils/compactToast";
import { supabase } from "../lib/supabase";
import OptimizedImage from "./OptimizedImage";
import type { Product } from "../types";

interface FeaturedProductsProps {
  onAddToCart?: (product: Product) => void;
  onQuickView?: (product: Product) => void;
  onViewAllProducts?: () => void;
}

const FeaturedProducts = memo(
  ({ onAddToCart, onQuickView, onViewAllProducts }: FeaturedProductsProps) => {
    const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
      const fetchFeaturedProducts = async () => {
        try {
          const { data, error } = await supabase
            .from("products")
            .select("*")
            .gt("quantity_in_stock", 0)
            .order("quantity_in_stock", { ascending: true })
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
      "#1 Best Seller",
      "Hot Sale",
      "Customer Favorite",
      "Trending",
      "Limited Edition",
      "Award Winner",
      "New Arrival",
      "Premium Choice",
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

    const handleViewAllProducts = useCallback(() => {
      if (onViewAllProducts) {
        onViewAllProducts();
      } else {
        // Default behavior: scroll to products section or top of page
        const productsSection = document.getElementById("products-section");
        if (productsSection) {
          productsSection.scrollIntoView({ behavior: "smooth" });
        } else {
          // If no products section found, scroll to top
          window.scrollTo({ top: 0, behavior: "smooth" });
        }
      }
    }, [onViewAllProducts]);

    const FeaturedProductCard = memo(
      ({ product, index }: { product: Product; index: number }) => {
        const [isLiked, setIsLiked] = useState(false);
        const [isAddingToCart, setIsAddingToCart] = useState(false);

        const toggleLike = useCallback(() => {
          setIsLiked((prev) => !prev);
          if (!isLiked) {
            compactToast.addToWishlist();
          }
        }, [isLiked]);

        const handleAddToCartClick = useCallback(async () => {
          setIsAddingToCart(true);
          // small delay to show feedback
          await new Promise((resolve) => setTimeout(resolve, 250));
          handleAddToCart(product);
          setIsAddingToCart(false);
        }, [product, handleAddToCart]);

        const handleQuickViewClick = useCallback(() => {
          handleQuickView(product);
        }, [product, handleQuickView]);

        return (
          <div
            key={product.id}
            className="group relative bg-white rounded-2xl shadow-sm hover:shadow-lg transition-all duration-400 overflow-hidden border border-slate-100/60 backdrop-blur-sm"
          >
            {/* Minimal Badge */}
            <div className="absolute top-4 left-4 z-10">
              <div className="bg-amber-400/95 backdrop-blur-sm text-amber-900 px-3 py-1.5 rounded-full text-xs font-semibold shadow-sm">
                {badges[index % badges.length]}
              </div>
            </div>

            {/* Subtle Stock Badge */}
            {product.quantity_in_stock < 10 && (
              <div className="absolute top-4 right-16 z-10">
                <div className="bg-orange-500/90 backdrop-blur-sm text-white px-3 py-1.5 rounded-full text-xs font-medium shadow-sm">
                  Only {product.quantity_in_stock} left
                </div>
              </div>
            )}

            {/* Refined Wishlist Button */}
            <button
              onClick={toggleLike}
              className={`absolute top-4 right-4 z-20 w-10 h-10 rounded-full backdrop-blur-md transition-all duration-300 flex items-center justify-center ${
                isLiked
                  ? "bg-rose-500/90 text-white shadow-lg shadow-rose-500/25"
                  : "bg-white/80 text-slate-400 hover:bg-white/95 hover:text-rose-500 hover:shadow-md"
              }`}
              aria-label="Add to wishlist"
            >
              <Heart className={`w-4 h-4 ${isLiked ? "fill-current" : ""}`} />
            </button>

            {/* Elegant Product Image */}
            <div
              className="relative overflow-hidden cursor-pointer bg-gradient-to-br from-slate-50 to-slate-100"
              onClick={handleQuickViewClick}
            >
              <OptimizedImage
                src={product.image_url}
                alt={product.name}
                className="w-full h-44 sm:h-48 md:h-52 object-contain p-2 sm:p-3 transition-transform duration-700 ease-out group-hover:scale-105"
                fallbackClassName="w-full h-44 sm:h-48 md:h-52"
                onClick={handleQuickViewClick}
                priority={index < 2}
                preload={index < 4}
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              />
              {/* Elegant Quick View Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500 flex items-end justify-center pb-6">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleQuickViewClick();
                  }}
                  className="bg-white/95 backdrop-blur-md text-slate-800 px-6 py-2.5 rounded-full font-medium text-sm transform translate-y-4 group-hover:translate-y-0 transition-all duration-400 shadow-lg hover:shadow-xl border border-white/20"
                >
                  Quick View
                </button>
              </div>
            </div>

            {/* Elegant Product Info */}
            <div className="p-5 space-y-4">
              {/* Category Tag */}
              <div>
                <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                  {product.category}
                </span>
              </div>

              {/* Product Name */}
              <h4 className="text-sm sm:text-base font-semibold text-slate-900 line-clamp-2 leading-tight group-hover:text-slate-700 transition-colors duration-300">
                {product.name}
              </h4>

              {/* Refined Rating */}
              <div className="flex items-center space-x-2">
                <div className="flex space-x-0.5">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className="w-3 h-3 text-amber-400 fill-current"
                    />
                  ))}
                </div>
                <span className="text-xs text-slate-400">(4.9)</span>
              </div>

              {/* Price & Stock Info */}
              <div className="flex items-center justify-between">
                <div className="flex flex-col">
                  <div className="text-lg sm:text-xl font-light text-slate-900">
                    KES {product.selling_price?.toLocaleString()}
                  </div>
                  {product.buying_price &&
                    product.buying_price < product.selling_price && (
                      <div className="text-xs text-slate-400 line-through">
                        KES {product.buying_price.toLocaleString()}
                      </div>
                    )}
                  <div className="text-xs text-slate-400 flex items-center mt-1">
                    <Package className="w-3 h-3 mr-1.5" />
                    {product.quantity_in_stock} in stock
                  </div>
                </div>
              </div>

              {/* Refined Add to Cart Button */}
              <button
                onClick={handleAddToCartClick}
                disabled={isAddingToCart}
                className={`w-full font-medium py-3 px-4 rounded-xl transition-all duration-300 flex items-center justify-center space-x-2 ${
                  isAddingToCart
                    ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/25"
                    : "bg-slate-900 text-white hover:bg-slate-800 hover:shadow-lg hover:shadow-slate-900/25 active:bg-slate-700"
                }`}
              >
                <ShoppingCart
                  className={`w-4 h-4 ${isAddingToCart ? "animate-pulse" : ""}`}
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
          <div className="bg-white rounded-lg shadow p-4 sm:p-6">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-200 rounded mb-4" />
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="bg-white rounded shadow p-4">
                    <div className="h-32 bg-gray-200 rounded mb-3" />
                    <div className="h-4 bg-gray-200 rounded mb-2" />
                    <div className="h-6 bg-gray-200 rounded" />
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
        <div className="bg-white rounded-lg shadow p-4 sm:p-6 lg:p-8">
          <div className="mb-6 lg:mb-8">
            <div className="block lg:hidden text-center">
              <div className="flex items-center justify-center space-x-3 mb-4">
                <div className="bg-gray-100 p-2 rounded-full">
                  <Flame className="w-5 h-5 text-slate-700" />
                </div>
                <div className="inline-flex items-center space-x-2 bg-slate-100 text-slate-800 px-3 py-2 rounded-full text-sm font-medium">
                  <TrendingUp className="w-4 h-4" />
                  <span>Hot Deals</span>
                </div>
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-slate-900 mb-1">
                Featured Products
              </h3>
              <p className="text-sm text-slate-600">
                Popular items • Limited stock • Best sellers
              </p>
            </div>

            <div className="hidden lg:flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="bg-gray-100 p-3 rounded-full">
                  <Flame className="w-7 h-7 text-slate-700" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-slate-900 mb-1">
                    Featured Products
                  </h3>
                  <p className="text-sm text-slate-600">
                    Popular items • Limited stock • Best sellers
                  </p>
                </div>
              </div>
              <div>
                <div className="inline-flex items-center space-x-2 bg-slate-100 text-slate-800 px-4 py-2 rounded-full text-sm font-medium">
                  <TrendingUp className="w-4 h-4" />
                  <span>Hot Deals</span>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {featuredProducts.map((product, index) => (
              <FeaturedProductCard
                key={product.id}
                product={product}
                index={index}
              />
            ))}
          </div>

          <div className="mt-8 text-center">
            <button
              onClick={handleViewAllProducts}
              className="inline-flex items-center space-x-3 bg-blue-600 text-white font-medium py-2 px-4 rounded-md hover:bg-blue-700 transition-colors duration-150"
            >
              <span>View All Products</span>
            </button>
          </div>
        </div>
      </div>
    );
  }
);

FeaturedProducts.displayName = "FeaturedProducts";

export default FeaturedProducts;
