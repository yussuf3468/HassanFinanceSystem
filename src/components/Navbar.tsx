import { useState, useCallback, useRef, memo } from "react";
import {
  Search,
  ShoppingCart,
  User,
  Menu,
  X,
  LogOut,
  Sun,
  Moon,
  LayoutDashboard,
  BookOpen,
} from "lucide-react";
import { useCart } from "../contexts/CartContext";
import { useAuth } from "../contexts/AuthContext";
import { useTheme } from "../contexts/ThemeContext";
import SearchSuggestions from "./SearchSuggestions";
import type { Product } from "../types";

interface NavbarProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  onCartClick: () => void;
  onAuthClick: () => void;
  onAdminClick?: () => void;
  products?: Product[];
  onProductSelect?: (product: Product) => void;
}

const Navbar = memo(
  ({
    searchTerm,
    onSearchChange,
    onCartClick,
    onAuthClick,
    onAdminClick,
    products = [],
    onProductSelect,
  }: NavbarProps) => {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
    const [showSearchSuggestions, setShowSearchSuggestions] = useState(false);
    const searchRef = useRef<HTMLDivElement>(null);
    const cart = useCart();
    const { user, signOut } = useAuth();
    const { theme, toggleTheme } = useTheme();

    const handleSearchChange = useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        onSearchChange(value);
        if (value.trim()) {
          setTimeout(() => {
            const el = document.getElementById("products-section");
            if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
          }, 100);
        }
      },
      [onSearchChange],
    );

    const highlightProduct = useCallback((productId: string) => {
      setTimeout(() => {
        const el = document.querySelector(`[data-product-id="${productId}"]`);
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "center" });
          el.classList.add("ring-highlight");
          setTimeout(() => el.classList.remove("ring-highlight"), 2000);
        }
      }, 300);
    }, []);

    const handleSignOut = useCallback(async () => {
      try {
        await signOut();
        setIsUserMenuOpen(false);
      } catch (error) {
        console.error("Error signing out:", error);
      }
    }, [signOut]);

    const toggleMobileMenu = useCallback(() => setIsMobileMenuOpen((p) => !p), []);
    const toggleUserMenu = useCallback(() => setIsUserMenuOpen((p) => !p), []);

    return (
      <header className="sticky top-0 z-50 bg-white/90 dark:bg-slate-900/95 backdrop-blur-md border-b border-amber-200/60 dark:border-amber-700/30 shadow-sm shadow-amber-100/40 dark:shadow-black/20">
        {/* Top amber accent line */}
        <div className="h-0.5 bg-gradient-to-r from-amber-400 via-orange-400 to-amber-500" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 sm:gap-6 h-16">

            {/* ── Logo ── */}
            <div className="flex-shrink-0 flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-md shadow-amber-400/30">
                <BookOpen className="w-4 h-4 text-white" strokeWidth={2.5} />
              </div>
              <div className="hidden xs:block">
                <p className="text-base sm:text-lg font-black bg-gradient-to-r from-amber-600 via-orange-500 to-amber-500 bg-clip-text text-transparent leading-none tracking-tight">
                  HASSAN
                </p>
                <p className="text-[9px] text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-[0.18em] leading-none mt-0.5">
                  Bookshop
                </p>
              </div>
              {/* Mobile-only compact logo */}
              <p className="xs:hidden text-base font-black bg-gradient-to-r from-amber-600 to-orange-500 bg-clip-text text-transparent leading-none">
                HASSAN
              </p>
            </div>

            {/* ── Desktop Search ── */}
            <div className="hidden md:flex flex-1 max-w-xl" ref={searchRef}>
              <div className="relative w-full">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 w-4 h-4 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search books, stationery, electronics…"
                  value={searchTerm}
                  onChange={handleSearchChange}
                  onFocus={() => setShowSearchSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowSearchSuggestions(false), 200)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 rounded-xl focus:ring-2 focus:ring-amber-400 focus:border-amber-400 dark:focus:ring-amber-500 dark:focus:border-amber-500 text-sm outline-none transition-all"
                />
                <SearchSuggestions
                  searchTerm={searchTerm}
                  products={products}
                  onSelectProduct={(product) => {
                    onProductSelect?.(product);
                    highlightProduct(product.id);
                    setShowSearchSuggestions(false);
                  }}
                  onSelectSearch={(term) => {
                    onSearchChange(term);
                    setShowSearchSuggestions(false);
                  }}
                  isVisible={showSearchSuggestions}
                  onClose={() => setShowSearchSuggestions(false)}
                />
              </div>
            </div>

            {/* ── Desktop Actions ── */}
            <div className="hidden md:flex items-center gap-2 ml-auto">
              {/* Theme toggle */}
              <button
                onClick={toggleTheme}
                className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-500 dark:text-slate-400 hover:bg-amber-50 dark:hover:bg-slate-800 hover:text-amber-600 dark:hover:text-amber-400 transition-colors"
                aria-label="Toggle theme"
              >
                {theme === "dark" ? <Sun className="w-4.5 h-4.5" /> : <Moon className="w-4.5 h-4.5" />}
              </button>

              {/* Cart */}
              <button
                onClick={onCartClick}
                className="relative w-9 h-9 rounded-xl flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-amber-50 dark:hover:bg-slate-800 hover:text-amber-600 dark:hover:text-amber-400 transition-colors"
                aria-label={`Cart: ${cart.totalItems} items`}
              >
                <ShoppingCart className="w-5 h-5" />
                {cart.totalItems > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-gradient-to-br from-amber-500 to-orange-500 text-white text-[10px] font-black rounded-full flex items-center justify-center px-1 shadow-md shadow-amber-400/40">
                    {cart.totalItems > 99 ? "99+" : cart.totalItems}
                  </span>
                )}
              </button>

              {/* User */}
              {user ? (
                <div className="relative">
                  <button
                    onClick={toggleUserMenu}
                    className="flex items-center gap-2 pl-2.5 pr-3 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700/50 hover:bg-amber-100 dark:hover:bg-amber-900/30 transition-colors"
                  >
                    <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
                      <User className="w-3.5 h-3.5 text-white" />
                    </div>
                    <span className="text-sm font-semibold text-amber-800 dark:text-amber-300 max-w-[80px] truncate">
                      {user.email?.split("@")[0]}
                    </span>
                  </button>

                  {isUserMenuOpen && (
                    <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-700 py-2 z-50">
                      <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-700">
                        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Signed in as</p>
                        <p className="text-sm font-bold text-slate-900 dark:text-white truncate mt-0.5">{user.email}</p>
                      </div>
                      {onAdminClick && (
                        <button
                          onClick={() => { onAdminClick(); setIsUserMenuOpen(false); }}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 dark:text-slate-300 hover:bg-amber-50 dark:hover:bg-amber-900/20 hover:text-amber-700 dark:hover:text-amber-400 transition-colors"
                        >
                          <LayoutDashboard className="w-4 h-4" />
                          <span className="font-semibold">Admin Panel</span>
                        </button>
                      )}
                      <button
                        onClick={handleSignOut}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 dark:text-slate-300 hover:bg-rose-50 dark:hover:bg-rose-900/20 hover:text-rose-600 dark:hover:text-rose-400 transition-colors"
                      >
                        <LogOut className="w-4 h-4" />
                        <span className="font-semibold">Sign Out</span>
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <button
                  onClick={onAuthClick}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white text-sm font-bold hover:from-amber-600 hover:to-orange-600 shadow-md shadow-amber-400/30 transition-all hover:shadow-lg hover:shadow-amber-400/40 active:scale-[0.97]"
                >
                  <User className="w-4 h-4" />
                  Sign In
                </button>
              )}
            </div>

            {/* ── Mobile: Cart + Hamburger ── */}
            <div className="md:hidden flex items-center gap-2 ml-auto">
              <button
                onClick={onCartClick}
                className="relative w-9 h-9 rounded-xl flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-amber-50 dark:hover:bg-slate-800 transition-colors"
              >
                <ShoppingCart className="w-5 h-5" />
                {cart.totalItems > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-gradient-to-br from-amber-500 to-orange-500 text-white text-[10px] font-black rounded-full flex items-center justify-center px-1">
                    {cart.totalItems > 99 ? "99+" : cart.totalItems}
                  </span>
                )}
              </button>
              <button
                onClick={toggleMobileMenu}
                className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                aria-label="Toggle mobile menu"
              >
                {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* ── Mobile Search (always visible below header row) ── */}
          <div className="md:hidden pb-3">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 pointer-events-none" />
              <input
                type="text"
                placeholder="Search products…"
                value={searchTerm}
                onChange={handleSearchChange}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 rounded-xl focus:ring-2 focus:ring-amber-400 focus:border-amber-400 text-sm outline-none transition-all"
              />
            </div>
          </div>
        </div>

        {/* ── Mobile Menu ── */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
            <div className="px-4 py-4 space-y-2">
              {/* Theme */}
              <button
                onClick={toggleTheme}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
              >
                {theme === "dark" ? (
                  <><Sun className="w-4 h-4 text-amber-500" /><span className="font-semibold text-slate-800 dark:text-white text-sm">Light Mode</span></>
                ) : (
                  <><Moon className="w-4 h-4 text-slate-600" /><span className="font-semibold text-slate-800 text-sm">Dark Mode</span></>
                )}
              </button>

              {/* Auth */}
              {user ? (
                <>
                  <div className="px-4 py-3 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700/50">
                    <p className="text-xs text-amber-700 dark:text-amber-400 font-semibold">Signed in as</p>
                    <p className="text-sm font-bold text-amber-900 dark:text-amber-200 truncate">{user.email}</p>
                  </div>
                  {onAdminClick && (
                    <button
                      onClick={() => { onAdminClick(); setIsMobileMenuOpen(false); }}
                      className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors"
                    >
                      <LayoutDashboard className="w-4 h-4 text-amber-600" />
                      <span className="font-semibold text-slate-800 dark:text-white text-sm">Admin Panel</span>
                    </button>
                  )}
                  <button
                    onClick={() => { handleSignOut(); setIsMobileMenuOpen(false); }}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-rose-50 dark:bg-rose-900/20 hover:bg-rose-100 dark:hover:bg-rose-900/30 transition-colors"
                  >
                    <LogOut className="w-4 h-4 text-rose-500" />
                    <span className="font-semibold text-rose-700 dark:text-rose-400 text-sm">Sign Out</span>
                  </button>
                </>
              ) : (
                <button
                  onClick={() => { onAuthClick(); setIsMobileMenuOpen(false); }}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold text-sm shadow-md shadow-amber-400/30"
                >
                  <User className="w-4 h-4" />
                  Sign In
                </button>
              )}
            </div>
          </div>
        )}
      </header>
    );
  },
);

Navbar.displayName = "Navbar";

export default Navbar;
