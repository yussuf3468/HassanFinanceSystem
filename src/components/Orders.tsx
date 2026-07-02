import { useCallback, useEffect, useMemo, useState } from "react";
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Loader2,
  Mail,
  MapPin,
  MessageCircle,
  Package,
  Phone,
  RefreshCcw,
  Search,
  ShieldCheck,
  Trash2,
  Truck,
  XCircle,
} from "lucide-react";
import compactToast from "../utils/compactToast";
import { supabase } from "../lib/supabase";
import ConfirmDialog from "./ui/ConfirmDialog";
import {
  appendOrderHistoryEntry,
  fetchOrderHistory,
} from "../utils/orderHistory";
import {
  getOrderStatusBadgeClass,
  getOrderStatusDescription,
  getOrderStatusLabel,
  orderStatusOptions,
} from "../utils/orderPresentation";
import type {
  Order,
  OrderHistoryEntry,
  OrderItem,
  OrderStatus,
} from "../types";

/* ═══════════════════════════════════════════════════════════════
   ORDERS — the fulfilment workspace. Live pulse up top, instant
   search with status chips, and a master–detail layout: order
   queue on the left, everything about the selected order on the
   right (contact shortcuts, payment breakdown, status actions,
   customer-visible timeline). Data flows are unchanged.
   ═══════════════════════════════════════════════════════════════ */

type ManagedOrder = Order & {
  order_items?: OrderItem[];
};

const getOrderReference = (order: Pick<ManagedOrder, "id" | "order_number">) => {
  const orderNumber =
    typeof order.order_number === "string" ? order.order_number.trim() : "";
  if (orderNumber) return orderNumber;
  return `ORD-${order.id.slice(0, 8).toUpperCase()}`;
};

const formatDateTime = (value: string) =>
  new Intl.DateTimeFormat("en-KE", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));

const money = (value: number) => `KES ${Math.round(value).toLocaleString()}`;

/** Normalize a Kenyan phone number for wa.me links. */
const whatsappNumber = (phone: string) => {
  const digits = (phone ?? "").replace(/\D/g, "");
  if (digits.startsWith("254")) return digits;
  if (digits.startsWith("0")) return `254${digits.slice(1)}`;
  return `254${digits}`;
};

const initialsOf = (name: string) =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("") || "?";

const getStatusIcon = (status: OrderStatus) => {
  switch (status) {
    case "pending":
      return <Clock3 className="h-4 w-4" />;
    case "confirmed":
      return <ShieldCheck className="h-4 w-4" />;
    case "processing":
      return <Package className="h-4 w-4" />;
    case "shipped":
      return <Truck className="h-4 w-4" />;
    case "delivered":
      return <CheckCircle2 className="h-4 w-4" />;
    case "cancelled":
      return <XCircle className="h-4 w-4" />;
    default:
      return <Package className="h-4 w-4" />;
  }
};

const STATUS_DOT: Record<OrderStatus, string> = {
  pending: "bg-amber-500",
  confirmed: "bg-sky-500",
  processing: "bg-indigo-500",
  shipped: "bg-violet-500",
  delivered: "bg-emerald-500",
  cancelled: "bg-rose-500",
};

const buildFallbackHistory = (order: ManagedOrder): OrderHistoryEntry[] => {
  const history: OrderHistoryEntry[] = [
    {
      id: `${order.id}-created`,
      order_id: order.id,
      status: "pending",
      title: "Order placed",
      note: "Customer completed checkout successfully.",
      visible_to_customer: true,
      created_at: order.created_at,
      metadata: null,
    },
  ];

  if (order.notes) {
    history.push({
      id: `${order.id}-customer-note`,
      order_id: order.id,
      status: order.status,
      title: "Customer note",
      note: order.notes,
      visible_to_customer: true,
      created_at: order.created_at,
      metadata: null,
    });
  }

  if (order.status !== "pending") {
    history.push({
      id: `${order.id}-${order.status}`,
      order_id: order.id,
      status: order.status,
      title: `Status changed to ${getOrderStatusLabel(order.status)}`,
      note: getOrderStatusDescription(order.status),
      visible_to_customer: true,
      created_at: order.updated_at,
      metadata: null,
    });
  }

  return history;
};

