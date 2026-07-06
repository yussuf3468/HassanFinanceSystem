import { useEffect, useMemo, useState } from "react";
import {
  Check,
  ChevronDown,
  ChevronRight,
  Heart,
  Minus,
  Plus,
  RotateCcw,
  Scale,
  ShieldCheck,
  ShoppingBag,
  Truck,
  Wallet,
} from "lucide-react";
import OptimizedImage from "../../components/OptimizedImage";
import { useCart } from "../../contexts/CartContext";
import compactToast from "../../utils/compactToast";
import ProductRail from "../components/ProductRail";
import { Container, EmptyState, Reveal, SolidButton } from "../components/ui";
import { storeConfig } from "../config/store";
import {
  categoryMetaFor,
  formatMoney,
  isLowStock,
  isNewProduct,
  relatedProducts,
  resolveCategorySlug,
  useCatalog,
} from "../lib/catalog";
import {
  recentlyViewedStore,
  useRecentlyViewed,
  useWishlist,
  wishlistStore,
} from "../lib/prefs";
import { Link, useRoute } from "../lib/router";
import { useStorefrontUI } from "../lib/ui-context";
import type { Product } from "../../types";

/* ═══════════════════════════════════════════════════════════════
   PRODUCT DETAIL — editorial two-column layout: large sticky
   image, buying panel, delivery/returns accordions, related and
   recently-viewed rails.
   ═══════════════════════════════════════════════════════════════ */

