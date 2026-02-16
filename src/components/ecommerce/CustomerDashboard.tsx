import { useState, useEffect } from "react";
import { User, Package, MapPin, LogOut, Edit } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { supabase } from "../../lib/supabase";
import Container from "./Container";
import Card from "./Card";
import Button from "./Button";
import Input from "./Input";
import Badge from "./Badge";
import { OrderSkeleton } from "./Skeletons";
import type { Order } from "../../types";

const statusConfig = {
  pending: { variant: "warning" as const, label: "Pending" },
  confirmed: { variant: "info" as const, label: "Confirmed" },
  processing: { variant: "info" as const, label: "Processing" },
  shipped: { variant: "warning" as const, label: "Shipped" },
  delivered: { variant: "success" as const, label: "Delivered" },
  cancelled: { variant: "danger" as const, label: "Cancelled" },
};

export default function CustomerDashboard() {
  const { user, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState<
    "profile" | "orders" | "addresses"
  >("profile");
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);

  const [profile, setProfile] = useState({
    full_name: user?.user_metadata?.full_name || "",
    phone: user?.user_metadata?.phone || "",
    email: user?.email || "",
  });

  useEffect(() => {
    if (user) {
      fetchOrders();
    }
  }, [user]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(10);

      if (error) throw error;
      setOrders(data || []);
    } catch (error) {
      console.error("Error fetching orders:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async () => {
    try {
      const { error } = await supabase.auth.updateUser({
        data: {
          full_name: profile.full_name,
          phone: profile.phone,
        },
      });

      if (error) throw error;
      setEditing(false);
      alert("Profile updated successfully!");
    } catch (error) {
      console.error("Error updating profile:", error);
      alert("Failed to update profile");
    }
  };

  if (!user) {
    return (
      <section className="py-12 bg-slate-50 dark:bg-slate-900 min-h-screen">
        <Container>
          <Card
            variant="elevated"
            padding="lg"
            className="max-w-md mx-auto text-center"
          >
            <User className="w-16 h-16 text-slate-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
              Please Sign In
            </h2>
            <p className="text-slate-600 dark:text-slate-400 mb-6">
              Sign in to view your dashboard and order history
            </p>
            <Button variant="primary" fullWidth>
              Sign In
            </Button>
          </Card>
        </Container>
      </section>
    );
  }

  return (
    <section className="py-12 bg-slate-50 dark:bg-slate-900 min-h-screen">
      <Container>
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-black text-slate-900 dark:text-white mb-2">
            My Dashboard
          </h1>
          <p className="text-lg text-slate-600 dark:text-slate-400">
            Manage your account and track your orders
          </p>
        </div>

        <div className="grid lg:grid-cols-4 gap-6">
          {/* Sidebar */}
          <Card variant="elevated" padding="md" className="lg:col-span-1 h-fit">
            <div className="space-y-2">
              <button
                onClick={() => setActiveTab("profile")}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-semibold transition-all ${
                  activeTab === "profile"
                    ? "bg-gradient-to-r from-amber-600 to-yellow-600 text-white shadow-lg"
                    : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
                }`}
              >
                <User className="w-5 h-5" />
                Profile
              </button>
              <button
                onClick={() => setActiveTab("orders")}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-semibold transition-all ${
                  activeTab === "orders"
                    ? "bg-gradient-to-r from-amber-600 to-yellow-600 text-white shadow-lg"
                    : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
                }`}
              >
                <Package className="w-5 h-5" />
                Orders
              </button>
              <button
                onClick={() => setActiveTab("addresses")}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-semibold transition-all ${
                  activeTab === "addresses"
                    ? "bg-gradient-to-r from-amber-600 to-yellow-600 text-white shadow-lg"
                    : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
                }`}
              >
                <MapPin className="w-5 h-5" />
                Addresses
              </button>
              <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
                <button
                  onClick={() => signOut()}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950 transition-all"
                >
                  <LogOut className="w-5 h-5" />
                  Sign Out
                </button>
              </div>
            </div>
          </Card>

          {/* Main Content */}
          <div className="lg:col-span-3 space-y-6">
            {/* Profile Tab */}
            {activeTab === "profile" && (
              <Card variant="elevated" padding="lg">
                <div className="flex justify-between items-start mb-6">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-amber-600 to-yellow-600 rounded-full flex items-center justify-center text-white text-2xl font-black">
                      {profile.full_name?.charAt(0) || "U"}
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                        {profile.full_name || "User"}
                      </h2>
                      <p className="text-slate-600 dark:text-slate-400">
                        {profile.email}
                      </p>
                    </div>
                  </div>
                  <Button
                    onClick={() => setEditing(!editing)}
                    variant="outline"
                    size="sm"
                  >
                    <Edit className="w-4 h-4" />
                    {editing ? "Cancel" : "Edit"}
                  </Button>
                </div>

                <div className="space-y-4">
                  <Input
                    label="Full Name"
                    value={profile.full_name}
                    onChange={(e) =>
                      setProfile({ ...profile, full_name: e.target.value })
                    }
                    disabled={!editing}
                  />
                  <Input
                    label="Email"
                    value={profile.email}
                    disabled
                    helperText="Email cannot be changed"
                  />
                  <Input
                    label="Phone Number"
                    value={profile.phone}
                    onChange={(e) =>
                      setProfile({ ...profile, phone: e.target.value })
                    }
                    disabled={!editing}
                  />
                </div>

                {editing && (
                  <div className="mt-6">
                    <Button
                      onClick={handleUpdateProfile}
                      variant="primary"
                      fullWidth
                    >
                      Save Changes
                    </Button>
                  </div>
                )}
              </Card>
            )}

            {/* Orders Tab */}
            {activeTab === "orders" && (
              <Card variant="elevated" padding="lg">
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">
                  Order History
                </h2>

                {loading ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <OrderSkeleton key={i} />
                    ))}
                  </div>
                ) : orders.length === 0 ? (
                  <div className="text-center py-12">
                    <Package className="w-16 h-16 text-slate-400 mx-auto mb-4" />
                    <p className="text-slate-600 dark:text-slate-400">
                      No orders yet
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {orders.map((order) => (
                      <div
                        key={order.id}
                        className="p-4 rounded-xl border-2 border-slate-200 dark:border-slate-700 hover:border-amber-400 transition-colors"
                      >
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <p className="font-bold text-slate-900 dark:text-white">
                              Order #{order.order_number}
                            </p>
                            <p className="text-sm text-slate-600 dark:text-slate-400">
                              {new Date(order.created_at).toLocaleDateString()}
                            </p>
                          </div>
                          <Badge
                            variant={statusConfig[order.status].variant}
                            size="sm"
                          >
                            {statusConfig[order.status].label}
                          </Badge>
                        </div>
                        <div className="flex justify-between items-center">
                          <p className="text-slate-600 dark:text-slate-400">
                            {order.customer_name}
                          </p>
                          <p className="font-bold text-amber-600 dark:text-amber-400">
                            KES {order.total_amount.toLocaleString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            )}

            {/* Addresses Tab */}
            {activeTab === "addresses" && (
              <Card variant="elevated" padding="lg">
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">
                  Saved Addresses
                </h2>
                <div className="text-center py-12">
                  <MapPin className="w-16 h-16 text-slate-400 mx-auto mb-4" />
                  <p className="text-slate-600 dark:text-slate-400 mb-6">
                    No saved addresses yet
                  </p>
                  <Button variant="primary">Add New Address</Button>
                </div>
              </Card>
            )}
          </div>
        </div>
      </Container>
    </section>
  );
}
