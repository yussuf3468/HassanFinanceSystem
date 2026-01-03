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
  Users,
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
  RotateCcw,
  Receipt,
  Layers,
  Moon,
  Sun,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { useTheme } from "../contexts/ThemeContext";
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
  const { theme, toggleTheme } = useTheme();
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
            color: "from-amber-500 to-rose-500",
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
      color: "from-amber-500 to-amber-600",
    },
    {
      id: "organized-inventory",
      label: "Browse Products",
      icon: Layers,
      color: "from-amber-500 to-amber-600",
    },
    {
      id: "cyber-services",
      label: "Adeegyada Cyber-ka",
      icon: Monitor,
      color: "from-amber-500 to-amber-600",
    },
    {
      id: "sales",
      label: "Iibka",
      icon: ShoppingCart,
      color: "from-emerald-600 to-teal-600",
    },
    {
      id: "sales-history",
      label: "Sales Transaction Log",
      icon: Receipt,
      color: "from-amber-500 to-amber-600",
    },
    {
      id: "customer-balances",
      label: "Baaqiyada Macaamiisha",
      icon: Users,
      color: "from-red-600 to-orange-600",
    },
    {
      id: "returns",
      label: "Soo Celinta",
      icon: RotateCcw,
      color: "from-rose-600 to-red-600",
    },
    {
      id: "search",
      label: "Raadi Alaabta",
      icon: Search,
      color: "from-amber-500 to-amber-600",
    },
    {
      id: "customer-credit",
      label: "Deynta Macaamiisha",
      icon: CreditCard,
      color: "from-teal-600 to-cyan-600",
    },
  ];

  const adminTabs = [
    {
      id: "financial-dashboard",
      label: "Guddi Maaliyadeed",
      icon: LayoutDashboard,
      color: "from-amber-500 to-amber-600",
    },
    {
      id: "expenses",
      label: "Kharashyada",
      icon: DollarSign,
      color: "from-red-600 to-rose-600",
    },
    {
      id: "investments",
      label: "Maalgelinta Hore",
      icon: PiggyBank,
      color: "from-green-600 to-emerald-600",
    },
    {
      id: "debts",
      label: "Deymaha",
      icon: Banknote,
      color: "from-amber-600 to-yellow-600",
    },
    {
      id: "reports",
      label: "Warbixinnada",
      icon: FileText,
      color: "from-amber-500 to-amber-600",
    },
    {
      id: "orders",
      label: "Dalabyada",
      icon: ClipboardList,
      color: "from-orange-600 to-amber-600",
    },

    // {
    //   id: "user-activity",
    //   label: "Staff Activity",
    //   icon: Activity,
    //   color: "from-rose-600 to-orange-600",
    // },
  ];

  const tabs = isAdmin ? [...baseTabs, ...adminTabs] : baseTabs;

  // ✅ Real-time subscription is handled inside usePendingOrdersCount hook
  // No need for manual fetching - React Query auto-refetches every 2 minutes

  const getStaffName = (email: string) => {
    if (email.includes("galiyowabi") || email.includes("admin"))
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
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-amber-50/60 via-orange-50/30 to-amber-50/40 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 transition-colors duration-200">
      {/* Subtle Background Pattern */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none opacity-20 dark:opacity-10">
        <div
          className="absolute top-0 left-0 w-full h-full"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, rgb(251 191 36 / 0.2) 1px, transparent 0)`,
            backgroundSize: "40px 40px",
          }}
        ></div>
      </div>

      {/* Desktop Sidebar - Clean Modern Design */}
      <aside
        className={`hidden lg:block fixed left-0 top-0 bottom-0 z-40 transition-all duration-300 ${
          isDesktopSidebarCollapsed ? "w-20" : "w-72 xl:w-80"
        }`}
      >
        <div className="h-full bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-700 shadow-sm overflow-y-auto scrollbar-hide transition-colors duration-200">
          {/* Collapse Toggle Button */}
          <button
            onClick={() =>
              setIsDesktopSidebarCollapsed(!isDesktopSidebarCollapsed)
            }
            className="fixed bg-amber-500 hover:bg-amber-600 dark:bg-amber-600 dark:hover:bg-amber-700 p-2 rounded-full shadow-lg hover:shadow-xl hover:scale-110 transition-all duration-200 z-50"
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
              <ChevronRight className="w-4 h-4 text-white" />
            ) : (
              <ChevronLeft className="w-4 h-4 text-white" />
            )}
          </button>

          {/* Brand Header - Clean */}
          <div className="p-6 border-b border-slate-200 dark:border-slate-700">
            {!isDesktopSidebarCollapsed ? (
              <>
                <div className="hidden lg:flex items-center space-x-3 mb-4">
                  <div className="bg-amber-500 dark:bg-amber-600 p-3 rounded-xl">
                    <Package className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h1 className="text-lg font-bold text-slate-900 dark:text-white">
                      HASSAN BOOKSHOP
                    </h1>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                      Bookshop & Cyber
                    </p>
                  </div>
                </div>

                {/* Dark Mode Toggle */}
                <button
                  onClick={toggleTheme}
                  className="w-full mb-3 flex items-center justify-center space-x-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl p-2 transition-all duration-200"
                  aria-label="Toggle dark mode"
                >
                  {theme === "dark" ? (
                    <>
                      <Sun className="w-4 h-4 text-amber-500" />
                      <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                        Light Mode
                      </span>
                    </>
                  ) : (
                    <>
                      <Moon className="w-4 h-4 text-slate-700" />
                      <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                        Dark Mode
                      </span>
                    </>
                  )}
                </button>

                {/* User Info Card - Clean */}
                {user && (
                  <div className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3">
                    <div className="flex items-center space-x-3">
                      <div className="bg-emerald-500 dark:bg-emerald-600 p-2 rounded-lg">
                        <User className="w-4 h-4 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                          {getStaffName(user.email || "")}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                          {isAdmin ? "Administrator" : "Staff"}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="flex flex-col items-center space-y-3">
                <div className="relative bg-gradient-to-br from-amber-500 to-amber-600 p-3 rounded-2xl shadow-xl shadow-amber-400/10">
                  <Package className="w-6 h-6 text-white" />
                </div>
                {/* Dark Mode Toggle - Collapsed */}
                <button
                  onClick={toggleTheme}
                  className="bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl p-1.5 transition-all duration-200"
                  aria-label="Toggle dark mode"
                >
                  {theme === "dark" ? (
                    <Sun className="w-4 h-4 text-amber-500" />
                  ) : (
                    <Moon className="w-4 h-4 text-slate-700 dark:text-slate-300" />
                  )}
                </button>
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
                    } px-4 py-3 rounded-lg font-medium text-sm
                    transition-all duration-200 relative
                    ${
                      isActive
                        ? "bg-amber-500 dark:bg-amber-600 text-white shadow-md"
                        : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white"
                    }
                  `}
                  title={isDesktopSidebarCollapsed ? tab.label : undefined}
                >
                  {/* Content */}
                  <div
                    className={`flex items-center ${
                      isDesktopSidebarCollapsed ? "" : "space-x-3"
                    }`}
                  >
                    <Icon
                      className={`w-5 h-5 ${
                        isActive
                          ? "text-white"
                          : "text-slate-600 dark:text-slate-400"
                      }`}
                    />
                    {/* Notification Badge */}
                    {showBadge && (
                      <span className="absolute top-2 left-7 bg-rose-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center shadow-md">
                        {pendingOrdersCount > 9 ? "9+" : pendingOrdersCount}
                      </span>
                    )}
                    {!isDesktopSidebarCollapsed && <span>{tab.label}</span>}
                  </div>

                  {/* Badge for expanded sidebar */}
                  {!isDesktopSidebarCollapsed && showBadge && (
                    <span className="bg-rose-500 text-white text-xs font-semibold px-2 py-0.5 rounded-full shadow-md">
                      {pendingOrdersCount}
                    </span>
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
          <div className="p-4 border-t border-slate-200 dark:border-slate-700 mt-auto">
            <button
              onClick={handleLogout}
              className={`w-full bg-gradient-to-r from-rose-500 to-red-500 hover:from-rose-600 hover:to-red-600 dark:from-rose-600 dark:to-red-600 dark:hover:from-rose-700 dark:hover:to-red-700 text-white px-4 py-3 rounded-xl font-semibold text-sm transition-all duration-200 hover:shadow-lg flex items-center ${
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
      <nav className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 shadow-sm transition-colors duration-200">
        <div className="px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            {/* Logo & Brand */}
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 p-2 rounded-lg transition-all duration-200"
              >
                {isSidebarOpen ? (
                  <X className="w-5 h-5 text-slate-900 dark:text-white" />
                ) : (
                  <Menu className="w-5 h-5 text-slate-900 dark:text-white" />
                )}
              </button>

              <div className="flex items-center space-x-2 min-w-0">
                <div className="bg-amber-500 dark:bg-amber-600 p-2 rounded-xl">
                  <Package className="w-4 h-4 text-white" />
                </div>
                <div className="hidden sm:block min-w-0">
                  <h1 className="text-sm font-black text-slate-900 dark:text-white truncate max-w-[160px]">
                    HASSAN BOOKSHOP
                  </h1>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
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
                        className="relative bg-amber-500 dark:bg-amber-600 hover:bg-amber-600 dark:hover:bg-amber-700 p-2 rounded-lg transition-all duration-200"
                      >
                        <ClipboardList className="w-4 h-4 text-white" />
                        <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center shadow-md animate-pulse">
                          {pendingOrdersCount > 9 ? "9+" : pendingOrdersCount}
                        </span>
                      </button>
                    </div>
                  )}

                  <div className="bg-emerald-500 dark:bg-emerald-600 p-2 rounded-full">
                    <User className="w-4 h-4 text-white" />
                  </div>

                  <button
                    onClick={handleLogout}
                    className="bg-gradient-to-r from-rose-500 to-red-500 hover:from-rose-600 hover:to-red-600 dark:from-rose-600 dark:to-red-600 dark:hover:from-rose-700 dark:hover:to-red-700 text-white px-3 py-2 rounded-lg font-semibold text-sm transition-all duration-200"
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
          fixed top-16 bottom-0 left-0 z-40 w-72 transform transition-transform duration-300 ease-in-out lg:hidden
          ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        {/* Backdrop */}
        {isSidebarOpen && (
          <div
            className="fixed top-16 left-0 right-0 bottom-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setIsSidebarOpen(false)}
          ></div>
        )}

        {/* Sidebar Content */}
        <div className="relative h-full bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-700 shadow-lg overflow-y-auto scrollbar-hide transition-colors duration-200">
          <div className="p-6 space-y-6">
            {/* User Info in Sidebar */}
            {user && (
              <div className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4 space-y-3">
                <div className="flex items-center space-x-3">
                  <div className="bg-emerald-500 dark:bg-emerald-600 p-3 rounded-lg">
                    <User className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900 dark:text-white">
                      {getStaffName(user.email || "")}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                      {isAdmin ? "Administrator" : "Staff"}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Navigation Links */}
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 px-3">
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
                      w-full flex items-center justify-between px-4 py-3 rounded-lg font-medium text-sm
                      transition-all duration-200 relative
                      ${
                        isActive
                          ? "bg-amber-500 dark:bg-amber-600 text-white shadow-md"
                          : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white"
                      }
                    `}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="relative">
                        <Icon className="w-5 h-5" />
                        {/* Notification Badge for mobile */}
                        {showBadge && (
                          <span className="absolute -top-2 -right-2 bg-rose-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center shadow-md animate-pulse">
                            {pendingOrdersCount > 9 ? "9+" : pendingOrdersCount}
                          </span>
                        )}
                      </div>
                      <span>{tab.label}</span>
                      {showBadge && (
                        <span className="bg-rose-500 text-white text-xs font-bold px-2 py-0.5 rounded-full shadow-md animate-pulse ml-auto">
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
        className={`relative pt-16 lg:pt-0 transition-all duration-300 ${
          isDesktopSidebarCollapsed ? "lg:ml-20" : "lg:ml-72 xl:ml-80"
        }`}
      >
        <div className="min-h-screen flex flex-col">
          <div className="flex-1 px-3 sm:px-4 lg:px-6 py-3 md:py-4 lg:py-6 max-w-[1600px] mx-auto w-full">
            {children}
          </div>

          {/* Professional Footer Credit */}
          <footer className="mt-auto py-4 border-t border-amber-100/50 dark:border-slate-700 backdrop-blur-xl bg-gradient-to-br from-white to-stone-50/50 dark:from-slate-900 dark:to-slate-800/50 transition-colors duration-200">
            <div className="px-3 sm:px-4 lg:px-6 max-w-[1600px] mx-auto">
              <div className="flex flex-col sm:flex-row items-center justify-center sm:justify-between gap-2 text-xs sm:text-sm text-slate-700 dark:text-slate-400">
                <p className="text-center sm:text-left">
                  © {new Date().getFullYear()} Al-Qalam Bookshop. All rights
                  reserved.
                </p>
                <div className="flex items-center gap-2">
                  <span className="text-slate-400 dark:text-slate-500">
                    Designed & Developed by
                  </span>
                  <a
                    href="https://lenzro.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-amber-500/20 to-amber-600/20 hover:from-amber-500/30 hover:to-amber-600/30 dark:from-amber-500/10 dark:to-amber-600/10 dark:hover:from-amber-500/20 dark:hover:to-amber-600/20 border border-amber-500/30 hover:border-amber-500/50 dark:border-amber-500/20 dark:hover:border-amber-500/40 rounded-xl transition-all hover:scale-105 font-semibold text-amber-800 dark:text-amber-500 hover:text-amber-800 dark:hover:text-amber-400 shadow-lg shadow-amber-300/10 dark:shadow-amber-500/5"
                  >
                    <span className="text-lg">⚡</span>
                    <span>Lenzro</span>
                  </a>
                </div>
              </div>
            </div>
          </footer>
        </div>
      </main>
    </div>
  );
}
