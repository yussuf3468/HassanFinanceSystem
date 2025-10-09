import { useEffect, useState } from "react";
import { Download, Calendar } from "lucide-react";
import { supabase } from "../lib/supabase";
import type { Product, Sale } from "../types";

export default function Reports() {
  const [products, setProducts] = useState<Product[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [dateRange, setDateRange] = useState<
    "today" | "week" | "month" | "all"
  >("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [productsRes, salesRes] = await Promise.all([
        supabase.from("products").select("*"),
        supabase
          .from("sales")
          .select("*")
          .order("sale_date", { ascending: false }),
      ]);

      if (productsRes.error) throw productsRes.error;
      if (salesRes.error) throw salesRes.error;

      setProducts(productsRes.data || []);
      setSales(salesRes.data || []);
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  }

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
    return <div className="text-center py-12">Loading reports...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-800">Reports & Export</h2>
        <p className="text-slate-600 mt-1">
          Generate and export detailed reports
        </p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <Calendar className="w-5 h-5 text-slate-600" />
            <span className="font-medium text-slate-700">Date Range:</span>
            <div className="flex space-x-2">
              {(["today", "week", "month", "all"] as const).map((range) => (
                <button
                  key={range}
                  onClick={() => setDateRange(range)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    dateRange === range
                      ? "bg-blue-500 text-white"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200"
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
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-6 border border-blue-200">
            <p className="text-sm text-blue-700 font-medium mb-2">
              Total Revenue
            </p>
            <p className="text-3xl font-bold text-blue-900">
              KES {totalRevenue.toLocaleString()}
            </p>
            <p className="text-sm text-blue-600 mt-2">
              {filteredSales.length} transactions
            </p>
          </div>

          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-6 border border-green-200">
            <p className="text-sm text-green-700 font-medium mb-2">
              Total Profit
            </p>
            <p className="text-3xl font-bold text-green-900">
              KES {totalProfit.toLocaleString()}
            </p>
            <p className="text-sm text-green-600 mt-2">
              {totalRevenue > 0
                ? ((totalProfit / totalRevenue) * 100).toFixed(1)
                : 0}
              % margin
            </p>
          </div>

          <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-6 border border-orange-200">
            <p className="text-sm text-orange-700 font-medium mb-2">
              Low Stock Alerts
            </p>
            <p className="text-3xl font-bold text-orange-900">
              {lowStockProducts.length}
            </p>
            <p className="text-sm text-orange-600 mt-2">
              {products.length} total products
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-slate-800">
              Inventory Report
            </h3>
            <button
              onClick={() => exportToCSV("inventory")}
              className="flex items-center space-x-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white px-4 py-2 rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all shadow-sm hover:shadow-md text-sm"
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

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-slate-800">
              Sales Report
            </h3>
            <button
              onClick={() => exportToCSV("sales")}
              className="flex items-center space-x-2 bg-gradient-to-r from-green-500 to-green-600 text-white px-4 py-2 rounded-lg hover:from-green-600 hover:to-green-700 transition-all shadow-sm hover:shadow-md text-sm"
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
        <div className="bg-white rounded-xl shadow-sm border border-orange-200 p-6">
          <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center space-x-2">
            <span className="bg-orange-100 text-orange-600 px-3 py-1 rounded-full text-sm">
              {lowStockProducts.length}
            </span>
            <span>Low Stock Products - Reorder Needed</span>
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {lowStockProducts.map((product) => (
              <div
                key={product.id}
                className="flex items-center space-x-3 p-4 bg-orange-50 rounded-lg border border-orange-200"
              >
                {product.image_url && (
                  <img
                    src={product.image_url}
                    alt={product.name}
                    className="w-12 h-12 object-cover rounded"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-slate-800 truncate">
                    {product.name}
                  </p>
                  {product.description && (
                    <p className="text-xs text-slate-600 mt-1 line-clamp-2">
                      {product.description}
                    </p>
                  )}
                  <p className="text-sm text-slate-500">{product.product_id}</p>
                  <p className="text-sm font-semibold text-orange-600">
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
  valueColor = "text-slate-800",
}: ReportRowProps) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
      <span className="text-slate-600">{label}</span>
      <span className={`font-semibold ${valueColor}`}>{value}</span>
    </div>
  );
}
