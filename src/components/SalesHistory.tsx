import { useMemo, useState } from "react";
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

export default function SalesHistory() {
  const { data: sales = [], refetch: refetchSales, isRefetching } = useSales();
  const { data: products = [] } = useProducts();
  const [expandedTransactions, setExpandedTransactions] = useState<Set<string>>(
    new Set()
  );

  // Group sales by transaction_id
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

    // Sort by date (newest first)
    return Array.from(groups.values()).sort((a, b) => {
      const dateA = new Date(a.created_at).getTime();
      const dateB = new Date(b.created_at).getTime();
      return dateB - dateA;
    });
  }, [sales]);

  const getProductName = (productId: string) => {
    const product = products.find((p) => p.id === productId);
    return product?.name || "Unknown Product";
  };

  const toggleExpand = (txId: string) => {
    setExpandedTransactions((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(txId)) {
        newSet.delete(txId);
      } else {
        newSet.add(txId);
      }
      return newSet;
    });
  };

  const printReceipt = (transaction: GroupedTransaction) => {
    const html = createPrintHtml(transaction);
    const $iframe = document.createElement("iframe");
    $iframe.style.position = "fixed";
    $iframe.style.right = "0";
    $iframe.style.bottom = "0";
    $iframe.style.width = "0";
    $iframe.style.height = "0";
    $iframe.style.border = "0";
    $iframe.setAttribute("aria-hidden", "true");
    document.body.appendChild($iframe);

    const cleanup = () => {
      try {
        document.body.removeChild($iframe);
      } catch {}
    };

    const onReadyToPrint = () => {
      try {
        const win = $iframe.contentWindow;
        if (!win) {
          cleanup();
          alert("Failed to access print frame.");
          return;
        }
        win.focus();
        win.print();
      } catch (e) {
        console.error("Print failed:", e);
        alert("Unable to print. Please try again.");
      } finally {
        setTimeout(cleanup, 500);
      }
    };

    const doc = $iframe.contentWindow?.document;
    if (!doc) {
      cleanup();
      alert("Failed to prepare print frame.");
      return;
    }

    let fired = false;
    const fireOnce = () => {
      if (fired) return;
      fired = true;
      onReadyToPrint();
    };

    $iframe.onload = fireOnce;
    $iframe.contentWindow?.addEventListener("load", fireOnce);

    doc.open();
    doc.write(html);
    doc.close();

    setTimeout(fireOnce, 300);
  };

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
<title>Receipt - AL KALAM BOOKSHOP</title>
<style>
  @page { size: A4; margin: 10mm; }
  html, body { height: 100%; }
  body {
    font-family: system-ui, -apple-system, "Segoe UI", Arial, sans-serif;
    color:#000; background:#fff; font-size:12px; line-height:1.35;
    margin:0; padding:0;
  }
  .header { text-align:center; }
  .header h1 { font-size:20px; margin:0 0 2px; letter-spacing:0.5px; }
  .header .sub { font-size:11px; color:#444; }
  .header .title { margin-top:4px; font-size:13px; font-weight:600; }
  .meta { width:100%; border-collapse:collapse; margin-top:10px; font-size:12px; }
  .meta td { padding:2px 0; vertical-align:top; }
  table.items { width:100%; border-collapse:collapse; margin-top:8px; }
  table.items th, table.items td { border:1px solid #222; padding:4px 6px; vertical-align:top; }
  table.items th { background:#f2f2f2; font-weight:600; font-size:11px; }
  .num { text-align:right; }
  tfoot td { font-weight:600; }
  .divider { margin:10px 0; border-top:1px solid #000; }
  .footnote { margin-top:12px; text-align:center; font-size:10px; color:#555; }
  .signature { margin-top:18px; display:flex; justify-content:space-between; gap:16px; }
  .sigbox { width:48%; border-top:1px solid #000; padding-top:4px; text-align:center; font-size:10px; }
  .mono { font-family: "SFMono-Regular", Menlo, Consolas, monospace; }
  .nowrap { white-space:nowrap; }
</style>
</head>
<body>
  <div class="header">
    <h1>AL KALAM BOOKSHOP</h1>
    <div class="sub">Quality Educational Materials & Supplies</div>
    <div class="sub">Tel: +254 722 740 432 Email: galiyowabi@gmail.com</div>
    <div class="title">Sales Receipt</div>
  </div>

  <table class="meta">
    <tbody>
      <tr>
        <td><strong>Transaction:</strong> ${transaction.transaction_id}</td>
        <td class="mono nowrap"><strong>Date:</strong> ${new Date(
          transaction.created_at
        ).toLocaleString()}</td>
      </tr>
      <tr>
        <td><strong>Sold By:</strong> ${escapeHtml(transaction.sold_by)}</td>
        <td><strong>Payment:</strong> ${escapeHtml(
          transaction.payment_method
        )}</td>
      </tr>
    </tbody>
  </table>

  <table class="items">
    <thead>
      <tr>
        <th style="text-align:left;">Product</th>
        <th class="num">Qty</th>
        <th class="num">Unit Price</th>
        <th class="num">Discount</th>
        <th class="num">Line Total</th>
      </tr>
    </thead>
    <tbody>
      ${rows}
    </tbody>
    <tfoot>
      <tr>
        <td colspan="4" style="text-align:right;">Subtotal</td>
        <td class="num">KES ${subtotal.toLocaleString()}</td>
      </tr>
      ${
        transaction.total_discount > 0
          ? `<tr>
        <td colspan="4" style="text-align:right;">Discount</td>
        <td class="num">-KES ${transaction.total_discount.toLocaleString()}</td>
      </tr>`
          : ""
      }
      <tr>
        <td colspan="4" style="text-align:right;">Total</td>
        <td class="num">KES ${transaction.total_amount.toLocaleString()}</td>
      </tr>
    </tfoot>
  </table>

  <div class="divider"></div>

  <div class="signature">
    <div class="sigbox">Customer Signature</div>
    <div class="sigbox">Staff Signature</div>
  </div>

  <div class="footnote">
    Thank you for your purchase. Please keep this receipt for your records.
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

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg sm:text-xl font-black text-white">
            Sales Records
          </h2>
          <p className="text-slate-300 mt-0.5 text-xs sm:text-sm">
            View and reprint receipts for all transactions (
            {groupedTransactions.length} transactions)
          </p>
        </div>
        <button
          onClick={() => refetchSales()}
          disabled={isRefetching}
          className="flex items-center justify-center space-x-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white px-4 py-2.5 rounded-xl hover:scale-105 transition-all duration-300 shadow-xl shadow-blue-500/25 hover:shadow-2xl hover:shadow-blue-500/40 font-bold text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          title="Refresh sales data"
        >
          <RefreshCw
            className={`w-4 h-4 ${isRefetching ? "animate-spin" : ""}`}
          />
          <span className="hidden sm:inline">Refresh</span>
        </button>
      </div>

      {/* Empty State */}
      {groupedTransactions.length === 0 && (
        <div className="bg-white/5 backdrop-blur-xl border border-white/20 rounded-2xl p-12 text-center">
          <Receipt className="w-16 h-16 text-slate-400 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-white mb-2">
            No Sales History Yet
          </h3>
          <p className="text-slate-400">
            Sales transactions will appear here once you make your first sale.
          </p>
        </div>
      )}

      {/* Transactions List */}
      <div className="space-y-3">
        {groupedTransactions.map((transaction) => {
          const isExpanded = expandedTransactions.has(
            transaction.transaction_id
          );

          return (
            <div
              key={transaction.transaction_id}
              className="bg-white/5 backdrop-blur-xl border border-white/20 rounded-2xl overflow-hidden hover:bg-white/10 transition-all duration-300"
            >
              {/* Transaction Summary - Clickable */}
              <button
                onClick={() => toggleExpand(transaction.transaction_id)}
                className="w-full p-4 sm:p-5 flex items-start gap-4 text-left hover:bg-white/5 transition-all"
              >
                {/* Expand Icon */}
                <div className="flex-shrink-0 mt-1">
                  {isExpanded ? (
                    <ChevronDown className="w-5 h-5 text-purple-400" />
                  ) : (
                    <ChevronRight className="w-5 h-5 text-slate-400" />
                  )}
                </div>

                {/* Transaction Info */}
                <div className="flex-1 min-w-0 space-y-3">
                  {/* Top Row */}
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="px-3 py-1 bg-purple-600/20 text-purple-300 rounded-lg text-xs font-bold border border-purple-500/30">
                          {transaction.item_count}{" "}
                          {transaction.item_count === 1 ? "Item" : "Items"}
                        </span>
                        <span className="text-xs text-slate-400 font-mono">
                          ID: {transaction.transaction_id.slice(0, 8)}...
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-slate-300">
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
                    </div>

                    {/* Amount */}
                    <div className="text-right">
                      <div className="text-xl sm:text-2xl font-black text-white">
                        KES {transaction.total_amount.toLocaleString()}
                      </div>
                      {transaction.total_discount > 0 && (
                        <div className="text-xs text-red-400">
                          Discount: KES{" "}
                          {transaction.total_discount.toLocaleString()}
                        </div>
                      )}
                      <div className="text-xs text-green-400">
                        Profit: KES {transaction.total_profit.toLocaleString()}
                      </div>
                    </div>
                  </div>

                  {/* Products Preview (when collapsed) */}
                  {!isExpanded && (
                    <div className="text-xs text-slate-400 truncate">
                      {transaction.items
                        .map(
                          (item) =>
                            `${getProductName(item.product_id)} (${
                              item.quantity_sold
                            })`
                        )
                        .join(", ")}
                    </div>
                  )}
                </div>

                {/* Print Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    printReceipt(transaction);
                  }}
                  className="flex-shrink-0 p-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all shadow-lg hover:scale-105"
                  title="Print Receipt"
                >
                  <Printer className="w-5 h-5" />
                </button>
              </button>

              {/* Expanded Details */}
              {isExpanded && (
                <div className="border-t border-white/10 bg-white/5">
                  <div className="p-4 sm:p-5 space-y-3">
                    {/* Items Table */}
                    <div className="overflow-x-auto -mx-4 sm:mx-0">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-white/10">
                            <th className="text-left py-2 px-3 text-slate-400 font-semibold">
                              Product
                            </th>
                            <th className="text-right py-2 px-3 text-slate-400 font-semibold">
                              Qty
                            </th>
                            <th className="text-right py-2 px-3 text-slate-400 font-semibold">
                              Price
                            </th>
                            <th className="text-right py-2 px-3 text-slate-400 font-semibold hidden sm:table-cell">
                              Discount
                            </th>
                            <th className="text-right py-2 px-3 text-slate-400 font-semibold">
                              Total
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                          {transaction.items.map((item) => (
                            <tr
                              key={item.id}
                              className="hover:bg-white/5 transition-colors"
                            >
                              <td className="py-3 px-3">
                                <div className="flex items-center gap-2">
                                  <Package className="w-4 h-4 text-purple-400 flex-shrink-0" />
                                  <span className="text-white font-medium">
                                    {getProductName(item.product_id)}
                                  </span>
                                </div>
                              </td>
                              <td className="py-3 px-3 text-right text-white">
                                {item.quantity_sold}
                              </td>
                              <td className="py-3 px-3 text-right text-white">
                                KES {item.selling_price.toLocaleString()}
                              </td>
                              <td className="py-3 px-3 text-right text-red-400 hidden sm:table-cell">
                                {item.discount_amount &&
                                item.discount_amount > 0
                                  ? `-KES ${item.discount_amount.toLocaleString()}`
                                  : "-"}
                              </td>
                              <td className="py-3 px-3 text-right text-white font-bold">
                                KES {item.total_sale.toLocaleString()}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot className="border-t border-white/20">
                          <tr>
                            <td
                              colSpan={4}
                              className="py-3 px-3 text-right text-slate-300 font-semibold"
                            >
                              Total
                            </td>
                            <td className="py-3 px-3 text-right text-white font-black text-lg">
                              KES {transaction.total_amount.toLocaleString()}
                            </td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
