import { useState, useEffect, memo, useCallback } from "react";
import {
  Star,
  ShoppingCart,
  Heart,
  Package,
  Flame,
  TrendingUp,
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

    const FeaturedProductCard = memo(
      ({ product, index }: { product: Product; index: number }) => {
        const [isLiked, setIsLiked] = useState(false);
        const [isAddingToCart, setIsAddingToCart] = useState(false);

        const toggleLike = useCallback(() => {
          setIsLiked((prev) => !prev);
          if (!isLiked) {
            toast.success("Added to wishlist", {
              position: "bottom-right",
              autoClose: 2000,
              hideProgressBar: false,
              className:
                "!bg-white !text-slate-900 !border !border-pink-200 !rounded-lg !shadow-lg !min-h-12 !text-sm",
              progressClassName: "!bg-pink-500",
            });
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
            className="group relative bg-white rounded-lg shadow-md hover:shadow-lg transition-transform duration-200 overflow-hidden border border-transparent hover:border-slate-200 transform hover:-translate-y-1"
          >
            {/* Badge */}
            <div className="absolute top-3 left-3 z-10">
              <div className="bg-yellow-500 text-white px-2 py-1 rounded text-xs font-semibold">
                {badges[index % badges.length]}
              </div>
            </div>

            {/* Stock Badge */}
            {product.quantity_in_stock < 10 && (
              <div className="absolute top-3 right-3 z-10">
                <div className="bg-red-600 text-white px-2 py-1 rounded text-xs font-semibold">
                  Only {product.quantity_in_stock} left
                </div>
              </div>
            )}

            {/* Wishlist Button */}
            <button
              onClick={toggleLike}
              className={`absolute top-3 right-3 z-20 p-1 rounded-full backdrop-blur-sm transition-colors duration-150 ${
                isLiked
                  ? "bg-red-600 text-white"
                  : "bg-white text-slate-600 border border-slate-100"
              }`}
              aria-label="Add to wishlist"
            >
              <Heart className="w-4 h-4" />
            </button>

            {/* Product Image */}
            <div
              className="relative overflow-hidden cursor-pointer"
              onClick={handleQuickViewClick}
            >
              <OptimizedImage
                src={product.image_url}
                alt={product.name}
                className="w-full h-44 sm:h-48 object-cover transition-transform duration-300 group-hover:scale-105"
                fallbackClassName="w-full h-44 sm:h-48"
                onClick={handleQuickViewClick}
                priority={index < 2}
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              />
              {/* Quick View Overlay (subtle) */}
              <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleQuickViewClick();
                  }}
                  className="bg-white text-slate-900 px-3 py-1 rounded-md text-sm font-medium"
                >
                  Quick View
                </button>
              </div>
            </div>

            {/* Product Info */}
            <div className="p-4 space-y-2">
              <h4 className="text-sm sm:text-base font-semibold text-slate-900 line-clamp-2">
                {product.name}
              </h4>

              <p className="text-xs sm:text-sm text-slate-600 inline-block bg-slate-50 px-2 py-1 rounded">
                {product.category}
              </p>

              <div className="flex items-center space-x-2">
                <div className="flex space-x-1">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className="w-3 h-3 sm:w-4 sm:h-4 text-yellow-500"
                    />
                  ))}
                </div>
                <span className="text-xs text-slate-600">(4.9)</span>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <div className="text-lg sm:text-xl font-extrabold text-slate-900">
                    KSH {product.selling_price?.toLocaleString()}
                  </div>
                  {product.buying_price &&
                    product.buying_price < product.selling_price && (
                      <div className="text-xs text-slate-500 line-through">
                        KSH {product.buying_price.toLocaleString()}
                      </div>
                    )}
                  <div className="text-xs text-slate-500 flex items-center mt-1">
                    <Package className="w-3 h-3 mr-1" />
                    Stock: {product.quantity_in_stock}
                  </div>
                </div>
              </div>

              <button
                onClick={handleAddToCartClick}
                disabled={isAddingToCart}
                className={`w-full font-medium py-2 px-3 rounded-md transition-colors duration-150 flex items-center justify-center space-x-2 ${
                  isAddingToCart
                    ? "bg-slate-300 text-slate-700 cursor-not-allowed"
                    : "bg-blue-600 text-white hover:bg-blue-700"
                }`}
              >
                <ShoppingCart className="w-4 h-4" />
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
            <button className="inline-flex items-center space-x-3 bg-blue-600 text-white font-medium py-2 px-4 rounded-md hover:bg-blue-700 transition-colors duration-150">
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
