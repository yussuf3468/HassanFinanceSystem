import { memo, useState } from "react";
import { Check, Expand, Heart, Plus, Scale } from "lucide-react";
import OptimizedImage from "../../components/OptimizedImage";
import { useCart } from "../../contexts/CartContext";
import compactToast from "../../utils/compactToast";
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
   ProductCard — the storefront's most repeated surface.
   Soft-shadow card, springy image zoom, hover action rail
   (quick view / compare), wishlist chip, honest stock badges.
   ═══════════════════════════════════════════════════════════════ */

interface ProductCardProps {
  product: Product;
  priority?: boolean;
  /** Hide the compare toggle (used in tight rails). */
  compact?: boolean;
}

const ProductCard = memo(function ProductCard({
  product,
  priority = false,
  compact = false,
}: ProductCardProps) {
  const { addItem } = useCart();
  const ui = useStorefrontUI();
  const wishlist = useWishlist();
  const [justAdded, setJustAdded] = useState(false);

  const saved = wishlist.includes(product.id);
  const comparing = ui.compareIds.includes(product.id);
  const outOfStock = product.quantity_in_stock <= 0;
  const lowStock = isLowStock(product);
  const fresh = isNewProduct(product);
  const categoryLabel = categoryMetaFor(resolveCategorySlug(product.category)).label;

  function handleAdd(event: React.MouseEvent) {
    event.stopPropagation();
    if (outOfStock || justAdded) return;
    addItem(product);
    compactToast.addToCart(product.name);
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 1400);
  }

  function handleWishlist(event: React.MouseEvent) {
    event.stopPropagation();
    const added = wishlistStore.toggle(product.id);
    if (added) compactToast.addToWishlist();
  }

  function handleCompare(event: React.MouseEvent) {
    event.stopPropagation();
    ui.toggleCompare(product.id);
  }

  function handleQuickView(event: React.MouseEvent) {
    event.stopPropagation();
    ui.openQuickView(product);
  }

  return (
    <article
      onClick={() => navigate(`/product/${product.id}`)}
      className="group relative cursor-pointer overflow-hidden rounded-3xl transition-all duration-500 will-change-transform hover:-translate-y-1.5"
      style={{
        background: "var(--sf-surface)",
        border: "1px solid var(--sf-line)",
        boxShadow: "var(--sf-shadow-sm)",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.boxShadow = "var(--sf-shadow-lg)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.boxShadow = "var(--sf-shadow-sm)";
      }}
    >
      {/* ── Image ── */}
      <div
        className="relative aspect-[4/5] overflow-hidden"
        style={{ background: "var(--sf-bg-soft)" }}
      >
        <div className="h-full w-full transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.06]">
          <OptimizedImage
            src={product.image_url}
            alt={product.name}
            priority={priority}
            preset="medium"
            className="h-full w-full object-cover"
            fallbackClassName="h-full w-full"
          />
        </div>

        {/* Badges */}
        <div className="absolute left-3 top-3 flex flex-col items-start gap-1.5">
          {outOfStock && (
            <span className="rounded-full bg-black/70 px-2.5 py-1 text-[11px] font-semibold text-white backdrop-blur-sm">
              Out of stock
            </span>
          )}
          {!outOfStock && fresh && (
            <span
              className="rounded-full px-2.5 py-1 text-[11px] font-semibold"
              style={{ background: "var(--sf-accent)", color: "var(--sf-accent-ink)" }}
            >
              New
            </span>
          )}
          {!outOfStock && lowStock && (
            <span
              className="rounded-full px-2.5 py-1 text-[11px] font-semibold text-white"
              style={{ background: "var(--sf-gold)" }}
            >
              Only {product.quantity_in_stock} left
            </span>
          )}
        </div>

        {/* Wishlist chip */}
        <button
          type="button"
          onClick={handleWishlist}
          aria-label={saved ? "Remove from wishlist" : "Save to wishlist"}
          className="sf-glass absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full transition-all duration-300 hover:scale-110 active:scale-95"
        >
          <Heart
            className="h-[17px] w-[17px] transition-colors"
            style={{
              color: saved ? "#e11d48" : "var(--sf-ink)",
              fill: saved ? "#e11d48" : "transparent",
            }}
          />
        </button>

        {/* Hover action rail (desktop) */}
        {!compact && (
          <div className="pointer-events-none absolute inset-x-3 bottom-3 hidden translate-y-3 gap-2 opacity-0 transition-all duration-300 group-hover:pointer-events-auto group-hover:translate-y-0 group-hover:opacity-100 sm:flex">
            <button
              type="button"
              onClick={handleQuickView}
              className="sf-glass flex h-10 flex-1 items-center justify-center gap-2 rounded-full text-[13px] font-semibold"
              style={{ color: "var(--sf-ink)" }}
            >
              <Expand className="h-4 w-4" />
              Quick view
            </button>
            <button
              type="button"
              onClick={handleCompare}
              aria-label="Compare"
              className="sf-glass flex h-10 w-10 items-center justify-center rounded-full transition-colors"
              style={
                comparing
                  ? { background: "var(--sf-ink)", color: "var(--sf-bg)" }
                  : { color: "var(--sf-ink)" }
              }
            >
              <Scale className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>

      {/* ── Body ── */}
      <div className="p-4 sm:p-5">
        <p className="sf-eyebrow mb-1.5 truncate" style={{ color: "var(--sf-gold)" }}>
          {categoryLabel}
        </p>
        <h3
          className="mb-3 line-clamp-2 min-h-[2.6em] text-[15px] font-semibold leading-snug"
          style={{ color: "var(--sf-ink)" }}
        >
          {product.name}
        </h3>
        <div className="flex items-center justify-between gap-3">
          <p
            className="sf-display sf-tabular text-lg font-semibold"
            style={{ color: "var(--sf-ink)" }}
          >
            {formatMoney(product.selling_price)}
          </p>
          <button
            type="button"
            onClick={handleAdd}
            disabled={outOfStock}
            aria-label={`Add ${product.name} to cart`}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-all duration-300 hover:scale-110 active:scale-95 disabled:cursor-not-allowed disabled:opacity-35"
            style={
              justAdded
                ? { background: "var(--sf-accent)", color: "var(--sf-accent-ink)" }
                : {
                    background: "var(--sf-accent-soft)",
                    color: "var(--sf-accent)",
                  }
            }
          >
            {justAdded ? <Check className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
          </button>
        </div>
      </div>
    </article>
  );
});

export default ProductCard;
