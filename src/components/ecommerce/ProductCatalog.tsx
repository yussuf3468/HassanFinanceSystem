import { useState, useMemo, useCallback } from "react";
import { Search, Filter, X, SlidersHorizontal } from "lucide-react";
import { Product } from "../../types";
import ProductCardEcommerce from "./ProductCard";
import Container from "./Container";
import Input from "./Input";
import Button from "./Button";
import { ProductGridSkeleton } from "./Skeletons";
import { useDebounceValue } from "../../hooks/usePerformance";

interface ProductCatalogProps {
  products: Product[];
  onAddToCart: (product: Product) => void;
  onQuickView?: (product: Product) => void;
  isLoading?: boolean;
}

const categories = [
  "all",
  "Books",
  "Backpacks",
  "Bottles",
  "Electronics",
  "Pens",
  "Notebooks",
  "Pencils",
  "Shapeners",
  "Markers",
  "Other",
];

const priceRanges = [
  { label: "All Prices", min: 0, max: Infinity },
  { label: "Under KES 500", min: 0, max: 500 },
  { label: "KES 500 - 1000", min: 500, max: 1000 },
  { label: "KES 1000 - 2000", min: 1000, max: 2000 },
  { label: "KES 2000 - 5000", min: 2000, max: 5000 },
  { label: "Over KES 5000", min: 5000, max: Infinity },
];

const sortOptions = [
  { label: "Newest First", value: "newest" },
  { label: "Price: Low to High", value: "price-asc" },
  { label: "Price: High to Low", value: "price-desc" },
  { label: "Name: A to Z", value: "name-asc" },
  { label: "Most Popular", value: "popular" },
];

