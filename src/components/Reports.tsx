import { useState } from "react";
import { Download, Calendar } from "lucide-react";
import { useProducts, useSales } from "../hooks/useSupabaseQuery";
import OptimizedImage from "./OptimizedImage";

export default function Reports() {
  // ✅ Use cached hooks instead of direct queries - saves egress!
  const { data: products = [], isLoading: loadingProducts } = useProducts();
  const { data: sales = [], isLoading: loadingSales } = useSales();
  const [dateRange, setDateRange] = useState<
    "today" | "week" | "month" | "all"
  >("all");

  const loading = loadingProducts || loadingSales;

  // ❌ Removed useEffect and loadData - data now comes from cached hooks!

  function getFilteredSales() {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    switch (dateRange) {
      case "today":
        return sales.filter((s) => new Date(s.sale_date) >= today);
      case "week":
        const weekAgo = new Date(today);
        weekAgo.setDate(weekAgo.getDate() - 7);
        return sales.filter((s) => new Date(s.sale_date) >= weekAgo);
      case "month":
        const monthAgo = new Date(today);
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        return sales.filter((s) => new Date(s.sale_date) >= monthAgo);
      default:
        return sales;
    }
  }

  function exportToCSV(type: "inventory" | "sales") {
    let csv = "";
    let filename = "";

    if (type === "inventory") {
      csv =
        "Product ID,Name,Category,Buying Price,Selling Price,Stock,Reorder Level\n";
      products.forEach((p) => {
        csv += `${p.product_id},"${p.name}",${p.category},${p.buying_price},${p.selling_price},${p.quantity_in_stock},${p.reorder_level}\n`;
      });
      filename = `inventory_${new Date().toISOString().split("T")[0]}.csv`;
    } else {
      const filtered = getFilteredSales();
      csv =
        "Date,Product ID,Product Name,Quantity,Price,Total Sale,Profit,Payment Method,Sold By\n";
      filtered.forEach((s) => {
        const product = products.find((p) => p.id === s.product_id);
        csv += `${new Date(s.sale_date).toLocaleString()},"${
          product?.product_id || "N/A"
        }","${product?.name || "Unknown"}",${s.quantity_sold},${
          s.selling_price
        },${s.total_sale},${s.profit},${s.payment_method},"${s.sold_by}"\n`;
      });
      filename = `sales_${dateRange}_${
        new Date().toISOString().split("T")[0]
      }.csv`;
    }

    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(url);
  }

  const filteredSales = getFilteredSales();
  const totalRevenue = filteredSales.reduce((sum, s) => sum + s.total_sale, 0);
  const totalProfit = filteredSales.reduce((sum, s) => sum + s.profit, 0);
  const lowStockProducts = products.filter(
    (p) => p.quantity_in_stock <= p.reorder_level
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-white text-base font-medium">
          Loading reports...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl md:text-3xl font-black text-white">
          Reports & Export
        </h2>
        <p className="text-slate-300 mt-1 text-sm md:text-base">
          Generate and export detailed reports
        </p>
      </div>

      <div className="bg-white/10 backdrop-blur-2xl rounded-2xl shadow-xl border border-white/20 p-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-purple-600/20 rounded-lg border border-purple-500/30">
              <Calendar className="w-5 h-5 text-purple-400" />
            </div>
            <span className="font-bold text-white">Date Range:</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {(["today", "week", "month", "all"] as const).map((range) => (
              <button
                key={range}
                onClick={() => setDateRange(range)}
                className={`px-4 py-2 rounded-xl text-sm font-bold transition-all duration-300 ${
                  dateRange === range
                    ? "bg-gradient-to-r from-purple-500 to-pink-600 text-white shadow-lg scale-105"
                    : "bg-white/10 text-slate-300 hover:bg-white/20 hover:text-white border border-white/20"
                }`}
              >
                {range === "today"
                  ? "Today"
                  : range === "week"
                  ? "Last 7 Days"
                  : range === "month"
                  ? "Last 30 Days"
                  : "All Time"}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
          <div className="bg-gradient-to-br from-blue-600/20 to-blue-500/10 backdrop-blur-xl rounded-xl p-5 border border-blue-500/30 hover:-translate-y-1 transition-all duration-300">
            <p className="text-xs md:text-sm text-blue-300 font-semibold mb-2 uppercase tracking-wide">
              Total Revenue
            </p>
            <p className="text-2xl md:text-3xl font-black text-white">
              KES {totalRevenue.toLocaleString()}
            </p>
            <p className="text-xs md:text-sm text-blue-400 mt-2 font-medium">
              {filteredSales.length} transactions
            </p>
          </div>

          <div className="bg-gradient-to-br from-emerald-600/20 to-green-500/10 backdrop-blur-xl rounded-xl p-5 border border-emerald-500/30 hover:-translate-y-1 transition-all duration-300">
            <p className="text-xs md:text-sm text-emerald-300 font-semibold mb-2 uppercase tracking-wide">
              Total Profit
            </p>
            <p className="text-2xl md:text-3xl font-black text-white">
              KES {totalProfit.toLocaleString()}
            </p>
            <p className="text-xs md:text-sm text-emerald-400 mt-2 font-medium">
              {totalRevenue > 0
                ? ((totalProfit / totalRevenue) * 100).toFixed(1)
                : 0}
              % margin
            </p>
          </div>

          <div className="bg-gradient-to-br from-orange-600/20 to-amber-500/10 backdrop-blur-xl rounded-xl p-5 border border-orange-500/30 hover:-translate-y-1 transition-all duration-300">
            <p className="text-xs md:text-sm text-orange-300 font-semibold mb-2 uppercase tracking-wide">
              Low Stock Alerts
            </p>
            <p className="text-2xl md:text-3xl font-black text-white">
              {lowStockProducts.length}
            </p>
            <p className="text-xs md:text-sm text-orange-400 mt-2 font-medium">
              {products.length} total products
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white/10 backdrop-blur-2xl rounded-2xl shadow-xl border border-white/20 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-white">Inventory Report</h3>
            <button
              onClick={() => exportToCSV("inventory")}
              className="flex items-center space-x-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white px-4 py-2 rounded-xl hover:scale-105 transition-all duration-300 shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/40 text-sm font-bold"
            >
              <Download className="w-4 h-4" />
              <span>Export CSV</span>
            </button>
          </div>
          <div className="space-y-3">
            <ReportRow
              label="Total Products"
              value={products.length.toString()}
            />
            <ReportRow
              label="Total Inventory Value"
              value={`KES ${products
                .reduce(
                  (sum, p) => sum + p.buying_price * p.quantity_in_stock,
                  0
                )
                .toLocaleString()}`}
            />
            <ReportRow
              label="Potential Revenue"
              value={`KES ${products
                .reduce(
                  (sum, p) => sum + p.selling_price * p.quantity_in_stock,
                  0
                )
                .toLocaleString()}`}
            />
            <ReportRow
              label="Products in Stock"
              value={products
                .filter((p) => p.quantity_in_stock > 0)
                .length.toString()}
            />
            <ReportRow
              label="Low Stock Items"
              value={lowStockProducts.length.toString()}
              valueColor="text-orange-600"
            />
            <ReportRow
              label="Out of Stock"
              value={products
                .filter((p) => p.quantity_in_stock === 0)
                .length.toString()}
              valueColor="text-red-600"
            />
          </div>
        </div>

        <div className="bg-white/10 backdrop-blur-2xl rounded-2xl shadow-xl border border-white/20 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-white">Sales Report</h3>
            <button
              onClick={() => exportToCSV("sales")}
              className="flex items-center space-x-2 bg-gradient-to-r from-emerald-500 to-green-600 text-white px-4 py-2 rounded-xl hover:scale-105 transition-all duration-300 shadow-lg shadow-emerald-500/25 hover:shadow-xl hover:shadow-emerald-500/40 text-sm font-bold"
            >
              <Download className="w-4 h-4" />
              <span>Export CSV</span>
            </button>
          </div>
          <div className="space-y-3">
            <ReportRow
              label="Total Transactions"
              value={filteredSales.length.toString()}
            />
            <ReportRow
              label="Total Revenue"
              value={`KES ${totalRevenue.toLocaleString()}`}
            />
            <ReportRow
              label="Total Profit"
              value={`KES ${totalProfit.toLocaleString()}`}
              valueColor="text-green-600"
            />
            <ReportRow
              label="Average Sale"
              value={`KES ${
                filteredSales.length > 0
                  ? (totalRevenue / filteredSales.length).toFixed(2)
                  : 0
              }`}
            />
            <ReportRow
              label="Profit Margin"
              value={`${
                totalRevenue > 0
                  ? ((totalProfit / totalRevenue) * 100).toFixed(1)
                  : 0
              }%`}
              valueColor="text-green-600"
            />
            <ReportRow
              label="Items Sold"
              value={filteredSales
                .reduce((sum, s) => sum + s.quantity_sold, 0)
                .toString()}
            />
          </div>
        </div>
      </div>

      {lowStockProducts.length > 0 && (
        <div className="bg-white/10 backdrop-blur-2xl rounded-2xl shadow-xl border border-orange-500/30 p-6">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center space-x-2">
            <span className="bg-orange-600/20 text-orange-400 border border-orange-500/30 px-3 py-1 rounded-full text-sm font-bold">
              {lowStockProducts.length}
            </span>
            <span>Low Stock Products - Reorder Needed</span>
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {lowStockProducts.map((product) => (
              <div
                key={product.id}
                className="flex items-center space-x-3 p-4 bg-orange-600/10 rounded-xl border border-orange-500/30 hover:bg-orange-600/20 transition-all"
              >
                {product.image_url && (
                  <OptimizedImage
                    src={product.image_url}
                    alt={product.name}
                    className="w-12 h-12 object-cover rounded-lg border border-white/20"
                    fallbackClassName="w-12 h-12"
                    preset="thumbnail"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-white truncate text-sm">
                    {product.name}
                  </p>
                  {product.description && (
                    <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                      {product.description}
                    </p>
                  )}
                  <p className="text-xs text-slate-500">{product.product_id}</p>
                  <p className="text-sm font-bold text-orange-400">
                    Stock: {product.quantity_in_stock}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

interface ReportRowProps {
  label: string;
  value: string;
  valueColor?: string;
}

function ReportRow({
  label,
  value,
  valueColor = "text-white",
}: ReportRowProps) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-white/10 last:border-0">
      <span className="text-slate-300 text-sm">{label}</span>
      <span className={`font-bold text-sm ${valueColor}`}>{value}</span>
    </div>
  );
}
