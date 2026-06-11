import { memo, useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  Calendar,
  CheckCircle2,
  Circle,
  Clock,
  CreditCard,
  Loader2,
  Mail,
  MapPin,
  Phone,
  Search,
  Truck,
  X,
} from "lucide-react";
import compactToast from "../utils/compactToast";
import { fetchOrderHistory } from "../utils/orderHistory";
import {
  customerVisibleStatusSteps,
  getOrderStatusBadgeClass,
  getOrderStatusDescription,
  getOrderStatusLabel,
  getOrderStatusStepIndex,
} from "../utils/orderPresentation";
import { supabase } from "../lib/supabase";
import type { Order, OrderHistoryEntry, OrderItem } from "../types";

interface OrderTrackingModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialLookup?: {
    orderNumber?: string;
    phone?: string;
    email?: string;
  };
}

type TrackedOrder = Order & {
  order_items?: OrderItem[];
};

const normalizeOrderLookup = (value: string) =>
  value.replace(/[^A-Z0-9]/gi, "").toUpperCase();

const getOrderReference = (
  order: Pick<TrackedOrder, "id" | "order_number">,
) => {
  const orderNumber =
    typeof order.order_number === "string" ? order.order_number.trim() : "";

  if (orderNumber) {
    return orderNumber;
  }

  return `ORD-${order.id.slice(0, 8).toUpperCase()}`;
};

const getPhoneMatchKey = (value: string) => {
  const digits = value.replace(/\D/g, "");

  if (!digits) {
    return "";
  }

  if (digits.startsWith("254")) {
    return digits.slice(-9);
  }

  if (digits.startsWith("0")) {
    return digits.slice(-9);
  }

  return digits.slice(-9);
};

const formatDateTime = (value: string) =>
  new Intl.DateTimeFormat("en-KE", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));

