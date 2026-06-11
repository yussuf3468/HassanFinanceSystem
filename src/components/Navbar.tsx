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
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-black/80 backdrop-blur-xl border-b border-black/5 dark:border-white/10">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
          {/* ── Main row (compact, 48px — Apple-thin) ── */}
          <div className="flex items-center gap-3 h-12 sm:h-12">

            {/* Logo */}
            <button
              type="button"
              onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
              className="flex-shrink-0 flex items-center gap-2 group"
            >
              <div className="w-7 h-7 rounded-lg bg-[#1d1d1f] dark:bg-white flex items-center justify-center">
                <BookOpen
                  className="w-4 h-4 text-white dark:text-[#1d1d1f]"
                  strokeWidth={2}
                />
              </div>
              <span className="text-[15px] font-semibold tracking-tight text-[#1d1d1f] dark:text-white">
                Hassan Bookshop
              </span>
            </button>

            {/* Desktop search */}
            <div className="hidden md:flex flex-1 max-w-md mx-auto" ref={searchRef}>
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#86868b] w-4 h-4 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search products"
                  value={searchTerm}
                  onChange={handleSearchChange}
                  onFocus={() => setShowSearchSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowSearchSuggestions(false), 200)}
                  className="w-full pl-9 pr-4 h-9 bg-[#f5f5f7] dark:bg-[#1d1d1f] text-[#1d1d1f] dark:text-white placeholder-[#86868b] rounded-full text-[14px] outline-none focus:ring-2 focus:ring-[#1d1d1f]/15 dark:focus:ring-white/20 transition-all"
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

            {/* Right actions */}
            <div className="flex items-center gap-0.5 sm:gap-1 ml-auto">
              {/* Theme toggle */}
              <button
                onClick={toggleTheme}
                className="w-10 h-10 rounded-full flex items-center justify-center text-[#1d1d1f] dark:text-[#f5f5f7] hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
                aria-label="Toggle theme"
              >
                {theme === "dark" ? (
                  <Sun className="w-[18px] h-[18px]" />
                ) : (
                  <Moon className="w-[18px] h-[18px]" />
                )}
              </button>

              {/* Cart */}
              <button
                onClick={onCartClick}
                className="relative w-10 h-10 rounded-full flex items-center justify-center text-[#1d1d1f] dark:text-[#f5f5f7] hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
                aria-label={`Cart: ${cart.totalItems} items`}
              >
                <ShoppingCart className="w-[18px] h-[18px]" />
                {cart.totalItems > 0 && (
                  <span className="absolute top-1 right-1 min-w-[16px] h-4 bg-[#1d1d1f] dark:bg-white text-white dark:text-[#1d1d1f] text-[10px] font-semibold rounded-full flex items-center justify-center px-1 ring-2 ring-white dark:ring-black">
                    {cart.totalItems > 99 ? "99+" : cart.totalItems}
                  </span>
                )}
              </button>

              {/* Desktop user / sign-in */}
              <div className="hidden md:block">
                {user ? (
                  <div className="relative">
                    <button
                      onClick={toggleUserMenu}
                      className="w-10 h-10 rounded-full flex items-center justify-center text-[#1d1d1f] dark:text-[#f5f5f7] hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
                      aria-label="Account"
                    >
                      <User className="w-[18px] h-[18px]" />
                    </button>
                    {isUserMenuOpen && (
                      <div className="absolute right-0 mt-2 w-60 bg-white dark:bg-[#1d1d1f] rounded-2xl shadow-2xl border border-black/5 dark:border-white/10 py-2 z-50">
                        <div className="px-4 py-3 border-b border-black/5 dark:border-white/10">
                          <p className="text-[11px] font-medium text-[#86868b] uppercase tracking-wider">
                            Signed in as
                          </p>
                          <p className="text-[14px] font-semibold text-[#1d1d1f] dark:text-white truncate mt-0.5">
                            {user.email}
                          </p>
                        </div>
                        {onAdminClick && (
                          <button
                            onClick={() => { onAdminClick(); setIsUserMenuOpen(false); }}
                            className="w-full flex items-center gap-3 px-4 py-2.5 text-[14px] text-[#1d1d1f] dark:text-[#f5f5f7] hover:bg-[#f5f5f7] dark:hover:bg-[#2c2c2e] transition-colors"
                          >
                            <LayoutDashboard className="w-4 h-4" />
                            <span className="font-medium">Admin Panel</span>
                          </button>
                        )}
                        <button
                          onClick={handleSignOut}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-[14px] text-[#ff3b30] hover:bg-[#f5f5f7] dark:hover:bg-[#2c2c2e] transition-colors"
                        >
                          <LogOut className="w-4 h-4" />
                          <span className="font-medium">Sign Out</span>
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <button
                    onClick={onAuthClick}
                    className="h-9 px-5 rounded-full bg-[#1d1d1f] hover:bg-black dark:bg-white dark:hover:bg-[#f5f5f7] text-white dark:text-[#1d1d1f] text-[14px] font-medium transition-colors"
                  >
                    Sign in
                  </button>
                )}
              </div>

              {/* Mobile hamburger */}
              <button
                onClick={toggleMobileMenu}
                className="md:hidden w-10 h-10 rounded-full flex items-center justify-center text-[#1d1d1f] dark:text-[#f5f5f7] hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
                aria-label="Menu"
              >
                {isMobileMenuOpen ? (
                  <X className="w-[20px] h-[20px]" />
                ) : (
                  <Menu className="w-[20px] h-[20px]" />
                )}
              </button>
            </div>
          </div>

          {/* ── Mobile search (always visible — mobile-first) ── */}
          <div className="md:hidden pb-2.5">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#86868b] w-4 h-4 pointer-events-none" />
              <input
                type="text"
                placeholder="Search products"
                value={searchTerm}
                onChange={handleSearchChange}
                className="w-full pl-10 pr-4 h-10 bg-[#f5f5f7] dark:bg-[#1d1d1f] text-[#1d1d1f] dark:text-white placeholder-[#86868b] rounded-full text-[15px] outline-none focus:ring-2 focus:ring-[#1d1d1f]/15 dark:focus:ring-white/20 transition-all"
              />
            </div>
          </div>
        </div>

        {/* ── Mobile menu (slide-down sheet) ── */}
        {isMobileMenuOpen && (
          <>
            <div
              className="md:hidden fixed inset-0 top-0 z-40 bg-black/20 backdrop-blur-sm"
              onClick={() => setIsMobileMenuOpen(false)}
            />
            <div className="md:hidden relative z-50 border-t border-black/5 dark:border-white/10 bg-white dark:bg-black">
              <div className="px-4 py-4 space-y-2">
                {/* Account block */}
                {user ? (
                  <>
                    <div className="px-4 py-3 rounded-2xl bg-[#f5f5f7] dark:bg-[#1d1d1f]">
                      <p className="text-[11px] text-[#86868b] font-medium uppercase tracking-wider">
                        Signed in as
                      </p>
                      <p className="text-[15px] font-semibold text-[#1d1d1f] dark:text-white truncate mt-0.5">
                        {user.email}
                      </p>
                    </div>
                    {onAdminClick && (
                      <button
                        onClick={() => { onAdminClick(); setIsMobileMenuOpen(false); }}
                        className="w-full flex items-center gap-3 px-4 h-12 rounded-2xl bg-[#f5f5f7] dark:bg-[#1d1d1f] hover:bg-[#ebebed] dark:hover:bg-[#2c2c2e] transition-colors"
                      >
                        <LayoutDashboard className="w-[18px] h-[18px] text-[#1d1d1f] dark:text-white" />
                        <span className="font-medium text-[#1d1d1f] dark:text-white text-[15px]">
                          Admin Panel
                        </span>
                      </button>
                    )}
                    <button
                      onClick={() => { handleSignOut(); setIsMobileMenuOpen(false); }}
                      className="w-full flex items-center gap-3 px-4 h-12 rounded-2xl bg-[#f5f5f7] dark:bg-[#1d1d1f] hover:bg-[#ebebed] dark:hover:bg-[#2c2c2e] transition-colors"
                    >
                      <LogOut className="w-[18px] h-[18px] text-[#ff3b30]" />
                      <span className="font-medium text-[#ff3b30] text-[15px]">
                        Sign Out
                      </span>
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => { onAuthClick(); setIsMobileMenuOpen(false); }}
                    className="w-full flex items-center justify-center h-12 rounded-full bg-[#1d1d1f] hover:bg-black dark:bg-white dark:hover:bg-[#f5f5f7] text-white dark:text-[#1d1d1f] font-medium text-[15px] transition-colors"
                  >
                    Sign in
                  </button>
                )}

                {/* Theme toggle */}
                <button
                  onClick={toggleTheme}
                  className="w-full flex items-center gap-3 px-4 h-12 rounded-2xl bg-[#f5f5f7] dark:bg-[#1d1d1f] hover:bg-[#ebebed] dark:hover:bg-[#2c2c2e] transition-colors"
                >
                  {theme === "dark" ? (
                    <>
                      <Sun className="w-[18px] h-[18px] text-[#1d1d1f] dark:text-white" />
                      <span className="font-medium text-[#1d1d1f] dark:text-white text-[15px]">
                        Light Mode
                      </span>
                    </>
                  ) : (
                    <>
                      <Moon className="w-[18px] h-[18px] text-[#1d1d1f]" />
                      <span className="font-medium text-[#1d1d1f] text-[15px]">
                        Dark Mode
                      </span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </>
        )}
      </header>
    );
  },
);

Navbar.displayName = "Navbar";

export default Navbar;