export default function Orders() {
  const [orders, setOrders] = useState<ManagedOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | OrderStatus>("all");
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [mobileDetailOpen, setMobileDetailOpen] = useState(false);
  const [historyEntries, setHistoryEntries] = useState<OrderHistoryEntry[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [adminNote, setAdminNote] = useState("");
  const [shareNoteWithCustomer, setShareNoteWithCustomer] = useState(true);
  const [isSavingNote, setIsSavingNote] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState<OrderStatus | null>(null);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const selectedOrder = useMemo(
    () => orders.find((order) => order.id === selectedOrderId) ?? null,
    [orders, selectedOrderId],
  );

  const loadOrders = useCallback(async (showRefreshState = false) => {
    try {
      if (showRefreshState) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const { data, error } = await supabase
        .from("orders")
        .select(
          `
            *,
            order_items (
              id,
              order_id,
              product_id,
              product_name,
              quantity,
              unit_price,
              total_price,
              created_at
            )
          `,
        )
        .order("created_at", { ascending: false });

      if (error) {
        throw error;
      }

      const nextOrders = (data as ManagedOrder[] | null) ?? [];
      setOrders(nextOrders);
      setSelectedOrderId((current) => {
        if (current && nextOrders.some((order) => order.id === current)) {
          return current;
        }
        return nextOrders[0]?.id ?? null;
      });
    } catch (error) {
      console.error("Error loading orders:", error);
      compactToast.error("Failed to load orders");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const loadHistory = useCallback(async (orderId: string) => {
    setHistoryLoading(true);
    try {
      const entries = await fetchOrderHistory(orderId);
      setHistoryEntries(entries);
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  useEffect(() => {
    if (!selectedOrderId) {
      setHistoryEntries([]);
      return;
    }
    loadHistory(selectedOrderId);
  }, [loadHistory, selectedOrderId]);

  // Lock background scroll while the mobile detail overlay is open
  // (only below the lg breakpoint, where the overlay actually renders).
  useEffect(() => {
    if (!mobileDetailOpen) return;
    if (window.matchMedia("(min-width: 1024px)").matches) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [mobileDetailOpen]);

  const openOrder = useCallback((orderId: string) => {
    setSelectedOrderId(orderId);
    setMobileDetailOpen(true);
  }, []);

  const filteredOrders = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    return orders.filter((order) => {
      const matchesSearch =
        !query ||
        (order.order_number ?? "").toLowerCase().includes(query) ||
        order.customer_name.toLowerCase().includes(query) ||
        order.customer_phone.toLowerCase().includes(query) ||
        (order.customer_email ?? "").toLowerCase().includes(query);

      const matchesStatus =
        statusFilter === "all" || order.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [orders, searchTerm, statusFilter]);

  const orderStats = useMemo(
    () =>
      orders.reduce(
        (stats, order) => {
          stats.total += 1;
          stats[order.status] += 1;
          if (order.status !== "cancelled") {
            stats.revenue += order.total_amount;
          }
          return stats;
        },
        {
          total: 0,
          pending: 0,
          confirmed: 0,
          processing: 0,
          shipped: 0,
          delivered: 0,
          cancelled: 0,
          revenue: 0,
        },
      ),
    [orders],
  );

  const visibleHistory = useMemo(() => {
    if (!selectedOrder) {
      return [] as OrderHistoryEntry[];
    }
    if (historyEntries.length > 0) {
      return historyEntries;
    }
    return buildFallbackHistory(selectedOrder);
  }, [historyEntries, selectedOrder]);

  const handleStatusUpdate = useCallback(
    async (newStatus: OrderStatus) => {
      if (!selectedOrder || selectedOrder.status === newStatus) {
        return;
      }

      setUpdatingStatus(newStatus);
      const updatedAt = new Date().toISOString();

      try {
        const { error } = await supabase
          .from("orders")
          .update({
            status: newStatus as never,
            updated_at: updatedAt,
          })
          .eq("id", selectedOrder.id);

        if (error) {
          throw error;
        }

        setOrders((current) =>
          current.map((order) =>
            order.id === selectedOrder.id
              ? { ...order, status: newStatus, updated_at: updatedAt }
              : order,
          ),
        );

        await appendOrderHistoryEntry({
          orderId: selectedOrder.id,
          status: newStatus,
          title: `Status changed to ${getOrderStatusLabel(newStatus)}`,
          note: getOrderStatusDescription(newStatus),
          actorName: "Admin",
          visibleToCustomer: true,
        });

        await loadHistory(selectedOrder.id);
        compactToast.success(`Order marked as ${getOrderStatusLabel(newStatus)}`);
      } catch (error) {
        console.error("Error updating order status:", error);
        compactToast.error("Failed to update order status");
      } finally {
        setUpdatingStatus(null);
      }
    },
    [loadHistory, selectedOrder],
  );

  const handleSaveNote = useCallback(async () => {
    if (!selectedOrder || !adminNote.trim()) {
      return;
    }

    setIsSavingNote(true);

    try {
      await appendOrderHistoryEntry({
        orderId: selectedOrder.id,
        status: selectedOrder.status,
        title: shareNoteWithCustomer ? "Admin update" : "Internal admin note",
        note: adminNote.trim(),
        actorName: "Admin",
        visibleToCustomer: shareNoteWithCustomer,
      });

      const updatedAt = new Date().toISOString();

      await supabase
        .from("orders")
        .update({ updated_at: updatedAt })
        .eq("id", selectedOrder.id);

      setOrders((current) =>
        current.map((order) =>
          order.id === selectedOrder.id
            ? { ...order, updated_at: updatedAt }
            : order,
        ),
      );

      setAdminNote("");
      await loadHistory(selectedOrder.id);
      compactToast.success(
        shareNoteWithCustomer
          ? "Customer-facing update saved"
          : "Internal note saved",
      );
    } catch (error) {
      console.error("Error saving order note:", error);
      compactToast.error("Failed to save the order note");
    } finally {
      setIsSavingNote(false);
    }
  }, [adminNote, loadHistory, selectedOrder, shareNoteWithCustomer]);

  const handleDeleteOrder = useCallback(async () => {
    if (!selectedOrder) {
      return;
    }

    setDeleting(true);
    try {
      const { error: itemsError } = await supabase
        .from("order_items")
        .delete()
        .eq("order_id", selectedOrder.id);

      if (itemsError) {
        throw itemsError;
      }

      const { error: orderError } = await supabase
        .from("orders")
        .delete()
        .eq("id", selectedOrder.id);

      if (orderError) {
        throw orderError;
      }

      setOrders((current) =>
        current.filter((order) => order.id !== selectedOrder.id),
      );
      setSelectedOrderId(null);
      setMobileDetailOpen(false);
      setHistoryEntries([]);
      compactToast.success(`Deleted ${getOrderReference(selectedOrder)}`);
    } catch (error) {
      console.error("Error deleting order:", error);
      compactToast.error("Failed to delete order");
    } finally {
      setDeleting(false);
      setConfirmingDelete(false);
    }
  }, [selectedOrder]);

  if (loading) {
    return (
      <div className="space-y-6 p-4 md:p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-48 rounded-xl bg-slate-200 dark:bg-slate-700"></div>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <div
                key={index}
                className="h-24 rounded-2xl bg-slate-200 dark:bg-slate-700"
              ></div>
            ))}
          </div>
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)]">
            <div className="h-[32rem] rounded-3xl bg-slate-200 dark:bg-slate-700"></div>
            <div className="h-[32rem] rounded-3xl bg-slate-200 dark:bg-slate-700"></div>
          </div>
        </div>
      </div>
    );
  }

  const statusChips: Array<{ key: "all" | OrderStatus; label: string; count: number }> = [
    { key: "all", label: "All", count: orderStats.total },
    ...orderStatusOptions.map((status) => ({
      key: status,
      label: getOrderStatusLabel(status),
      count: orderStats[status],
    })),
  ];

  const needAction =
    orderStats.pending + orderStats.confirmed + orderStats.processing;

  return (
    <div className="space-y-5 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-xl font-black tracking-tight text-slate-900 dark:text-white sm:text-2xl">
            Orders
          </h1>
          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400 sm:text-sm">
            {needAction > 0 ? (
              <>
                <span className="font-semibold text-amber-600 dark:text-amber-400">
                  {needAction} need{needAction === 1 ? "s" : ""} action
                </span>{" "}
                · {orderStats.total.toLocaleString()} total
              </>
            ) : (
              <>All caught up · {orderStats.total.toLocaleString()} total</>
            )}
          </p>
        </div>

        <button
          onClick={() => loadOrders(true)}
          disabled={refreshing}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
        >
          <RefreshCcw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
          <span>{refreshing ? "Refreshing…" : "Refresh"}</span>
        </button>
      </div>

      {/* Search + status chips */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-3 shadow-sm dark:border-slate-700/80 dark:bg-slate-800 sm:p-4">
        <div className="relative">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Search order number, customer, phone, or email…"
            className="h-11 w-full rounded-full border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm text-slate-900 outline-none transition focus:border-amber-400 focus:ring-2 focus:ring-amber-500/20 dark:border-slate-600 dark:bg-slate-900 dark:text-white"
          />
        </div>

        <div className="scrollbar-hide -mx-1 mt-3 flex gap-2 overflow-x-auto px-1 pb-0.5">
          {statusChips.map((chip) => {
            const active = statusFilter === chip.key;
            return (
              <button
                key={chip.key}
                onClick={() => setStatusFilter(chip.key)}
                className={`flex h-9 shrink-0 items-center gap-1.5 rounded-full px-3.5 text-xs font-semibold transition sm:text-[13px] ${
                  active
                    ? "bg-slate-900 text-white shadow-sm dark:bg-white dark:text-slate-900"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-700"
                }`}
              >
                {chip.key !== "all" && (
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${STATUS_DOT[chip.key as OrderStatus]}`}
                  />
                )}
                {chip.label}
                <span className={active ? "opacity-70" : "opacity-50"}>
                  {chip.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Master–detail */}
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1.15fr)_minmax(340px,0.85fr)]">
        {/* Queue */}
        <div className="space-y-3">
          {filteredOrders.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center dark:border-slate-700 dark:bg-slate-800">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-100 dark:bg-amber-900/30">
                <Package className="h-6 w-6 text-amber-600 dark:text-amber-400" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                {orders.length === 0 ? "No orders yet" : "No matches"}
              </h3>
              <p className="mx-auto mt-1 max-w-sm text-sm text-slate-500 dark:text-slate-400">
                {orders.length === 0
                  ? "New storefront orders will land here the moment they're placed."
                  : "Try a different search or status filter."}
              </p>
            </div>
          ) : (
            filteredOrders.map((order) => {
              const isSelected = order.id === selectedOrderId;
              const itemCount = order.order_items?.length ?? 0;
              const paid = order.payment_status === "paid";

              return (
                <button
                  key={order.id}
                  onClick={() => openOrder(order.id)}
                  className={`w-full rounded-2xl border p-4 text-left transition active:scale-[0.995] sm:p-5 ${
                    isSelected
                      ? "border-amber-400/80 bg-amber-50/60 shadow-md dark:border-amber-600/60 dark:bg-slate-800"
                      : "border-slate-200/80 bg-white shadow-sm hover:border-amber-300 hover:shadow-md dark:border-slate-700/80 dark:bg-slate-800 dark:hover:border-amber-700"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {/* Avatar */}
                    <div
                      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-sm font-bold ${
                        isSelected
                          ? "bg-amber-500 text-white"
                          : "bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-200"
                      }`}
                    >
                      {initialsOf(order.customer_name)}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${getOrderStatusBadgeClass(order.status)}`}
                        >
                          {getStatusIcon(order.status)}
                          {getOrderStatusLabel(order.status)}
                        </span>
                        <span className="font-mono text-[11px] text-slate-400">
                          {getOrderReference(order)}
                        </span>
                      </div>
                      <h3 className="mt-1.5 truncate text-[15px] font-bold text-slate-900 dark:text-white sm:text-base">
                        {order.customer_name}
                      </h3>
                      <p className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-slate-500 dark:text-slate-400">
                        <span>{formatDateTime(order.created_at)}</span>
                        <span className="inline-flex items-center gap-1">
                          <Phone className="h-3 w-3 text-amber-600" />
                          {order.customer_phone}
                        </span>
                      </p>
                    </div>

                    <div className="flex shrink-0 items-center gap-1">
                      <div className="text-right">
                        <p className="text-[15px] font-black tabular-nums text-slate-900 dark:text-white sm:text-base">
                          {money(order.total_amount)}
                        </p>
                        <p className="mt-0.5 flex items-center justify-end gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
                          {itemCount} item{itemCount !== 1 ? "s" : ""}
                          <span
                            className={`inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 font-semibold ${
                              paid
                                ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300"
                                : "bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300"
                            }`}
                          >
                            {paid ? "paid" : order.payment_status}
                          </span>
                        </p>
                      </div>
                      <ChevronRight className="h-5 w-5 text-slate-300 dark:text-slate-600 lg:hidden" />
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Detail */}
        <div
          className={`${
            mobileDetailOpen ? "fixed inset-0 z-50" : "hidden"
          } lg:z-auto lg:block lg:sticky lg:top-6 lg:self-start`}
        >
          <div className="scrollbar-hide h-full overflow-y-auto bg-slate-100 p-4 dark:bg-slate-950 lg:h-auto lg:overflow-visible lg:!bg-transparent lg:p-0">
            {selectedOrder ? (
              <div className="space-y-5 rounded-3xl border border-slate-200/80 bg-white p-4 shadow-sm dark:border-slate-700/80 dark:bg-slate-800 sm:p-6">
                {/* Mobile back bar */}
                <button
                  onClick={() => setMobileDetailOpen(false)}
                  className="-ml-1 inline-flex items-center gap-1 text-sm font-semibold text-slate-600 dark:text-slate-300 lg:hidden"
                >
                  <ChevronLeft className="h-5 w-5" />
                  All orders
                </button>

                {/* Head */}
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-xl font-black tracking-tight text-slate-900 dark:text-white sm:text-2xl">
                        {getOrderReference(selectedOrder)}
                      </h2>
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${getOrderStatusBadgeClass(selectedOrder.status)}`}
                      >
                        {getStatusIcon(selectedOrder.status)}
                        {getOrderStatusLabel(selectedOrder.status)}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                      Updated {formatDateTime(selectedOrder.updated_at)}
                    </p>
                  </div>

                  <button
                    onClick={() => setConfirmingDelete(true)}
                    title="Delete order"
                    className="flex h-10 w-10 items-center justify-center rounded-full text-slate-400 transition hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-900/30 dark:hover:text-rose-400"
                  >
                    <Trash2 className="h-[18px] w-[18px]" />
                  </button>
                </div>

                {/* Customer + shortcuts */}
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-900/40">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold text-slate-900 dark:text-white">
                        {selectedOrder.customer_name}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {selectedOrder.customer_phone}
                      </p>
                    </div>
                    <div className="flex shrink-0 gap-2">
                      <a
                        href={`tel:${selectedOrder.customer_phone.replace(/\s/g, "")}`}
                        title="Call customer"
                        className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-900 text-white transition hover:scale-105 dark:bg-white dark:text-slate-900"
                      >
                        <Phone className="h-4 w-4" />
                      </a>
                      <a
                        href={`https://wa.me/${whatsappNumber(selectedOrder.customer_phone)}?text=${encodeURIComponent(
                          `Hello ${selectedOrder.customer_name}, this is Hassan Bookshop regarding your order ${getOrderReference(selectedOrder)}.`,
                        )}`}
                        target="_blank"
                        rel="noreferrer"
                        title="WhatsApp customer"
                        className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-600 text-white transition hover:scale-105"
                      >
                        <MessageCircle className="h-4 w-4" />
                      </a>
                    </div>
                  </div>

                  <div className="mt-3 space-y-2 border-t border-slate-200 pt-3 text-sm text-slate-600 dark:border-slate-700 dark:text-slate-300">
                    <div className="flex items-start gap-2">
                      <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                      <span>{selectedOrder.delivery_address}</span>
                    </div>
                    {selectedOrder.customer_email && (
                      <div className="flex items-start gap-2">
                        <Mail className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                        <span className="break-all">{selectedOrder.customer_email}</span>
                      </div>
                    )}
                    {selectedOrder.notes && (
                      <p className="rounded-xl bg-amber-50 px-3 py-2 text-xs leading-relaxed text-amber-800 dark:bg-amber-900/20 dark:text-amber-200">
                        “{selectedOrder.notes}”
                      </p>
                    )}
                  </div>
                </div>

                {/* Payment & totals */}
                <div className="rounded-2xl border border-slate-200 p-4 dark:border-slate-700">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-bold text-slate-900 dark:text-white">
                      Payment
                    </p>
                    <span
                      className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                        selectedOrder.payment_status === "paid"
                          ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300"
                          : selectedOrder.payment_status === "failed"
                            ? "bg-rose-50 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300"
                            : "bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300"
                      }`}
                    >
                      {selectedOrder.payment_method} · {selectedOrder.payment_status}
                    </span>
                  </div>
                  {(selectedOrder.payment_reference ||
                    selectedOrder.payment_receipt_code) && (
                    <p className="mt-2 font-mono text-xs text-slate-500 dark:text-slate-400">
                      Ref:{" "}
                      {selectedOrder.payment_receipt_code ||
                        selectedOrder.payment_reference}
                    </p>
                  )}
                  <dl className="mt-3 space-y-1.5 border-t border-slate-200 pt-3 text-sm dark:border-slate-700">
                    <div className="flex justify-between text-slate-600 dark:text-slate-300">
                      <dt>Subtotal</dt>
                      <dd className="tabular-nums">{money(selectedOrder.subtotal)}</dd>
                    </div>
                    <div className="flex justify-between text-slate-600 dark:text-slate-300">
                      <dt>Delivery</dt>
                      <dd className="tabular-nums">
                        {selectedOrder.delivery_fee > 0
                          ? money(selectedOrder.delivery_fee)
                          : "Free"}
                      </dd>
                    </div>
                    <div className="flex justify-between border-t border-slate-200 pt-1.5 text-base font-black text-slate-900 dark:border-slate-700 dark:text-white">
                      <dt>Total</dt>
                      <dd className="tabular-nums">{money(selectedOrder.total_amount)}</dd>
                    </div>
                  </dl>
                </div>

                {/* Status actions */}
                <div>
                  <p className="text-sm font-bold text-slate-900 dark:text-white">
                    Move this order
                  </p>
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    {orderStatusOptions.map((status) => {
                      const active = selectedOrder.status === status;
                      const loadingStatus = updatingStatus === status;

                      return (
                        <button
                          key={status}
                          onClick={() => handleStatusUpdate(status)}
                          disabled={loadingStatus || !!updatingStatus}
                          className={`rounded-2xl border px-3 py-3 text-sm font-semibold transition disabled:cursor-not-allowed ${
                            active
                              ? `${getOrderStatusBadgeClass(status)} shadow-sm`
                              : "border-slate-200 bg-white text-slate-600 hover:border-amber-300 hover:bg-amber-50/60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-amber-700"
                          }`}
                        >
                          <span className="inline-flex items-center gap-2">
                            {loadingStatus ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              getStatusIcon(status)
                            )}
                            {getOrderStatusLabel(status)}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Note composer */}
                <div className="rounded-2xl border border-slate-200 p-4 dark:border-slate-700">
                  <p className="text-sm font-bold text-slate-900 dark:text-white">
                    Post an update
                  </p>
                  <textarea
                    value={adminNote}
                    onChange={(event) => setAdminNote(event.target.value)}
                    rows={3}
                    placeholder="Delivery update, stock note, or internal note…"
                    className="mt-3 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-amber-400 focus:ring-2 focus:ring-amber-500/20 dark:border-slate-600 dark:bg-slate-900 dark:text-white"
                  />
                  <label className="mt-3 flex cursor-pointer items-center justify-between gap-3">
                    <span className="text-xs font-medium text-slate-600 dark:text-slate-300">
                      Visible in the customer's tracking timeline
                    </span>
                    <span
                      onClick={(e) => {
                        e.preventDefault();
                        setShareNoteWithCustomer((v) => !v);
                      }}
                      className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
                        shareNoteWithCustomer
                          ? "bg-emerald-500"
                          : "bg-slate-300 dark:bg-slate-600"
                      }`}
                    >
                      <span
                        className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${
                          shareNoteWithCustomer ? "left-[22px]" : "left-0.5"
                        }`}
                      />
                    </span>
                  </label>
                  <button
                    onClick={handleSaveNote}
                    disabled={!adminNote.trim() || isSavingNote}
                    className="mt-3 flex h-11 w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 text-sm font-semibold text-white shadow-lg shadow-amber-500/20 transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60 disabled:shadow-none disabled:hover:translate-y-0"
                  >
                    {isSavingNote && <Loader2 className="h-4 w-4 animate-spin" />}
                    {isSavingNote ? "Saving…" : "Save update"}
                  </button>
                </div>

                {/* Timeline */}
                <div>
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-bold text-slate-900 dark:text-white">
                      Timeline
                    </p>
                    {historyLoading && (
                      <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
                    )}
                  </div>

                  <ol className="relative mt-4 space-y-5 border-l border-slate-200 pl-5 dark:border-slate-700">
                    {visibleHistory
                      .slice()
                      .reverse()
                      .map((entry) => (
                        <li key={entry.id} className="relative">
                          <span
                            className={`absolute -left-[26.5px] top-1 h-3 w-3 rounded-full ring-4 ring-white dark:ring-slate-800 ${
                              entry.status
                                ? STATUS_DOT[entry.status]
                                : "bg-slate-400"
                            }`}
                          />
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="text-sm font-semibold text-slate-900 dark:text-white">
                              {entry.title}
                            </p>
                            <span
                              className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                                entry.visible_to_customer
                                  ? "bg-sky-50 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300"
                                  : "bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-300"
                              }`}
                            >
                              {entry.visible_to_customer ? "Customer visible" : "Internal"}
                            </span>
                          </div>
                          {entry.note && (
                            <p className="mt-1 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                              {entry.note}
                            </p>
                          )}
                          <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
                            {formatDateTime(entry.created_at)}
                            {(entry.actor_name || entry.actor_email) &&
                              ` · ${entry.actor_name || entry.actor_email}`}
                          </p>
                        </li>
                      ))}
                  </ol>
                </div>

                {/* Items */}
                <div>
                  <p className="text-sm font-bold text-slate-900 dark:text-white">
                    Items ({selectedOrder.order_items?.length ?? 0})
                  </p>
                  <div className="mt-3 overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-700">
                    {(selectedOrder.order_items ?? []).map((item, index) => (
                      <div
                        key={item.id}
                        className={`flex items-center justify-between gap-3 px-4 py-3 ${
                          index > 0
                            ? "border-t border-slate-100 dark:border-slate-700/70"
                            : ""
                        }`}
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">
                            {item.product_name}
                          </p>
                          <p className="text-xs tabular-nums text-slate-500 dark:text-slate-400">
                            {item.quantity} × {money(item.unit_price)}
                          </p>
                        </div>
                        <p className="shrink-0 text-sm font-bold tabular-nums text-slate-900 dark:text-white">
                          {money(item.total_price)}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="hidden rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400 lg:block">
                Select an order to manage its status, notes, and customer
                timeline.
              </div>
            )}
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={confirmingDelete && selectedOrder !== null}
        title={`Delete ${selectedOrder ? getOrderReference(selectedOrder) : "this order"}?`}
        lines={[
          "This permanently removes the order and all of its items.",
          "The customer will no longer be able to track it. This cannot be undone.",
        ]}
        confirmLabel={deleting ? "Deleting…" : "Delete order"}
        busy={deleting}
        onConfirm={handleDeleteOrder}
        onCancel={() => (deleting ? undefined : setConfirmingDelete(false))}
      />
    </div>
  );
}
