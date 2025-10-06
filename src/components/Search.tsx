import { useState, useEffect } from "react";
import { Search as SearchIcon } from "lucide-react";
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
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-800">Product Search</h2>
        <p className="text-slate-600 mt-1">
          Search for products and view detailed information
        </p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="relative">
          <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by product name or ID..."
            className="w-full pl-12 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
          />
        </div>

        {filteredProducts.length > 0 && (
          <div className="mt-4 border border-slate-200 rounded-lg divide-y divide-slate-200 max-h-64 overflow-y-auto">
            {searchTerm && (
              <div className="p-3 bg-slate-50 border-b border-slate-200">
                <p className="text-sm text-slate-600">
                  Found {filteredProducts.length} product(s) matching "
                  {searchTerm}"
                </p>
              </div>
            )}
            {!searchTerm && (
              <div className="p-3 bg-blue-50 border-b border-slate-200">
                <p className="text-sm text-blue-700 font-medium">
                  Showing all {filteredProducts.length} products - Start typing
                  to search
                </p>
              </div>
            )}
            {filteredProducts.map((product) => (
              <button
                key={product.id}
                onClick={() => handleSelectProduct(product)}
                className="w-full flex items-center space-x-3 p-4 hover:bg-slate-50 transition-colors text-left"
              >
                {product.image_url ? (
                  <img
                    src={product.image_url}
                    alt={product.name}
                    className="w-12 h-12 object-cover rounded-lg"
                  />
                ) : (
                  <div className="w-12 h-12 bg-slate-200 rounded-lg flex items-center justify-center">
                    <span className="text-slate-400 text-xs">No Image</span>
                  </div>
                )}
                <div>
                  <p className="font-medium text-slate-800">{product.name}</p>
                  <p className="text-sm text-slate-500">{product.product_id}</p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {selectedProduct && productStats && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-6 text-white">
            <h3 className="text-2xl font-bold">Product Details</h3>
          </div>

          <div className="p-6">
            <div className="flex items-start space-x-6 mb-6">
              {selectedProduct.image_url ? (
                <img
                  src={selectedProduct.image_url}
                  alt={selectedProduct.name}
                  className="w-32 h-32 object-cover rounded-xl shadow-md"
                />
              ) : (
                <div className="w-32 h-32 bg-slate-200 rounded-xl flex items-center justify-center">
                  <span className="text-slate-400">No Image</span>
                </div>
              )}
              <div className="flex-1">
                <h4 className="text-2xl font-bold text-slate-800 mb-2">
                  {selectedProduct.name}
                </h4>
                <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-700 mb-4">
                  {selectedProduct.category}
                </div>
                <p className="text-slate-600">
                  Product ID: {selectedProduct.product_id}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
              <InfoCard
                label="Qiimaha Iibsiga - Buying Price"
                value={`KES ${selectedProduct.buying_price.toLocaleString()}`}
              />
              <InfoCard
                label="Qiimaha Iibka - Selling Price"
                value={`KES ${selectedProduct.selling_price.toLocaleString()}`}
              />
              <InfoCard
                label="Current Stock"
                value={selectedProduct.quantity_in_stock.toString()}
              />
              <InfoCard
                label="Reorder Level"
                value={selectedProduct.reorder_level.toString()}
              />
              <InfoCard
                label="Stock Status"
                value={
                  selectedProduct.quantity_in_stock <=
                  selectedProduct.reorder_level
                    ? "Low Stock"
                    : "In Stock"
                }
                valueColor={
                  selectedProduct.quantity_in_stock <=
                  selectedProduct.reorder_level
                    ? "text-red-600"
                    : "text-green-600"
                }
              />
              <InfoCard
                label="Profit Margin"
                value={`${(
                  ((selectedProduct.selling_price -
                    selectedProduct.buying_price) /
                    selectedProduct.buying_price) *
                  100
                ).toFixed(1)}%`}
              />
            </div>

            <div className="border-t border-slate-200 pt-6">
              <h5 className="text-lg font-semibold text-slate-800 mb-4">
                Sales Statistics
              </h5>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
                  <p className="text-sm text-blue-700 font-medium mb-1">
                    Total Sales Revenue
                  </p>
                  <p className="text-2xl font-bold text-blue-900">
                    KES {productStats.totalSales.toLocaleString()}
                  </p>
                </div>
                <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 border border-green-200">
                  <p className="text-sm text-green-700 font-medium mb-1">
                    Total Profit
                  </p>
                  <p className="text-2xl font-bold text-green-900">
                    KES {productStats.totalProfit.toLocaleString()}
                  </p>
                </div>
                <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-lg p-4 border border-slate-200">
                  <p className="text-sm text-slate-700 font-medium mb-1">
                    Total Quantity Sold
                  </p>
                  <p className="text-2xl font-bold text-slate-900">
                    {productStats.totalQuantitySold}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

interface InfoCardProps {
  label: string;
  value: string;
  valueColor?: string;
}

function InfoCard({
  label,
  value,
  valueColor = "text-slate-800",
}: InfoCardProps) {
  return (
    <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
      <p className="text-sm text-slate-600 mb-1">{label}</p>
      <p className={`text-lg font-semibold ${valueColor}`}>{value}</p>
    </div>
  );
}
