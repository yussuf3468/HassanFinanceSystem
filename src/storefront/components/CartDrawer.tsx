import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Minus, Plus, ShoppingBag, Trash2, X } from "lucide-react";
import OptimizedImage from "../../components/OptimizedImage";
import { useCart } from "../../contexts/CartContext";
import { storeConfig } from "../config/store";
import { formatMoney } from "../lib/catalog";
import { navigate } from "../lib/router";
import { useStorefrontUI } from "../lib/ui-context";

/* ═══════════════════════════════════════════════════════════════
   Cart drawer — right slide-over with a free-delivery progress
   meter and a straight line into checkout.
   ═══════════════════════════════════════════════════════════════ */

export default function CartDrawer() {
  const ui = useStorefrontUI();
  const { items, updateQuantity, removeItem, totalItems, totalPrice } = useCart();
  const threshold = storeConfig.delivery.freeThreshold;
  const remaining = Math.max(threshold - totalPrice, 0);
  const progress = Math.min((totalPrice / threshold) * 100, 100);

  return (
    <AnimatePresence>
      {ui.cartOpen && (
        <>
          <motion.div
            className="fixed inset-0 z-50 bg-black/40"
            style={{ backdropFilter: "blur(4px)" }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={ui.closeCart}
          />
          <motion.aside
            role="dialog"
            aria-label="Shopping cart"
            className="fixed bottom-0 right-0 top-0 z-50 flex w-full max-w-md flex-col"
            style={{ background: "var(--sf-bg)" }}
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 32, stiffness: 320 }}
          >
            {/* Header */}
            <div
              className="flex items-center justify-between px-6 py-5"
              style={{ borderBottom: "1px solid var(--sf-line)" }}
            >
              <h2
                className="sf-display text-xl font-semibold"
                style={{ color: "var(--sf-ink)" }}
              >
                Your bag{" "}
                <span className="text-base" style={{ color: "var(--sf-ink-faint)" }}>
                  ({totalItems})
                </span>
              </h2>
              <button
                type="button"
                onClick={ui.closeCart}
                aria-label="Close cart"
                className="flex h-9 w-9 items-center justify-center rounded-full transition-colors hover:bg-black/5"
                style={{ color: "var(--sf-ink)" }}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {items.length === 0 ? (
              <div className="flex flex-1 flex-col items-center justify-center px-8 text-center">
                <div
                  className="mb-5 flex h-20 w-20 items-center justify-center rounded-3xl"
                  style={{ background: "var(--sf-accent-soft)" }}
                >
                  <ShoppingBag
                    className="h-9 w-9"
                    style={{ color: "var(--sf-accent)" }}
                  />
                </div>
                <h3
                  className="sf-display text-xl font-medium"
                  style={{ color: "var(--sf-ink)" }}
                >
                  Your bag is empty
                </h3>
                <p
                  className="mt-2 text-[14px] leading-relaxed"
                  style={{ color: "var(--sf-ink-soft)" }}
                >
                  Beautiful things are waiting. Start with our featured picks.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    ui.closeCart();
                    navigate("/products");
                  }}
                  className="mt-6 inline-flex h-11 items-center gap-2 rounded-full px-6 text-[14px] font-semibold transition-transform hover:scale-105"
                  style={{
                    background: "var(--sf-accent)",
                    color: "var(--sf-accent-ink)",
                  }}
                >
                  Browse products
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <>
                {/* Free-delivery meter */}
                <div
                  className="px-6 py-4"
                  style={{ borderBottom: "1px solid var(--sf-line)" }}
                >
                  <p className="mb-2 text-[13px]" style={{ color: "var(--sf-ink-soft)" }}>
                    {remaining > 0 ? (
                      <>
                        Add{" "}
                        <span className="font-semibold" style={{ color: "var(--sf-ink)" }}>
                          {formatMoney(remaining)}
                        </span>{" "}
                        more for free delivery
                      </>
                    ) : (
                      <span className="font-semibold" style={{ color: "var(--sf-accent)" }}>
                        🎉 You've unlocked free delivery
                      </span>
                    )}
                  </p>
                  <div
                    className="h-1.5 overflow-hidden rounded-full"
                    style={{ background: "var(--sf-bg-soft)" }}
                  >
                    <div
                      className="h-full rounded-full transition-all duration-700 ease-out"
                      style={{ width: `${progress}%`, background: "var(--sf-accent)" }}
                    />
                  </div>
                </div>

                {/* Items */}
                <div className="flex-1 space-y-3 overflow-y-auto px-6 py-4">
                  {items.map(({ product, quantity }) => (
                    <div
                      key={product.id}
                      className="flex gap-3.5 rounded-2xl p-3"
                      style={{
                        background: "var(--sf-surface)",
                        border: "1px solid var(--sf-line)",
                      }}
                    >
                      <button
                        type="button"
                        onClick={() => {
                          ui.closeCart();
                          navigate(`/product/${product.id}`);
                        }}
                        className="h-20 w-16 shrink-0 overflow-hidden rounded-xl"
                        style={{ background: "var(--sf-bg-soft)" }}
                      >
                        <OptimizedImage
                          src={product.image_url}
                          alt={product.name}
                          preset="thumbnail"
                          className="h-full w-full object-cover"
                          fallbackClassName="h-full w-full"
                        />
                      </button>
                      <div className="flex min-w-0 flex-1 flex-col">
                        <p
                          className="line-clamp-2 text-[13.5px] font-semibold leading-snug"
                          style={{ color: "var(--sf-ink)" }}
                        >
                          {product.name}
                        </p>
                        <p
                          className="sf-tabular mt-0.5 text-[13px] font-medium"
                          style={{ color: "var(--sf-ink-soft)" }}
                        >
                          {formatMoney(product.selling_price)}
                        </p>
                        <div className="mt-auto flex items-center justify-between pt-2">
                          <div
                            className="flex items-center rounded-full"
                            style={{ border: "1px solid var(--sf-line)" }}
                          >
                            <button
                              type="button"
                              aria-label="Decrease quantity"
                              onClick={() => updateQuantity(product.id, quantity - 1)}
                              className="flex h-7 w-7 items-center justify-center rounded-full transition-colors hover:bg-black/5"
                              style={{ color: "var(--sf-ink)" }}
                            >
                              <Minus className="h-3.5 w-3.5" />
                            </button>
                            <span
                              className="sf-tabular w-7 text-center text-[13px] font-semibold"
                              style={{ color: "var(--sf-ink)" }}
                            >
                              {quantity}
                            </span>
                            <button
                              type="button"
                              aria-label="Increase quantity"
                              onClick={() => updateQuantity(product.id, quantity + 1)}
                              disabled={quantity >= product.quantity_in_stock}
                              className="flex h-7 w-7 items-center justify-center rounded-full transition-colors hover:bg-black/5 disabled:opacity-30"
                              style={{ color: "var(--sf-ink)" }}
                            >
                              <Plus className="h-3.5 w-3.5" />
                            </button>
                          </div>
                          <button
                            type="button"
                            aria-label={`Remove ${product.name}`}
                            onClick={() => removeItem(product.id)}
                            className="flex h-8 w-8 items-center justify-center rounded-full transition-colors hover:bg-red-50 hover:text-red-600"
                            style={{ color: "var(--sf-ink-faint)" }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Summary */}
                <div
                  className="sf-safe-bottom space-y-3 px-6 py-5"
                  style={{ borderTop: "1px solid var(--sf-line)" }}
                >
                  <div className="flex items-baseline justify-between">
                    <span className="text-[14px]" style={{ color: "var(--sf-ink-soft)" }}>
                      Subtotal
                    </span>
                    <span
                      className="sf-display sf-tabular text-xl font-semibold"
                      style={{ color: "var(--sf-ink)" }}
                    >
                      {formatMoney(totalPrice)}
                    </span>
                  </div>
                  <p className="text-[12px]" style={{ color: "var(--sf-ink-faint)" }}>
                    Delivery is calculated at checkout · {storeConfig.delivery.payment}
                  </p>
                  <button
                    type="button"
                    onClick={ui.openCheckout}
                    className="flex h-12 w-full items-center justify-center gap-2 rounded-full text-[15px] font-semibold transition-all duration-300 hover:-translate-y-0.5"
                    style={{
                      background: "var(--sf-accent)",
                      color: "var(--sf-accent-ink)",
                      boxShadow: "var(--sf-shadow-accent)",
                    }}
                  >
                    Checkout
                    <ArrowRight className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={ui.closeCart}
                    className="h-10 w-full rounded-full text-[14px] font-medium transition-colors hover:bg-black/5"
                    style={{ color: "var(--sf-ink-soft)" }}
                  >
                    Continue shopping
                  </button>
                </div>
              </>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
