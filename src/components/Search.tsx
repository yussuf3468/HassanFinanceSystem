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
        <div className="relative overflow-hidden bg-gradient-to-br from-white via-amber-50/20 to-white backdrop-blur-xl rounded-2xl sm:rounded-3xl shadow-xl sm:shadow-2xl border border-amber-300/70 shadow-amber-100/50/60 shadow-sm">
          <div className="absolute inset-0 bg-gradient-to-r from-amber-100/20 to-stone-100/20"></div>
          <div className="absolute top-0 right-0 w-32 h-32 sm:w-64 sm:h-64 bg-gradient-to-bl from-amber-300/30 to-transparent rounded-full blur-2xl sm:blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 sm:w-48 sm:h-48 bg-gradient-to-tr from-amber-300/30 to-transparent rounded-full blur-xl sm:blur-2xl"></div>

          <div className="relative z-10 p-4 sm:p-8 lg:p-12">
            <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-3 sm:space-y-0 sm:space-x-4 mb-4 sm:mb-6">
              <div className="bg-gradient-to-r from-amber-500 to-amber-600 p-3 sm:p-4 rounded-2xl sm:rounded-2xl shadow-lg flex-shrink-0">
                <SearchIcon className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 leading-tight">
                  Smart Product Search
                </h1>
                <p className="text-slate-600 text-sm sm:text-lg mt-1 sm:mt-2 flex flex-col sm:flex-row sm:items-center sm:space-x-2">
                  <span className="flex items-center space-x-2">
                    <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-400 flex-shrink-0" />
                    <span>Discover insights and analytics</span>
                  </span>
                  <span className="hidden sm:inline text-slate-700 "></span>
                  <span className="text-xs sm:text-sm text-slate-700 mt-1 sm:mt-0">
                    for your inventory
                  </span>
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile-First Enhanced Search Section */}
        <div className="bg-gradient-to-br from-white via-amber-50/20 to-white backdrop-blur-xl rounded-2xl sm:rounded-3xl shadow-xl border border-amber-300/70 shadow-amber-100/50/60 shadow-sm overflow-hidden">
          <div className="bg-gradient-to-r from-amber-200/30 to-stone-200/30 p-0.5">
            <div className="bg-gradient-to-br from-white to-stone-50/50 backdrop-blur-xl rounded-[15px] sm:rounded-[22px] p-4 sm:p-8">
              <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-3 sm:space-y-0 sm:space-x-4 mb-4 sm:mb-6">
                <div className="bg-gradient-to-r from-amber-100 to-stone-100 border border-amber-300 p-2 sm:p-3 rounded-xl sm:rounded-2xl flex-shrink-0">
                  <Filter className="w-5 h-5 sm:w-6 sm:h-6 text-amber-700" />
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
                    Search & Filter
                  </h2>
                  <p className="text-slate-900/70 text-sm sm:text-base">
                    Find products instantly with smart search
                  </p>
                </div>
              </div>

              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-amber-200/30 to-stone-200/30 rounded-2xl sm:rounded-2xl blur-lg sm:blur-xl group-focus-within:blur-md sm:group-focus-within:blur-lg transition-all duration-300"></div>
                <div className="relative">
                  <SearchIcon className="absolute left-4 sm:left-6 top-1/2 -translate-y-1/2 w-5 h-5 sm:w-6 sm:h-6 text-slate-600 group-focus-within:text-amber-700 transition-colors duration-300" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search products, ID, category, description..."
                    className="w-full pl-12 sm:pl-16 pr-4 sm:pr-6 py-4 sm:py-5 bg-white/15 backdrop-blur-xl border-2 border-white/30 text-slate-900 placeholder:text-slate-900/50 rounded-2xl sm:rounded-2xl focus:ring-2 sm:focus:ring-4 focus:ring-amber-500/30 focus:border-amber-400 text-base sm:text-lg shadow-md sm:shadow-lg hover:shadow-lg sm:hover:shadow-xl hover:border-white/40 transition-all duration-300 font-medium"
                  />
                </div>
              </div>

              {/* Mobile-Optimized Search Results */}
              {filteredProducts.length > 0 && (
                <div className="mt-6 sm:mt-8">
                  <div className="bg-gradient-to-r from-white/5 to-amber-100/20 rounded-2xl sm:rounded-2xl p-3 sm:p-4 mb-4 sm:mb-6 border border-amber-300/70 shadow-amber-100/50/60 shadow-sm">
                    {searchTerm ? (
                      <div className="flex items-start sm:items-center space-x-3">
                        <div className="bg-amber-500 p-2 rounded-xl flex-shrink-0">
                          <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-slate-900 text-sm sm:text-base">
                            Found {filteredProducts.length} product(s)
                          </p>
                          <p className="text-slate-600 text-xs sm:text-sm leading-tight">
                            Matching '{searchTerm}' - Tap any product for
                            detailed analytics
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-start sm:items-center space-x-3">
                        <div className="bg-gradient-to-r from-amber-500 to-amber-600 p-2 rounded-xl flex-shrink-0">
                          <Package className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-slate-900 text-sm sm:text-base">
                            All {filteredProducts.length} Products
                          </p>
                          <p className="text-slate-600 text-xs sm:text-sm leading-tight">
                            Browse your complete inventory - Start typing to
                            search
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 max-h-80 sm:max-h-96 overflow-y-auto pr-1 sm:pr-2 scrollbar-thin scrollbar-thumb-amber-400 scrollbar-track-white/10">
                    {filteredProducts.map((product, index) => (
                      <button
                        key={product.id}
                        onClick={() => handleSelectProduct(product)}
                        className="group bg-white/90 backdrop-blur-xl border border-amber-300/70 shadow-amber-100/50/60 shadow-sm rounded-2xl sm:rounded-2xl p-3 sm:p-4 hover:shadow-lg sm:hover:shadow-xl hover:scale-[1.01] sm:hover:scale-[1.02] transition-all duration-300 text-left hover:border-amber-500/30 relative overflow-hidden"
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-amber-500/10 to-amber-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl sm:rounded-2xl"></div>

                        <div className="relative z-10 flex items-center space-x-3 sm:space-x-4">
                          {product.image_url ? (
                            <div className="relative flex-shrink-0 bg-gradient-to-br from-white to-stone-50/50 rounded-xl sm:rounded-xl">
                              <OptimizedImage
                                src={product.image_url}
                                alt={product.name}
                                className="w-14 h-14 sm:w-18 sm:h-18 object-contain p-1 rounded-xl sm:rounded-2xl shadow-sm sm:shadow-md group-hover:shadow-md sm:group-hover:shadow-lg transition-shadow duration-300"
                                fallbackClassName="w-14 h-14 sm:w-18 sm:h-18"
                                priority={index < 5}
                                preload={index < 10}
                                sizes="72px"
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/5 to-transparent rounded-xl sm:rounded-2xl group-hover:from-black/10 transition-all duration-300"></div>
                            </div>
                          ) : (
                            <div className="w-14 h-14 sm:w-18 sm:h-18 bg-gradient-to-br from-white/10 to-white/20 rounded-xl sm:rounded-2xl flex items-center justify-center group-hover:from-amber-500/20 group-hover:to-amber-600/20 transition-all duration-300 flex-shrink-0">
                              <Package className="w-6 h-6 sm:w-8 sm:h-8 text-slate-700 group-hover:text-amber-700" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-slate-900 group-hover:text-amber-900 transition-colors duration-300 truncate text-sm sm:text-base">
                              {product.name}
                            </p>
                            <p className="text-xs sm:text-sm text-slate-900/60 group-hover:text-slate-900/70 transition-colors duration-300 truncate">
                              ID: {product.product_id}
                            </p>
                            {product.description && (
                              <p className="text-xs text-slate-900/50 line-clamp-1 mt-1">
                                {product.description}
                              </p>
                            )}
                            <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-2 mt-1 sm:mt-2 space-y-1 sm:space-y-0">
                              <span className="inline-flex items-center px-2 py-0.5 sm:py-1 rounded-full text-xs font-medium bg-gradient-to-br from-amber-50/40 to-white text-amber-800 border border-amber-300 group-hover:bg-amber-200 transition-colors duration-300 w-fit">
                                {product.category}
                              </span>
                              <span className="text-xs sm:text-sm font-bold text-emerald-600">
                                KES {product.selling_price.toLocaleString()}
                              </span>
                            </div>
                          </div>
                          <div
                            onClick={(e) => handleViewProduct(product, e)}
                            className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex-shrink-0 p-2 hover:bg-gradient-to-br from-amber-50/40 to-white rounded-xl cursor-pointer"
                            title="View Product Details"
                          >
                            <Eye className="w-4 h-4 sm:w-5 sm:h-5 text-amber-700 hover:text-amber-800" />
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
            <div className="bg-white rounded-2xl shadow-2xl border border-amber-200/60 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white rounded-t-2xl border-b border-amber-200/60 p-4 sm:p-6 flex items-center justify-between">
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
                  Product Details
                </h2>
                <button
                  onClick={() => setViewingProduct(null)}
                  className="p-2 hover:bg-amber-50/40 rounded-2xl transition-colors duration-200"
                >
                  <X className="w-5 h-5 sm:w-6 sm:h-6 text-slate-700 hover:text-slate-900" />
                </button>
              </div>

              <div className="p-4 sm:p-6 space-y-6">
                {/* Product Image */}
                <div className="flex justify-center">
                  {viewingProduct.image_url ? (
                    <div className="relative bg-gradient-to-br from-white to-stone-50/50 rounded-2xl p-4">
                      <OptimizedImage
                        src={viewingProduct.image_url}
                        alt={viewingProduct.name}
                        className="w-48 h-48 sm:w-64 sm:h-64 object-contain rounded-2xl shadow-lg shadow-amber-300/10"
                        fallbackClassName="w-48 h-48 sm:w-64 sm:h-64"
                        priority={true}
                        sizes="256px"
                      />
                    </div>
                  ) : (
                    <div className="w-48 h-48 sm:w-64 sm:h-64 bg-gradient-to-br from-white/10 to-white/20 rounded-2xl flex items-center justify-center">
                      <Package className="w-16 h-16 sm:w-20 sm:h-20 text-slate-700" />
                    </div>
                  )}
                </div>

                {/* Product Information */}
                <div className="space-y-4">
                  <div className="text-center">
                    <h3 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-2">
                      {viewingProduct.name}
                    </h3>
                    <div className="flex flex-wrap justify-center gap-2">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gradient-to-br from-amber-50/40 to-white text-amber-800 border border-amber-300">
                        <Tag className="w-4 h-4 mr-1" />
                        {viewingProduct.category}
                      </span>
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <DollarSign className="w-4 h-4 mr-1" />
                        KES {viewingProduct.selling_price.toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {/* Description */}
                  {viewingProduct.description && (
                    <div className="bg-amber-50/40 rounded-2xl p-4 border border-amber-200/60">
                      <div className="flex items-center space-x-2 mb-2">
                        <Info className="w-5 h-5 text-amber-700" />
                        <h4 className="font-semibold text-slate-900">
                          Description
                        </h4>
                      </div>
                      <p className="text-slate-900/70 leading-relaxed">
                        {viewingProduct.description}
                      </p>
                    </div>
                  )}

                  {/* Product Details Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="bg-gradient-to-r from-amber-100 to-stone-100 rounded-2xl p-4 border border-amber-300">
                      <div className="flex items-center space-x-2 mb-2">
                        <Package className="w-5 h-5 text-amber-700" />
                        <span className="font-semibold text-slate-900">
                          Product ID
                        </span>
                      </div>
                      <p className="text-amber-800 font-mono text-lg">
                        {viewingProduct.product_id}
                      </p>
                    </div>

                    <div className="bg-gradient-to-r from-cyan-50 to-blue-50 rounded-2xl p-4 border border-cyan-200">
                      <div className="flex items-center space-x-2 mb-2">
                        <ShoppingCart className="w-5 h-5 text-cyan-600" />
                        <span className="font-semibold text-slate-900">
                          Stock Quantity
                        </span>
                      </div>
                      <p className="text-cyan-700 font-semibold text-lg">
                        {viewingProduct.quantity_in_stock} units
                      </p>
                    </div>

                    <div className="bg-gradient-to-r from-emerald-50 to-green-50 rounded-2xl p-4 border border-emerald-200">
                      <div className="flex items-center space-x-2 mb-2">
                        <DollarSign className="w-5 h-5 text-emerald-600" />
                        <span className="font-semibold text-slate-900">
                          Price
                        </span>
                      </div>
                      <p className="text-emerald-700 font-semibold text-lg">
                        KES {viewingProduct.selling_price.toLocaleString()}
                      </p>
                    </div>

                    <div className="bg-gradient-to-r from-orange-50 to-yellow-50 rounded-2xl p-4 border border-orange-200">
                      <div className="flex items-center space-x-2 mb-2">
                        <Tag className="w-5 h-5 text-orange-600" />
                        <span className="font-semibold text-slate-900">
                          Category
                        </span>
                      </div>
                      <p className="text-orange-700 font-semibold text-lg">
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
