import { ReactNode, useState } from "react";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  ClipboardList,
  Search,
  FileText,
  LogOut,
  User,
  Activity,
  Menu,
  X,
  DollarSign,
  PiggyBank,
  Banknote,
  ChevronRight,
  Monitor,
  ChevronLeft,
  CreditCard,
  TrendingUp,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { usePendingOrdersCount } from "../hooks/useSupabaseQuery";

interface LayoutProps {
  children: ReactNode;
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export default function Layout({
  children,
  activeTab,
  onTabChange,
}: LayoutProps) {
  const { user, signOut } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isDesktopSidebarCollapsed, setIsDesktopSidebarCollapsed] =
    useState(true);

  // ✅ Use cached query for pending orders count (reduces egress costs)
  const { data: pendingOrdersCount = 0 } = usePendingOrdersCount();

  // Check if current user is admin or staff (mutually exclusive)
  const isAdmin = user?.email === "admin@bookshop.ke";
  const isStaff = user?.email === "khalid123@gmail.com";

  // Dynamic tabs based on user role
  const baseTabs = [
    // Only show one dashboard tab per role
    ...(isAdmin
      ? [
          {
            id: "dashboard",
            label: "Dashboard",
            icon: LayoutDashboard,
            color: "from-purple-600 to-pink-600",
          },
        ]
      : []),
    ...(isStaff
      ? [
          {
            id: "staff-dashboard",
            label: "My Sales",
            icon: TrendingUp,
            color: "from-emerald-600 to-cyan-600",
          },
        ]
      : []),
    {
      id: "inventory",
      label: "Inventory",
      icon: Package,
      color: "from-blue-600 to-cyan-600",
    },
    {
      id: "cyber-services",
      label: "Cyber Services",
      icon: Monitor,
      color: "from-cyan-600 to-blue-600",
    },
    {
      id: "sales",
      label: "Sales",
      icon: ShoppingCart,
      color: "from-emerald-600 to-teal-600",
    },
    {
      id: "search",
      label: "Search",
      icon: Search,
      color: "from-violet-600 to-purple-600",
    },
    {
      id: "customer-credit",
      label: "Store Credit",
      icon: CreditCard,
      color: "from-teal-600 to-cyan-600",
    },
  ];

  const adminTabs = [
    {
      id: "orders",
      label: "Orders",
      icon: ClipboardList,
      color: "from-orange-600 to-amber-600",
    },
    {
      id: "financial-dashboard",
      label: "Financial Dashboard",
      icon: LayoutDashboard,
      color: "from-cyan-600 to-blue-600",
    },
    {
      id: "expenses",
      label: "Expenses",
      icon: DollarSign,
      color: "from-red-600 to-rose-600",
    },
    {
      id: "investments",
      label: "Initial Investment",
      icon: PiggyBank,
      color: "from-green-600 to-emerald-600",
    },
    {
      id: "debts",
      label: "Debts",
      icon: Banknote,
      color: "from-amber-600 to-yellow-600",
    },
    {
      id: "reports",
      label: "Reports",
      icon: FileText,
      color: "from-indigo-600 to-blue-600",
    },
    {
      id: "user-activity",
      label: "Staff Activity",
      icon: Activity,
      color: "from-rose-600 to-pink-600",
    },
  ];

  const tabs = isAdmin ? [...baseTabs, ...adminTabs] : baseTabs;

  // ✅ Real-time subscription is handled inside usePendingOrdersCount hook
  // No need for manual fetching - React Query auto-refetches every 2 minutes

  const getStaffName = (email: string) => {
    if (email.includes("yussuf") || email.includes("admin"))
      return "Yussuf Muse (Admin)";
    if (email.includes("khaled")) return "Khaled";
    return email.split("@")[0];
  };

