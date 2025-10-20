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
import FinancialDashboard from "./components/FinancialDashboard";
import ExpenseManagement from "./components/ExpenseManagement";
import InitialInvestment from "./components/InitialInvestment";
import DebtManagement from "./components/DebtManagement";
import CustomerCredit from "./components/CustomerCredit";
import CyberServices from "./components/CyberServices";
import QueryDiagnostics from "./components/QueryDiagnostics";
import StaffDashboard from "./components/StaffDashboard";

function AppContent() {
  const [viewMode, setViewMode] = useState<"admin" | "customer">("customer");
  const { user, loading } = useAuth();

  // Check if user is admin or staff
  const isAdmin =
    user?.email?.includes("admin") || user?.email?.includes("yussuf");
  const isStaff =
    user?.email?.includes("staff") || user?.email?.includes("khalid");

  // Set default tab based on role (always update when user changes)
  const [activeTab, setActiveTab] = useState("dashboard");

  useEffect(() => {
    if (user) {
      if (user.email === "admin@bookshop.ke") {
        setViewMode("admin");
        setActiveTab("dashboard");
      } else if (user.email === "khalid123@gmail.com") {
        setViewMode("admin");
        setActiveTab("staff-dashboard");
      } else {
        setViewMode("admin");
        setActiveTab("dashboard");
      }
    }
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-xl font-semibold text-purple-900">Loading...</p>
          <p className="text-purple-700">Iska sug - Please wait</p>
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
      <Layout activeTab={activeTab} onTabChange={setActiveTab}>
        {activeTab === "dashboard" && <Dashboard />}
        {activeTab === "staff-dashboard" && <StaffDashboard />}
        {activeTab === "inventory" && <Inventory />}
        {activeTab === "sales" && <Sales />}
        {activeTab === "orders" && <Orders />}
        {activeTab === "search" && <Search />}
        {activeTab === "reports" && <Reports />}
        {activeTab === "user-activity" && <UserActivityDashboard />}
        {activeTab === "financial-dashboard" && <FinancialDashboard />}
        {activeTab === "expenses" && <ExpenseManagement />}
        {activeTab === "investments" && <InitialInvestment />}
        {activeTab === "debts" && <DebtManagement />}
        {activeTab === "customer-credit" && <CustomerCredit />}
        {activeTab === "cyber-services" && <CyberServices />}
      </Layout>
      {/* Dev-only diagnostics (hidden in production) */}
      {!import.meta.env.PROD && <QueryDiagnostics />}
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
