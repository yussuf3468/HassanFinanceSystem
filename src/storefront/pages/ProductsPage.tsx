import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, ChevronDown, RotateCcw, Search, SlidersHorizontal, X } from "lucide-react";
import ProductCard from "../components/ProductCard";
import ProductRail from "../components/ProductRail";
import {
  Chip,
  Container,
  EmptyState,
  ProductGridSkeleton,
  Reveal,
  SolidButton,
} from "../components/ui";
import { storeConfig } from "../config/store";
import {
  resolveCategorySlug,
  searchProducts,
  useCatalog,
} from "../lib/catalog";
import { useRecentlyViewed } from "../lib/prefs";
import { useQueryState } from "../lib/router";
import type { Product } from "../../types";

/* ═══════════════════════════════════════════════════════════════
   PRODUCTS — the discovery engine. Category, price, availability
   and text filters (all URL-persisted), five sort orders, and
   infinite scroll. Filters live in a sidebar on desktop and a
   bottom sheet on mobile.
   ═══════════════════════════════════════════════════════════════ */

type SortKey = "featured" | "newest" | "price-asc" | "price-desc" | "name";

const SORT_OPTIONS: Array<{ key: SortKey; label: string }> = [
  { key: "featured", label: "Featured" },
  { key: "newest", label: "Newest" },
  { key: "price-asc", label: "Price: low to high" },
  { key: "price-desc", label: "Price: high to low" },
  { key: "name", label: "Name A–Z" },
];

const PAGE_SIZE = 16;

const PRICE_PRESETS = [
  { label: "Under 250", min: "", max: "250" },
  { label: "250 – 500", min: "250", max: "500" },
  { label: "500 – 1,000", min: "500", max: "1000" },
  { label: "1,000 – 2,500", min: "1000", max: "2500" },
  { label: "Over 2,500", min: "2500", max: "" },
];

interface Filters {
  q: string;
  cat: string;
  sort: SortKey;
  min: string;
  max: string;
  stock: string; // "" all | "in" in stock | "low" low stock
}

