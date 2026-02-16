import { useState, useEffect } from "react";
import {
  Package,
  TruckIcon,
  CheckCircle,
  XCircle,
  Clock,
  MapPin,
  Phone,
} from "lucide-react";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../contexts/AuthContext";
import Container from "./Container";
import Card from "./Card";
import Badge from "./Badge";
import Input from "./Input";
import Button from "./Button";
import { OrderSkeleton } from "./Skeletons";
import type { Order } from "../../types";

const statusConfig = {
  pending: {
    label: "Pending",
    icon: Clock,
    variant: "warning" as const,
    description: "Your order is being processed",
  },
  confirmed: {
    label: "Confirmed",
    icon: CheckCircle,
    variant: "info" as const,
    description: "Your order has been confirmed",
  },
  processing: {
    label: "Processing",
    icon: Package,
    variant: "info" as const,
    description: "We are preparing your order",
  },
  shipped: {
    label: "Shipped",
    icon: TruckIcon,
    variant: "warning" as const,
    description: "Your order is on the way",
  },
  delivered: {
    label: "Delivered",
    icon: CheckCircle,
    variant: "success" as const,
    description: "Order delivered successfully",
  },
  cancelled: {
    label: "Cancelled",
    icon: XCircle,
    variant: "danger" as const,
    description: "This order was cancelled",
  },
};

