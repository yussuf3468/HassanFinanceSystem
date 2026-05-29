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
  TrendingUp,
  TrendingDown,
  Star,
  Crown,
  ShoppingBag,
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

  // ===== Smart insights for repeat-customer focus =====
  const insights = useMemo(() => {
    const startOfDay = (d: Date) =>
      new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
    const now = new Date();
    const todayStart = startOfDay(now);
    const yesterdayStart = todayStart - 86400000;
    const weekStart = todayStart - 6 * 86400000;

    let todayRevenue = 0;
    let todayTx = 0;
    let yesterdayRevenue = 0;
    let weekRevenue = 0;
    const customerCounts = new Map<string, { count: number; total: number }>();

    groupedTransactions.forEach((tx) => {
      const t = new Date(tx.created_at).getTime();
      if (t >= todayStart) {
        todayRevenue += tx.total_amount;
        todayTx += 1;
      } else if (t >= yesterdayStart && t < todayStart) {
        yesterdayRevenue += tx.total_amount;
      }
      if (t >= weekStart) weekRevenue += tx.total_amount;

      const name = (tx.customer_name || "Walk-in Customer").trim();
      const existing = customerCounts.get(name) || { count: 0, total: 0 };
      existing.count += 1;
      existing.total += tx.total_amount;
      customerCounts.set(name, existing);
    });

    // Find top customer (excluding generic walk-ins)
    let topCustomer: { name: string; count: number; total: number } | null = null;
    customerCounts.forEach((stats, name) => {
      if (name.toLowerCase().includes("walk")) return;
      if (!topCustomer || stats.total > topCustomer.total) {
        topCustomer = { name, count: stats.count, total: stats.total };
      }
    });

    const revenueDelta =
      yesterdayRevenue === 0
        ? null
        : ((todayRevenue - yesterdayRevenue) / yesterdayRevenue) * 100;

    const avgTx =
      groupedTransactions.length > 0
        ? groupedTransactions.reduce((s, t) => s + t.total_amount, 0) /
          groupedTransactions.length
        : 0;

    return {
      todayRevenue,
      todayTx,
      yesterdayRevenue,
      weekRevenue,
      revenueDelta,
      avgTx,
      customerCounts,
      topCustomer,
      totalCustomers: customerCounts.size,
    };
  }, [groupedTransactions]);

  // Date preset helper
  const applyDatePreset = (preset: "today" | "week" | "month" | "all") => {
    const now = new Date();
    const iso = (d: Date) =>
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
        d.getDate(),
      ).padStart(2, "0")}`;
    if (preset === "today") {
      setDateFrom(iso(now));
      setDateTo(iso(now));
    } else if (preset === "week") {
      const start = new Date(now);
      start.setDate(start.getDate() - 6);
      setDateFrom(iso(start));
      setDateTo(iso(now));
    } else if (preset === "month") {
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      setDateFrom(iso(start));
      setDateTo(iso(now));
    } else {
      setDateFrom("");
      setDateTo("");
    }
  };

  const activePreset: "today" | "week" | "month" | "all" | "custom" =
    useMemo(() => {
      if (!dateFrom && !dateTo) return "all";
      const now = new Date();
      const iso = (d: Date) =>
        `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
          d.getDate(),
        ).padStart(2, "0")}`;
      if (dateFrom === iso(now) && dateTo === iso(now)) return "today";
      const weekStart = new Date(now);
      weekStart.setDate(weekStart.getDate() - 6);
      if (dateFrom === iso(weekStart) && dateTo === iso(now)) return "week";
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      if (dateFrom === iso(monthStart) && dateTo === iso(now)) return "month";
      return "custom";
    }, [dateFrom, dateTo]);

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

  // Direct print without popup - uses iframe with real dimensions so the browser
  // actually performs layout before print() is called (a 0x0 iframe prints blank).
  const printReceipt = (transaction: GroupedTransaction) => {
    try {
      const html = createPrintHtml(transaction);

      const iframe = document.createElement("iframe");
      iframe.setAttribute("aria-hidden", "true");
      // Real A4 footprint, but pushed offscreen and made invisible. Browsers
      // require non-zero rendered size to lay out content for printing.
      iframe.style.position = "fixed";
      iframe.style.top = "0";
      iframe.style.left = "0";
      iframe.style.width = "210mm";
      iframe.style.height = "297mm";
      iframe.style.opacity = "0";
      iframe.style.pointerEvents = "none";
      iframe.style.border = "0";
      iframe.style.zIndex = "-1";
      iframe.srcdoc = html;

      let printed = false;
      const cleanup = () => {
        setTimeout(() => {
          if (iframe.parentNode) iframe.parentNode.removeChild(iframe);
        }, 1500);
      };
      const doPrint = () => {
        if (printed) return;
        printed = true;
        // Give the browser two animation frames to ensure paint is complete.
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
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
              cleanup();
            }
          });
        });
      };

      iframe.onload = doPrint;
      // Fallback in case onload doesn't fire (rare with srcdoc, but safe).
      const fallback = window.setTimeout(doPrint, 1200);
      iframe.addEventListener(
        "load",
        () => window.clearTimeout(fallback),
        { once: true },
      );

      document.body.appendChild(iframe);
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
      .map((item, idx) => {
        const lineGross = item.selling_price * item.quantity_sold;
        const lineDiscount = Math.max(
          item.discount_amount || 0,
          lineGross - (item.total_sale || 0),
        );
        return `
          <tr>
            <td class="idx">${idx + 1}</td>
            <td>${escapeHtml(getProductName(item.product_id))}</td>
            <td class="num">${item.quantity_sold}</td>
            <td class="num">${item.selling_price.toLocaleString()}</td>
            <td class="num disc">${
              lineDiscount > 0 ? "−" + lineDiscount.toLocaleString() : "—"
            }</td>
            <td class="num bold">${item.total_sale.toLocaleString()}</td>
          </tr>`;
      })
      .join("");

    const subtotal = transaction.items.reduce(
      (sum, item) => sum + item.selling_price * item.quantity_sold,
      0,
    );
    const totalDiscount = Math.max(
      transaction.total_discount || 0,
      subtotal - transaction.total_amount,
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
  @page { size: A4; margin: 18mm 14mm; }
  * { box-sizing: border-box; }
  html, body { margin: 0; padding: 0; background: #fff; }
  body {
    font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
    color: #0f172a;
    font-size: 12px;
    line-height: 1.5;
    padding: 32px 16px;
  }
  .receipt { max-width: 780px; margin: 0 auto; padding: 0 4px; }
  @media print {
    body { padding: 0; }
  }

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
    background: #fffbeb;
    color: #92400e;
    font-weight: 700;
    font-size: 10px;
    letter-spacing: 0.7px;
    text-transform: uppercase;
    padding: 10px 10px;
    text-align: left;
    border-bottom: 2px solid #f59e0b;
  }
  table.items thead th.num { text-align: right; }
  table.items tbody td {
    padding: 10px 10px;
    border-bottom: 1px solid #f1f5f9;
    color: #0f172a;
  }
  table.items tbody tr:last-child td { border-bottom: none; }
  table.items .idx { width: 28px; color: #94a3b8; font-weight: 600; }
  table.items .num { text-align: right; font-variant-numeric: tabular-nums; }
  table.items .disc { color: #b91c1c; font-weight: 600; }
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
    background: #fff;
  }
  .totals .row {
    display: flex;
    justify-content: space-between;
    padding: 9px 14px;
    font-size: 12px;
  }
  .totals .row + .row { border-top: 1px solid #f1f5f9; }
  .totals .row .l { color: #475569; }
  .totals .row .v { color: #0f172a; font-variant-numeric: tabular-nums; font-weight: 600; }
  .totals .row.disc .v { color: #b91c1c; }
  .totals .row.grand {
    background: #fffbeb;
    border-top: 2px solid #f59e0b;
    font-weight: 800;
    font-size: 14px;
    padding: 12px 14px;
  }
  .totals .row.grand .l { color: #92400e; }
  .totals .row.grand .v { color: #92400e; }

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
  .powered {
    margin-top: 14px;
    padding-top: 10px;
    border-top: 1px solid #f1f5f9;
    text-align: center;
    font-size: 10px;
    color: #94a3b8;
    letter-spacing: 0.3px;
  }
  .powered a { color: #d97706; text-decoration: none; font-weight: 600; }

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
        <div class="brand-tag">Books · Stationery · Electronics — since 2025</div>
      </div>
      <div class="brand-meta">
        <strong>Global Apartments, Eastleigh Section 1</strong><br />
        Nairobi, Kenya<br />
        +254 722 979 547 · yussufh080@gmail.com
      </div>
    </div>

    <div class="doc-title-row">
      <div class="doc-title">Sales Receipt</div>
      <div class="doc-id">Receipt <strong>#${escapeHtml(transaction.transaction_id.slice(0, 8).toUpperCase())}</strong></div>
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
          totalDiscount > 0
            ? `<div class="row disc">
              <span class="l">Discount</span>
              <span class="v">− KES ${totalDiscount.toLocaleString()}</span>
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

    <div class="powered">
      Powered by <a href="https://lenzro.com" target="_blank" rel="noopener noreferrer">Lenzro</a> · lenzro.com
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
    <div className="animate-pulse bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-4">
      <div className="h-4 w-1/3 bg-slate-200 dark:bg-slate-700 rounded mb-3" />
      <div className="h-3 w-1/4 bg-slate-200 dark:bg-slate-700 rounded mb-6" />
      <div className="flex gap-3">
        <div className="h-10 w-10 bg-slate-200 dark:bg-slate-700 rounded" />
        <div className="flex-1 space-y-2">
          <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-3/5" />
          <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-1/2" />
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

  const hasActiveFilters =
    query.trim() !== "" ||
    paymentFilter !== "all" ||
    sellerFilter !== "all" ||
    dateFrom !== "" ||
    dateTo !== "";

  const inputClass =
    "w-full py-2 px-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition-colors";

  const presetTabs: Array<{
    key: "today" | "week" | "month" | "all";
    label: string;
  }> = [
    { key: "today", label: "Today" },
    { key: "week", label: "Past 7 days" },
    { key: "month", label: "This month" },
    { key: "all", label: "All time" },
  ];

  const topCustomer = insights.topCustomer as
    | { name: string; count: number; total: number }
    | null;

  return (
    <div className="space-y-5">
      {/* ===================== Header ===================== */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            Sales History
          </h2>
          <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
            Today: <span className="font-semibold text-slate-900 dark:text-white tabular-nums">KES {insights.todayRevenue.toLocaleString()}</span>
            {insights.revenueDelta !== null && (
              <span
                className={`ml-2 inline-flex items-center gap-1 text-xs font-semibold ${
                  insights.revenueDelta >= 0
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-rose-600 dark:text-rose-400"
                }`}
              >
                {insights.revenueDelta >= 0 ? (
                  <TrendingUp className="w-3 h-3" />
                ) : (
                  <TrendingDown className="w-3 h-3" />
                )}
                {Math.abs(insights.revenueDelta).toFixed(0)}% vs yesterday
              </span>
            )}
            {" · "}
            <span className="text-slate-500 dark:text-slate-400">
              {insights.todayTx} tx today
            </span>
            {topCustomer && (
              <>
                {" · "}
                <span className="inline-flex items-center gap-1 text-amber-700 dark:text-amber-400 font-semibold">
                  <Crown className="w-3 h-3" />
                  Top: {topCustomer.name}
                </span>
              </>
            )}
          </p>
        </div>

        <button
          onClick={() => refetchSales()}
          disabled={isRefetching}
          title="Refresh sales data"
          className="inline-flex items-center justify-center gap-2 px-4 h-10 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-60 transition-colors"
          aria-busy={isRefetching}
        >
          <RefreshCw
            className={`w-4 h-4 ${isRefetching ? "animate-spin" : ""}`}
          />
          Refresh
        </button>
      </div>

      {/* ===================== KPI cards (totals reflect current filter) ===================== */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <StatCard
          label="Transactions"
          value={totals.transactions.toLocaleString()}
          hint={`${totals.items.toLocaleString()} items sold`}
          icon={Receipt}
          accent="amber"
        />
        <StatCard
          label="Revenue"
          value={`KES ${totals.revenue.toLocaleString()}`}
          hint={`Discounts KES ${totals.discounts.toLocaleString()}`}
          icon={DollarSign}
          accent="emerald"
        />
        <StatCard
          label="Profit"
          value={`KES ${totals.profit.toLocaleString()}`}
          hint={`${
            totals.revenue > 0
              ? Math.round((totals.profit / totals.revenue) * 100)
              : 0
          }% margin`}
          icon={CreditCard}
          accent="blue"
        />
      </div>

      {/* ===================== Date preset chips ===================== */}
      <div className="flex flex-wrap items-center gap-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-2">
        {presetTabs.map((p) => {
          const isActive = activePreset === p.key;
          return (
            <button
              key={p.key}
              onClick={() => applyDatePreset(p.key)}
              className={`flex-1 sm:flex-none h-9 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                isActive
                  ? "bg-amber-500 text-white shadow-sm"
                  : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
              }`}
            >
              {p.label}
            </button>
          );
        })}
        {activePreset === "custom" && (
          <span className="ml-auto text-[11px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 px-2">
            Custom range
          </span>
        )}
      </div>

      {/* ===================== Filters ===================== */}
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-4">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-2.5">
          <div className="md:col-span-4 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by customer, product, or ID…"
              className={`${inputClass} pl-9`}
              aria-label="Search transactions"
            />
            {query && (
              <button
                onClick={() => setQuery("")}
                title="Clear"
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded text-slate-400 hover:text-slate-700 dark:hover:text-white"
              >
                <XCircle className="w-4 h-4" />
              </button>
            )}
          </div>

          <select
            value={paymentFilter}
            onChange={(e) => setPaymentFilter(e.target.value)}
            className={`${inputClass} md:col-span-2`}
            title="Filter by payment method"
            aria-label="Payment method filter"
          >
            <option value="all">All Payments</option>
            {availablePayments.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>

          <select
            value={sellerFilter}
            onChange={(e) => setSellerFilter(e.target.value)}
            className={`${inputClass} md:col-span-2`}
            title="Filter by seller"
            aria-label="Seller filter"
          >
            <option value="all">All Sellers</option>
            {availableSellers.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>

          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className={`${inputClass} md:col-span-2`}
            title="From date"
          />
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className={`${inputClass} md:col-span-2`}
            title="To date"
          />
        </div>

        {hasActiveFilters && (
          <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between text-xs">
            <span className="text-slate-500 dark:text-slate-400">
              Showing{" "}
              <span className="font-semibold text-slate-900 dark:text-white">
                {filteredTransactions.length.toLocaleString()}
              </span>{" "}
              filtered transactions
            </span>
            <button
              onClick={() => {
                setQuery("");
                setPaymentFilter("all");
                setSellerFilter("all");
                setDateFrom("");
                setDateTo("");
              }}
              className="font-semibold text-amber-600 hover:text-amber-700 dark:text-amber-400"
            >
              Clear all
            </button>
          </div>
        )}
      </div>

      {/* ===================== Section title ===================== */}
      <div className="flex items-end justify-between pt-1">
        <div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">
            Recent transactions
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Tap a row to see items · click{" "}
            <Printer className="w-3 h-3 inline mb-0.5 text-amber-500" /> to
            reprint a receipt
          </p>
        </div>
        <div className="text-[11px] uppercase tracking-wider text-slate-400 font-bold">
          {filteredTransactions.length.toLocaleString()} results
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
            <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-10 text-center">
              <div className="w-14 h-14 mx-auto rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center mb-4">
                <Receipt className="w-7 h-7 text-slate-400" />
              </div>
              <h3 className="text-base font-bold mb-1 text-slate-900 dark:text-white">
                No sales found
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Try adjusting filters, or refresh to load the latest
                transactions.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Transactions List */}
      <div className="space-y-2.5">
        {paginatedTransactions.map((transaction) => {
          const isOpen = expanded.has(transaction.transaction_id);
          const preview = transaction.items
            .map(
              (it) => `${getProductName(it.product_id)} ×${it.quantity_sold}`,
            )
            .slice(0, 3)
            .join(" · ");
          const customerName =
            transaction.customer_name || "Walk-in Customer";
          const isWalkIn = customerName.toLowerCase().includes("walk");
          const customerStats =
            insights.customerCounts.get(customerName.trim());
          const visitCount = customerStats?.count || 1;
          const isRepeat = !isWalkIn && visitCount > 1;
          const isVip = !isWalkIn && visitCount >= 5;
          const status = (
            transaction.payment_status || "paid"
          ).toLowerCase();
          const initials = customerName
            .split(/\s+/)
            .map((w) => w[0])
            .filter(Boolean)
            .slice(0, 2)
            .join("")
            .toUpperCase();
          return (
            <div
              key={transaction.transaction_id}
              className={`group relative bg-white dark:bg-slate-800 border rounded-2xl overflow-hidden transition-all ${
                isOpen
                  ? "border-amber-300 dark:border-amber-700 shadow-md ring-1 ring-amber-200/40"
                  : "border-slate-200 dark:border-slate-700 hover:border-amber-200 dark:hover:border-amber-800 hover:shadow-sm"
              }`}
            >
              {/* Left vertical accent stripe for repeat customers */}
              {isVip && (
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-amber-400 to-orange-500" />
              )}

              <div
                className="flex items-start gap-3 p-4 cursor-pointer"
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
                {/* Customer avatar */}
                <div
                  className={`flex-shrink-0 w-11 h-11 rounded-xl flex items-center justify-center font-black text-sm shadow-sm ${
                    isWalkIn
                      ? "bg-slate-100 dark:bg-slate-700 text-slate-500"
                      : isVip
                        ? "bg-gradient-to-br from-amber-400 to-orange-500 text-white"
                        : isRepeat
                          ? "bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-900/40 dark:to-orange-900/40 text-amber-700 dark:text-amber-300"
                          : "bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/40 dark:to-indigo-900/40 text-blue-700 dark:text-blue-300"
                  }`}
                  title={customerName}
                >
                  {isWalkIn ? <User className="w-5 h-5" /> : initials || "?"}
                </div>

                {/* Main info */}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      {/* Customer name + badges */}
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-base font-bold text-slate-900 dark:text-white truncate max-w-[200px]">
                          {customerName}
                        </span>
                        {isVip && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-gradient-to-r from-amber-400 to-orange-500 text-white shadow-sm">
                            <Crown className="w-2.5 h-2.5" />
                            VIP
                          </span>
                        )}
                        {isRepeat && !isVip && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300">
                            <Star className="w-2.5 h-2.5 fill-current" />
                            Repeat · {visitCount} visits
                          </span>
                        )}
                        <StatusPill status={status} />
                      </div>

                      {/* Meta line */}
                      <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-2.5 flex-wrap">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {formatDate(transaction.created_at)}
                        </span>
                        <span className="text-slate-300 dark:text-slate-600">
                          ·
                        </span>
                        <span className="flex items-center gap-1">
                          <CreditCard className="w-3 h-3" />
                          {transaction.payment_method}
                        </span>
                        <span className="text-slate-300 dark:text-slate-600">
                          ·
                        </span>
                        <span className="flex items-center gap-1">
                          <User className="w-3 h-3" />
                          {transaction.sold_by}
                        </span>
                        <span className="text-slate-300 dark:text-slate-600">
                          ·
                        </span>
                        <span className="font-mono text-[10px] text-slate-400">
                          #{transaction.transaction_id.slice(0, 8)}
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            copyToClipboard(transaction.transaction_id);
                          }}
                          title="Copy transaction id"
                          className="p-0.5 rounded text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors"
                        >
                          <Copy className="w-3 h-3" />
                        </button>
                        {copiedTx === transaction.transaction_id && (
                          <span className="text-[10px] font-bold text-emerald-600">
                            Copied!
                          </span>
                        )}
                      </div>

                      {/* Items preview */}
                      <div className="text-xs text-slate-600 dark:text-slate-400 mt-1.5 truncate flex items-center gap-1.5">
                        <ShoppingBag className="w-3 h-3 text-amber-500 flex-shrink-0" />
                        <span className="font-semibold text-slate-700 dark:text-slate-300">
                          {transaction.item_count}{" "}
                          {transaction.item_count === 1 ? "item" : "items"}:
                        </span>
                        <span className="truncate">
                          {preview}
                          {transaction.items.length > 3 &&
                            ` +${transaction.items.length - 3} more`}
                        </span>
                      </div>
                    </div>

                    <div className="text-left sm:text-right sm:ml-4 flex-shrink-0">
                      <div className="text-xl font-black text-slate-900 dark:text-white tabular-nums">
                        KES {transaction.total_amount.toLocaleString()}
                      </div>
                      <div className="flex sm:justify-end items-center gap-2 mt-0.5">
                        {transaction.total_discount > 0 && (
                          <span className="text-[11px] text-red-600 dark:text-red-400 font-semibold">
                            −{transaction.total_discount.toLocaleString()} disc
                          </span>
                        )}
                        <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
                          +{transaction.total_profit.toLocaleString()} profit
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex-shrink-0 flex items-center gap-1.5">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      openReceiptModal(transaction);
                    }}
                    className="w-9 h-9 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 flex items-center justify-center transition-colors"
                    title="View receipt"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      printReceipt(transaction);
                    }}
                    className="w-9 h-9 rounded-lg bg-amber-500 hover:bg-amber-600 text-white shadow-sm flex items-center justify-center transition-colors"
                    title="Print receipt"
                  >
                    <Printer className="w-4 h-4" />
                  </button>
                  <div
                    className={`hidden sm:flex w-7 h-7 rounded-lg items-center justify-center transition-colors ${
                      isOpen
                        ? "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400"
                        : "text-slate-400"
                    }`}
                  >
                    {isOpen ? (
                      <ChevronDown className="w-4 h-4" />
                    ) : (
                      <ChevronRight className="w-4 h-4" />
                    )}
                  </div>
                </div>
              </div>

              <Collapsible isOpen={isOpen}>
                <div
                  id={`tx-${transaction.transaction_id}`}
                  className="border-t border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/40 p-4"
                >
                  {/* Mobile stacked view */}
                  <div className="lg:hidden space-y-2">
                    {transaction.items.map((item) => {
                      const lineGross =
                        item.selling_price * item.quantity_sold;
                      const lineDiscount = Math.max(
                        item.discount_amount || 0,
                        lineGross - (item.total_sale || 0),
                      );
                      return (
                        <div
                          key={item.id}
                          className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0 flex-1">
                              <div className="font-medium text-sm truncate text-slate-900 dark:text-white">
                                {getProductName(item.product_id)}
                              </div>
                              <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                {item.quantity_sold} ×{" "}
                                {item.selling_price.toLocaleString()}
                                {lineDiscount > 0 && (
                                  <span className="text-red-600 dark:text-red-400 ml-2">
                                    − {lineDiscount.toLocaleString()}
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="text-sm font-bold text-slate-900 dark:text-white tabular-nums">
                              {item.total_sale.toLocaleString()}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Desktop table view */}
                  <div className="hidden lg:block">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-[11px] uppercase tracking-wider text-slate-500 dark:text-slate-400 font-semibold">
                          <th className="text-left py-2 px-3">Product</th>
                          <th className="text-right py-2 px-3 w-20">Qty</th>
                          <th className="text-right py-2 px-3 w-28">Unit</th>
                          <th className="text-right py-2 px-3 w-28">
                            Discount
                          </th>
                          <th className="text-right py-2 px-3 w-32">Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                        {transaction.items.map((item) => {
                          const lineGross =
                            item.selling_price * item.quantity_sold;
                          const lineDiscount = Math.max(
                            item.discount_amount || 0,
                            lineGross - (item.total_sale || 0),
                          );
                          return (
                            <tr
                              key={item.id}
                              className="text-slate-900 dark:text-white"
                            >
                              <td className="py-2.5 px-3">
                                <div className="flex items-center gap-2 min-w-0">
                                  <Package className="w-4 h-4 text-amber-500 flex-shrink-0" />
                                  <span className="font-medium truncate">
                                    {getProductName(item.product_id)}
                                  </span>
                                </div>
                              </td>
                              <td className="py-2.5 px-3 text-right tabular-nums">
                                {item.quantity_sold}
                              </td>
                              <td className="py-2.5 px-3 text-right tabular-nums text-slate-600 dark:text-slate-300">
                                {item.selling_price.toLocaleString()}
                              </td>
                              <td className="py-2.5 px-3 text-right tabular-nums text-red-600 dark:text-red-400">
                                {lineDiscount > 0
                                  ? `−${lineDiscount.toLocaleString()}`
                                  : "—"}
                              </td>
                              <td className="py-2.5 px-3 text-right tabular-nums font-semibold">
                                {item.total_sale.toLocaleString()}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                      <tfoot>
                        <tr className="border-t border-slate-200 dark:border-slate-700">
                          <td
                            colSpan={4}
                            className="pt-3 px-3 text-right text-slate-500 dark:text-slate-400 font-medium text-xs uppercase tracking-wider"
                          >
                            Total
                          </td>
                          <td className="pt-3 px-3 text-right font-bold text-base text-slate-900 dark:text-white tabular-nums">
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
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl">
          <div className="text-xs text-slate-500 dark:text-slate-400">
            Showing{" "}
            <span className="font-semibold text-slate-900 dark:text-white">
              {(currentPage - 1) * itemsPerPage + 1}
            </span>
            {" – "}
            <span className="font-semibold text-slate-900 dark:text-white">
              {Math.min(currentPage * itemsPerPage, filteredTransactions.length)}
            </span>
            {" of "}
            <span className="font-semibold text-slate-900 dark:text-white">
              {filteredTransactions.length.toLocaleString()}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={itemsPerPage}
              onChange={(e) => {
                setItemsPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="px-3 h-9 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white text-xs font-medium focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500"
            >
              <option value={10}>10 / page</option>
              <option value={20}>20 / page</option>
              <option value={50}>50 / page</option>
              <option value={100}>100 / page</option>
            </select>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-3 h-9 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-200 text-xs font-medium hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Previous
              </button>

              <span className="px-3 h-9 inline-flex items-center text-xs text-slate-600 dark:text-slate-300 font-semibold">
                {currentPage} / {totalPages}
              </span>

              <button
                onClick={() =>
                  setCurrentPage((p) => Math.min(totalPages, p + 1))
                }
                disabled={currentPage === totalPages}
                className="px-3 h-9 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-200 text-xs font-medium hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
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
                    onClick={() => printReceipt(selectedTransaction)}
                    className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white px-3 h-9 rounded-lg text-sm font-medium transition-colors"
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
                    className="inline-flex items-center gap-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 px-3 h-9 rounded-lg text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors"
                    title="Download receipt (open the file and use browser's Print to PDF)"
                  >
                    <Eye className="w-4 h-4" />
                    PDF
                  </button>

                  <button
                    onClick={closeReceiptModal}
                    className="w-9 h-9 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center justify-center transition-colors"
                    aria-label="Close"
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
                          Books · Stationery · Electronics — since 2025
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
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      Receipt{" "}
                      <span className="font-mono font-bold text-slate-900 dark:text-white">
                        #
                        {selectedTransaction.transaction_id
                          .slice(0, 8)
                          .toUpperCase()}
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
                        <tr className="bg-amber-50 dark:bg-amber-900/20 border-b-2 border-amber-500">
                          <th className="text-left py-2.5 px-3 text-[10px] uppercase tracking-wider font-bold text-amber-800 dark:text-amber-300 w-10">
                            #
                          </th>
                          <th className="text-left py-2.5 px-3 text-[10px] uppercase tracking-wider font-bold text-amber-800 dark:text-amber-300">
                            Product
                          </th>
                          <th className="text-right py-2.5 px-3 text-[10px] uppercase tracking-wider font-bold text-amber-800 dark:text-amber-300">
                            Qty
                          </th>
                          <th className="text-right py-2.5 px-3 text-[10px] uppercase tracking-wider font-bold text-amber-800 dark:text-amber-300">
                            Unit
                          </th>
                          <th className="text-right py-2.5 px-3 text-[10px] uppercase tracking-wider font-bold text-amber-800 dark:text-amber-300">
                            Discount
                          </th>
                          <th className="text-right py-2.5 px-3 text-[10px] uppercase tracking-wider font-bold text-amber-800 dark:text-amber-300">
                            Total
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedTransaction.items.map((item, idx) => {
                          const lineGross =
                            item.selling_price * item.quantity_sold;
                          const lineDiscount = Math.max(
                            item.discount_amount || 0,
                            lineGross - (item.total_sale || 0),
                          );
                          return (
                            <tr
                              key={item.id}
                              className="border-b border-slate-100 dark:border-slate-700 last:border-b-0"
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
                              <td className="py-3 px-3 text-right tabular-nums text-red-600 dark:text-red-400 font-semibold">
                                {lineDiscount > 0
                                  ? `−${lineDiscount.toLocaleString()}`
                                  : "—"}
                              </td>
                              <td className="py-3 px-3 text-right tabular-nums font-bold text-slate-900 dark:text-white">
                                {item.total_sale.toLocaleString()}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Totals */}
                  {(() => {
                    const subtotal = selectedTransaction.items.reduce(
                      (s, i) => s + i.selling_price * i.quantity_sold,
                      0,
                    );
                    const discount = Math.max(
                      selectedTransaction.total_discount || 0,
                      subtotal - selectedTransaction.total_amount,
                    );
                    return (
                      <div className="px-5 md:px-8 pb-5 pt-2 flex justify-end">
                        <div className="w-full sm:w-80 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden bg-white dark:bg-slate-800">
                          <div className="flex justify-between px-4 py-2.5 text-sm">
                            <span className="text-slate-500 dark:text-slate-400">
                              Subtotal
                            </span>
                            <span className="tabular-nums text-slate-900 dark:text-white font-semibold">
                              KES {subtotal.toLocaleString()}
                            </span>
                          </div>
                          {discount > 0 && (
                            <div className="flex justify-between px-4 py-2.5 text-sm border-t border-slate-100 dark:border-slate-700">
                              <span className="text-slate-500 dark:text-slate-400">
                                Discount
                              </span>
                              <span className="tabular-nums text-red-600 dark:text-red-400 font-semibold">
                                − KES {discount.toLocaleString()}
                              </span>
                            </div>
                          )}
                          <div className="flex justify-between px-4 py-3 bg-amber-50 dark:bg-amber-900/20 border-t-2 border-amber-500 font-extrabold">
                            <span className="text-amber-800 dark:text-amber-300">
                              Total
                            </span>
                            <span className="tabular-nums text-base text-amber-800 dark:text-amber-300">
                              KES{" "}
                              {selectedTransaction.total_amount.toLocaleString()}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })()}

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
                    <p className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-700/60 text-[10px] text-slate-400 dark:text-slate-500 tracking-wide">
                      Powered by{" "}
                      <a
                        href="https://lenzro.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-semibold text-amber-600 dark:text-amber-400 hover:underline"
                      >
                        Lenzro
                      </a>{" "}
                      · lenzro.com
                    </p>
                  </div>
                </div>
              </div>
              {/* end receipt content */}

              {/* Mobile footer actions */}
              <div className="md:hidden sticky bottom-0 left-0 right-0 p-3 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 flex gap-2">
                <button
                  onClick={() => printReceipt(selectedTransaction)}
                  className="flex-1 inline-flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-600 text-white h-10 rounded-lg text-sm font-medium transition-colors"
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
                  className="flex-1 inline-flex items-center justify-center gap-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 h-10 rounded-lg text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors"
                  title="Download receipt"
                >
                  <Eye className="w-4 h-4" />
                  PDF
                </button>

                <button
                  onClick={closeReceiptModal}
                  className="w-10 h-10 rounded-lg text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center justify-center transition-colors"
                  aria-label="Close"
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

function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  accent,
}: {
  label: string;
  value: string;
  hint: string;
  icon: React.ElementType;
  accent: "amber" | "emerald" | "blue";
}) {
  const tones = {
    amber: "bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400",
    emerald:
      "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400",
    blue: "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400",
  } as const;
  return (
    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 flex items-center justify-between gap-3">
      <div className="min-w-0">
        <div className="text-[11px] uppercase tracking-wider font-semibold text-slate-500 dark:text-slate-400">
          {label}
        </div>
        <div className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mt-0.5 tabular-nums truncate">
          {value}
        </div>
        <div className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5 truncate">
          {hint}
        </div>
      </div>
      <div
        className={`flex-shrink-0 w-11 h-11 rounded-xl flex items-center justify-center ${tones[accent]}`}
      >
        <Icon className="w-5 h-5" />
      </div>
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
