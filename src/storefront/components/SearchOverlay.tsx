import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight,
  Clock3,
  Flame,
  Search,
  Tag,
  TrendingUp,
  X,
} from "lucide-react";
import OptimizedImage from "../../components/OptimizedImage";
import {
  formatMoney,
  searchProducts,
  useCatalog,
  type ResolvedCategory,
} from "../lib/catalog";
import { recentSearchStore, useRecentSearches } from "../lib/prefs";
import { navigate } from "../lib/router";
import { useStorefrontUI } from "../lib/ui-context";
import type { Product } from "../../types";

/* ═══════════════════════════════════════════════════════════════
   Search — command-palette style overlay. Instant results while
   typing, recent + trending when idle, full keyboard navigation.
   ═══════════════════════════════════════════════════════════════ */

type Row =
  | { kind: "product"; product: Product }
  | { kind: "category"; category: ResolvedCategory }
  | { kind: "see-all"; query: string };

export default function SearchOverlay() {
  const ui = useStorefrontUI();
  const { products, categories } = useCatalog();
  const recentSearches = useRecentSearches();
  const [query, setQuery] = useState("");
  const [highlighted, setHighlighted] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (ui.searchOpen) {
      setQuery("");
      setHighlighted(0);
      // Wait for the enter animation before focusing.
      const t = setTimeout(() => inputRef.current?.focus(), 80);
      return () => clearTimeout(t);
    }
  }, [ui.searchOpen]);

  const trimmed = query.trim();

  const rows = useMemo<Row[]>(() => {
    if (!trimmed) return [];
    const lower = trimmed.toLowerCase();
    const categoryHits = categories
      .filter((c) => c.label.toLowerCase().includes(lower))
      .slice(0, 3)
      .map((category) => ({ kind: "category", category }) as Row);
    const productHits = searchProducts(products, trimmed, 7).map(
      (hit) => ({ kind: "product", product: hit.product }) as Row,
    );
    const result = [...productHits, ...categoryHits];
    if (productHits.length > 0) result.push({ kind: "see-all", query: trimmed });
    return result;
  }, [trimmed, products, categories]);

  const trending = useMemo(
    () => products.filter((p) => p.featured && p.quantity_in_stock > 0).slice(0, 5),
    [products],
  );

  useEffect(() => setHighlighted(0), [rows.length, trimmed]);

  function commitSearch(value: string) {
    if (value.trim()) recentSearchStore.push(value.trim());
  }

  function openRow(row: Row) {
    switch (row.kind) {
      case "product":
        commitSearch(query);
        ui.closeSearch();
        navigate(`/product/${row.product.id}`);
        break;
      case "category":
        commitSearch(query);
        ui.closeSearch();
        navigate(`/products?cat=${row.category.slug}`);
        break;
      case "see-all":
        commitSearch(row.query);
        ui.closeSearch();
        navigate(`/products?q=${encodeURIComponent(row.query)}`);
        break;
    }
  }

  function onKeyDown(event: React.KeyboardEvent) {
    if (event.key === "Escape") {
      ui.closeSearch();
      return;
    }
    if (rows.length === 0) {
      if (event.key === "Enter" && trimmed) {
        commitSearch(trimmed);
        ui.closeSearch();
        navigate(`/products?q=${encodeURIComponent(trimmed)}`);
      }
      return;
    }
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setHighlighted((i) => (i + 1) % rows.length);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setHighlighted((i) => (i - 1 + rows.length) % rows.length);
    } else if (event.key === "Enter") {
      event.preventDefault();
      openRow(rows[highlighted]);
    }
  }

  // Keep the highlighted row visible.
  useEffect(() => {
    listRef.current
      ?.querySelector(`[data-row-index="${highlighted}"]`)
      ?.scrollIntoView({ block: "nearest" });
  }, [highlighted]);

  return (
    <AnimatePresence>
      {ui.searchOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/45 px-4 pb-10 pt-[9vh] sm:pt-[12vh]"
          style={{ backdropFilter: "blur(8px)" }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={ui.closeSearch}
        >
          <motion.div
            role="dialog"
            aria-label="Search products"
            className="w-full max-w-2xl overflow-hidden rounded-3xl"
            style={{ background: "var(--sf-bg)", boxShadow: "var(--sf-shadow-lg)" }}
            initial={{ opacity: 0, y: -18, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12, scale: 0.98 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Input */}
            <div
              className="flex items-center gap-3 px-5 py-4"
              style={{ borderBottom: "1px solid var(--sf-line)" }}
            >
              <Search className="h-5 w-5 shrink-0" style={{ color: "var(--sf-ink-faint)" }} />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={onKeyDown}
                placeholder="Search products, categories…"
                aria-label="Search"
                className="h-9 flex-1 bg-transparent text-[16px] outline-none"
                style={{ color: "var(--sf-ink)" }}
              />
              <button
                type="button"
                onClick={ui.closeSearch}
                aria-label="Close search"
                className="flex h-8 w-8 items-center justify-center rounded-full transition-colors hover:bg-black/5"
                style={{ color: "var(--sf-ink-soft)" }}
              >
                <X className="h-[18px] w-[18px]" />
              </button>
            </div>

            <div ref={listRef} className="max-h-[58vh] overflow-y-auto p-3">
              {/* Idle state: recents + trending + categories */}
              {!trimmed && (
                <div className="space-y-5 p-2">
                  {recentSearches.length > 0 && (
                    <section>
                      <p className="sf-eyebrow mb-2.5 flex items-center gap-1.5 px-2" style={{ color: "var(--sf-ink-faint)" }}>
                        <Clock3 className="h-3.5 w-3.5" /> Recent
                      </p>
                      <div className="flex flex-wrap gap-2 px-2">
                        {recentSearches.map((term) => (
                          <button
                            key={term}
                            type="button"
                            onClick={() => setQuery(term)}
                            className="h-8 rounded-full px-3.5 text-[13px] font-medium transition-colors hover:bg-black/5"
                            style={{
                              background: "var(--sf-surface)",
                              border: "1px solid var(--sf-line)",
                              color: "var(--sf-ink-soft)",
                            }}
                          >
                            {term}
                          </button>
                        ))}
                      </div>
                    </section>
                  )}

                  {trending.length > 0 && (
                    <section>
                      <p className="sf-eyebrow mb-1.5 flex items-center gap-1.5 px-2" style={{ color: "var(--sf-ink-faint)" }}>
                        <Flame className="h-3.5 w-3.5" /> Trending now
                      </p>
                      {trending.map((product) => (
                        <button
                          key={product.id}
                          type="button"
                          onClick={() => {
                            ui.closeSearch();
                            navigate(`/product/${product.id}`);
                          }}
                          className="flex w-full items-center gap-3 rounded-2xl px-2 py-2 text-left transition-colors hover:bg-black/[0.04]"
                        >
                          <span
                            className="h-11 w-9 shrink-0 overflow-hidden rounded-lg"
                            style={{ background: "var(--sf-bg-soft)" }}
                          >
                            <OptimizedImage
                              src={product.image_url}
                              alt={product.name}
                              preset="thumbnail"
                              className="h-full w-full object-cover"
                              fallbackClassName="h-full w-full"
                            />
                          </span>
                          <span className="min-w-0 flex-1">
                            <span
                              className="block truncate text-[14px] font-medium"
                              style={{ color: "var(--sf-ink)" }}
                            >
                              {product.name}
                            </span>
                            <span
                              className="sf-tabular text-[12.5px]"
                              style={{ color: "var(--sf-ink-faint)" }}
                            >
                              {formatMoney(product.selling_price)}
                            </span>
                          </span>
                          <TrendingUp className="h-4 w-4 shrink-0" style={{ color: "var(--sf-gold)" }} />
                        </button>
                      ))}
                    </section>
                  )}

                  <section>
                    <p className="sf-eyebrow mb-2.5 px-2" style={{ color: "var(--sf-ink-faint)" }}>
                      Browse categories
                    </p>
                    <div className="flex flex-wrap gap-2 px-2">
                      {categories.slice(0, 6).map((category) => (
                        <button
                          key={category.slug}
                          type="button"
                          onClick={() => {
                            ui.closeSearch();
                            navigate(`/products?cat=${category.slug}`);
                          }}
                          className="flex h-9 items-center gap-2 rounded-full px-4 text-[13px] font-medium transition-transform hover:scale-105"
                          style={{
                            background: "var(--sf-accent-soft)",
                            color: "var(--sf-accent)",
                          }}
                        >
                          <Tag className="h-3.5 w-3.5" />
                          {category.label}
                        </button>
                      ))}
                    </div>
                  </section>
                </div>
              )}

              {/* Results */}
              {trimmed && rows.length === 0 && (
                <div className="px-4 py-12 text-center">
                  <p className="sf-display text-lg font-medium" style={{ color: "var(--sf-ink)" }}>
                    Nothing found for “{trimmed}”
                  </p>
                  <p className="mt-1.5 text-[14px]" style={{ color: "var(--sf-ink-soft)" }}>
                    Try a shorter word, or browse the categories instead.
                  </p>
                </div>
              )}

              {rows.map((row, index) => {
                const isActive = index === highlighted;
                const rowStyle = {
                  background: isActive ? "var(--sf-accent-soft)" : "transparent",
                };
                if (row.kind === "product") {
                  return (
                    <button
                      key={`p-${row.product.id}`}
                      data-row-index={index}
                      type="button"
                      onClick={() => openRow(row)}
                      onMouseEnter={() => setHighlighted(index)}
                      className="flex w-full items-center gap-3 rounded-2xl px-3 py-2 text-left"
                      style={rowStyle}
                    >
                      <span
                        className="h-12 w-10 shrink-0 overflow-hidden rounded-lg"
                        style={{ background: "var(--sf-bg-soft)" }}
                      >
                        <OptimizedImage
                          src={row.product.image_url}
                          alt={row.product.name}
                          preset="thumbnail"
                          className="h-full w-full object-cover"
                          fallbackClassName="h-full w-full"
                        />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[14px] font-medium" style={{ color: "var(--sf-ink)" }}>
                          {row.product.name}
                        </span>
                        <span className="text-[12.5px]" style={{ color: "var(--sf-ink-faint)" }}>
                          {row.product.category}
                        </span>
                      </span>
                      <span className="sf-tabular shrink-0 text-[14px] font-semibold" style={{ color: "var(--sf-ink)" }}>
                        {formatMoney(row.product.selling_price)}
                      </span>
                    </button>
                  );
                }
                if (row.kind === "category") {
                  return (
                    <button
                      key={`c-${row.category.slug}`}
                      data-row-index={index}
                      type="button"
                      onClick={() => openRow(row)}
                      onMouseEnter={() => setHighlighted(index)}
                      className="flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left"
                      style={rowStyle}
                    >
                      <span
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
                        style={{ background: "var(--sf-gold-soft)", color: "var(--sf-gold)" }}
                      >
                        <Tag className="h-4 w-4" />
                      </span>
                      <span className="flex-1 text-[14px] font-medium" style={{ color: "var(--sf-ink)" }}>
                        {row.category.label}
                        <span className="ml-2 text-[12.5px] font-normal" style={{ color: "var(--sf-ink-faint)" }}>
                          {row.category.count} items
                        </span>
                      </span>
                      <ArrowRight className="h-4 w-4 shrink-0" style={{ color: "var(--sf-ink-faint)" }} />
                    </button>
                  );
                }
                return (
                  <button
                    key="see-all"
                    data-row-index={index}
                    type="button"
                    onClick={() => openRow(row)}
                    onMouseEnter={() => setHighlighted(index)}
                    className="mt-1 flex w-full items-center justify-center gap-2 rounded-2xl px-3 py-3 text-[14px] font-semibold"
                    style={{ ...rowStyle, color: "var(--sf-accent)" }}
                  >
                    See all results for “{row.query}”
                    <ArrowRight className="h-4 w-4" />
                  </button>
                );
              })}
            </div>

            {/* Hint bar */}
            <div
              className="hidden items-center gap-4 px-5 py-2.5 text-[11.5px] sm:flex"
              style={{ borderTop: "1px solid var(--sf-line)", color: "var(--sf-ink-faint)" }}
            >
              <span><kbd className="font-semibold">↑↓</kbd> navigate</span>
              <span><kbd className="font-semibold">↵</kbd> open</span>
              <span><kbd className="font-semibold">esc</kbd> close</span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
