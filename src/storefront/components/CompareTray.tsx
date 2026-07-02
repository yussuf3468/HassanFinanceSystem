import { AnimatePresence, motion } from "framer-motion";
import { Check, Minus, Plus, Scale, X } from "lucide-react";
import OptimizedImage from "../../components/OptimizedImage";
import { useCart } from "../../contexts/CartContext";
import compactToast from "../../utils/compactToast";
import {
  categoryMetaFor,
  formatMoney,
  isNewProduct,
  resolveCategorySlug,
  useCatalog,
} from "../lib/catalog";
import { navigate } from "../lib/router";
import { useStorefrontUI } from "../lib/ui-context";

/* ═══════════════════════════════════════════════════════════════
   Compare — floating tray while selecting, side-by-side sheet
   when opened. Compares the facts we actually have: price,
   category, availability, freshness.
   ═══════════════════════════════════════════════════════════════ */

export default function CompareTray() {
  const ui = useStorefrontUI();
  const { products } = useCatalog();
  const { addItem } = useCart();

  const selected = ui.compareIds
    .map((id) => products.find((p) => p.id === id))
    .filter((p): p is NonNullable<typeof p> => Boolean(p));

  return (
    <>
      {/* Floating tray */}
      <AnimatePresence>
        {selected.length > 0 && !ui.compareOpen && (
          <motion.div
            className="fixed bottom-24 left-1/2 z-40 lg:bottom-8"
            initial={{ opacity: 0, y: 30, x: "-50%" }}
            animate={{ opacity: 1, y: 0, x: "-50%" }}
            exit={{ opacity: 0, y: 30, x: "-50%" }}
            transition={{ type: "spring", damping: 26, stiffness: 300 }}
          >
            <div
              className="flex items-center gap-3 rounded-full py-2 pl-3 pr-2"
              style={{
                background: "var(--sf-ink)",
                color: "var(--sf-bg)",
                boxShadow: "var(--sf-shadow-lg)",
              }}
            >
              <div className="flex -space-x-2">
                {selected.map((product) => (
                  <span
                    key={product.id}
                    className="h-9 w-9 overflow-hidden rounded-full border-2"
                    style={{ borderColor: "var(--sf-ink)", background: "var(--sf-bg-soft)" }}
                  >
                    <OptimizedImage
                      src={product.image_url}
                      alt={product.name}
                      preset="thumbnail"
                      className="h-full w-full object-cover"
                      fallbackClassName="h-full w-full"
                    />
                  </span>
                ))}
              </div>
              <span className="text-[13px] font-medium">
                {selected.length} selected
              </span>
              <button
                type="button"
                onClick={() => ui.setCompareOpen(true)}
                disabled={selected.length < 2}
                className="flex h-9 items-center gap-1.5 rounded-full px-4 text-[13px] font-semibold transition-transform hover:scale-105 disabled:opacity-50"
                style={{ background: "var(--sf-accent)", color: "var(--sf-accent-ink)" }}
              >
                <Scale className="h-4 w-4" />
                Compare
              </button>
              <button
                type="button"
                onClick={ui.clearCompare}
                aria-label="Clear comparison"
                className="flex h-8 w-8 items-center justify-center rounded-full transition-colors hover:bg-white/10"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Comparison sheet */}
      <AnimatePresence>
        {ui.compareOpen && selected.length >= 2 && (
          <motion.div
            className="fixed inset-0 z-50 flex items-end justify-center bg-black/45 sm:items-center sm:p-6"
            style={{ backdropFilter: "blur(8px)" }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => ui.setCompareOpen(false)}
          >
            <motion.div
              role="dialog"
              aria-label="Compare products"
              className="max-h-[90vh] w-full max-w-4xl overflow-auto rounded-t-3xl sm:rounded-3xl"
              style={{ background: "var(--sf-bg)", boxShadow: "var(--sf-shadow-lg)" }}
              initial={{ opacity: 0, y: 60 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 40 }}
              transition={{ type: "spring", damping: 30, stiffness: 320 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div
                className="sticky top-0 z-10 flex items-center justify-between px-6 py-4"
                style={{
                  background: "var(--sf-bg)",
                  borderBottom: "1px solid var(--sf-line)",
                }}
              >
                <h2
                  className="sf-display text-xl font-semibold"
                  style={{ color: "var(--sf-ink)" }}
                >
                  Compare products
                </h2>
                <button
                  type="button"
                  onClick={() => ui.setCompareOpen(false)}
                  aria-label="Close comparison"
                  className="flex h-9 w-9 items-center justify-center rounded-full transition-colors hover:bg-black/5"
                  style={{ color: "var(--sf-ink)" }}
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="overflow-x-auto p-6">
                <div
                  className="grid min-w-[560px] gap-4"
                  style={{
                    gridTemplateColumns: `repeat(${selected.length}, minmax(0, 1fr))`,
                  }}
                >
                  {selected.map((product) => {
                    const out = product.quantity_in_stock <= 0;
                    return (
                      <div
                        key={product.id}
                        className="flex flex-col rounded-2xl p-4"
                        style={{
                          background: "var(--sf-surface)",
                          border: "1px solid var(--sf-line)",
                        }}
                      >
                        <button
                          type="button"
                          onClick={() => {
                            ui.setCompareOpen(false);
                            navigate(`/product/${product.id}`);
                          }}
                          className="mb-3 aspect-square w-full overflow-hidden rounded-xl"
                          style={{ background: "var(--sf-bg-soft)" }}
                        >
                          <OptimizedImage
                            src={product.image_url}
                            alt={product.name}
                            preset="medium"
                            className="h-full w-full object-cover"
                            fallbackClassName="h-full w-full"
                          />
                        </button>
                        <p
                          className="mb-1 line-clamp-2 min-h-[2.5em] text-[14px] font-semibold leading-snug"
                          style={{ color: "var(--sf-ink)" }}
                        >
                          {product.name}
                        </p>

                        <dl
                          className="mt-1 space-y-2.5 text-[13px]"
                          style={{ color: "var(--sf-ink-soft)" }}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <dt>Price</dt>
                            <dd
                              className="sf-tabular font-semibold"
                              style={{ color: "var(--sf-ink)" }}
                            >
                              {formatMoney(product.selling_price)}
                            </dd>
                          </div>
                          <div className="flex items-center justify-between gap-2">
                            <dt>Category</dt>
                            <dd className="truncate text-right">
                              {categoryMetaFor(resolveCategorySlug(product.category)).label}
                            </dd>
                          </div>
                          <div className="flex items-center justify-between gap-2">
                            <dt>Availability</dt>
                            <dd
                              className="font-medium"
                              style={{ color: out ? "#b91c1c" : "var(--sf-accent)" }}
                            >
                              {out ? "Out of stock" : `${product.quantity_in_stock} in stock`}
                            </dd>
                          </div>
                          <div className="flex items-center justify-between gap-2">
                            <dt>New arrival</dt>
                            <dd>
                              {isNewProduct(product) ? (
                                <Check className="h-4 w-4" style={{ color: "var(--sf-accent)" }} />
                              ) : (
                                <Minus className="h-4 w-4" style={{ color: "var(--sf-ink-faint)" }} />
                              )}
                            </dd>
                          </div>
                        </dl>

                        <div className="mt-4 flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              if (out) return;
                              addItem(product);
                              compactToast.addToCart(product.name);
                            }}
                            disabled={out}
                            className="flex h-10 flex-1 items-center justify-center gap-1.5 rounded-full text-[13px] font-semibold transition-transform hover:scale-[1.03] disabled:opacity-40"
                            style={{
                              background: "var(--sf-accent)",
                              color: "var(--sf-accent-ink)",
                            }}
                          >
                            <Plus className="h-4 w-4" />
                            Add
                          </button>
                          <button
                            type="button"
                            onClick={() => ui.toggleCompare(product.id)}
                            aria-label="Remove from comparison"
                            className="flex h-10 w-10 items-center justify-center rounded-full transition-colors hover:bg-black/5"
                            style={{ border: "1px solid var(--sf-line)", color: "var(--sf-ink-soft)" }}
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