const getRelativeTime = (value: string) => {
  const diffMs = Date.now() - new Date(value).getTime();
  const diffHours = Math.max(1, Math.floor(diffMs / (1000 * 60 * 60)));

  if (diffHours < 24) {
    return `${diffHours} hour${diffHours === 1 ? "" : "s"} ago`;
  }

  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays} day${diffDays === 1 ? "" : "s"} ago`;
};

const OrderTrackingModal = memo(
  ({ isOpen, onClose, initialLookup }: OrderTrackingModalProps) => {
    const [lookup, setLookup] = useState({
      orderNumber: "",
      phone: "",
      email: "",
    });
    const [isSearching, setIsSearching] = useState(false);
    const [matchedOrders, setMatchedOrders] = useState<TrackedOrder[]>([]);
    const [trackedOrder, setTrackedOrder] = useState<TrackedOrder | null>(null);
    const [historyEntries, setHistoryEntries] = useState<OrderHistoryEntry[]>(
      [],
    );

    useEffect(() => {
      if (!isOpen) {
        return;
      }

      setLookup({
        orderNumber: initialLookup?.orderNumber ?? "",
        phone: initialLookup?.phone ?? "",
        email: initialLookup?.email ?? "",
      });
      setHistoryEntries([]);
      setMatchedOrders([]);
      setTrackedOrder(null);
    }, [initialLookup, isOpen]);

    useEffect(() => {
      const loadHistory = async () => {
        if (!trackedOrder?.id) {
          setHistoryEntries([]);
          return;
        }

        const entries = await fetchOrderHistory(trackedOrder.id, {
          customerVisibleOnly: true,
        });
        setHistoryEntries(entries);
      };

      loadHistory();
    }, [trackedOrder?.id]);

    const handleLookupChange = useCallback(
      (field: "orderNumber" | "phone" | "email", value: string) => {
        setLookup((prev) => ({ ...prev, [field]: value }));
      },
      [],
    );

    const handleSearch = useCallback(
      async (event: React.FormEvent) => {
        event.preventDefault();

        const orderNumber = lookup.orderNumber.trim().toUpperCase();
        const normalizedOrderLookup = normalizeOrderLookup(orderNumber);
        const phone = lookup.phone.trim();
        const email = lookup.email.trim().toLowerCase();
        const phoneKey = getPhoneMatchKey(phone);

        if (!orderNumber && !phone && !email) {
          compactToast.error("Enter a phone number, email, or order number");
          return;
        }

        setIsSearching(true);
        setTrackedOrder(null);
        setMatchedOrders([]);

        try {
          let query = supabase
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
            .order("created_at", { ascending: false })
            .limit(orderNumber && !phoneKey && !email ? 200 : 50);

          if (email) {
            query = query.ilike("customer_email", email);
          }

          if (phoneKey) {
            query = query.ilike("customer_phone", `%${phoneKey}%`);
          }

          const { data, error } = await query;

          if (error) {
            throw error;
          }

          const matches = ((data as TrackedOrder[] | null) ?? []).filter(
            (order) => {
              const phoneMatches =
                !phoneKey ||
                getPhoneMatchKey(order.customer_phone) === phoneKey;
              const emailMatches =
                !email ||
                (order.customer_email ?? "").trim().toLowerCase() === email;
              const orderReferenceMatches =
                !normalizedOrderLookup ||
                normalizeOrderLookup(getOrderReference(order)) ===
                  normalizedOrderLookup;
              const orderNumberMatches =
                !normalizedOrderLookup ||
                normalizeOrderLookup(order.order_number ?? "") ===
                  normalizedOrderLookup;

              return (
                phoneMatches &&
                emailMatches &&
                (orderNumberMatches || orderReferenceMatches)
              );
            },
          );

          if (matches.length === 0) {
            setTrackedOrder(null);
            setMatchedOrders([]);
            compactToast.error("No matching orders were found");
            return;
          }

          if (matches.length === 1) {
            setTrackedOrder(matches[0]);
            setMatchedOrders(matches);
            compactToast.success(`Tracking ${getOrderReference(matches[0])}`);
            return;
          }

          setMatchedOrders(matches);
          compactToast.success(`${matches.length} matching orders found`);
        } catch (error) {
          console.error("Order tracking error:", error);
          compactToast.error("Unable to track this order right now");
        } finally {
          setIsSearching(false);
        }
      },
      [lookup],
    );

    const activeStepIndex = useMemo(() => {
      if (!trackedOrder) {
        return -1;
      }

      return getOrderStatusStepIndex(trackedOrder.status);
    }, [trackedOrder]);

    const visibleTimeline = useMemo(() => {
      if (!trackedOrder) {
        return [] as OrderHistoryEntry[];
      }

      if (historyEntries.length > 0) {
        return historyEntries;
      }

      return [
        {
          id: `${trackedOrder.id}-placed`,
          order_id: trackedOrder.id,
          status: "pending",
          title: "Order placed",
          note: "Your order was received successfully.",
          actor_name: null,
          actor_email: null,
          visible_to_customer: true,
          created_at: trackedOrder.created_at,
          metadata: null,
        },
        ...(trackedOrder.status !== "pending"
          ? [
              {
                id: `${trackedOrder.id}-${trackedOrder.status}`,
                order_id: trackedOrder.id,
                status: trackedOrder.status,
                title: `Status updated to ${getOrderStatusLabel(
                  trackedOrder.status,
                )}`,
                note: getOrderStatusDescription(trackedOrder.status),
                actor_name: null,
                actor_email: null,
                visible_to_customer: true,
                created_at: trackedOrder.updated_at,
                metadata: null,
              },
            ]
          : []),
      ];
    }, [historyEntries, trackedOrder]);

    const handleSelectOrder = useCallback((order: TrackedOrder) => {
      setTrackedOrder(order);
    }, []);

    if (!isOpen) {
      return null;
    }

    return (
      <div className="fixed inset-0 z-[70] bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center sm:p-4">
        <div className="w-full max-w-3xl overflow-hidden rounded-t-3xl sm:rounded-3xl bg-white shadow-2xl dark:bg-[#1d1d1f]">
          <div className="flex items-center justify-between px-6 h-16 border-b border-black/5 dark:border-white/10 bg-white/80 dark:bg-[#1d1d1f]/80 backdrop-blur-xl sticky top-0 z-10">
            <div>
              <h2 className="text-[19px] font-semibold tracking-tight text-[#1d1d1f] dark:text-white">
                Track your order
              </h2>
              <p className="text-[12px] text-[#86868b] dark:text-[#a1a1a6]">
                Enter your order number, phone, or email.
              </p>
            </div>
            <button
              onClick={onClose}
              className="w-9 h-9 flex items-center justify-center rounded-full text-[#1d1d1f] dark:text-white transition-colors hover:bg-black/5 dark:hover:bg-white/10"
              aria-label="Close order tracker"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="max-h-[85vh] overflow-y-auto scrollbar-hide p-6">
            <form
              onSubmit={handleSearch}
              className="grid gap-3 rounded-2xl bg-[#f5f5f7] dark:bg-[#2c2c2e] p-4 md:grid-cols-[1.3fr_1fr_1fr_auto]"
            >
              <div className="md:col-span-full">
                <span className="inline-flex items-center rounded-full bg-[#1d1d1f] dark:bg-white px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-white dark:text-[#1d1d1f]">
                  Enter any one
                </span>
              </div>
              <label className="block text-sm">
                <span className="mb-1.5 block text-[13px] font-medium text-[#1d1d1f] dark:text-[#f5f5f7]">
                  Order number
                </span>
                <input
                  value={lookup.orderNumber}
                  onChange={(event) =>
                    handleLookupChange("orderNumber", event.target.value)
                  }
                  placeholder="e.g. ORD-1A2B3C"
                  className="w-full rounded-xl border border-black/10 bg-white px-4 h-11 text-[15px] text-[#1d1d1f] outline-none transition focus:border-[#1d1d1f] focus:ring-2 focus:ring-[#1d1d1f]/15 dark:border-white/10 dark:bg-[#1d1d1f] dark:text-white dark:focus:border-white dark:focus:ring-white/20 placeholder-[#86868b]"
                />
              </label>
              <label className="block text-sm">
                <span className="mb-1.5 block text-[13px] font-medium text-[#1d1d1f] dark:text-[#f5f5f7]">
                  Phone
                </span>
                <input
                  value={lookup.phone}
                  onChange={(event) =>
                    handleLookupChange("phone", event.target.value)
                  }
                  placeholder="Checkout phone"
                  className="w-full rounded-xl border border-black/10 bg-white px-4 h-11 text-[15px] text-[#1d1d1f] outline-none transition focus:border-[#1d1d1f] focus:ring-2 focus:ring-[#1d1d1f]/15 dark:border-white/10 dark:bg-[#1d1d1f] dark:text-white dark:focus:border-white dark:focus:ring-white/20 placeholder-[#86868b]"
                />
              </label>
              <label className="block text-sm">
                <span className="mb-1.5 block text-[13px] font-medium text-[#1d1d1f] dark:text-[#f5f5f7]">
                  Email
                </span>
                <input
                  value={lookup.email}
                  onChange={(event) =>
                    handleLookupChange("email", event.target.value)
                  }
                  placeholder="Checkout email"
                  className="w-full rounded-xl border border-black/10 bg-white px-4 h-11 text-[15px] text-[#1d1d1f] outline-none transition focus:border-[#1d1d1f] focus:ring-2 focus:ring-[#1d1d1f]/15 dark:border-white/10 dark:bg-[#1d1d1f] dark:text-white dark:focus:border-white dark:focus:ring-white/20 placeholder-[#86868b]"
                />
              </label>
              <div className="flex items-end">
                <button
                  type="submit"
                  disabled={isSearching}
                  className="flex w-full items-center justify-center gap-2 rounded-full h-11 px-5 bg-[#1d1d1f] hover:bg-black dark:bg-white dark:hover:bg-[#f5f5f7] text-[15px] font-medium text-white dark:text-[#1d1d1f] transition disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSearching ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Checking</span>
                    </>
                  ) : (
                    <>
                      <Search className="h-4 w-4" />
                      <span>Track</span>
                    </>
                  )}
                </button>
              </div>
            </form>

            {!trackedOrder && matchedOrders.length === 0 && (
              <div className="mt-5 rounded-2xl bg-[#f5f5f7] dark:bg-[#2c2c2e] p-5 text-[13px] text-[#6e6e73] dark:text-[#a1a1a6]">
                Enter whichever detail you remember — order number, phone, or
                email. Adding more than one narrows the search.
              </div>
            )}

            {matchedOrders.length > 1 && !trackedOrder && (
              <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900/30">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h3 className="font-semibold text-slate-900 dark:text-white">
                      Matching orders
                    </h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      Select the order you want to track.
                    </p>
                  </div>
                  <span className="rounded-full bg-[#1d1d1f] dark:bg-white px-3 py-1 text-[13px] font-semibold text-white dark:text-[#1d1d1f]">
                    {matchedOrders.length} found
                  </span>
                </div>

                <div className="mt-4 space-y-3">
                  {matchedOrders.map((order) => (
                    <button
                      key={order.id}
                      onClick={() => handleSelectOrder(order)}
                      className="w-full rounded-2xl border border-black/10 dark:border-white/10 p-4 text-left transition hover:border-[#1d1d1f] dark:hover:border-white hover:bg-[#f5f5f7] dark:hover:bg-[#2c2c2e]"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="font-semibold text-slate-900 dark:text-white">
                            {getOrderReference(order)}
                          </p>
                          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                            Placed {formatDateTime(order.created_at)}
                          </p>
                        </div>
                        <div className="text-right">
                          <span
                            className={`inline-flex rounded-full border px-3 py-1 text-sm font-semibold ${getOrderStatusBadgeClass(
                              order.status,
                            )}`}
                          >
                            {getOrderStatusLabel(order.status)}
                          </span>
                          <p className="mt-2 font-semibold text-slate-900 dark:text-white">
                            KES {order.total_amount.toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {trackedOrder && (
              <div className="mt-6 space-y-6">
                <div className="grid gap-4 md:grid-cols-[1.2fr_0.8fr]">
                  <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900/30">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                          Order
                        </p>
                        <h3 className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">
                          {getOrderReference(trackedOrder)}
                        </h3>
                        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                          Last updated{" "}
                          {getRelativeTime(trackedOrder.updated_at)}
                        </p>
                      </div>
                      <span
                        className={`rounded-full border px-3 py-1 text-sm font-semibold ${getOrderStatusBadgeClass(
                          trackedOrder.status,
                        )}`}
                      >
                        {getOrderStatusLabel(trackedOrder.status)}
                      </span>
                    </div>

                    {visibleTimeline.length > 0 && (
                      <div className="mt-6 space-y-3">
                        <div>
                          <h4 className="font-semibold text-slate-900 dark:text-white">
                            Latest updates
                          </h4>
                          <p className="text-sm text-slate-500 dark:text-slate-400">
                            Follow the order timeline from the store.
                          </p>
                        </div>
                        {visibleTimeline
                          .slice()
                          .reverse()
                          .map((entry) => (
                            <div
                              key={entry.id}
                              className="rounded-2xl border border-slate-200 p-4 dark:border-slate-700"
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div>
                                  <p className="font-semibold text-slate-900 dark:text-white">
                                    {entry.title}
                                  </p>
                                  {entry.note && (
                                    <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                                      {entry.note}
                                    </p>
                                  )}
                                  {(entry.actor_name || entry.actor_email) && (
                                    <p className="mt-2 text-xs uppercase tracking-wide text-slate-400 dark:text-slate-500">
                                      {entry.actor_name || entry.actor_email}
                                    </p>
                                  )}
                                </div>
                                <div className="text-right text-xs text-slate-500 dark:text-slate-400">
                                  <p>{formatDateTime(entry.created_at)}</p>
                                </div>
                              </div>
                            </div>
                          ))}
                      </div>
                    )}

                    {trackedOrder.status === "cancelled" ? (
                      <div className="mt-5 flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800 dark:border-rose-800 dark:bg-rose-900/20 dark:text-rose-200">
                        <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0" />
                        <p>
                          This order has been cancelled. If this was unexpected,
                          contact the shop using the phone number below.
                        </p>
                      </div>
                    ) : (
                      <div className="mt-6 grid gap-3">
                        {customerVisibleStatusSteps.map((step, index) => {
                          const complete = activeStepIndex >= index;
                          const current = activeStepIndex === index;

                          return (
                            <div
                              key={step}
                              className="flex items-start gap-3 rounded-2xl border border-slate-200 p-3 dark:border-slate-700"
                            >
                              <div className="pt-0.5">
                                {complete ? (
                                  <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                                ) : current ? (
                                  <Clock className="h-5 w-5 text-amber-500" />
                                ) : (
                                  <Circle className="h-5 w-5 text-slate-300 dark:text-slate-600" />
                                )}
                              </div>
                              <div>
                                <p className="font-semibold text-slate-900 dark:text-white">
                                  {getOrderStatusLabel(step)}
                                </p>
                                <p className="text-sm text-slate-500 dark:text-slate-400">
                                  {getOrderStatusDescription(step)}
                                </p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  <div className="space-y-4">
                    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900/30">
                      <h4 className="font-semibold text-slate-900 dark:text-white">
                        Delivery details
                      </h4>
                      <div className="mt-4 space-y-3 text-sm text-slate-600 dark:text-slate-400">
                        <div className="flex items-start gap-3">
                          <Phone className="mt-0.5 h-4 w-4 text-[#86868b]" />
                          <span>{trackedOrder.customer_phone}</span>
                        </div>
                        {trackedOrder.customer_email && (
                          <div className="flex items-start gap-3">
                            <Mail className="mt-0.5 h-4 w-4 text-[#86868b]" />
                            <span>{trackedOrder.customer_email}</span>
                          </div>
                        )}
                        <div className="flex items-start gap-3">
                          <MapPin className="mt-0.5 h-4 w-4 text-[#86868b]" />
                          <span>{trackedOrder.delivery_address}</span>
                        </div>
                        <div className="flex items-start gap-3">
                          <Calendar className="mt-0.5 h-4 w-4 text-[#86868b]" />
                          <span>
                            Placed {formatDateTime(trackedOrder.created_at)}
                          </span>
                        </div>
                        <div className="flex items-start gap-3">
                          <CreditCard className="mt-0.5 h-4 w-4 text-[#86868b]" />
                          <span>
                            {trackedOrder.payment_method} payment,{" "}
                            {trackedOrder.payment_status}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-2xl bg-[#f5f5f7] dark:bg-[#2c2c2e] p-5">
                      <div className="flex items-start gap-3">
                        <Truck className="mt-0.5 h-5 w-5 text-[#1d1d1f] dark:text-white" />
                        <div>
                          <h4 className="font-semibold text-[#1d1d1f] dark:text-white">
                            Need help?
                          </h4>
                          <p className="mt-1 text-[13px] text-[#6e6e73] dark:text-[#a1a1a6]">
                            Keep your order number handy if you call the store
                            for an update.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900/30">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <h4 className="font-semibold text-slate-900 dark:text-white">
                        Items in this order
                      </h4>
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        {trackedOrder.order_items?.length ?? 0} item
                        {trackedOrder.order_items?.length === 1 ? "" : "s"}
                      </p>
                    </div>
                    <div className="rounded-2xl bg-slate-100 px-4 py-2 text-right dark:bg-slate-800">
                      <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
                        Total
                      </p>
                      <p className="font-bold text-slate-900 dark:text-white">
                        KES {trackedOrder.total_amount.toLocaleString()}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 space-y-3">
                    {trackedOrder.order_items?.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between rounded-2xl border border-slate-200 p-3 dark:border-slate-700"
                      >
                        <div className="min-w-0">
                          <p className="truncate font-medium text-slate-900 dark:text-white">
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
            )}
          </div>
        </div>
      </div>
    );
  },
);

OrderTrackingModal.displayName = "OrderTrackingModal";

export default OrderTrackingModal;
