import { memo, useCallback, useState } from "react";
import {
  ShoppingCart,
  Heart,
  Share2,
  Package,
  Truck,
  Shield,
  Plus,
  Minus,
  X,
  Check,
  Zap,
} from "lucide-react";
import type { Product } from "../types";
import compactToast from "../utils/compactToast";

interface ProductQuickViewProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  onAddToCart: (product: Product) => void;
}

const ProductQuickView = memo(function ProductQuickView({
  product,
  isOpen,
  onClose,
  onAddToCart,
}: ProductQuickViewProps) {
  const [liked, setLiked] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState<"details" | "shipping" | "returns">("details");
  const [justAdded, setJustAdded] = useState(false);

  const handleAddToCart = useCallback(() => {
    if (!product) return;
    for (let i = 0; i < quantity; i++) onAddToCart(product);
    setJustAdded(true);
    compactToast.addToCart(product.name);
    setTimeout(() => {
      setJustAdded(false);
      onClose();
    }, 900);
  }, [product, quantity, onAddToCart, onClose]);

  const toggleLike = useCallback(() => {
    setLiked((v) => !v);
    if (!liked) compactToast.addToWishlist();
  }, [liked]);

  const handleShare = useCallback(() => {
    if (!product) return;
    if ((navigator as any).share) {
      (navigator as any)
        .share({ title: product.name, url: window.location.href })
        .catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      compactToast.addToWishlist();
    }
  }, [product]);

  if (!isOpen || !product) return null;

  const isOut = product.quantity_in_stock <= 0;
  const isLow = !isOut && product.quantity_in_stock <= (product.reorder_level || 5);
  const lineTotal = product.selling_price * quantity;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-slate-900/70 backdrop-blur-sm" />

      <div
        className="relative bg-white dark:bg-slate-900 w-full sm:max-w-3xl max-h-[95dvh] sm:max-h-[90vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl shadow-2xl z-10 border-t sm:border border-slate-200 dark:border-slate-700"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute top-3 right-3 z-20 w-9 h-9 rounded-full bg-white/95 dark:bg-slate-800/95 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center justify-center shadow-md transition-colors"
        >
          <X className="w-4 h-4 text-slate-700 dark:text-slate-200" />
        </button>

        <div className="grid grid-cols-1 sm:grid-cols-2">
          {/* ===== Image ===== */}
          <div className="relative bg-slate-50 dark:bg-slate-800 sm:rounded-l-3xl overflow-hidden min-h-[300px] sm:min-h-[440px]">
            {product.image_url ? (
              <img
                src={product.image_url}
                alt={product.name}
                className="absolute inset-0 w-full h-full object-contain p-6"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                <Package className="w-24 h-24 text-slate-300 dark:text-slate-600" />
              </div>
            )}

            <div className="absolute top-4 left-4 flex flex-col gap-2">
              {product.featured && (
                <span className="bg-amber-500 text-white text-[11px] font-black px-2.5 py-1 rounded-full shadow uppercase tracking-wider">
                  Featured
                </span>
              )}
              {isLow && (
                <span className="bg-rose-500 text-white text-[11px] font-black px-2.5 py-1 rounded-full shadow uppercase tracking-wider">
                  Only {product.quantity_in_stock} left
                </span>
              )}
            </div>

            <div className="absolute bottom-3 left-3 right-3 flex gap-2">
              <button
                type="button"
                onClick={toggleLike}
                className={`flex-1 h-10 rounded-xl text-sm font-bold flex items-center justify-center gap-1.5 backdrop-blur transition-colors ${
                  liked
                    ? "bg-rose-500 text-white"
                    : "bg-white/90 dark:bg-slate-800/90 text-slate-700 dark:text-slate-200 hover:bg-rose-500 hover:text-white"
                }`}
              >
                <Heart className={`w-4 h-4 ${liked ? "fill-current" : ""}`} />
                {liked ? "Saved" : "Save"}
              </button>
              <button
                type="button"
                onClick={handleShare}
                className="flex-1 h-10 rounded-xl text-sm font-bold flex items-center justify-center gap-1.5 bg-white/90 dark:bg-slate-800/90 text-slate-700 dark:text-slate-200 hover:bg-amber-500 hover:text-white backdrop-blur transition-colors"
              >
                <Share2 className="w-4 h-4" />
                Share
              </button>
            </div>
          </div>

          {/* ===== Details ===== */}
          <div className="flex flex-col p-5 sm:p-6 gap-4">
            <div>
              <span className="inline-block text-[10px] font-black uppercase tracking-widest text-amber-600 dark:text-amber-400">
                {product.category}
              </span>
              <h2 className="mt-1 text-xl sm:text-2xl font-black text-slate-900 dark:text-white leading-tight">
                {product.name}
              </h2>
            </div>

            {/* Price */}
            <div className="bg-amber-50 dark:bg-amber-900/15 border border-amber-200 dark:border-amber-800/40 rounded-2xl p-4">
              <p className="text-[10px] uppercase tracking-wider font-bold text-amber-700 dark:text-amber-300">
                Price
              </p>
              <div className="mt-0.5 flex items-baseline gap-1.5">
                <span className="text-sm font-bold text-amber-700 dark:text-amber-300">
                  KES
                </span>
                <span className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tabular-nums leading-none">
                  {product.selling_price.toLocaleString()}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1.5">
                Free delivery on orders over KES 2,000
              </p>
            </div>

            {/* Stock status */}
            <div
              className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold ${
                isOut
                  ? "bg-rose-50 dark:bg-rose-900/20 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800/40"
                  : "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/40"
              }`}
            >
              {isOut ? (
                <>
                  <X className="w-4 h-4" /> Out of stock — check back soon
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4" /> In stock · {product.quantity_in_stock}{" "}
                  available
                </>
              )}
            </div>

            {/* Qty + Add to cart */}
            {!isOut && (
              <div className="flex items-stretch gap-2">
                <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 flex-shrink-0">
                  <button
                    type="button"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-10 h-12 flex items-center justify-center hover:bg-slate-200 dark:hover:bg-slate-700"
                    aria-label="Decrease quantity"
                  >
                    <Minus className="w-4 h-4 text-slate-700 dark:text-slate-300" />
                  </button>
                  <span className="w-10 text-center font-black text-slate-900 dark:text-white text-base">
                    {quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      setQuantity(Math.min(product.quantity_in_stock, quantity + 1))
                    }
                    disabled={quantity >= product.quantity_in_stock}
                    className="w-10 h-12 flex items-center justify-center hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-40"
                    aria-label="Increase quantity"
                  >
                    <Plus className="w-4 h-4 text-slate-700 dark:text-slate-300" />
                  </button>
                </div>
                <button
                  type="button"
                  onClick={handleAddToCart}
                  className={`flex-1 h-12 rounded-xl font-black text-sm flex items-center justify-center gap-2 transition-colors ${
                    justAdded
                      ? "bg-emerald-500 text-white"
                      : "bg-amber-500 hover:bg-amber-600 text-white shadow-lg shadow-amber-500/20"
                  }`}
                >
                  {justAdded ? (
                    <>
                      <Check className="w-4 h-4" /> Added to cart
                    </>
                  ) : (
                    <>
                      <ShoppingCart className="w-4 h-4" />
                      Add — KES {lineTotal.toLocaleString()}
                    </>
                  )}
                </button>
              </div>
            )}

            {/* Tabs */}
            <div className="border-t border-slate-100 dark:border-slate-800 pt-4">
              <div className="flex gap-1 mb-3">
                {(["details", "shipping", "returns"] as const).map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setActiveTab(tab)}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-bold capitalize transition-colors ${
                      activeTab === tab
                        ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900"
                        : "text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              {activeTab === "details" && (
                <div className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
                  {product.description ? (
                    <p className="leading-relaxed">{product.description}</p>
                  ) : (
                    <p className="text-[12px] text-slate-400 italic">
                      No additional details provided.
                    </p>
                  )}
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <InfoChip label="Category" value={product.category} />
                    <InfoChip label="Item code" value={product.product_id} />
                  </div>
                </div>
              )}

              {activeTab === "shipping" && (
                <div className="space-y-2">
                  <InfoRow
                    icon={Truck}
                    title="Same-day dispatch"
                    sub="Orders placed before 3 PM"
                  />
                  <InfoRow
                    icon={Package}
                    title="Free delivery"
                    sub="On orders over KES 2,000 across Nairobi"
                  />
                </div>
              )}

              {activeTab === "returns" && (
                <InfoRow
                  icon={Shield}
                  title="7-day returns"
                  sub="Unused items in original packaging"
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

function InfoChip({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-slate-50 dark:bg-slate-800/60 rounded-xl p-3">
      <p className="text-[10px] uppercase tracking-wider text-slate-400 mb-0.5">
        {label}
      </p>
      <p className="font-bold text-slate-800 dark:text-white text-xs truncate">
        {value}
      </p>
    </div>
  );
}

function InfoRow({
  icon: Icon,
  title,
  sub,
}: {
  icon: React.ElementType;
  title: string;
  sub: string;
}) {
  return (
    <div className="flex items-start gap-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl p-3">
      <Icon className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
      <div>
        <p className="font-bold text-slate-800 dark:text-white text-xs">{title}</p>
        <p className="text-[11px] text-slate-500 mt-0.5">{sub}</p>
      </div>
    </div>
  );
}

export default ProductQuickView;
