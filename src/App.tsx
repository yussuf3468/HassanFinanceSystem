import { Suspense, lazy, useEffect, useRef, useState } from "react";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { CartProvider } from "./contexts/CartContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import Layout from "./components/Layout";
import { Store, Settings } from "lucide-react";
import QueryDiagnostics from "./components/QueryDiagnostics";
import PWAInstallPrompt from "./components/PWAInstallPrompt";
import StorefrontPage from "./pages/StorefrontPage";

const Login = lazy(() => import("./components/Login"));
const Dashboard = lazy(() => import("./components/Dashboard"));
const Inventory = lazy(() => import("./components/Inventory"));
const Sales = lazy(() => import("./components/Sales"));
const SalesHistory = lazy(() => import("./components/SalesHistory"));
const Returns = lazy(() => import("./components/Returns"));
const Search = lazy(() => import("./components/Search"));
const Reports = lazy(() => import("./components/Reports"));
const UserActivityDashboard = lazy(
  () => import("./components/UserActivityDashboard"),
);
const Orders = lazy(() => import("./components/Orders"));
const CustomerBalances = lazy(() => import("./components/CustomerBalances"));
const FinancialDashboard = lazy(() => import("./components/FinancialDashboard"));
const ExpenseManagement = lazy(() => import("./components/ExpenseManagement"));
const InitialInvestment = lazy(() => import("./components/InitialInvestment"));
const DebtManagement = lazy(() => import("./components/DebtManagement"));
const CustomerCredit = lazy(() => import("./components/CustomerCredit"));
const CyberServices = lazy(() => import("./components/CyberServices"));
const StaffDashboard = lazy(() => import("./components/StaffDashboard"));
const OrganizedInventory = lazy(() => import("./components/OrganizedInventory"));
const BusinessProfitTracker = lazy(
  () => import("./components/BusinessProfitTracker"),
);

function ViewFallback() {
  return (
    <div className="flex items-center justify-center py-16">
      <div className="text-sm text-slate-600 dark:text-slate-300">Loading view...</div>
    </div>
  );
}

function AppContent() {
  const [viewMode, setViewMode] = useState<"admin" | "customer">("customer");
  const { user, loading } = useAuth();
  const hadUserRef = useRef(false);

  const [activeTab, setActiveTab] = useState("dashboard");

  // ✅ Load last active tab from localStorage (optional)
  useEffect(() => {
    const savedTab = localStorage.getItem("activeTab");
    if (savedTab) setActiveTab(savedTab);
  }, []);

  // ✅ Save current tab to localStorage (optional)
  useEffect(() => {
    localStorage.setItem("activeTab", activeTab);
  }, [activeTab]);

  // ✅ Fixed logic: Only set default tab once when user logs in
  useEffect(() => {
    if (user) {
      hadUserRef.current = true;
      setViewMode("admin");

      setActiveTab((prev) => {
        // Don't reset tab on refresh - keep whatever tab was saved
        const savedTab = localStorage.getItem("activeTab");
        if (savedTab) return savedTab;

        // Only assign default dashboard on first login (no saved tab)
        if (user.email === "galiyowabi@gmail.com") return "dashboard";
        if (user.email) return "staff-dashboard";
        return "dashboard";
      });
    }
  }, [user]);

  useEffect(() => {
    if (!user && hadUserRef.current) {
      setViewMode("customer");
      hadUserRef.current = false;
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
    return <StorefrontPage onAdminClick={() => setViewMode("admin")} />;
  }

  // Admin view (requires authentication)
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-100 relative">
        {/* View Toggle Button (match customer/admin toggle style) */}
        <button
          onClick={() => setViewMode("customer")}
          className="fixed top-4 right-4 z-50 bg-slate-800 text-white px-4 py-2 rounded-lg hover:bg-slate-700 transition-colors flex items-center space-x-2 shadow-lg"
        >
          <Store className="w-4 h-4" />
          <span className="hidden sm:inline">Customer Store</span>
        </button>

        {/* Centered login container to match app layout */}
        <div className="w-full max-w-md mx-4">
          <Suspense fallback={<ViewFallback />}>
            <Login onLogin={() => {}} />
          </Suspense>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      <Layout activeTab={activeTab} onTabChange={setActiveTab}>
        <Suspense fallback={<ViewFallback />}>
          {activeTab === "dashboard" && <Dashboard />}
          {activeTab === "staff-dashboard" && <StaffDashboard />}
          {activeTab === "inventory" && <Inventory />}
          {activeTab === "organized-inventory" && <OrganizedInventory />}
          {activeTab === "sales" && <Sales />}
          {activeTab === "sales-history" && <SalesHistory />}
          {activeTab === "returns" && <Returns />}
          {activeTab === "orders" && <Orders />}
          {activeTab === "search" && <Search />}
          {activeTab === "reports" && <Reports />}
          {activeTab === "customer-balances" && <CustomerBalances />}
          {activeTab === "user-activity" && <UserActivityDashboard />}
          {activeTab === "financial-dashboard" && <FinancialDashboard />}
          {activeTab === "expenses" && <ExpenseManagement />}
          {activeTab === "investments" && <InitialInvestment />}
          {activeTab === "debts" && <DebtManagement />}
          {activeTab === "customer-credit" && <CustomerCredit />}
          {activeTab === "cyber-services" && <CyberServices />}
          {activeTab === "business-profit" && <BusinessProfitTracker />}
        </Suspense>
      </Layout>

      {/* PWA Install Prompt for iOS and Android */}
      <PWAInstallPrompt />

      {/* Dev-only diagnostics (hidden in production) */}
      {!import.meta.env.PROD && <QueryDiagnostics />}
    </div>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <CartProvider>
          <AppContent />
        </CartProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
