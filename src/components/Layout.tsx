import { ReactNode, useEffect, useRef, useState } from "react";
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
  Monitor,
  CreditCard,
  TrendingUp,
  RotateCcw,
  Receipt,
  Layers,
  Moon,
  Sun,
  Calculator,
  MoreHorizontal,
  ChevronDown,
  Store,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { useTheme } from "../contexts/ThemeContext";
import { usePendingOrdersCount } from "../hooks/useSupabaseQuery";

interface LayoutProps {
  children: ReactNode;
  activeTab: string;
  onTabChange: (tab: string) => void;
}

type BadgeKey = "pendingOrders";

interface NavItem {
  id: string;
  label: string;
  sublabel?: string; // Somali label shown smaller
  icon: LucideIcon;
  badge?: BadgeKey;
  adminOnly?: boolean;
  staffOnly?: boolean;
  mobilePrimary?: boolean; // Show in mobile bottom nav
}

interface NavGroup {
  label: string;
  adminOnly?: boolean;
  items: NavItem[];
}

const NAV_GROUPS: NavGroup[] = [
  {
    label: "Operations",
    items: [
      {
        id: "dashboard",
        label: "Dashboard",
        sublabel: "Guddi guud",
        icon: LayoutDashboard,
        adminOnly: true,
        mobilePrimary: true,
      },
      {
        id: "staff-dashboard",
        label: "My Sales",
        sublabel: "Iibkayga",
        icon: TrendingUp,
        staffOnly: true,
        mobilePrimary: true,
      },
      {
        id: "sales",
        label: "New Sale",
        sublabel: "Iibka",
        icon: ShoppingCart,
        mobilePrimary: true,
      },
      {
        id: "sales-history",
        label: "Sales History",
        sublabel: "Diiwaanka iibka",
        icon: Receipt,
      },
      {
        id: "returns",
        label: "Returns",
        sublabel: "Soo celinta",
        icon: RotateCcw,
      },
    ],
  },
  {
    label: "Inventory",
    items: [
      {
        id: "inventory",
        label: "Products",
        sublabel: "Alaabta",
        icon: Package,
      },
      {
        id: "organized-inventory",
        label: "Browse Products",
        sublabel: "Daawo alaabta",
        icon: Layers,
      },
      {
        id: "search",
        label: "Search Products",
        sublabel: "Raadi alaabta",
        icon: Search,
      },
    ],
  },
  {
    label: "Customers",
    items: [
      {
        id: "orders",
        label: "Online Orders",
        sublabel: "Dalabyada",
        icon: ClipboardList,
        badge: "pendingOrders",
        mobilePrimary: true,
      },
      {
        id: "customer-balances",
        label: "Customer Balances",
        sublabel: "Baaqiyada macaamiisha",
        icon: Users,
      },
      {
        id: "customer-credit",
        label: "Customer Credit",
        sublabel: "Deynta macaamiisha",
        icon: CreditCard,
      },
    ],
  },
  {
    label: "Finance",
    adminOnly: true,
    items: [
      {
        id: "financial-dashboard",
        label: "Financial Dashboard",
        sublabel: "Guddi maaliyadeed",
        icon: LayoutDashboard,
      },
      {
        id: "business-profit",
        label: "Profit Tracker",
        sublabel: "Faaiidada",
        icon: Calculator,
      },
      {
        id: "expenses",
        label: "Expenses",
        sublabel: "Kharashyada",
        icon: DollarSign,
      },
      {
        id: "investments",
        label: "Investments",
        sublabel: "Maalgelinta",
        icon: PiggyBank,
      },
      {
        id: "debts",
        label: "Debts",
        sublabel: "Deymaha",
        icon: Banknote,
      },
    ],
  },
  {
    label: "More",
    items: [
      {
        id: "cyber-services",
        label: "Cyber Services",
        sublabel: "Adeegyada cyber-ka",
        icon: Monitor,
      },
      {
        id: "reports",
        label: "Reports",
        sublabel: "Warbixinnada",
        icon: FileText,
        adminOnly: true,
      },
    ],
  },
];

const BRAND = {
  name: "Hassan Bookshop",
  tagline: "Point of Sale & Inventory",
};

