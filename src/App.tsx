import { Suspense, lazy, useEffect, useRef, useState } from "react";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { CartProvider } from "./contexts/CartContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import { ArrowLeft } from "lucide-react";
import { AppLoader, ViewLoader } from "./components/BrandLoader";
import QueryDiagnostics from "./components/QueryDiagnostics";
import StorefrontPage from "./pages/StorefrontPage";

// Admin-only chrome stays out of the public bundle — customers never
// download it.
const Layout = lazy(() => import("./components/Layout"));
const PWAInstallPrompt = lazy(() => import("./components/PWAInstallPrompt"));

const Login = lazy(() => import("./components/Login"));
const Dashboard = lazy(() => import("./components/Dashboard"));
const Inventory = lazy(() => import("./components/Inventory"));
const Sales = lazy(() => import("./components/Sales"));
const SalesHistory = lazy(() => import("./components/SalesHistory"));
const Returns = lazy(() => import("./components/Returns"));
const Search = lazy(() => import("./components/Search"));
const Reports = lazy(() => import("./components/Reports"));
const UserActivityDashboard = lazy(() => import("./components/UserActivityDashboard"));
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
const BusinessProfitTracker = lazy(() => import("./components/BusinessProfitTracker"));

function ViewFallback() {
  return <ViewLoader />;
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
    return <AppLoader />;
  }

  // Customer view (no authentication required)
  if (viewMode === "customer") {
    return <StorefrontPage onAdminClick={() => setViewMode("admin")} />;
  }

  // Admin view (requires authentication)
  if (!user) {
    return (
      <div
        className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-12"
        style={{ background: "#12100c" }}
      >
        {/* Ambient brand lighting to match the storefront hero */}
        <div
          className="pointer-events-none absolute -right-40 -top-40 h-[36rem] w-[36rem] rounded-full"
          style={{
            background:
              "radial-gradient(closest-side, rgba(46,143,108,0.28), transparent 70%)",
            filter: "blur(60px)",
          }}
        />
        <div
          className="pointer-events-none absolute -bottom-48 -left-40 h-[32rem] w-[32rem] rounded-full"
          style={{
            background:
              "radial-gradient(closest-side, rgba(185,134,58,0.18), transparent 70%)",
            filter: "blur(60px)",
          }}
        />

        {/* Back to the public store */}
        <button
          onClick={() => setViewMode("customer")}
          className="fixed right-4 top-4 z-50 flex h-10 items-center gap-2 rounded-full px-4 text-sm font-semibold text-white transition-transform hover:scale-105"
          style={{
            background: "rgba(255,255,255,0.08)",
            border: "1px solid rgba(255,255,255,0.16)",
            backdropFilter: "blur(12px)",
          }}
        >
          <ArrowLeft className="h-4 w-4" />
          <span className="hidden sm:inline">Back to store</span>
        </button>

        <div className="relative z-10 w-full max-w-md">
          <Suspense fallback={<ViewFallback />}>
            <Login onLogin={() => {}} />
          </Suspense>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      <Suspense fallback={<AppLoader />}>
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
      </Suspense>

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
