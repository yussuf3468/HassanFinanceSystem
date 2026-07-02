import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight,
  Check,
  Heart,
  Minus,
  Plus,
  RotateCcw,
  ShieldCheck,
  ShoppingBag,
  Truck,
  X,
} from "lucide-react";
import OptimizedImage from "../../components/OptimizedImage";
import { useCart } from "../../contexts/CartContext";
import compactToast from "../../utils/compactToast";
import { storeConfig } from "../config/store";
import {
  categoryMetaFor,
  formatMoney,
  isLowStock,
  isNewProduct,
  resolveCategorySlug,
} from "../lib/catalog";
import { useWishlist, wishlistStore } from "../lib/prefs";
import { navigate } from "../lib/router";
import { useStorefrontUI } from "../lib/ui-context";
import type { Product } from "../../types";

/* ═══════════════════════════════════════════════════════════════
   Quick view — product essentials in a glass modal, without
   leaving the grid.
   ═══════════════════════════════════════════════════════════════ */

export default function QuickView() {
  const ui = useStorefrontUI();
  return (
    <AnimatePresence>
      {ui.quickViewProduct && (
        <QuickViewPanel
          key={ui.quickViewProduct.id}
          product={ui.quickViewProduct}
          onClose={ui.closeQuickView}
        />
      )}
    </AnimatePresence>
  );
}

