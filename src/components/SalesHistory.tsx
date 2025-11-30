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
  Filter,
} from "lucide-react";
import { useSales, useProducts } from "../hooks/useSupabaseQuery";
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
  created_at: string;
}

/**
 * Mobile-first, highly responsive SalesHistory component.
 * Key UX decisions:
 * - Mobile-first layout: stacked controls, large touch targets, filtered sheet for compact screens.
 * - Desktop: two-column layout with filters + stats left, transactions list right.
 * - Receipt modal is full-screen on small screens and centered card on larger screens.
 * - Smooth collapses, accessible controls, and preserved print/open/copy features.
 *
 * Tailwind classes assume your project uses Tailwind CSS.
 */

export default function SalesHistory() {
  const { data: sales = [], refetch: refetchSales, isRefetching } = useSales();
  const { data: products = [] } = useProducts();

  // UI state
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [query, setQuery] = useState("");
  const [paymentFilter, setPaymentFilter] = useState<string>("all");
  const [sellerFilter, setSellerFilter] = useState<string>("all");
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");

  const [showFilters, setShowFilters] = useState(false); // mobile filter sheet

  // Receipt modal
  const [selectedTransaction, setSelectedTransaction] = useState<GroupedTransaction | null>(null);
  const [showReceiptModal, setShowReceiptModal] = useState(false);

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

    return Array.from(groups.values()).sort((a, b) => {
      const dateA = new Date(a.created_at).getTime();
      const dateB = new Date(b.created_at).getTime();
      return dateB - dateA;
    });
  }, [sales]);

  // Derived filter options
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

  // Filter logic
  const filteredTransactions = useMemo(() => {
    return groupedTransactions.filter((tx) => {
      const txTime = new Date(tx.created_at).getTime();
      if (dateFrom) {
        const fromTime = new Date(dateFrom).getTime();
        if (!isNaN(fromTime) && txTime < fromTime) return false;
      }
      if (dateTo) {
        const toTime = new Date(dateTo).getTime();
        if (!isNaN(toTime) && txTime > toTime + 86400000 - 1) return false;
      }
      if (paymentFilter !== "all" && tx.payment_method !== paymentFilter) return false;
      if (sellerFilter !== "all" && tx.sold_by !== sellerFilter) return false;
      if (query.trim()) {
        const q = query.trim().toLowerCase();
        if (tx.transaction_id.toLowerCase().includes(q)) return true;
        if (tx.sold_by.toLowerCase().includes(q)) return true;
        if (tx.items.some((it) => getProductName(it.product_id).toLowerCase().includes(q))) return true;
        return false;
      }
      return true;
    });
  }, [groupedTransactions, query, paymentFilter, sellerFilter, dateFrom, dateTo]);

  const totals = useMemo(() => {
    const revenue = filteredTransactions.reduce((s, t) => s + (t.total_amount || 0), 0);
    const profit = filteredTransactions.reduce((s, t) => s + (t.total_profit || 0), 0);
    const discounts = filteredTransactions.reduce((s, t) => s + (t.total_discount || 0), 0);
    return {
      revenue,
      profit,
      discounts,
      transactions: filteredTransactions.length,
      items: filteredTransactions.reduce((s, t) => s + t.item_count, 0),
    };
  }, [filteredTransactions]);

  const getProductName = (productId: string) => {
    const product = products.find((p) => p.id === productId);
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

  // clipboard copy feedback
  const [copiedTx, setCopiedTx] = useState<string | null>(null);
  useEffect(() => {
    if (!copiedTx) return;
    const t = setTimeout(() => setCopiedTx(null), 1400);
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

  // print / open receipt
  const printReceipt = (transaction: GroupedTransaction) => {
    try {
      const html = createPrintHtml(transaction);
      const w = window.open("", "_blank", "noopener,noreferrer");
      if (!w) {
        alert("Popups blocked. Please allow popups to print.");
        return;
      }
      w.document.open();
      w.document.write(html);
      w.document.close();
      w.focus();
      setTimeout(() => {
        try {
          w.print();
        } catch {
          alert("Use your browser's print dialog to print.");
        }
      }, 300);
    } catch {
      alert("Failed to prepare receipt for printing.");
    }
  };

  // receipt modal control
  const openReceiptModal = (transaction: GroupedTransaction) => {
    setSelectedTransaction(transaction);
    setShowReceiptModal(true);
    document.body.style.overflow = "hidden";
  };
  const closeReceiptModal = () => {
    setShowReceiptModal(false);
    setSelectedTransaction(null);
    document.body.style.overflow = "";
  };

  // print HTML (keeps white background for readability)
  function createPrintHtml(transaction: GroupedTransaction) {
    const rows = transaction.items
      .map(
        (item) => `
      <tr>
        <td>${escapeHtml(getProductName(item.product_id))}</td>
        <td class="num">${item.quantity_sold}</td>
        <td class="num">KES ${item.selling_price.toLocaleString()}</td>
        <td class="num">${
          item.discount_amount && item.discount_amount > 0 ? "-KES " + item.discount_amount.toLocaleString() : "-"
        }</td>
        <td class="num">KES ${item.total_sale.toLocaleString()}</td>
      </tr>`
      )
      .join("");
    const subtotal = transaction.items.reduce((sum, item) => sum + item.selling_price * item.quantity_sold, 0);
    return `<!doctype html><html><head><meta charset="utf-8"><title>Receipt</title><meta name="viewport" content="width=device-width,initial-scale=1"><style>
      body{font-family:system-ui,-apple-system,Segoe UI,Arial,sans-serif;color:#111;background:#fff;padding:18px}
      table{width:100%;border-collapse:collapse}
      th,td{padding:8px;border:1px solid #222}
      thead th{background:#f5f5f5}
      .num{text-align:right}
    </style></head><body>
      <h2>AL KALAM BOOKSHOP</h2>
      <div>Transaction: ${transaction.transaction_id}</div>
      <div>Date: ${new Date(transaction.created_at).toLocaleString()}</div>
      <table><thead><tr><th>Product</th><th class="num">Qty</th><th class="num">Unit</th><th class="num">Disc</th><th class="num">Line</th></tr></thead><tbody>${rows}</tbody>
      <tfoot><tr><td colspan="4" class="num">Subtotal</td><td class="num">KES ${subtotal.toLocaleString()}</td></tr>
      ${transaction.total_discount > 0 ? `<tr><td colspan="4" class="num">Discount</td><td class="num">-KES ${transaction.total_discount.toLocaleString()}</td></tr>` : ""}
      <tr><td colspan="4" class="num">Total</td><td class="num">KES ${transaction.total_amount.toLocaleString()}</td></tr></tfoot></table>
    </body></html>`;
  }

  function escapeHtml(str: string) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  // Skeleton for loading
  const SkeletonCard = () => (
    <div className="animate-pulse bg-white/5 rounded-2xl p-4">
      <div className="h-4 w-1/2 bg-white/8 rounded mb-3" />
      <div className="h-10 bg-white/6 rounded" />
    </div>
  );

  // Collapsible helper (simple, mobile-friendly)
  const Collapsible: React.FC<{ isOpen: boolean; children: React.ReactNode }> = ({ isOpen, children }) => {
    const ref = useRef<HTMLDivElement | null>(null);
    const [height, setHeight] = useState<number | "auto">(0);
    useEffect(() => {
      if (!ref.current) return;
      const el = ref.current;
      if (isOpen) {
        const sh = el.scrollHeight;
        setHeight(sh);
        const t = setTimeout(() => setHeight("auto"), 240);
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
          overflow: "hidden",
          transition: "height 240ms cubic-bezier(.2,.9,.2,1)",
        }}
        aria-hidden={!isOpen}
      >
        {children}
      </div>
    );
  };

  // ---------- Render ----------
  return (
    <div className="space-y-4 text-slate-900">
      {/* Header - mobile first: stacked */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold">Sales Records</h2>
            <p className="text-sm text-slate-600 mt-0.5">Search, preview and reprint receipts.</p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => refetchSales()}
              disabled={isRefetching}
              className="px-3 py-2 rounded-lg bg-blue-600 text-white text-sm flex items-center gap-2 touch-manipulation"
              aria-label="Refresh sales"
            >
              <RefreshCw className={`w-4 h-4 ${isRefetching ? "animate-spin" : ""}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>

            <button
              onClick={() => setShowFilters((s) => !s)}
              className="p-2 rounded-lg bg-white/5 text-slate-700 sm:hidden"
              aria-expanded={showFilters}
              aria-controls="mobile-filters"
              title="Filters"
            >
              <Filter className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search product, tx id or seller"
              className="w-full pl-10 pr-3 py-2 rounded-lg border border-white/10 bg-white/2 text-sm"
              aria-label="Search transactions"
            />
            {query && (
              <button
                onClick={() => setQuery("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1"
                title="Clear"
              >
                <XCircle className="w-4 h-4 text-slate-500" />
              </button>
            )}
          </div>

          {/* Desktop filters visible inline */}
          <div className="hidden sm:flex items-center gap-2">
            <select value={paymentFilter} onChange={(e) => setPaymentFilter(e.target.value)} className="px-3 py-2 rounded-lg border bg-white/2 text-sm">
              <option value="all">All Payments</option>
              {availablePayments.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
            <select value={sellerFilter} onChange={(e) => setSellerFilter(e.target.value)} className="px-3 py-2 rounded-lg border bg-white/2 text-sm">
              <option value="all">All Sellers</option>
              {availableSellers.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Mobile filter sheet */}
        {showFilters && (
          <div id="mobile-filters" className="sm:hidden bg-white rounded-lg p-3 border border-white/10 space-y-3">
            <div className="flex gap-2">
              <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="flex-1 px-3 py-2 rounded-lg border text-sm" />
              <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="flex-1 px-3 py-2 rounded-lg border text-sm" />
            </div>
            <div className="flex gap-2">
              <select value={paymentFilter} onChange={(e) => setPaymentFilter(e.target.value)} className="flex-1 px-3 py-2 rounded-lg border text-sm">
                <option value="all">All Payments</option>
                {availablePayments.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
              <select value={sellerFilter} onChange={(e) => setSellerFilter(e.target.value)} className="flex-1 px-3 py-2 rounded-lg border text-sm">
                <option value="all">All Sellers</option>
                {availableSellers.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex justify-end gap-2">
              <button onClick={() => setShowFilters(false)} className="px-3 py-2 rounded-lg border">Close</button>
            </div>
          </div>
        )}
      </div>

      {/* Stats - mobile: stacked, desktop: grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-3 rounded-lg bg-white shadow-sm border">
          <div className="text-xs text-slate-500">Transactions</div>
          <div className="text-lg font-bold">{totals.transactions}</div>
          <div className="text-xs text-slate-500">Items: {totals.items}</div>
        </div>
        <div className="p-3 rounded-lg bg-white shadow-sm border">
          <div className="text-xs text-slate-500">Revenue</div>
          <div className="text-lg font-bold">KES {totals.revenue.toLocaleString()}</div>
          <div className="text-xs text-slate-500">Discounts: KES {totals.discounts.toLocaleString()}</div>
        </div>
        <div className="p-3 rounded-lg bg-white shadow-sm border">
          <div className="text-xs text-slate-500">Profit</div>
          <div className="text-lg font-bold">KES {totals.profit.toLocaleString()}</div>
        </div>
      </div>

      {/* List / Empty */}
      {filteredTransactions.length === 0 ? (
        isRefetching ? (
          <div className="space-y-2">
            <SkeletonCard />
            <SkeletonCard />
          </div>
        ) : (
          <div className="p-6 rounded-lg border text-center bg-white/2">
            <Receipt className="mx-auto w-10 h-10 text-slate-500" />
            <div className="mt-2 font-semibold">No transactions</div>
            <div className="text-sm text-slate-500 mt-1">Try changing filters or refresh</div>
          </div>
        )
      ) : (
        <div className="space-y-3">
          {filteredTransactions.map((transaction) => {
            const isOpen = expanded.has(transaction.transaction_id);
            const preview = transaction.items.map((it) => `${getProductName(it.product_id)} (${it.quantity_sold})`).slice(0, 3).join(", ");
            return (
              <article key={transaction.transaction_id} className="bg-white rounded-lg border shadow-sm overflow-hidden">
                <header
                  className="flex items-start gap-3 p-3"
                  role="button"
                  tabIndex={0}
                  onClick={() => toggleExpand(transaction.transaction_id)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") toggleExpand(transaction.transaction_id);
                  }}
                  aria-expanded={isOpen}
                >
                  <div className="flex-shrink-0 mt-1">
                    <div className={`p-2 rounded-md ${isOpen ? "bg-indigo-100" : "bg-white/3"}`}>
                      {isOpen ? <ChevronDown className="w-5 h-5 text-indigo-600" /> : <ChevronRight className="w-5 h-5 text-slate-500" />}
                    </div>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="px-2 py-1 rounded text-xs bg-indigo-50 text-indigo-700 border"> {transaction.item_count} items </span>
                          <div className="text-xs text-slate-600 font-mono truncate">ID: {transaction.transaction_id.slice(0, 8)}...</div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              copyToClipboard(transaction.transaction_id);
                            }}
                            title="Copy tx id"
                            className="ml-2 p-1"
                          >
                            <Copy className="w-4 h-4 text-slate-500" />
                          </button>
                          {copiedTx === transaction.transaction_id && <span className="ml-1 text-xs text-emerald-600">Copied</span>}
                        </div>

                        <div className="mt-2 text-sm text-slate-600 flex gap-3 flex-wrap">
                          <span className="flex items-center gap-1"><Calendar className="w-4 h-4" />{formatDate(transaction.created_at)}</span>
                          <span className="flex items-center gap-1"><User className="w-4 h-4" />{transaction.sold_by}</span>
                          <span className="flex items-center gap-1"><CreditCard className="w-4 h-4" />{transaction.payment_method}</span>
                        </div>

                        <div className="mt-2 text-sm text-slate-500 truncate">{preview}</div>
                      </div>

                      <div className="text-right ml-2">
                        <div className="font-bold">KES {transaction.total_amount.toLocaleString()}</div>
                        <div className="text-xs text-slate-500">Profit: KES {transaction.total_profit.toLocaleString()}</div>
                      </div>
                    </div>
                  </div>

                  <div className="flex-shrink-0 flex items-center gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        openReceiptModal(transaction);
                      }}
                      className="p-2 rounded-md bg-white/3"
                      aria-label="View receipt"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        printReceipt(transaction);
                      }}
                      className="px-3 py-2 rounded-md bg-emerald-600 text-white"
                      aria-label="Print receipt"
                    >
                      <Printer className="w-4 h-4" />
                    </button>
                  </div>
                </header>

                <Collapsible isOpen={isOpen}>
                  <div className="p-3 border-t">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="text-slate-600">
                            <th className="text-left py-2">Product</th>
                            <th className="text-right py-2">Qty</th>
                            <th className="text-right py-2">Price</th>
                            <th className="text-right py-2 hidden sm:table-cell">Discount</th>
                            <th className="text-right py-2">Total</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y">
                          {transaction.items.map((item) => (
                            <tr key={item.id} className="odd:bg-white/50">
                              <td className="py-2">{getProductName(item.product_id)}</td>
                              <td className="py-2 text-right">{item.quantity_sold}</td>
                              <td className="py-2 text-right">KES {item.selling_price.toLocaleString()}</td>
                              <td className="py-2 text-right hidden sm:table-cell">{item.discount_amount && item.discount_amount > 0 ? `-KES ${item.discount_amount.toLocaleString()}` : "-"}</td>
                              <td className="py-2 text-right font-semibold">KES {item.total_sale.toLocaleString()}</td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot>
                          <tr className="border-t">
                            <td colSpan={4} className="py-2 text-right text-sm">Total</td>
                            <td className="py-2 text-right font-bold">KES {transaction.total_amount.toLocaleString()}</td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </div>
                </Collapsible>
              </article>
            );
          })}
        </div>
      )}

      {/* Receipt Modal - full screen on mobile, centered card on larger screens */}
      {showReceiptModal && selectedTransaction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* backdrop */}
          <div className="absolute inset-0 bg-black/50" onClick={closeReceiptModal} />

          <div className="relative w-full h-full sm:h-auto sm:max-w-3xl mx-0 sm:mx-auto sm:my-8 overflow-auto">
            <div className="bg-white h-full sm:rounded-xl sm:shadow-xl flex flex-col">
              {/* header */}
              <div className="flex items-center justify-between p-4 border-b">
                <div className="flex items-center gap-3">
                  <Receipt className="w-5 h-5 text-slate-800" />
                  <div>
                    <div className="font-semibold">Sales Receipt</div>
                    <div className="text-xs text-slate-500">Transaction {selectedTransaction.transaction_id.slice(0, 10)}</div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => printReceipt(selectedTransaction)}
                    className="px-3 py-2 rounded-md bg-emerald-600 text-white text-sm"
                  >
                    <Printer className="w-4 h-4 inline-block" /> Print
                  </button>
                  <button onClick={closeReceiptModal} className="p-2 rounded-md bg-white/50">
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* body */}
              <div className="p-4 overflow-auto">
                <div className="max-w-[920px] mx-auto">
                  <div className="text-center mb-4">
                    <h3 className="text-lg font-bold">AL KALAM BOOKSHOP</h3>
                    <div className="text-xs text-slate-600">Quality Educational Materials & Supplies</div>
                    <div className="text-xs text-slate-600">Tel: +254 722 740 432 • galiyowabi@gmail.com</div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4 text-sm">
                    <div>
                      <div className="text-xs text-slate-500">Transaction</div>
                      <div className="font-medium break-words">{selectedTransaction.transaction_id}</div>
                    </div>
                    <div className="text-left sm:text-right">
                      <div className="text-xs text-slate-500">Date</div>
                      <div className="font-medium">{new Date(selectedTransaction.created_at).toLocaleString()}</div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-500">Sold By</div>
                      <div className="font-medium">{selectedTransaction.sold_by}</div>
                    </div>
                    <div className="text-left sm:text-right">
                      <div className="text-xs text-slate-500">Payment</div>
                      <div className="font-medium">{selectedTransaction.payment_method}</div>
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-slate-600">
                          <th className="text-left py-2">Product</th>
                          <th className="text-right py-2">Qty</th>
                          <th className="text-right py-2">Unit</th>
                          <th className="text-right py-2">Discount</th>
                          <th className="text-right py-2">Line</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedTransaction.items.map((item) => (
                          <tr key={item.id}>
                            <td className="py-2">{getProductName(item.product_id)}</td>
                            <td className="py-2 text-right">{item.quantity_sold}</td>
                            <td className="py-2 text-right">KES {item.selling_price.toLocaleString()}</td>
                            <td className="py-2 text-right">{item.discount_amount && item.discount_amount > 0 ? `-KES ${item.discount_amount.toLocaleString()}` : "-"}</td>
                            <td className="py-2 text-right font-semibold">KES {item.total_sale.toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr className="border-t">
                          <td colSpan={4} className="py-2 text-right text-sm">Total</td>
                          <td className="py-2 text-right font-bold">KES {selectedTransaction.total_amount.toLocaleString()}</td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>

                  <div className="mt-6 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                    <div>
                      <div className="text-xs text-slate-500">Notes</div>
                      <div className="text-sm text-slate-700">Thank you for your purchase. Keep this receipt for returns.</div>
                    </div>
                    <div className="w-full sm:w-64">
                      <div className="text-xs text-slate-500">Signatures</div>
                      <div className="flex gap-2 mt-3">
                        <div className="flex-1 border-t pt-2 text-center text-xs">Customer</div>
                        <div className="flex-1 border-t pt-2 text-center text-xs">Staff</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* footer (mobile-friendly) */}
              <div className="p-3 border-t flex items-center justify-between gap-2">
                <div className="text-sm text-slate-600">Transaction total</div>
                <div className="font-bold">KES {selectedTransaction.total_amount.toLocaleString()}</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}