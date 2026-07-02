import { useMemo } from "react";
import { Heart, ShoppingBag, Trash2 } from "lucide-react";
import { useCart } from "../../contexts/CartContext";
import compactToast from "../../utils/compactToast";
import ProductCard from "../components/ProductCard";
import {
  Container,
  EmptyState,
  ProductGridSkeleton,
  Reveal,
  SolidButton,
} from "../components/ui";
import { useCatalog } from "../lib/catalog";
import { useWishlist, wishlistStore } from "../lib/prefs";
import { useStorefrontUI } from "../lib/ui-context";
import type { Product } from "../../types";

/* ═══════════════════════════════════════════════════════════════
   WISHLIST — saved products, resolvable to live catalog data,
   with a one-tap "move everything to the bag".
   ═══════════════════════════════════════════════════════════════ */

export default function WishlistPage() {
  const wishlistIds = useWishlist();
  const { products, isLoading } = useCatalog();
  const { addItem } = useCart();
  const ui = useStorefrontUI();

  const saved = useMemo(
    () =>
      wishlistIds
        .map((id) => products.find((p) => p.id === id))
        .filter((p): p is Product => Boolean(p)),
    [wishlistIds, products],
  );

  const inStock = saved.filter((p) => p.quantity_in_stock > 0);

  function addAllToCart() {
    if (inStock.length === 0) return;
    inStock.forEach((product) => addItem(product));
    compactToast.success(
      `${inStock.length} ${inStock.length === 1 ? "item" : "items"} moved to your bag`,
    );
    ui.openCart();
  }

  return (
    <div className="pb-16 pt-24 sm:pt-28">
      <Container>
        <Reveal>
          <div className="mb-10 flex flex-wrap items-end justify-between gap-6">
            <div className="max-w-xl">
              <p className="sf-eyebrow mb-3" style={{ color: "var(--sf-gold)" }}>
                Saved for later
              </p>
              <h1
                className="sf-display text-4xl font-medium sm:text-5xl"
                style={{ color: "var(--sf-ink)" }}
              >
                Your wishlist
              </h1>
              {saved.length > 0 && (
                <p className="mt-3 text-[15px]" style={{ color: "var(--sf-ink-soft)" }}>
                  {saved.length} {saved.length === 1 ? "item" : "items"} saved ·{" "}
                  {inStock.length} in stock right now
                </p>
              )}
            </div>
            {saved.length > 0 && (
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    wishlistStore.clear();
                    compactToast.info("Wishlist cleared");
                  }}
                  className="flex h-11 items-center gap-2 rounded-full px-5 text-[13.5px] font-semibold transition-colors hover:bg-black/5"
                  style={{ border: "1px solid var(--sf-line-strong)", color: "var(--sf-ink-soft)" }}
                >
                  <Trash2 className="h-4 w-4" />
                  Clear
                </button>
                <button
                  type="button"
                  onClick={addAllToCart}
                  disabled={inStock.length === 0}
                  className="flex h-11 items-center gap-2 rounded-full px-5 text-[13.5px] font-semibold transition-all duration-300 hover:-translate-y-0.5 disabled:opacity-40"
                  style={{
                    background: "var(--sf-accent)",
                    color: "var(--sf-accent-ink)",
                    boxShadow: "var(--sf-shadow-accent)",
                  }}
                >
                  <ShoppingBag className="h-4 w-4" />
                  Add all to bag
                </button>
              </div>
            )}
          </div>
        </Reveal>

        {isLoading && wishlistIds.length > 0 ? (
          <ProductGridSkeleton count={4} />
        ) : saved.length === 0 ? (
          <EmptyState
            title="Nothing saved yet"
            body="Tap the heart on any product and it will wait for you here — across visits, on this device."
            action={
              <SolidButton to="/products">
                <Heart className="h-4 w-4" />
                Find something to love
              </SolidButton>
            }
          />
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
            {saved.map((product, index) => (
              <Reveal key={product.id} delay={Math.min(index * 0.05, 0.25)}>
                <ProductCard product={product} priority={index < 4} />
              </Reveal>
            ))}
          </div>
        )}
      </Container>
    </div>
  );
}
