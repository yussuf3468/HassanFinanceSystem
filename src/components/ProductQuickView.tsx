import { memo, useCallback, useState } from "react";
import {
  X,
  Star,
  ShoppingCart,
  Heart,
  Share2,
  ZoomIn,
  Package,
} from "lucide-react";
import { toast } from "react-toastify";
import type { Product } from "../types";

interface ProductQuickViewProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  onAddToCart: (product: Product) => void;
}

const ProductQuickView = memo(
  ({ product, isOpen, onClose, onAddToCart }: ProductQuickViewProps) => {
    const [isLiked, setIsLiked] = useState(false);
    const [quantity, setQuantity] = useState(1);
    const [imageZoomed, setImageZoomed] = useState(false);

    const handleAddToCart = useCallback(() => {
      if (!product) return;

      for (let i = 0; i < quantity; i++) {
        onAddToCart(product);
      }

      toast.success(`Added ${quantity} ${product.name}(s) to cart!`, {
        position: "bottom-right",
        autoClose: 2000,
      });

      onClose();
    }, [product, quantity, onAddToCart, onClose]);

    const handleShare = useCallback(() => {
      if (!product) return;

      if (navigator.share) {
        navigator.share({
          title: product.name,
          text: `Check out ${product.name} at Hassan Muse BookShop`,
          url: window.location.href,
        });
      } else {
        navigator.clipboard.writeText(window.location.href);
        toast.success("Product link copied to clipboard!");
      }
    }, [product]);

    const toggleLike = useCallback(() => {
      setIsLiked((prev) => !prev);
      toast.success(
        isLiked ? "Removed from wishlist" : "Added to wishlist! ❤️"
      );
    }, [isLiked]);

    if (!isOpen || !product) return null;

    return (
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 backdrop-blur-2xl border border-white/20 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-white/20 bg-white/5 backdrop-blur-xl">
            <h2 className="text-2xl font-bold text-white">Quick View</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-full transition-colors text-white"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-6">
            {/* Product Image */}
            <div className="space-y-4">
              <div className="relative">
                {product.image_url ? (
                  <div
                    className={`relative overflow-hidden rounded-xl cursor-zoom-in bg-gradient-to-br from-white/5 to-white/10 ${
                      imageZoomed ? "transform scale-150" : ""
                    } transition-transform duration-300`}
                    onClick={() => setImageZoomed(!imageZoomed)}
                  >
                    <img
                      src={product.image_url}
                      alt={product.name}
                      className="w-full h-64 sm:h-72 md:h-80 object-contain p-3"
                    />
                    <div className="absolute top-3 right-3 bg-black/40 backdrop-blur-sm rounded-full p-2">
                      <ZoomIn className="w-4 h-4 text-white" />
                    </div>
                  </div>
                ) : (
                  <div className="w-full h-64 sm:h-72 md:h-80 bg-gradient-to-br from-white/5 to-white/10 rounded-xl flex items-center justify-center border border-white/20">
                    <Package className="w-16 h-16 text-slate-400" />
                  </div>
                )}

                {/* Featured Badge */}
                {product.featured && (
                  <div className="absolute top-3 left-3 bg-gradient-to-r from-yellow-400 to-yellow-500 text-white px-3 py-1 rounded-full text-sm font-bold flex items-center space-x-1">
                    <Star className="w-3 h-3 fill-current" />
                    <span>FEATURED</span>
                  </div>
                )}
              </div>

              {/* Product Gallery Thumbnails */}
              <div className="flex space-x-2">
                {[1, 2, 3].map((index) => (
                  <div
                    key={index}
                    className="w-16 h-16 bg-white/10 rounded-lg border-2 border-white/20 hover:border-purple-500 cursor-pointer transition-colors"
                  >
                    <div className="w-full h-full bg-gradient-to-br from-white/5 to-white/10 rounded-md"></div>
                  </div>
                ))}
              </div>
            </div>

            {/* Product Details */}
            <div className="space-y-6">
              <div>
                <span className="text-sm font-medium text-purple-300 bg-purple-500/20 border border-purple-500/30 px-2 py-1 rounded-full">
                  {product.category}
                </span>
                <h1 className="text-3xl font-bold text-white mt-3 mb-2">
                  {product.name}
                </h1>

                {/* Description */}
                {product.description && (
                  <p className="text-slate-300 text-sm leading-relaxed mb-4 bg-white/5 backdrop-blur-xl p-3 rounded-lg border-l-4 border-purple-500">
                    {product.description}
                  </p>
                )}

                {/* Rating */}
                <div className="flex items-center space-x-2">
                  <div className="flex items-center">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className="w-4 h-4 fill-yellow-400 text-yellow-400"
                      />
                    ))}
                  </div>
                  <span className="text-sm text-slate-300">
                    (4.8) • 142 reviews
                  </span>
                </div>
              </div>

              {/* Price */}
              <div className="space-y-2">
                <div className="flex items-baseline space-x-3">
                  <span className="text-3xl font-black text-transparent bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text">
                    KES {product.selling_price.toLocaleString()}
                  </span>
                  <span className="text-lg text-slate-400 line-through">
                    KES {(product.selling_price * 1.2).toLocaleString()}
                  </span>
                  <span className="bg-red-500/20 border border-red-500/30 text-red-300 px-2 py-1 rounded-full text-sm font-bold">
                    Save 20%
                  </span>
                </div>
                <p className="text-sm text-slate-400">
                  Including all taxes • Free shipping over KES 2,000
                </p>
              </div>

              {/* Stock Status */}
              <div className="flex items-center space-x-2">
                <div
                  className={`w-3 h-3 rounded-full ${
                    product.quantity_in_stock > 10
                      ? "bg-green-500"
                      : product.quantity_in_stock > 0
                      ? "bg-yellow-500"
                      : "bg-red-500"
                  }`}
                ></div>
                <span className="font-medium text-white">
                  {product.quantity_in_stock > 10
                    ? "In Stock"
                    : product.quantity_in_stock > 0
                    ? `Only ${product.quantity_in_stock} left`
                    : "Out of Stock"}
                </span>
              </div>

              {/* Quantity Selector */}
              <div className="space-y-3">
                <label className="block text-sm font-medium text-slate-300">
                  Quantity
                </label>
                <div className="flex items-center space-x-3">
                  <div className="flex items-center border border-white/20 bg-white/10 backdrop-blur-xl rounded-lg">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="p-2 hover:bg-white/10 transition-colors text-white"
                    >
                      -
                    </button>
                    <span className="px-4 py-2 font-medium text-white">
                      {quantity}
                    </span>
                    <button
                      onClick={() =>
                        setQuantity(
                          Math.min(product.quantity_in_stock, quantity + 1)
                        )
                      }
                      className="p-2 hover:bg-white/10 transition-colors text-white"
                    >
                      +
                    </button>
                  </div>
                  <span className="text-sm text-slate-400">
                    {product.quantity_in_stock} available
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3">
                <button
                  onClick={handleAddToCart}
                  disabled={product.quantity_in_stock === 0}
                  className="w-full bg-gradient-to-r from-purple-600 via-blue-600 to-purple-600 text-white py-4 px-6 rounded-xl hover:from-purple-700 hover:via-blue-700 hover:to-purple-700 transition-all duration-300 font-bold text-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 shadow-lg shadow-purple-500/25"
                >
                  <ShoppingCart className="w-5 h-5" />
                  <span>
                    Add to Cart • KES{" "}
                    {(product.selling_price * quantity).toLocaleString()}
                  </span>
                </button>

                <div className="flex space-x-3">
                  <button
                    onClick={toggleLike}
                    className={`flex-1 py-3 px-4 rounded-xl font-medium transition-all duration-300 flex items-center justify-center space-x-2 ${
                      isLiked
                        ? "bg-red-500/20 text-red-300 border-2 border-red-500/30"
                        : "bg-white/10 text-slate-300 border-2 border-white/20 hover:bg-red-500/20 hover:text-red-300 hover:border-red-500/30"
                    }`}
                  >
                    <Heart
                      className={`w-4 h-4 ${isLiked ? "fill-current" : ""}`}
                    />
                    <span>{isLiked ? "Loved" : "Add to Wishlist"}</span>
                  </button>

                  <button
                    onClick={handleShare}
                    className="flex-1 bg-white/10 text-slate-300 py-3 px-4 rounded-xl hover:bg-white/20 transition-all duration-300 font-medium flex items-center justify-center space-x-2 border-2 border-white/20"
                  >
                    <Share2 className="w-4 h-4" />
                    <span>Share</span>
                  </button>
                </div>
              </div>

              {/* Product Details */}
              <div className="space-y-4 pt-6 border-t border-white/20">
                <h3 className="font-bold text-white">Product Details</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Category:</span>
                    <span className="font-medium text-white">
                      {product.category}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Product ID:</span>
                    <span className="font-medium text-white">
                      {product.product_id}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Availability:</span>
                    <span className="font-medium text-green-400">In Stock</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
);

ProductQuickView.displayName = "ProductQuickView";

export default ProductQuickView;
