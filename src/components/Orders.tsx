import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Calendar,
  CheckCircle2,
  Clock3,
  DollarSign,
  Filter,
  Loader2,
  Mail,
  MapPin,
  Package,
  Phone,
  RefreshCcw,
  Search,
  ShieldCheck,
  Truck,
  XCircle,
} from "lucide-react";
import compactToast from "../utils/compactToast";
import { supabase } from "../lib/supabase";
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

type ManagedOrder = Order & {
  order_items?: OrderItem[];
};

const getOrderReference = (
  order: Pick<ManagedOrder, "id" | "order_number">,
) => {
  const orderNumber =
    typeof order.order_number === "string" ? order.order_number.trim() : "";

  if (orderNumber) {
    return orderNumber;
  }

  return `ORD-${order.id.slice(0, 8).toUpperCase()}`;
};

const formatDateTime = (value: string) =>
  new Intl.DateTimeFormat("en-KE", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));

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
  const [historyEntries, setHistoryEntries] = useState<OrderHistoryEntry[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [adminNote, setAdminNote] = useState("");
  const [shareNoteWithCustomer, setShareNoteWithCustomer] = useState(true);
  const [isSavingNote, setIsSavingNote] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState<OrderStatus | null>(
    null,
  );

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
        compactToast.success(
          `Order marked as ${getOrderStatusLabel(newStatus)}`,
        );
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

    const confirmed = window.confirm(
      `Delete ${getOrderReference(
        selectedOrder,
      )}? This permanently removes the order and its items.`,
    );

    if (!confirmed) {
      return;
    }

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
      setHistoryEntries([]);
      compactToast.success(`Deleted ${getOrderReference(selectedOrder)}`);
    } catch (error) {
      console.error("Error deleting order:", error);
      compactToast.error("Failed to delete order");
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
                className="h-28 rounded-2xl bg-slate-200 dark:bg-slate-700"
              ></div>
            ))}
          </div>
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]">
            <div className="h-[32rem] rounded-3xl bg-slate-200 dark:bg-slate-700"></div>
            <div className="h-[32rem] rounded-3xl bg-slate-200 dark:bg-slate-700"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white">
            Orders Workspace
          </h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Review orders, update statuses, and publish timeline notes customers
            can track.
          </p>
        </div>

        <button
          onClick={() => loadOrders(true)}
          disabled={refreshing}
          className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
        >
          <RefreshCcw
            className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
          />
          <span>{refreshing ? "Refreshing" : "Refresh orders"}</span>
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-3xl border border-amber-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Total orders
          </p>
          <div className="mt-4 flex items-center justify-between">
            <p className="text-3xl font-black text-slate-900 dark:text-white">
              {orderStats.total}
            </p>
            <div className="rounded-2xl bg-amber-500 p-3 text-white">
              <Package className="h-5 w-5" />
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-amber-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Pending + processing
          </p>
          <div className="mt-4 flex items-center justify-between">
            <p className="text-3xl font-black text-amber-600 dark:text-amber-400">
              {orderStats.pending +
                orderStats.confirmed +
                orderStats.processing}
            </p>
            <div className="rounded-2xl bg-amber-100 p-3 text-amber-700 dark:bg-amber-900/30 dark:text-amber-200">
              <Clock3 className="h-5 w-5" />
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-amber-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Shipped + delivered
          </p>
          <div className="mt-4 flex items-center justify-between">
            <p className="text-3xl font-black text-emerald-600 dark:text-emerald-400">
              {orderStats.shipped + orderStats.delivered}
            </p>
            <div className="rounded-2xl bg-emerald-100 p-3 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-200">
              <Truck className="h-5 w-5" />
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-amber-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Active revenue
          </p>
          <div className="mt-4 flex items-center justify-between">
            <p className="text-2xl font-black text-slate-900 dark:text-white">
              KES {orderStats.revenue.toLocaleString()}
            </p>
            <div className="rounded-2xl bg-sky-100 p-3 text-sky-700 dark:bg-sky-900/30 dark:text-sky-200">
              <DollarSign className="h-5 w-5" />
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-3xl border border-amber-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800">
        <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_220px]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search by order number, customer, phone, or email"
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-slate-900 outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 dark:border-slate-600 dark:bg-slate-900 dark:text-white"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-slate-500" />
            <select
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(event.target.value as "all" | OrderStatus)
              }
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 dark:border-slate-600 dark:bg-slate-900 dark:text-white"
            >
              <option value="all">All statuses</option>
              {orderStatusOptions.map((status) => (
                <option key={status} value={status}>
                  {getOrderStatusLabel(status)}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)]">
        <div className="space-y-4">
          {filteredOrders.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center text-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400">
              No orders match your current search.
            </div>
          ) : (
            filteredOrders.map((order) => {
              const isSelected = order.id === selectedOrderId;

              return (
                <button
                  key={order.id}
                  onClick={() => setSelectedOrderId(order.id)}
                  className={`w-full rounded-3xl border p-5 text-left transition ${
                    isSelected
                      ? "border-amber-400 bg-amber-50/70 shadow-md dark:border-amber-700 dark:bg-slate-800"
                      : "border-slate-200 bg-white hover:border-amber-300 hover:bg-amber-50/40 dark:border-slate-700 dark:bg-slate-800 dark:hover:border-amber-700"
                  }`}
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                        {getOrderReference(order)}
                      </p>
                      <h3 className="mt-1 text-lg font-bold text-slate-900 dark:text-white">
                        {order.customer_name}
                      </h3>
                      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                        {formatDateTime(order.created_at)}
                      </p>
                    </div>

                    <div className="text-right">
                      <span
                        className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-sm font-semibold ${getOrderStatusBadgeClass(
                          order.status,
                        )}`}
                      >
                        {getStatusIcon(order.status)}
                        {getOrderStatusLabel(order.status)}
                      </span>
                      <p className="mt-2 text-lg font-black text-slate-900 dark:text-white">
                        KES {order.total_amount.toLocaleString()}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 grid gap-3 sm:grid-cols-3 text-sm text-slate-600 dark:text-slate-400">
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-amber-600" />
                      <span className="truncate">{order.customer_phone}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Package className="h-4 w-4 text-amber-600" />
                      <span>{order.order_items?.length ?? 0} item(s)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-amber-600" />
                      <span>{order.payment_status}</span>
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>

        <div className="lg:sticky lg:top-6 lg:self-start">
          {selectedOrder ? (
            <div className="space-y-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    Selected order
                  </p>
                  <h2 className="mt-1 text-2xl font-black text-slate-900 dark:text-white">
                    {getOrderReference(selectedOrder)}
                  </h2>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    Last updated {formatDateTime(selectedOrder.updated_at)}
                  </p>
                </div>

                <button
                  onClick={handleDeleteOrder}
                  className="rounded-2xl border border-rose-200 px-3 py-2 text-sm font-semibold text-rose-700 transition hover:bg-rose-50 dark:border-rose-800 dark:text-rose-300 dark:hover:bg-rose-900/20"
                >
                  Delete
                </button>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-900/30">
                <div className="grid gap-3 sm:grid-cols-2 text-sm text-slate-600 dark:text-slate-400">
                  <div className="flex items-start gap-2">
                    <Phone className="mt-0.5 h-4 w-4 text-amber-600" />
                    <span>{selectedOrder.customer_phone}</span>
                  </div>
                  {selectedOrder.customer_email && (
                    <div className="flex items-start gap-2">
                      <Mail className="mt-0.5 h-4 w-4 text-amber-600" />
                      <span className="truncate">
                        {selectedOrder.customer_email}
                      </span>
                    </div>
                  )}
                  <div className="flex items-start gap-2 sm:col-span-2">
                    <MapPin className="mt-0.5 h-4 w-4 text-amber-600" />
                    <span>{selectedOrder.delivery_address}</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Calendar className="mt-0.5 h-4 w-4 text-amber-600" />
                    <span>{formatDateTime(selectedOrder.created_at)}</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <DollarSign className="mt-0.5 h-4 w-4 text-amber-600" />
                    <span>
                      {selectedOrder.payment_method} /{" "}
                      {selectedOrder.payment_status}
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <p className="text-sm font-semibold text-slate-900 dark:text-white">
                  Quick status actions
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
                        className={`rounded-2xl border px-3 py-3 text-sm font-semibold transition ${
                          active
                            ? getOrderStatusBadgeClass(status)
                            : "border-slate-200 bg-white text-slate-700 hover:border-amber-300 hover:bg-amber-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
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

              <div>
                <p className="text-sm font-semibold text-slate-900 dark:text-white">
                  Admin update / note
                </p>
                <textarea
                  value={adminNote}
                  onChange={(event) => setAdminNote(event.target.value)}
                  rows={4}
                  placeholder="Write a delivery update, stock note, or internal admin note"
                  className="mt-3 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 dark:border-slate-600 dark:bg-slate-900 dark:text-white"
                />

                <label className="mt-3 flex items-center gap-3 text-sm text-slate-600 dark:text-slate-400">
                  <input
                    type="checkbox"
                    checked={shareNoteWithCustomer}
                    onChange={(event) =>
                      setShareNoteWithCustomer(event.target.checked)
                    }
                    className="h-4 w-4 rounded border-slate-300 text-amber-600 focus:ring-amber-500"
                  />
                  Visible in customer tracking timeline
                </label>

                <button
                  onClick={handleSaveNote}
                  disabled={!adminNote.trim() || isSavingNote}
                  className="mt-3 w-full rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 px-4 py-3 font-semibold text-white transition hover:from-amber-600 hover:to-amber-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSavingNote ? "Saving note..." : "Save update"}
                </button>
              </div>

              <div>
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">
                    Status history
                  </p>
                  {historyLoading && (
                    <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
                  )}
                </div>

                <div className="mt-3 space-y-3">
                  {visibleHistory
                    .slice()
                    .reverse()
                    .map((entry) => (
                      <div
                        key={entry.id}
                        className="rounded-2xl border border-slate-200 p-4 dark:border-slate-700"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="font-semibold text-slate-900 dark:text-white">
                                {entry.title}
                              </p>
                              <span
                                className={`rounded-full border px-2 py-0.5 text-xs font-semibold ${
                                  entry.status
                                    ? getOrderStatusBadgeClass(entry.status)
                                    : "border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200"
                                }`}
                              >
                                {entry.status
                                  ? getOrderStatusLabel(entry.status)
                                  : "Note"}
                              </span>
                              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600 dark:bg-slate-700 dark:text-slate-300">
                                {entry.visible_to_customer
                                  ? "Customer visible"
                                  : "Internal"}
                              </span>
                            </div>

                            {entry.note && (
                              <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                                {entry.note}
                              </p>
                            )}

                            {(entry.actor_name || entry.actor_email) && (
                              <p className="mt-2 text-xs uppercase tracking-wide text-slate-400 dark:text-slate-500">
                                {entry.actor_name || entry.actor_email}
                              </p>
                            )}
                          </div>

                          <p className="text-right text-xs text-slate-500 dark:text-slate-400">
                            {formatDateTime(entry.created_at)}
                          </p>
                        </div>
                      </div>
                    ))}
                </div>
              </div>

              <div>
                <p className="text-sm font-semibold text-slate-900 dark:text-white">
                  Order items
                </p>
                <div className="mt-3 space-y-3">
                  {(selectedOrder.order_items ?? []).map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between rounded-2xl border border-slate-200 p-3 dark:border-slate-700"
                    >
                      <div>
                        <p className="font-medium text-slate-900 dark:text-white">
                          {item.product_name}
                        </p>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                          {item.quantity} x KES{" "}
                          {item.unit_price.toLocaleString()}
                        </p>
                      </div>
                      <p className="font-semibold text-slate-900 dark:text-white">
                        KES {item.total_price.toLocaleString()}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center text-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400">
              Select an order to manage its status, notes, and customer
              timeline.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
