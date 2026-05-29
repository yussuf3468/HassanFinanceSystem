import React, { useMemo, useState, useRef, useEffect, useCallback } from "react";
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

  const getProductName = useCallback(
    (productId: string) => {
      const product = productMap.get(productId);
      return (product && (product.name || (product as any).title)) || "Unknown";
    },
    [productMap],
  );

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
            (getProductName(it.product_id) + "").toLowerCase().includes(q),
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
    getProductName,
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
      0,
    );
    const profit = filteredTransactions.reduce(
      (s, t) => s + (t.total_profit || 0),
      0,
    );
    const discounts = filteredTransactions.reduce(
      (s, t) => s + (t.total_discount || 0),
      0,
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
      iframe.setAttribute("aria-hidden", "true");
      iframe.style.position = "fixed";
      iframe.style.right = "0";
      iframe.style.bottom = "0";
      iframe.style.width = "0";
      iframe.style.height = "0";
      iframe.style.border = "0";

      let printed = false;
      const doPrint = () => {
        if (printed) return;
        printed = true;
        try {
          const win = iframe.contentWindow;
          if (!win) throw new Error("No iframe window");
          win.focus();
          win.print();
        } catch (err) {
          console.error("Print error", err);
          alert(
            "Unable to print. Please use the PDF download option instead.",
          );
        } finally {
          // Give the print dialog time to open before removing the iframe
          setTimeout(() => {
            if (iframe.parentNode) iframe.parentNode.removeChild(iframe);
          }, 1500);
        }
      };

      // Register handlers BEFORE attaching/writing so we don't miss the load event.
      iframe.onload = doPrint;
      // Fallback in case onload doesn't fire (some browsers when using document.write)
      const fallback = window.setTimeout(doPrint, 800);
      iframe.addEventListener("load", () => window.clearTimeout(fallback), {
        once: true,
      });

      document.body.appendChild(iframe);

      const iframeDoc =
        iframe.contentDocument || iframe.contentWindow?.document;
      if (!iframeDoc) {
        window.clearTimeout(fallback);
        alert("Unable to print. Please use the PDF option instead.");
        if (iframe.parentNode) iframe.parentNode.removeChild(iframe);
        return;
      }

      iframeDoc.open();
      iframeDoc.write(html);
      iframeDoc.close();
    } catch (e) {
      console.error(e);
      alert(
        "Failed to prepare receipt for printing. Please use the PDF option.",
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

  // create HTML used for printing (clean, professional Hassan Bookshop receipt)
  function createPrintHtml(transaction: GroupedTransaction) {
    const rows = transaction.items
      .map(
        (item, idx) => `
          <tr>
            <td class="idx">${idx + 1}</td>
            <td>${escapeHtml(getProductName(item.product_id))}</td>
            <td class="num">${item.quantity_sold}</td>
            <td class="num">${item.selling_price.toLocaleString()}</td>
            <td class="num disc">${
              item.discount_amount && item.discount_amount > 0
                ? "−" + item.discount_amount.toLocaleString()
                : "—"
            }</td>
            <td class="num bold">${item.total_sale.toLocaleString()}</td>
          </tr>`,
      )
      .join("");

    const subtotal = transaction.items.reduce(
      (sum, item) => sum + item.selling_price * item.quantity_sold,
      0,
    );

    const paymentStatus = (transaction.payment_status || "paid")
      .replace("_", " ")
      .toUpperCase();
    const isPaid = paymentStatus === "PAID";

    return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<title>Receipt ${escapeHtml(transaction.transaction_id.slice(0, 8))} — Hassan Bookshop</title>
<meta name="viewport" content="width=device-width,initial-scale=1" />
<style>
  @page { size: A4; margin: 12mm; }
  * { box-sizing: border-box; }
  html, body { margin: 0; padding: 0; background: #fff; }
  body {
    font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
    color: #0f172a;
    font-size: 12px;
    line-height: 1.5;
  }
  .receipt { max-width: 780px; margin: 0 auto; padding: 0 4px; }

  /* ===== Brand header ===== */
  .brand-bar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    padding-bottom: 16px;
    border-bottom: 2px solid #f59e0b;
  }
  .brand-name {
    font-size: 26px;
    font-weight: 800;
    letter-spacing: -0.5px;
    color: #0f172a;
    margin: 0;
  }
  .brand-name .accent { color: #d97706; }
  .brand-tag {
    font-size: 11px;
    color: #64748b;
    margin-top: 2px;
  }
  .brand-meta {
    text-align: right;
    font-size: 10.5px;
    color: #475569;
    line-height: 1.6;
  }
  .brand-meta strong { color: #0f172a; }

  /* ===== Doc title row ===== */
  .doc-title-row {
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    margin: 18px 0 14px;
  }
  .doc-title {
    font-size: 18px;
    font-weight: 700;
    color: #0f172a;
    letter-spacing: 0.5px;
    text-transform: uppercase;
  }
  .doc-id {
    font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
    font-size: 11px;
    color: #475569;
  }
  .doc-id strong { color: #0f172a; }

  /* ===== Meta grid ===== */
  .meta-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px 24px;
    background: #fafaf9;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    padding: 14px 16px;
    margin-bottom: 16px;
  }
  .meta-item .label {
    font-size: 9.5px;
    text-transform: uppercase;
    letter-spacing: 0.6px;
    color: #94a3b8;
    font-weight: 600;
    margin-bottom: 2px;
  }
  .meta-item .value {
    font-size: 12px;
    color: #0f172a;
    font-weight: 600;
  }
  .status-pill {
    display: inline-block;
    padding: 2px 9px;
    border-radius: 999px;
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.4px;
  }
  .status-paid { background: #d1fae5; color: #065f46; }
  .status-other { background: #fef3c7; color: #92400e; }

  /* ===== Items table ===== */
  table.items {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 14px;
  }
  table.items thead th {
    background: #0f172a;
    color: #fff;
    font-weight: 600;
    font-size: 10px;
    letter-spacing: 0.6px;
    text-transform: uppercase;
    padding: 9px 10px;
    text-align: left;
  }
  table.items thead th.num { text-align: right; }
  table.items tbody td {
    padding: 9px 10px;
    border-bottom: 1px solid #f1f5f9;
    color: #0f172a;
  }
  table.items tbody tr:nth-child(even) td { background: #fafaf9; }
  table.items .idx { width: 28px; color: #94a3b8; font-weight: 600; }
  table.items .num { text-align: right; font-variant-numeric: tabular-nums; }
  table.items .disc { color: #b91c1c; }
  table.items .bold { font-weight: 700; }

  /* ===== Totals ===== */
  .totals-wrap {
    display: flex;
    justify-content: flex-end;
    margin-bottom: 22px;
  }
  .totals {
    min-width: 280px;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    overflow: hidden;
  }
  .totals .row {
    display: flex;
    justify-content: space-between;
    padding: 8px 14px;
    font-size: 12px;
  }
  .totals .row + .row { border-top: 1px solid #f1f5f9; }
  .totals .row .l { color: #475569; }
  .totals .row .v { color: #0f172a; font-variant-numeric: tabular-nums; }
  .totals .row.disc .v { color: #b91c1c; }
  .totals .row.grand {
    background: #0f172a;
    color: #fff;
    font-weight: 700;
    font-size: 14px;
    padding: 11px 14px;
  }
  .totals .row.grand .l, .totals .row.grand .v { color: #fff; }

  /* ===== Footer ===== */
  .footer {
    margin-top: 22px;
    padding-top: 16px;
    border-top: 1px dashed #cbd5e1;
    text-align: center;
    color: #64748b;
    font-size: 11px;
  }
  .footer strong { color: #0f172a; }
  .footer .thanks {
    font-size: 13px;
    font-weight: 700;
    color: #d97706;
    margin-bottom: 4px;
  }

  @media print {
    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  }
</style>
</head>
<body>
  <div class="receipt">

    <div class="brand-bar">
      <div>
        <h1 class="brand-name">Hassan <span class="accent">Bookshop</span></h1>
        <div class="brand-tag">Books · Stationery · Electronics — since 2010</div>
      </div>
      <div class="brand-meta">
        <strong>Global Apartments, Eastleigh Section 1</strong><br />
        Nairobi, Kenya<br />
        +254 722 979 547 · yussufh080@gmail.com
      </div>
    </div>

    <div class="doc-title-row">
      <div class="doc-title">Sales Receipt</div>
      <div class="doc-id">No. <strong>${escapeHtml(transaction.transaction_id)}</strong></div>
    </div>

    <div class="meta-grid">
      <div class="meta-item">
        <div class="label">Date</div>
        <div class="value">${new Date(transaction.created_at).toLocaleString()}</div>
      </div>
      <div class="meta-item">
        <div class="label">Customer</div>
        <div class="value">${escapeHtml(transaction.customer_name || "Walk-in Customer")}</div>
      </div>
      <div class="meta-item">
        <div class="label">Sold By</div>
        <div class="value">${escapeHtml(transaction.sold_by)}</div>
      </div>
      <div class="meta-item">
        <div class="label">Payment Method</div>
        <div class="value">${escapeHtml(transaction.payment_method)}</div>
      </div>
      <div class="meta-item">
        <div class="label">Status</div>
        <div class="value"><span class="status-pill ${isPaid ? "status-paid" : "status-other"}">${escapeHtml(paymentStatus)}</span></div>
      </div>
      ${
        transaction.amount_paid
          ? `<div class="meta-item">
        <div class="label">Amount Paid</div>
        <div class="value">KES ${transaction.amount_paid.toLocaleString()}</div>
      </div>`
          : ""
      }
    </div>

    <table class="items">
      <thead>
        <tr>
          <th class="idx">#</th>
          <th>Product</th>
          <th class="num">Qty</th>
          <th class="num">Unit (KES)</th>
          <th class="num">Discount</th>
          <th class="num">Total (KES)</th>
        </tr>
      </thead>
      <tbody>
        ${rows}
      </tbody>
    </table>

    <div class="totals-wrap">
      <div class="totals">
        <div class="row">
          <span class="l">Subtotal</span>
          <span class="v">KES ${subtotal.toLocaleString()}</span>
        </div>
        ${
          transaction.total_discount > 0
            ? `<div class="row disc">
              <span class="l">Discount</span>
              <span class="v">− KES ${transaction.total_discount.toLocaleString()}</span>
            </div>`
            : ""
        }
        <div class="row grand">
          <span class="l">Total</span>
          <span class="v">KES ${transaction.total_amount.toLocaleString()}</span>
        </div>
      </div>
    </div>

    <div class="footer">
      <div class="thanks">Thank you for shopping with Hassan Bookshop!</div>
      Please keep this receipt for returns or exchanges within <strong>7 days</strong>.<br />
      Visit us in Eastleigh · Mon–Sat 8am–8pm · Sun 9am–6pm
    </div>
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
          <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white">
            Sales Transaction Log
          </h2>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400 max-w-xl">
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
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
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
            <div className="text-xs text-slate-600 dark:text-slate-400">
              Revenue
            </div>
            <div className="text-sm font-bold text-slate-900 dark:text-white">
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
              (it) => `${getProductName(it.product_id)} (${it.quantity_sold})`,
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
                        ? "bg-amber-50 dark:bg-amber-900/30 border-amber-300 dark:border-amber-700"
                        : "bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600"
                    }`}
                  >
                    {isOpen ? (
                      <ChevronDown className="w-5 h-5 text-amber-700 dark:text-amber-500" />
                    ) : (
                      <ChevronRight className="w-5 h-5 text-slate-600 dark:text-slate-400" />
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

                        <div className="text-xs font-mono truncate text-slate-600 dark:text-slate-400">
                          ID: {transaction.transaction_id.slice(0, 8)}...
                        </div>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            copyToClipboard(transaction.transaction_id);
                          }}
                          title="Copy transaction id"
                          className="ml-2 p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-700"
                        >
                          <Copy className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                        </button>
                        {copiedTx === transaction.transaction_id && (
                          <span className="ml-2 text-xs text-emerald-600">
                            Copied
                          </span>
                        )}
                      </div>

                      <div className="text-xs text-slate-600 dark:text-slate-400 mt-2 flex items-center gap-3 flex-wrap">
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
                      <div className="text-xs text-slate-500 dark:text-slate-400 mt-2 truncate">
                        {preview}
                      </div>
                    </div>

                    <div className="text-left sm:text-right ml-0 sm:ml-4 mt-2 sm:mt-0">
                      <div className="text-base md:text-lg font-extrabold text-slate-900 dark:text-white">
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
                        className="p-2.5 md:p-3 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-600"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <div className="font-medium truncate text-slate-900 dark:text-white">
                              {getProductName(item.product_id)}
                            </div>
                            <div className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                              {(item.original_price &&
                                `Was KES ${item.original_price.toLocaleString()}`) ||
                                ""}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-semibold text-slate-900 dark:text-white">
                              KES {item.total_sale.toLocaleString()}
                            </div>
                            <div className="text-xs text-slate-600 dark:text-slate-400">
                              Qty: {item.quantity_sold}
                            </div>
                          </div>
                        </div>
                        <div className="mt-2 flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
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

                    <div className="pt-2 border-t border-slate-200 dark:border-slate-700 text-right">
                      <div className="text-sm text-slate-600 dark:text-slate-400">
                        Total
                      </div>
                      <div className="text-xl font-extrabold text-slate-900 dark:text-white">
                        KES {transaction.total_amount.toLocaleString()}
                      </div>
                    </div>
                  </div>

                  {/* Desktop table view */}
                  <div className="hidden lg:block overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-slate-600 dark:text-slate-400">
                          <th className="text-left py-2 px-3">Product</th>
                          <th className="text-right py-2 px-3">Qty</th>
                          <th className="text-right py-2 px-3">Price</th>
                          <th className="text-right py-2 px-3 hidden sm:table-cell">
                            Discount
                          </th>
                          <th className="text-right py-2 px-3">Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                        {transaction.items.map((item) => (
                          <tr
                            key={item.id}
                            className="text-slate-900 dark:text-white hover:bg-white dark:hover:bg-slate-700 transition-colors"
                          >
                            <td className="py-3 px-3">
                              <div className="flex items-center gap-2">
                                <Package className="w-4 h-4 text-amber-600" />
                                <div className="min-w-0">
                                  <div className="font-medium truncate">
                                    {getProductName(item.product_id)}
                                  </div>
                                  <div className="text-xs text-slate-600 dark:text-slate-400 truncate">
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
                      <tfoot className="border-t-2 border-slate-200 dark:border-slate-700">
                        <tr>
                          <td
                            colSpan={4}
                            className="py-3 px-3 text-right text-slate-600 dark:text-slate-400 font-semibold"
                          >
                            Total
                          </td>
                          <td className="py-3 px-3 text-right font-extrabold text-lg text-slate-900 dark:text-white">
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
                        8,
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
                    className="p-2 rounded-full text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Receipt content — clean modal preview */}
              <div className="p-4 md:p-6 overflow-auto flex-1 bg-slate-50 dark:bg-slate-900">
                <div className="max-w-[820px] mx-auto bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
                  {/* Brand header */}
                  <div className="px-5 md:px-8 pt-6 pb-5 border-b-2 border-amber-500">
                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                      <div>
                        <h3 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                          Hassan{" "}
                          <span className="text-amber-600 dark:text-amber-400">
                            Bookshop
                          </span>
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                          Books · Stationery · Electronics — since 2010
                        </p>
                      </div>
                      <div className="md:text-right text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                        <div className="font-semibold text-slate-800 dark:text-slate-200">
                          Global Apartments, Eastleigh Section 1
                        </div>
                        <div>Nairobi, Kenya</div>
                        <div>+254 722 979 547</div>
                        <div className="break-all">yussufh080@gmail.com</div>
                      </div>
                    </div>
                  </div>

                  {/* Doc title row */}
                  <div className="px-5 md:px-8 pt-5 pb-3 flex items-end justify-between gap-3 flex-wrap">
                    <div className="text-lg font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                      Sales Receipt
                    </div>
                    <div className="text-xs font-mono text-slate-500 dark:text-slate-400">
                      No.{" "}
                      <span className="font-bold text-slate-900 dark:text-white">
                        {selectedTransaction.transaction_id}
                      </span>
                    </div>
                  </div>

                  {/* Meta grid */}
                  <div className="px-5 md:px-8 pb-4">
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl p-4">
                      <MetaItem
                        label="Date"
                        value={new Date(
                          selectedTransaction.created_at,
                        ).toLocaleString()}
                      />
                      <MetaItem
                        label="Customer"
                        value={
                          selectedTransaction.customer_name ||
                          "Walk-in Customer"
                        }
                      />
                      <MetaItem
                        label="Sold By"
                        value={selectedTransaction.sold_by}
                      />
                      <MetaItem
                        label="Payment Method"
                        value={selectedTransaction.payment_method}
                      />
                      <div>
                        <div className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">
                          Status
                        </div>
                        <div className="mt-1">
                          <StatusPill
                            status={
                              selectedTransaction.payment_status || "paid"
                            }
                          />
                        </div>
                      </div>
                      {selectedTransaction.amount_paid && (
                        <MetaItem
                          label="Amount Paid"
                          value={`KES ${selectedTransaction.amount_paid.toLocaleString()}`}
                        />
                      )}
                    </div>
                  </div>

                  {/* Items table */}
                  <div className="px-5 md:px-8 pb-2 overflow-x-auto">
                    <table className="w-full border-collapse text-sm">
                      <thead>
                        <tr className="bg-slate-900 dark:bg-slate-700 text-white">
                          <th className="text-left py-2.5 px-3 text-[10px] uppercase tracking-wider font-semibold w-10">
                            #
                          </th>
                          <th className="text-left py-2.5 px-3 text-[10px] uppercase tracking-wider font-semibold">
                            Product
                          </th>
                          <th className="text-right py-2.5 px-3 text-[10px] uppercase tracking-wider font-semibold">
                            Qty
                          </th>
                          <th className="text-right py-2.5 px-3 text-[10px] uppercase tracking-wider font-semibold">
                            Unit
                          </th>
                          <th className="text-right py-2.5 px-3 text-[10px] uppercase tracking-wider font-semibold">
                            Discount
                          </th>
                          <th className="text-right py-2.5 px-3 text-[10px] uppercase tracking-wider font-semibold">
                            Total
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedTransaction.items.map((item, idx) => (
                          <tr
                            key={item.id}
                            className="border-b border-slate-100 dark:border-slate-700 even:bg-slate-50/60 dark:even:bg-slate-900/40"
                          >
                            <td className="py-3 px-3 text-slate-400 font-semibold">
                              {idx + 1}
                            </td>
                            <td className="py-3 px-3 text-slate-900 dark:text-white">
                              {getProductName(item.product_id)}
                            </td>
                            <td className="py-3 px-3 text-right tabular-nums text-slate-700 dark:text-slate-200">
                              {item.quantity_sold}
                            </td>
                            <td className="py-3 px-3 text-right tabular-nums text-slate-700 dark:text-slate-200">
                              {item.selling_price.toLocaleString()}
                            </td>
                            <td className="py-3 px-3 text-right tabular-nums text-red-600 dark:text-red-400">
                              {item.discount_amount &&
                              item.discount_amount > 0
                                ? `−${item.discount_amount.toLocaleString()}`
                                : "—"}
                            </td>
                            <td className="py-3 px-3 text-right tabular-nums font-bold text-slate-900 dark:text-white">
                              {item.total_sale.toLocaleString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Totals */}
                  <div className="px-5 md:px-8 pb-5 pt-2 flex justify-end">
                    <div className="w-full sm:w-80 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
                      <div className="flex justify-between px-4 py-2.5 text-sm">
                        <span className="text-slate-500 dark:text-slate-400">
                          Subtotal
                        </span>
                        <span className="tabular-nums text-slate-900 dark:text-white font-medium">
                          KES{" "}
                          {selectedTransaction.items
                            .reduce(
                              (s, i) =>
                                s + i.selling_price * i.quantity_sold,
                              0,
                            )
                            .toLocaleString()}
                        </span>
                      </div>
                      {selectedTransaction.total_discount > 0 && (
                        <div className="flex justify-between px-4 py-2.5 text-sm border-t border-slate-100 dark:border-slate-700">
                          <span className="text-slate-500 dark:text-slate-400">
                            Discount
                          </span>
                          <span className="tabular-nums text-red-600 dark:text-red-400 font-medium">
                            − KES{" "}
                            {selectedTransaction.total_discount.toLocaleString()}
                          </span>
                        </div>
                      )}
                      <div className="flex justify-between px-4 py-3 bg-slate-900 dark:bg-amber-600 text-white font-bold">
                        <span>Total</span>
                        <span className="tabular-nums text-base">
                          KES{" "}
                          {selectedTransaction.total_amount.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="px-5 md:px-8 py-5 border-t border-dashed border-slate-300 dark:border-slate-700 text-center">
                    <p className="text-sm font-bold text-amber-600 dark:text-amber-400">
                      Thank you for shopping with Hassan Bookshop!
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      Please keep this receipt for returns or exchanges within{" "}
                      <strong className="text-slate-700 dark:text-slate-300">
                        7 days
                      </strong>
                      .
                    </p>
                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                      Visit us in Eastleigh · Mon–Sat 8am–8pm · Sun 9am–6pm
                    </p>
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
                      8,
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
                  className="p-2 rounded-full text-slate-700 dark:text-slate-300 border-2 border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700"
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

function MetaItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">
        {label}
      </div>
      <div className="text-sm font-semibold text-slate-900 dark:text-white mt-0.5 truncate">
        {value}
      </div>
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const normalized = status.replace("_", " ").toUpperCase();
  const isPaid = normalized === "PAID";
  return (
    <span
      className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wide ${
        isPaid
          ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
          : "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300"
      }`}
    >
      {normalized}
    </span>
  );
}
