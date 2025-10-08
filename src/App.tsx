import { useState, useEffect } from "react";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { CartProvider } from "./contexts/CartContext";
import Layout from "./components/Layout";
import Login from "./components/Login";
import Dashboard from "./components/Dashboard";
import Inventory from "./components/Inventory";
import Sales from "./components/Sales";
import Search from "./components/Search";
import Reports from "./components/Reports";
import UserActivityDashboard from "./components/UserActivityDashboard";
import Orders from "./components/Orders";
import CustomerStoreNew from "./components/CustomerStoreNew";
import { Store, Settings } from "lucide-react";

function AppContent() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [viewMode, setViewMode] = useState<"admin" | "customer">("customer");
  const { user, loading } = useAuth();

  // Auto-redirect to admin for admin/staff users
  useEffect(() => {
    if (
      user &&
      (user.email?.includes("admin") ||
        user.email?.includes("yussuf") ||
        user.email?.includes("staff"))
    ) {
      setViewMode("admin");
    }
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-xl font-semibold text-slate-700">Loading...</p>
          <p className="text-slate-500">Iska sug - Please wait</p>
        </div>
      </div>
    );
  }

  // Customer view (no authentication required)
  if (viewMode === "customer") {
    return (
      <div className="relative">
        {/* View Toggle Button */}
        <button
          onClick={() => setViewMode("admin")}
          className="fixed top-4 right-4 z-50 bg-slate-800 text-white px-4 py-2 rounded-lg hover:bg-slate-700 transition-colors flex items-center space-x-2 shadow-lg"
        >
          <Settings className="w-4 h-4" />
          <span className="hidden sm:inline">Admin Panel</span>
        </button>
        <CustomerStoreNew onAdminClick={() => setViewMode("admin")} />
      </div>
    );
  }

  // Admin view (requires authentication)
  if (!user) {
    return (
      <div className="relative">
        {/* View Toggle Button */}
        <button
          onClick={() => setViewMode("customer")}
          className="fixed top-4 right-4 z-50 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2 shadow-lg"
        >
          <Store className="w-4 h-4" />
          <span className="hidden sm:inline">Customer Store</span>
        </button>
        <Login onLogin={() => {}} />
      </div>
    );
  }

  return (
    <div className="relative">
      {/* View Toggle Button */}
      <button
        onClick={() => setViewMode("customer")}
        className="fixed top-4 right-20 z-50 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2 shadow-lg"
      >
        <Store className="w-4 h-4" />
        <span className="hidden sm:inline">Customer Store</span>
      </button>

      <Layout activeTab={activeTab} onTabChange={setActiveTab}>
        {activeTab === "dashboard" && <Dashboard />}
        {activeTab === "inventory" && <Inventory />}
        {activeTab === "sales" && <Sales />}
        {activeTab === "orders" && <Orders />}
        {activeTab === "search" && <Search />}
        {activeTab === "reports" && <Reports />}
        {activeTab === "user-activity" && <UserActivityDashboard />}
      </Layout>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <AppContent />
      </CartProvider>
    </AuthProvider>
  );
}

export default App;
