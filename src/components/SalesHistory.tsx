import React, { useMemo, useState, useRef, useEffect } from "react";
import {
  ChevronDown,
  ChevronRight,
  Printer,
  RefreshCw,
  Package,
  DollarSign,
  Calendar,
  User,
  CreditCard,
  Receipt,
  Copy,
  Search,
  XCircle,
  X,
  Eye,
} from "lucide-react";
import {
  useSales,
  useProducts,
  useSalesTotals,
} from "../hooks/useSupabaseQuery";
import { formatDate } from "../utils/dateFormatter";

interface SaleItem {
  id: string;
  transaction_id: string;
  product_id: string;
  quantity_sold: number;
  selling_price: number;
  buying_price: number;
  total_sale: number;
  profit: number;
  payment_method: string;
  sold_by: string;
  customer_name?: string;
  payment_status?: string;
  amount_paid?: number;
  discount_amount?: number;
  discount_percentage?: number;
  original_price?: number;
  final_price?: number;
  created_at: string;
  sale_date?: string;
}

interface GroupedTransaction {
  transaction_id: string;
  items: SaleItem[];
  total_amount: number;
  total_profit: number;
  total_discount: number;
  item_count: number;
  payment_method: string;
  sold_by: string;
  customer_name?: string;
  payment_status?: string;
  amount_paid?: number;
  created_at: string;
}

