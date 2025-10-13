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
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";

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

  // Check if current user is admin
  const isAdmin =
    user?.email?.includes("admin") || user?.email?.includes("yussuf");

  // Dynamic tabs based on user role
  const baseTabs = [
    {
      id: "dashboard",
      label: "Dashboard",
      icon: LayoutDashboard,
      color: "from-purple-600 to-pink-600",
    },
    {
      id: "inventory",
      label: "Inventory",
      icon: Package,
      color: "from-blue-600 to-cyan-600",
    },
    {
      id: "sales",
      label: "Sales",
      icon: ShoppingCart,
      color: "from-emerald-600 to-teal-600",
    },
    {
      id: "orders",
      label: "Orders",
      icon: ClipboardList,
      color: "from-orange-600 to-amber-600",
    },
    {
      id: "search",
      label: "Search",
      icon: Search,
      color: "from-violet-600 to-purple-600",
    },
    {
      id: "reports",
      label: "Reports",
      icon: FileText,
      color: "from-indigo-600 to-blue-600",
    },
  ];

  const adminTabs = [
    {
      id: "user-activity",
      label: "Staff Activity",
      icon: Activity,
      color: "from-rose-600 to-pink-600",
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
  ];

  const tabs = isAdmin ? [...baseTabs, ...adminTabs] : baseTabs;

  const getStaffName = (email: string) => {
    if (email.includes("yussuf") || email.includes("admin"))
      return "Yussuf Muse (Admin)";
    if (email.includes("zakaria")) return "Zakaria";
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

      {/* Glassmorphic Top Navbar - Mobile First */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/10 backdrop-blur-2xl border-b border-white/20 shadow-2xl shadow-black/50">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 md:h-20">
            {/* Logo & Brand */}
            <div className="flex items-center space-x-3 md:space-x-4">
              <button
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="lg:hidden bg-white/10 hover:bg-white/20 backdrop-blur-xl border border-white/20 p-2 rounded-xl transition-all duration-300 hover:scale-105"
              >
                {isSidebarOpen ? (
                  <X className="w-5 h-5 text-white" />
                ) : (
                  <Menu className="w-5 h-5 text-white" />
                )}
              </button>

              <div className="flex items-center space-x-3">
                <div className="relative group">
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-600 to-pink-600 rounded-2xl blur-lg opacity-75 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="relative bg-gradient-to-br from-purple-600 to-pink-600 p-2.5 md:p-3 rounded-2xl shadow-xl">
                    <Package className="w-5 h-5 md:w-6 md:h-6 text-white" />
                  </div>
                </div>
                <div className="hidden sm:block">
                  <h1 className="text-lg md:text-xl font-black text-white">
                    Hassan Muse BookShop
                  </h1>
                  <p className="text-xs text-purple-300 font-medium">
                    Premium ERP System
                  </p>
                </div>
              </div>
            </div>

            {/* Desktop Navigation - Scrollable */}
            <div className="hidden lg:flex items-center flex-1 mx-4 xl:mx-8 overflow-hidden">
              <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide w-full">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => onTabChange(tab.id)}
                      className={`
                        flex items-center gap-2 px-3 py-2 rounded-xl font-semibold text-xs
                        transition-all duration-300 whitespace-nowrap flex-shrink-0
                        ${
                          isActive
                            ? `bg-gradient-to-r ${tab.color} text-white shadow-lg`
                            : "text-slate-300 hover:bg-white/10 hover:text-white"
                        }
                      `}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* User Section */}
            <div className="flex items-center space-x-2 md:space-x-3">
              {user && (
                <>
                  {/* User Info - Hidden on mobile */}
                  <div className="hidden md:flex items-center space-x-3">
                    <div className="text-right">
                      <p className="text-sm font-bold text-white">
                        {getStaffName(user.email || "")}
                      </p>
                      <p className="text-xs text-purple-300">
                        {isAdmin ? "Administrator" : "Staff Member"}
                      </p>
                    </div>
                    <div className="relative group">
                      <div className="absolute inset-0 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-full blur opacity-75 group-hover:opacity-100 transition-opacity"></div>
                      <div className="relative bg-gradient-to-br from-emerald-500 to-teal-500 p-2.5 rounded-full border-2 border-white/20">
                        <User className="w-5 h-5 text-white" />
                      </div>
                    </div>
                  </div>

                  {/* Mobile user avatar */}
                  <div className="md:hidden relative group">
                    <div className="absolute inset-0 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-full blur opacity-75"></div>
                    <div className="relative bg-gradient-to-br from-emerald-500 to-teal-500 p-2 rounded-full border-2 border-white/20">
                      <User className="w-4 h-4 text-white" />
                    </div>
                  </div>

                  {/* Logout Button */}
                  <button
                    onClick={handleLogout}
                    className="bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white px-3 md:px-4 py-2 rounded-xl font-semibold text-sm transition-all duration-300 hover:scale-105 shadow-xl hover:shadow-2xl hover:shadow-rose-500/50"
                  >
                    <LogOut className="w-4 h-4 md:hidden" />
                    <span className="hidden md:inline">Logout</span>
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
        <div className="relative h-full bg-gradient-to-b from-slate-900/95 via-purple-900/95 to-slate-900/95 backdrop-blur-2xl border-r border-white/20 shadow-2xl overflow-y-auto">
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
                return (
                  <button
                    key={tab.id}
                    onClick={() => {
                      onTabChange(tab.id);
                      setIsSidebarOpen(false);
                    }}
                    className={`
                      w-full flex items-center justify-between px-4 py-3 rounded-xl font-semibold text-sm
                      transition-all duration-300
                      ${
                        isActive
                          ? `bg-gradient-to-r ${tab.color} text-white shadow-xl`
                          : "text-slate-200 hover:bg-white/10 hover:text-white"
                      }
                    `}
                  >
                    <div className="flex items-center space-x-3">
                      <Icon className="w-5 h-5" />
                      <span>{tab.label}</span>
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
      <main className="relative pt-16 md:pt-20 min-h-screen">
        <div className="px-4 sm:px-6 lg:px-8 py-6 md:py-8 lg:py-10 max-w-[1600px] mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