export default function ProductCatalog({
  products,
  onAddToCart,
  onQuickView,
  isLoading = false,
}: ProductCatalogProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedPriceRange, setSelectedPriceRange] = useState(0);
  const [sortBy, setSortBy] = useState("newest");
  const [showFilters, setShowFilters] = useState(false);
  const [showInStockOnly, setShowInStockOnly] = useState(false);

  const debouncedSearch = useDebounceValue(searchTerm, 300);

  // Filter and sort products
  const filteredProducts = useMemo(() => {
    let filtered = [...products];

    // Search filter
    if (debouncedSearch) {
      filtered = filtered.filter(
        (product) =>
          product.name.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
          product.category
            .toLowerCase()
            .includes(debouncedSearch.toLowerCase()) ||
          product.description
            ?.toLowerCase()
            .includes(debouncedSearch.toLowerCase()),
      );
    }

    // Category filter
    if (selectedCategory !== "all") {
      filtered = filtered.filter(
        (product) => product.category === selectedCategory,
      );
    }

    // Price range filter
    const priceRange = priceRanges[selectedPriceRange];
    filtered = filtered.filter(
      (product) =>
        product.selling_price >= priceRange.min &&
        product.selling_price <= priceRange.max,
    );

    // Stock filter
    if (showInStockOnly) {
      filtered = filtered.filter((product) => product.quantity_in_stock > 0);
    }

    // Sort
    switch (sortBy) {
      case "price-asc":
        filtered.sort((a, b) => a.selling_price - b.selling_price);
        break;
      case "price-desc":
        filtered.sort((a, b) => b.selling_price - a.selling_price);
        break;
      case "name-asc":
        filtered.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case "popular":
        filtered.sort((a, b) => {
          const aScore = (a.featured ? 1000 : 0) + a.quantity_in_stock;
          const bScore = (b.featured ? 1000 : 0) + b.quantity_in_stock;
          return bScore - aScore;
        });
        break;
      case "newest":
      default:
        filtered.sort(
          (a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
        );
        break;
    }

    return filtered;
  }, [
    products,
    debouncedSearch,
    selectedCategory,
    selectedPriceRange,
    sortBy,
    showInStockOnly,
  ]);

  const clearFilters = useCallback(() => {
    setSearchTerm("");
    setSelectedCategory("all");
    setSelectedPriceRange(0);
    setSortBy("newest");
    setShowInStockOnly(false);
  }, []);

  const activeFiltersCount = [
    selectedCategory !== "all",
    selectedPriceRange !== 0,
    showInStockOnly,
    searchTerm.length > 0,
  ].filter(Boolean).length;

  return (
    <section className="min-h-screen py-6 sm:py-12 bg-slate-50 dark:bg-slate-900">
      <Container>
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-slate-900 dark:text-white mb-1 sm:mb-2">
              All Products
            </h2>
            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400">
              {filteredProducts.length} products found
            </p>
          </div>

          {/* Mobile Filter Toggle - Larger button */}
          <Button
            onClick={() => setShowFilters(!showFilters)}
            variant="outline"
            size="lg"
            className="sm:hidden !min-h-[48px] touch-manipulation font-semibold"
          >
            <SlidersHorizontal className="w-5 h-5" />
            Filters
            {activeFiltersCount > 0 && (
              <span className="ml-2 bg-amber-600 text-white rounded-full min-w-[24px] h-6 flex items-center justify-center text-sm font-bold px-2">
                {activeFiltersCount}
              </span>
            )}
          </Button>
        </div>

        {/* Search Bar - Larger on mobile */}
        <div className="mb-4 sm:mb-6">
          <Input
            type="search"
            placeholder="Search products..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            icon={Search}
            className="max-w-full sm:max-w-2xl text-base sm:text-sm h-12 sm:h-auto"
          />
        </div>

        {/* Filters Section - Mobile optimized */}
        <div
          className={`${
            showFilters ? "block" : "hidden"
          } sm:block mb-6 sm:mb-8 space-y-4 sm:space-y-6 bg-white dark:bg-slate-800 rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-lg`}
        >
          {/* Category Filter */}
          <div>
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <h3 className="text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-2">
                <Filter className="w-4 h-4" />
                Categories
              </h3>
            </div>
            {isLoading ? (
              <div className="flex flex-wrap gap-2">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div
                    key={i}
                    className="h-10 w-28 bg-slate-200 dark:bg-slate-700 rounded-full animate-pulse"
                  />
                ))}
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {categories.map((category) => (
                  <button
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                    className={`px-4 sm:px-4 py-2.5 sm:py-2 rounded-full text-sm sm:text-sm font-semibold transition-all duration-300 min-h-[44px] sm:min-h-[40px] touch-manipulation ${
                      selectedCategory === category
                        ? "bg-gradient-to-r from-amber-600 to-yellow-600 text-white shadow-lg shadow-amber-500/50"
                        : "bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-amber-100 dark:hover:bg-amber-900 active:scale-95"
                    }`}
                  >
                    {category === "all" ? "All Products" : category}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Price Range & Additional Filters - Full width on mobile */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Price Range */}
            <div>
              <label className="block text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2 sm:mb-3">
                Price Range
              </label>
              <select
                value={selectedPriceRange}
                onChange={(e) => setSelectedPriceRange(Number(e.target.value))}
                className="w-full px-4 py-3 sm:py-2.5 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-medium focus:border-amber-500 focus:ring-4 focus:ring-amber-500/20 transition-all text-base sm:text-sm min-h-[48px] sm:min-h-[44px] touch-manipulation"
              >
                {priceRanges.map((range, index) => (
                  <option key={index} value={index}>
                    {range.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Sort By */}
            <div>
              <label className="block text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2 sm:mb-3">
                Sort By
              </label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full px-4 py-3 sm:py-2.5 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-medium focus:border-amber-500 focus:ring-4 focus:ring-amber-500/20 transition-all text-base sm:text-sm min-h-[48px] sm:min-h-[44px] touch-manipulation"
              >
                {sortOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Stock Filter - Larger touch target */}
            <div className="flex items-end">
              <label className="flex items-center gap-3 cursor-pointer bg-slate-100 dark:bg-slate-700 px-4 py-3 sm:py-3 rounded-xl hover:bg-amber-100 dark:hover:bg-amber-900 active:bg-amber-200 dark:active:bg-amber-800 transition-colors w-full min-h-[48px] sm:min-h-[44px] touch-manipulation">
                <input
                  type="checkbox"
                  checked={showInStockOnly}
                  onChange={(e) => setShowInStockOnly(e.target.checked)}
                  className="w-6 h-6 sm:w-5 sm:h-5 rounded border-2 border-slate-300 dark:border-slate-600 text-amber-600 focus:ring-2 focus:ring-amber-500 focus:ring-offset-0"
                />
                <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                  In Stock Only
                </span>
              </label>
            </div>
          </div>

          {/* Clear Filters Button */}
          {activeFiltersCount > 0 && (
            <div className="flex justify-end">
              <Button onClick={clearFilters} variant="ghost" size="sm">
                <X className="w-4 h-4" />
                Clear All Filters
              </Button>
            </div>
          )}
        </div>

        {/* Products Grid */}
        {isLoading ? (
          <ProductGridSkeleton count={12} />
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-24 h-24 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6">
              <Search className="w-12 h-12 text-slate-400" />
            </div>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
              No products found
            </h3>
            <p className="text-slate-600 dark:text-slate-400 mb-6">
              Try adjusting your filters or search terms
            </p>
            <Button onClick={clearFilters} variant="primary">
              Clear Filters
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-4 lg:gap-6">
            {filteredProducts.map((product, index) => (
              <ProductCardEcommerce
                key={product.id}
                product={product}
                onAddToCart={onAddToCart}
                onQuickView={onQuickView}
                index={index}
              />
            ))}
          </div>
        )}
      </Container>
    </section>
  );
}
