import { useEffect, useMemo, useState } from "react";
import {
  Bell,
  BellRing,
  Edit,
  Home,
  LogOut,
  MapPin,
  Package,
  Plus,
  Settings,
  Shield,
  Trash2,
  User,
} from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { getOrders, updateCurrentUserProfile } from "../../api";
import compactToast from "../../utils/compactToast";
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

type DashboardTab = "overview" | "profile" | "orders" | "addresses" | "preferences";
type OrdersFilter = "all" | "active" | "completed";

interface SavedAddress {
  id: string;
  label: string;
  recipient: string;
  phone: string;
  line1: string;
  line2: string;
  city: string;
  isDefault: boolean;
}

interface CustomerPreferences {
  orderUpdates: boolean;
  smsAlerts: boolean;
  marketingEmails: boolean;
  darkModeByDefault: boolean;
  language: "en" | "so";
  currency: "KES" | "USD";
}

const defaultPreferences: CustomerPreferences = {
  orderUpdates: true,
  smsAlerts: false,
  marketingEmails: false,
  darkModeByDefault: false,
  language: "en",
  currency: "KES",
};

const emptyAddress: Omit<SavedAddress, "id" | "isDefault"> = {
  label: "Home",
  recipient: "",
  phone: "",
  line1: "",
  line2: "",
  city: "Nairobi",
};

interface CustomerDashboardProps {
  onLoginClick?: () => void;
}

