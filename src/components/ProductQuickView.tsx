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
      <div className="fixed inset-0 bg-slate-900/70 z-50 flex items-center justify-center p-4">
        <div className="bg-white border border-slate-200 shadow-xl rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-slate-200 bg-gradient-to-br from-amber-50 to-white">
            <h2 className="text-2xl font-bold text-slate-900">Quick View</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-amber-100 rounded-full transition-colors text-slate-700"
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
                    className={`relative overflow-hidden rounded-2xl cursor-zoom-in bg-slate-50/30 ${
                      imageZoomed ? "transform scale-150" : ""
                    } transition-transform duration-300`}
                    onClick={() => setImageZoomed(!imageZoomed)}
                  >
                    <img
                      src={product.image_url}
                      alt={product.name}
                      className="w-full h-64 sm:h-72 md:h-80 object-contain p-3"
                    />
                    <div className="absolute top-3 right-3 bg-white/90 border border-slate-200 rounded-full p-2 shadow-sm">
                      <ZoomIn className="w-4 h-4 text-slate-700" />
                    </div>
                  </div>
                ) : (
                  <div className="w-full h-64 sm:h-72 md:h-80 bg-slate-50 rounded-2xl flex items-center justify-center border border-slate-200">
                    <Package className="w-16 h-16 text-slate-400" />
                  </div>
                )}

                {/* Featured Badge */}
                {product.featured && (
                  <div className="absolute top-3 left-3 bg-gradient-to-r from-yellow-400 to-yellow-500 text-slate-900 px-3 py-1 rounded-full text-sm font-bold flex items-center space-x-1">
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
                    className="w-16 h-16 bg-white rounded-xl border-2 border-slate-200 hover:border-amber-400 cursor-pointer transition-colors"
                  >
                    <div className="w-full h-full bg-slate-50/30 rounded-md"></div>
                  </div>
                ))}
              </div>
            </div>

            {/* Product Details */}
            <div className="space-y-6">
              <div>
                <span className="text-sm font-semibold text-amber-700 bg-gradient-to-br from-amber-50 to-white border border-amber-300 px-2 py-1 rounded-full">
                  {product.category}
                </span>
                <h1 className="text-3xl font-bold text-slate-900 mt-3 mb-2">
                  {product.name}
                </h1>

                {/* Description */}
                {product.description && (
                  <p className="text-slate-700 text-sm leading-relaxed mb-4 bg-white p-3 rounded-xl border-l-4 border-amber-500">
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
                  <span className="text-sm text-slate-600">
                    (4.8) • 142 reviews
                  </span>
                </div>
              </div>

              {/* Price */}
              <div className="space-y-2">
                <div className="flex items-baseline space-x-3">
                  <span className="text-3xl font-black text-transparent bg-gradient-to-r from-amber-600 to-amber-700 bg-clip-text">
                    KES {product.selling_price.toLocaleString()}
                  </span>
                  <span className="text-lg text-slate-500 line-through">
                    KES {(product.selling_price * 1.2).toLocaleString()}
                  </span>
                  <span className="bg-red-50 border border-red-300 text-red-700 px-2 py-1 rounded-full text-sm font-bold">
                    Save 20%
                  </span>
                </div>
                <p className="text-sm text-slate-600">
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
                      ? "bg-amber-500"
                      : "bg-red-500"
                  }`}
                ></div>
                <span className="font-medium text-slate-700">
                  {product.quantity_in_stock > 10
                    ? "In Stock"
                    : product.quantity_in_stock > 0
                    ? `Only ${product.quantity_in_stock} left`
                    : "Out of Stock"}
                </span>
              </div>

              {/* Quantity Selector */}
              <div className="space-y-3">
                <label className="block text-sm font-medium text-slate-700">
                  Quantity
                </label>
                <div className="flex items-center space-x-3">
                  <div className="flex items-center border border-slate-200 bg-white rounded-lg">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="p-2 hover:bg-amber-50 transition-colors text-slate-700"
                    >
                      -
                    </button>
                    <span className="px-4 py-2 font-medium text-slate-900">
                      {quantity}
                    </span>
                    <button
                      onClick={() =>
                        setQuantity(
                          Math.min(product.quantity_in_stock, quantity + 1)
                        )
                      }
                      className="p-2 hover:bg-amber-50 transition-colors text-slate-700"
                    >
                      +
                    </button>
                  </div>
                  <span className="text-sm text-slate-600">
                    {product.quantity_in_stock} available
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3">
                <button
                  onClick={handleAddToCart}
                  disabled={product.quantity_in_stock === 0}
                  className="w-full bg-gradient-to-r from-amber-500 to-amber-600 text-white py-4 px-6 rounded-2xl hover:from-amber-600 hover:to-amber-700 transition-all duration-300 font-bold text-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 shadow-lg shadow-amber-300"
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
                    className={`flex-1 py-3 px-4 rounded-2xl font-medium transition-all duration-300 flex items-center justify-center space-x-2 ${
                      isLiked
                        ? "bg-red-50 text-red-700 border-2 border-red-300"
                        : "bg-white text-slate-700 border-2 border-slate-200 hover:bg-red-50 hover:text-red-700 hover:border-red-300"
                    }`}
                  >
                    <Heart
                      className={`w-4 h-4 ${isLiked ? "fill-current" : ""}`}
                    />
                    <span>{isLiked ? "Loved" : "Add to Wishlist"}</span>
                  </button>

                  <button
                    onClick={handleShare}
                    className="flex-1 bg-white text-slate-700 py-3 px-4 rounded-2xl hover:bg-amber-50 transition-all duration-300 font-medium flex items-center justify-center space-x-2 border-2 border-slate-200 hover:border-amber-300"
                  >
                    <Share2 className="w-4 h-4" />
                    <span>Share</span>
                  </button>
                </div>
              </div>

              {/* Product Details */}
              <div className="space-y-4 pt-6 border-t border-slate-200">
                <h3 className="font-bold text-slate-900">Product Details</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-600">Category:</span>
                    <span className="font-medium text-slate-900">
                      {product.category}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Product ID:</span>
                    <span className="font-medium text-slate-900">
                      {product.product_id}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Availability:</span>
                    <span className="font-medium text-green-600">In Stock</span>
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
