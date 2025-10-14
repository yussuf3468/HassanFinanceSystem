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
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showOrderDetails, setShowOrderDetails] = useState(false);

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
        `
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
              : order
          )
        );

        if (selectedOrder && selectedOrder.id === orderId) {
          setSelectedOrder((prev) =>
            prev ? { ...prev, status: newStatus } : null
          );
        }

        toast.success(`Order status updated to ${newStatus}`);
      } catch (error) {
        console.error("Error updating order status:", error);
        toast.error("Failed to update order status");
      }
    },
    [selectedOrder]
  );

  const deleteOrder = useCallback(
    async (orderId: string, orderNumber: string) => {
      const confirmDelete = window.confirm(
        `Are you sure you want to delete order ${orderNumber}?\n\nThis will:\n1. Delete all order items\n2. Delete the order permanently\n\nThis action cannot be undone!`
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
    [selectedOrder]
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
          order.customer_phone.includes(searchTerm)
      );
    }

    // Filter by status
    if (statusFilter !== "all") {
      filtered = filtered.filter((order) => order.status === statusFilter);
    }

    return filtered;
  }, [orders, searchTerm, statusFilter]);

  const getStatusColor = (status: Order["status"]) => {
    switch (status) {
      case "pending":
        return "bg-amber-600/20 text-amber-400 border border-amber-500/30";
      case "confirmed":
        return "bg-blue-600/20 text-blue-400 border border-blue-500/30";
      case "processing":
        return "bg-purple-600/20 text-purple-400 border border-purple-500/30";
      case "shipped":
        return "bg-indigo-600/20 text-indigo-400 border border-indigo-500/30";
      case "delivered":
        return "bg-emerald-600/20 text-emerald-400 border border-emerald-500/30";
      case "cancelled":
        return "bg-rose-600/20 text-rose-400 border border-rose-500/30";
      default:
        return "bg-slate-600/20 text-slate-400 border border-slate-500/30";
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
    };

    orders.forEach((order) => {
      stats[order.status]++;
      if (order.status !== "cancelled") {
        stats.totalRevenue += order.total_amount;
      }
    });

    return stats;
  }, [orders]);

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-white/10 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-white/10 rounded"></div>
            ))}
          </div>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-20 bg-white/10 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <h1 className="text-lg md:text-xl font-black text-white mb-1">
          Orders Management
        </h1>
        <p className="text-slate-300 text-xs md:text-sm">
          Manage and track customer orders
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white/10 backdrop-blur-2xl p-4 rounded-2xl shadow-xl border border-white/20 hover:-translate-y-1 transition-all duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-300 uppercase tracking-wide">
                Total Orders
              </p>
              <p className="text-lg md:text-xl font-black text-white mt-1.5">
                {orderStats.total}
              </p>
            </div>
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg shadow-blue-500/30">
              <Package className="w-5 h-5 text-white" />
            </div>
          </div>
        </div>
        <div className="bg-white/10 backdrop-blur-2xl p-4 rounded-2xl shadow-xl border border-white/20 hover:-translate-y-1 transition-all duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-300 uppercase tracking-wide">
                Pending
              </p>
              <p className="text-lg md:text-xl font-black text-amber-400 mt-1.5">
                {orderStats.pending}
              </p>
            </div>
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 shadow-lg shadow-amber-500/30">
              <Clock className="w-5 h-5 text-white" />
            </div>
          </div>
        </div>
        <div className="bg-white/10 backdrop-blur-2xl p-4 rounded-2xl shadow-xl border border-white/20 hover:-translate-y-1 transition-all duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-300 uppercase tracking-wide">
                Delivered
              </p>
              <p className="text-lg md:text-xl font-black text-emerald-400 mt-1.5">
                {orderStats.delivered}
              </p>
            </div>
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 shadow-lg shadow-emerald-500/30">
              <CheckCircle className="w-5 h-5 text-white" />
            </div>
          </div>
        </div>
        <div className="bg-white/10 backdrop-blur-2xl p-4 rounded-2xl shadow-xl border border-white/20 hover:-translate-y-1 transition-all duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-300 uppercase tracking-wide">
                Revenue
              </p>
              <p className="text-base md:text-lg font-black text-white mt-1.5">
                KES {orderStats.totalRevenue.toLocaleString()}
              </p>
            </div>
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 shadow-lg shadow-green-500/30">
              <DollarSign className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white/10 backdrop-blur-2xl p-4 rounded-2xl shadow-xl border border-white/20">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search orders..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-white/10 border border-white/20 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
              />
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Filter className="w-5 h-5 text-slate-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-white/10 border border-white/20 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
            >
              <option value="all" className="bg-slate-800">
                All Status
              </option>
              <option value="pending" className="bg-slate-800">
                Pending
              </option>
              <option value="confirmed" className="bg-slate-800">
                Confirmed
              </option>
              <option value="processing" className="bg-slate-800">
                Processing
              </option>
              <option value="shipped" className="bg-slate-800">
                Shipped
              </option>
              <option value="delivered" className="bg-slate-800">
                Delivered
              </option>
              <option value="cancelled" className="bg-slate-800">
                Cancelled
              </option>
            </select>
          </div>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white/10 backdrop-blur-2xl rounded-2xl shadow-2xl border border-white/20 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-white/10">
            <thead className="bg-white/5">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Order
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Total
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-transparent divide-y divide-white/5">
              {filteredOrders.map((order) => (
                <tr
                  key={order.id}
                  className="hover:bg-white/5 transition-colors"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-bold text-white">
                        {order.order_number}
                      </div>
                      <div className="text-xs text-slate-400">
                        {order.order_items?.length || 0} items
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-bold text-white">
                        {order.customer_name}
                      </div>
                      <div className="text-xs text-slate-400">
                        {order.customer_phone}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${getStatusColor(
                        order.status
                      )}`}
                    >
                      {getStatusIcon(order.status)}
                      <span className="ml-1 capitalize">{order.status}</span>
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-white">
                    KES {order.total_amount.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">
                    {formatDate(order.created_at)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => {
                          setSelectedOrder(order);
                          setShowOrderDetails(true);
                        }}
                        className="text-blue-400 hover:text-blue-300 flex items-center space-x-1 hover:bg-blue-600/20 px-3 py-1.5 rounded-lg border border-blue-500/30 hover:border-blue-500/50 transition-all"
                      >
                        <Eye className="w-4 h-4" />
                        <span>View</span>
                      </button>
                      <button
                        onClick={() =>
                          deleteOrder(order.id, order.order_number)
                        }
                        className="text-red-400 hover:text-red-300 flex items-center space-x-1 hover:bg-red-600/20 px-3 py-1.5 rounded-lg border border-red-500/30 hover:border-red-500/50 transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                        <span>Delete</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredOrders.length === 0 && (
          <div className="text-center py-12">
            <div className="flex justify-center mb-4">
              <div className="p-4 bg-white/10 rounded-2xl">
                <Package className="w-12 h-12 text-slate-400" />
              </div>
            </div>
            <h3 className="text-lg font-bold text-white mb-2">
              No orders found
            </h3>
            <p className="text-slate-400 text-sm">
              {searchTerm || statusFilter !== "all"
                ? "Try adjusting your search or filters"
                : "Orders will appear here when customers place them"}
            </p>
          </div>
        )}
      </div>

      {/* Order Details Modal */}
      {showOrderDetails && selectedOrder && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900/95 backdrop-blur-2xl border border-white/20 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600 text-white p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-black">Order Details</h2>
                  <p className="text-blue-100 font-medium">
                    Order #{selectedOrder.order_number}
                  </p>
                </div>
                <button
                  onClick={() => setShowOrderDetails(false)}
                  className="text-white hover:text-slate-300 text-2xl w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/20 transition-all"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
              {/* Order Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-bold text-white">
                    Customer Information
                  </h3>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Phone className="w-4 h-4 text-slate-400" />
                      <span className="text-sm text-slate-300">
                        {selectedOrder.customer_phone}
                      </span>
                    </div>
                    {selectedOrder.customer_email && (
                      <div className="flex items-center space-x-2">
                        <Mail className="w-4 h-4 text-slate-400" />
                        <span className="text-sm text-slate-300">
                          {selectedOrder.customer_email}
                        </span>
                      </div>
                    )}
                    <div className="flex items-start space-x-2">
                      <MapPin className="w-4 h-4 text-slate-400 mt-0.5" />
                      <span className="text-sm text-slate-300">
                        {selectedOrder.delivery_address}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-bold text-white">
                    Order Information
                  </h3>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Calendar className="w-4 h-4 text-slate-400" />
                      <span className="text-sm text-slate-300">
                        {new Date(selectedOrder.created_at).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${getStatusColor(
                          selectedOrder.status
                        )}`}
                      >
                        {getStatusIcon(selectedOrder.status)}
                        <span className="ml-1 capitalize">
                          {selectedOrder.status}
                        </span>
                      </span>
                    </div>
                    <div className="text-sm text-slate-300">
                      Payment:{" "}
                      <span className="font-bold text-white capitalize">
                        {selectedOrder.payment_method}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Order Items */}
              <div className="mb-6">
                <h3 className="text-lg font-bold text-white mb-4">
                  Order Items
                </h3>
                <div className="bg-white/10 backdrop-blur-xl rounded-xl overflow-hidden border border-white/20">
                  <table className="min-w-full">
                    <thead className="bg-white/5 border-b border-white/10">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-300 uppercase">
                          Product
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-300 uppercase">
                          Quantity
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-300 uppercase">
                          Unit Price
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-300 uppercase">
                          Total
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {selectedOrder.order_items?.map((item) => (
                        <tr key={item.id} className="hover:bg-white/5">
                          <td className="px-4 py-3 text-sm font-bold text-white">
                            {item.product_name}
                          </td>
                          <td className="px-4 py-3 text-sm text-slate-300">
                            {item.quantity}
                          </td>
                          <td className="px-4 py-3 text-sm text-slate-300">
                            KES {item.unit_price.toLocaleString()}
                          </td>
                          <td className="px-4 py-3 text-sm font-bold text-white">
                            KES {item.total_price.toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Order Summary */}
              <div className="bg-white/10 backdrop-blur-xl rounded-xl p-4 mb-6 border border-white/20">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-300">Subtotal:</span>
                    <span className="font-bold text-white">
                      KES {selectedOrder.subtotal.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-300">Delivery Fee:</span>
                    <span className="font-bold text-white">
                      {selectedOrder.delivery_fee === 0
                        ? "FREE"
                        : `KES ${selectedOrder.delivery_fee.toLocaleString()}`}
                    </span>
                  </div>
                  <div className="flex justify-between text-lg font-black pt-2 border-t border-white/20">
                    <span className="text-white">Total:</span>
                    <span className="text-emerald-400">
                      KES {selectedOrder.total_amount.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Status Update */}
              <div className="mb-6">
                <h3 className="text-lg font-bold text-white mb-4">
                  Update Status
                </h3>
                <div className="flex flex-wrap gap-2">
                  {[
                    "pending",
                    "confirmed",
                    "processing",
                    "shipped",
                    "delivered",
                    "cancelled",
                  ].map((status) => (
                    <button
                      key={status}
                      onClick={() =>
                        updateOrderStatus(
                          selectedOrder.id,
                          status as Order["status"]
                        )
                      }
                      disabled={selectedOrder.status === status}
                      className={`px-4 py-2 rounded-xl text-sm font-bold transition-all duration-300 border ${
                        selectedOrder.status === status
                          ? "bg-white/5 text-slate-500 cursor-not-allowed border-white/10"
                          : "bg-blue-600/20 text-blue-400 hover:bg-blue-600/30 border-blue-500/30 hover:border-blue-500/50"
                      }`}
                    >
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Notes */}
              {selectedOrder.notes && (
                <div className="mb-6">
                  <h3 className="text-lg font-bold text-white mb-2">
                    Order Notes
                  </h3>
                  <div className="bg-amber-600/20 border border-amber-500/30 rounded-xl p-4">
                    <p className="text-sm text-amber-200">
                      {selectedOrder.notes}
                    </p>
                  </div>
                </div>
              )}

              {/* Delete Order Button */}
              <div className="pt-4 border-t border-white/20">
                <button
                  onClick={() =>
                    deleteOrder(selectedOrder.id, selectedOrder.order_number)
                  }
                  className="w-full bg-red-600/20 text-red-400 hover:bg-red-600/30 border border-red-500/30 hover:border-red-500/50 px-4 py-3 rounded-xl text-sm font-bold transition-all duration-300 flex items-center justify-center space-x-2"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Delete Order</span>
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