  const handleLogout = async () => {
    if (
      confirm("Ma hubtaa inaad ka baxayso? - Are you sure you want to log out?")
    ) {
      await signOut();
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Animated Background Elements - Luxury */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-gradient-to-br from-purple-500/30 to-pink-500/30 rounded-full blur-3xl animate-pulse"></div>
        <div
          className="absolute -bottom-40 -left-40 w-[30rem] h-[30rem] bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-full blur-3xl animate-pulse"
          style={{ animationDelay: "1s" }}
        ></div>
        <div
          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 rounded-full blur-3xl"
          style={{ animation: "pulse 8s ease-in-out infinite" }}
        ></div>
      </div>

      {/* Desktop Sidebar - Modern Elegant Design with Collapse */}
      <aside
        className={`hidden lg:block fixed left-0 top-0 bottom-0 z-40 transition-all duration-300 ${
          isDesktopSidebarCollapsed ? "w-20" : "w-72 xl:w-80"
        }`}
      >
        <div className="h-full bg-gradient-to-b from-slate-900/95 via-purple-900/95 to-slate-900/95 backdrop-blur-2xl border-r border-white/20 shadow-2xl overflow-y-auto scrollbar-hide relative">
          {/* Collapse Toggle Button - Enhanced Visibility */}
          <button
            onClick={() =>
              setIsDesktopSidebarCollapsed(!isDesktopSidebarCollapsed)
            }
            className="fixed bg-gradient-to-br from-purple-500 to-pink-500 hover:from-purple-400 hover:to-pink-400 p-2 rounded-full shadow-2xl shadow-purple-500/50 hover:shadow-purple-400/70 hover:scale-125 transition-all duration-200 z-50 ring-2 ring-white/30 hover:ring-white/50"
            style={{
              top: isDesktopSidebarCollapsed ? "50%" : "24px",
              left: isDesktopSidebarCollapsed ? "68px" : "calc(18rem - 12px)",
              transform: isDesktopSidebarCollapsed
                ? "translateY(-50%)"
                : "none",
            }}
            aria-label={
              isDesktopSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"
            }
          >
            {isDesktopSidebarCollapsed ? (
              <ChevronRight className="w-4 h-4 text-white drop-shadow-lg" />
            ) : (
              <ChevronLeft className="w-4 h-4 text-white drop-shadow-lg" />
            )}
          </button>

          {/* Brand Header */}
          <div className="p-6 border-b border-white/10">
            {!isDesktopSidebarCollapsed ? (
              <>
                <div className="flex items-center space-x-3 mb-4">
                  <div className="relative group">
                    <div className="absolute inset-0 bg-gradient-to-br from-purple-600 to-pink-600 rounded-2xl blur-lg opacity-75 group-hover:opacity-100 transition-opacity duration-300"></div>
                    <div className="relative bg-gradient-to-br from-purple-600 to-pink-600 p-3 rounded-2xl shadow-xl">
                      <Package className="w-6 h-6 text-white" />
                    </div>
                  </div>
                  <div>
                    <h1 className="text-lg font-black text-white">
                      Hassan Muse
                    </h1>
                    <p className="text-xs text-purple-300 font-medium">
                      BookShop & Cyber
                    </p>
                  </div>
                </div>

                {/* User Info Card */}
                {user && (
                  <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-3">
                    <div className="flex items-center space-x-3">
                      <div className="relative">
                        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-full blur opacity-75"></div>
                        <div className="relative bg-gradient-to-br from-emerald-500 to-teal-500 p-2 rounded-full border-2 border-white/20">
                          <User className="w-4 h-4 text-white" />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-white truncate">
                          {getStaffName(user.email || "")}
                        </p>
                        <p className="text-xs text-purple-300">
                          {isAdmin ? "Administrator" : "Staff"}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="flex justify-center">
                <div className="relative bg-gradient-to-br from-purple-600 to-pink-600 p-3 rounded-2xl shadow-xl">
                  <Package className="w-6 h-6 text-white" />
                </div>
              </div>
            )}
          </div>

          {/* Navigation Menu */}
          <div className="p-4 space-y-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              const showBadge = tab.id === "orders" && pendingOrdersCount > 0;
              return (
                <button
                  key={tab.id}
                  onClick={() => onTabChange(tab.id)}
                  className={`
                    group w-full flex items-center ${
                      isDesktopSidebarCollapsed
                        ? "justify-center"
                        : "justify-between"
                    } px-4 py-3 rounded-xl font-semibold text-sm
                    transition-all duration-300 relative overflow-hidden
                    ${
                      isActive
                        ? "text-white shadow-xl"
                        : "text-slate-300 hover:text-white hover:bg-white/5"
                    }
                  `}
                  title={isDesktopSidebarCollapsed ? tab.label : undefined}
                >
                  {/* Active Background Gradient */}
                  {isActive && (
                    <div
                      className={`absolute inset-0 bg-gradient-to-r ${tab.color} opacity-100`}
                    ></div>
                  )}

                  {/* Hover Effect */}
                  <div className="absolute inset-0 bg-white/0 group-hover:bg-white/5 transition-colors duration-300"></div>

                  {/* Content */}
                  <div
                    className={`relative flex items-center ${
                      isDesktopSidebarCollapsed ? "" : "space-x-3"
                    }`}
                  >
                    <div
                      className={`${
                        isActive
                          ? "bg-white/20"
                          : "bg-white/10 group-hover:bg-white/15"
                      } p-2 rounded-lg transition-colors duration-300 relative`}
                    >
                      <Icon className="w-4 h-4" />
                      {/* Notification Badge */}
                      {showBadge && (
                        <span className="absolute -top-1 -right-1 bg-gradient-to-r from-red-500 to-orange-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center shadow-lg animate-pulse">
                          {pendingOrdersCount > 9 ? "9+" : pendingOrdersCount}
                        </span>
                      )}
                    </div>
                    {!isDesktopSidebarCollapsed && <span>{tab.label}</span>}
                  </div>

                  {/* Badge for expanded sidebar */}
                  {!isDesktopSidebarCollapsed && showBadge && (
                    <div className="relative">
                      <span className="bg-gradient-to-r from-red-500 to-orange-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow-lg animate-pulse">
                        {pendingOrdersCount}
                      </span>
                    </div>
                  )}

                  {/* Arrow Indicator */}
                  {isActive && !isDesktopSidebarCollapsed && (
                    <ChevronRight className="relative w-4 h-4 animate-pulse" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Logout Button */}
          <div className="p-4 border-t border-white/10 mt-auto">
            <button
              onClick={handleLogout}
              className={`w-full bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white px-4 py-3 rounded-xl font-semibold text-sm transition-all duration-300 hover:scale-105 shadow-xl hover:shadow-2xl hover:shadow-rose-500/50 flex items-center ${
                isDesktopSidebarCollapsed
                  ? "justify-center"
                  : "justify-center space-x-2"
              }`}
              title={isDesktopSidebarCollapsed ? "Logout" : undefined}
            >
              <LogOut className="w-4 h-4" />
              {!isDesktopSidebarCollapsed && <span>Logout</span>}
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Top Navbar */}
      <nav className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-white/10 backdrop-blur-2xl border-b border-white/20 shadow-2xl shadow-black/50">
        <div className="px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            {/* Logo & Brand */}
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="bg-white/10 hover:bg-white/20 backdrop-blur-xl border border-white/20 p-2 rounded-xl transition-all duration-300 hover:scale-105"
              >
                {isSidebarOpen ? (
                  <X className="w-5 h-5 text-white" />
                ) : (
                  <Menu className="w-5 h-5 text-white" />
                )}
              </button>

              <div className="flex items-center space-x-2">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-600 to-pink-600 rounded-xl blur opacity-75"></div>
                  <div className="relative bg-gradient-to-br from-purple-600 to-pink-600 p-2 rounded-xl shadow-xl">
                    <Package className="w-4 h-4 text-white" />
                  </div>
                </div>
                <div className="hidden sm:block">
                  <h1 className="text-sm font-black text-white">
                    Hassan Muse BookShop
                  </h1>
                  <p className="text-xs text-purple-300 font-medium">
                    ERP System
                  </p>
                </div>
              </div>
            </div>

            {/* User Section */}
            <div className="flex items-center space-x-2">
              {user && (
                <>
                  {/* Order Notification Badge - Mobile Navbar */}
                  {pendingOrdersCount > 0 && (
                    <div className="relative">
                      <button
                        onClick={() => onTabChange("orders")}
                        className="relative bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 p-2 rounded-xl transition-all duration-300 hover:scale-105 shadow-xl"
                      >
                        <ClipboardList className="w-4 h-4 text-white" />
                        <span className="absolute -top-1 -right-1 bg-gradient-to-r from-red-500 to-orange-500 text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center shadow-lg animate-pulse">
                          {pendingOrdersCount > 9 ? "9+" : pendingOrdersCount}
                        </span>
                      </button>
                    </div>
                  )}

                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-full blur opacity-75"></div>
                    <div className="relative bg-gradient-to-br from-emerald-500 to-teal-500 p-2 rounded-full border-2 border-white/20">
                      <User className="w-4 h-4 text-white" />
                    </div>
                  </div>

                  <button
                    onClick={handleLogout}
                    className="bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white px-3 py-2 rounded-xl font-semibold text-sm transition-all duration-300 hover:scale-105 shadow-xl"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Sidebar - Glassmorphic */}
      <div
        className={`
          fixed inset-y-0 left-0 z-40 w-72 transform transition-transform duration-300 ease-in-out lg:hidden
          ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        {/* Backdrop */}
        {isSidebarOpen && (
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setIsSidebarOpen(false)}
          ></div>
        )}

        {/* Sidebar Content */}
        <div className="relative h-full bg-gradient-to-b from-slate-900/95 via-purple-900/95 to-slate-900/95 backdrop-blur-2xl border-r border-white/20 shadow-2xl overflow-y-auto scrollbar-hide">
          <div className="p-6 space-y-6">
            {/* User Info in Sidebar */}
            {user && (
              <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-4 space-y-3">
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-full blur opacity-75"></div>
                    <div className="relative bg-gradient-to-br from-emerald-500 to-teal-500 p-3 rounded-full border-2 border-white/20">
                      <User className="w-6 h-6 text-white" />
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white">
                      {getStaffName(user.email || "")}
                    </p>
                    <p className="text-xs text-purple-300">
                      {isAdmin ? "Administrator" : "Staff"}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Navigation Links */}
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 px-3">
                Navigation
              </p>
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                const showBadge = tab.id === "orders" && pendingOrdersCount > 0;
                return (
                  <button
                    key={tab.id}
                    onClick={() => {
                      onTabChange(tab.id);
                      setIsSidebarOpen(false);
                    }}
                    className={`
                      w-full flex items-center justify-between px-4 py-3 rounded-xl font-semibold text-sm
                      transition-all duration-300 relative
                      ${
                        isActive
                          ? `bg-gradient-to-r ${tab.color} text-white shadow-xl`
                          : "text-slate-200 hover:bg-white/10 hover:text-white"
                      }
                    `}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="relative">
                        <Icon className="w-5 h-5" />
                        {/* Notification Badge for mobile */}
                        {showBadge && (
                          <span className="absolute -top-2 -right-2 bg-gradient-to-r from-red-500 to-orange-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center shadow-lg animate-pulse">
                            {pendingOrdersCount > 9 ? "9+" : pendingOrdersCount}
                          </span>
                        )}
                      </div>
                      <span>{tab.label}</span>
                      {showBadge && (
                        <span className="bg-gradient-to-r from-red-500 to-orange-500 text-white text-xs font-bold px-2 py-0.5 rounded-full shadow-lg animate-pulse ml-auto">
                          {pendingOrdersCount}
                        </span>
                      )}
                    </div>
                    {isActive && <ChevronRight className="w-4 h-4" />}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <main
        className={`relative pt-16 lg:pt-0 min-h-screen transition-all duration-300 ${
          isDesktopSidebarCollapsed ? "lg:ml-20" : "lg:ml-72 xl:ml-80"
        }`}
      >
        <div className="px-3 sm:px-4 lg:px-6 py-3 md:py-4 lg:py-6 max-w-[1600px] mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
