import { memo, useCallback, useEffect, useState } from "react";
import { Search, TrendingUp, Clock } from "lucide-react";
import type { Product } from "../types";

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

    const filteredProducts = products
      .filter(
        (product) =>
          product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          product.category.toLowerCase().includes(searchTerm.toLowerCase())
      )
      .slice(0, 5);

    return (
      <div className="absolute top-full left-0 right-0 mt-2 bg-white/10 backdrop-blur-2xl rounded-xl shadow-2xl border border-white/20 z-50 max-h-96 overflow-y-auto">
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
                    className="px-3 py-1 bg-purple-500/20 text-purple-300 border border-purple-500/30 rounded-full text-sm hover:bg-purple-500/30 transition-colors"
                  >
                    {term}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          // Show search results
          <div className="p-2">
            {filteredProducts.length > 0 ? (
              <div className="space-y-1">
                <div className="px-3 py-2 text-xs font-medium text-slate-400 uppercase tracking-wide">
                  Products ({filteredProducts.length})
                </div>
                {filteredProducts.map((product) => (
                  <button
                    key={product.id}
                    onClick={() => handleSelectProduct(product)}
                    className="w-full text-left px-3 py-3 hover:bg-white/10 rounded-lg transition-colors flex items-center space-x-3"
                  >
                    <div className="w-10 h-10 bg-gradient-to-br from-white/10 to-white/20 rounded-lg flex items-center justify-center flex-shrink-0 p-1">
                      {product.image_url ? (
                        <img
                          src={product.image_url}
                          alt={product.name}
                          className="w-full h-full object-contain rounded-lg"
                        />
                      ) : (
                        <Search className="w-4 h-4 text-slate-400" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-white truncate">
                        {product.name}
                      </p>
                      <p className="text-sm text-slate-400">
                        {product.category} • KES{" "}
                        {product.selling_price.toLocaleString()}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="px-3 py-8 text-center">
                <Search className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                <p className="text-slate-300 font-medium">No products found</p>
                <p className="text-sm text-slate-400">
                  Try searching for something else
                </p>
              </div>
            )}

            {/* Quick search suggestion */}
            <div className="border-t border-white/20 pt-2 mt-2">
              <button
                onClick={() => handleSelectSearch(searchTerm)}
                className="w-full text-left px-3 py-2 hover:bg-white/10 rounded-lg transition-colors flex items-center space-x-2"
              >
                <Search className="w-4 h-4 text-purple-400" />
                <span className="text-purple-300 font-medium">
                  Search for "{searchTerm}"
                </span>
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }
);

SearchSuggestions.displayName = "SearchSuggestions";

export default SearchSuggestions;