export default function SalesHistory() {
  const { data: sales = [], refetch: refetchSales, isRefetching } = useSales();
  const { data: products = [] } = useProducts();
  const { data: salesTotals } = useSalesTotals();

  // UI state
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [query, setQuery] = useState("");
  const [paymentFilter, setPaymentFilter] = useState<string>("all");
  const [sellerFilter, setSellerFilter] = useState<string>("all");
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);

  // Receipt modal
  const [selectedTransaction, setSelectedTransaction] =
    useState<GroupedTransaction | null>(null);
  const [showReceiptModal, setShowReceiptModal] = useState(false);

  // Create product map for O(1) lookups instead of Array.find()
  const productMap = useMemo(() => {
    const map = new Map<string, any>();
    products.forEach((p) => map.set(p.id, p));
    return map;
  }, [products]);

  // Group sales by transaction
  const groupedTransactions = useMemo(() => {
    const groups = new Map<string, GroupedTransaction>();

    sales.forEach((sale: SaleItem) => {
      const txId = sale.transaction_id;
      if (!txId) return;

      if (!groups.has(txId)) {
        groups.set(txId, {
          transaction_id: txId,
          items: [],
          total_amount: 0,
          total_profit: 0,
          total_discount: 0,
          item_count: 0,
          payment_method: sale.payment_method,
          sold_by: sale.sold_by,
          customer_name: sale.customer_name || "Walk-in Customer",
          payment_status: sale.payment_status,
          amount_paid: sale.amount_paid,
          created_at: sale.created_at || sale.sale_date || "",
        });
      }

      const group = groups.get(txId)!;
      group.items.push(sale);
      group.total_amount += sale.total_sale || 0;
      group.total_profit += sale.profit || 0;
      group.total_discount += sale.discount_amount || 0;
      group.item_count += 1;
    });

    // Sort newest first
    const arr = Array.from(groups.values()).sort((a, b) => {
      const dateA = new Date(a.created_at).getTime();
      const dateB = new Date(b.created_at).getTime();
      return dateB - dateA;
    });

    return arr;
  }, [sales]);

  // Derived: available payment methods and sellers for filters
  const availablePayments = useMemo(() => {
    const set = new Set<string>();
    sales.forEach((s) => s.payment_method && set.add(s.payment_method));
    return Array.from(set);
  }, [sales]);

  const availableSellers = useMemo(() => {
    const set = new Set<string>();
    sales.forEach((s) => s.sold_by && set.add(s.sold_by));
    return Array.from(set);
  }, [sales]);

  // Filtered transactions based on search & filters
  const filteredTransactions = useMemo(() => {
    return groupedTransactions.filter((tx) => {
      // date filter
      const txTime = new Date(tx.created_at).getTime();
      if (dateFrom) {
        const fromTime = new Date(dateFrom).getTime();
        if (isNaN(fromTime) === false && txTime < fromTime) return false;
      }
      if (dateTo) {
        const toTime = new Date(dateTo).getTime();
        if (isNaN(toTime) === false && txTime > toTime + 86400000 - 1)
          return false; // inclusive
      }

      // payment filter
      if (paymentFilter !== "all" && tx.payment_method !== paymentFilter)
        return false;

      // seller filter
      if (sellerFilter !== "all" && tx.sold_by !== sellerFilter) return false;

      // query search across tx id, items, seller
      if (query.trim()) {
        const q = query.trim().toLowerCase();
        if (tx.transaction_id.toLowerCase().includes(q)) return true;
        if (tx.sold_by.toLowerCase().includes(q)) return true;
        if (
          tx.items.some((it) =>
            (getProductName(it.product_id) + "").toLowerCase().includes(q)
          )
        )
          return true;
        return false;
      }

      return true;
    });
  }, [
    groupedTransactions,
    query,
    paymentFilter,
    sellerFilter,
    dateFrom,
    dateTo,
  ]);

  // Global stats
  const totals = useMemo(() => {
    // Check if any filters are active
    const hasFilters =
      query.trim() !== "" ||
      paymentFilter !== "all" ||
      sellerFilter !== "all" ||
      dateFrom !== "" ||
      dateTo !== "";

    // If no filters, use server-side totals for accuracy (all 1,786+ sales)
    if (!hasFilters && salesTotals) {
      return {
        revenue: salesTotals.total_sales || 0,
        profit: salesTotals.total_profit || 0,
        discounts: 0, // Not provided by server totals, would need separate calculation
        transactions: groupedTransactions.length,
        items: groupedTransactions.reduce((s, t) => s + t.item_count, 0),
      };
    }

    // If filters are active, use client-side calculation on filtered data
    const revenue = filteredTransactions.reduce(
      (s, t) => s + (t.total_amount || 0),
      0
    );
    const profit = filteredTransactions.reduce(
      (s, t) => s + (t.total_profit || 0),
      0
    );
    const discounts = filteredTransactions.reduce(
      (s, t) => s + (t.total_discount || 0),
      0
    );
    return {
      revenue,
      profit,
      discounts,
      transactions: filteredTransactions.length,
      items: filteredTransactions.reduce((s, t) => s + t.item_count, 0),
    };
  }, [
    filteredTransactions,
    query,
    paymentFilter,
    sellerFilter,
    dateFrom,
    dateTo,
    salesTotals,
    groupedTransactions,
  ]);

  // Pagination logic
  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);
  const paginatedTransactions = useMemo(() => {
    const startIdx = (currentPage - 1) * itemsPerPage;
    const endIdx = startIdx + itemsPerPage;
    return filteredTransactions.slice(startIdx, endIdx);
  }, [filteredTransactions, currentPage, itemsPerPage]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [query, paymentFilter, sellerFilter, dateFrom, dateTo]);

  const getProductName = (productId: string) => {
    const product = productMap.get(productId);
    return (product && (product.name || (product as any).title)) || "Unknown";
  };

  const toggleExpand = (txId: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(txId)) next.delete(txId);
      else next.add(txId);
      return next;
    });
  };

  // copy tx id to clipboard with tiny feedback
  const [copiedTx, setCopiedTx] = useState<string | null>(null);
  useEffect(() => {
    if (!copiedTx) return;
    const t = setTimeout(() => setCopiedTx(null), 1800);
    return () => clearTimeout(t);
  }, [copiedTx]);

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedTx(text);
    } catch {
      const el = document.createElement("textarea");
      el.value = text;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
      setCopiedTx(text);
    }
  };

  // Direct print without popup - uses iframe for better compatibility
  const printReceipt = (transaction: GroupedTransaction) => {
    try {
      const html = createPrintHtml(transaction);

      // Create hidden iframe for printing
      const iframe = document.createElement("iframe");
      iframe.style.position = "absolute";
      iframe.style.width = "0";
      iframe.style.height = "0";
      iframe.style.border = "none";

      document.body.appendChild(iframe);

      const iframeDoc = iframe.contentWindow?.document;
      if (!iframeDoc) {
        alert("Unable to print. Please use the PDF option instead.");
        document.body.removeChild(iframe);
        return;
      }

      iframeDoc.open();
      iframeDoc.write(html);
      iframeDoc.close();

      // Wait for content to load then print
      iframe.onload = () => {
        try {
          iframe.contentWindow?.focus();
          iframe.contentWindow?.print();

          // Clean up after print dialog closes
          setTimeout(() => {
            document.body.removeChild(iframe);
          }, 1000);
        } catch (e) {
          console.error("Print error", e);
          alert("Unable to print. Please use the PDF download option instead.");
          document.body.removeChild(iframe);
        }
      };
    } catch (e) {
      console.error(e);
      alert(
        "Failed to prepare receipt for printing. Please use the PDF option."
      );
    }
  };

  // Show receipt in modal (emphasized)
  const openReceiptModal = (transaction: GroupedTransaction) => {
    setSelectedTransaction(transaction);
    setShowReceiptModal(true);
    // lock scroll
    document.body.style.overflow = "hidden";
  };

  const closeReceiptModal = () => {
    setShowReceiptModal(false);
    setSelectedTransaction(null);
    document.body.style.overflow = "";
  };

  // create HTML used for printing (white, high contrast)
  function createPrintHtml(transaction: GroupedTransaction) {
    const rows = transaction.items
      .map(
        (item) => `
          <tr>
            <td>${escapeHtml(getProductName(item.product_id))}</td>
            <td class="num">${item.quantity_sold}</td>
            <td class="num">KES ${item.selling_price.toLocaleString()}</td>
            <td class="num">${
              item.discount_amount && item.discount_amount > 0
                ? "-KES " + item.discount_amount.toLocaleString()
                : "-"
            }</td>
            <td class="num">KES ${item.total_sale.toLocaleString()}</td>
          </tr>`
      )
      .join("");

    const subtotal = transaction.items.reduce(
      (sum, item) => sum + item.selling_price * item.quantity_sold,
      0
    );

    return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<title>Receipt - HASSAN BOOKSHOP</title>
<meta name="viewport" content="width=device-width,initial-scale=1" />
<style>
  @page { size: A4; margin: 10mm; }
  html, body { height: 100%; margin:0; padding:0; }
  body { font-family: system-ui, -apple-system, "Segoe UI", Arial, sans-serif; color:#111; background:#fff; font-size:13px; line-height:1.4; padding:18px; }
  .wrap { max-width:720px; margin:0 auto; }
  .header { text-align:center; margin-bottom:8px; }
  .header h1 { font-size:20px; margin:0; letter-spacing:0.6px; }
  .sub { color:#555; font-size:12px; margin-top:2px }
  table { width:100%; border-collapse:collapse; margin-top:8px; }
  td, th { padding:6px 8px; border: 1px solid #222; }
  thead th { background:#f6f6f6; font-weight:700; }
  .num { text-align:right; }
  .mono { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, monospace; }
  .foot { margin-top:12px; text-align:center; color:#444; font-size:12px; }
  .sig { display:flex; justify-content:space-between; gap:12px; margin-top:12px}
  .sig > div { border-top:1px solid #000; padding-top:6px; text-align:center; width:45%; font-size:12px; }
</style>
</head>
<body>
  <div class="wrap">
    <div class="header">
      <h1>HASSAN BOOKSHOP</h1>
      <div class="sub">Quality Educational Materials & Supplies</div>
      <div class="sub">Tel: +254 722 979 547 • Email: yussufh080@gmail.com</div>
      <div style="margin-top:10px;font-weight:700;">Sales Receipt</div>
    </div>

    <table>
      <tr>
        <td><strong>Transaction:</strong> ${transaction.transaction_id}</td>
        <td class="mono"><strong>Date:</strong> ${new Date(
          transaction.created_at
        ).toLocaleString()}</td>
      </tr>
      <tr>
        <td><strong>Customer:</strong> ${escapeHtml(
          transaction.customer_name || "Walk-in Customer"
        )}</td>
        <td><strong>Payment:</strong> ${escapeHtml(
          transaction.payment_method
        )}</td>
      </tr>
      <tr>
        <td><strong>Sold By:</strong> ${escapeHtml(transaction.sold_by)}</td>
        <td><strong>Payment Status:</strong> ${escapeHtml(
          (transaction.payment_status || "paid").replace("_", " ").toUpperCase()
        )}</td>
      </tr>
      ${
        transaction.amount_paid
          ? `<tr>
        <td colspan="2"><strong>Amount Paid:</strong> KES ${transaction.amount_paid.toLocaleString()}</td>
      </tr>`
          : ""
      }
    </table>

    <table>
      <thead>
        <tr>
          <th style="text-align:left">Product</th>
          <th class="num">Qty</th>
          <th class="num">Unit</th>
          <th class="num">Disc</th>
          <th class="num">Line</th>
        </tr>
      </thead>
      <tbody>
        ${rows}
      </tbody>
      <tfoot>
        <tr>
          <td colspan="4" style="text-align:right">Subtotal</td>
          <td class="num">KES ${subtotal.toLocaleString()}</td>
        </tr>
        ${
          transaction.total_discount > 0
            ? `<tr>
            <td colspan="4" style="text-align:right">Discount</td>
            <td class="num">-KES ${transaction.total_discount.toLocaleString()}</td>
          </tr>`
            : ""
        }
        <tr>
          <td colspan="4" style="text-align:right">Total</td>
          <td class="num">KES ${transaction.total_amount.toLocaleString()}</td>
        </tr>
      </tfoot>
    </table>

    <div class="sig">
      <div>Customer Signature</div>
      <div>Staff Signature</div>
    </div>

    <div class="foot">Thank you for your purchase. Please keep this receipt for your records.</div>
  </div>
</body>
</html>`;
  }

  function escapeHtml(str: string) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  // Simple skeleton card for loading UI
  const SkeletonCard = () => (
    <div className="animate-pulse bg-gradient-to-r from-white/3 to-white/2 rounded-2xl p-4">
      <div className="h-4 w-1/3 bg-white/6 rounded mb-3" />
      <div className="h-3 w-1/4 bg-white/6 rounded mb-6" />
      <div className="flex gap-3">
        <div className="h-10 w-10 bg-white/6 rounded" />
        <div className="flex-1 space-y-2">
          <div className="h-3 bg-white/6 rounded w-3/5" />
          <div className="h-3 bg-white/6 rounded w-1/2" />
        </div>
      </div>
    </div>
  );

  // Collapsible row content with smooth height transition
  const Collapsible: React.FC<{
    isOpen: boolean;
    children: React.ReactNode;
  }> = ({ isOpen, children }) => {
    const ref = useRef<HTMLDivElement | null>(null);
    const [height, setHeight] = useState<number | "auto">(0);

    useEffect(() => {
      if (!ref.current) return;
      const el = ref.current;
      if (isOpen) {
        const sh = el.scrollHeight;
        setHeight(sh);
        const t = setTimeout(() => setHeight("auto"), 300);
        return () => clearTimeout(t);
      } else {
        setHeight(el.scrollHeight);
        requestAnimationFrame(() => {
          setHeight(0);
        });
      }
    }, [isOpen]);

    return (
      <div
        ref={ref}
        style={{
          height: height === "auto" ? "auto" : `${height}px`,
          transition: "height 300ms cubic-bezier(.2,.9,.2,1)",
          overflow: "hidden",
        }}
        aria-hidden={!isOpen}
      >
        {children}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900">
            Sales Transaction Log
          </h2>
          <p className="mt-1 text-sm text-slate-600 max-w-xl">
            Look up transactions, preview sold items, and reprint receipts with
            a smooth and responsive interface.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => refetchSales()}
            disabled={isRefetching}
            title="Refresh sales data"
            className="w-full md:w-auto inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-lg hover:scale-105 transform transition-all disabled:opacity-60 border-2 border-amber-400"
            aria-busy={isRefetching}
          >
            <RefreshCw
              className={`w-4 h-4 ${isRefetching ? "animate-spin" : ""}`}
            />
            <span className="hidden sm:inline font-semibold text-sm">
              Refresh
            </span>
          </button>
        </div>
      </div>

      {/* Filters + Stats Panel */}
      <div className="bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 shadow-sm rounded-xl p-4 flex flex-col md:flex-row md:items-center gap-3 md:gap-6">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 flex-1">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600 dark:text-slate-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by product, transaction id or seller..."
              className="pl-10 pr-3 py-2 bg-white dark:bg-slate-700 border-2 border-slate-200 dark:border-slate-600 w-full rounded-xl placeholder:text-slate-400 dark:placeholder:text-slate-500 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 dark:focus:ring-amber-600 focus:border-amber-500 dark:focus:border-amber-600"
              aria-label="Search transactions"
            />
            {query && (
              <button
                onClick={() => setQuery("")}
                title="Clear"
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded text-slate-600 hover:text-slate-900"
              >
                <XCircle className="w-4 h-4" />
              </button>
            )}
          </div>

          <select
            value={paymentFilter}
            onChange={(e) => setPaymentFilter(e.target.value)}
            className="w-full sm:w-auto py-2 px-3 bg-white dark:bg-slate-700 border-2 border-slate-200 dark:border-slate-600 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 dark:focus:ring-amber-600 focus:border-amber-500 dark:focus:border-amber-600"
            title="Filter by payment method"
            aria-label="Payment method filter"
          >
            <option
              value="all"
              className="bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
            >
              All Payments
            </option>
            {availablePayments.map((p) => (
              <option
                key={p}
                value={p}
                className="bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
              >
                {p}
              </option>
            ))}
          </select>

          <select
            value={sellerFilter}
            onChange={(e) => setSellerFilter(e.target.value)}
            className="w-full sm:w-auto py-2 px-3 bg-white dark:bg-slate-700 border-2 border-slate-200 dark:border-slate-600 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 dark:focus:ring-amber-600 focus:border-amber-500 dark:focus:border-amber-600"
            title="Filter by seller"
            aria-label="Seller filter"
          >
            <option
              value="all"
              className="bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
            >
              All Sellers
            </option>
            {availableSellers.map((s) => (
              <option
                key={s}
                value={s}
                className="bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
              >
                {s}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="py-2 px-3 rounded-xl bg-white dark:bg-slate-700 border-2 border-slate-200 dark:border-slate-600 text-sm text-slate-900 dark:text-white w-full sm:w-auto focus:outline-none focus:ring-2 focus:ring-amber-500 dark:focus:ring-amber-600 focus:border-amber-500 dark:focus:border-amber-600"
            placeholder="dd/mm/yyyy"
            title="From date"
          />
          <span className="text-slate-600 dark:text-slate-400 hidden sm:inline">
            —
          </span>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="py-2 px-3 rounded-xl bg-white dark:bg-slate-700 border-2 border-slate-200 dark:border-slate-600 text-sm text-slate-900 dark:text-white w-full sm:w-auto focus:outline-none focus:ring-2 focus:ring-amber-500 dark:focus:ring-amber-600 focus:border-amber-500 dark:focus:border-amber-600"
            placeholder="dd/mm/yyyy"
            title="To date"
          />
          <div className="ml-0 sm:ml-3 hidden lg:flex items-center gap-2 px-3 py-2 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700">
            <div className="text-xs text-slate-600">Revenue</div>
            <div className="text-sm font-bold text-slate-900">
              KES {totals.revenue.toLocaleString()}
            </div>
          </div>
        </div>
      </div>

      {/* Overview / quick stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        <div className="bg-gradient-to-r from-amber-500 to-amber-600 rounded-xl shadow-lg p-4 text-white border-2 border-amber-400">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs uppercase opacity-90 font-semibold">
                Transactions
              </div>
              <div className="text-xl sm:text-2xl font-extrabold">
                {totals.transactions}
              </div>
              <div className="text-xs opacity-90 mt-1">
                Items: {totals.items}
              </div>
            </div>
            <div className="bg-white/20 p-2 shadow-lg sm:p-3 rounded-full border border-white/30">
              <Receipt className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-xl shadow-lg p-4 text-white border-2 border-emerald-400">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs uppercase opacity-90 font-semibold">
                Revenue
              </div>
              <div className="text-xl sm:text-2xl font-extrabold">
                KES {totals.revenue.toLocaleString()}
              </div>
              <div className="text-xs opacity-90 mt-1">
                Discounts: KES {totals.discounts.toLocaleString()}
              </div>
            </div>
            <div className="bg-white/20 p-2 shadow-lg sm:p-3 rounded-full border border-white/30">
              <DollarSign className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl shadow-lg p-4 text-white border-2 border-blue-400">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs uppercase opacity-90 font-semibold">
                Profit
              </div>
              <div className="text-xl sm:text-2xl font-extrabold">
                KES {totals.profit.toLocaleString()}
              </div>
              <div className="text-xs opacity-90 mt-1">Net</div>
            </div>
            <div className="bg-white/20 p-2 shadow-lg sm:p-3 rounded-full border border-white/30">
              <CreditCard className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Empty / skeleton states */}
      {filteredTransactions.length === 0 && (
        <div>
          {isRefetching ? (
            <div className="grid gap-3">
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-xl p-6 md:p-10 text-center shadow-sm">
              <Receipt className="w-10 h-10 md:w-14 md:h-14 text-slate-400 dark:text-slate-500 mx-auto mb-4" />
              <h3 className="text-base md:text-lg font-bold mb-2 text-slate-900 dark:text-white">
                No Sales Found
              </h3>
              <p className="text-sm md:text-base text-slate-600 dark:text-slate-400">
                Try adjusting filters, or refresh to load the latest
                transactions.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Transactions List */}
      <div className="space-y-3">
        {paginatedTransactions.map((transaction) => {
          const isOpen = expanded.has(transaction.transaction_id);
          const preview = transaction.items
            .map(
              (it) => `${getProductName(it.product_id)} (${it.quantity_sold})`
            )
            .slice(0, 4)
            .join(", ");
          return (
            <div
              key={transaction.transaction_id}
              className="bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 shadow-sm rounded-xl overflow-hidden"
            >
              <div
                className="flex flex-col sm:flex-row items-start sm:items-center gap-3 md:gap-4 p-3 md:p-4 cursor-pointer hover:bg-amber-50 dark:hover:bg-slate-700 transition-colors"
                role="button"
                tabIndex={0}
                onClick={() => toggleExpand(transaction.transaction_id)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ")
                    toggleExpand(transaction.transaction_id);
                }}
                aria-expanded={isOpen}
                aria-controls={`tx-${transaction.transaction_id}`}
              >
                <div className="flex-shrink-0 mt-0.5 transform transition-transform duration-300">
                  <div
                    className={`p-1.5 md:p-2 rounded-xl border-2 ${
                      isOpen
                        ? "bg-amber-50 border-amber-300"
                        : "bg-white border-slate-200"
                    }`}
                  >
                    {isOpen ? (
                      <ChevronDown className="w-5 h-5 text-amber-700" />
                    ) : (
                      <ChevronRight className="w-5 h-5 text-slate-600" />
                    )}
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="px-2 md:px-3 py-1 bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 font-semibold rounded-xl text-xs border border-amber-200">
                          {transaction.item_count}{" "}
                          {transaction.item_count === 1 ? "Item" : "Items"}
                        </span>

                        <div className="text-xs font-mono truncate text-slate-600">
                          ID: {transaction.transaction_id.slice(0, 8)}...
                        </div>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            copyToClipboard(transaction.transaction_id);
                          }}
                          title="Copy transaction id"
                          className="ml-2 p-1 rounded hover:bg-slate-100"
                        >
                          <Copy className="w-4 h-4 text-slate-600" />
                        </button>
                        {copiedTx === transaction.transaction_id && (
                          <span className="ml-2 text-xs text-emerald-600">
                            Copied
                          </span>
                        )}
                      </div>

                      <div className="text-xs text-slate-600 mt-2 flex items-center gap-3 flex-wrap">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {formatDate(transaction.created_at)}
                        </span>
                        <span className="flex items-center gap-1">
                          <User className="w-3 h-3" />
                          {transaction.sold_by}
                        </span>
                        <span className="flex items-center gap-1">
                          <CreditCard className="w-3 h-3" />
                          {transaction.payment_method}
                        </span>
                      </div>

                      {/* preview */}
                      <div className="text-xs text-slate-500 mt-2 truncate">
                        {preview}
                      </div>
                    </div>

                    <div className="text-left sm:text-right ml-0 sm:ml-4 mt-2 sm:mt-0">
                      <div className="text-base md:text-lg font-extrabold text-slate-900">
                        KES {transaction.total_amount.toLocaleString()}
                      </div>
                      {transaction.total_discount > 0 && (
                        <div className="text-xs text-red-600">
                          Discount: KES{" "}
                          {transaction.total_discount.toLocaleString()}
                        </div>
                      )}
                      <div className="text-xs text-emerald-600">
                        Profit: KES {transaction.total_profit.toLocaleString()}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex-shrink-0 flex items-center gap-2 mt-2 sm:mt-0">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      openReceiptModal(transaction);
                    }}
                    className="p-2 bg-white dark:bg-slate-700 border-2 border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-xl hover:bg-amber-50 dark:hover:bg-slate-600 hover:border-amber-300 dark:hover:border-amber-600 transition"
                    title="View receipt"
                  >
                    <Eye className="w-4 h-4" />
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      printReceipt(transaction);
                    }}
                    className="p-2 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-xl hover:scale-105 transition-transform shadow border-2 border-emerald-400"
                    title="Print receipt"
                  >
                    <Printer className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <Collapsible isOpen={isOpen}>
                <div
                  id={`tx-${transaction.transaction_id}`}
                  className="border-t-2 border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-700 p-3 md:p-4"
                >
                  {/* Mobile stacked view */}
                  <div className="lg:hidden space-y-2">
                    {transaction.items.map((item) => (
                      <div
                        key={item.id}
                        className="p-2.5 md:p-3 bg-white rounded-lg border border-slate-200"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <div className="font-medium truncate text-slate-900">
                              {getProductName(item.product_id)}
                            </div>
                            <div className="text-xs text-slate-600 mt-1">
                              {(item.original_price &&
                                `Was KES ${item.original_price.toLocaleString()}`) ||
                                ""}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-semibold text-slate-900">
                              KES {item.total_sale.toLocaleString()}
                            </div>
                            <div className="text-xs text-slate-600">
                              Qty: {item.quantity_sold}
                            </div>
                          </div>
                        </div>
                        <div className="mt-2 flex items-center justify-between text-xs text-slate-600">
                          <div>
                            Unit: KES {item.selling_price.toLocaleString()}
                          </div>
                          <div>
                            {item.discount_amount && item.discount_amount > 0
                              ? `Disc: -KES ${item.discount_amount.toLocaleString()}`
                              : ""}
                          </div>
                        </div>
                      </div>
                    ))}

                    <div className="pt-2 border-t border-slate-200 text-right">
                      <div className="text-sm text-slate-600">Total</div>
                      <div className="text-xl font-extrabold text-slate-900">
                        KES {transaction.total_amount.toLocaleString()}
                      </div>
                    </div>
                  </div>

                  {/* Desktop table view */}
                  <div className="hidden lg:block overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-slate-600">
                          <th className="text-left py-2 px-3">Product</th>
                          <th className="text-right py-2 px-3">Qty</th>
                          <th className="text-right py-2 px-3">Price</th>
                          <th className="text-right py-2 px-3 hidden sm:table-cell">
                            Discount
                          </th>
                          <th className="text-right py-2 px-3">Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {transaction.items.map((item) => (
                          <tr
                            key={item.id}
                            className="text-slate-900 hover:bg-white transition-colors"
                          >
                            <td className="py-3 px-3">
                              <div className="flex items-center gap-2">
                                <Package className="w-4 h-4 text-amber-600" />
                                <div className="min-w-0">
                                  <div className="font-medium truncate">
                                    {getProductName(item.product_id)}
                                  </div>
                                  <div className="text-xs text-slate-600 truncate">
                                    {(item.original_price &&
                                      `Was KES ${item.original_price.toLocaleString()}`) ||
                                      ""}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="py-3 px-3 text-right">
                              {item.quantity_sold}
                            </td>
                            <td className="py-3 px-3 text-right">
                              KES {item.selling_price.toLocaleString()}
                            </td>
                            <td className="py-3 px-3 text-right text-red-600 hidden sm:table-cell">
                              {item.discount_amount && item.discount_amount > 0
                                ? `-KES ${item.discount_amount.toLocaleString()}`
                                : "-"}
                            </td>
                            <td className="py-3 px-3 text-right font-semibold">
                              KES {item.total_sale.toLocaleString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot className="border-t-2 border-slate-200">
                        <tr>
                          <td
                            colSpan={4}
                            className="py-3 px-3 text-right text-slate-600 font-semibold"
                          >
                            Total
                          </td>
                          <td className="py-3 px-3 text-right font-extrabold text-lg text-slate-900">
                            KES {transaction.total_amount.toLocaleString()}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              </Collapsible>
            </div>
          );
        })}
      </div>

      {/* Pagination Controls */}
      {filteredTransactions.length > 0 && (
        <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4 p-4 bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 shadow-sm rounded-xl">
          <div className="text-sm text-slate-600 dark:text-slate-400">
            Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
            {Math.min(currentPage * itemsPerPage, filteredTransactions.length)}{" "}
            of {filteredTransactions.length} transactions
          </div>

          <div className="flex items-center gap-3">
            <select
              value={itemsPerPage}
              onChange={(e) => {
                setItemsPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="px-3 py-2 bg-white dark:bg-slate-700 border-2 border-slate-200 dark:border-slate-600 rounded-xl text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 dark:focus:ring-amber-600 focus:border-amber-500 dark:focus:border-amber-600"
            >
              <option
                value={10}
                className="bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
              >
                10 per page
              </option>
              <option
                value={20}
                className="bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
              >
                20 per page
              </option>
              <option
                value={50}
                className="bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
              >
                50 per page
              </option>
              <option
                value={100}
                className="bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
              >
                100 per page
              </option>
            </select>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 bg-white dark:bg-slate-700 border-2 border-slate-200 dark:border-slate-600 rounded-xl text-slate-900 dark:text-white text-sm hover:bg-amber-50 dark:hover:bg-slate-600 hover:border-amber-300 dark:hover:border-amber-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Previous
              </button>

              <span className="px-3 py-2 text-sm text-slate-700 dark:text-slate-300 font-semibold">
                Page {currentPage} of {totalPages}
              </span>

              <button
                onClick={() =>
                  setCurrentPage((p) => Math.min(totalPages, p + 1))
                }
                disabled={currentPage === totalPages}
                className="px-4 py-2 bg-white dark:bg-slate-700 border-2 border-slate-200 dark:border-slate-600 rounded-xl text-slate-900 dark:text-white text-sm hover:bg-amber-50 dark:hover:bg-slate-600 hover:border-amber-300 dark:hover:border-amber-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Receipt Modal */}
      {showReceiptModal && selectedTransaction && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={closeReceiptModal}
          />

          <div className="relative w-full h-full md:h-auto max-w-3xl mx-0 md:mx-4">
            <div className="bg-white dark:bg-slate-800 rounded-t-2xl md:rounded-2xl shadow-2xl overflow-hidden flex flex-col h-full md:max-h-[calc(100vh-200px)]">
              <div className="flex items-center justify-between p-4 border-b dark:border-slate-700 gap-3 sticky top-0 bg-white dark:bg-slate-800 z-10">
                <div className="flex items-center gap-3 min-w-0">
                  <Receipt className="w-6 h-6 text-slate-800 dark:text-white flex-shrink-0" />
                  <div className="min-w-0">
                    <div className="font-bold text-slate-900 dark:text-white truncate">
                      Sales Receipt
                    </div>
                    <div className="text-xs text-slate-600 dark:text-slate-400 truncate">
                      Transaction{" "}
                      {selectedTransaction.transaction_id.slice(0, 10)} •{" "}
                      {formatDate(selectedTransaction.created_at)}
                    </div>
                  </div>
                </div>

                <div className="hidden md:flex items-center gap-2">
                  <button
                    onClick={() => {
                      printReceipt(selectedTransaction);
                    }}
                    className="flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white px-3 py-2 rounded-lg shadow border-2 border-emerald-400"
                  >
                    <Printer className="w-4 h-4" />
                    Print
                  </button>

                  <button
                    onClick={() => {
                      const html = createPrintHtml(selectedTransaction);
                      const blob = new Blob([html], { type: "text/html" });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement("a");
                      a.href = url;
                      a.download = `receipt-${selectedTransaction.transaction_id.slice(
                        0,
                        8
                      )}.html`;
                      document.body.appendChild(a);
                      a.click();
                      document.body.removeChild(a);
                      URL.revokeObjectURL(url);
                    }}
                    className="flex items-center gap-2 bg-white dark:bg-slate-700 border-2 border-slate-200 dark:border-slate-600 text-slate-800 dark:text-white px-3 py-2 rounded-lg hover:bg-amber-50 dark:hover:bg-slate-600 hover:border-amber-300 dark:hover:border-amber-600"
                    title="Download receipt (open the file and use browser's Print to PDF)"
                  >
                    <Eye className="w-4 h-4" />
                    PDF
                  </button>

                  <button
                    onClick={closeReceiptModal}
                    className="p-2 rounded-full text-slate-700 hover:bg-slate-100"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Receipt content - emphasized, white card with dark text */}
              <div className="p-4 md:p-6 overflow-auto flex-1">
                <div className="max-w-[820px] mx-auto">
                  <div className="text-center mb-4">
                    <h3 className="text-xl font-bold">HASSAN BOOKSHOP</h3>
                    <div className="text-sm text-slate-700 ">
                      Quality Educational Materials & Supplies
                    </div>
                    <div className="text-sm text-slate-700 ">
                      Tel: +254 722 979 547 • yussufh080@gmail.com
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                    <div>
                      <div className="text-xs text-slate-700 ">Transaction</div>
                      <div className="font-medium">
                        {selectedTransaction.transaction_id}
                      </div>
                    </div>
                    <div className="text-left sm:text-right">
                      <div className="text-xs text-slate-700 ">Date</div>
                      <div className="font-medium">
                        {new Date(
                          selectedTransaction.created_at
                        ).toLocaleString()}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-700 ">Customer</div>
                      <div className="font-medium">
                        {selectedTransaction.customer_name ||
                          "Walk-in Customer"}
                      </div>
                    </div>
                    <div className="text-left sm:text-right">
                      <div className="text-xs text-slate-700 ">Payment</div>
                      <div className="font-medium">
                        {selectedTransaction.payment_method}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-700 ">Sold By</div>
                      <div className="font-medium">
                        {selectedTransaction.sold_by}
                      </div>
                    </div>
                    <div className="text-left sm:text-right">
                      <div className="text-xs text-slate-700 ">
                        Payment Status
                      </div>
                      <div className="font-medium">
                        {(selectedTransaction.payment_status || "paid")
                          .replace("_", " ")
                          .toUpperCase()}
                      </div>
                    </div>
                    {selectedTransaction.amount_paid && (
                      <div className="sm:col-span-2">
                        <div className="text-xs text-slate-700 ">
                          Amount Paid
                        </div>
                        <div className="font-medium">
                          KES {selectedTransaction.amount_paid.toLocaleString()}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="text-sm text-slate-700 border-b">
                          <th className="text-left py-2">Product</th>
                          <th className="text-right py-2">Qty</th>
                          <th className="text-right py-2">Unit</th>
                          <th className="text-right py-2">Discount</th>
                          <th className="text-right py-2">Line</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedTransaction.items.map((item) => (
                          <tr key={item.id} className="text-sm text-slate-900">
                            <td className="py-3">
                              {getProductName(item.product_id)}
                            </td>
                            <td className="py-3 text-right">
                              {item.quantity_sold}
                            </td>
                            <td className="py-3 text-right">
                              KES {item.selling_price.toLocaleString()}
                            </td>
                            <td className="py-3 text-right">
                              {item.discount_amount && item.discount_amount > 0
                                ? `-KES ${item.discount_amount.toLocaleString()}`
                                : "-"}
                            </td>
                            <td className="py-3 text-right font-semibold">
                              KES {item.total_sale.toLocaleString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr className="border-t">
                          <td
                            colSpan={4}
                            className="py-3 text-right text-slate-700 font-medium"
                          >
                            Total
                          </td>
                          <td className="py-3 text-right font-extrabold">
                            KES{" "}
                            {selectedTransaction.total_amount.toLocaleString()}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>

                  <div className="mt-6 flex gap-6 items-center">
                    <div className="flex-1">
                      <div className="text-xs text-slate-700 ">Notes</div>
                      <div className="text-sm text-slate-700">
                        Thank you for your purchase. Keep this receipt for
                        returns.
                      </div>
                    </div>

                    <div className="w-48">
                      <div className="text-xs text-slate-700 ">Signatures</div>
                      <div className="flex gap-2 mt-3">
                        <div className="flex-1 border-t pt-2 text-center text-xs">
                          Customer
                        </div>
                        <div className="flex-1 border-t pt-2 text-center text-xs">
                          Staff
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              {/* end receipt content */}

              {/* Mobile footer actions - sticky at bottom for small screens */}
              <div className="md:hidden sticky bottom-0 left-0 right-0 p-3 bg-white dark:bg-slate-800 border-t dark:border-slate-700 flex gap-2 justify-end">
                <button
                  onClick={() => printReceipt(selectedTransaction)}
                  className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white px-3 py-2 rounded-lg shadow border-2 border-emerald-400"
                >
                  <Printer className="w-4 h-4" />
                  Print
                </button>

                <button
                  onClick={() => {
                    const html = createPrintHtml(selectedTransaction);
                    const blob = new Blob([html], { type: "text/html" });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = `receipt-${selectedTransaction.transaction_id.slice(
                      0,
                      8
                    )}.html`;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);
                  }}
                  className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-white dark:bg-slate-700 border-2 border-slate-200 dark:border-slate-600 text-slate-800 dark:text-white px-3 py-2 rounded-lg hover:bg-amber-50 dark:hover:bg-slate-600 hover:border-amber-300 dark:hover:border-amber-600"
                  title="Download receipt (open the file and use browser's Print to PDF)"
                >
                  <Eye className="w-4 h-4" />
                  PDF
                </button>

                <button
                  onClick={closeReceiptModal}
                  className="p-2 rounded-full text-slate-700 border-2 border-slate-200 hover:bg-slate-50"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