export default function ProductsPage() {
  const { products, categories, isLoading } = useCatalog();
  const { query, setQuery } = useQueryState();
  const recentlyViewedIds = useRecentlyViewed();
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [sheetOpen, setSheetOpen] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const filters: Filters = useMemo(
    () => ({
      q: query.get("q") ?? "",
      cat: query.get("cat") ?? "",
      sort: (query.get("sort") as SortKey) || "featured",
      min: query.get("min") ?? "",
      max: query.get("max") ?? "",
      stock: query.get("stock") ?? "",
    }),
    [query],
  );

  const filtered = useMemo(() => {
    let list: Product[] = filters.q
      ? searchProducts(products, filters.q, products.length).map((h) => h.product)
      : [...products];

    if (filters.cat) {
      list = list.filter((p) => resolveCategorySlug(p.category) === filters.cat);
    }
    const min = Number(filters.min);
    const max = Number(filters.max);
    if (filters.min && !Number.isNaN(min)) list = list.filter((p) => p.selling_price >= min);
    if (filters.max && !Number.isNaN(max)) list = list.filter((p) => p.selling_price <= max);
    if (filters.stock === "in") list = list.filter((p) => p.quantity_in_stock > 0);
    if (filters.stock === "low")
      list = list.filter(
        (p) =>
          p.quantity_in_stock > 0 &&
          p.quantity_in_stock <= Math.max(p.reorder_level || 5, 5),
      );

    // Text search already ranked by relevance; only re-sort when the
    // user picked an explicit order or there is no search query.
    switch (filters.sort) {
      case "newest":
        list.sort(
          (a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
        );
        break;
      case "price-asc":
        list.sort((a, b) => a.selling_price - b.selling_price);
        break;
      case "price-desc":
        list.sort((a, b) => b.selling_price - a.selling_price);
        break;
      case "name":
        list.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case "featured":
      default:
        if (!filters.q) {
          list.sort((a, b) => {
            const stockA = a.quantity_in_stock > 0 ? 0 : 1;
            const stockB = b.quantity_in_stock > 0 ? 0 : 1;
            if (stockA !== stockB) return stockA - stockB;
            return (b.featured ? 1 : 0) - (a.featured ? 1 : 0);
          });
        }
        break;
    }
    return list;
  }, [products, filters]);

  // Reset pagination whenever the result set changes shape.
  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [filters.q, filters.cat, filters.sort, filters.min, filters.max, filters.stock]);

  // Infinite scroll sentinel.
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setVisibleCount((count) => Math.min(count + PAGE_SIZE, filtered.length));
        }
      },
      { rootMargin: "600px" },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [filtered.length]);

  const visible = filtered.slice(0, visibleCount);
  const activeFilterCount = [filters.cat, filters.min || filters.max, filters.stock, filters.q].filter(Boolean).length;

  const recentlyViewed = useMemo(
    () =>
      recentlyViewedIds
        .map((id) => products.find((p) => p.id === id))
        .filter((p): p is Product => Boolean(p))
        .slice(0, 10),
    [recentlyViewedIds, products],
  );

  const activeCategory = categories.find((c) => c.slug === filters.cat);

  function clearAll() {
    setQuery({ q: null, cat: null, min: null, max: null, stock: null, sort: null });
  }

  const filterPanel = (
    <FilterPanel
      filters={filters}
      categories={categories}
      onChange={(updates) => setQuery(updates)}
      onClear={clearAll}
    />
  );

  return (
    <div className="pb-16 pt-24 sm:pt-28">
      <Container>
        {/* Page head */}
        <div className="mb-8">
          <p className="sf-eyebrow mb-2" style={{ color: "var(--sf-gold)" }}>
            {filters.q ? "Search results" : "The full range"}
          </p>
          <h1
            className="sf-display text-3xl font-medium sm:text-5xl"
            style={{ color: "var(--sf-ink)" }}
          >
            {filters.q
              ? `“${filters.q}”`
              : (activeCategory?.label ?? "All products")}
          </h1>
          {activeCategory && (
            <p className="mt-2 text-[15px]" style={{ color: "var(--sf-ink-soft)" }}>
              {activeCategory.tagline}
            </p>
          )}
        </div>

        {/* Category chips */}
        <div className="sf-no-scrollbar -mx-5 mb-6 flex gap-2 overflow-x-auto px-5 sm:mx-0 sm:flex-wrap sm:px-0">
          <Chip active={!filters.cat} onClick={() => setQuery({ cat: null })}>
            All
          </Chip>
          {categories.map((category) => (
            <Chip
              key={category.slug}
              active={filters.cat === category.slug}
              onClick={() =>
                setQuery({ cat: filters.cat === category.slug ? null : category.slug })
              }
            >
              {category.label}
              <span className="ml-1.5 opacity-60">{category.count}</span>
            </Chip>
          ))}
        </div>

        {/* Toolbar */}
        <div
          className="mb-8 flex items-center justify-between gap-3 rounded-2xl px-4 py-3"
          style={{ background: "var(--sf-surface)", border: "1px solid var(--sf-line)" }}
        >
          <p className="text-[13.5px]" style={{ color: "var(--sf-ink-soft)" }}>
            <span className="font-semibold" style={{ color: "var(--sf-ink)" }}>
              {filtered.length}
            </span>{" "}
            {filtered.length === 1 ? "product" : "products"}
          </p>
          <div className="flex items-center gap-2">
            {activeFilterCount > 0 && (
              <button
                type="button"
                onClick={clearAll}
                className="hidden h-9 items-center gap-1.5 rounded-full px-3.5 text-[13px] font-medium transition-colors hover:bg-black/5 sm:flex"
                style={{ color: "var(--sf-ink-soft)" }}
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Reset
              </button>
            )}
            <button
              type="button"
              onClick={() => setSheetOpen(true)}
              className="flex h-9 items-center gap-2 rounded-full px-4 text-[13px] font-semibold lg:hidden"
              style={{ background: "var(--sf-accent-soft)", color: "var(--sf-accent)" }}
            >
              <SlidersHorizontal className="h-4 w-4" />
              Filters
              {activeFilterCount > 0 && (
                <span
                  className="flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-bold"
                  style={{ background: "var(--sf-accent)", color: "var(--sf-accent-ink)" }}
                >
                  {activeFilterCount}
                </span>
              )}
            </button>
            <SortDropdown
              value={filters.sort}
              onChange={(sort) => setQuery({ sort: sort === "featured" ? null : sort })}
            />
          </div>
        </div>

        {/* Body: sidebar + grid */}
        <div className="flex gap-10">
          <aside className="hidden w-60 shrink-0 lg:block">
            <div className="sticky top-24">{filterPanel}</div>
          </aside>

          <div className="min-w-0 flex-1">
            {isLoading ? (
              <ProductGridSkeleton count={12} />
            ) : visible.length === 0 ? (
              <EmptyState
                title={filters.q ? `Nothing matches “${filters.q}”` : "No products here yet"}
                body="Try removing a filter or two — or explore the whole range instead."
                action={
                  <SolidButton onClick={clearAll}>
                    <RotateCcw className="h-4 w-4" />
                    Clear all filters
                  </SolidButton>
                }
              />
            ) : (
              <>
                <div className="grid grid-cols-2 gap-4 sm:gap-6 xl:grid-cols-3 2xl:grid-cols-4">
                  {visible.map((product, index) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      priority={index < 6}
                    />
                  ))}
                </div>
                {visibleCount < filtered.length && (
                  <div ref={sentinelRef} className="py-10">
                    <ProductGridSkeleton count={4} />
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Recently viewed */}
        {recentlyViewed.length > 0 && (
          <section className="mt-20">
            <Reveal>
              <h2
                className="sf-display mb-6 text-2xl font-medium"
                style={{ color: "var(--sf-ink)" }}
              >
                Recently viewed
              </h2>
              <ProductRail products={recentlyViewed} />
            </Reveal>
          </section>
        )}
      </Container>

      {/* Mobile filter sheet */}
      <AnimatePresence>
        {sheetOpen && (
          <>
            <motion.div
              className="fixed inset-0 z-50 bg-black/40 lg:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSheetOpen(false)}
            />
            <motion.div
              role="dialog"
              aria-label="Filters"
              className="fixed inset-x-0 bottom-0 z-50 max-h-[82vh] overflow-y-auto rounded-t-3xl p-6 pb-10 lg:hidden"
              style={{ background: "var(--sf-bg)" }}
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 32, stiffness: 300 }}
            >
              <div className="mb-5 flex items-center justify-between">
                <h2 className="sf-display text-xl font-semibold" style={{ color: "var(--sf-ink)" }}>
                  Filters
                </h2>
                <button
                  type="button"
                  onClick={() => setSheetOpen(false)}
                  aria-label="Close filters"
                  className="flex h-9 w-9 items-center justify-center rounded-full transition-colors hover:bg-black/5"
                  style={{ color: "var(--sf-ink)" }}
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              {filterPanel}
              <button
                type="button"
                onClick={() => setSheetOpen(false)}
                className="mt-6 flex h-12 w-full items-center justify-center rounded-full text-[15px] font-semibold"
                style={{ background: "var(--sf-accent)", color: "var(--sf-accent-ink)" }}
              >
                Show {filtered.length} {filtered.length === 1 ? "product" : "products"}
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ── Filter panel (shared: sidebar + sheet) ─────────────────── */

function FilterPanel({
  filters,
  categories,
  onChange,
  onClear,
}: {
  filters: Filters;
  categories: ReturnType<typeof useCatalog>["categories"];
  onChange: (updates: Record<string, string | null>) => void;
  onClear: () => void;
}) {
  const [searchDraft, setSearchDraft] = useState(filters.q);
  useEffect(() => setSearchDraft(filters.q), [filters.q]);

  return (
    <div className="space-y-7">
      {/* Search within results */}
      <div>
        <p className="sf-eyebrow mb-3" style={{ color: "var(--sf-ink-faint)" }}>
          Search
        </p>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            onChange({ q: searchDraft.trim() || null });
          }}
          className="flex items-center gap-2 rounded-full px-4"
          style={{ background: "var(--sf-surface)", border: "1px solid var(--sf-line)" }}
        >
          <Search className="h-4 w-4 shrink-0" style={{ color: "var(--sf-ink-faint)" }} />
          <input
            value={searchDraft}
            onChange={(e) => setSearchDraft(e.target.value)}
            placeholder="Search products…"
            aria-label="Search within products"
            className="h-10 w-full bg-transparent text-[14px] outline-none"
            style={{ color: "var(--sf-ink)" }}
          />
          {filters.q && (
            <button
              type="button"
              aria-label="Clear search"
              onClick={() => onChange({ q: null })}
              style={{ color: "var(--sf-ink-faint)" }}
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </form>
      </div>

      {/* Categories */}
      <div>
        <p className="sf-eyebrow mb-3" style={{ color: "var(--sf-ink-faint)" }}>
          Category
        </p>
        <div className="space-y-1">
          {categories.map((category) => {
            const active = filters.cat === category.slug;
            return (
              <button
                key={category.slug}
                type="button"
                onClick={() => onChange({ cat: active ? null : category.slug })}
                className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-[14px] transition-colors"
                style={{
                  background: active ? "var(--sf-accent-soft)" : "transparent",
                  color: active ? "var(--sf-accent)" : "var(--sf-ink-soft)",
                  fontWeight: active ? 600 : 400,
                }}
              >
                <span className="truncate">{category.label}</span>
                <span className="ml-2 flex items-center gap-1.5">
                  <span className="text-[12px] opacity-70">{category.count}</span>
                  {active && <Check className="h-4 w-4" />}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Price */}
      <div>
        <p className="sf-eyebrow mb-3" style={{ color: "var(--sf-ink-faint)" }}>
          Price ({storeConfig.currency.symbol})
        </p>
        <div className="mb-3 flex flex-wrap gap-2">
          {PRICE_PRESETS.map((preset) => {
            const active = filters.min === preset.min && filters.max === preset.max;
            return (
              <button
                key={preset.label}
                type="button"
                onClick={() =>
                  onChange(
                    active
                      ? { min: null, max: null }
                      : { min: preset.min || null, max: preset.max || null },
                  )
                }
                className="h-8 rounded-full px-3 text-[12.5px] font-medium transition-colors"
                style={
                  active
                    ? { background: "var(--sf-ink)", color: "var(--sf-bg)" }
                    : {
                        background: "var(--sf-surface)",
                        border: "1px solid var(--sf-line)",
                        color: "var(--sf-ink-soft)",
                      }
                }
              >
                {preset.label}
              </button>
            );
          })}
        </div>
        <div className="flex items-center gap-2">
          <input
            type="number"
            inputMode="numeric"
            min={0}
            placeholder="Min"
            value={filters.min}
            onChange={(e) => onChange({ min: e.target.value || null })}
            aria-label="Minimum price"
            className="h-10 w-full rounded-xl px-3 text-[14px] outline-none"
            style={{
              background: "var(--sf-surface)",
              border: "1px solid var(--sf-line)",
              color: "var(--sf-ink)",
            }}
          />
          <span style={{ color: "var(--sf-ink-faint)" }}>–</span>
          <input
            type="number"
            inputMode="numeric"
            min={0}
            placeholder="Max"
            value={filters.max}
            onChange={(e) => onChange({ max: e.target.value || null })}
            aria-label="Maximum price"
            className="h-10 w-full rounded-xl px-3 text-[14px] outline-none"
            style={{
              background: "var(--sf-surface)",
              border: "1px solid var(--sf-line)",
              color: "var(--sf-ink)",
            }}
          />
        </div>
      </div>

      {/* Availability */}
      <div>
        <p className="sf-eyebrow mb-3" style={{ color: "var(--sf-ink-faint)" }}>
          Availability
        </p>
        <div className="space-y-1">
          {[
            { value: "", label: "Everything" },
            { value: "in", label: "In stock" },
            { value: "low", label: "Low stock — almost gone" },
          ].map((option) => {
            const active = filters.stock === option.value;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => onChange({ stock: option.value || null })}
                className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-[14px] transition-colors"
                style={{
                  background: active ? "var(--sf-accent-soft)" : "transparent",
                  color: active ? "var(--sf-accent)" : "var(--sf-ink-soft)",
                  fontWeight: active ? 600 : 400,
                }}
              >
                {option.label}
                {active && <Check className="h-4 w-4" />}
              </button>
            );
          })}
        </div>
      </div>

      <button
        type="button"
        onClick={onClear}
        className="flex items-center gap-2 text-[13px] font-semibold transition-colors hover:opacity-70"
        style={{ color: "var(--sf-ink-soft)" }}
      >
        <RotateCcw className="h-3.5 w-3.5" />
        Clear all filters
      </button>
    </div>
  );
}

/* ── Sort dropdown ──────────────────────────────────────────── */

function SortDropdown({
  value,
  onChange,
}: {
  value: SortKey;
  onChange: (key: SortKey) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClickAway = (event: MouseEvent) => {
      if (!ref.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClickAway);
    return () => document.removeEventListener("mousedown", onClickAway);
  }, [open]);

  const current = SORT_OPTIONS.find((o) => o.key === value) ?? SORT_OPTIONS[0];

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="flex h-9 items-center gap-2 rounded-full px-4 text-[13px] font-medium transition-colors"
        style={{
          background: "var(--sf-bg-soft)",
          color: "var(--sf-ink)",
        }}
      >
        <span className="hidden sm:inline" style={{ color: "var(--sf-ink-faint)" }}>
          Sort:
        </span>
        {current.label}
        <ChevronDown
          className={`h-4 w-4 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>
      <AnimatePresence>
        {open && (
          <motion.ul
            role="listbox"
            className="absolute right-0 top-11 z-30 w-52 overflow-hidden rounded-2xl p-1.5"
            style={{
              background: "var(--sf-surface)",
              border: "1px solid var(--sf-line)",
              boxShadow: "var(--sf-shadow-lg)",
            }}
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.15 }}
          >
            {SORT_OPTIONS.map((option) => (
              <li key={option.key}>
                <button
                  type="button"
                  role="option"
                  aria-selected={option.key === value}
                  onClick={() => {
                    onChange(option.key);
                    setOpen(false);
                  }}
                  className="flex w-full items-center justify-between rounded-xl px-3.5 py-2.5 text-left text-[13.5px] transition-colors hover:bg-black/[0.04]"
                  style={{
                    color: option.key === value ? "var(--sf-accent)" : "var(--sf-ink)",
                    fontWeight: option.key === value ? 600 : 400,
                  }}
                >
                  {option.label}
                  {option.key === value && <Check className="h-4 w-4" />}
                </button>
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}