export default function ProductDetailPage() {
  const route = useRoute();
  const productId = route.segments[1] ?? "";
  const { products, isLoading } = useCatalog();

  const product = useMemo(
    () => products.find((p) => p.id === productId) ?? null,
    [products, productId],
  );

  // Record the visit once the product is known.
  useEffect(() => {
    if (product) recentlyViewedStore.push(product.id);
  }, [product?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (isLoading) {
    return (
      <div className="pb-16 pt-28">
        <Container>
          <div className="grid gap-10 lg:grid-cols-2">
            <div className="sf-shimmer aspect-[4/5] rounded-3xl" />
            <div className="space-y-4 pt-4">
              <div className="sf-shimmer h-4 w-28 rounded-full" />
              <div className="sf-shimmer h-10 w-3/4 rounded-2xl" />
              <div className="sf-shimmer h-8 w-40 rounded-2xl" />
              <div className="sf-shimmer h-28 w-full rounded-2xl" />
              <div className="sf-shimmer h-12 w-full rounded-full" />
            </div>
          </div>
        </Container>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="pt-24">
        <EmptyState
          title="This product has moved on"
          body="It may have sold out or been removed. The rest of the range is still waiting."
          action={<SolidButton to="/products">Browse all products</SolidButton>}
        />
      </div>
    );
  }

  return <ProductDetail product={product} products={products} />;
}

function ProductDetail({
  product,
  products,
}: {
  product: Product;
  products: Product[];
}) {
  const { addItem } = useCart();
  const ui = useStorefrontUI();
  const wishlist = useWishlist();
  const recentlyViewedIds = useRecentlyViewed();
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const [openSection, setOpenSection] = useState<string | null>("description");

  useEffect(() => {
    setQuantity(1);
    setAdded(false);
    setOpenSection("description");
  }, [product.id]);

  const outOfStock = product.quantity_in_stock <= 0;
  const saved = wishlist.includes(product.id);
  const categorySlug = resolveCategorySlug(product.category);
  const categoryMeta = categoryMetaFor(categorySlug);

  const related = useMemo(
    () => relatedProducts(products, product, 8),
    [products, product],
  );
  const recentlyViewed = useMemo(
    () =>
      recentlyViewedIds
        .filter((id) => id !== product.id)
        .map((id) => products.find((p) => p.id === id))
        .filter((p): p is Product => Boolean(p))
        .slice(0, 10),
    [recentlyViewedIds, products, product.id],
  );

  function handleAdd() {
    if (outOfStock) return;
    addItem(product, quantity);
    compactToast.addToCart(product.name);
    setAdded(true);
    setTimeout(() => setAdded(false), 1400);
  }

  function handleBuyNow() {
    if (outOfStock) return;
    addItem(product, quantity);
    ui.openCart();
  }

  const infoSections = [
    product.description
      ? {
          key: "description",
          title: "About this product",
          body: product.description,
        }
      : null,
    {
      key: "delivery",
      title: "Delivery",
      body: `${storeConfig.delivery.promise}. Free delivery on orders over ${formatMoney(
        storeConfig.delivery.freeThreshold,
      )}.`,
    },
    {
      key: "returns",
      title: "Returns & payment",
      body: `${storeConfig.delivery.returns}. ${storeConfig.delivery.payment}.`,
    },
  ].filter((s): s is { key: string; title: string; body: string } => Boolean(s));

  return (
    <div className="pb-16 pt-24 sm:pt-28">
      <Container>
        {/* Breadcrumbs */}
        <nav
          aria-label="Breadcrumb"
          className="mb-7 flex items-center gap-1.5 text-[13px]"
          style={{ color: "var(--sf-ink-faint)" }}
        >
          <Link to="/" className="transition-colors hover:underline">
            Home
          </Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <Link to="/products" className="transition-colors hover:underline">
            Products
          </Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <Link
            to={`/products?cat=${categorySlug}`}
            className="transition-colors hover:underline"
          >
            {categoryMeta.label}
          </Link>
        </nav>

        <div className="grid gap-10 lg:grid-cols-2 lg:gap-16">
          {/* Image */}
          <div className="lg:sticky lg:top-24 lg:self-start">
            <div
              className="group relative overflow-hidden rounded-[2rem]"
              style={{
                background: "var(--sf-bg-soft)",
                boxShadow: "var(--sf-shadow-md)",
              }}
            >
              <div className="aspect-[4/5] w-full transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.04]">
                <OptimizedImage
                  src={product.image_url}
                  alt={product.name}
                  priority
                  preset="large"
                  className="h-full w-full object-cover"
                  fallbackClassName="h-full w-full"
                />
              </div>
              {/* Status badges */}
              <div className="absolute left-5 top-5 flex flex-col items-start gap-2">
                {outOfStock && (
                  <span className="rounded-full bg-black/70 px-3 py-1.5 text-[12px] font-semibold text-white backdrop-blur-sm">
                    Out of stock
                  </span>
                )}
                {!outOfStock && isNewProduct(product) && (
                  <span
                    className="rounded-full px-3 py-1.5 text-[12px] font-semibold"
                    style={{
                      background: "var(--sf-accent)",
                      color: "var(--sf-accent-ink)",
                    }}
                  >
                    New arrival
                  </span>
                )}
                {!outOfStock && isLowStock(product) && (
                  <span
                    className="rounded-full px-3 py-1.5 text-[12px] font-semibold text-white"
                    style={{ background: "var(--sf-gold)" }}
                  >
                    Only {product.quantity_in_stock} left
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Buy panel */}
          <div>
            <p className="sf-eyebrow mb-3" style={{ color: "var(--sf-gold)" }}>
              {categoryMeta.label}
            </p>
            <h1
              className="sf-display sf-balance text-3xl font-medium leading-[1.1] sm:text-4xl"
              style={{ color: "var(--sf-ink)" }}
            >
              {product.name}
            </h1>

            <div className="mt-5 flex items-baseline gap-3">
              <p
                className="sf-display sf-tabular text-3xl font-semibold"
                style={{ color: "var(--sf-ink)" }}
              >
                {formatMoney(product.selling_price)}
              </p>
              {!outOfStock && (
                <span
                  className="rounded-full px-2.5 py-1 text-[11.5px] font-semibold"
                  style={{
                    background: "var(--sf-accent-soft)",
                    color: "var(--sf-accent)",
                  }}
                >
                  In stock · ready to ship
                </span>
              )}
            </div>

            {/* Quantity + CTAs */}
            <div className="mt-8 flex items-center gap-3">
              <div
                className="flex items-center rounded-full"
                style={{ border: "1px solid var(--sf-line-strong)" }}
              >
                <button
                  type="button"
                  aria-label="Decrease quantity"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="flex h-12 w-12 items-center justify-center rounded-full transition-colors hover:bg-black/5"
                  style={{ color: "var(--sf-ink)" }}
                >
                  <Minus className="h-4 w-4" />
                </button>
                <span
                  className="sf-tabular w-10 text-center text-[16px] font-semibold"
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
                  disabled={quantity >= product.quantity_in_stock}
                  className="flex h-12 w-12 items-center justify-center rounded-full transition-colors hover:bg-black/5 disabled:opacity-30"
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
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full transition-transform hover:scale-110"
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

              <button
                type="button"
                onClick={() => ui.toggleCompare(product.id)}
                aria-label="Add to comparison"
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full transition-transform hover:scale-110"
                style={
                  ui.compareIds.includes(product.id)
                    ? {
                        background: "var(--sf-ink)",
                        color: "var(--sf-bg)",
                        border: "1px solid var(--sf-ink)",
                      }
                    : {
                        border: "1px solid var(--sf-line-strong)",
                        color: "var(--sf-ink)",
                      }
                }
              >
                <Scale className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-4 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={handleAdd}
                disabled={outOfStock}
                className="flex min-h-[52px] flex-1 items-center justify-center gap-2.5 rounded-full text-[15px] font-semibold transition-all duration-300 hover:-translate-y-0.5 disabled:pointer-events-none disabled:opacity-40"
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
              {!outOfStock && (
                <button
                  type="button"
                  onClick={handleBuyNow}
                  className="flex min-h-[52px] flex-1 items-center justify-center gap-2.5 rounded-full text-[15px] font-semibold transition-all duration-300 hover:-translate-y-0.5"
                  style={{
                    border: "1.5px solid var(--sf-ink)",
                    color: "var(--sf-ink)",
                  }}
                >
                  <Wallet className="h-[18px] w-[18px]" />
                  Buy now
                </button>
              )}
            </div>

            {/* Trust strip */}
            <div
              className="mt-7 grid grid-cols-3 gap-3 rounded-2xl p-4"
              style={{ background: "var(--sf-surface)", border: "1px solid var(--sf-line)" }}
            >
              {[
                { icon: Truck, label: "Same-day Nairobi delivery" },
                { icon: RotateCcw, label: "7-day easy returns" },
                { icon: ShieldCheck, label: "100% genuine" },
              ].map(({ icon: Icon, label }) => (
                <div key={label} className="flex flex-col items-center gap-2 text-center">
                  <Icon className="h-5 w-5" style={{ color: "var(--sf-accent)" }} />
                  <span
                    className="text-[11.5px] leading-tight"
                    style={{ color: "var(--sf-ink-soft)" }}
                  >
                    {label}
                  </span>
                </div>
              ))}
            </div>

            {/* Info accordions */}
            <div className="mt-7 space-y-3">
              {infoSections.map((section) => {
                const isOpen = openSection === section.key;
                return (
                  <div
                    key={section.key}
                    className="overflow-hidden rounded-2xl"
                    style={{
                      background: "var(--sf-surface)",
                      border: "1px solid var(--sf-line)",
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => setOpenSection(isOpen ? null : section.key)}
                      aria-expanded={isOpen}
                      className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
                    >
                      <span
                        className="text-[14.5px] font-semibold"
                        style={{ color: "var(--sf-ink)" }}
                      >
                        {section.title}
                      </span>
                      <ChevronDown
                        className={`h-[18px] w-[18px] shrink-0 transition-transform duration-300 ${
                          isOpen ? "rotate-180" : ""
                        }`}
                        style={{ color: "var(--sf-ink-faint)" }}
                      />
                    </button>
                    <div
                      className="grid transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]"
                      style={{ gridTemplateRows: isOpen ? "1fr" : "0fr" }}
                    >
                      <div className="overflow-hidden">
                        <p
                          className="whitespace-pre-line px-5 pb-4 text-[14px] leading-relaxed"
                          style={{ color: "var(--sf-ink-soft)" }}
                        >
                          {section.body}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Related */}
        {related.length > 0 && (
          <section className="mt-20 sm:mt-28">
            <Reveal>
              <h2
                className="sf-display mb-6 text-2xl font-medium sm:text-3xl"
                style={{ color: "var(--sf-ink)" }}
              >
                You may also like
              </h2>
              <ProductRail products={related} />
            </Reveal>
          </section>
        )}

        {/* Recently viewed */}
        {recentlyViewed.length > 0 && (
          <section className="mt-16 sm:mt-20">
            <Reveal>
              <h2
                className="sf-display mb-6 text-2xl font-medium sm:text-3xl"
                style={{ color: "var(--sf-ink)" }}
              >
                Recently viewed
              </h2>
              <ProductRail products={recentlyViewed} />
            </Reveal>
          </section>
        )}
      </Container>
    </div>
  );
}
