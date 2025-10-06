import { ReactNode } from "react";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Search,
  FileText,
  LogOut,
  User,
} from "lucide-react";
import { useAuth } from '../contexts/AuthContext';

interface LayoutProps {
  children: ReactNode;
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const tabs = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "inventory", label: "Inventory", icon: Package },
  { id: "sales", label: "Sales", icon: ShoppingCart },
  { id: "search", label: "Search", icon: Search },
  { id: "reports", label: "Reports", icon: FileText },
];

export default function Layout({
  children,
  activeTab,
  onTabChange,
}: LayoutProps) {
  const { user, signOut } = useAuth();

  const getStaffName = (email: string) => {
    if (email.includes('hassan')) return 'Hassan (Owner)';
    if (email.includes('zakaria')) return 'Zakaria';
    if (email.includes('khaled')) return 'Khaled';
    return email.split('@')[0];
  };

  const handleLogout = async () => {
    if (confirm('Ma hubtaa inaad ka baxayso? - Are you sure you want to log out?')) {
      await signOut();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Enhanced Header with Glass Effect */}
      <header className="backdrop-blur-md bg-white/90 shadow-lg border-b border-white/20 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-400 to-purple-600 rounded-xl blur opacity-75"></div>
                <div className="relative bg-gradient-to-br from-blue-500 to-purple-600 p-3 rounded-xl shadow-lg">
                  <Package className="w-7 h-7 text-white" />
                </div>
              </div>
              <div>
                <h1 className="text-xl sm:text-3xl font-black bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
                  Hassan Muse BookShop
                </h1>
                <p className="text-xs sm:text-sm text-slate-600 font-medium">
                  ✨ Nidaamka Maamulka Dukaamada - Professional Management
                  System
                </p>
              </div>
            </div>
            
            {/* User Info and Logout */}
            <div className="flex items-center space-x-4">
              {/* Status Indicator */}
              <div className="hidden sm:flex items-center space-x-2">
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span className="text-xs text-slate-600 font-medium">
                    Hawlgal - Live
                  </span>
                </div>
              </div>

              {/* User Info */}
              {user && (
                <div className="flex items-center space-x-3">
                  <div className="hidden sm:block text-right">
                    <p className="text-sm font-semibold text-slate-800">
                      {getStaffName(user.email || '')}
                    </p>
                    <p className="text-xs text-slate-500">
                      Shaqaale - Staff Member
                    </p>
                  </div>
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-br from-green-400 to-blue-500 rounded-full blur opacity-50"></div>
                    <div className="relative bg-gradient-to-br from-green-400 to-blue-500 p-2 rounded-full">
                      <User className="w-5 h-5 text-white" />
                    </div>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="group flex items-center space-x-2 px-3 py-2 bg-red-50 hover:bg-red-100 text-red-700 rounded-lg transition-all duration-300 border border-red-200 hover:border-red-300"
                  >
                    <LogOut className="w-4 h-4 group-hover:scale-110 transition-transform" />
                    <span className="hidden sm:inline text-sm font-medium">Ka bax</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Enhanced Navigation with Modern Tabs */}
      <nav className="mt-2 backdrop-blur-md bg-white/80 border-b border-white/30 shadow-sm overflow-x-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-2 min-w-max py-2">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => onTabChange(tab.id)}
                  className={`group relative flex items-center space-x-2 px-4 sm:px-6 py-3 rounded-xl font-semibold text-sm transition-all duration-300 whitespace-nowrap ${
                    isActive
                      ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg transform scale-105"
                      : "text-slate-700 hover:bg-white/60 hover:shadow-md hover:scale-102"
                  }`}
                >
                  {isActive && (
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-500 rounded-xl blur opacity-30"></div>
                  )}
                  <Icon
                    className={`w-5 h-5 transition-all duration-300 ${
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

      {/* Enhanced Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="animate-fadeIn">{children}</div>
      </main>
    </div>
  );
}