export default function OrderTracking() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchOrderNumber, setSearchOrderNumber] = useState("");
  const [trackingOrder, setTrackingOrder] = useState<Order | null>(null);
  const [lastSavedOrder, setLastSavedOrder] = useState<string | null>(null);

  useEffect(() => {
    // Load last saved order from localStorage
    const savedOrderNumber = localStorage.getItem("lastOrderNumber");
    if (savedOrderNumber) {
      setLastSavedOrder(savedOrderNumber);
    }

    if (user) {
      fetchMyOrders();
    } else {
      setLoading(false);
    }
  }, [user]);

  const fetchMyOrders = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (error) {
      console.error("Error fetching orders:", error);
    } finally {
      setLoading(false);
    }
  };

  const trackOrder = async () => {
    if (!searchOrderNumber.trim()) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .eq("order_number", searchOrderNumber.toUpperCase())
        .single();

      if (error) {
        console.error("Order not found");
        setTrackingOrder(null);
      } else {
        setTrackingOrder(data);
      }
    } catch (error) {
      console.error("Error tracking order:", error);
      setTrackingOrder(null);
    } finally {
      setLoading(false);
    }
  };

  const getProgressPercentage = (status: Order["status"]) => {
    const statusOrder = [
      "pending",
      "confirmed",
      "processing",
      "shipped",
      "delivered",
    ];
    const currentIndex = statusOrder.indexOf(status);
    return ((currentIndex + 1) / statusOrder.length) * 100;
  };

  const OrderCard = ({ order }: { order: Order }) => {
    const config = statusConfig[order.status];
    const Icon = config.icon;
    const progress = getProgressPercentage(order.status);

    return (
      <Card
        variant="elevated"
        padding="lg"
        className="hover:border-amber-400 transition-colors"
      >
        <div className="space-y-4">
          {/* Header */}
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">
                Order #{order.order_number}
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                {new Date(order.created_at).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            </div>
            <Badge variant={config.variant} size="md">
              <Icon className="w-4 h-4 mr-1" />
              {config.label}
            </Badge>
          </div>

          {/* Progress Bar */}
          {order.status !== "cancelled" && (
            <div className="space-y-2">
              <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-amber-600 to-yellow-600 transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                {config.description}
              </p>
            </div>
          )}

          {/* Order Details */}
          <div className="grid sm:grid-cols-2 gap-4 pt-4 border-t border-slate-200 dark:border-slate-700">
            <div className="flex items-start gap-3">
              <MapPin className="w-5 h-5 text-amber-600 mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Delivery Address
                </p>
                <p className="text-sm text-slate-900 dark:text-white">
                  {order.delivery_address}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Phone className="w-5 h-5 text-amber-600 mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Contact
                </p>
                <p className="text-sm text-slate-900 dark:text-white">
                  {order.customer_phone}
                </p>
              </div>
            </div>
          </div>

          {/* Total Amount */}
          <div className="flex justify-between items-center pt-4 border-t border-slate-200 dark:border-slate-700">
            <span className="text-sm font-semibold text-slate-600 dark:text-slate-400">
              Total Amount
            </span>
            <span className="text-xl font-black bg-gradient-to-r from-amber-600 to-yellow-600 bg-clip-text text-transparent">
              KES {order.total_amount.toLocaleString()}
            </span>
          </div>
        </div>
      </Card>
    );
  };

  return (
    <section className="py-12 bg-slate-50 dark:bg-slate-900 min-h-screen">
      <Container>
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl sm:text-5xl font-black text-slate-900 dark:text-white mb-4">
            Track Your Order
          </h1>
          <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
            Enter your order number or view your order history
          </p>
        </div>

        {/* Order Number Search */}
        {!user && (
          <>
            {/* Last Order Banner */}
            {lastSavedOrder && (
              <div className="max-w-2xl mx-auto mb-6">
                <div className="bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-900/20 dark:to-yellow-900/20 border-2 border-amber-200 dark:border-amber-800 rounded-xl p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <CheckCircle className="w-5 h-5 text-amber-600" />
                        <h3 className="font-bold text-slate-900 dark:text-white">
                          Your Recent Order
                        </h3>
                      </div>
                      <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                        Order Number:{" "}
                        <span className="font-mono font-bold text-amber-600 dark:text-amber-400">
                          {lastSavedOrder}
                        </span>
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Click below to track this order or enter a different
                        order number
                      </p>
                    </div>
                    <Button
                      onClick={() => {
                        setSearchOrderNumber(lastSavedOrder);
                        setTimeout(trackOrder, 100);
                      }}
                      variant="primary"
                      size="sm"
                    >
                      Track Now
                    </Button>
                  </div>
                </div>
              </div>
            )}

            <Card
              variant="glass"
              padding="lg"
              className="max-w-2xl mx-auto mb-12"
            >
              <div className="space-y-4">
                <div className="flex items-center gap-3 mb-4">
                  <Package className="w-6 h-6 text-amber-600" />
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                    Track by Order Number
                  </h2>
                </div>
                <div className="flex gap-3">
                  <Input
                    placeholder="Enter order number (e.g., ORD-12345)"
                    value={searchOrderNumber}
                    onChange={(e) =>
                      setSearchOrderNumber(e.target.value.toUpperCase())
                    }
                    onKeyPress={(e) => e.key === "Enter" && trackOrder()}
                    className="flex-1"
                  />
                  <Button
                    onClick={trackOrder}
                    variant="primary"
                    isLoading={loading}
                  >
                    Track
                  </Button>
                </div>
              </div>

              {trackingOrder && (
                <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-700">
                  <OrderCard order={trackingOrder} />
                </div>
              )}
            </Card>
          </>
        )}

        {/* My Orders (Authenticated Users) */}
        {user && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
              My Orders
            </h2>

            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <OrderSkeleton key={i} />
                ))}
              </div>
            ) : orders.length === 0 ? (
              <Card
                variant="elevated"
                padding="lg"
                className="text-center py-12"
              >
                <Package className="w-16 h-16 text-slate-400 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                  No orders yet
                </h3>
                <p className="text-slate-600 dark:text-slate-400">
                  Start shopping to see your orders here
                </p>
              </Card>
            ) : (
              <div className="grid gap-6">
                {orders.map((order) => (
                  <OrderCard key={order.id} order={order} />
                ))}
              </div>
            )}
          </div>
        )}
      </Container>
    </section>
  );
}