function QuickViewPanel({
  product,
  onClose,
}: {
  product: Product;
  onClose: () => void;
}) {
  const { addItem } = useCart();
  const wishlist = useWishlist();
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const outOfStock = product.quantity_in_stock <= 0;
  const saved = wishlist.includes(product.id);
  const categoryLabel = categoryMetaFor(resolveCategorySlug(product.category)).label;

  function handleAdd() {
    if (outOfStock) return;
    addItem(product, quantity);
    compactToast.addToCart(product.name);
    setAdded(true);
    setTimeout(() => setAdded(false), 1400);
  }

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/45 sm:items-center sm:p-6"
      style={{ backdropFilter: "blur(8px)" }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        role="dialog"
        aria-label={`Quick view: ${product.name}`}
        className="grid max-h-[92vh] w-full max-w-3xl grid-cols-1 overflow-hidden overflow-y-auto rounded-t-3xl sm:grid-cols-2 sm:rounded-3xl"
        style={{ background: "var(--sf-bg)", boxShadow: "var(--sf-shadow-lg)" }}
        initial={{ opacity: 0, y: 60, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 40, scale: 0.98 }}
        transition={{ type: "spring", damping: 30, stiffness: 340 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Image side */}
        <div
          className="relative aspect-[4/3] sm:aspect-auto sm:min-h-[440px]"
          style={{ background: "var(--sf-bg-soft)" }}
        >
          <OptimizedImage
            src={product.image_url}
            alt={product.name}
            priority
            preset="large"
            className="h-full w-full object-cover"
            fallbackClassName="h-full w-full"
          />
          <button
            type="button"
            onClick={onClose}
            aria-label="Close quick view"
            className="sf-glass absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full sm:hidden"
            style={{ color: "var(--sf-ink)" }}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Info side */}
        <div className="relative flex flex-col p-6 sm:p-8">
          <button
            type="button"
            onClick={onClose}
            aria-label="Close quick view"
            className="absolute right-5 top-5 hidden h-9 w-9 items-center justify-center rounded-full transition-colors hover:bg-black/5 sm:flex"
            style={{ color: "var(--sf-ink-soft)" }}
          >
            <X className="h-5 w-5" />
          </button>

          <p className="sf-eyebrow mb-2" style={{ color: "var(--sf-gold)" }}>
            {categoryLabel}
          </p>
          <h2
            className="sf-display pr-8 text-2xl font-medium leading-tight"
            style={{ color: "var(--sf-ink)" }}
          >
            {product.name}
          </h2>

          <div className="mt-3 flex flex-wrap items-center gap-2.5">
            <p
              className="sf-display sf-tabular text-2xl font-semibold"
              style={{ color: "var(--sf-ink)" }}
            >
              {formatMoney(product.selling_price)}
            </p>
            {isNewProduct(product) && !outOfStock && (
              <span
                className="rounded-full px-2.5 py-1 text-[11px] font-semibold"
                style={{ background: "var(--sf-accent)", color: "var(--sf-accent-ink)" }}
              >
                New
              </span>
            )}
            {outOfStock ? (
              <span className="rounded-full bg-black/70 px-2.5 py-1 text-[11px] font-semibold text-white">
                Out of stock
              </span>
            ) : isLowStock(product) ? (
              <span
                className="rounded-full px-2.5 py-1 text-[11px] font-semibold text-white"
                style={{ background: "var(--sf-gold)" }}
              >
                Only {product.quantity_in_stock} left
              </span>
            ) : (
              <span
                className="rounded-full px-2.5 py-1 text-[11px] font-semibold"
                style={{ background: "var(--sf-accent-soft)", color: "var(--sf-accent)" }}
              >
                In stock
              </span>
            )}
          </div>

          {product.description && (
            <p
              className="mt-4 line-clamp-4 text-[14px] leading-relaxed"
              style={{ color: "var(--sf-ink-soft)" }}
            >
              {product.description}
            </p>
          )}

          {/* Quantity + actions */}
          <div className="mt-6 flex items-center gap-3">
            <div
              className="flex items-center rounded-full"
              style={{ border: "1px solid var(--sf-line-strong)" }}
            >
              <button
                type="button"
                aria-label="Decrease quantity"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                className="flex h-11 w-11 items-center justify-center rounded-full transition-colors hover:bg-black/5"
                style={{ color: "var(--sf-ink)" }}
              >
                <Minus className="h-4 w-4" />
              </button>
              <span
                className="sf-tabular w-10 text-center text-[15px] font-semibold"
                style={{ color: "var(--sf-ink)" }}
              >
                {quantity}
              </span>
              <button
                type="button"
                aria-label="Increase quantity"
                onClick={() =>
                  setQuantity((q) => Math.min(product.quantity_in_stock || 1, q + 1))
                }
                className="flex h-11 w-11 items-center justify-center rounded-full transition-colors hover:bg-black/5 disabled:opacity-30"
                disabled={quantity >= product.quantity_in_stock}
                style={{ color: "var(--sf-ink)" }}
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>

            <button
              type="button"
              onClick={() => {
                const nowSaved = wishlistStore.toggle(product.id);
                if (nowSaved) compactToast.addToWishlist();
              }}
              aria-label={saved ? "Remove from wishlist" : "Save to wishlist"}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full transition-transform hover:scale-110"
              style={{ border: "1px solid var(--sf-line-strong)" }}
            >
              <Heart
                className="h-5 w-5"
                style={{
                  color: saved ? "#e11d48" : "var(--sf-ink)",
                  fill: saved ? "#e11d48" : "transparent",
                }}
              />
            </button>
          </div>

          <button
            type="button"
            onClick={handleAdd}
            disabled={outOfStock}
            className="mt-3 flex h-12 w-full items-center justify-center gap-2.5 rounded-full text-[15px] font-semibold transition-all duration-300 hover:-translate-y-0.5 disabled:pointer-events-none disabled:opacity-40"
            style={{
              background: added ? "var(--sf-accent-deep)" : "var(--sf-accent)",
              color: "var(--sf-accent-ink)",
              boxShadow: "var(--sf-shadow-accent)",
            }}
          >
            {added ? (
              <>
                <Check className="h-5 w-5" /> Added to bag
              </>
            ) : (
              <>
                <ShoppingBag className="h-[18px] w-[18px]" />
                {outOfStock ? "Out of stock" : "Add to bag"}
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => {
              onClose();
              navigate(`/product/${product.id}`);
            }}
            className="sf-link mx-auto mt-4 inline-flex items-center gap-1.5 text-[13.5px] font-semibold"
            style={{ color: "var(--sf-ink)" }}
          >
            View full details
            <ArrowRight className="h-4 w-4" />
          </button>

          {/* Trust row */}
          <div
            className="mt-6 grid grid-cols-3 gap-2 border-t pt-5 text-center"
            style={{ borderColor: "var(--sf-line)" }}
          >
            {[
              { icon: Truck, label: storeConfig.delivery.promise.split("·")[0].trim() },
              { icon: RotateCcw, label: storeConfig.delivery.returns.split(" on")[0] },
              { icon: ShieldCheck, label: "100% genuine" },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="flex flex-col items-center gap-1.5">
                <Icon className="h-4 w-4" style={{ color: "var(--sf-accent)" }} />
                <span
                  className="text-[11px] leading-tight"
                  style={{ color: "var(--sf-ink-soft)" }}
                >
                  {label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
