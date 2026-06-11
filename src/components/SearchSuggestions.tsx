import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Search, TrendingUp, Clock, X, ArrowUpRight, Tag } from "lucide-react";
import type { Product } from "../types";

interface SearchSuggestionsProps {
  searchTerm: string;
  products: Product[];
  onSelectProduct: (product: Product) => void;
  onSelectSearch: (term: string) => void;
  isVisible: boolean;
  onClose: () => void;
}

// Split text on the query (case-insensitive) and bold the matched part.
function highlight(text: string, query: string) {
  const q = query.trim();
  if (!q) return text;
  const idx = text.toLowerCase().indexOf(q.toLowerCase());
  if (idx === -1) return text;
  return (
    <>
      {text.slice(0, idx)}
      <span className="font-semibold text-[#1d1d1f] dark:text-white">
        {text.slice(idx, idx + q.length)}
      </span>
      {text.slice(idx + q.length)}
    </>
  );
}

const TRENDING = ["Books", "Notebooks", "Pens", "Backpacks", "Electronics"];

const SearchSuggestions = memo(
  ({
    searchTerm,
    products,
    onSelectProduct,
    onSelectSearch,
    isVisible,
    onClose,
  }: SearchSuggestionsProps) => {
    const [recentSearches, setRecentSearches] = useState<string[]>([]);
    const [activeIndex, setActiveIndex] = useState(-1);
    const listRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
      const saved = localStorage.getItem("recent-searches");
      if (saved) {
        try {
          setRecentSearches(JSON.parse(saved));
        } catch {
          /* ignore */
        }
      }
    }, []);

    const saveSearch = useCallback((term: string) => {
      if (!term.trim()) return;
      setRecentSearches((prev) => {
        const updated = [term, ...prev.filter((s) => s !== term)].slice(0, 6);
        localStorage.setItem("recent-searches", JSON.stringify(updated));
        return updated;
      });
    }, []);

    const handleSelectSearch = useCallback(
      (term: string) => {
        saveSearch(term);
        onSelectSearch(term);
        onClose();
      },
      [saveSearch, onSelectSearch, onClose],
    );

    const handleSelectProduct = useCallback(
      (product: Product) => {
        saveSearch(product.name);
        onSelectProduct(product);
        onClose();
      },
      [saveSearch, onSelectProduct, onClose],
    );

    const clearRecentSearches = useCallback(() => {
      setRecentSearches([]);
      localStorage.removeItem("recent-searches");
    }, []);

    const removeRecent = useCallback((term: string) => {
      setRecentSearches((prev) => {
        const updated = prev.filter((s) => s !== term);
        localStorage.setItem("recent-searches", JSON.stringify(updated));
        return updated;
      });
    }, []);

    const q = searchTerm.trim().toLowerCase();

    // Matching categories (unique)
    const matchedCategories = useMemo(() => {
      if (!q) return [];
      const set = new Map<string, number>();
      products.forEach((p) => {
        if (p.category && p.category.toLowerCase().includes(q)) {
          set.set(p.category, (set.get(p.category) || 0) + 1);
        }
      });
      return Array.from(set.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([category, count]) => ({ category, count }));
    }, [products, q]);

    // Matching products (name, category, or description)
    const filteredProducts = useMemo(() => {
      if (!q) return [];
      return products
        .filter(
          (p) =>
            p.name.toLowerCase().includes(q) ||
            p.category.toLowerCase().includes(q) ||
            (p.description ?? "").toLowerCase().includes(q),
        )
        .slice(0, 6);
    }, [products, q]);

    // Flat keyboard-navigable list: [categories…, products…, "search for X"]
    const navItems = useMemo(() => {
      if (!q) return [];
      return [
        ...matchedCategories.map((c) => ({
          type: "category" as const,
          value: c.category,
        })),
        ...filteredProducts.map((p) => ({
          type: "product" as const,
          value: p,
        })),
        { type: "search" as const, value: searchTerm },
      ];
    }, [q, matchedCategories, filteredProducts, searchTerm]);

    // Reset active index when the query or visibility changes
    useEffect(() => {
      setActiveIndex(-1);
    }, [q, isVisible]);

    // Keyboard navigation
    useEffect(() => {
      if (!isVisible) return;
      const onKey = (e: KeyboardEvent) => {
        if (e.key === "Escape") {
          onClose();
          return;
        }
        if (!navItems.length) return;
        if (e.key === "ArrowDown") {
          e.preventDefault();
          setActiveIndex((i) => (i + 1) % navItems.length);
        } else if (e.key === "ArrowUp") {
          e.preventDefault();
          setActiveIndex((i) => (i <= 0 ? navItems.length - 1 : i - 1));
        } else if (e.key === "Enter") {
          if (activeIndex < 0 || activeIndex >= navItems.length) return;
          e.preventDefault();
          const item = navItems[activeIndex];
          if (item.type === "product") handleSelectProduct(item.value);
          else handleSelectSearch(item.value as string);
        }
      };
      window.addEventListener("keydown", onKey);
      return () => window.removeEventListener("keydown", onKey);
    }, [
      isVisible,
      navItems,
      activeIndex,
      onClose,
      handleSelectProduct,
      handleSelectSearch,
    ]);

    if (!isVisible) return null;

    const rowBase =
      "w-full text-left px-3 py-2.5 rounded-xl transition-colors flex items-center gap-3";
    const rowActive = "bg-[#f5f5f7] dark:bg-[#2c2c2e]";
    const rowIdle = "hover:bg-[#f5f5f7] dark:hover:bg-[#2c2c2e]";

    // Index helpers for active highlighting
    const catOffset = 0;
    const prodOffset = matchedCategories.length;
    const searchIndex = matchedCategories.length + filteredProducts.length;

    return (
      <div
        ref={listRef}
        className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-[#1d1d1f] rounded-2xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3)] border border-black/5 dark:border-white/10 z-50 max-h-[70vh] overflow-y-auto scrollbar-hide"
      >
        {q === "" ? (
          /* ===== Empty: recent + trending ===== */
          <div className="p-3 space-y-4">
            {recentSearches.length > 0 && (
              <div>
                <div className="flex items-center justify-between px-2 mb-1.5">
                  <span className="text-[11px] font-medium uppercase tracking-wider text-[#86868b] inline-flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" />
                    Recent
                  </span>
                  <button
                    onClick={clearRecentSearches}
                    className="text-[12px] font-medium text-[#86868b] hover:text-[#1d1d1f] dark:hover:text-white transition-colors"
                  >
                    Clear
                  </button>
                </div>
                <div className="space-y-0.5">
                  {recentSearches.map((term) => (
                    <div key={term} className={`group ${rowBase} ${rowIdle}`}>
                      <button
                        onClick={() => handleSelectSearch(term)}
                        className="flex items-center gap-3 flex-1 min-w-0"
                      >
                        <Search className="w-4 h-4 text-[#86868b] flex-shrink-0" />
                        <span className="text-[14px] text-[#1d1d1f] dark:text-white truncate">
                          {term}
                        </span>
                      </button>
                      <button
                        onClick={() => removeRecent(term)}
                        aria-label={`Remove ${term}`}
                        className="opacity-0 group-hover:opacity-100 w-6 h-6 flex items-center justify-center rounded-full text-[#86868b] hover:bg-black/5 dark:hover:bg-white/10 transition-all"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div>
              <span className="px-2 mb-1.5 text-[11px] font-medium uppercase tracking-wider text-[#86868b] inline-flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5" />
                Trending
              </span>
              <div className="flex flex-wrap gap-2 px-2 pt-1">
                {TRENDING.map((term) => (
                  <button
                    key={term}
                    onClick={() => handleSelectSearch(term)}
                    className="px-3 h-8 bg-[#f5f5f7] dark:bg-[#2c2c2e] text-[#1d1d1f] dark:text-white text-[13px] font-medium rounded-full hover:bg-[#ebebed] dark:hover:bg-[#3a3a3c] transition-colors"
                  >
                    {term}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          /* ===== Query: grouped results ===== */
          <div className="p-2">
            {/* Categories */}
            {matchedCategories.length > 0 && (
              <div className="mb-1">
                <div className="px-3 py-1.5 text-[11px] font-medium uppercase tracking-wider text-[#86868b]">
                  Categories
                </div>
                {matchedCategories.map((c, i) => (
                  <button
                    key={c.category}
                    onMouseEnter={() => setActiveIndex(catOffset + i)}
                    onClick={() => handleSelectSearch(c.category)}
                    className={`${rowBase} ${
                      activeIndex === catOffset + i ? rowActive : rowIdle
                    }`}
                  >
                    <span className="w-9 h-9 rounded-lg bg-[#f5f5f7] dark:bg-[#2c2c2e] flex items-center justify-center flex-shrink-0">
                      <Tag className="w-4 h-4 text-[#86868b]" />
                    </span>
                    <span className="flex-1 min-w-0">
                      <span className="block text-[14px] text-[#1d1d1f] dark:text-white truncate">
                        {highlight(c.category, searchTerm)}
                      </span>
                      <span className="block text-[12px] text-[#86868b]">
                        {c.count} product{c.count !== 1 ? "s" : ""}
                      </span>
                    </span>
                    <ArrowUpRight className="w-4 h-4 text-[#c7c7cc] dark:text-[#48484a] flex-shrink-0" />
                  </button>
                ))}
              </div>
            )}

            {/* Products */}
            {filteredProducts.length > 0 ? (
              <div>
                <div className="px-3 py-1.5 text-[11px] font-medium uppercase tracking-wider text-[#86868b]">
                  Products
                </div>
                {filteredProducts.map((product, i) => (
                  <button
                    key={product.id}
                    onMouseEnter={() => setActiveIndex(prodOffset + i)}
                    onClick={() => handleSelectProduct(product)}
                    className={`${rowBase} ${
                      activeIndex === prodOffset + i ? rowActive : rowIdle
                    }`}
                  >
                    <span className="w-10 h-10 bg-[#f5f5f7] dark:bg-[#2c2c2e] rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden">
                      {product.image_url ? (
                        <img
                          src={product.image_url}
                          alt={product.name}
                          className="w-full h-full object-contain p-1"
                        />
                      ) : (
                        <Search className="w-4 h-4 text-[#86868b]" />
                      )}
                    </span>
                    <span className="flex-1 min-w-0">
                      <span className="block text-[14px] text-[#1d1d1f] dark:text-white truncate">
                        {highlight(product.name, searchTerm)}
                      </span>
                      <span className="block text-[12px] text-[#86868b] truncate">
                        {product.category} · KES{" "}
                        {product.selling_price.toLocaleString()}
                      </span>
                    </span>
                    {product.quantity_in_stock <= 0 && (
                      <span className="text-[11px] font-medium text-[#86868b] flex-shrink-0">
                        Sold out
                      </span>
                    )}
                  </button>
                ))}
              </div>
            ) : (
              matchedCategories.length === 0 && (
                <div className="px-3 py-10 text-center">
                  <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-[#f5f5f7] dark:bg-[#2c2c2e] flex items-center justify-center">
                    <Search className="w-5 h-5 text-[#86868b]" />
                  </div>
                  <p className="text-[15px] font-semibold text-[#1d1d1f] dark:text-white">
                    No matches for “{searchTerm}”
                  </p>
                  <p className="text-[13px] text-[#86868b] mt-1">
                    Try a different keyword or browse all products.
                  </p>
                </div>
              )
            )}

            {/* Search-all footer */}
            <div className="border-t border-black/5 dark:border-white/10 mt-1.5 pt-1.5">
              <button
                onMouseEnter={() => setActiveIndex(searchIndex)}
                onClick={() => handleSelectSearch(searchTerm)}
                className={`${rowBase} ${
                  activeIndex === searchIndex ? rowActive : rowIdle
                }`}
              >
                <span className="w-9 h-9 rounded-lg bg-[#1d1d1f] dark:bg-white flex items-center justify-center flex-shrink-0">
                  <Search className="w-4 h-4 text-white dark:text-[#1d1d1f]" />
                </span>
                <span className="text-[14px] text-[#1d1d1f] dark:text-white">
                  Search for “
                  <span className="font-semibold">{searchTerm}</span>”
                </span>
              </button>
            </div>
          </div>
        )}

        {/* Keyboard hint */}
        {q !== "" && navItems.length > 0 && (
          <div className="hidden sm:flex items-center gap-3 px-4 py-2 border-t border-black/5 dark:border-white/10 text-[11px] text-[#86868b]">
            <span className="inline-flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded bg-[#f5f5f7] dark:bg-[#2c2c2e] font-sans">
                ↑
              </kbd>
              <kbd className="px-1.5 py-0.5 rounded bg-[#f5f5f7] dark:bg-[#2c2c2e] font-sans">
                ↓
              </kbd>
              to navigate
            </span>
            <span className="inline-flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded bg-[#f5f5f7] dark:bg-[#2c2c2e] font-sans">
                ↵
              </kbd>
              to select
            </span>
            <span className="inline-flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded bg-[#f5f5f7] dark:bg-[#2c2c2e] font-sans">
                esc
              </kbd>
              to close
            </span>
          </div>
        )}
      </div>
    );
  },
);

SearchSuggestions.displayName = "SearchSuggestions";

export default SearchSuggestions;
