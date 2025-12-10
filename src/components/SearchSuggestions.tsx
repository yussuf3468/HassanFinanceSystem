import { memo, useCallback, useEffect, useState } from "react";
import { Search, TrendingUp, Clock, Zap } from "lucide-react";
import type { Product } from "../types";
import { searchProducts } from "../utils/searchUtils";

interface SearchSuggestionsProps {
  searchTerm: string;
  products: Product[];
  onSelectProduct: (product: Product) => void;
  onSelectSearch: (term: string) => void;
  isVisible: boolean;
  onClose: () => void;
}

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
    const [trendingSearches] = useState([
      "Books",
      "Notebooks",
      "Pens",
      "Backpacks",
      "Electronics",
      "Textbooks",
      "Stationery",
      "School Supplies",
    ]);

    useEffect(() => {
      const saved = localStorage.getItem("recent-searches");
      if (saved) {
        setRecentSearches(JSON.parse(saved));
      }
    }, []);

    const saveSearch = useCallback(
      (term: string) => {
        if (!term.trim()) return;

        const updated = [
          term,
          ...recentSearches.filter((s) => s !== term),
        ].slice(0, 5);
        setRecentSearches(updated);
        localStorage.setItem("recent-searches", JSON.stringify(updated));
      },
      [recentSearches]
    );

    const handleSelectSearch = useCallback(
      (term: string) => {
        saveSearch(term);
        onSelectSearch(term);
        onClose();
      },
      [saveSearch, onSelectSearch, onClose]
    );

    const handleSelectProduct = useCallback(
      (product: Product) => {
        saveSearch(product.name);
        onSelectProduct(product);
        onClose();
      },
      [saveSearch, onSelectProduct, onClose]
    );

    const clearRecentSearches = useCallback(() => {
      setRecentSearches([]);
      localStorage.removeItem("recent-searches");
    }, []);

    if (!isVisible) return null;

    // Use advanced fuzzy search for better results
    const searchResults = searchProducts(products, searchTerm, {
      fuzzyThreshold: 0.7,
      includeDescription: true,
      maxResults: 5,
    });

    const filteredProducts = searchResults.map((result) => ({
      ...result.product,
      matchType: result.matchType,
      matchedFields: result.matchedFields,
    }));

    return (
      <div className="absolute top-full left-0 right-0 mt-2 bg-slate-900/95 backdrop-blur-2xl rounded-xl shadow-2xl border border-white/20 z-[105] max-h-96 overflow-y-auto">
        {searchTerm.trim() === "" ? (
          // Show recent and trending when no search term
          <div className="p-4 space-y-4">
            {recentSearches.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold text-white flex items-center space-x-2">
                    <Clock className="w-4 h-4" />
                    <span>Recent Searches</span>
                  </h4>
                  <button
                    onClick={clearRecentSearches}
                    className="text-xs text-slate-400 hover:text-slate-300"
                  >
                    Clear
                  </button>
                </div>
                <div className="space-y-1">
                  {recentSearches.map((term, index) => (
                    <button
                      key={index}
                      onClick={() => handleSelectSearch(term)}
                      className="w-full text-left px-3 py-2 hover:bg-white/10 rounded-lg transition-colors flex items-center space-x-2"
                    >
                      <Search className="w-4 h-4 text-slate-400" />
                      <span className="text-slate-300">{term}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div>
              <h4 className="font-semibold text-white mb-3 flex items-center space-x-2">
                <TrendingUp className="w-4 h-4" />
                <span>Trending Searches</span>
              </h4>
              <div className="flex flex-wrap gap-2">
                {trendingSearches.map((term, index) => (
                  <button
                    key={index}
                    onClick={() => handleSelectSearch(term)}
                    className="px-3 py-1.5 bg-purple-500/20 text-purple-300 border border-purple-500/30 rounded-full text-sm hover:bg-purple-500/30 transition-colors"
                  >
                    {term}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          // Show search results with fuzzy matching
          <div className="p-2">
            {filteredProducts.length > 0 ? (
              <div className="space-y-1">
                <div className="px-3 py-2 text-xs font-medium text-slate-400 uppercase tracking-wide flex items-center justify-between">
                  <span>Products ({filteredProducts.length})</span>
                  <span className="flex items-center gap-1">
                    <Zap className="w-3 h-3 text-yellow-400" />
                    <span className="text-yellow-400">Smart Search</span>
                  </span>
                </div>
                {filteredProducts.map((product) => (
                  <button
                    key={product.id}
                    onClick={() => handleSelectProduct(product)}
                    className="w-full text-left px-3 py-3 hover:bg-white/10 rounded-lg transition-colors flex items-center space-x-3 group"
                  >
                    <div className="w-12 h-12 bg-gradient-to-br from-white/10 to-white/20 rounded-lg flex items-center justify-center flex-shrink-0 p-1 group-hover:scale-105 transition-transform">
                      {product.image_url ? (
                        <img
                          src={product.image_url}
                          alt={product.name}
                          className="w-full h-full object-contain rounded-lg"
                        />
                      ) : (
                        <Search className="w-5 h-5 text-slate-400" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-white truncate">
                          {product.name}
                        </p>
                        {product.matchType === "fuzzy" && (
                          <span className="text-xs bg-yellow-500/20 text-yellow-300 border border-yellow-500/30 px-1.5 py-0.5 rounded-full">
                            ~
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-slate-400">
                          {product.category}
                        </span>
                        <span className="text-slate-500">•</span>
                        <span className="text-purple-300 font-semibold">
                          KES {product.selling_price.toLocaleString()}
                        </span>
                        {product.quantity > 0 ? (
                          <span className="text-xs bg-green-500/20 text-green-300 border border-green-500/30 px-1.5 py-0.5 rounded-full">
                            In Stock
                          </span>
                        ) : (
                          <span className="text-xs bg-red-500/20 text-red-300 border border-red-500/30 px-1.5 py-0.5 rounded-full">
                            Out of Stock
                          </span>
                        )}
                      </div>
                      {product.matchedFields &&
                        product.matchedFields.length > 0 && (
                          <p className="text-xs text-slate-500 mt-0.5">
                            Matched: {product.matchedFields.join(", ")}
                          </p>
                        )}
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="px-3 py-8 text-center">
                <Search className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                <p className="text-slate-300 font-medium">No products found</p>
                <p className="text-sm text-slate-400 mb-4">
                  Try different keywords or check spelling
                </p>
                {trendingSearches.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs text-slate-500 uppercase font-medium">
                      Try These Instead:
                    </p>
                    <div className="flex flex-wrap gap-2 justify-center">
                      {trendingSearches.slice(0, 3).map((term, index) => (
                        <button
                          key={index}
                          onClick={() => handleSelectSearch(term)}
                          className="px-3 py-1 bg-purple-500/20 text-purple-300 border border-purple-500/30 rounded-full text-xs hover:bg-purple-500/30 transition-colors"
                        >
                          {term}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Quick search suggestion */}
            {filteredProducts.length > 0 && (
              <div className="border-t border-white/20 pt-2 mt-2">
                <button
                  onClick={() => handleSelectSearch(searchTerm)}
                  className="w-full text-left px-3 py-2 hover:bg-white/10 rounded-lg transition-colors flex items-center space-x-2"
                >
                  <Search className="w-4 h-4 text-purple-400" />
                  <span className="text-purple-300 font-medium">
                    View all results for "{searchTerm}"
                  </span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }
);

SearchSuggestions.displayName = "SearchSuggestions";

export default SearchSuggestions;