export default function Layout({
  children,
  activeTab,
  onTabChange,
}: LayoutProps) {
  const { user, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { data: pendingOrdersCount = 0 } = usePendingOrdersCount();

  // Role detection (unchanged from before)
  const isAdmin = user?.email === "admin@bookshop.ke";
  const isStaff = user?.email === "khalid123@gmail.com";

  // UI state
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [moreSheetOpen, setMoreSheetOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Close user menu on outside click
  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (
        userMenuRef.current &&
        !userMenuRef.current.contains(e.target as Node)
      ) {
        setUserMenuOpen(false);
      }
    }
    if (userMenuOpen) {
      document.addEventListener("mousedown", onClickOutside);
      return () => document.removeEventListener("mousedown", onClickOutside);
    }
  }, [userMenuOpen]);

  // Close mobile sheets when tab changes
  useEffect(() => {
    setMobileMenuOpen(false);
    setMoreSheetOpen(false);
  }, [activeTab]);

  // Lock body scroll when a mobile overlay is open
  useEffect(() => {
    const lock = mobileMenuOpen || moreSheetOpen;
    if (lock) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = prev;
      };
    }
  }, [mobileMenuOpen, moreSheetOpen]);

  function getBadge(key?: BadgeKey): number {
    if (key === "pendingOrders") return pendingOrdersCount;
    return 0;
  }

  function isItemVisible(item: NavItem): boolean {
    if (item.adminOnly && !isAdmin) return false;
    if (item.staffOnly && !isStaff) return false;
    return true;
  }

  function isGroupVisible(group: NavGroup): boolean {
    if (group.adminOnly && !isAdmin) return false;
    return group.items.some(isItemVisible);
  }

  const visibleGroups = NAV_GROUPS.filter(isGroupVisible).map((g) => ({
    ...g,
    items: g.items.filter(isItemVisible),
  }));

  // Mobile bottom nav: 4 primary items + More
  const mobilePrimaryItems = visibleGroups
    .flatMap((g) => g.items)
    .filter((i) => i.mobilePrimary)
    .slice(0, 4);

  // Staff display name
  const staffName = (() => {
    const email = user?.email || "";
    if (email.includes("galiyowabi") || email.includes("admin"))
      return "Yussuf Muse";
    if (email.includes("khaled") || email.includes("khalid")) return "Khalid";
    return email.split("@")[0] || "Staff";
  })();

  async function handleLogout() {
    if (confirm("Log out of Hassan Bookshop?")) {
      await signOut();
    }
  }

  // Render helpers
  function NavButton({
    item,
    compact = false,
    onClick,
  }: {
    item: NavItem;
    compact?: boolean;
    onClick: () => void;
  }) {
    const Icon = item.icon;
    const active = activeTab === item.id;
    const badge = getBadge(item.badge);
    return (
      <button
        type="button"
        onClick={onClick}
        className={`group relative w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
          active
            ? "bg-emerald-600 text-white shadow-sm"
            : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
        }`}
      >
        <span className="relative flex-shrink-0">
          <Icon className="w-5 h-5" />
          {badge > 0 && (
            <span className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 px-1 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow">
              {badge > 9 ? "9+" : badge}
            </span>
          )}
        </span>
        {!compact && (
          <span className="flex-1 text-left min-w-0">
            <span className="block truncate leading-tight">{item.label}</span>
            {item.sublabel && (
              <span
                className={`block text-[11px] truncate leading-tight ${
                  active ? "text-emerald-50" : "text-slate-400 dark:text-slate-500"
                }`}
              >
                {item.sublabel}
              </span>
            )}
          </span>
        )}
      </button>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      {/* =========================================================
          TOP BAR (all screens)
      ========================================================= */}
      <header className="fixed top-0 left-0 right-0 z-40 h-14 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-3 sm:px-4 lg:pl-64 lg:pr-6">
        {/* Mobile/tablet: hamburger + brand */}
        <div className="flex items-center gap-2 min-w-0 lg:hidden">
          <button
            type="button"
            onClick={() => setMobileMenuOpen(true)}
            aria-label="Open menu"
            className="w-9 h-9 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center flex-shrink-0">
              <Store className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold leading-tight truncate">
                {BRAND.name}
              </p>
            </div>
          </div>
        </div>

        {/* Desktop: page title area (kept clean) */}
        <div className="hidden lg:flex items-center min-w-0">
          <h1 className="text-sm font-semibold text-slate-500 dark:text-slate-400">
            {currentPageLabel(activeTab) || BRAND.tagline}
          </h1>
        </div>

        {/* Right side: theme, user menu */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          <button
            type="button"
            onClick={toggleTheme}
            aria-label="Toggle theme"
            className="w-9 h-9 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300"
            title={theme === "dark" ? "Switch to light" : "Switch to dark"}
          >
            {theme === "dark" ? (
              <Sun className="w-5 h-5" />
            ) : (
              <Moon className="w-5 h-5" />
            )}
          </button>

          {pendingOrdersCount > 0 && (
            <button
              type="button"
              onClick={() => onTabChange("orders")}
              className="relative h-9 px-2.5 rounded-lg bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 text-xs font-bold flex items-center gap-1.5 hover:bg-amber-100 dark:hover:bg-amber-900/50"
              title="Pending orders"
            >
              <ClipboardList className="w-4 h-4" />
              <span>{pendingOrdersCount}</span>
            </button>
          )}

          {/* User menu */}
          <div className="relative" ref={userMenuRef}>
            <button
              type="button"
              onClick={() => setUserMenuOpen((v) => !v)}
              className="h-9 px-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-1.5"
            >
              <div className="w-7 h-7 rounded-full bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 font-bold text-xs flex items-center justify-center">
                {staffName.charAt(0).toUpperCase()}
              </div>
              <span className="hidden sm:inline text-sm font-medium text-slate-700 dark:text-slate-200 max-w-[120px] truncate">
                {staffName}
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
            </button>
            {userMenuOpen && (
              <div className="absolute right-0 top-full mt-1.5 w-56 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-700">
                  <p className="text-sm font-semibold truncate">{staffName}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                    {user?.email}
                  </p>
                  <span className="inline-block mt-1 text-[10px] uppercase tracking-wider px-1.5 py-0.5 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 rounded font-bold">
                    {isAdmin ? "Administrator" : isStaff ? "Staff" : "Member"}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setUserMenuOpen(false);
                    handleLogout();
                  }}
                  className="w-full px-4 py-2.5 text-left text-sm text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/20 flex items-center gap-2 font-medium"
                >
                  <LogOut className="w-4 h-4" />
                  Sign out
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* =========================================================
          DESKTOP SIDEBAR (lg+)
      ========================================================= */}
      <aside className="hidden lg:flex fixed top-0 left-0 bottom-0 z-50 w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex-col">
        {/* Brand */}
        <div className="h-14 px-4 flex items-center gap-2.5 border-b border-slate-200 dark:border-slate-800 flex-shrink-0">
          <div className="w-9 h-9 rounded-lg bg-emerald-600 text-white flex items-center justify-center">
            <Store className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold leading-tight truncate">
              {BRAND.name}
            </p>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight truncate">
              {BRAND.tagline}
            </p>
          </div>
        </div>

        {/* Nav groups */}
        <nav className="flex-1 overflow-y-auto scrollbar-hide py-4 px-4 space-y-4">
          {visibleGroups.map((group) => (
            <div key={group.label}>
              <p className="px-3 mb-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                {group.label}
              </p>
              <div className="space-y-0.5">
                {group.items.map((item) => (
                  <NavButton
                    key={item.id}
                    item={item}
                    onClick={() => onTabChange(item.id)}
                  />
                ))}
              </div>
            </div>
          ))}
        </nav>

        {/* Footer credit */}
        <div className="px-4 py-3 border-t border-slate-200 dark:border-slate-800 flex-shrink-0 text-[10px] text-slate-400 dark:text-slate-500 flex items-center justify-between">
          <span>© {new Date().getFullYear()} {BRAND.name}</span>
          <a
            href="https://lenzro.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-amber-600 dark:text-amber-400 hover:underline font-medium"
          >
            Powered by Lenzro
          </a>
        </div>
      </aside>

      {/* =========================================================
          MOBILE DRAWER MENU
      ========================================================= */}
      {mobileMenuOpen && (
        <>
          <div
            className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm lg:hidden"
            onClick={() => setMobileMenuOpen(false)}
          />
          <aside className="fixed top-0 left-0 bottom-0 z-50 w-72 max-w-[85vw] bg-white dark:bg-slate-900 shadow-2xl flex flex-col lg:hidden animate-slide-in-left">
            <div className="h-14 px-4 flex items-center justify-between border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-lg bg-emerald-600 text-white flex items-center justify-center">
                  <Store className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-bold leading-tight">{BRAND.name}</p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight">
                    {BRAND.tagline}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                aria-label="Close menu"
                className="w-9 h-9 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* User chip */}
            {user && (
              <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800 flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 font-bold flex items-center justify-center">
                  {staffName.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold truncate">{staffName}</p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                    {isAdmin ? "Administrator" : isStaff ? "Staff" : "Member"}
                  </p>
                </div>
              </div>
            )}

            <nav className="flex-1 overflow-y-auto scrollbar-hide py-4 px-4 space-y-4">
              {visibleGroups.map((group) => (
                <div key={group.label}>
                  <p className="px-3 mb-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                    {group.label}
                  </p>
                  <div className="space-y-0.5">
                    {group.items.map((item) => (
                      <NavButton
                        key={item.id}
                        item={item}
                        onClick={() => onTabChange(item.id)}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </nav>

            <div className="p-3 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={handleLogout}
                className="w-full h-10 rounded-lg bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 text-sm font-bold flex items-center justify-center gap-2 hover:bg-rose-100 dark:hover:bg-rose-900/30"
              >
                <LogOut className="w-4 h-4" />
                Sign out
              </button>
            </div>
          </aside>
        </>
      )}

      {/* =========================================================
          MOBILE "MORE" SHEET (extra nav items)
      ========================================================= */}
      {moreSheetOpen && (
        <>
          <div
            className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm lg:hidden"
            onClick={() => setMoreSheetOpen(false)}
          />
          <div className="fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-slate-900 rounded-t-2xl shadow-2xl max-h-[85vh] flex flex-col lg:hidden animate-fade-in">
            <div className="relative px-4 pt-4 pb-2 flex items-center justify-between border-b border-slate-200 dark:border-slate-800">
              <span className="absolute top-1.5 left-1/2 -translate-x-1/2 w-10 h-1 rounded-full bg-slate-300 dark:bg-slate-700" />
              <h2 className="text-base font-bold">All sections</h2>
              <button
                type="button"
                onClick={() => setMoreSheetOpen(false)}
                aria-label="Close"
                className="w-8 h-8 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <nav className="flex-1 overflow-y-auto scrollbar-hide p-3 space-y-4">
              {visibleGroups.map((group) => (
                <div key={group.label}>
                  <p className="px-3 mb-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                    {group.label}
                  </p>
                  <div className="space-y-0.5">
                    {group.items.map((item) => (
                      <NavButton
                        key={item.id}
                        item={item}
                        onClick={() => onTabChange(item.id)}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </nav>
          </div>
        </>
      )}

      {/* =========================================================
          MAIN CONTENT
      ========================================================= */}
      <main className="lg:pl-64 pt-14 pb-20 lg:pb-0 min-h-screen">
        <div className="px-3 sm:px-5 lg:px-6 py-4 lg:py-6 max-w-[1600px] mx-auto w-full">
          {children}
        </div>

        {/* Desktop footer */}
        <footer className="hidden lg:block border-t border-slate-200 dark:border-slate-800 py-3 px-6 text-xs text-slate-500 dark:text-slate-400 text-center">
          © {new Date().getFullYear()} {BRAND.name} ·{" "}
          <a
            href="https://lenzro.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-amber-600 dark:text-amber-400 hover:underline font-medium"
          >
            Powered by Lenzro
          </a>
        </footer>
      </main>

      {/* =========================================================
          MOBILE BOTTOM NAV
      ========================================================= */}
      <nav
        className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-stretch justify-around"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        {mobilePrimaryItems.map((item) => {
          const Icon = item.icon;
          const active = activeTab === item.id;
          const badge = getBadge(item.badge);
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onTabChange(item.id)}
              className={`relative flex-1 py-2 flex flex-col items-center justify-center gap-0.5 text-[10px] font-semibold transition-colors ${
                active
                  ? "text-emerald-600 dark:text-emerald-400"
                  : "text-slate-500 dark:text-slate-400"
              }`}
            >
              <span className="relative">
                <Icon className="w-5 h-5" />
                {badge > 0 && (
                  <span className="absolute -top-1.5 -right-2 min-w-[16px] h-4 px-1 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow">
                    {badge > 9 ? "9+" : badge}
                  </span>
                )}
              </span>
              <span className="truncate max-w-[64px]">{item.label}</span>
              {active && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-emerald-600 dark:bg-emerald-400 rounded-b" />
              )}
            </button>
          );
        })}
        <button
          type="button"
          onClick={() => setMoreSheetOpen(true)}
          className="relative flex-1 py-2 flex flex-col items-center justify-center gap-0.5 text-[10px] font-semibold text-slate-500 dark:text-slate-400"
        >
          <MoreHorizontal className="w-5 h-5" />
          <span>More</span>
        </button>
      </nav>
    </div>
  );
}

// Resolve current page label for desktop header
function currentPageLabel(tabId: string): string {
  for (const g of NAV_GROUPS) {
    const found = g.items.find((i) => i.id === tabId);
    if (found) return found.label;
  }
  return "";
}
