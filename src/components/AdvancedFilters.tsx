import { memo, useState } from "react";
import {
  SlidersHorizontal,
  X,
  Check,
  DollarSign,
  Package,
  Star,
  ArrowUpDown,
} from "lucide-react";
import type { FilterOptions, SortOption } from "../utils/searchUtils";

interface AdvancedFiltersProps {
  categories: string[];
  priceRange: { min: number; max: number };
  activeFilters: FilterOptions;
  activeSortBy: SortOption;
  onFilterChange: (filters: FilterOptions) => void;
  onSortChange: (sortBy: SortOption) => void;
  resultCount: number;
}

const AdvancedFilters = memo(
  ({
    categories,
    priceRange,
    activeFilters,
    activeSortBy,
    onFilterChange,
    onSortChange,
    resultCount,
  }: AdvancedFiltersProps) => {
    const [isOpen, setIsOpen] = useState(false);
    const [localMinPrice, setLocalMinPrice] = useState(
      activeFilters.minPrice || priceRange.min
    );
    const [localMaxPrice, setLocalMaxPrice] = useState(
      activeFilters.maxPrice || priceRange.max
    );

    const sortOptions: { value: SortOption; label: string; icon: string }[] = [
      { value: "relevance", label: "Best Match", icon: "🎯" },
      { value: "price-low", label: "Price: Low to High", icon: "💰" },
      { value: "price-high", label: "Price: High to Low", icon: "💎" },
      { value: "name-asc", label: "Name: A to Z", icon: "🔤" },
      { value: "name-desc", label: "Name: Z to A", icon: "🔡" },
      { value: "newest", label: "Newest First", icon: "⭐" },
    ];

    const handleCategoryToggle = (category: string) => {
      onFilterChange({
        ...activeFilters,
        category: activeFilters.category === category ? undefined : category,
      });
    };

    const handlePriceChange = () => {
      onFilterChange({
        ...activeFilters,
        minPrice: localMinPrice,
        maxPrice: localMaxPrice,
      });
    };

    const handleStockToggle = () => {
      onFilterChange({
        ...activeFilters,
        inStockOnly: !activeFilters.inStockOnly,
      });
    };

    const handleFeaturedToggle = () => {
      onFilterChange({
        ...activeFilters,
        featured: !activeFilters.featured,
      });
    };

    const clearFilters = () => {
      setLocalMinPrice(priceRange.min);
      setLocalMaxPrice(priceRange.max);
      onFilterChange({});
    };

    const activeFilterCount =
      (activeFilters.category && activeFilters.category !== "all" ? 1 : 0) +
      (activeFilters.minPrice !== undefined ||
      activeFilters.maxPrice !== undefined
        ? 1
        : 0) +
      (activeFilters.inStockOnly ? 1 : 0) +
      (activeFilters.featured ? 1 : 0);

    return (
      <div className="w-full">
        {/* Mobile Filter Toggle - Enhanced */}
        <div className="flex items-center justify-between gap-3 mb-6">
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-purple-600/20 to-blue-600/20 backdrop-blur-xl border-2 border-purple-500/30 rounded-2xl text-white hover:from-purple-600/30 hover:to-blue-600/30 transition-all duration-300 font-semibold shadow-lg hover:shadow-purple-500/30 hover:scale-105"
          >
            <SlidersHorizontal className="w-5 h-5" />
            <span className="text-sm sm:text-base">Filters & Sort</span>
            {activeFilterCount > 0 && (
              <span className="bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs px-2.5 py-1 rounded-full font-bold shadow-lg animate-bounce-subtle">
                {activeFilterCount}
              </span>
            )}
          </button>

          <div className="flex items-center gap-2 px-4 py-3 bg-white/5 backdrop-blur-xl border border-white/20 rounded-2xl">
            <span className="text-sm text-slate-400">Found:</span>
            <span className="text-lg font-bold text-transparent bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text">
              {resultCount}
            </span>
          </div>
        </div>

        {/* Filter Panel */}
        {isOpen && (
          <div className="bg-gradient-to-br from-slate-900/95 via-purple-900/95 to-slate-900/95 backdrop-blur-2xl border-2 border-purple-500/30 rounded-3xl p-6 mb-6 animate-slide-up shadow-2xl shadow-purple-900/30">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-transparent bg-gradient-to-r from-white via-purple-200 to-blue-200 bg-clip-text flex items-center gap-3">
                <SlidersHorizontal className="w-6 h-6 text-purple-400" />
                Filters & Sort
              </h3>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 hover:bg-white/10 rounded-xl transition-all duration-300 hover:scale-110 hover:rotate-90"
              >
                <X className="w-6 h-6 text-slate-300" />
              </button>
            </div>

            <div className="space-y-6">
              {/* Sort Options */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <ArrowUpDown className="w-5 h-5 text-purple-400" />
                  <h4 className="font-bold text-white text-lg">Sort By</h4>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {sortOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => {
                        onSortChange(option.value);
                        setIsOpen(false);
                      }}
                      className={`flex items-center gap-2 px-4 py-3.5 rounded-2xl transition-all duration-300 font-semibold shadow-lg hover:scale-105 ${
                        activeSortBy === option.value
                          ? "bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-purple-500/50 scale-105"
                          : "bg-white/5 text-slate-300 hover:bg-white/10 border-2 border-white/10 hover:border-purple-500/30"
                      }`}
                    >
                      <span className="text-lg">{option.icon}</span>
                      <span className="text-sm">{option.label}</span>
                      {activeSortBy === option.value && (
                        <Check className="w-5 h-5 ml-auto animate-scale-in" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Divider */}
              <div className="border-t-2 border-purple-500/20"></div>

              {/* Categories */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <Package className="w-5 h-5 text-purple-400" />
                  <h4 className="font-bold text-white text-lg">Categories</h4>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() =>
                      onFilterChange({ ...activeFilters, category: undefined })
                    }
                    className={`px-4 py-2.5 rounded-full transition-all duration-300 font-semibold text-sm shadow-md hover:scale-105 ${
                      !activeFilters.category ||
                      activeFilters.category === "all"
                        ? "bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-purple-500/50"
                        : "bg-white/5 text-slate-300 hover:bg-white/10 border-2 border-white/10 hover:border-purple-500/30"
                    }`}
                  >
                    All Categories
                  </button>
                  {categories.map((category) => (
                    <button
                      key={category}
                      onClick={() => handleCategoryToggle(category)}
                      className={`px-4 py-2.5 rounded-full transition-all duration-300 font-semibold text-sm shadow-md hover:scale-105 ${
                        activeFilters.category === category
                          ? "bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-purple-500/50"
                          : "bg-white/5 text-slate-300 hover:bg-white/10 border-2 border-white/10 hover:border-purple-500/30"
                      }`}
                    >
                      {category}
                    </button>
                  ))}
                </div>
              </div>

              {/* Price Range */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <DollarSign className="w-4 h-4 text-purple-400" />
                  <h4 className="font-semibold text-white">Price Range</h4>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center gap-4">
                    <div className="flex-1">
                      <label className="text-xs text-slate-400 mb-1 block">
                        Min Price
                      </label>
                      <input
                        type="number"
                        value={localMinPrice}
                        onChange={(e) =>
                          setLocalMinPrice(Number(e.target.value))
                        }
                        min={priceRange.min}
                        max={localMaxPrice}
                        className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded-lg text-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      />
                    </div>
                    <div className="flex-1">
                      <label className="text-xs text-slate-400 mb-1 block">
                        Max Price
                      </label>
                      <input
                        type="number"
                        value={localMaxPrice}
                        onChange={(e) =>
                          setLocalMaxPrice(Number(e.target.value))
                        }
                        min={localMinPrice}
                        max={priceRange.max}
                        className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded-lg text-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      />
                    </div>
                  </div>
                  <button
                    onClick={handlePriceChange}
                    className="w-full px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all font-medium"
                  >
                    Apply Price Range
                  </button>
                  <div className="text-xs text-slate-400 text-center">
                    Range: KES {priceRange.min.toLocaleString()} - KES{" "}
                    {priceRange.max.toLocaleString()}
                  </div>
                </div>
              </div>

              {/* Quick Filters */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Star className="w-4 h-4 text-purple-400" />
                  <h4 className="font-semibold text-white">Quick Filters</h4>
                </div>
                <div className="space-y-2">
                  <button
                    onClick={handleStockToggle}
                    className={`w-full flex items-center justify-between px-4 py-3 rounded-lg transition-all ${
                      activeFilters.inStockOnly
                        ? "bg-gradient-to-r from-green-600/30 to-emerald-600/30 border-2 border-green-500/50 text-white"
                        : "bg-white/5 text-slate-300 hover:bg-white/10 border border-white/10"
                    }`}
                  >
                    <span className="font-medium">📦 In Stock Only</span>
                    {activeFilters.inStockOnly && (
                      <Check className="w-5 h-5 text-green-400" />
                    )}
                  </button>

                  <button
                    onClick={handleFeaturedToggle}
                    className={`w-full flex items-center justify-between px-4 py-3 rounded-lg transition-all ${
                      activeFilters.featured
                        ? "bg-gradient-to-r from-yellow-600/30 to-orange-600/30 border-2 border-yellow-500/50 text-white"
                        : "bg-white/5 text-slate-300 hover:bg-white/10 border border-white/10"
                    }`}
                  >
                    <span className="font-medium">⭐ Featured Products</span>
                    {activeFilters.featured && (
                      <Check className="w-5 h-5 text-yellow-400" />
                    )}
                  </button>
                </div>
              </div>

              {/* Clear Filters */}
              {activeFilterCount > 0 && (
                <button
                  onClick={clearFilters}
                  className="w-full px-4 py-3 bg-red-500/20 text-red-300 border border-red-500/30 rounded-lg hover:bg-red-500/30 transition-all font-medium flex items-center justify-center gap-2"
                >
                  <X className="w-4 h-4" />
                  Clear All Filters
                </button>
              )}
            </div>
          </div>
        )}

        {/* Active Filters Display */}
        {!isOpen && activeFilterCount > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {activeFilters.category && activeFilters.category !== "all" && (
              <div className="flex items-center gap-1 px-3 py-1.5 bg-purple-500/20 text-purple-300 border border-purple-500/30 rounded-full text-sm">
                <span>Category: {activeFilters.category}</span>
                <button
                  onClick={() =>
                    onFilterChange({ ...activeFilters, category: undefined })
                  }
                  className="hover:bg-purple-500/30 rounded-full p-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            )}

            {(activeFilters.minPrice !== undefined ||
              activeFilters.maxPrice !== undefined) && (
              <div className="flex items-center gap-1 px-3 py-1.5 bg-blue-500/20 text-blue-300 border border-blue-500/30 rounded-full text-sm">
                <span>
                  Price: KES {activeFilters.minPrice?.toLocaleString()} - KES{" "}
                  {activeFilters.maxPrice?.toLocaleString()}
                </span>
                <button
                  onClick={() =>
                    onFilterChange({
                      ...activeFilters,
                      minPrice: undefined,
                      maxPrice: undefined,
                    })
                  }
                  className="hover:bg-blue-500/30 rounded-full p-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            )}

            {activeFilters.inStockOnly && (
              <div className="flex items-center gap-1 px-3 py-1.5 bg-green-500/20 text-green-300 border border-green-500/30 rounded-full text-sm">
                <span>In Stock</span>
                <button
                  onClick={handleStockToggle}
                  className="hover:bg-green-500/30 rounded-full p-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            )}

            {activeFilters.featured && (
              <div className="flex items-center gap-1 px-3 py-1.5 bg-yellow-500/20 text-yellow-300 border border-yellow-500/30 rounded-full text-sm">
                <span>Featured</span>
                <button
                  onClick={handleFeaturedToggle}
                  className="hover:bg-yellow-500/30 rounded-full p-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            )}

            <button
              onClick={clearFilters}
              className="px-3 py-1.5 bg-red-500/20 text-red-300 border border-red-500/30 rounded-full text-sm hover:bg-red-500/30 transition-all"
            >
              Clear All
            </button>
          </div>
        )}
      </div>
    );
  }
);

AdvancedFilters.displayName = "AdvancedFilters";

export default AdvancedFilters;
