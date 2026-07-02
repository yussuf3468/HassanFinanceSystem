import { useMemo, useState } from "react";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Package,
  Plus,
  Receipt,
  RefreshCw,
  Search,
  Trash2,
} from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { deleteSaleById, getSaleForDelete, restoreProductStock } from "../api";
import POSSaleForm from "./POSSaleForm";
import ConfirmDialog from "./ui/ConfirmDialog";
import compactToast from "../utils/compactToast";
import { formatDate } from "../utils/dateFormatter";
import { useProducts, useSales } from "../hooks/useSupabaseQuery";
import { invalidateAfterSale } from "../utils/cacheInvalidation";

/* ═══════════════════════════════════════════════════════════════
   SALES — the daily heartbeat of the shop. KPI pulse up top,
   instant search & filters, a calm readable ledger (table on
   desktop, cards on mobile), and safe deletion with stock
   restore. All data flows are unchanged.
   ═══════════════════════════════════════════════════════════════ */

type DateRange = "today" | "7d" | "30d" | "all";

const DATE_RANGES: Array<{ key: DateRange; label: string }> = [
  { key: "today", label: "Today" },
  { key: "7d", label: "7 days" },
  { key: "30d", label: "30 days" },
  { key: "all", label: "All time" },
];

const PAYMENT_CHIP_CLASSES: Record<string, string> = {
  mpesa:
    "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
  cash: "bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
  card: "bg-sky-50 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300",
  bank_transfer:
    "bg-violet-50 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300",
};

function paymentChipClass(method: string) {
  return (
    PAYMENT_CHIP_CLASSES[method?.toLowerCase?.() ?? ""] ??
    "bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-200"
  );
}

