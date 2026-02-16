import { memo, useCallback, useState } from "react";
import {
  Star,
  ShoppingCart,
  Heart,
  Share2,
  ZoomIn,
  Package,
  Truck,
  Shield,
  RotateCcw,
  Plus,
  Minus,
} from "lucide-react";
import { toast } from "react-toastify";
import type { Product } from "../types";
import Dialog from "./ecommerce/Dialog";
import Button from "./ecommerce/Button";
import Badge from "./ecommerce/Badge";
import Tooltip from "./ecommerce/Tooltip";
import Alert from "./ecommerce/Alert";
import Tabs, { Tab } from "./ecommerce/Tabs";

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
    const [activeTab, setActiveTab] = useState("details");

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
          text: `Check out ${product.name} at Horumar`,
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
        isLiked ? "Removed from wishlist" : "Added to wishlist! ❤️",
      );
    }, [isLiked]);

    if (!isOpen || !product) return null;

    const tabs: Tab[] = [
      {
        id: "details",
        label: "Details",
        content: (
          <div className="space-y-3 text-sm">
            {product.description && (
              <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                {product.description}
              </p>
            )}
            <div className="grid grid-cols-2 gap-3 mt-4">
              <div className="flex flex-col">
                <span className="text-slate-600 dark:text-slate-400 text-xs">
                  Category
                </span>
                <span className="font-semibold text-slate-900 dark:text-white">
                  {product.category}
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-slate-600 dark:text-slate-400 text-xs">
                  Product ID
                </span>
                <span className="font-semibold text-slate-900 dark:text-white">
                  {product.product_id}
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-slate-600 dark:text-slate-400 text-xs">
                  Stock
                </span>
                <span className="font-semibold text-slate-900 dark:text-white">
                  {product.quantity_in_stock} units
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-slate-600 dark:text-slate-400 text-xs">
                  Status
                </span>
                <Badge
                  variant={product.quantity_in_stock > 0 ? "success" : "danger"}
                  size="sm"
                >
                  {product.quantity_in_stock > 0 ? "In Stock" : "Out of Stock"}
                </Badge>
              </div>
            </div>
          </div>
        ),
      },
      {
        id: "shipping",
        label: "Shipping",
        icon: <Truck className="w-4 h-4" />,
        content: (
          <div className="space-y-3">
            <Alert variant="info">
              <strong>Free shipping</strong> on orders over $50
            </Alert>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <Truck className="w-4 h-4 text-violet-600" />
                <span className="text-slate-700 dark:text-slate-300">
                  Standard delivery: 3-5 business days
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Package className="w-4 h-4 text-violet-600" />
                <span className="text-slate-700 dark:text-slate-300">
                  Express delivery available at checkout
                </span>
              </div>
            </div>
          </div>
        ),
      },
      {
        id: "returns",
        label: "Returns",
        icon: <RotateCcw className="w-4 h-4" />,
        content: (
          <div className="space-y-3">
            <div className="space-y-2 text-sm text-slate-700 dark:text-slate-300">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-emerald-600" />
                <span>30-day return policy</span>
              </div>
              <div className="flex items-center gap-2">
                <RotateCcw className="w-4 h-4 text-emerald-600" />
                <span>Free returns on eligible items</span>
              </div>
              <p className="mt-3 pl-6">
                Items must be unused and in original packaging. Return shipping
                costs may apply.
              </p>
            </div>
          </div>
        ),
      },
    ];

    return (
      <Dialog
        isOpen={isOpen}
        onClose={onClose}
        size="xl"
        showCloseButton={true}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 md:gap-8">
          {/* Left Column - Product Image */}
          <div className="space-y-3 sm:space-y-4">
            <div className="relative group">
              {product.image_url ? (
                <div
                  className={`relative overflow-hidden rounded-xl sm:rounded-2xl bg-slate-50 dark:bg-slate-800 cursor-zoom-in transition-all touch-manipulation ${
                    imageZoomed ? "transform scale-105" : ""
                  }`}
                  onClick={() => setImageZoomed(!imageZoomed)}
                >
                  <img
                    src={product.image_url}
                    alt={product.name}
                    className="w-full h-64 sm:h-80 md:h-96 object-contain p-4 sm:p-6"
                  />
                  <Tooltip content="Click to zoom" position="bottom">
                    <div className="absolute top-4 right-4 bg-white/90 dark:bg-slate-700/90 p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
                      <ZoomIn className="w-4 h-4 text-slate-700 dark:text-slate-300" />
                    </div>
                  </Tooltip>
                </div>
              ) : (
                <div className="w-full h-96 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center">
                  <Package className="w-20 h-20 text-slate-400" />
                </div>
              )}

              {/* Badges */}
              <div className="absolute top-2 left-2 sm:top-4 sm:left-4 flex flex-col gap-1.5 sm:gap-2">
                {product.featured && (
                  <Badge variant="warning" size="md" className="shadow-lg">
                    <Star className="w-3 h-3 fill-current mr-1" />
                    Featured
                  </Badge>
                )}
                {product.quantity_in_stock > 0 &&
                  product.quantity_in_stock <= 5 && (
                    <Badge variant="danger" size="sm">
                      Only {product.quantity_in_stock} left
                    </Badge>
                  )}
              </div>
            </div>

            {/* Action Icons - Larger touch targets for mobile */}
            <div className="flex gap-2">
              <Tooltip
                content={isLiked ? "Remove from wishlist" : "Add to wishlist"}
              >
                <button
                  onClick={toggleLike}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 sm:py-3 px-3 sm:px-4 rounded-xl font-medium transition-all min-h-[48px] touch-manipulation ${
                    isLiked
                      ? "bg-red-50 dark:bg-red-900/20 text-red-600 border-2 border-red-200 dark:border-red-800"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-2 border-slate-200 dark:border-slate-700 hover:border-red-200 dark:hover:border-red-800 active:bg-slate-200 dark:active:bg-slate-700"
                  }`}
                >
                  <Heart
                    className={`w-5 h-5 ${isLiked ? "fill-current" : ""}`}
                  />
                  <span className="text-sm font-semibold">Wishlist</span>
                </button>
              </Tooltip>

              <Tooltip content="Share product">
                <button
                  onClick={handleShare}
                  className="flex-1 flex items-center justify-center gap-2 py-3 sm:py-3 px-3 sm:px-4 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl hover:bg-violet-50 dark:hover:bg-violet-900/20 active:bg-violet-100 dark:active:bg-violet-900/30 transition-all font-medium border-2 border-slate-200 dark:border-slate-700 hover:border-violet-200 dark:hover:border-violet-800 min-h-[48px] touch-manipulation"
                >
                  <Share2 className="w-5 h-5" />
                  <span className="text-sm font-semibold">Share</span>
                </button>
              </Tooltip>
            </div>
          </div>

          {/* Right Column - Product Details */}
          <div className="space-y-4 sm:space-y-6">
            {/* Header */}
            <div>
              <Badge variant="purple" size="sm" className="mb-2 sm:mb-3">
                {product.category}
              </Badge>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mb-2 leading-tight">
                {product.name}
              </h1>

              {/* Rating */}
              <div className="flex items-center gap-2">
                <div className="flex">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className="w-4 h-4 fill-amber-400 text-amber-400"
                    />
                  ))}
                </div>
                <span className="text-sm text-slate-600 dark:text-slate-400">
                  4.8 (142 reviews)
                </span>
              </div>
            </div>

            {/* Price */}
            <div className="bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-900/20 dark:to-yellow-900/20 p-4 sm:p-4 rounded-xl border border-amber-200 dark:border-amber-800">
              <div className="flex items-baseline gap-2 sm:gap-3">
                <span className="text-3xl sm:text-4xl font-bold text-amber-600 dark:text-amber-400">
                  KES {product.selling_price.toLocaleString()}
                </span>
                {product.buying_price && (
                  <>
                    <span className="text-lg text-slate-500 line-through">
                      KES {(product.selling_price * 1.3).toLocaleString()}
                    </span>
                    <Badge variant="danger" size="sm">
                      Save 30%
                    </Badge>
                  </>
                )}
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                Tax included • Free shipping over KES 2,000
              </p>
            </div>

            {/* Stock Status */}
            {product.quantity_in_stock > 0 ? (
              <Alert variant="success">
                <div className="flex items-center justify-between">
                  <span>
                    <strong>In Stock</strong> - {product.quantity_in_stock}{" "}
                    units available
                  </span>
                </div>
              </Alert>
            ) : (
              <Alert variant="error">
                <strong>Out of Stock</strong> - Get notified when available
              </Alert>
            )}

            {/* Quantity Selector - Larger for mobile */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
                Quantity
              </label>
              <div className="flex items-center gap-3">
                <div className="flex items-center bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-xl">
                  <Tooltip content="Decrease">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="p-3 sm:p-3 hover:bg-slate-100 dark:hover:bg-slate-700 active:bg-slate-200 dark:active:bg-slate-600 transition-colors min-w-[48px] min-h-[48px] touch-manipulation"
                    >
                      <Minus className="w-5 h-5 sm:w-4 sm:h-4 text-slate-700 dark:text-slate-300" />
                    </button>
                  </Tooltip>
                  <span className="px-4 sm:px-6 py-2 font-bold text-xl sm:text-lg text-slate-900 dark:text-white min-w-[60px] text-center">
                    {quantity}
                  </span>
                  <Tooltip content="Increase">
                    <button
                      onClick={() =>
                        setQuantity(
                          Math.min(product.quantity_in_stock, quantity + 1),
                        )
                      }
                      disabled={quantity >= product.quantity_in_stock}
                      className="p-3 sm:p-3 hover:bg-slate-100 dark:hover:bg-slate-700 active:bg-slate-200 dark:active:bg-slate-600 transition-colors disabled:opacity-50 min-w-[48px] min-h-[48px] touch-manipulation"
                    >
                      <Plus className="w-5 h-5 sm:w-4 sm:h-4 text-slate-700 dark:text-slate-300" />
                    </button>
                  </Tooltip>
                </div>
                <span className="text-sm text-slate-600 dark:text-slate-400">
                  Max: {product.quantity_in_stock}
                </span>
              </div>
            </div>

            {/* Add to Cart Button - Larger for mobile */}
            <Button
              onClick={handleAddToCart}
              disabled={product.quantity_in_stock === 0}
              variant="primary"
              size="lg"
              fullWidth
              className="!py-4 !text-base sm:!text-lg !min-h-[56px] touch-manipulation font-bold"
            >
              <ShoppingCart className="w-5 h-5" />
              Add to Cart • KES{" "}
              {(product.selling_price * quantity).toLocaleString()}
            </Button>

            {/* Tabs for Additional Info - Better spacing on mobile */}
            <div className="pt-2 sm:pt-4">
              <Tabs
                tabs={tabs}
                activeTab={activeTab}
                onChange={setActiveTab}
                variant="underline"
              />
            </div>
          </div>
        </div>
      </Dialog>
    );
  },
);

ProductQuickView.displayName = "ProductQuickView";

export default ProductQuickView;
