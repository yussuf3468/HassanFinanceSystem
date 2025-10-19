import { useState, useEffect } from "react";
import {
  Search as SearchIcon,
  Filter,
  TrendingUp,
  Package,
  DollarSign,
  Eye,
  Sparkles,
  X,
  ShoppingCart,
  Tag,
  Info,
} from "lucide-react";
import { useProducts } from "../hooks/useSupabaseQuery";
import type { Product } from "../types";
import OptimizedImage from "./OptimizedImage";

export default function Search() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [viewingProduct, setViewingProduct] = useState<Product | null>(null);
  // Removed unused selectedProduct and productStats state

  // ✅ Use cached queries (reduces egress costs by 90%)
  const { data: products = [] } = useProducts();

  useEffect(() => {
    if (searchTerm && products.length > 0) {
      const filtered = products.filter(
        (p) =>
          p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.product_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (p.description &&
            p.description.toLowerCase().includes(searchTerm.toLowerCase()))
      );
      setFilteredProducts(filtered);
    } else {
      setFilteredProducts(products);
      // reset any transient UI state
    }
  }, [searchTerm, products]);

  // ✅ loadData function removed - using React Query cache instead

  function handleSelectProduct(product: Product) {
    // Selecting product just focuses details now
    setSearchTerm("");
    setFilteredProducts(products);
    setViewingProduct(product);
  }

  function handleViewProduct(product: Product, e: React.MouseEvent) {
    e.stopPropagation();
    setViewingProduct(product);
  }

  return (
    <div className="space-y-6 p-3 sm:p-6">
      <div className="max-w-7xl mx-auto space-y-4 sm:space-y-8">
        {/* Mobile-Optimized Header Section */}
        <div className="relative overflow-hidden bg-white/10 backdrop-blur-2xl rounded-2xl sm:rounded-3xl shadow-xl sm:shadow-2xl border border-white/20">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-600/5 via-blue-600/5 to-pink-600/5"></div>
          <div className="absolute top-0 right-0 w-32 h-32 sm:w-64 sm:h-64 bg-gradient-to-bl from-purple-500/20 to-transparent rounded-full blur-2xl sm:blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 sm:w-48 sm:h-48 bg-gradient-to-tr from-blue-500/20 to-transparent rounded-full blur-xl sm:blur-2xl"></div>

          <div className="relative z-10 p-4 sm:p-8 lg:p-12">
            <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-3 sm:space-y-0 sm:space-x-4 mb-4 sm:mb-6">
              <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-3 sm:p-4 rounded-xl sm:rounded-2xl shadow-lg flex-shrink-0">
                <SearchIcon className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white leading-tight">
                  Smart Product Search
                </h1>
                <p className="text-slate-300 text-sm sm:text-lg mt-1 sm:mt-2 flex flex-col sm:flex-row sm:items-center sm:space-x-2">
                  <span className="flex items-center space-x-2">
                    <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-400 flex-shrink-0" />
                    <span>Discover insights and analytics</span>
                  </span>
                  <span className="hidden sm:inline text-slate-400"></span>
                  <span className="text-xs sm:text-sm text-slate-400 mt-1 sm:mt-0">
                    for your inventory
                  </span>
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile-First Enhanced Search Section */}
        <div className="bg-white/10 backdrop-blur-2xl rounded-2xl sm:rounded-3xl shadow-xl border border-white/20 overflow-hidden">
          <div className="bg-gradient-to-r from-purple-500/20 via-blue-500/20 to-pink-500/20 p-0.5">
            <div className="bg-white/5 backdrop-blur-xl rounded-[15px] sm:rounded-[22px] p-4 sm:p-8">
              <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-3 sm:space-y-0 sm:space-x-4 mb-4 sm:mb-6">
                <div className="bg-gradient-to-r from-purple-600/20 to-blue-600/20 border border-purple-500/30 p-2 sm:p-3 rounded-lg sm:rounded-xl flex-shrink-0">
                  <Filter className="w-5 h-5 sm:w-6 sm:h-6 text-purple-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="text-xl sm:text-2xl font-bold text-white">
                    Search & Filter
                  </h2>
                  <p className="text-slate-300 text-sm sm:text-base">
                    Find products instantly with smart search
                  </p>
                </div>
              </div>

              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-blue-500/20 rounded-xl sm:rounded-2xl blur-lg sm:blur-xl group-focus-within:blur-md sm:group-focus-within:blur-lg transition-all duration-300"></div>
                <div className="relative">
                  <SearchIcon className="absolute left-4 sm:left-6 top-1/2 -translate-y-1/2 w-5 h-5 sm:w-6 sm:h-6 text-slate-300 group-focus-within:text-purple-300 transition-colors duration-300" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search products, ID, category, description..."
                    className="w-full pl-12 sm:pl-16 pr-4 sm:pr-6 py-4 sm:py-5 bg-white/15 backdrop-blur-xl border-2 border-white/30 text-white placeholder:text-slate-300 rounded-xl sm:rounded-2xl focus:ring-2 sm:focus:ring-4 focus:ring-purple-500/30 focus:border-purple-400 text-base sm:text-lg shadow-md sm:shadow-lg hover:shadow-lg sm:hover:shadow-xl hover:border-white/40 transition-all duration-300 font-medium"
                  />
                </div>
              </div>

              {/* Mobile-Optimized Search Results */}
              {filteredProducts.length > 0 && (
                <div className="mt-6 sm:mt-8">
                  <div className="bg-gradient-to-r from-white/5 to-purple-500/10 rounded-xl sm:rounded-2xl p-3 sm:p-4 mb-4 sm:mb-6 border border-white/20">
                    {searchTerm ? (
                      <div className="flex items-start sm:items-center space-x-3">
                        <div className="bg-purple-500 p-2 rounded-lg flex-shrink-0">
                          <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-white text-sm sm:text-base">
                            Found {filteredProducts.length} product(s)
                          </p>
                          <p className="text-slate-300 text-xs sm:text-sm leading-tight">
                            Matching '{searchTerm}' - Tap any product for
                            detailed analytics
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-start sm:items-center space-x-3">
                        <div className="bg-gradient-to-r from-purple-500 to-blue-500 p-2 rounded-lg flex-shrink-0">
                          <Package className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-white text-sm sm:text-base">
                            All {filteredProducts.length} Products
                          </p>
                          <p className="text-slate-300 text-xs sm:text-sm leading-tight">
                            Browse your complete inventory - Start typing to
                            search
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 max-h-80 sm:max-h-96 overflow-y-auto pr-1 sm:pr-2 scrollbar-thin scrollbar-thumb-purple-400 scrollbar-track-white/10">
                    {filteredProducts.map((product, index) => (
                      <button
                        key={product.id}
                        onClick={() => handleSelectProduct(product)}
                        className="group bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl sm:rounded-2xl p-3 sm:p-4 hover:shadow-lg sm:hover:shadow-xl hover:scale-[1.01] sm:hover:scale-[1.02] transition-all duration-300 text-left hover:border-purple-500/30 relative overflow-hidden"
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl sm:rounded-2xl"></div>

                        <div className="relative z-10 flex items-center space-x-3 sm:space-x-4">
                          {product.image_url ? (
                            <div className="relative flex-shrink-0 bg-white/5 rounded-lg sm:rounded-xl">
                              <OptimizedImage
                                src={product.image_url}
                                alt={product.name}
                                className="w-14 h-14 sm:w-18 sm:h-18 object-contain p-1 rounded-lg sm:rounded-xl shadow-sm sm:shadow-md group-hover:shadow-md sm:group-hover:shadow-lg transition-shadow duration-300"
                                fallbackClassName="w-14 h-14 sm:w-18 sm:h-18"
                                priority={index < 5}
                                preload={index < 10}
                                sizes="72px"
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/5 to-transparent rounded-lg sm:rounded-xl group-hover:from-black/10 transition-all duration-300"></div>
                            </div>
                          ) : (
                            <div className="w-14 h-14 sm:w-18 sm:h-18 bg-gradient-to-br from-white/10 to-white/20 rounded-lg sm:rounded-xl flex items-center justify-center group-hover:from-purple-500/20 group-hover:to-blue-500/20 transition-all duration-300 flex-shrink-0">
                              <Package className="w-6 h-6 sm:w-8 sm:h-8 text-slate-400 group-hover:text-purple-400" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-white group-hover:text-purple-300 transition-colors duration-300 truncate text-sm sm:text-base">
                              {product.name}
                            </p>
                            <p className="text-xs sm:text-sm text-slate-400 group-hover:text-slate-300 transition-colors duration-300 truncate">
                              ID: {product.product_id}
                            </p>
                            {product.description && (
                              <p className="text-xs text-slate-300 line-clamp-1 mt-1">
                                {product.description}
                              </p>
                            )}
                            <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-2 mt-1 sm:mt-2 space-y-1 sm:space-y-0">
                              <span className="inline-flex items-center px-2 py-0.5 sm:py-1 rounded-full text-xs font-medium bg-purple-500/20 text-purple-300 border border-purple-500/30 group-hover:bg-purple-500/30 transition-colors duration-300 w-fit">
                                {product.category}
                              </span>
                              <span className="text-xs sm:text-sm font-bold text-emerald-400">
                                KES {product.selling_price.toLocaleString()}
                              </span>
                            </div>
                          </div>
                          <div
                            onClick={(e) => handleViewProduct(product, e)}
                            className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex-shrink-0 p-2 hover:bg-purple-500/20 rounded-lg cursor-pointer"
                            title="View Product Details"
                          >
                            <Eye className="w-4 h-4 sm:w-5 sm:h-5 text-purple-400 hover:text-purple-300" />
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Product View Modal */}
        {viewingProduct && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white/10 backdrop-blur-2xl rounded-2xl shadow-2xl border border-white/20 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white/10 backdrop-blur-2xl rounded-t-2xl border-b border-white/20 p-4 sm:p-6 flex items-center justify-between">
                <h2 className="text-xl sm:text-2xl font-bold text-white">
                  Product Details
                </h2>
                <button
                  onClick={() => setViewingProduct(null)}
                  className="p-2 hover:bg-white/10 rounded-xl transition-colors duration-200"
                >
                  <X className="w-5 h-5 sm:w-6 sm:h-6 text-slate-400 hover:text-white" />
                </button>
              </div>

              <div className="p-4 sm:p-6 space-y-6">
                {/* Product Image */}
                <div className="flex justify-center">
                  {viewingProduct.image_url ? (
                    <div className="relative bg-white/5 rounded-2xl p-4">
                      <OptimizedImage
                        src={viewingProduct.image_url}
                        alt={viewingProduct.name}
                        className="w-48 h-48 sm:w-64 sm:h-64 object-contain rounded-xl shadow-lg"
                        fallbackClassName="w-48 h-48 sm:w-64 sm:h-64"
                        priority={true}
                        sizes="256px"
                      />
                    </div>
                  ) : (
                    <div className="w-48 h-48 sm:w-64 sm:h-64 bg-gradient-to-br from-white/10 to-white/20 rounded-2xl flex items-center justify-center">
                      <Package className="w-16 h-16 sm:w-20 sm:h-20 text-slate-400" />
                    </div>
                  )}
                </div>

                {/* Product Information */}
                <div className="space-y-4">
                  <div className="text-center">
                    <h3 className="text-2xl sm:text-3xl font-bold text-white mb-2">
                      {viewingProduct.name}
                    </h3>
                    <div className="flex flex-wrap justify-center gap-2">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-500/20 text-purple-300 border border-purple-500/30">
                        <Tag className="w-4 h-4 mr-1" />
                        {viewingProduct.category}
                      </span>
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        <DollarSign className="w-4 h-4 mr-1" />
                        KES {viewingProduct.selling_price.toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {/* Description */}
                  {viewingProduct.description && (
                    <div className="bg-white/5 backdrop-blur-xl rounded-xl p-4 border border-white/20">
                      <div className="flex items-center space-x-2 mb-2">
                        <Info className="w-5 h-5 text-purple-400" />
                        <h4 className="font-semibold text-white">
                          Description
                        </h4>
                      </div>
                      <p className="text-slate-300 leading-relaxed">
                        {viewingProduct.description}
                      </p>
                    </div>
                  )}

                  {/* Product Details Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="bg-gradient-to-r from-purple-500/20 to-blue-500/20 rounded-xl p-4 border border-purple-500/30">
                      <div className="flex items-center space-x-2 mb-2">
                        <Package className="w-5 h-5 text-purple-400" />
                        <span className="font-semibold text-white">
                          Product ID
                        </span>
                      </div>
                      <p className="text-purple-300 font-mono text-lg">
                        {viewingProduct.product_id}
                      </p>
                    </div>

                    <div className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-xl p-4 border border-blue-500/30">
                      <div className="flex items-center space-x-2 mb-2">
                        <ShoppingCart className="w-5 h-5 text-blue-400" />
                        <span className="font-semibold text-white">
                          Stock Quantity
                        </span>
                      </div>
                      <p className="text-blue-300 font-semibold text-lg">
                        {viewingProduct.quantity_in_stock} units
                      </p>
                    </div>

                    <div className="bg-gradient-to-r from-emerald-500/20 to-green-500/20 rounded-xl p-4 border border-emerald-500/30">
                      <div className="flex items-center space-x-2 mb-2">
                        <DollarSign className="w-5 h-5 text-emerald-400" />
                        <span className="font-semibold text-white">Price</span>
                      </div>
                      <p className="text-emerald-300 font-semibold text-lg">
                        KES {viewingProduct.selling_price.toLocaleString()}
                      </p>
                    </div>

                    <div className="bg-gradient-to-r from-orange-500/20 to-yellow-500/20 rounded-xl p-4 border border-orange-500/30">
                      <div className="flex items-center space-x-2 mb-2">
                        <Tag className="w-5 h-5 text-orange-400" />
                        <span className="font-semibold text-white">
                          Category
                        </span>
                      </div>
                      <p className="text-orange-300 font-semibold text-lg">
                        {viewingProduct.category}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
