import { useState, useEffect } from "react";
import {
  Search as SearchIcon,
  Filter,
  TrendingUp,
  Package,
  DollarSign,
  BarChart3,
  Eye,
  Sparkles,
} from "lucide-react";
import { supabase } from "../lib/supabase";
import type { Product, Sale } from "../types";

export default function Search() {
  const [searchTerm, setSearchTerm] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [productStats, setProductStats] = useState<{
    totalSales: number;
    totalProfit: number;
    totalQuantitySold: number;
  } | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (searchTerm) {
      const filtered = products.filter(
        (p) =>
          p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.product_id.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredProducts(filtered);
    } else {
      // Show all products when no search term is entered
      setFilteredProducts(products);
      setSelectedProduct(null);
      setProductStats(null);
    }
  }, [searchTerm, products]);

  async function loadData() {
    try {
      const [productsRes, salesRes] = await Promise.all([
        supabase.from("products").select("*"),
        supabase.from("sales").select("*"),
      ]);

      if (productsRes.error) throw productsRes.error;
      if (salesRes.error) throw salesRes.error;

      setProducts(productsRes.data || []);
      setSales(salesRes.data || []);
    } catch (error) {
      console.error("Error loading data:", error);
    }
  }

  function handleSelectProduct(product: Product) {
    setSelectedProduct(product);
    setSearchTerm(""); // Clear search term to show all products again
    setFilteredProducts(products); // Show all products again

    const productSales = sales.filter((s) => s.product_id === product.id);
    const totalSales = productSales.reduce((sum, s) => sum + s.total_sale, 0);
    const totalProfit = productSales.reduce((sum, s) => sum + s.profit, 0);
    const totalQuantitySold = productSales.reduce(
      (sum, s) => sum + s.quantity_sold,
      0
    );

    setProductStats({
      totalSales,
      totalProfit,
      totalQuantitySold,
    });
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header Section with Stunning Design */}
        <div className="relative overflow-hidden bg-white rounded-3xl shadow-2xl border border-slate-200/60">
          {/* Background Pattern */}
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 via-purple-600/5 to-indigo-600/5"></div>
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-purple-200/30 to-transparent rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-blue-200/30 to-transparent rounded-full blur-2xl"></div>

          <div className="relative z-10 p-8 lg:p-12">
            <div className="flex items-center space-x-4 mb-6">
              <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-4 rounded-2xl shadow-lg">
                <SearchIcon className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-black bg-gradient-to-r from-slate-900 via-blue-700 to-purple-700 bg-clip-text text-transparent">
                  Smart Product Search
                </h1>
                <p className="text-slate-600 text-lg mt-2 flex items-center space-x-2">
                  <Sparkles className="w-5 h-5 text-yellow-500" />
                  <span>
                    Discover insights and analytics for your inventory
                  </span>
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Search Section */}
        <div className="bg-white rounded-3xl shadow-xl border border-slate-200/60 overflow-hidden backdrop-blur-sm">
          <div className="bg-gradient-to-r from-blue-500 via-purple-500 to-indigo-500 p-1">
            <div className="bg-white rounded-[22px] p-8">
              <div className="flex items-center space-x-4 mb-6">
                <div className="bg-gradient-to-r from-blue-100 to-purple-100 p-3 rounded-xl">
                  <Filter className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-slate-800">
                    Search & Filter
                  </h2>
                  <p className="text-slate-600">
                    Find products instantly with our smart search
                  </p>
                </div>
              </div>

              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-2xl blur-xl group-focus-within:blur-lg transition-all duration-300"></div>
                <div className="relative">
                  <SearchIcon className="absolute left-6 top-1/2 -translate-y-1/2 w-6 h-6 text-slate-400 group-focus-within:text-blue-500 transition-colors duration-300" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search by product name, ID, or category..."
                    className="w-full pl-16 pr-6 py-5 bg-white border-2 border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 text-lg placeholder:text-slate-400 shadow-lg hover:shadow-xl transition-all duration-300 font-medium"
                  />
                </div>
              </div>

              {/* Search Results with Beautiful Layout */}
              {filteredProducts.length > 0 && (
                <div className="mt-8">
                  {/* Results Header */}
                  <div className="bg-gradient-to-r from-slate-50 to-blue-50 rounded-2xl p-4 mb-6 border border-slate-200">
                    {searchTerm ? (
                      <div className="flex items-center space-x-3">
                        <div className="bg-blue-500 p-2 rounded-lg">
                          <TrendingUp className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <p className="font-semibold text-slate-800">
                            Found {filteredProducts.length} product(s)
                          </p>
                          <p className="text-slate-600 text-sm">
                            Matching "{searchTerm}" - Click any product for
                            detailed analytics
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-3">
                        <div className="bg-gradient-to-r from-blue-500 to-purple-500 p-2 rounded-lg">
                          <Package className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <p className="font-semibold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                            All {filteredProducts.length} Products
                          </p>
                          <p className="text-slate-600 text-sm">
                            Browse your complete inventory - Start typing to
                            search
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Products Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-96 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-blue-300 scrollbar-track-slate-100">
                    {filteredProducts.map((product) => (
                      <button
                        key={product.id}
                        onClick={() => handleSelectProduct(product)}
                        className="group bg-white border border-slate-200 rounded-2xl p-4 hover:shadow-xl hover:scale-[1.02] transition-all duration-300 text-left hover:border-blue-300 relative overflow-hidden"
                      >
                        {/* Hover Effect Background */}
                        <div className="absolute inset-0 bg-gradient-to-r from-blue-50/50 to-purple-50/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl"></div>

                        <div className="relative z-10 flex items-center space-x-4">
                          {product.image_url ? (
                            <div className="relative">
                              <img
                                src={product.image_url}
                                alt={product.name}
                                className="w-16 h-16 object-cover rounded-xl shadow-md group-hover:shadow-lg transition-shadow duration-300"
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent rounded-xl group-hover:from-black/20 transition-all duration-300"></div>
                            </div>
                          ) : (
                            <div className="w-16 h-16 bg-gradient-to-br from-slate-100 to-slate-200 rounded-xl flex items-center justify-center group-hover:from-blue-100 group-hover:to-purple-100 transition-all duration-300">
                              <Package className="w-6 h-6 text-slate-400 group-hover:text-blue-500" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-slate-800 group-hover:text-blue-700 transition-colors duration-300 truncate">
                              {product.name}
                            </p>
                            <p className="text-sm text-slate-500 group-hover:text-slate-600 transition-colors duration-300">
                              ID: {product.product_id}
                            </p>
                            <div className="flex items-center space-x-2 mt-2">
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700 group-hover:bg-blue-200 transition-colors duration-300">
                                {product.category}
                              </span>
                              <span className="text-xs font-medium text-emerald-600">
                                KES {product.selling_price.toLocaleString()}
                              </span>
                            </div>
                          </div>
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                            <Eye className="w-5 h-5 text-blue-500" />
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
        {/* Enhanced Product Details Section */}
        {selectedProduct && productStats && (
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200/60 overflow-hidden">
            {/* Stunning Header with Gradient */}
            <div className="relative bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 p-8 text-white overflow-hidden">
              <div className="absolute inset-0 bg-black/10"></div>
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full blur-xl"></div>

              <div className="relative z-10 flex items-center space-x-4">
                <div className="bg-white/20 backdrop-blur-sm p-4 rounded-2xl">
                  <BarChart3 className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h3 className="text-3xl font-black">Product Analytics</h3>
                  <p className="text-blue-100 text-lg">
                    Comprehensive insights and performance metrics
                  </p>
                </div>
              </div>
            </div>

            <div className="p-8 lg:p-12">
              {/* Product Info Section with Enhanced Design */}
              <div className="flex flex-col lg:flex-row items-start space-y-6 lg:space-y-0 lg:space-x-8 mb-12">
                {/* Product Image */}
                <div className="relative group">
                  {selectedProduct.image_url ? (
                    <div className="relative">
                      <img
                        src={selectedProduct.image_url}
                        alt={selectedProduct.name}
                        className="w-40 h-40 object-cover rounded-3xl shadow-2xl group-hover:shadow-3xl transition-shadow duration-300"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent rounded-3xl group-hover:from-black/30 transition-all duration-300"></div>
                    </div>
                  ) : (
                    <div className="w-40 h-40 bg-gradient-to-br from-slate-200 to-slate-300 rounded-3xl flex items-center justify-center shadow-xl">
                      <Package className="w-16 h-16 text-slate-400" />
                    </div>
                  )}
                  <div className="absolute -bottom-2 -right-2 bg-gradient-to-r from-emerald-500 to-green-500 text-white px-3 py-1 rounded-full text-sm font-bold shadow-lg">
                    In Stock
                  </div>
                </div>

                {/* Product Details */}
                <div className="flex-1">
                  <div className="mb-6">
                    <h4 className="text-4xl font-black text-slate-900 mb-3 bg-gradient-to-r from-slate-900 to-blue-700 bg-clip-text text-transparent">
                      {selectedProduct.name}
                    </h4>
                    <div className="flex items-center space-x-4 mb-4">
                      <span className="inline-flex items-center px-4 py-2 rounded-2xl text-sm font-bold bg-gradient-to-r from-blue-100 to-purple-100 text-blue-700 border border-blue-200">
                        <Package className="w-4 h-4 mr-2" />
                        {selectedProduct.category}
                      </span>
                      <span className="inline-flex items-center px-4 py-2 rounded-2xl text-sm font-medium bg-slate-100 text-slate-700">
                        ID: {selectedProduct.product_id}
                      </span>
                    </div>
                  </div>

                  {/* Quick Stats Cards */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-4 border border-blue-200">
                      <div className="flex items-center space-x-2 mb-2">
                        <DollarSign className="w-5 h-5 text-blue-600" />
                        <span className="text-sm font-medium text-blue-700">
                          Selling Price
                        </span>
                      </div>
                      <p className="text-xl font-bold text-blue-900">
                        KES {selectedProduct.selling_price.toLocaleString()}
                      </p>
                    </div>

                    <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-2xl p-4 border border-emerald-200">
                      <div className="flex items-center space-x-2 mb-2">
                        <Package className="w-5 h-5 text-emerald-600" />
                        <span className="text-sm font-medium text-emerald-700">
                          In Stock
                        </span>
                      </div>
                      <p className="text-xl font-bold text-emerald-900">
                        {selectedProduct.quantity_in_stock}
                      </p>
                    </div>

                    <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl p-4 border border-purple-200">
                      <div className="flex items-center space-x-2 mb-2">
                        <TrendingUp className="w-5 h-5 text-purple-600" />
                        <span className="text-sm font-medium text-purple-700">
                          Profit %
                        </span>
                      </div>
                      <p className="text-xl font-bold text-purple-900">
                        {(
                          ((selectedProduct.selling_price -
                            selectedProduct.buying_price) /
                            selectedProduct.buying_price) *
                          100
                        ).toFixed(1)}
                        %
                      </p>
                    </div>

                    <div
                      className={`bg-gradient-to-br rounded-2xl p-4 border ${
                        selectedProduct.quantity_in_stock <=
                        selectedProduct.reorder_level
                          ? "from-red-50 to-red-100 border-red-200"
                          : "from-green-50 to-green-100 border-green-200"
                      }`}
                    >
                      <div className="flex items-center space-x-2 mb-2">
                        <BarChart3
                          className={`w-5 h-5 ${
                            selectedProduct.quantity_in_stock <=
                            selectedProduct.reorder_level
                              ? "text-red-600"
                              : "text-green-600"
                          }`}
                        />
                        <span
                          className={`text-sm font-medium ${
                            selectedProduct.quantity_in_stock <=
                            selectedProduct.reorder_level
                              ? "text-red-700"
                              : "text-green-700"
                          }`}
                        >
                          Status
                        </span>
                      </div>
                      <p
                        className={`text-xl font-bold ${
                          selectedProduct.quantity_in_stock <=
                          selectedProduct.reorder_level
                            ? "text-red-900"
                            : "text-green-900"
                        }`}
                      >
                        {selectedProduct.quantity_in_stock <=
                        selectedProduct.reorder_level
                          ? "Low Stock"
                          : "Healthy"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Detailed Information Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                <DetailCard
                  icon={<DollarSign className="w-6 h-6" />}
                  label="Buying Price"
                  value={`KES ${selectedProduct.buying_price.toLocaleString()}`}
                  gradient="from-slate-500 to-slate-600"
                />
                <DetailCard
                  icon={<Package className="w-6 h-6" />}
                  label="Reorder Level"
                  value={selectedProduct.reorder_level.toString()}
                  gradient="from-amber-500 to-orange-500"
                />
                <DetailCard
                  icon={<TrendingUp className="w-6 h-6" />}
                  label="Profit per Unit"
                  value={`KES ${(
                    selectedProduct.selling_price - selectedProduct.buying_price
                  ).toLocaleString()}`}
                  gradient="from-emerald-500 to-green-500"
                />
              </div>

              {/* Sales Analytics Section */}
              <div className="bg-gradient-to-r from-slate-50 via-blue-50 to-purple-50 rounded-3xl p-8 border border-slate-200">
                <div className="flex items-center space-x-4 mb-8">
                  <div className="bg-gradient-to-r from-blue-500 to-purple-500 p-4 rounded-2xl shadow-lg">
                    <BarChart3 className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h5 className="text-2xl font-bold text-slate-800">
                      Sales Performance
                    </h5>
                    <p className="text-slate-600">
                      Historical data and revenue insights
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <SalesCard
                    title="Total Revenue"
                    value={`KES ${productStats.totalSales.toLocaleString()}`}
                    gradient="from-blue-500 to-blue-600"
                    icon={<DollarSign className="w-8 h-8" />}
                  />
                  <SalesCard
                    title="Total Profit"
                    value={`KES ${productStats.totalProfit.toLocaleString()}`}
                    gradient="from-emerald-500 to-green-500"
                    icon={<TrendingUp className="w-8 h-8" />}
                  />
                  <SalesCard
                    title="Units Sold"
                    value={productStats.totalQuantitySold.toString()}
                    gradient="from-purple-500 to-indigo-500"
                    icon={<Package className="w-8 h-8" />}
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

interface DetailCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  gradient: string;
}

function DetailCard({ icon, label, value, gradient }: DetailCardProps) {
  return (
    <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-lg hover:shadow-xl transition-all duration-300 group">
      <div
        className={`inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-r ${gradient} text-white mb-4 group-hover:scale-110 transition-transform duration-300`}
      >
        {icon}
      </div>
      <p className="text-sm font-medium text-slate-600 mb-2">{label}</p>
      <p className="text-2xl font-bold text-slate-900">{value}</p>
    </div>
  );
}

interface SalesCardProps {
  title: string;
  value: string;
  gradient: string;
  icon: React.ReactNode;
}

function SalesCard({ title, value, gradient, icon }: SalesCardProps) {
  return (
    <div className="relative overflow-hidden bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 group">
      <div
        className={`absolute inset-0 bg-gradient-to-r ${gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-300`}
      ></div>
      <div className="relative p-6">
        <div className="flex items-center justify-between mb-4">
          <div
            className={`p-3 rounded-xl bg-gradient-to-r ${gradient} text-white shadow-lg`}
          >
            {icon}
          </div>
          <div className="w-16 h-16 bg-gradient-to-br from-slate-100 to-slate-200 rounded-full opacity-20"></div>
        </div>
        <p className="text-sm font-medium text-slate-600 mb-2">{title}</p>
        <p className="text-3xl font-black text-slate-900">{value}</p>
      </div>
    </div>
  );
}
