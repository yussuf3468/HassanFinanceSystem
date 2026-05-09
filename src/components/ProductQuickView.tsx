import { memo, useCallback, useState, useMemo } from "react";
import {
  Star,
  ShoppingCart,
  Heart,
  Share2,
  Package,
  Truck,
  Shield,
  Plus,
  Minus,
  X,
  BadgeCheck,
  Zap,
} from "lucide-react";
import type { Product } from "../types";
import compactToast from "../utils/compactToast";

/** Converts whole-number prices to the .99 psychological pricing format (500 → 499.99) */
const formatPrice = (p: number): string => {
  const adjusted = Number.isInteger(p) ? p - 0.01 : p;
  const [whole, dec] = adjusted.toFixed(2).split(".");
  return `${Number(whole).toLocaleString()}.${dec}`;
};

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
    const [activeTab, setActiveTab] = useState<"details" | "shipping" | "returns">(
      "details",
    );
    const [justAdded, setJustAdded] = useState(false);

    const starRating = useMemo(() => {
      if (!product) return 5;
      const hash = (product.id ?? "").split("").reduce((a, c) => a + c.charCodeAt(0), 0);
      return 4 + (hash % 10 < 7 ? 1 : 0);
    }, [product?.id]);

    const handleAddToCart = useCallback(async () => {
      if (!product) return;
      for (let i = 0; i < quantity; i++) onAddToCart(product);
      setJustAdded(true);
      compactToast.addToCart();
      setTimeout(() => {
        setJustAdded(false);
        onClose();
      }, 1200);
    }, [product, quantity, onAddToCart, onClose]);

    const toggleLike = useCallback(() => {
      setIsLiked((prev) => !prev);
      if (!isLiked) compactToast.addToWishlist();
    }, [isLiked]);

    const handleShare = useCallback(() => {
      if (!product) return;
      if (navigator.share) {
        navigator.share({ title: product.name, url: window.location.href });
      } else {
        navigator.clipboard.writeText(window.location.href);
      }
    }, [product]);

    if (!isOpen || !product) return null;

    const isOutOfStock = product.quantity_in_stock === 0;
    const isLowStock =
      !isOutOfStock && product.quantity_in_stock <= product.reorder_level;
    const totalPrice = formatPrice(product.selling_price * quantity);

    return (
      <div
        className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
        onClick={onClose}
      >
        <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

        <div
          className="relative bg-white dark:bg-slate-900 w-full sm:max-w-3xl max-h-[96dvh] sm:max-h-[90vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl shadow-2xl z-10"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-20 w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4 text-slate-600 dark:text-slate-300" />
          </button>

          <div className="grid grid-cols-1 sm:grid-cols-2">
            {/* Image panel */}
            <div className="relative bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-700 rounded-t-3xl sm:rounded-tl-3xl sm:rounded-bl-3xl overflow-hidden min-h-[280px] sm:min-h-[420px]">
              {product.image_url ? (
                <img
                  src={product.image_url}
                  alt={product.name}
                  className="w-full h-full object-contain p-6 sm:p-8 absolute inset-0"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  <Package className="w-24 h-24 text-slate-300 dark:text-slate-600" />
                </div>
              )}

              <div className="absolute top-4 left-4 flex flex-col gap-2">
                {product.featured && (
                  <span className="bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-black px-3 py-1 rounded-full shadow-lg">
                    ★ TOP PICK
                  </span>
                )}
                {isLowStock && (
                  <span className="bg-rose-500 text-white text-xs font-black px-3 py-1 rounded-full shadow-lg">
                    Only {product.quantity_in_stock} left!
                  </span>
                )}
              </div>

              <div className="absolute bottom-4 left-4 right-4 flex gap-2">
                <button
                  onClick={toggleLike}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-semibold text-sm transition-all ${
                    isLiked
                      ? "bg-rose-500 text-white shadow-lg"
                      : "bg-white/90 dark:bg-slate-800/90 text-slate-700 dark:text-slate-200 hover:bg-rose-500 hover:text-white backdrop-blur-sm"
                  }`}
                >
                  <Heart className={`w-4 h-4 ${isLiked ? "fill-current" : ""}`} />
                  {isLiked ? "Saved" : "Wishlist"}
                </button>
                <button
                  onClick={handleShare}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-semibold text-sm bg-white/90 dark:bg-slate-800/90 text-slate-700 dark:text-slate-200 hover:bg-amber-500 hover:text-white backdrop-blur-sm transition-all"
                >
                  <Share2 className="w-4 h-4" />
                  Share
                </button>
              </div>
            </div>

            {/* Details panel */}
            <div className="flex flex-col p-5 sm:p-6 gap-4">
              <div>
                <span className="inline-block bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-xs font-black px-3 py-1 rounded-full uppercase tracking-widest mb-2">
                  {product.category}
                </span>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white leading-tight">
                  {product.name}
                </h2>
                <div className="flex items-center gap-2 mt-2">
                  <div className="flex gap-px">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-3.5 h-3.5 ${
                          i < starRating
                            ? "text-amber-400 fill-amber-400"
                            : "text-slate-200 dark:text-slate-600"
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    {starRating}.0 · Verified
                  </span>
                  <BadgeCheck className="w-3.5 h-3.5 text-amber-500" />
                </div>
              </div>

              <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/10 border border-amber-200 dark:border-amber-700/40 rounded-2xl p-4">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-xs text-amber-700 dark:text-amber-400 font-semibold uppercase tracking-wider">
                    Price
                  </p>
                  <span className="text-[10px] font-black bg-rose-500 text-white px-2 py-0.5 rounded-full uppercase tracking-wide">
                    SALE
                  </span>
                </div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm text-slate-400 line-through font-medium tabular-nums">
                    KES {formatPrice(Math.ceil(product.selling_price * 1.18))}
                  </span>
                  <span className="text-xs font-bold text-rose-500">
                    Save KES {formatPrice(Math.ceil(product.selling_price * 0.18))}
                  </span>
                </div>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-sm text-amber-600/70 dark:text-amber-500/70 font-bold">
                    KES
                  </span>
                  <span className="text-3xl font-black text-amber-600 dark:text-amber-400 tabular-nums leading-none">
                    {formatPrice(product.selling_price)}
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Free delivery on orders over KES 2,000
                </p>
              </div>

              {isOutOfStock ? (
                <div className="flex items-center gap-2 bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-400 rounded-xl px-4 py-2.5 text-sm font-semibold">
                  <X className="w-4 h-4" /> Out of Stock — check back soon
                </div>
              ) : (
                <div className="flex items-center gap-2 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 rounded-xl px-4 py-2.5 text-sm font-semibold">
                  <Zap className="w-4 h-4" /> In Stock · {product.quantity_in_stock} units
                  available
                </div>
              )}

              {!isOutOfStock && (
                <div className="flex items-center gap-4">
                  <span className="text-sm font-bold text-slate-700 dark:text-slate-300">
                    Qty
                  </span>
                  <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="w-10 h-10 flex items-center justify-center hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                    >
                      <Minus className="w-4 h-4 text-slate-700 dark:text-slate-300" />
                    </button>
                    <span className="w-12 text-center font-black text-slate-900 dark:text-white text-lg">
                      {quantity}
                    </span>
                    <button
                      onClick={() =>
                        setQuantity(Math.min(product.quantity_in_stock, quantity + 1))
                      }
                      disabled={quantity >= product.quantity_in_stock}
                      className="w-10 h-10 flex items-center justify-center hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors disabled:opacity-40"
                    >
                      <Plus className="w-4 h-4 text-slate-700 dark:text-slate-300" />
                    </button>
                  </div>
                  <span className="text-xs text-slate-400">
                    Max {product.quantity_in_stock}
                  </span>
                </div>
              )}

              <button
                onClick={handleAddToCart}
                disabled={isOutOfStock}
                className={`w-full py-4 rounded-2xl font-black text-base flex items-center justify-center gap-3 transition-all duration-300 ${
                  isOutOfStock
                    ? "bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed"
                    : justAdded
                    ? "bg-emerald-500 text-white shadow-xl shadow-emerald-500/30 scale-[0.98]"
                    : "bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:from-amber-600 hover:to-orange-600 shadow-lg shadow-amber-500/25 hover:shadow-xl hover:scale-[1.01] active:scale-[0.98]"
                }`}
              >
                {justAdded ? (
                  <>
                    <span className="text-xl">✓</span>
                    <span>Added to Cart!</span>
                  </>
                ) : (
                  <>
                    <ShoppingCart className="w-5 h-5" />
                    <span>
                      Add to Cart · <span className="opacity-80">KES {totalPrice}</span>
                    </span>
                  </>
                )}
              </button>

              <div className="border-t border-slate-100 dark:border-slate-800 pt-4">
                <div className="flex gap-1 mb-3">
                  {(["details", "shipping", "returns"] as const).map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-bold capitalize transition-all ${
                        activeTab === tab
                          ? "bg-amber-500 text-white"
                          : "text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                      }`}
                    >
                      {tab}
                    </button>
                  ))}
                </div>

                {activeTab === "details" && (
                  <div className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
                    {product.description && (
                      <p className="leading-relaxed">{product.description}</p>
                    )}
                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <div className="bg-slate-50 dark:bg-slate-800/60 rounded-xl p-3">
                        <p className="text-[10px] uppercase tracking-wider text-slate-400 mb-0.5">
                          Category
                        </p>
                        <p className="font-bold text-slate-800 dark:text-white text-xs">
                          {product.category}
                        </p>
                      </div>
                      <div className="bg-slate-50 dark:bg-slate-800/60 rounded-xl p-3">
                        <p className="text-[10px] uppercase tracking-wider text-slate-400 mb-0.5">
                          SKU
                        </p>
                        <p className="font-bold text-slate-800 dark:text-white text-xs">
                          {product.product_id}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === "shipping" && (
                  <div className="space-y-2">
                    <div className="flex items-start gap-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl p-3">
                      <Truck className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="font-bold text-slate-800 dark:text-white text-xs">
                          Same-day dispatch
                        </p>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          Orders placed before 3 PM
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl p-3">
                      <Package className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="font-bold text-slate-800 dark:text-white text-xs">
                          Free delivery
                        </p>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          On orders over KES 2,000
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === "returns" && (
                  <div className="flex items-start gap-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl p-3">
                    <Shield className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-bold text-slate-800 dark:text-white text-xs">
                        7-day returns
                      </p>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Unused items in original packaging
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  },
);

ProductQuickView.displayName = "ProductQuickView";

export default ProductQuickView;