export default function CustomerDashboard({ onLoginClick }: CustomerDashboardProps) {
  const { user, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState<DashboardTab>("overview");
  const [ordersFilter, setOrdersFilter] = useState<OrdersFilter>("all");
  const [ordersSearch, setOrdersSearch] = useState("");
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [editingProfile, setEditingProfile] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPreferences, setSavingPreferences] = useState(false);

  const [profile, setProfile] = useState({
    full_name: user?.user_metadata?.full_name || "",
    phone: user?.user_metadata?.phone || "",
    email: user?.email || "",
  });

  const [addresses, setAddresses] = useState<SavedAddress[]>([]);
  const [isAddressFormOpen, setIsAddressFormOpen] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);
  const [addressForm, setAddressForm] = useState(emptyAddress);

  const [preferences, setPreferences] = useState<CustomerPreferences>(defaultPreferences);

  const userStorageKeyPrefix = user?.id
    ? `horumar.customer.${user.id}`
    : "horumar.customer.guest";
  const addressesKey = `${userStorageKeyPrefix}.addresses`;
  const preferencesKey = `${userStorageKeyPrefix}.preferences`;

  useEffect(() => {
    setProfile({
      full_name: user?.user_metadata?.full_name || "",
      phone: user?.user_metadata?.phone || "",
      email: user?.email || "",
    });
  }, [user]);

  useEffect(() => {
    if (!user) return;

    const loadOrders = async () => {
      try {
        setLoadingOrders(true);
        const data = await getOrders();
        const safeOrders = data || [];

        const customerOrders = safeOrders.filter((order) => {
          const byCustomerId = !!order.customer_id && order.customer_id === user.id;
          const byEmail =
            !!user.email &&
            !!order.customer_email &&
            order.customer_email.toLowerCase() === user.email.toLowerCase();
          return byCustomerId || byEmail;
        });

        setOrders(
          customerOrders.sort(
            (a, b) => +new Date(b.created_at) - +new Date(a.created_at),
          ),
        );
      } catch (error) {
        console.error("Error fetching customer orders:", error);
        compactToast.error("Failed to load your orders");
      } finally {
        setLoadingOrders(false);
      }
    };

    loadOrders();
  }, [user]);

  useEffect(() => {
    if (!user) return;
    try {
      const raw = localStorage.getItem(addressesKey);
      if (!raw) {
        setAddresses([]);
        return;
      }
      const parsed = JSON.parse(raw) as SavedAddress[];
      setAddresses(Array.isArray(parsed) ? parsed : []);
    } catch {
      setAddresses([]);
    }
  }, [addressesKey, user]);

  useEffect(() => {
    if (!user) return;
    try {
      const raw = localStorage.getItem(preferencesKey);
      if (!raw) {
        setPreferences(defaultPreferences);
        return;
      }
      const parsed = JSON.parse(raw) as Partial<CustomerPreferences>;
      setPreferences({ ...defaultPreferences, ...parsed });
    } catch {
      setPreferences(defaultPreferences);
    }
  }, [preferencesKey, user]);

  const dashboardStats = useMemo(() => {
    const totalOrders = orders.length;
    const totalSpent = orders.reduce((sum, order) => sum + order.total_amount, 0);
    const activeOrders = orders.filter(
      (order) => !["delivered", "cancelled"].includes(order.status),
    ).length;
    const completedOrders = orders.filter((order) => order.status === "delivered").length;

    return {
      totalOrders,
      totalSpent,
      activeOrders,
      completedOrders,
    };
  }, [orders]);

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const query = ordersSearch.trim().toLowerCase();
      const bySearch =
        !query ||
        order.order_number.toLowerCase().includes(query) ||
        order.customer_name.toLowerCase().includes(query) ||
        (order.customer_phone || "").toLowerCase().includes(query);

      const byStatus =
        ordersFilter === "all"
          ? true
          : ordersFilter === "active"
            ? !["delivered", "cancelled"].includes(order.status)
            : ["delivered", "cancelled"].includes(order.status);

      return bySearch && byStatus;
    });
  }, [orders, ordersFilter, ordersSearch]);

  const handleUpdateProfile = async () => {
    if (!profile.full_name.trim()) {
      compactToast.error("Full name is required");
      return;
    }

    try {
      setSavingProfile(true);
      await updateCurrentUserProfile({
        full_name: profile.full_name.trim(),
        phone: profile.phone.trim(),
      });
      setEditingProfile(false);
      compactToast.success("Profile updated successfully");
    } catch (error) {
      console.error("Error updating profile:", error);
      compactToast.error("Failed to update your profile");
    } finally {
      setSavingProfile(false);
    }
  };

  const saveAddresses = (next: SavedAddress[]) => {
    setAddresses(next);
    localStorage.setItem(addressesKey, JSON.stringify(next));
  };

  const openCreateAddress = () => {
    setEditingAddressId(null);
    setAddressForm(emptyAddress);
    setIsAddressFormOpen(true);
  };

  const openEditAddress = (address: SavedAddress) => {
    setEditingAddressId(address.id);
    setAddressForm({
      label: address.label,
      recipient: address.recipient,
      phone: address.phone,
      line1: address.line1,
      line2: address.line2,
      city: address.city,
    });
    setIsAddressFormOpen(true);
  };

  const handleSaveAddress = () => {
    if (
      !addressForm.recipient.trim() ||
      !addressForm.phone.trim() ||
      !addressForm.line1.trim()
    ) {
      compactToast.error("Recipient, phone, and street address are required");
      return;
    }

    if (editingAddressId) {
      const next = addresses.map((address) =>
        address.id === editingAddressId
          ? {
              ...address,
              ...addressForm,
            }
          : address,
      );
      saveAddresses(next);
      compactToast.success("Address updated");
    } else {
      const nextAddress: SavedAddress = {
        id: crypto.randomUUID(),
        ...addressForm,
        isDefault: addresses.length === 0,
      };
      const next = [...addresses, nextAddress];
      saveAddresses(next);
      compactToast.success("Address added");
    }

    setIsAddressFormOpen(false);
    setEditingAddressId(null);
    setAddressForm(emptyAddress);
  };

  const handleDeleteAddress = (id: string) => {
    const next = addresses.filter((address) => address.id !== id);
    if (next.length > 0 && !next.some((address) => address.isDefault)) {
      next[0] = { ...next[0], isDefault: true };
    }
    saveAddresses(next);
    compactToast.info("Address removed");
  };

  const setDefaultAddress = (id: string) => {
    const next = addresses.map((address) => ({
      ...address,
      isDefault: address.id === id,
    }));
    saveAddresses(next);
    compactToast.success("Default address updated");
  };

  const handleSavePreferences = () => {
    try {
      setSavingPreferences(true);
      localStorage.setItem(preferencesKey, JSON.stringify(preferences));
      compactToast.success("Preferences saved");
    } catch (error) {
      console.error("Error saving preferences:", error);
      compactToast.error("Failed to save preferences");
    } finally {
      setSavingPreferences(false);
    }
  };

  if (!user) {
    return (
      <section className="min-h-screen bg-slate-50 py-12 dark:bg-slate-900">
        <Container>
          <Card variant="elevated" padding="lg" className="mx-auto max-w-md text-center">
            <User className="mx-auto mb-4 h-16 w-16 text-slate-400" />
            <h2 className="mb-2 text-2xl font-bold text-slate-900 dark:text-white">
              Please Sign In
            </h2>
            <p className="mb-6 text-slate-600 dark:text-slate-400">
              Sign in to view your dashboard, addresses, and preferences.
            </p>
            <Button variant="primary" fullWidth onClick={onLoginClick}>
              Sign In
            </Button>
          </Card>
        </Container>
      </section>
    );
  }

  return (
    <section className="min-h-screen bg-slate-50 py-12 dark:bg-slate-900">
      <Container>
        <div className="mb-8">
          <h1 className="mb-2 text-3xl font-black text-slate-900 dark:text-white sm:text-4xl">
            Customer Dashboard
          </h1>
          <p className="text-base text-slate-600 dark:text-slate-400 sm:text-lg">
            Track orders, manage profile, save addresses, and control account preferences.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-4">
          <Card variant="elevated" padding="md" className="h-fit lg:col-span-1">
            <div className="space-y-2">
              <button
                onClick={() => setActiveTab("overview")}
                className={`w-full rounded-xl px-4 py-3 text-left font-semibold transition-all ${
                  activeTab === "overview"
                    ? "bg-gradient-to-r from-amber-600 to-yellow-600 text-white shadow-lg"
                    : "text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700"
                }`}
              >
                <span className="inline-flex items-center gap-3">
                  <Home className="h-5 w-5" />
                  Overview
                </span>
              </button>

              <button
                onClick={() => setActiveTab("profile")}
                className={`w-full rounded-xl px-4 py-3 text-left font-semibold transition-all ${
                  activeTab === "profile"
                    ? "bg-gradient-to-r from-amber-600 to-yellow-600 text-white shadow-lg"
                    : "text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700"
                }`}
              >
                <span className="inline-flex items-center gap-3">
                  <User className="h-5 w-5" />
                  Profile
                </span>
              </button>

              <button
                onClick={() => setActiveTab("orders")}
                className={`w-full rounded-xl px-4 py-3 text-left font-semibold transition-all ${
                  activeTab === "orders"
                    ? "bg-gradient-to-r from-amber-600 to-yellow-600 text-white shadow-lg"
                    : "text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700"
                }`}
              >
                <span className="inline-flex items-center gap-3">
                  <Package className="h-5 w-5" />
                  Orders
                </span>
              </button>

              <button
                onClick={() => setActiveTab("addresses")}
                className={`w-full rounded-xl px-4 py-3 text-left font-semibold transition-all ${
                  activeTab === "addresses"
                    ? "bg-gradient-to-r from-amber-600 to-yellow-600 text-white shadow-lg"
                    : "text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700"
                }`}
              >
                <span className="inline-flex items-center gap-3">
                  <MapPin className="h-5 w-5" />
                  Addresses
                </span>
              </button>

              <button
                onClick={() => setActiveTab("preferences")}
                className={`w-full rounded-xl px-4 py-3 text-left font-semibold transition-all ${
                  activeTab === "preferences"
                    ? "bg-gradient-to-r from-amber-600 to-yellow-600 text-white shadow-lg"
                    : "text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700"
                }`}
              >
                <span className="inline-flex items-center gap-3">
                  <Settings className="h-5 w-5" />
                  Preferences
                </span>
              </button>

              <div className="border-t border-slate-200 pt-4 dark:border-slate-700">
                <button
                  onClick={() => signOut()}
                  className="w-full rounded-xl px-4 py-3 text-left font-semibold text-red-600 transition-all hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950"
                >
                  <span className="inline-flex items-center gap-3">
                    <LogOut className="h-5 w-5" />
                    Sign Out
                  </span>
                </button>
              </div>
            </div>
          </Card>

          <div className="space-y-6 lg:col-span-3">
            {activeTab === "overview" && (
              <>
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                  <Card variant="bordered" padding="md">
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      Total Orders
                    </p>
                    <p className="mt-2 text-3xl font-black text-slate-900 dark:text-white">
                      {dashboardStats.totalOrders}
                    </p>
                  </Card>
                  <Card variant="bordered" padding="md">
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      Total Spent
                    </p>
                    <p className="mt-2 text-3xl font-black text-amber-600 dark:text-amber-400">
                      {preferences.currency} {dashboardStats.totalSpent.toLocaleString()}
                    </p>
                  </Card>
                  <Card variant="bordered" padding="md">
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      Active Orders
                    </p>
                    <p className="mt-2 text-3xl font-black text-blue-600 dark:text-blue-400">
                      {dashboardStats.activeOrders}
                    </p>
                  </Card>
                  <Card variant="bordered" padding="md">
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      Delivered
                    </p>
                    <p className="mt-2 text-3xl font-black text-emerald-600 dark:text-emerald-400">
                      {dashboardStats.completedOrders}
                    </p>
                  </Card>
                </div>

                <Card variant="elevated" padding="lg">
                  <div className="mb-4 flex items-center justify-between">
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                      Recent Orders
                    </h2>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setActiveTab("orders")}
                    >
                      View All
                    </Button>
                  </div>

                  {loadingOrders ? (
                    <div className="space-y-4">
                      {[1, 2, 3].map((i) => (
                        <OrderSkeleton key={i} />
                      ))}
                    </div>
                  ) : orders.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-slate-300 p-8 text-center dark:border-slate-600">
                      <Package className="mx-auto mb-3 h-10 w-10 text-slate-400" />
                      <p className="font-semibold text-slate-700 dark:text-slate-200">
                        No orders yet
                      </p>
                      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                        Once you place orders they will appear here.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {orders.slice(0, 5).map((order) => (
                        <div
                          key={order.id}
                          className="rounded-xl border border-slate-200 p-4 dark:border-slate-700"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <p className="font-bold text-slate-900 dark:text-white">
                              Order #{order.order_number}
                            </p>
                            <Badge variant={statusConfig[order.status].variant} size="sm">
                              {statusConfig[order.status].label}
                            </Badge>
                          </div>
                          <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-sm text-slate-600 dark:text-slate-400">
                            <span>{new Date(order.created_at).toLocaleDateString()}</span>
                            <span className="font-semibold text-amber-600 dark:text-amber-400">
                              {preferences.currency} {order.total_amount.toLocaleString()}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </Card>
              </>
            )}

            {activeTab === "profile" && (
              <Card variant="elevated" padding="lg">
                <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-amber-600 to-yellow-600 text-2xl font-black text-white">
                      {profile.full_name?.charAt(0)?.toUpperCase() || "U"}
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
                    onClick={() => setEditingProfile((prev) => !prev)}
                    variant="outline"
                    size="sm"
                  >
                    <Edit className="h-4 w-4" />
                    {editingProfile ? "Cancel" : "Edit"}
                  </Button>
                </div>

                <div className="space-y-4">
                  <Input
                    label="Full Name"
                    value={profile.full_name}
                    onChange={(e) =>
                      setProfile({ ...profile, full_name: e.target.value })
                    }
                    disabled={!editingProfile}
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
                    onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                    disabled={!editingProfile}
                  />
                </div>

                {editingProfile && (
                  <div className="mt-6">
                    <Button
                      onClick={handleUpdateProfile}
                      variant="primary"
                      fullWidth
                      isLoading={savingProfile}
                    >
                      Save Changes
                    </Button>
                  </div>
                )}
              </Card>
            )}

            {activeTab === "orders" && (
              <Card variant="elevated" padding="lg">
                <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                    Order History
                  </h2>
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      onClick={() => setOrdersFilter("all")}
                      className={`rounded-lg px-3 py-1.5 text-sm font-semibold ${
                        ordersFilter === "all"
                          ? "bg-amber-500 text-white"
                          : "bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300"
                      }`}
                    >
                      All
                    </button>
                    <button
                      onClick={() => setOrdersFilter("active")}
                      className={`rounded-lg px-3 py-1.5 text-sm font-semibold ${
                        ordersFilter === "active"
                          ? "bg-amber-500 text-white"
                          : "bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300"
                      }`}
                    >
                      Active
                    </button>
                    <button
                      onClick={() => setOrdersFilter("completed")}
                      className={`rounded-lg px-3 py-1.5 text-sm font-semibold ${
                        ordersFilter === "completed"
                          ? "bg-amber-500 text-white"
                          : "bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300"
                      }`}
                    >
                      Completed
                    </button>
                  </div>
                </div>

                <div className="mb-4">
                  <Input
                    placeholder="Search by order number, name, or phone"
                    value={ordersSearch}
                    onChange={(e) => setOrdersSearch(e.target.value)}
                  />
                </div>

                {loadingOrders ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <OrderSkeleton key={i} />
                    ))}
                  </div>
                ) : filteredOrders.length === 0 ? (
                  <div className="py-12 text-center">
                    <Package className="mx-auto mb-4 h-16 w-16 text-slate-400" />
                    <p className="text-slate-600 dark:text-slate-400">
                      No matching orders found
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredOrders.map((order) => (
                      <div
                        key={order.id}
                        className="rounded-xl border-2 border-slate-200 p-4 transition-colors hover:border-amber-400 dark:border-slate-700"
                      >
                        <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
                          <div>
                            <p className="font-bold text-slate-900 dark:text-white">
                              Order #{order.order_number}
                            </p>
                            <p className="text-sm text-slate-600 dark:text-slate-400">
                              {new Date(order.created_at).toLocaleDateString()}
                            </p>
                          </div>
                          <Badge variant={statusConfig[order.status].variant} size="sm">
                            {statusConfig[order.status].label}
                          </Badge>
                        </div>
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <p className="text-slate-600 dark:text-slate-400">
                            {order.customer_name}
                          </p>
                          <p className="font-bold text-amber-600 dark:text-amber-400">
                            {preferences.currency} {order.total_amount.toLocaleString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            )}

            {activeTab === "addresses" && (
              <Card variant="elevated" padding="lg">
                <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                    Saved Addresses
                  </h2>
                  <Button variant="primary" size="sm" onClick={openCreateAddress}>
                    <Plus className="h-4 w-4" />
                    Add Address
                  </Button>
                </div>

                {isAddressFormOpen && (
                  <div className="mb-6 rounded-xl border border-amber-300 bg-amber-50 p-4 dark:border-amber-600/30 dark:bg-amber-900/20">
                    <h3 className="mb-4 font-bold text-slate-900 dark:text-white">
                      {editingAddressId ? "Edit Address" : "New Address"}
                    </h3>
                    <div className="grid gap-3 md:grid-cols-2">
                      <Input
                        label="Label"
                        value={addressForm.label}
                        onChange={(e) =>
                          setAddressForm({ ...addressForm, label: e.target.value })
                        }
                        placeholder="Home / Work"
                      />
                      <Input
                        label="Recipient"
                        value={addressForm.recipient}
                        onChange={(e) =>
                          setAddressForm({ ...addressForm, recipient: e.target.value })
                        }
                      />
                      <Input
                        label="Phone"
                        value={addressForm.phone}
                        onChange={(e) =>
                          setAddressForm({ ...addressForm, phone: e.target.value })
                        }
                      />
                      <Input
                        label="City"
                        value={addressForm.city}
                        onChange={(e) =>
                          setAddressForm({ ...addressForm, city: e.target.value })
                        }
                      />
                      <div className="md:col-span-2">
                        <Input
                          label="Street Address"
                          value={addressForm.line1}
                          onChange={(e) =>
                            setAddressForm({ ...addressForm, line1: e.target.value })
                          }
                        />
                      </div>
                      <div className="md:col-span-2">
                        <Input
                          label="Apartment / Landmark (Optional)"
                          value={addressForm.line2}
                          onChange={(e) =>
                            setAddressForm({ ...addressForm, line2: e.target.value })
                          }
                        />
                      </div>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                      <Button variant="primary" size="sm" onClick={handleSaveAddress}>
                        Save Address
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setIsAddressFormOpen(false);
                          setEditingAddressId(null);
                          setAddressForm(emptyAddress);
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}

                {addresses.length === 0 ? (
                  <div className="py-12 text-center">
                    <MapPin className="mx-auto mb-4 h-16 w-16 text-slate-400" />
                    <p className="mb-4 text-slate-600 dark:text-slate-400">
                      No saved addresses yet
                    </p>
                    <Button variant="primary" onClick={openCreateAddress}>
                      <Plus className="h-4 w-4" />
                      Add Your First Address
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {addresses.map((address) => (
                      <div
                        key={address.id}
                        className="rounded-xl border border-slate-200 p-4 dark:border-slate-700"
                      >
                        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <p className="font-bold text-slate-900 dark:text-white">
                              {address.label}
                            </p>
                            {address.isDefault && <Badge size="sm">Default</Badge>}
                          </div>
                          <div className="flex items-center gap-2">
                            {!address.isDefault && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setDefaultAddress(address.id)}
                              >
                                Make Default
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openEditAddress(address)}
                            >
                              <Edit className="h-4 w-4" />
                              Edit
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteAddress(address.id)}
                              className="!text-red-600 dark:!text-red-400"
                            >
                              <Trash2 className="h-4 w-4" />
                              Delete
                            </Button>
                          </div>
                        </div>

                        <p className="font-semibold text-slate-700 dark:text-slate-200">
                          {address.recipient}
                        </p>
                        <p className="text-slate-600 dark:text-slate-400">
                          {address.phone}
                        </p>
                        <p className="mt-1 text-slate-600 dark:text-slate-400">
                          {address.line1}
                          {address.line2 ? `, ${address.line2}` : ""}, {address.city}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            )}

            {activeTab === "preferences" && (
              <Card variant="elevated" padding="lg">
                <h2 className="mb-6 text-2xl font-bold text-slate-900 dark:text-white">
                  Preferences & Notifications
                </h2>

                <div className="space-y-6">
                  <div>
                    <h3 className="mb-3 text-base font-semibold text-slate-900 dark:text-white">
                      Communication
                    </h3>
                    <div className="space-y-3">
                      <label className="flex cursor-pointer items-center justify-between rounded-xl border border-slate-200 p-3 dark:border-slate-700">
                        <span className="inline-flex items-center gap-2 text-slate-700 dark:text-slate-200">
                          <BellRing className="h-4 w-4" />
                          Order Updates
                        </span>
                        <input
                          type="checkbox"
                          checked={preferences.orderUpdates}
                          onChange={(e) =>
                            setPreferences({
                              ...preferences,
                              orderUpdates: e.target.checked,
                            })
                          }
                        />
                      </label>

                      <label className="flex cursor-pointer items-center justify-between rounded-xl border border-slate-200 p-3 dark:border-slate-700">
                        <span className="inline-flex items-center gap-2 text-slate-700 dark:text-slate-200">
                          <Bell className="h-4 w-4" />
                          SMS Alerts
                        </span>
                        <input
                          type="checkbox"
                          checked={preferences.smsAlerts}
                          onChange={(e) =>
                            setPreferences({
                              ...preferences,
                              smsAlerts: e.target.checked,
                            })
                          }
                        />
                      </label>

                      <label className="flex cursor-pointer items-center justify-between rounded-xl border border-slate-200 p-3 dark:border-slate-700">
                        <span className="inline-flex items-center gap-2 text-slate-700 dark:text-slate-200">
                          <Shield className="h-4 w-4" />
                          Marketing Emails
                        </span>
                        <input
                          type="checkbox"
                          checked={preferences.marketingEmails}
                          onChange={(e) =>
                            setPreferences({
                              ...preferences,
                              marketingEmails: e.target.checked,
                            })
                          }
                        />
                      </label>
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <label className="block">
                      <span className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">
                        Language
                      </span>
                      <select
                        value={preferences.language}
                        onChange={(e) =>
                          setPreferences({
                            ...preferences,
                            language: e.target.value as CustomerPreferences["language"],
                          })
                        }
                        className="w-full rounded-xl border-2 border-slate-200 bg-white px-4 py-3 text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                      >
                        <option value="en">English</option>
                        <option value="so">Somali</option>
                      </select>
                    </label>

                    <label className="block">
                      <span className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">
                        Currency
                      </span>
                      <select
                        value={preferences.currency}
                        onChange={(e) =>
                          setPreferences({
                            ...preferences,
                            currency: e.target.value as CustomerPreferences["currency"],
                          })
                        }
                        className="w-full rounded-xl border-2 border-slate-200 bg-white px-4 py-3 text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                      >
                        <option value="KES">KES</option>
                        <option value="USD">USD</option>
                      </select>
                    </label>
                  </div>

                  <label className="flex cursor-pointer items-center justify-between rounded-xl border border-slate-200 p-3 dark:border-slate-700">
                    <span className="text-slate-700 dark:text-slate-200">
                      Dark Mode by Default
                    </span>
                    <input
                      type="checkbox"
                      checked={preferences.darkModeByDefault}
                      onChange={(e) =>
                        setPreferences({
                          ...preferences,
                          darkModeByDefault: e.target.checked,
                        })
                      }
                    />
                  </label>
                </div>

                <div className="mt-6">
                  <Button
                    variant="primary"
                    onClick={handleSavePreferences}
                    isLoading={savingPreferences}
                  >
                    Save Preferences
                  </Button>
                </div>
              </Card>
            )}
          </div>
        </div>
      </Container>
    </section>
  );
}