function formatPayment(method: string) {
  if (!method) return "—";
  return method
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

const money = (value: number) => `KES ${Math.round(value).toLocaleString()}`;

export default function Sales() {
  const queryClient = useQueryClient();
  const { data: sales = [], refetch: refetchSales, isRefetching } = useSales();
  const { data: products = [] } = useProducts();
  const [showForm, setShowForm] = useState(false);

  const [searchTerm, setSearchTerm] = useState("");
  const [paymentFilter, setPaymentFilter] = useState<string>("all");
  const [dateRange, setDateRange] = useState<DateRange>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(50);
  const [pendingDelete, setPendingDelete] = useState<{
    saleId: string;
    productName: string;
  } | null>(null);
  const [deleting, setDeleting] = useState(false);

  const productById = useMemo(() => {
    const map = new Map<string, (typeof products)[number]>();
    for (const product of products) map.set(product.id, product);
    return map;
  }, [products]);

  const saleTime = (sale: any) => {
    const raw = sale?.sale_date || sale?.created_at;
    const time = raw ? new Date(raw).getTime() : 0;
    return Number.isFinite(time) ? time : 0;
  };

  // Newest first, stable when timestamps collide.
  const sortedSales = useMemo(
    () =>
      [...sales].sort((a: any, b: any) => {
        const diff = saleTime(b) - saleTime(a);
        if (diff !== 0) return diff;
        return String(b?.id ?? "").localeCompare(String(a?.id ?? ""));
      }),
    [sales],
  );

  const paymentMethods = useMemo(() => {
    const set = new Set<string>();
    for (const sale of sales) {
      if (sale?.payment_method) set.add(String(sale.payment_method));
    }
    return [...set].sort();
  }, [sales]);

  const filteredSales = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    const now = Date.now();
    const startOfToday = new Date().setHours(0, 0, 0, 0);
    const rangeStart =
      dateRange === "today"
        ? startOfToday
        : dateRange === "7d"
          ? now - 7 * 24 * 60 * 60 * 1000
          : dateRange === "30d"
            ? now - 30 * 24 * 60 * 60 * 1000
            : 0;

    return sortedSales.filter((sale: any) => {
      if (rangeStart && saleTime(sale) < rangeStart) return false;
      if (
        paymentFilter !== "all" &&
        String(sale.payment_method) !== paymentFilter
      )
        return false;
      if (!query) return true;
      const product = productById.get(sale.product_id);
      return (
        (product?.name ?? "").toLowerCase().includes(query) ||
        (product?.product_id ?? "").toLowerCase().includes(query) ||
        String(sale.sold_by ?? "")
          .toLowerCase()
          .includes(query)
      );
    });
  }, [sortedSales, searchTerm, paymentFilter, dateRange, productById]);

  const stats = useMemo(() => {
    const startOfToday = new Date().setHours(0, 0, 0, 0);
    let todayRevenue = 0;
    let todayProfit = 0;
    let todayCount = 0;
    let rangeRevenue = 0;
    let rangeProfit = 0;

    for (const sale of sales as any[]) {
      if (saleTime(sale) >= startOfToday) {
        todayRevenue += sale.total_sale ?? 0;
        todayProfit += sale.profit ?? 0;
        todayCount += 1;
      }
    }
    for (const sale of filteredSales as any[]) {
      rangeRevenue += sale.total_sale ?? 0;
      rangeProfit += sale.profit ?? 0;
    }

    return { todayRevenue, todayProfit, todayCount, rangeRevenue, rangeProfit };
  }, [sales, filteredSales]);

  const totalPages = Math.max(1, Math.ceil(filteredSales.length / itemsPerPage));
  const safePage = Math.min(currentPage, totalPages);
  const paginatedSales = useMemo(() => {
    const start = (safePage - 1) * itemsPerPage;
    return filteredSales.slice(start, start + itemsPerPage);
  }, [filteredSales, safePage, itemsPerPage]);

  function resetToFirstPage() {
    setCurrentPage(1);
  }

  async function handleFormSuccess() {
    setShowForm(false);
    refetchSales();
  }

  async function confirmDelete() {
    if (!pendingDelete) return;
    setDeleting(true);
    try {
      const saleData = await getSaleForDelete(pendingDelete.saleId);
      await deleteSaleById(pendingDelete.saleId);

      const product = productById.get(saleData.product_id);
      if (product) {
        const restoredStock = product.quantity_in_stock + saleData.quantity_sold;
        try {
          await restoreProductStock(saleData.product_id, restoredStock);
        } catch (stockError) {
          console.error("Error restoring stock:", stockError);
          compactToast.error(
            `Sale deleted but stock restore failed — update "${product.name}" manually`,
          );
        }
      }

      await invalidateAfterSale(queryClient);
      compactToast.success("Sale deleted and stock restored");
      refetchSales();
    } catch (error) {
      console.error("Error deleting sale:", error);
      compactToast.error("Failed to delete sale record. Please try again.");
    } finally {
      setDeleting(false);
      setPendingDelete(null);
    }
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-xl font-black tracking-tight text-slate-900 dark:text-white sm:text-2xl">
            Sales
          </h2>
          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400 sm:text-sm">
            {sales.length.toLocaleString()} records · today{" "}
            <span className="font-semibold text-slate-700 dark:text-slate-200">
              {money(stats.todayRevenue)}
            </span>{" "}
            ·{" "}
            <span className="font-semibold text-emerald-600 dark:text-emerald-400">
              +{money(stats.todayProfit)}
            </span>{" "}
            profit
          </p>
        </div>
        <div className="flex w-full gap-2 sm:w-auto">
          <button
            onClick={() => refetchSales()}
            disabled={isRefetching}
            title="Refresh sales data"
            className="inline-flex h-11 items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
          >
            <RefreshCw className={`h-4 w-4 ${isRefetching ? "animate-spin" : ""}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 px-5 text-sm font-semibold text-white shadow-lg shadow-amber-500/25 transition hover:-translate-y-0.5 hover:shadow-xl hover:shadow-amber-500/30 sm:flex-initial"
          >
            <Plus className="h-4 w-4" />
            Record sale
          </button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-3 shadow-sm dark:border-slate-700/80 dark:bg-slate-800 sm:p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={searchTerm}
              onChange={(event) => {
                setSearchTerm(event.target.value);
                resetToFirstPage();
              }}
              placeholder="Search product, code, or staff…"
              className="h-11 w-full rounded-full border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm text-slate-900 outline-none transition focus:border-amber-400 focus:ring-2 focus:ring-amber-500/20 dark:border-slate-600 dark:bg-slate-900 dark:text-white"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Date range segmented control */}
            <div className="flex rounded-full bg-slate-100 p-1 dark:bg-slate-900">
              {DATE_RANGES.map((range) => (
                <button
                  key={range.key}
                  onClick={() => {
                    setDateRange(range.key);
                    resetToFirstPage();
                  }}
                  className={`h-9 rounded-full px-3.5 text-xs font-semibold transition sm:text-[13px] ${
                    dateRange === range.key
                      ? "bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-white"
                      : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
                  }`}
                >
                  {range.label}
                </button>
              ))}
            </div>

            {paymentMethods.length > 1 && (
              <select
                value={paymentFilter}
                onChange={(event) => {
                  setPaymentFilter(event.target.value);
                  resetToFirstPage();
                }}
                className="h-11 rounded-full border border-slate-200 bg-slate-50 px-4 text-sm font-medium text-slate-700 outline-none transition focus:border-amber-400 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200"
              >
                <option value="all">All payments</option>
                {paymentMethods.map((method) => (
                  <option key={method} value={method}>
                    {formatPayment(method)}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>

        {(searchTerm || paymentFilter !== "all" || dateRange !== "all") && (
          <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
            {filteredSales.length.toLocaleString()}{" "}
            {filteredSales.length === 1 ? "sale" : "sales"} ·{" "}
            <span className="font-semibold text-slate-700 dark:text-slate-200">
              {money(stats.rangeRevenue)}
            </span>{" "}
            revenue ·{" "}
            <span className="font-semibold text-emerald-600 dark:text-emerald-400">
              {money(stats.rangeProfit)}
            </span>{" "}
            profit in this view
          </p>
        )}
      </div>

      {/* Empty state */}
      {filteredSales.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center dark:border-slate-700 dark:bg-slate-800">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-100 dark:bg-amber-900/30">
            <Receipt className="h-6 w-6 text-amber-600 dark:text-amber-400" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">
            {sales.length === 0 ? "No sales yet" : "Nothing matches this view"}
          </h3>
          <p className="mx-auto mt-1 max-w-sm text-sm text-slate-500 dark:text-slate-400">
            {sales.length === 0
              ? "Record your first sale and it will appear here instantly."
              : "Try a different search, payment method, or date range."}
          </p>
          {sales.length === 0 && (
            <button
              onClick={() => setShowForm(true)}
              className="mt-5 inline-flex h-11 items-center gap-2 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 px-6 text-sm font-semibold text-white shadow-lg shadow-amber-500/25 transition hover:-translate-y-0.5"
            >
              <Plus className="h-4 w-4" />
              Record sale
            </button>
          )}
        </div>
      ) : (
        <>
          {/* Mobile: cards */}
          <div className="space-y-3 lg:hidden">
            {paginatedSales.map((sale: any) => {
              const product = productById.get(sale.product_id);
              return (
                <div
                  key={sale.id}
                  className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm dark:border-slate-700/80 dark:bg-slate-800"
                >
                  <div className="flex items-start gap-3">
                    {product?.image_url ? (
                      <img
                        src={product.image_url}
                        alt={product.name}
                        className="h-12 w-12 shrink-0 rounded-xl border border-slate-200 object-cover dark:border-slate-600"
                        loading="lazy"
                      />
                    ) : (
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-700">
                        <Package className="h-5 w-5 text-slate-400" />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold text-slate-900 dark:text-white">
                        {product?.name || "Unknown product"}
                      </p>
                      <p className="mt-0.5 flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                        <CalendarDays className="h-3 w-3" />
                        {formatDate(sale.created_at)} ·{" "}
                        {new Date(sale.created_at).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                    <button
                      onClick={() =>
                        setPendingDelete({
                          saleId: sale.id,
                          productName: product?.name || "Unknown Product",
                        })
                      }
                      title="Tirtir Iibkan - Delete Sale"
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-slate-400 transition hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-900/30"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600 dark:bg-slate-700 dark:text-slate-300">
                        × {sale.quantity_sold}
                      </span>
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-semibold ${paymentChipClass(sale.payment_method)}`}
                      >
                        {formatPayment(sale.payment_method)}
                      </span>
                    </div>
                    <div className="text-right">
                      <p className="text-base font-black tabular-nums text-slate-900 dark:text-white">
                        {money(sale.total_sale)}
                      </p>
                      <p className="text-xs font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">
                        +{money(sale.profit)} profit
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Desktop: ledger table */}
          <div className="hidden overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm dark:border-slate-700/80 dark:bg-slate-800 lg:block">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/80 dark:border-slate-700 dark:bg-slate-900/40">
                  {["Date", "Product", "Qty", "Total", "Profit", "Payment", "Sold by", ""].map(
                    (header) => (
                      <th
                        key={header}
                        className="px-5 py-3.5 text-left text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400"
                      >
                        {header}
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/70">
                {paginatedSales.map((sale: any) => {
                  const product = productById.get(sale.product_id);
                  return (
                    <tr
                      key={sale.id}
                      className="group transition-colors hover:bg-amber-50/40 dark:hover:bg-slate-700/40"
                    >
                      <td className="whitespace-nowrap px-5 py-3.5 text-sm text-slate-700 dark:text-slate-300">
                        {formatDate(sale.created_at)}
                        <span className="block text-xs text-slate-400 dark:text-slate-500">
                          {new Date(sale.created_at).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          {product?.image_url ? (
                            <img
                              src={product.image_url}
                              alt={product.name}
                              className="h-10 w-10 rounded-xl border border-slate-200 object-cover dark:border-slate-600"
                              loading="lazy"
                            />
                          ) : (
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-700">
                              <Package className="h-4 w-4 text-slate-400" />
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="max-w-[260px] truncate text-sm font-semibold text-slate-900 dark:text-white">
                              {product?.name || "Unknown"}
                            </p>
                            <p className="text-xs text-slate-400 dark:text-slate-500">
                              {product?.product_id || "—"}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-sm font-semibold tabular-nums text-slate-700 dark:text-slate-200">
                        {sale.quantity_sold}
                      </td>
                      <td className="px-5 py-3.5 text-sm font-bold tabular-nums text-slate-900 dark:text-white">
                        {money(sale.total_sale)}
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="inline-flex rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold tabular-nums text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
                          +{money(sale.profit)}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${paymentChipClass(sale.payment_method)}`}
                        >
                          {formatPayment(sale.payment_method)}
                        </span>
                      </td>
                      <td className="max-w-[140px] truncate px-5 py-3.5 text-sm text-slate-600 dark:text-slate-300">
                        {sale.sold_by}
                      </td>
                      <td className="px-3 py-3.5">
                        <button
                          onClick={() =>
                            setPendingDelete({
                              saleId: sale.id,
                              productName: product?.name || "Unknown Product",
                            })
                          }
                          title="Tirtir Iibkan - Delete Sale"
                          className="flex h-9 w-9 items-center justify-center rounded-full text-slate-300 opacity-0 transition group-hover:opacity-100 hover:bg-rose-50 hover:text-rose-600 dark:text-slate-600 dark:hover:bg-rose-900/30 dark:hover:text-rose-400"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex flex-col items-center justify-between gap-3 rounded-2xl border border-slate-200/80 bg-white px-4 py-3 shadow-sm dark:border-slate-700/80 dark:bg-slate-800 sm:flex-row">
            <p className="text-xs text-slate-500 dark:text-slate-400 sm:text-sm">
              {(safePage - 1) * itemsPerPage + 1}–
              {Math.min(safePage * itemsPerPage, filteredSales.length)} of{" "}
              {filteredSales.length.toLocaleString()}
            </p>
            <div className="flex items-center gap-2">
              <select
                value={itemsPerPage}
                onChange={(event) => {
                  setItemsPerPage(Number(event.target.value));
                  resetToFirstPage();
                }}
                className="h-9 rounded-full border border-slate-200 bg-slate-50 px-3 text-xs font-medium text-slate-700 outline-none dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200 sm:text-sm"
              >
                {[25, 50, 100, 200].map((count) => (
                  <option key={count} value={count}>
                    {count} / page
                  </option>
                ))}
              </select>
              <button
                onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                disabled={safePage === 1}
                aria-label="Previous page"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-slate-600 transition hover:bg-slate-50 disabled:opacity-40 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="min-w-[80px] text-center text-xs font-semibold text-slate-700 dark:text-slate-300 sm:text-sm">
                {safePage} / {totalPages}
              </span>
              <button
                onClick={() =>
                  setCurrentPage((page) => Math.min(totalPages, page + 1))
                }
                disabled={safePage === totalPages}
                aria-label="Next page"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-slate-600 transition hover:bg-slate-50 disabled:opacity-40 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </>
      )}

      {showForm && (
        <POSSaleForm
          products={products}
          onClose={() => setShowForm(false)}
          onSuccess={handleFormSuccess}
        />
      )}

      <ConfirmDialog
        open={pendingDelete !== null}
        title="Delete this sale?"
        lines={[
          `"${pendingDelete?.productName ?? ""}" will be removed from the sales ledger and its quantity restored to inventory.`,
          "Haqii inaad doonaysid inaad tirtirto iibkan? Tani kama noqon karto — this cannot be undone.",
        ]}
        confirmLabel={deleting ? "Deleting…" : "Delete sale"}
        busy={deleting}
        onConfirm={confirmDelete}
        onCancel={() => (deleting ? undefined : setPendingDelete(null))}
      />
    </div>
  );
}
