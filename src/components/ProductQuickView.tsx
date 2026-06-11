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
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />

      <div
        className="relative bg-white dark:bg-[#1d1d1f] w-full sm:max-w-3xl max-h-[95dvh] sm:max-h-[90vh] overflow-y-auto scrollbar-hide rounded-t-3xl sm:rounded-3xl shadow-2xl z-10"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute top-3 right-3 z-20 w-9 h-9 rounded-full bg-white/80 dark:bg-black/50 backdrop-blur-xl hover:bg-white dark:hover:bg-black/70 flex items-center justify-center transition-colors"
        >
          <X className="w-4 h-4 text-[#1d1d1f] dark:text-white" />
        </button>

        <div className="grid grid-cols-1 sm:grid-cols-2">
          {/* ===== Image ===== */}
          <div className="relative bg-[#f5f5f7] dark:bg-[#2c2c2e] sm:rounded-l-3xl overflow-hidden min-h-[300px] sm:min-h-[480px]">
            {product.image_url ? (
              <img
                src={product.image_url}
                alt={product.name}
                className="absolute inset-0 w-full h-full object-contain p-8"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                <Package className="w-24 h-24 text-[#d2d2d7] dark:text-[#48484a]" />
              </div>
            )}

            <div className="absolute top-4 left-4 flex flex-col gap-2">
              {product.featured && (
                <span className="bg-white/90 dark:bg-black/60 backdrop-blur-xl text-[#1d1d1f] dark:text-white text-[11px] font-semibold px-2.5 py-1 rounded-full tracking-wide">
                  Featured
                </span>
              )}
              {isLow && (
                <span className="bg-[#1d1d1f]/90 backdrop-blur-xl text-white text-[11px] font-semibold px-2.5 py-1 rounded-full tracking-wide">
                  Only {product.quantity_in_stock} left
                </span>
              )}
            </div>

            <div className="absolute bottom-3 left-3 right-3 flex gap-2">
              <button
                type="button"
                onClick={toggleLike}
                className={`flex-1 h-10 rounded-full text-[14px] font-medium flex items-center justify-center gap-1.5 backdrop-blur-xl transition-colors ${
                  liked
                    ? "bg-rose-500 text-white"
                    : "bg-white/80 dark:bg-black/50 text-[#1d1d1f] dark:text-white hover:bg-white dark:hover:bg-black/70"
                }`}
              >
                <Heart className={`w-4 h-4 ${liked ? "fill-current" : ""}`} />
                {liked ? "Saved" : "Save"}
              </button>
              <button
                type="button"
                onClick={handleShare}
                className="flex-1 h-10 rounded-full text-[14px] font-medium flex items-center justify-center gap-1.5 bg-white/80 dark:bg-black/50 text-[#1d1d1f] dark:text-white hover:bg-white dark:hover:bg-black/70 backdrop-blur-xl transition-colors"
              >
                <Share2 className="w-4 h-4" />
                Share
              </button>
            </div>
          </div>

          {/* ===== Details ===== */}
          <div className="flex flex-col p-6 sm:p-7 gap-5">
            <div>
              <span className="inline-block text-[11px] font-medium uppercase tracking-[0.15em] text-[#86868b] dark:text-[#a1a1a6]">
                {product.category}
              </span>
              <h2 className="mt-1.5 text-[24px] sm:text-[28px] font-semibold tracking-tight text-[#1d1d1f] dark:text-white leading-tight">
                {product.name}
              </h2>
            </div>

            {/* Price */}
            <div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-[28px] sm:text-[32px] font-semibold text-[#1d1d1f] dark:text-white tabular-nums leading-none">
                  KES {product.selling_price.toLocaleString()}
                </span>
              </div>
              <p className="text-[13px] text-[#86868b] dark:text-[#a1a1a6] mt-2">
                Free delivery on orders over KES 2,000
              </p>
            </div>

            {/* Stock status */}
            <div
              className={`flex items-center gap-2 text-[13px] font-medium ${
                isOut
                  ? "text-[#ff3b30]"
                  : "text-[#34c759]"
              }`}
            >
              {isOut ? (
                <>
                  <X className="w-4 h-4" /> Sold out — check back soon
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
              <div className="flex items-stretch gap-2.5">
                <div className="flex items-center bg-[#f5f5f7] dark:bg-[#2c2c2e] rounded-full overflow-hidden flex-shrink-0">
                  <button
                    type="button"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-11 h-12 flex items-center justify-center text-[#1d1d1f] dark:text-white hover:opacity-60"
                    aria-label="Decrease quantity"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="w-9 text-center font-semibold text-[#1d1d1f] dark:text-white text-[15px] tabular-nums">
                    {quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      setQuantity(Math.min(product.quantity_in_stock, quantity + 1))
                    }
                    disabled={quantity >= product.quantity_in_stock}
                    className="w-11 h-12 flex items-center justify-center text-[#1d1d1f] dark:text-white hover:opacity-60 disabled:opacity-40"
                    aria-label="Increase quantity"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                <button
                  type="button"
                  onClick={handleAddToCart}
                  className={`flex-1 h-12 rounded-full font-medium text-[15px] flex items-center justify-center gap-2 transition-colors ${
                    justAdded
                      ? "bg-[#34c759] text-white"
                      : "bg-[#1d1d1f] hover:bg-black dark:bg-white dark:hover:bg-[#f5f5f7] text-white dark:text-[#1d1d1f]"
                  }`}
                >
                  {justAdded ? (
                    <>
                      <Check className="w-4 h-4" /> Added
                    </>
                  ) : (
                    <>Add for KES {lineTotal.toLocaleString()}</>
                  )}
                </button>
              </div>
            )}

            {/* Tabs */}
            <div className="border-t border-black/8 dark:border-white/10 pt-5">
              <div className="flex gap-1 mb-4 bg-[#f5f5f7] dark:bg-[#2c2c2e] p-1 rounded-full">
                {(["details", "shipping", "returns"] as const).map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setActiveTab(tab)}
                    className={`flex-1 py-1.5 rounded-full text-[13px] font-medium capitalize transition-colors ${
                      activeTab === tab
                        ? "bg-white dark:bg-[#48484a] text-[#1d1d1f] dark:text-white shadow-sm"
                        : "text-[#86868b] dark:text-[#a1a1a6]"
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              {activeTab === "details" && (
                <div className="space-y-3 text-[14px] text-[#6e6e73] dark:text-[#a1a1a6]">
                  {product.description ? (
                    <p className="leading-relaxed">{product.description}</p>
                  ) : (
                    <p className="text-[13px] text-[#86868b] italic">
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
    <div className="bg-[#f5f5f7] dark:bg-[#2c2c2e] rounded-xl p-3">
      <p className="text-[10px] uppercase tracking-wider text-[#86868b] mb-0.5">
        {label}
      </p>
      <p className="font-medium text-[#1d1d1f] dark:text-white text-[13px] truncate">
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
    <div className="flex items-start gap-3 bg-[#f5f5f7] dark:bg-[#2c2c2e] rounded-xl p-3">
      <Icon className="w-4 h-4 text-[#1d1d1f] dark:text-white mt-0.5 flex-shrink-0" />
      <div>
        <p className="font-medium text-[#1d1d1f] dark:text-white text-[13px]">
          {title}
        </p>
        <p className="text-[12px] text-[#86868b] mt-0.5">{sub}</p>
      </div>
    </div>
  );
}

export default ProductQuickView;
