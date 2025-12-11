import { useState } from "react";
import { Download, Calendar, FileDown, RefreshCw } from "lucide-react";
import {
  useProducts,
  useSales,
  useReturns,
  useSalesTotals,
} from "../hooks/useSupabaseQuery";
import { useQueryClient } from "@tanstack/react-query";
import {
  invalidateSalesCaches,
  invalidateProductCaches,
  invalidateReturnsCaches,
} from "../utils/cacheInvalidation";
import OptimizedImage from "./OptimizedImage";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export default function Reports() {
  const queryClient = useQueryClient();
  // ✅ Use cached hooks instead of direct queries - saves egress!
  const { data: products = [], isLoading: loadingProducts } = useProducts();
  const { data: sales = [], isLoading: loadingSales } = useSales(); // For filtered reports only
  const { data: returns = [], isLoading: loadingReturns } = useReturns();
  const { data: salesTotals } = useSalesTotals(); // Accurate totals for all sales
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [dateRange, setDateRange] = useState<
    "today" | "week" | "month" | "year" | "all" | "custom"
  >("all");
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");

  const loading = loadingProducts || loadingSales || loadingReturns;

  // ❌ Removed useEffect and loadData - data now comes from cached hooks!

  async function handleRefresh() {
    setIsRefreshing(true);
    try {
      // Invalidate all caches - this ensures Dashboard and FinancialDashboard stay in sync
      await Promise.all([
        invalidateProductCaches(queryClient),
        invalidateSalesCaches(queryClient),
        invalidateReturnsCaches(queryClient),
      ]);
    } finally {
      setIsRefreshing(false);
    }
  }

  function getFilteredSales() {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    switch (dateRange) {
      case "today":
        return sales.filter((s) => new Date(s.created_at) >= today);
      case "week":
        const weekAgo = new Date(today);
        weekAgo.setDate(weekAgo.getDate() - 7);
        return sales.filter((s) => new Date(s.created_at) >= weekAgo);
      case "month":
        const monthAgo = new Date(today);
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        return sales.filter((s) => new Date(s.created_at) >= monthAgo);
      case "year":
        const yearStart = new Date(now.getFullYear(), 0, 1); // January 1st of current year
        return sales.filter((s) => new Date(s.created_at) >= yearStart);
      case "custom":
        if (!customStartDate && !customEndDate) return sales;
        return sales.filter((s) => {
          const saleDate = new Date(s.created_at);
          const start = customStartDate
            ? new Date(customStartDate)
            : new Date(0);
          const end = customEndDate ? new Date(customEndDate) : new Date();
          end.setHours(23, 59, 59, 999); // Include entire end date
          return saleDate >= start && saleDate <= end;
        });
      default:
        return sales;
    }
  }

  function getFilteredReturns() {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    switch (dateRange) {
      case "today":
        return returns.filter(
          (r: any) => new Date(r.return_date || r.created_at) >= today
        );
      case "week":
        const weekAgo = new Date(today);
        weekAgo.setDate(weekAgo.getDate() - 7);
        return returns.filter(
          (r: any) => new Date(r.return_date || r.created_at) >= weekAgo
        );
      case "month":
        const monthAgo = new Date(today);
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        return returns.filter(
          (r: any) => new Date(r.return_date || r.created_at) >= monthAgo
        );
      case "year":
        const yearStart = new Date(now.getFullYear(), 0, 1); // January 1st of current year
        return returns.filter(
          (r: any) => new Date(r.return_date || r.created_at) >= yearStart
        );
      case "custom":
        if (!customStartDate && !customEndDate) return returns;
        return returns.filter((r: any) => {
          const returnDate = new Date(r.return_date || r.created_at);
          const start = customStartDate
            ? new Date(customStartDate)
            : new Date(0);
          const end = customEndDate ? new Date(customEndDate) : new Date();
          end.setHours(23, 59, 59, 999);
          return returnDate >= start && returnDate <= end;
        });
      default:
        return returns;
    }
  }

  function exportInventoryToPDF() {
    const doc = new jsPDF();
    const today = new Date();
    const dateStr = today.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    // Sort products alphabetically by name (A-Z)
    const sortedProducts = [...products].sort((a, b) =>
      a.name.localeCompare(b.name, undefined, { sensitivity: "base" })
    );

    // Header
    doc.setFillColor(11, 11, 20);
    doc.rect(0, 0, 210, 40, "F");

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont("helvetica", "bold");
    doc.text("HASSAN BOOKSHOP", 105, 15, { align: "center" });

    doc.setFontSize(16);
    doc.text("Inventory Report", 105, 25, { align: "center" });

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Generated: ${dateStr}`, 105, 33, { align: "center" });

    // Summary section
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("Summary", 14, 50);

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    const totalProducts = products.length;
    const totalInventoryValue = products.reduce(
      (sum, p) => sum + p.buying_price * p.quantity_in_stock,
      0
    );
    const totalPotentialRevenue = products.reduce(
      (sum, p) => sum + p.selling_price * p.quantity_in_stock,
      0
    );
    const inStock = products.filter((p) => p.quantity_in_stock > 0).length;
    const outOfStock = products.filter((p) => p.quantity_in_stock === 0).length;

    doc.text(`Total Products: ${totalProducts}`, 14, 58);
    doc.text(`Products In Stock: ${inStock}`, 14, 64);
    doc.text(`Out of Stock: ${outOfStock}`, 14, 70);
    doc.text(
      `Total Inventory Value: KES ${totalInventoryValue.toLocaleString()}`,
      105,
      58
    );
    doc.text(
      `Potential Revenue: KES ${totalPotentialRevenue.toLocaleString()}`,
      105,
      64
    );

    // Product table
    const tableData = sortedProducts.map((p, index) => [
      index + 1,
      p.product_id || "N/A",
      p.name,
      p.category || "N/A",
      p.quantity_in_stock,
      `KES ${p.buying_price.toLocaleString()}`,
      `KES ${p.selling_price.toLocaleString()}`,
      `KES ${(p.buying_price * p.quantity_in_stock).toLocaleString()}`,
    ]);

    autoTable(doc, {
      startY: 78,
      head: [
        [
          "#",
          "Product ID",
          "Product Name",
          "Category",
          "Stock",
          "Buying Price",
          "Selling Price",
          "Total Value",
        ],
      ],
      body: tableData,
      theme: "striped",
      headStyles: {
        fillColor: [11, 11, 20],
        textColor: [255, 255, 255],
        fontStyle: "bold",
        fontSize: 9,
        halign: "center",
      },
      bodyStyles: {
        fontSize: 8,
        textColor: [0, 0, 0],
      },
      columnStyles: {
        0: { cellWidth: 8, halign: "center" },
        1: { cellWidth: 20 },
        2: { cellWidth: 38 },
        3: { cellWidth: 22 },
        4: { cellWidth: 12, halign: "center" },
        5: { cellWidth: 24, halign: "right" },
        6: { cellWidth: 24, halign: "right" },
        7: { cellWidth: 32, halign: "right", fontStyle: "bold" },
      },
      alternateRowStyles: {
        fillColor: [245, 245, 245],
      },
      margin: { left: 14, right: 14 },
      didDrawPage: (data) => {
        // Footer
        const pageCount = (doc as any).internal.pages.length - 1;
        const pageSize = doc.internal.pageSize;
        const pageHeight = pageSize.height || pageSize.getHeight();
        doc.setFontSize(8);
        doc.setTextColor(128, 128, 128);
        doc.text(
          `Page ${data.pageNumber} of ${pageCount}`,
          data.settings.margin.left,
          pageHeight - 10
        );
        doc.text(
          "Hassan Bookshop - Confidential",
          pageSize.width / 2,
          pageHeight - 10,
          { align: "center" }
        );
      },
    });

    // Save the PDF
    const filename = `Hassan_Bookshop_Inventory_Report_${
      new Date().toISOString().split("T")[0]
    }.pdf`;
    doc.save(filename);
  }

  function exportSalesPDF() {
    const doc = new jsPDF();
    const today = new Date();
    const dateStr = today.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    const filtered = getFilteredSales();

    // Get date range label
    let rangeLabel = "";
    let periodText = "";

    if (dateRange === "today") {
      rangeLabel = "Today";
      periodText = dateStr;
    } else if (dateRange === "week") {
      rangeLabel = "Last_7_Days";
      periodText = "Last 7 Days";
    } else if (dateRange === "month") {
      rangeLabel = "Last_30_Days";
      periodText = "Last 30 Days";
    } else if (dateRange === "year") {
      const currentYear = new Date().getFullYear();
      rangeLabel = `Year_${currentYear}`;
      periodText = `Year ${currentYear} (Jan 1 - Dec 31)`;
    } else if (dateRange === "custom") {
      const start = customStartDate || "Beginning";
      const end = customEndDate || "Today";
      rangeLabel = "Custom_Range";
      periodText = `${
        customStartDate
          ? new Date(customStartDate).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })
          : "Beginning"
      } to ${
        customEndDate
          ? new Date(customEndDate).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })
          : "Today"
      }`;
    } else {
      rangeLabel = "All_Time";
      periodText = "All Time";
    }

    // Calculate totals
    const totalTransactions = filtered.length;
    const totalItems = filtered.reduce((sum, s) => sum + s.quantity_sold, 0);
    const totalRevenue = filtered.reduce((sum, s) => sum + s.total_sale, 0);
    const totalProfit = filtered.reduce((sum, s) => sum + s.profit, 0);
    const totalDiscounts = filtered.reduce(
      (sum, s) => sum + (s.discount_amount || 0),
      0
    );
    const profitMargin =
      totalRevenue > 0
        ? ((totalProfit / totalRevenue) * 100).toFixed(1)
        : "0.0";
    const avgSale =
      filtered.length > 0
        ? (totalRevenue / filtered.length).toFixed(2)
        : "0.00";
    const avgProfit =
      filtered.length > 0 ? (totalProfit / filtered.length).toFixed(2) : "0.00";

    // Payment method breakdown
    const paymentBreakdown = filtered.reduce((acc: any, s) => {
      const method = s.payment_method || "Unknown";
      if (!acc[method]) {
        acc[method] = { count: 0, total: 0 };
      }
      acc[method].count++;
      acc[method].total += s.total_sale;
      return acc;
    }, {});

    // Header
    doc.setFillColor(11, 11, 20);
    doc.rect(0, 0, 210, 40, "F");

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont("helvetica", "bold");
    doc.text("HASSAN BOOKSHOP", 105, 15, { align: "center" });

    doc.setFontSize(16);
    doc.text("Sales Report", 105, 25, { align: "center" });

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Generated: ${dateStr} • Period: ${periodText}`, 105, 33, {
      align: "center",
    });

    // Summary section
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("Summary", 14, 50);

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");

    // Left column
    doc.text(`Total Transactions: ${totalTransactions}`, 14, 58);
    doc.text(`Total Items Sold: ${totalItems}`, 14, 64);
    doc.text(`Average Sale: KES ${Number(avgSale).toLocaleString()}`, 14, 70);
    doc.text(
      `Average Profit: KES ${Number(avgProfit).toLocaleString()}`,
      14,
      76
    );

    // Right column
    doc.text(`Total Revenue: KES ${totalRevenue.toLocaleString()}`, 105, 58);
    doc.text(`Total Profit: KES ${totalProfit.toLocaleString()}`, 105, 64);
    doc.text(`Profit Margin: ${profitMargin}%`, 105, 70);
    doc.text(
      `Total Discounts: KES ${totalDiscounts.toLocaleString()}`,
      105,
      76
    );

    // Payment method breakdown
    let yPos = 84;
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("Payment Methods:", 14, yPos);
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");

    Object.entries(paymentBreakdown).forEach(
      ([method, data]: [string, any]) => {
        yPos += 6;
        doc.text(
          `${method}: ${
            data.count
          } transactions (KES ${data.total.toLocaleString()})`,
          14,
          yPos
        );
      }
    );

    // Sales table - sorted by date (newest first)
    const sortedSales = [...filtered].sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    const tableData = sortedSales.map((s, index) => {
      const product = products.find((p) => p.id === s.product_id);
      return [
        index + 1,
        new Date(s.created_at).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        }),
        product?.product_id || "N/A",
        product?.name || "Unknown",
        s.quantity_sold,
        `KES ${s.selling_price.toLocaleString()}`,
        s.discount_amount ? `KES ${s.discount_amount.toLocaleString()}` : "-",
        `KES ${s.total_sale.toLocaleString()}`,
        `KES ${s.profit.toLocaleString()}`,
      ];
    });

    autoTable(doc, {
      startY: yPos + 10,
      head: [
        [
          "#",
          "Date",
          "Product ID",
          "Product Name",
          "Qty",
          "Unit Price",
          "Discount",
          "Total Sale",
          "Profit",
        ],
      ],
      body: tableData,
      theme: "striped",
      headStyles: {
        fillColor: [11, 11, 20],
        textColor: [255, 255, 255],
        fontStyle: "bold",
        fontSize: 8,
        halign: "center",
      },
      bodyStyles: {
        fontSize: 7,
        textColor: [0, 0, 0],
      },
      columnStyles: {
        0: { cellWidth: 8, halign: "center" },
        1: { cellWidth: 20 },
        2: { cellWidth: 18 },
        3: { cellWidth: 38 },
        4: { cellWidth: 10, halign: "center" },
        5: { cellWidth: 20, halign: "right" },
        6: { cellWidth: 18, halign: "right" },
        7: { cellWidth: 22, halign: "right", fontStyle: "bold" },
        8: { cellWidth: 22, halign: "right", textColor: [34, 197, 94] },
      },
      alternateRowStyles: {
        fillColor: [245, 245, 245],
      },
      margin: { left: 14, right: 14 },
      didDrawPage: (data) => {
        // Footer
        const pageCount = (doc as any).internal.pages.length - 1;
        const pageSize = doc.internal.pageSize;
        const pageHeight = pageSize.height || pageSize.getHeight();
        doc.setFontSize(8);
        doc.setTextColor(128, 128, 128);
        doc.text(
          `Page ${data.pageNumber} of ${pageCount}`,
          data.settings.margin.left,
          pageHeight - 10
        );
        doc.text(
          "Hassan Bookshop - Confidential",
          pageSize.width / 2,
          pageHeight - 10,
          { align: "center" }
        );
      },
    });

    // Save the PDF
    const filename = `Hassan_Bookshop_Sales_Report_${rangeLabel}_${
      new Date().toISOString().split("T")[0]
    }.pdf`;
    doc.save(filename);
  }

  function exportToCSV(type: "inventory" | "sales" | "returns") {
    let csv = "";
    let filename = "";

    if (type === "inventory") {
      // Sort products alphabetically by name for CSV too
      const sortedProducts = [...products].sort((a, b) =>
        a.name.localeCompare(b.name, undefined, { sensitivity: "base" })
      );
      csv =
        "Product ID,Name,Category,Buying Price,Selling Price,Stock,Total Value\n";
      sortedProducts.forEach((p) => {
        const totalValue = p.buying_price * p.quantity_in_stock;
        csv += `${p.product_id},"${p.name}",${p.category},${p.buying_price},${p.selling_price},${p.quantity_in_stock},${totalValue}\n`;
      });
      filename = `inventory_${new Date().toISOString().split("T")[0]}.csv`;
    } else if (type === "returns") {
      const filtered = getFilteredReturns();
      csv =
        "Date,Product ID,Product Name,Quantity Returned,Refund Amount,Reason,Condition,Processed By,Status\n";
      filtered.forEach((r: any) => {
        const product = products.find((p) => p.id === r.product_id);
        csv += `${new Date(r.return_date || r.created_at).toLocaleString()},"${
          product?.product_id || "N/A"
        }","${product?.name || "Unknown"}",${r.quantity_returned},${
          r.total_refund
        },"${r.reason || ""}","${r.condition || ""}","${r.processed_by}",${
          r.status || "pending"
        }\n`;
      });
      filename = `returns_${dateRange}_${
        new Date().toISOString().split("T")[0]
      }.csv`;
    } else {
      const filtered = getFilteredSales();
      csv =
        "Date,Product ID,Product Name,Quantity,Price,Total Sale,Profit,Payment Method,Sold By\n";
      filtered.forEach((s) => {
        const product = products.find((p) => p.id === s.product_id);
        csv += `${new Date(s.created_at).toLocaleString()},"${
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
  const filteredReturns = getFilteredReturns();

  // Use filtered totals for summary cards based on date range
  // Only use server-side totals when "all" is selected
  const totalRevenue =
    dateRange === "all"
      ? salesTotals?.total_sales || 0
      : filteredSales.reduce((sum, s) => sum + s.total_sale, 0);

  const totalProfit =
    dateRange === "all"
      ? salesTotals?.total_profit || 0
      : filteredSales.reduce((sum, s) => sum + s.profit, 0);

  const totalRefunded = filteredReturns.reduce(
    (sum: number, r: any) => sum + (Number(r.total_refund) || 0),
    0
  );
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
        {/* Date Range Filters - Mobile First */}
        <div className="flex flex-col gap-3 mb-4 md:mb-6">
          <div className="flex items-center space-x-2 px-1">
            <div className="p-2 bg-purple-600/20 rounded-lg border border-purple-500/30">
              <Calendar className="w-4 h-4 md:w-5 md:h-5 text-purple-400" />
            </div>
            <span className="font-bold text-white text-sm md:text-base">
              📅 Date Range
            </span>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Filter buttons - 2 columns on mobile, wrap on tablet+ */}
            <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2 flex-1">
              {(
                ["today", "week", "month", "year", "custom", "all"] as const
              ).map((range) => (
                <button
                  key={range}
                  onClick={() => setDateRange(range)}
                  className={`px-3 sm:px-4 py-2.5 sm:py-2 rounded-xl text-xs sm:text-sm font-bold transition-all duration-300 touch-manipulation active:scale-95 ${
                    dateRange === range
                      ? "bg-gradient-to-r from-purple-500 to-pink-600 text-white shadow-lg"
                      : "bg-white/10 text-slate-300 hover:bg-white/20 hover:text-white border border-white/20 active:bg-white/30"
                  }`}
                >
                  {range === "today"
                    ? "Today"
                    : range === "week"
                    ? "7 Days"
                    : range === "month"
                    ? "30 Days"
                    : range === "year"
                    ? `${new Date().getFullYear()}`
                    : range === "custom"
                    ? "Custom"
                    : "All Time"}
                </button>
              ))}
            </div>
            {/* Refresh button */}
            <button
              onClick={handleRefresh}
              disabled={isRefreshing || loading}
              className="flex items-center justify-center space-x-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white px-4 py-2.5 sm:py-2 rounded-xl hover:scale-105 active:scale-95 transition-all duration-300 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed font-bold text-sm touch-manipulation"
              title="Refresh reports data"
            >
              <RefreshCw
                className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`}
              />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Custom Date Range Inputs - Mobile Optimized */}
        {dateRange === "custom" && (
          <div className="mb-4 md:mb-6 p-4 md:p-5 bg-white/5 rounded-xl border border-white/10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-white mb-2">
                  📅 Start Date
                </label>
                <input
                  type="date"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  className="w-full px-4 py-3 md:py-2 bg-white/10 border border-white/20 rounded-lg text-white text-base md:text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 [&::-webkit-calendar-picker-indicator]:filter [&::-webkit-calendar-picker-indicator]:invert touch-manipulation"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-white mb-2">
                  📅 End Date
                </label>
                <input
                  type="date"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  className="w-full px-4 py-3 md:py-2 bg-white/10 border border-white/20 rounded-lg text-white text-base md:text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 [&::-webkit-calendar-picker-indicator]:filter [&::-webkit-calendar-picker-indicator]:invert touch-manipulation"
                />
              </div>
            </div>
            <p className="text-xs text-slate-400 mt-3">
              💡 Select start and end dates to filter reports. Leave blank for
              open-ended ranges.
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4 lg:gap-6">
          <div className="bg-gradient-to-br from-blue-600/20 to-blue-500/10 backdrop-blur-xl rounded-xl p-4 md:p-5 border border-blue-500/30 hover:md:-translate-y-1 active:scale-95 transition-all duration-300 touch-manipulation">
            <p className="text-xs md:text-sm text-blue-300 font-semibold mb-2 uppercase tracking-wide">
              Total Revenue
            </p>
            <p className="text-xl sm:text-2xl md:text-3xl font-black text-white break-words">
              KES {totalRevenue.toLocaleString()}
            </p>
            <p className="text-xs md:text-sm text-blue-400 mt-2 font-medium">
              {filteredSales.length} transaction
              {filteredSales.length !== 1 ? "s" : ""}
            </p>
          </div>

          <div className="bg-gradient-to-br from-emerald-600/20 to-green-500/10 backdrop-blur-xl rounded-xl p-4 md:p-5 border border-emerald-500/30 hover:md:-translate-y-1 active:scale-95 transition-all duration-300 touch-manipulation">
            <p className="text-xs md:text-sm text-emerald-300 font-semibold mb-2 uppercase tracking-wide">
              Total Profit
            </p>
            <p className="text-xl sm:text-2xl md:text-3xl font-black text-white break-words">
              KES {totalProfit.toLocaleString()}
            </p>
            <p className="text-xs md:text-sm text-emerald-400 mt-2 font-medium">
              {totalRevenue > 0
                ? ((totalProfit / totalRevenue) * 100).toFixed(1)
                : 0}
              % margin
            </p>
          </div>

          <div className="bg-gradient-to-br from-rose-600/20 to-red-500/10 backdrop-blur-xl rounded-xl p-4 md:p-5 border border-rose-500/30 hover:md:-translate-y-1 active:scale-95 transition-all duration-300 touch-manipulation sm:col-span-2 lg:col-span-1">
            <p className="text-xs md:text-sm text-rose-300 font-semibold mb-2 uppercase tracking-wide">
              Total Refunded
            </p>
            <p className="text-xl sm:text-2xl md:text-3xl font-black text-white break-words">
              KES {totalRefunded.toLocaleString()}
            </p>
            <p className="text-xs md:text-sm text-rose-400 mt-2 font-medium">
              {filteredReturns.length} return
              {filteredReturns.length !== 1 ? "s" : ""}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white/10 backdrop-blur-2xl rounded-2xl shadow-xl border border-white/20 p-4 md:p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4 md:mb-6">
            <h3 className="text-base md:text-lg font-bold text-white">
              Inventory Report
            </h3>
            <div className="flex gap-2 w-full sm:w-auto">
              <button
                onClick={exportInventoryToPDF}
                className="flex-1 sm:flex-none flex items-center justify-center space-x-1.5 bg-gradient-to-r from-red-500 to-red-600 text-white px-3 py-2.5 sm:py-2 rounded-lg hover:scale-105 active:scale-95 transition-all duration-300 shadow-lg shadow-red-500/25 hover:shadow-xl hover:shadow-red-500/40 text-xs font-bold touch-manipulation"
                title="Export as PDF"
              >
                <FileDown className="w-4 h-4" />
                <span>PDF</span>
              </button>
              <button
                onClick={() => exportToCSV("inventory")}
                className="flex-1 sm:flex-none flex items-center justify-center space-x-1.5 bg-gradient-to-r from-blue-500 to-blue-600 text-white px-3 py-2.5 sm:py-2 rounded-lg hover:scale-105 active:scale-95 transition-all duration-300 shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/40 text-xs font-bold touch-manipulation"
                title="Export as CSV"
              >
                <Download className="w-4 h-4" />
                <span>CSV</span>
              </button>
            </div>
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

        <div className="bg-white/10 backdrop-blur-2xl rounded-2xl shadow-xl border border-white/20 p-4 md:p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4 md:mb-6">
            <h3 className="text-base md:text-lg font-bold text-white">
              Sales Report
            </h3>
            <div className="flex gap-2 w-full sm:w-auto">
              <button
                onClick={exportSalesPDF}
                className="flex-1 sm:flex-none flex items-center justify-center space-x-1.5 bg-gradient-to-r from-red-500 to-red-600 text-white px-3 py-2.5 sm:py-2 rounded-lg hover:scale-105 active:scale-95 transition-all duration-300 shadow-lg shadow-red-500/25 hover:shadow-xl hover:shadow-red-500/40 text-xs font-bold touch-manipulation"
                title="Export as PDF"
              >
                <FileDown className="w-4 h-4" />
                <span>PDF</span>
              </button>
              <button
                onClick={() => exportToCSV("sales")}
                className="flex-1 sm:flex-none flex items-center justify-center space-x-1.5 bg-gradient-to-r from-blue-500 to-blue-600 text-white px-3 py-2.5 sm:py-2 rounded-lg hover:scale-105 active:scale-95 transition-all duration-300 shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/40 text-xs font-bold touch-manipulation"
                title="Export as CSV"
              >
                <Download className="w-4 h-4" />
                <span>CSV</span>
              </button>
            </div>
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

        <div className="bg-white/10 backdrop-blur-2xl rounded-2xl shadow-xl border border-white/20 p-4 md:p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4 md:mb-6">
            <h3 className="text-base md:text-lg font-bold text-white">
              Returns Report
            </h3>
            <button
              onClick={() => exportToCSV("returns")}
              className="w-full sm:w-auto flex items-center justify-center space-x-2 bg-gradient-to-r from-rose-500 to-red-600 text-white px-4 py-2.5 sm:py-2 rounded-xl hover:scale-105 active:scale-95 transition-all duration-300 shadow-lg shadow-rose-500/25 hover:shadow-xl hover:shadow-rose-500/40 text-sm font-bold touch-manipulation"
            >
              <Download className="w-4 h-4" />
              <span>Export CSV</span>
            </button>
          </div>
          <div className="space-y-3">
            <ReportRow
              label="Total Returns"
              value={filteredReturns.length.toString()}
            />
            <ReportRow
              label="Total Refunded"
              value={`KES ${totalRefunded.toLocaleString()}`}
              valueColor="text-rose-600"
            />
            <ReportRow
              label="Average Refund"
              value={`KES ${
                filteredReturns.length > 0
                  ? (totalRefunded / filteredReturns.length).toFixed(2)
                  : 0
              }`}
            />
            <ReportRow
              label="Items Returned"
              value={filteredReturns
                .reduce(
                  (sum: number, r: any) => sum + (r.quantity_returned || 0),
                  0
                )
                .toString()}
            />
            <ReportRow
              label="Return Rate"
              value={`${
                filteredSales.length > 0
                  ? (
                      (filteredReturns.length / filteredSales.length) *
                      100
                    ).toFixed(1)
                  : 0
              }%`}
              valueColor="text-rose-600"
            />
            <ReportRow
              label="Refund Impact"
              value={`${
                totalRevenue > 0
                  ? ((totalRefunded / totalRevenue) * 100).toFixed(1)
                  : 0
              }%`}
              valueColor="text-rose-600"
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
