import { memo, useState, useCallback } from "react";
import { ShoppingCart, Heart, Star } from "lucide-react";
import OptimizedImage from "../OptimizedImage";
import Badge from "./Badge";
import Button from "./Button";
import type { Product } from "../../types";
import compactToast from "../../utils/compactToast";

interface ProductCardProps {
  product: Product;
  onAddToCart: (product: Product) => void;
  onQuickView?: (product: Product) => void;
  index?: number;
}

const ProductCardEcommerce = memo(
  ({ product, onAddToCart, onQuickView, index = 0 }: ProductCardProps) => {
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
    const isLowStock =
      product.quantity_in_stock <= product.reorder_level && !isOutOfStock;

    const discount = 0; // Calculate discount if applicable
    const hasDiscount = discount > 0;

    return (
      <div
        data-product-id={product.id}
        className="group relative bg-white dark:bg-slate-800 rounded-xl sm:rounded-2xl shadow-md hover:shadow-2xl hover:shadow-amber-500/20 transition-all duration-300 overflow-hidden border border-slate-100 dark:border-slate-700 hover:border-amber-400 dark:hover:border-amber-500 active:scale-95 sm:hover:-translate-y-1 flex flex-col h-full"
      >
        {/* Product Image Container */}
        <div
          className="relative overflow-hidden cursor-pointer bg-gradient-to-br from-slate-50 to-amber-50 dark:from-slate-700 dark:to-slate-600 aspect-square touch-manipulation"
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

          {/* Overlay on Hover - Hidden on mobile for better performance */}
          <div className="hidden sm:flex absolute inset-0 bg-gradient-to-t from-black/60 via-black/0 to-black/0 opacity-0 group-hover:opacity-100 transition-all duration-300  items-end justify-center pb-6">
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleQuickView();
              }}
              className="bg-white dark:bg-slate-900 text-amber-600 dark:text-amber-400 px-6 py-3 rounded-full font-bold text-sm transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300 shadow-xl hover:bg-amber-50 dark:hover:bg-slate-800 min-w-[120px]"
            >
              Quick View
            </button>
          </div>

          {/* Wishlist Button - Larger touch target for mobile */}
          <button
            onClick={toggleLike}
            className={`absolute top-2 right-2 sm:top-3 sm:right-3 w-11 h-11 sm:w-10 sm:h-10 rounded-full transition-all duration-300 flex items-center justify-center shadow-lg backdrop-blur-sm touch-manipulation ${
              isLiked
                ? "bg-rose-500 text-white scale-110"
                : "bg-white/90 dark:bg-slate-800/90 text-slate-600 dark:text-slate-300 hover:bg-amber-100 dark:hover:bg-amber-900 hover:text-amber-600 active:scale-95 sm:hover:scale-110"
            }`}
          >
            <Heart className={`w-5 h-5 ${isLiked ? "fill-current" : ""}`} />
          </button>

          {/* Badges */}
          <div className="absolute top-2 left-2 sm:top-3 sm:left-3 flex flex-col gap-1.5 sm:gap-2">
            {product.featured && (
              <Badge variant="warning" size="sm" className="shadow-lg">
                <Star className="w-3 h-3 fill-current mr-1" />
                Featured
              </Badge>
            )}
            {hasDiscount && (
              <Badge variant="danger" size="sm" className="shadow-lg">
                -{discount}%
              </Badge>
            )}
            {isLowStock && (
              <Badge variant="warning" size="sm" className="shadow-lg">
                Only {product.quantity_in_stock} left
              </Badge>
            )}
          </div>

          {/* Out of Stock Overlay */}
          {isOutOfStock && (
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center">
              <Badge variant="danger" size="lg" className="shadow-xl">
                Out of Stock
              </Badge>
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="p-3 sm:p-4 flex flex-col flex-grow">
          {/* Category */}
          <div className="mb-2">
            <span className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
              {product.category}
            </span>
          </div>

          {/* Product Name */}
          <h3
            onClick={handleQuickView}
            className="font-bold text-slate-900 dark:text-white text-base sm:text-base leading-snug mb-2 line-clamp-2 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors cursor-pointer touch-manipulation"
          >
            {product.name}
          </h3>

          {/* Description - Hidden on small mobile for cleaner look */}
          {product.description && (
            <p className="hidden sm:block text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mb-3">
              {product.description}
            </p>
          )}

          {/* Price Section */}
          <div className="mt-auto pt-2 sm:pt-3 space-y-3">
            <div className="flex items-baseline gap-2">
              <span className="text-lg sm:text-xl md:text-2xl font-bold bg-gradient-to-r from-amber-600 to-yellow-600 bg-clip-text text-transparent">
                KES {product.selling_price.toLocaleString()}
              </span>
              {hasDiscount && (
                <span className="text-sm text-slate-400 line-through">
                  KES {(product.selling_price * 1.2).toLocaleString()}
                </span>
              )}
            </div>

            {/* Stock Info */}
            <div className="flex items-center justify-between text-xs">
              <span
                className={`font-medium ${
                  isOutOfStock
                    ? "text-red-500"
                    : isLowStock
                    ? "text-orange-500"
                    : "text-emerald-500"
                }`}
              >
                {isOutOfStock
                  ? "Out of stock"
                  : `${product.quantity_in_stock} in stock`}
              </span>
              {/* Rating placeholder */}
              <div className="flex items-center gap-1 text-amber-500">
                <Star className="w-3 h-3 fill-current" />
                <span className="text-slate-600 dark:text-slate-400">4.5</span>
              </div>
            </div>

            {/* Add to Cart Button - Larger for mobile */}
            <Button
              onClick={handleAddToCart}
              disabled={isOutOfStock || isAddingToCart}
              variant={isAddingToCart ? "primary" : "primary"}
              size="md"
              fullWidth
              isLoading={isAddingToCart}
              className="!gap-2 !min-h-[44px] sm:!min-h-[40px] touch-manipulation font-semibold"
            >
              <ShoppingCart className="w-4 h-4" />
              <span className="text-sm sm:text-base">
                {isOutOfStock
                  ? "Unavailable"
                  : isAddingToCart
                  ? "Adding..."
                  : "Add to Cart"}
              </span>
            </Button>
          </div>
        </div>
      </div>
    );
  },
);

ProductCardEcommerce.displayName = "ProductCardEcommerce";

export default ProductCardEcommerce;
