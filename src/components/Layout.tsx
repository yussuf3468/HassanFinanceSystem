import { ReactNode, useState } from "react";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Search,
  FileText,
  LogOut,
  User,
  Activity,
  Menu,
  X,
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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Check if current user is admin
  const isAdmin =
    user?.email?.includes("admin") || user?.email?.includes("yussuf");

  // Dynamic tabs based on user role
  const baseTabs = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "inventory", label: "Inventory", icon: Package },
    { id: "sales", label: "Sales", icon: ShoppingCart },
    { id: "search", label: "Search", icon: Search },
    { id: "reports", label: "Reports", icon: FileText },
  ];

  const adminTabs = [
    { id: "user-activity", label: "Staff Activity", icon: Activity },
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Mobile-First Responsive Header */}
      <header className="backdrop-blur-md bg-white/90 shadow-lg border-b border-white/20 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-2 sm:py-4">
          <div className="flex items-center justify-between">
            {/* Logo and Title - Mobile Optimized */}
            <div className="flex items-center space-x-2 sm:space-x-4 flex-1 min-w-0">
              <div className="relative flex-shrink-0">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-400 to-purple-600 rounded-lg sm:rounded-xl blur opacity-75"></div>
                <div className="relative bg-gradient-to-br from-blue-500 to-purple-600 p-2 sm:p-3 rounded-lg sm:rounded-xl shadow-lg">
                  <Package className="w-5 h-5 sm:w-7 sm:h-7 text-white" />
                </div>
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="text-sm sm:text-xl lg:text-3xl font-black bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent truncate">
                  Hassan Muse BookShop
                </h1>
                <p className="text-xs sm:text-sm text-slate-600 font-medium truncate">
                  <span className="hidden sm:inline">✨ Nidaamka Maamulka Dukaamada - </span>
                  Professional System
                </p>
              </div>
            </div>

            {/* User Info and Controls - Mobile Optimized */}
            <div className="flex items-center space-x-2 sm:space-x-4 flex-shrink-0">
              {/* Status Indicator - Hidden on mobile */}
              <div className="hidden lg:flex items-center space-x-2">
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span className="text-xs text-slate-600 font-medium">
                    Hawlgal - Live
                  </span>
                </div>
              </div>

              {/* User Info */}
              {user && (
                <div className="flex items-center space-x-2 sm:space-x-3">
                  {/* User Details - Responsive */}
                  <div className="hidden md:block text-right">
                    <p className="text-xs sm:text-sm font-semibold text-slate-800">
                      {getStaffName(user.email || "")}
                    </p>
                    <p className="text-xs text-slate-500">
                      Shaqaale - Staff Member
                    </p>
                  </div>
                  
                  {/* User Avatar */}
                  <div className="relative flex-shrink-0">
                    <div className="absolute inset-0 bg-gradient-to-br from-green-400 to-blue-500 rounded-full blur opacity-50"></div>
                    <div className="relative bg-gradient-to-br from-green-400 to-blue-500 p-1.5 sm:p-2 rounded-full">
                      <User className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                    </div>
                  </div>
                  
                  {/* Logout Button - Mobile Optimized */}
                  <button
                    onClick={handleLogout}
                    className="group flex items-center space-x-1 sm:space-x-2 px-2 sm:px-3 py-1.5 sm:py-2 bg-red-50 hover:bg-red-100 text-red-700 rounded-lg transition-all duration-300 border border-red-200 hover:border-red-300"
                  >
                    <LogOut className="w-3 h-3 sm:w-4 sm:h-4 group-hover:scale-110 transition-transform" />
                    <span className="hidden sm:inline text-xs sm:text-sm font-medium">
                      Ka bax
                    </span>
                  </button>

                  {/* Mobile Menu Toggle */}
                  <button
                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    className="md:hidden flex items-center justify-center w-8 h-8 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                  >
                    {isMobileMenuOpen ? (
                      <X className="w-5 h-5 text-slate-600" />
                    ) : (
                      <Menu className="w-5 h-5 text-slate-600" />
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Navigation Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 top-[72px] bg-black/50 backdrop-blur-sm z-40">
          <div className="bg-white/95 backdrop-blur-md border-b border-white/30 shadow-lg">
            <div className="max-w-7xl mx-auto px-3 py-4">
              <div className="grid grid-cols-2 gap-2">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => {
                        onTabChange(tab.id);
                        setIsMobileMenuOpen(false);
                      }}
                      className={`flex flex-col items-center space-y-1 p-3 rounded-xl font-semibold text-xs transition-all duration-300 ${
                        isActive
                          ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg"
                          : "text-slate-700 bg-white/60 hover:bg-white/80 hover:shadow-md"
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="font-bold">{tab.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Desktop Navigation - Hidden on Mobile */}
      <nav className="hidden md:block backdrop-blur-md bg-white/80 border-b border-white/30 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-1 lg:space-x-2 overflow-x-auto py-2">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => onTabChange(tab.id)}
                  className={`group relative flex items-center space-x-2 px-3 lg:px-6 py-3 rounded-xl font-semibold text-sm transition-all duration-300 whitespace-nowrap flex-shrink-0 ${
                    isActive
                      ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg transform scale-105"
                      : "text-slate-700 hover:bg-white/60 hover:shadow-md hover:scale-102"
                  }`}
                >
                  {isActive && (
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-500 rounded-xl blur opacity-30"></div>
                  )}
                  <Icon
                    className={`w-4 h-4 lg:w-5 lg:h-5 transition-all duration-300 ${
                      isActive ? "animate-pulse" : "group-hover:scale-110"
                    }`}
                  />
                  <span className="relative font-bold">{tab.label}</span>
                  {isActive && (
                    <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-white rounded-full"></div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Main Content Area - Mobile Optimized */}
      <main className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
        <div className="animate-fadeIn">{children}</div>
      </main>
    </div>
  );
}
