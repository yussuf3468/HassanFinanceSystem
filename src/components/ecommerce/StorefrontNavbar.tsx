import { useEffect, useMemo, useRef, useState } from "react";
import type { KeyboardEvent } from "react";
import { ShoppingCart, User, Menu, X, Package, Search, Sun, Moon } from "lucide-react";
import { useCart } from "../../contexts/CartContext";
import { useAuth } from "../../contexts/AuthContext";
import { useTheme } from "../../contexts/ThemeContext";
import type { Product } from "../../types";
import Button from "./Button";
import Container from "./Container";

interface StorefrontNavbarProps {
  products?: Product[];
  searchValue?: string;
  selectedSearchCategory?: string;
  onCartClick?: () => void;
  onLoginClick?: () => void;
  onLogoClick?: () => void;
  onTrackOrderClick?: () => void;
  onDashboardClick?: () => void;
  onSearchChange?: (value: string) => void;
  onSearchCategoryChange?: (category: string) => void;
  onSearchSubmit?: (value: string, category: string) => void;
  onProductSelect?: (product: Product) => void;
}

export default function StorefrontNavbar({
  products = [],
  searchValue = "",
  selectedSearchCategory = "all",
  onCartClick,
  onLoginClick,
  onLogoClick,
  onTrackOrderClick,
  onDashboardClick,
  onSearchChange,
  onSearchCategoryChange,
  onSearchSubmit,
  onProductSelect,
}: StorefrontNavbarProps) {
  const { totalItems } = useCart();
  const { user, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const searchContainerRef = useRef<HTMLDivElement | null>(null);

  const searchCategories = useMemo(() => {
    const categories = Array.from(
      new Set(products.map((product) => product.category)),
    ).sort();
    return ["all", ...categories];
  }, [products]);

  const suggestedProducts = useMemo(() => {
    const query = searchValue.trim().toLowerCase();
    if (!query) {
      return products
        .filter(
          (product) =>
            selectedSearchCategory === "all" ||
            product.category === selectedSearchCategory,
        )
        .slice(0, 6);
    }

    return products
      .filter((product) => {
        const matchesCategory =
          selectedSearchCategory === "all" || product.category === selectedSearchCategory;
        const haystack = [product.name, product.category, product.description || ""]
          .join(" ")
          .toLowerCase();
        return matchesCategory && haystack.includes(query);
      })
      .slice(0, 6);
  }, [products, searchValue, selectedSearchCategory]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(event.target as Node)
      ) {
        setIsSearchOpen(false);
        setHighlightedIndex(-1);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const submitSearch = (query: string) => {
    onSearchSubmit?.(query.trim(), selectedSearchCategory);
    setIsSearchOpen(false);
    setHighlightedIndex(-1);
    setMobileMenuOpen(false);
  };

  const handleSearchKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (!suggestedProducts.length) {
      if (event.key === "Enter") {
        event.preventDefault();
        submitSearch(searchValue);
      }
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setHighlightedIndex((current) =>
        Math.min(current + 1, suggestedProducts.length - 1),
      );
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      setHighlightedIndex((current) => Math.max(current - 1, -1));
      return;
    }

    if (event.key === "Escape") {
      setIsSearchOpen(false);
      setHighlightedIndex(-1);
      return;
    }

    if (event.key === "Enter") {
      event.preventDefault();
      if (highlightedIndex >= 0 && suggestedProducts[highlightedIndex]) {
        onProductSelect?.(suggestedProducts[highlightedIndex]);
        setIsSearchOpen(false);
        setHighlightedIndex(-1);
        setMobileMenuOpen(false);
        return;
      }
      submitSearch(searchValue);
    }
  };

  const renderSuggestionPanel = (mobile = false) => {
    if (!isSearchOpen) return null;

    return (
      <div
        className={`absolute ${mobile ? "left-0 right-0 top-[calc(100%+0.5rem)]" : "left-0 right-0 top-[calc(100%+0.75rem)]"} z-50 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900`}
      >
        <div className="border-b border-slate-100 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:border-slate-800 dark:text-slate-400">
          {searchValue.trim() ? "Suggested products" : "Popular products"}
        </div>
        {suggestedProducts.length === 0 ? (
          <div className="px-4 py-5 text-sm text-slate-500 dark:text-slate-400">
            No products match this search.
          </div>
        ) : (
          <div className="max-h-96 overflow-y-auto py-2">
            {suggestedProducts.map((product, index) => (
              <button
                key={product.id}
                onClick={() => {
                  onProductSelect?.(product);
                  setIsSearchOpen(false);
                  setHighlightedIndex(-1);
                  setMobileMenuOpen(false);
                }}
                className={`flex w-full items-start justify-between gap-3 px-4 py-3 text-left transition ${
                  highlightedIndex === index
                    ? "bg-amber-50 dark:bg-amber-900/20"
                    : "hover:bg-slate-50 dark:hover:bg-slate-800"
                }`}
              >
                <div className="min-w-0">
                  <p className="truncate font-semibold text-slate-900 dark:text-white">
                    {product.name}
                  </p>
                  <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                    {product.category}
                    {product.description ? ` • ${product.description}` : ""}
                  </p>
                </div>
                <span className="whitespace-nowrap text-sm font-bold text-amber-600 dark:text-amber-400">
                  KES {product.selling_price.toLocaleString()}
                </span>
              </button>
            ))}
          </div>
        )}
        <div className="border-t border-slate-100 p-3 dark:border-slate-800">
          <button
            onClick={() => submitSearch(searchValue)}
            className="w-full rounded-xl bg-amber-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-amber-400"
          >
            Search all results
          </button>
        </div>
      </div>
    );
  };

  return (
    <nav className="sticky top-0 z-50 border-t border-amber-500/60 bg-gradient-to-r from-amber-50 via-white to-amber-50 text-slate-900 shadow-xl dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 dark:text-white">
      <Container>
        <div className="flex items-center justify-between gap-4 py-3 sm:py-3.5">
          {/* Logo */}
          <button onClick={onLogoClick} className="min-w-0 text-left">
            <h1 className="truncate text-lg font-black uppercase tracking-wide text-amber-500 sm:text-2xl">
              HASSAN BOOKS
            </h1>
            <p className="text-xs text-slate-600 sm:text-sm dark:text-slate-300">
              Your Trusted Bookstore.
            </p>
          </button>

          {/* Desktop Search */}
          <div
            ref={searchContainerRef}
            className="relative hidden flex-1 md:flex md:max-w-[680px]"
          >
            <div className="flex w-full overflow-hidden rounded-2xl border border-amber-200 bg-white shadow-lg shadow-amber-200/60 dark:border-slate-600 dark:bg-slate-100 dark:shadow-black/20">
              <select
                value={selectedSearchCategory}
                onChange={(event) => onSearchCategoryChange?.(event.target.value)}
                className="max-w-[150px] border-r border-amber-200 bg-amber-50 px-3 text-sm font-semibold text-slate-700 outline-none dark:border-slate-300 dark:bg-slate-200"
              >
                {searchCategories.map((category) => (
                  <option key={category} value={category}>
                    {category === "all" ? "All" : category}
                  </option>
                ))}
              </select>
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchValue}
                  onChange={(event) => {
                    onSearchChange?.(event.target.value);
                    setIsSearchOpen(true);
                    setHighlightedIndex(-1);
                  }}
                  onFocus={() => setIsSearchOpen(true)}
                  onKeyDown={handleSearchKeyDown}
                  placeholder="Search books, stationery, electronics..."
                  className="w-full bg-white py-3 pl-12 pr-4 text-base text-slate-900 outline-none placeholder:text-slate-400"
                />
              </div>
              <button
                onClick={() => submitSearch(searchValue)}
                className="inline-flex items-center justify-center bg-amber-500 px-5 text-slate-900 transition hover:bg-amber-400"
                aria-label="Search products"
              >
                <Search className="h-5 w-5" />
              </button>
            </div>
            {renderSuggestionPanel()}
          </div>

          {/* Desktop Actions */}
          <div className="hidden lg:flex items-center gap-4">
            <button
              onClick={onTrackOrderClick}
              className="inline-flex items-center gap-2 rounded-xl border border-amber-600 px-4 py-2.5 text-sm font-semibold text-amber-700 transition hover:bg-amber-50 dark:text-amber-300 dark:hover:bg-amber-600/10"
            >
              <Package className="w-4 h-4" />
              Track Order
            </button>

            <button
              onClick={toggleTheme}
              className="p-2 text-slate-600 transition hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
              aria-label="Toggle theme"
            >
              {theme === "dark" ? (
                <Sun className="h-5 w-5" />
              ) : (
                <Moon className="h-5 w-5" />
              )}
            </button>

            <button
              onClick={onCartClick}
              className="relative p-2 text-slate-600 transition hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
              aria-label="Open cart"
            >
              <ShoppingCart className="h-6 w-6" />
              {totalItems > 0 && (
                <span className="absolute -top-1 -right-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-amber-500 px-1 text-[10px] font-bold text-white">
                  {totalItems > 9 ? "9+" : totalItems}
                </span>
              )}
            </button>

            {user && (
              <button
                onClick={onDashboardClick}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-700"
              >
                <User className="w-4 h-4" />
                Dashboard
              </button>
            )}
          </div>

          {/* Auth + Mobile toggle */}
          <div className="flex items-center gap-2">
            <div className="hidden sm:block">
              {user ? (
                <div className="flex items-center gap-2">
                  <Button
                    onClick={() => signOut()}
                    variant="ghost"
                    size="sm"
                    className="!text-slate-700 dark:!text-slate-200"
                  >
                    Sign Out
                  </Button>
                </div>
              ) : (
                <Button
                  onClick={onLoginClick}
                  variant="primary"
                  size="sm"
                  className="!rounded-xl !bg-amber-500 !border !border-amber-300 !px-5 !py-2 !text-sm !font-semibold hover:!bg-amber-400"
                >
                  <User className="w-4 h-4" />
                  Sign In
                </Button>
              )}
            </div>

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden w-10 h-10 rounded-xl bg-slate-200/80 flex items-center justify-center text-slate-700 dark:bg-slate-700/70 dark:text-slate-200"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden py-4 border-t border-amber-200 space-y-2 dark:border-slate-700">
            <div className="relative px-2 pb-2">
              <div className="space-y-2">
                <select
                  value={selectedSearchCategory}
                  onChange={(event) => onSearchCategoryChange?.(event.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm font-semibold text-slate-700 dark:border-slate-600 dark:bg-slate-700/60 dark:text-slate-100"
                >
                  {searchCategories.map((category) => (
                    <option key={category} value={category}>
                      {category === "all" ? "All categories" : category}
                    </option>
                  ))}
                </select>
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={searchValue}
                    onChange={(event) => {
                      onSearchChange?.(event.target.value);
                      setIsSearchOpen(true);
                      setHighlightedIndex(-1);
                    }}
                    onFocus={() => setIsSearchOpen(true)}
                    onKeyDown={handleSearchKeyDown}
                    placeholder="Search products..."
                    className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-10 pr-14 text-slate-900 placeholder:text-slate-400 dark:border-slate-600 dark:bg-slate-700/60 dark:text-slate-200"
                  />
                  <button
                    onClick={() => submitSearch(searchValue)}
                    className="absolute right-1.5 top-1.5 rounded-lg bg-amber-500 p-2 text-slate-900"
                    aria-label="Search products"
                  >
                    <Search className="h-4 w-4" />
                  </button>
                </div>
              </div>
              {renderSuggestionPanel(true)}
            </div>
            <button
              onClick={() => {
                onTrackOrderClick?.();
                setMobileMenuOpen(false);
              }}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-700 hover:bg-slate-100 font-semibold dark:text-slate-100 dark:hover:bg-slate-700"
            >
              <Package className="w-5 h-5" />
              Track Order
            </button>
            <button
              onClick={() => {
                onCartClick?.();
                setMobileMenuOpen(false);
              }}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-700 hover:bg-slate-100 font-semibold dark:text-slate-100 dark:hover:bg-slate-700"
            >
              <ShoppingCart className="w-5 h-5" />
              Cart ({totalItems})
            </button>
            {user ? (
              <>
                <button
                  onClick={() => {
                    onDashboardClick?.();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-700 hover:bg-slate-100 font-semibold dark:text-slate-100 dark:hover:bg-slate-700"
                >
                  <User className="w-5 h-5" />
                  My Dashboard
                </button>
                <button
                  onClick={() => {
                    signOut();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-300 hover:bg-red-950/40 font-semibold"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <button
                onClick={() => {
                  onLoginClick?.();
                  setMobileMenuOpen(false);
                }}
                className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl bg-amber-500 text-white font-semibold shadow-lg"
              >
                <User className="w-5 h-5" />
                Sign In
              </button>
            )}
          </div>
        )}
      </Container>
    </nav>
  );
}
