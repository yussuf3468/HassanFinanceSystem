import { useEffect, useState, useCallback, useMemo } from "react";
import {
  Package,
  Search,
  Filter,
  Eye,
  CheckCircle,
  Clock,
  Truck,
  AlertCircle,
  Phone,
  Mail,
  MapPin,
  Calendar,
  DollarSign,
  Trash2,
  Download,
  RefreshCw,
  X,
  ChevronDown,
  TrendingUp,
  ShoppingBag,
  CreditCard,
  CheckCircle2,
  XCircle,
  ImageIcon,
  FileText,
  ExternalLink,
  AlertTriangle,
  ArrowUpDown,
  ChevronRight,
} from "lucide-react";
import compactToast from "../utils/compactToast";
import { supabase } from "../lib/supabase";
import type { Order } from "../types";
import { toast } from "react-toastify";
import { formatDate } from "../utils/dateFormatter";

const Orders = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"date" | "amount" | "status">("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showOrderDetails, setShowOrderDetails] = useState(false);
  const [verifyingPayment, setVerifyingPayment] = useState<string | null>(null);
  const [dateFilter, setDateFilter] = useState<string>("all");

  const loadOrders = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("orders")
        .select(
          `
          *,
          order_items (
            id,
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
        console.error("Error loading orders:", error);
        compactToast.error("Failed to load orders");
        return;
      }

      setOrders((data as unknown as Order[]) || []);
    } catch (error) {
      console.error("Error loading orders:", error);
      compactToast.error("Failed to load orders");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  const verifyPayment = useCallback(
    async (orderId: string, approve: boolean) => {
      setVerifyingPayment(orderId);
      try {
        // Update payment verification status
        const { error } = await supabase
          .from("orders")
          .update({
            payment_status: approve ? "paid" : "failed",
            payment_verified_at: new Date().toISOString(),
            status: approve ? "confirmed" : "pending",
          })
          .eq("id", orderId);

        if (error) throw error;

        // Update local state
        setOrders((prev) =>
          prev.map((order) =>
            order.id === orderId
              ? {
                  ...order,
                  payment_status: (approve ? "paid" : "failed") as any,
                  payment_verified_at: new Date().toISOString(),
                  status: (approve ? "confirmed" : "pending") as any,
                }
              : order,
          ),
        );

        if (selectedOrder && selectedOrder.id === orderId) {
          setSelectedOrder((prev) =>
            prev
              ? {
                  ...prev,
                  payment_status: (approve ? "paid" : "failed") as any,
                  payment_verified_at: new Date().toISOString(),
                  status: (approve ? "confirmed" : "pending") as any,
                }
              : null,
          );
        }

        toast.success(
          approve ? "Payment verified successfully!" : "Payment rejected",
        );
      } catch (error) {
        console.error("Error verifying payment:", error);
        toast.error("Failed to verify payment");
      } finally {
        setVerifyingPayment(null);
      }
    },
    [selectedOrder],
  );

  const updateOrderStatus = useCallback(
    async (orderId: string, newStatus: Order["status"]) => {
      try {
        const { error } = await supabase
          .from("orders")
          .update({
            status: newStatus as any,
            updated_at: new Date().toISOString(),
          })
          .eq("id", orderId);

        if (error) {
          console.error("Error updating order status:", error);
          toast.error("Failed to update order status");
          return;
        }

        // Update local state
        setOrders((prev) =>
          prev.map((order) =>
            order.id === orderId
              ? {
                  ...order,
                  status: newStatus,
                  updated_at: new Date().toISOString(),
                }
              : order,
          ),
        );

        if (selectedOrder && selectedOrder.id === orderId) {
          setSelectedOrder((prev) =>
            prev ? { ...prev, status: newStatus } : null,
          );
        }

        toast.success(`Order status updated to ${newStatus}`);
      } catch (error) {
        console.error("Error updating order status:", error);
        toast.error("Failed to update order status");
      }
    },
    [selectedOrder],
  );

  const deleteOrder = useCallback(
    async (orderId: string, orderNumber: string) => {
      const confirmDelete = window.confirm(
        `Are you sure you want to delete order ${orderNumber}?\n\nThis will:\n1. Delete all order items\n2. Delete the order permanently\n\nThis action cannot be undone!`,
      );

      if (!confirmDelete) return;

      try {
        // First delete order items
        const { error: itemsError } = await supabase
          .from("order_items")
          .delete()
          .eq("order_id", orderId);

        if (itemsError) {
          console.error("Error deleting order items:", itemsError);
          toast.error("Failed to delete order items");
          return;
        }

        // Then delete the order
        const { error: orderError } = await supabase
          .from("orders")
          .delete()
          .eq("id", orderId);

        if (orderError) {
          console.error("Error deleting order:", orderError);
          toast.error("Failed to delete order");
          return;
        }

        // Update local state
        setOrders((prev) => prev.filter((order) => order.id !== orderId));

        // Close modal if this order was open
        if (selectedOrder && selectedOrder.id === orderId) {
          setShowOrderDetails(false);
          setSelectedOrder(null);
        }

        toast.success(`Order ${orderNumber} deleted successfully`);
      } catch (error) {
        console.error("Error deleting order:", error);
        toast.error("Failed to delete order");
      }
    },
    [selectedOrder],
  );

  const filteredOrders = useMemo(() => {
    let filtered = orders;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(
        (order) =>
          order.order_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
          order.customer_name
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          order.customer_phone.includes(searchTerm),
      );
    }

    // Filter by status
    if (statusFilter !== "all") {
      filtered = filtered.filter((order) => order.status === statusFilter);
    }

    // Filter by payment status
    if (paymentStatusFilter !== "all") {
      filtered = filtered.filter(
        (order) => order.payment_status === paymentStatusFilter,
      );
    }

    // Filter by date
    if (dateFilter !== "all") {
      const now = new Date();
      filtered = filtered.filter((order) => {
        const orderDate = new Date(order.created_at);
        switch (dateFilter) {
          case "today":
            return orderDate.toDateString() === now.toDateString();
          case "week":
            const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            return orderDate >= weekAgo;
          case "month":
            const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            return orderDate >= monthAgo;
          default:
            return true;
        }
      });
    }

    // Sort orders
    filtered.sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case "date":
          comparison =
            new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
          break;
        case "amount":
          comparison = a.total_amount - b.total_amount;
          break;
        case "status":
          comparison = a.status.localeCompare(b.status);
          break;
      }
      return sortOrder === "asc" ? comparison : -comparison;
    });

    return filtered;
  }, [
    orders,
    searchTerm,
    statusFilter,
    paymentStatusFilter,
    dateFilter,
    sortBy,
    sortOrder,
  ]);

  const exportOrders = useCallback(() => {
    const csvData = filteredOrders.map((order) => ({
      OrderNumber: order.order_number,
      Date: new Date(order.created_at).toLocaleDateString(),
      Customer: order.customer_name,
      Phone: order.customer_phone,
      Status: order.status,
      PaymentMethod: order.payment_method,
      PaymentStatus: order.payment_status || "N/A",
      Items: order.order_items?.length || 0,
      Total: order.total_amount,
    }));

    const csv = [
      Object.keys(csvData[0]).join(","),
      ...csvData.map((row) => Object.values(row).join(",")),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `orders-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);

    toast.success("Orders exported successfully!");
  }, [filteredOrders]);

  const getStatusColor = (status: Order["status"]) => {
    switch (status) {
      case "pending":
        return "bg-amber-600/20 text-amber-400 border border-amber-500/30";
      case "confirmed":
        return "bg-gradient-to-br from-amber-50/40 to-white text-amber-800 font-semibold border border-amber-300";
      case "processing":
        return "bg-gradient-to-br from-amber-50/40 to-white text-amber-800 font-semibold border border-amber-300";
      case "shipped":
        return "bg-gradient-to-br from-amber-50/40 to-white text-amber-800 font-semibold border border-amber-300";
      case "delivered":
        return "bg-emerald-600/20 text-emerald-400 border border-emerald-500/30";
      case "cancelled":
        return "bg-rose-600/20 text-rose-400 border border-rose-500/30";
      default:
        return "bg-slate-600/20 text-slate-700 border border-slate-500/30";
    }
  };

  const getStatusIcon = (status: Order["status"]) => {
    switch (status) {
      case "pending":
        return <Clock className="w-4 h-4" />;
      case "confirmed":
        return <CheckCircle className="w-4 h-4" />;
      case "processing":
        return <Package className="w-4 h-4" />;
      case "shipped":
        return <Truck className="w-4 h-4" />;
      case "delivered":
        return <CheckCircle className="w-4 h-4" />;
      case "cancelled":
        return <AlertCircle className="w-4 h-4" />;
      default:
        return <Package className="w-4 h-4" />;
    }
  };

  const orderStats = useMemo(() => {
    const stats = {
      total: orders.length,
      pending: 0,
      confirmed: 0,
      processing: 0,
      shipped: 0,
      delivered: 0,
      cancelled: 0,
      totalRevenue: 0,
      pendingPayments: 0,
      verifiedPayments: 0,
      todayOrders: 0,
      todayRevenue: 0,
    };

    const today = new Date().toDateString();

    orders.forEach((order) => {
      stats[order.status]++;
      if (order.status !== "cancelled") {
        stats.totalRevenue += order.total_amount;
      }
      if (order.payment_status === "pending") {
        stats.pendingPayments++;
      }
      if (order.payment_status === "paid") {
        stats.verifiedPayments++;
      }
      if (new Date(order.created_at).toDateString() === today) {
        stats.todayOrders++;
        stats.todayRevenue += order.total_amount;
      }
    });

    return stats;
  }, [orders]);

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gradient-to-r from-amber-200/30 to-yellow-200/30 rounded-xl w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="h-32 bg-gradient-to-br from-amber-50/50 to-yellow-50/50 rounded-2xl border border-amber-200/50"
              ></div>
            ))}
          </div>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="h-24 bg-gradient-to-br from-amber-50/50 to-yellow-50/50 rounded-2xl border border-amber-200/50"
              ></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Actions */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black bg-gradient-to-r from-amber-600 to-yellow-600 bg-clip-text text-transparent">
            Orders Management
          </h1>
          <p className="text-slate-200 dark:text-slate-300 text-base mt-1 font-semibold">
            Manage and track all customer orders
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={loadOrders}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white rounded-xl font-semibold shadow-lg shadow-amber-500/30 transition-all duration-300 hover:scale-105"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
          <button
            onClick={exportOrders}
            disabled={filteredOrders.length === 0}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white rounded-xl font-semibold shadow-lg shadow-emerald-500/30 transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Enhanced Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Orders */}
        <div className="relative overflow-hidden bg-gradient-to-br from-amber-500 via-amber-600 to-yellow-600 p-6 rounded-2xl shadow-xl shadow-amber-500/30 hover:shadow-2xl hover:shadow-amber-500/40 transition-all duration-300 hover:-translate-y-1">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-black/10 rounded-full -ml-12 -mb-12"></div>
          <div className="relative">
            <div className="flex items-center justify-between mb-3">
              <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                <Package className="w-6 h-6 text-white" />
              </div>
              <TrendingUp className="w-5 h-5 text-white/80" />
            </div>
            <p className="text-white text-sm font-bold mb-1">Total Orders</p>
            <p className="text-4xl font-black text-white mb-1">
              {orderStats.total}
            </p>
            <p className="text-sm text-white font-semibold">
              {orderStats.todayOrders} today
            </p>
          </div>
        </div>

        {/* Revenue */}
        <div className="relative overflow-hidden bg-gradient-to-br from-emerald-500 via-green-600 to-emerald-700 p-6 rounded-2xl shadow-xl shadow-emerald-500/30 hover:shadow-2xl hover:shadow-emerald-500/40 transition-all duration-300 hover:-translate-y-1">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-black/10 rounded-full -ml-12 -mb-12"></div>
          <div className="relative">
            <div className="flex items-center justify-between mb-3">
              <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                <DollarSign className="w-6 h-6 text-white" />
              </div>
              <TrendingUp className="w-5 h-5 text-white/80" />
            </div>
            <p className="text-white text-sm font-bold mb-1">Total Revenue</p>
            <p className="text-3xl font-black text-white mb-1">
              KES {orderStats.totalRevenue.toLocaleString()}
            </p>
            <p className="text-sm text-white font-semibold">
              KES {orderStats.todayRevenue.toLocaleString()} today
            </p>
          </div>
        </div>

        {/* Pending Orders */}
        <div className="relative overflow-hidden bg-gradient-to-br from-orange-500 via-amber-600 to-orange-700 p-6 rounded-2xl shadow-xl shadow-orange-500/30 hover:shadow-2xl hover:shadow-orange-500/40 transition-all duration-300 hover:-translate-y-1">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-black/10 rounded-full -ml-12 -mb-12"></div>
          <div className="relative">
            <div className="flex items-center justify-between mb-3">
              <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                <Clock className="w-6 h-6 text-white" />
              </div>
              <AlertCircle className="w-5 h-5 text-white/80" />
            </div>
            <p className="text-white text-sm font-bold mb-1">Pending</p>
            <p className="text-4xl font-black text-white mb-1">
              {orderStats.pending}
            </p>
            <p className="text-sm text-white font-semibold">
              {orderStats.pendingPayments} payment pending
            </p>
          </div>
        </div>

        {/* Delivered */}
        <div className="relative overflow-hidden bg-gradient-to-br from-blue-500 via-indigo-600 to-blue-700 p-6 rounded-2xl shadow-xl shadow-blue-500/30 hover:shadow-2xl hover:shadow-blue-500/40 transition-all duration-300 hover:-translate-y-1">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-black/10 rounded-full -ml-12 -mb-12"></div>
          <div className="relative">
            <div className="flex items-center justify-between mb-3">
              <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                <CheckCircle className="w-6 h-6 text-white" />
              </div>
              <TrendingUp className="w-5 h-5 text-white/80" />
            </div>
            <p className="text-white text-sm font-bold mb-1">Delivered</p>
            <p className="text-4xl font-black text-white mb-1">
              {orderStats.delivered}
            </p>
            <p className="text-sm text-white font-semibold">
              {orderStats.verifiedPayments} payments verified
            </p>
          </div>
        </div>
      </div>

      {/* Advanced Filters */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-lg border border-amber-200/50 dark:border-slate-700">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="w-5 h-5 text-amber-600" />
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">
            Filters & Search
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Search */}
          <div className="lg:col-span-2">
            <label className="block text-xs font-semibold text-amber-800 dark:text-amber-300 mb-2 uppercase tracking-wide">
              Search Orders
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-amber-500 w-5 h-5" />
              <input
                type="text"
                placeholder="Order number, customer name, phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-white dark:bg-slate-700 border-2 border-amber-300 focus:border-amber-500 rounded-xl text-slate-900 dark:text-white placeholder-amber-500 dark:placeholder-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-500/30 transition-all font-medium"
              />
            </div>
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-xs font-semibold text-amber-800 dark:text-amber-300 mb-2 uppercase tracking-wide">
              Order Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-4 py-3 bg-white dark:bg-slate-700 border-2 border-amber-300 focus:border-amber-500 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/30 transition-all font-bold"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="processing">Processing</option>
              <option value="shipped">Shipped</option>
              <option value="delivered">Delivered</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          {/* Payment Status Filter */}
          <div>
            <label className="block text-xs font-semibold text-amber-800 dark:text-amber-300 mb-2 uppercase tracking-wide">
              Payment Status
            </label>
            <select
              value={paymentStatusFilter}
              onChange={(e) => setPaymentStatusFilter(e.target.value)}
              className="w-full px-4 py-3 bg-white dark:bg-slate-700 border-2 border-amber-300 focus:border-amber-500 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/30 transition-all font-bold"
            >
              <option value="all">All Payments</option>
              <option value="pending">Pending</option>
              <option value="paid">Paid</option>
              <option value="failed">Failed</option>
            </select>
          </div>

          {/* Date Filter */}
          <div>
            <label className="block text-xs font-semibold text-amber-800 dark:text-amber-300 mb-2 uppercase tracking-wide">
              Date Range
            </label>
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="w-full px-4 py-3 bg-white dark:bg-slate-700 border-2 border-amber-300 focus:border-amber-500 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/30 transition-all font-bold"
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="week">Last 7 Days</option>
              <option value="month">Last 30 Days</option>
            </select>
          </div>
        </div>

        {/* Sort Options */}
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <span className="text-xs font-semibold text-amber-800 dark:text-amber-300 uppercase tracking-wide">
            Sort by:
          </span>
          <div className="flex gap-2">
            {[
              { value: "date", label: "Date", icon: Calendar },
              { value: "amount", label: "Amount", icon: DollarSign },
              { value: "status", label: "Status", icon: Package },
            ].map(({ value, label, icon: Icon }) => (
              <button
                key={value}
                onClick={() => {
                  if (sortBy === value) {
                    setSortOrder(sortOrder === "asc" ? "desc" : "asc");
                  } else {
                    setSortBy(value as any);
                    setSortOrder("desc");
                  }
                }}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold transition-all ${
                  sortBy === value
                    ? "bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-lg shadow-amber-500/30"
                    : "bg-white dark:bg-slate-700 text-slate-900 dark:text-white hover:bg-amber-100 border-2 border-amber-300"
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
                {sortBy === value && (
                  <ArrowUpDown
                    className={`w-4 h-4 ${
                      sortOrder === "desc" ? "rotate-180" : ""
                    }`}
                  />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Active Filters Display */}
        {(searchTerm ||
          statusFilter !== "all" ||
          paymentStatusFilter !== "all" ||
          dateFilter !== "all") && (
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-amber-800 dark:text-amber-300 uppercase tracking-wide">
              Active Filters:
            </span>
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="flex items-center gap-1 px-3 py-1 bg-amber-100 text-amber-700 rounded-lg text-xs font-semibold hover:bg-amber-200 transition-colors"
              >
                Search: {searchTerm}
                <X className="w-3 h-3" />
              </button>
            )}
            {statusFilter !== "all" && (
              <button
                onClick={() => setStatusFilter("all")}
                className="flex items-center gap-1 px-3 py-1 bg-amber-100 text-amber-700 rounded-lg text-xs font-semibold hover:bg-amber-200 transition-colors"
              >
                Status: {statusFilter}
                <X className="w-3 h-3" />
              </button>
            )}
            {paymentStatusFilter !== "all" && (
              <button
                onClick={() => setPaymentStatusFilter("all")}
                className="flex items-center gap-1 px-3 py-1 bg-amber-100 text-amber-700 rounded-lg text-xs font-semibold hover:bg-amber-200 transition-colors"
              >
                Payment: {paymentStatusFilter}
                <X className="w-3 h-3" />
              </button>
            )}
            {dateFilter !== "all" && (
              <button
                onClick={() => setDateFilter("all")}
                className="flex items-center gap-1 px-3 py-1 bg-amber-100 text-amber-700 rounded-lg text-xs font-semibold hover:bg-amber-200 transition-colors"
              >
                Date: {dateFilter}
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Results Summary */}
      <div className="flex flex-col sm:flex-row items-center justify-between bg-gradient-to-r from-amber-50 to-yellow-50 border-2 border-amber-300 rounded-xl p-4">
        <div className="flex items-center gap-2 text-base font-black">
          <ShoppingBag className="w-5 h-5 text-amber-600" />
          <span style={{ color: "#0f172a" }}>Showing</span>{" "}
          <span className="text-amber-600 font-black">
            {filteredOrders.length}
          </span>{" "}
          <span style={{ color: "#0f172a" }}>of</span>{" "}
          <span className="text-amber-600 font-black">{orders.length}</span>{" "}
          <span style={{ color: "#0f172a" }}>orders</span>
        </div>
      </div>

      {/* Enhanced Orders Table */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl border-2 border-amber-200/50 dark:border-slate-700 overflow-hidden">
        {filteredOrders.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-amber-100 dark:divide-slate-700">
              <thead className="bg-gradient-to-r from-amber-500 to-yellow-600">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-black text-white uppercase tracking-wider">
                    Order Details
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-black text-white uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-black text-white uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-black text-white uppercase tracking-wider">
                    Payment
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-black text-white uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-black text-white uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-black text-white uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-slate-800 divide-y divide-amber-100/30 dark:divide-slate-700/50">
                {filteredOrders.map((order, index) => (
                  <tr
                    key={order.id}
                    className={`group hover:bg-gradient-to-r hover:from-amber-50/50 hover:to-yellow-50/30 dark:hover:from-slate-700/50 dark:hover:to-slate-700/30 transition-all duration-200 ${
                      index % 2 === 0
                        ? "bg-amber-50/20 dark:bg-slate-900/20"
                        : ""
                    }`}
                  >
                    {/* Order Details */}
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-black text-amber-600 dark:text-amber-500">
                            {order.order_number}
                          </span>
                          {order.payment_status === "pending" &&
                            order.payment_reference && (
                              <span className="px-2 py-0.5 bg-orange-100 text-orange-700 text-xs font-bold rounded-full flex items-center gap-1">
                                <AlertTriangle className="w-3 h-3" />
                                Verify
                              </span>
                            )}
                        </div>
                        <div className="flex items-center gap-1 text-xs text-slate-700 dark:text-slate-300">
                          <Package className="w-3 h-3" />
                          {order.order_items?.length || 0} item
                          {order.order_items?.length !== 1 ? "s" : ""}
                        </div>
                      </div>
                    </td>

                    {/* Customer */}
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        <div className="text-sm font-bold text-slate-900 dark:text-white">
                          {order.customer_name}
                        </div>
                        <div className="flex items-center gap-1 text-xs text-slate-700 dark:text-slate-300">
                          <Phone className="w-3 h-3" />
                          {order.customer_phone}
                        </div>
                      </div>
                    </td>

                    {/* Order Status */}
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold shadow-sm ${getStatusColor(
                          order.status,
                        )}`}
                      >
                        {getStatusIcon(order.status)}
                        <span className="capitalize">{order.status}</span>
                      </span>
                    </td>

                    {/* Payment Status */}
                    <td className="px-6 py-4">
                      {order.payment_status ? (
                        <div className="flex flex-col gap-1">
                          <span
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold shadow-sm ${
                              order.payment_status === "paid"
                                ? "bg-emerald-100 text-emerald-700 border border-emerald-300"
                                : order.payment_status === "pending"
                                ? "bg-amber-100 text-amber-700 border border-amber-300"
                                : "bg-red-100 text-red-700 border border-red-300"
                            }`}
                          >
                            {order.payment_status === "paid" ? (
                              <CheckCircle2 className="w-3 h-3" />
                            ) : order.payment_status === "pending" ? (
                              <Clock className="w-3 h-3" />
                            ) : (
                              <XCircle className="w-3 h-3" />
                            )}
                            <span className="capitalize">
                              {order.payment_status}
                            </span>
                          </span>
                          {order.payment_method && (
                            <span className="text-xs text-slate-700 dark:text-slate-300 flex items-center gap-1">
                              <CreditCard className="w-3 h-3" />
                              {order.payment_method}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400 dark:text-slate-500 italic">
                          No payment info
                        </span>
                      )}
                    </td>

                    {/* Amount */}
                    <td className="px-6 py-4">
                      <div className="text-base font-black text-slate-900 dark:text-white">
                        KES {order.total_amount.toLocaleString()}
                      </div>
                      {order.delivery_fee > 0 && (
                        <div className="text-xs text-slate-700 dark:text-slate-300">
                          +{order.delivery_fee} delivery
                        </div>
                      )}
                    </td>

                    {/* Date */}
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        <div className="text-sm text-slate-700 dark:text-slate-300">
                          {formatDate(order.created_at)}
                        </div>
                        <div className="text-xs text-slate-700 dark:text-slate-300 flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(order.created_at).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </div>
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => {
                            setSelectedOrder(order);
                            setShowOrderDetails(true);
                          }}
                          className="p-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white rounded-lg transition-all duration-200 shadow-lg shadow-amber-500/30 hover:scale-110 hover:rotate-3"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() =>
                            deleteOrder(order.id, order.order_number)
                          }
                          className="p-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-all duration-200 shadow-lg shadow-red-500/30 hover:scale-110 hover:rotate-3"
                          title="Delete Order"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-16 px-4">
            <div className="flex justify-center mb-6">
              <div className="p-6 bg-gradient-to-br from-amber-100 to-yellow-100 rounded-2xl">
                <Package className="w-16 h-16 text-amber-600" />
              </div>
            </div>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-2">
              No orders found
            </h3>
            <p className="text-slate-600 dark:text-slate-400 text-base mb-4">
              {searchTerm ||
              statusFilter !== "all" ||
              paymentStatusFilter !== "all" ||
              dateFilter !== "all"
                ? "Try adjusting your search filters to find what you're looking for"
                : "Orders will appear here when customers place them"}
            </p>
            {(searchTerm ||
              statusFilter !== "all" ||
              paymentStatusFilter !== "all" ||
              dateFilter !== "all") && (
              <button
                onClick={() => {
                  setSearchTerm("");
                  setStatusFilter("all");
                  setPaymentStatusFilter("all");
                  setDateFilter("all");
                }}
                className="px-6 py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white rounded-xl font-bold shadow-lg shadow-amber-500/30 transition-all duration-300 hover:scale-105"
              >
                Clear All Filters
              </button>
            )}
          </div>
        )}
      </div>

      {/* Enhanced Order Details Modal */}
      {showOrderDetails && selectedOrder && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden border-4 border-amber-400/30">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 text-white p-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32"></div>
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-black/10 rounded-full -ml-24 -mb-24"></div>
              <div className="relative flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                      <Package className="w-6 h-6" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-black">Order Details</h2>
                      <p className="text-amber-100">
                        #{selectedOrder.order_number}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-3">
                    <span
                      className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold shadow-lg ${getStatusColor(
                        selectedOrder.status,
                      )} bg-white`}
                    >
                      {getStatusIcon(selectedOrder.status)}
                      <span className="capitalize">{selectedOrder.status}</span>
                    </span>
                    {selectedOrder.payment_status && (
                      <span
                        className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold shadow-lg ${
                          selectedOrder.payment_status === "paid"
                            ? "bg-emerald-100 text-emerald-700"
                            : selectedOrder.payment_status === "pending"
                            ? "bg-amber-100 text-amber-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {selectedOrder.payment_status === "paid" ? (
                          <CheckCircle2 className="w-4 h-4" />
                        ) : selectedOrder.payment_status === "pending" ? (
                          <Clock className="w-4 h-4" />
                        ) : (
                          <XCircle className="w-4 h-4" />
                        )}
                        <span className="capitalize">
                          Payment {selectedOrder.payment_status}
                        </span>
                      </span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => setShowOrderDetails(false)}
                  className="text-white hover:bg-white/20 p-2 rounded-xl transition-all"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)] bg-gradient-to-br from-amber-50/30 to-yellow-50/20 dark:from-slate-800 dark:to-slate-900">
              {/* Payment Verification Section */}
              {selectedOrder.payment_reference &&
                selectedOrder.payment_status === "pending" && (
                  <div className="mb-6 bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-900/20 dark:to-yellow-900/20 border-2 border-amber-300 rounded-2xl p-6 shadow-lg">
                    <div className="flex items-start gap-4 mb-4">
                      <div className="p-3 bg-amber-500 rounded-xl">
                        <AlertTriangle className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-black text-amber-900 dark:text-amber-100 mb-2">
                          Payment Verification Required
                        </h3>
                        <p className="text-sm text-amber-700 dark:text-amber-300 mb-4">
                          Customer has submitted payment details. Please verify
                          before confirming order.
                        </p>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                          <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-amber-200">
                            <p className="text-xs font-semibold text-amber-600 uppercase mb-1">
                              Payment Reference
                            </p>
                            <p className="font-black text-lg text-slate-900 dark:text-white">
                              {selectedOrder.payment_reference}
                            </p>
                          </div>
                          {selectedOrder.payment_receipt_code && (
                            <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-amber-200">
                              <p className="text-xs font-black text-amber-800 dark:text-amber-300 uppercase mb-1 tracking-wide">
                                Receipt Code
                              </p>
                              <p className="font-black text-lg text-slate-900 dark:text-white">
                                {selectedOrder.payment_receipt_code}
                              </p>
                            </div>
                          )}
                          {selectedOrder.payment_channel && (
                            <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-amber-200">
                              <p className="text-xs font-black text-amber-800 dark:text-amber-300 uppercase mb-1 tracking-wide">
                                Payment Channel
                              </p>
                              <p className="font-black text-slate-900 dark:text-white text-base capitalize">
                                {selectedOrder.payment_channel}
                              </p>
                            </div>
                          )}
                          {selectedOrder.payment_proof_url && (
                            <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-amber-200">
                              <p className="text-xs font-black text-amber-800 dark:text-amber-300 uppercase mb-2 tracking-wide">
                                Payment Proof
                              </p>
                              <a
                                href={selectedOrder.payment_proof_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 text-amber-600 hover:text-amber-700 font-bold"
                              >
                                <ImageIcon className="w-4 h-4" />
                                View Screenshot
                                <ExternalLink className="w-4 h-4" />
                              </a>
                            </div>
                          )}
                        </div>

                        <div className="flex gap-3">
                          <button
                            onClick={() =>
                              verifyPayment(selectedOrder.id, true)
                            }
                            disabled={verifyingPayment === selectedOrder.id}
                            className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white rounded-xl font-bold shadow-lg shadow-emerald-500/30 transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <CheckCircle2 className="w-5 h-5" />
                            {verifyingPayment === selectedOrder.id
                              ? "Verifying..."
                              : "Approve Payment"}
                          </button>
                          <button
                            onClick={() =>
                              verifyPayment(selectedOrder.id, false)
                            }
                            disabled={verifyingPayment === selectedOrder.id}
                            className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-xl font-bold shadow-lg shadow-red-500/30 transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <XCircle className="w-5 h-5" />
                            {verifyingPayment === selectedOrder.id
                              ? "Processing..."
                              : "Reject Payment"}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                {/* Customer Information Card */}
                <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg border-2 border-amber-200/50">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-gradient-to-br from-amber-500 to-amber-600 rounded-lg">
                      <Phone className="w-5 h-5 text-white" />
                    </div>
                    <h3 className="text-lg font-black text-slate-900 dark:text-white">
                      Customer Information
                    </h3>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 p-3 bg-amber-50 dark:bg-slate-700 rounded-xl border border-amber-200 dark:border-amber-700">
                      <Package className="w-4 h-4 text-amber-600" />
                      <div>
                        <p className="text-xs text-amber-800 dark:text-amber-300 font-bold uppercase tracking-wide">
                          Name
                        </p>
                        <p className="font-black text-slate-900 dark:text-white text-base">
                          {selectedOrder.customer_name}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-amber-50 dark:bg-slate-700 rounded-xl border border-amber-200 dark:border-amber-700">
                      <Phone className="w-4 h-4 text-amber-600" />
                      <div>
                        <p className="text-xs text-amber-800 dark:text-amber-300 font-bold uppercase tracking-wide">
                          Phone
                        </p>
                        <p className="font-black text-slate-900 dark:text-white text-base">
                          {selectedOrder.customer_phone}
                        </p>
                      </div>
                    </div>
                    {selectedOrder.customer_email && (
                      <div className="flex items-center gap-3 p-3 bg-amber-50 dark:bg-slate-700 rounded-xl border border-amber-200 dark:border-amber-700">
                        <Mail className="w-4 h-4 text-amber-600" />
                        <div>
                          <p className="text-xs text-amber-800 dark:text-amber-300 font-bold uppercase tracking-wide">
                            Email
                          </p>
                          <p className="font-black text-slate-900 dark:text-white text-base">
                            {selectedOrder.customer_email}
                          </p>
                        </div>
                      </div>
                    )}
                    <div className="flex items-start gap-3 p-3 bg-amber-50 dark:bg-slate-700 rounded-xl border border-amber-200 dark:border-amber-700">
                      <MapPin className="w-4 h-4 text-amber-600 mt-1" />
                      <div>
                        <p className="text-xs text-amber-800 dark:text-amber-300 font-bold uppercase tracking-wide">
                          Delivery Address
                        </p>
                        <p className="font-black text-slate-900 dark:text-white text-base">
                          {selectedOrder.delivery_address}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Order Information Card */}
                <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg border-2 border-amber-200/50">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-gradient-to-br from-amber-500 to-amber-600 rounded-lg">
                      <FileText className="w-5 h-5 text-white" />
                    </div>
                    <h3 className="text-lg font-black text-slate-900 dark:text-white">
                      Order Information
                    </h3>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 p-3 bg-amber-50 dark:bg-slate-700 rounded-xl border border-amber-200 dark:border-amber-700">
                      <Calendar className="w-4 h-4 text-amber-600" />
                      <div>
                        <p className="text-xs text-amber-800 dark:text-amber-300 font-bold uppercase tracking-wide">
                          Order Date
                        </p>
                        <p className="font-black text-slate-900 dark:text-white text-base">
                          {new Date(selectedOrder.created_at).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-amber-50 dark:bg-slate-700 rounded-xl border border-amber-200 dark:border-amber-700">
                      <CreditCard className="w-4 h-4 text-amber-600" />
                      <div>
                        <p className="text-xs text-amber-800 dark:text-amber-300 font-bold uppercase tracking-wide">
                          Payment Method
                        </p>
                        <p className="font-black text-slate-900 dark:text-white text-base capitalize">
                          {selectedOrder.payment_method}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-amber-50 dark:bg-slate-700 rounded-xl border border-amber-200 dark:border-amber-700">
                      <Package className="w-4 h-4 text-amber-600" />
                      <div>
                        <p className="text-xs text-amber-800 dark:text-amber-300 font-bold uppercase tracking-wide">
                          Items Count
                        </p>
                        <p className="font-black text-slate-900 dark:text-white text-base">
                          {selectedOrder.order_items?.length || 0} item(s)
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Order Items */}
              <div className="mb-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-gradient-to-br from-amber-500 to-amber-600 rounded-lg">
                    <ShoppingBag className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="text-xl font-black text-slate-900 dark:text-white">
                    Order Items
                  </h3>
                </div>
                <div className="bg-white dark:bg-slate-800 rounded-2xl overflow-hidden shadow-lg border-2 border-amber-200/50">
                  <div className="overflow-x-auto">
                    <table className="min-w-full">
                      <thead className="bg-gradient-to-r from-amber-500 to-yellow-600">
                        <tr>
                          <th className="px-6 py-4 text-left text-xs font-black text-white uppercase">
                            Product
                          </th>
                          <th className="px-6 py-4 text-center text-xs font-black text-white uppercase">
                            Quantity
                          </th>
                          <th className="px-6 py-4 text-right text-xs font-black text-white uppercase">
                            Unit Price
                          </th>
                          <th className="px-6 py-4 text-right text-xs font-black text-white uppercase">
                            Total
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-amber-100/50">
                        {selectedOrder.order_items?.map((item, index) => (
                          <tr
                            key={item.id}
                            className={`${
                              index % 2 === 0
                                ? "bg-amber-50 dark:bg-slate-700"
                                : "bg-white dark:bg-slate-800"
                            } hover:bg-amber-100 dark:hover:bg-slate-600 transition-colors`}
                          >
                            <td className="px-6 py-4 text-sm font-bold text-slate-900 dark:text-white">
                              {item.product_name}
                            </td>
                            <td className="px-6 py-4 text-center">
                              <span className="inline-flex items-center justify-center px-3 py-1 bg-amber-100 text-amber-700 rounded-lg font-bold">
                                {item.quantity}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-right text-sm font-bold text-slate-700 dark:text-slate-300">
                              KES {item.unit_price.toLocaleString()}
                            </td>
                            <td className="px-6 py-4 text-right text-base font-black text-slate-900 dark:text-white">
                              KES {item.total_price.toLocaleString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Order Summary */}
              <div className="mb-6">
                <div className="bg-gradient-to-br from-amber-500 via-yellow-500 to-amber-600 rounded-2xl p-6 shadow-xl text-white">
                  <h3 className="text-lg font-black mb-4 flex items-center gap-2">
                    <DollarSign className="w-5 h-5" />
                    Order Summary
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center text-amber-100">
                      <span>Subtotal:</span>
                      <span className="font-bold text-lg">
                        KES {selectedOrder.subtotal.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-amber-100">
                      <span>Delivery Fee:</span>
                      <span className="font-bold text-lg">
                        {selectedOrder.delivery_fee === 0
                          ? "FREE"
                          : `KES ${selectedOrder.delivery_fee.toLocaleString()}`}
                      </span>
                    </div>
                    <div className="border-t-2 border-white/30 pt-3 flex justify-between items-center">
                      <span className="text-xl font-black">Total Amount:</span>
                      <span className="text-3xl font-black">
                        KES {selectedOrder.total_amount.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Status Update Section */}
              <div className="mb-6">
                <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg border-2 border-amber-200/50">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-gradient-to-br from-amber-500 to-amber-600 rounded-lg">
                      <Truck className="w-5 h-5 text-white" />
                    </div>
                    <h3 className="text-xl font-black text-slate-900 dark:text-white">
                      Update Order Status
                    </h3>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-bold text-amber-800 dark:text-amber-300 mb-2 uppercase tracking-wide">
                        Current Status
                      </label>
                      <div
                        className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold ${getStatusColor(
                          selectedOrder.status,
                        )}`}
                      >
                        {getStatusIcon(selectedOrder.status)}
                        <span className="capitalize">
                          {selectedOrder.status}
                        </span>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-bold text-amber-800 dark:text-amber-300 mb-2 uppercase tracking-wide">
                        Change Status To
                      </label>
                      <select
                        value={selectedOrder.status}
                        onChange={(e) => {
                          const newStatus = e.target.value as Order["status"];
                          if (
                            newStatus === "cancelled" ||
                            newStatus === "delivered"
                          ) {
                            if (
                              window.confirm(
                                `Are you sure you want to mark this order as ${newStatus}?`,
                              )
                            ) {
                              updateOrderStatus(selectedOrder.id, newStatus);
                            }
                          } else {
                            updateOrderStatus(selectedOrder.id, newStatus);
                          }
                        }}
                        className="w-full px-4 py-3 bg-white dark:bg-slate-700 border-2 border-amber-300 focus:border-amber-500 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/30 transition-all font-bold text-base"
                      >
                        <option value="pending">
                          ⏱️ Pending - Awaiting confirmation
                        </option>
                        <option value="confirmed">
                          ✅ Confirmed - Order accepted
                        </option>
                        <option value="processing">
                          📦 Processing - Preparing items
                        </option>
                        <option value="shipped">
                          🚚 Shipped - Out for delivery
                        </option>
                        <option value="delivered">
                          ✨ Delivered - Completed
                        </option>
                        <option value="cancelled">
                          ❌ Cancelled - Order cancelled
                        </option>
                      </select>
                    </div>

                    <div className="bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-900/20 dark:to-yellow-900/20 border border-amber-300 rounded-xl p-4">
                      <p className="text-xs font-bold text-amber-800 dark:text-amber-300 mb-2">
                        💡 Status Guide
                      </p>
                      <ul className="text-xs text-slate-700 dark:text-slate-300 space-y-1">
                        <li>
                          <strong>Pending:</strong> Order received, awaiting
                          review
                        </li>
                        <li>
                          <strong>Confirmed:</strong> Order approved and in
                          queue
                        </li>
                        <li>
                          <strong>Processing:</strong> Items being
                          prepared/packed
                        </li>
                        <li>
                          <strong>Shipped:</strong> Order sent out for delivery
                        </li>
                        <li>
                          <strong>Delivered:</strong> Customer received the
                          order
                        </li>
                        <li>
                          <strong>Cancelled:</strong> Order cancelled (refund if
                          paid)
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              {/* Notes */}
              {selectedOrder.notes && (
                <div className="mb-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-gradient-to-br from-amber-500 to-amber-600 rounded-lg">
                      <FileText className="w-5 h-5 text-white" />
                    </div>
                    <h3 className="text-xl font-black text-slate-900 dark:text-white">
                      Order Notes
                    </h3>
                  </div>
                  <div className="bg-gradient-to-br from-amber-50 to-yellow-50 border-2 border-amber-200 rounded-2xl p-4">
                    <p className="text-slate-700 dark:text-slate-300 italic">
                      "{selectedOrder.notes}"
                    </p>
                  </div>
                </div>
              )}

              {/* Delete Order Section */}
              <div className="pt-6 border-t-2 border-amber-200/50">
                <button
                  onClick={() => {
                    deleteOrder(selectedOrder.id, selectedOrder.order_number);
                    setShowOrderDetails(false);
                  }}
                  className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white px-6 py-4 rounded-xl font-bold shadow-xl shadow-red-500/30 transition-all duration-300 hover:scale-105"
                >
                  <Trash2 className="w-5 h-5" />
                  Delete Order Permanently
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Orders;
