import { useState, useCallback, memo, useEffect } from "react";
import {
  Search,
  ShoppingCart,
  User,
  Menu,
  X,
  Settings,
  LogOut,
} from "lucide-react";
import { useCart } from "../contexts/CartContext";
import { useAuth } from "../contexts/AuthContext";
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
    const [isScrolled, setIsScrolled] = useState(false);
    const cart = useCart();
    const { user, signOut } = useAuth();

    // Track scroll position for enhanced navbar
    useEffect(() => {
      const handleScroll = () => {
        setIsScrolled(window.scrollY > 10);
      };

      window.addEventListener("scroll", handleScroll);
      return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    const handleSearchChange = useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        onSearchChange(value);

        // If user is searching, automatically scroll to products section with offset for fixed navbar
        if (value.trim()) {
          setTimeout(() => {
            const productsSection = document.getElementById("products-section");
            if (productsSection) {
              const navbarHeight = 140; // Account for fixed navbar height
              const elementPosition =
                productsSection.getBoundingClientRect().top;
              const offsetPosition =
                elementPosition + window.pageYOffset - navbarHeight;

              window.scrollTo({
                top: offsetPosition,
                behavior: "smooth",
              });
            }
          }, 150);
        }
      },
      [onSearchChange]
    );

    // Function to highlight product and scroll to it
    const highlightProduct = useCallback((productId: string) => {
      setTimeout(() => {
        const productElement = document.querySelector(
          `[data-product-id="${productId}"]`
        );
        if (productElement) {
          productElement.scrollIntoView({
            behavior: "smooth",
            block: "center",
          });

          // Add highlight class
          productElement.classList.add("ring-highlight");

          // Remove highlight after 2 seconds
          setTimeout(() => {
            productElement.classList.remove("ring-highlight");
          }, 2000);
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

    const toggleMobileMenu = useCallback(() => {
      setIsMobileMenuOpen((prev) => !prev);
    }, []);

    const toggleUserMenu = useCallback(() => {
      setIsUserMenuOpen((prev) => !prev);
    }, []);

    return (
      <header
        className={`fixed top-0 left-0 right-0 bg-gradient-to-r from-slate-900/98 via-purple-900/98 to-slate-900/98 backdrop-blur-xl shadow-2xl border-b-2 border-purple-500/30 z-[100] transition-all duration-500 ease-out ${
          isScrolled
            ? "shadow-purple-900/50 border-b-2 border-purple-400/40"
            : ""
        }`}
        style={{ backdropFilter: "blur(20px)" }}
      >
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 md:h-18">
            {/* Logo */}
            <div className="flex items-center min-w-0">
              <div className="flex-shrink-0">
                <h1 className="text-lg sm:text-xl md:text-2xl font-black bg-gradient-to-r from-white via-purple-200 to-blue-200 bg-clip-text text-transparent animate-gradient-x">
                  HASSAN BOOKSHOP
                </h1>
                <p className="text-[10px] sm:text-xs text-purple-300/80 hidden sm:block font-medium">
                  ⚡ Your trusted bookstore
                </p>
              </div>
            </div>

            {/* Desktop Search - Enhanced */}
            <div className="hidden md:flex flex-1 max-w-lg mx-6 lg:mx-8">
              <div className="relative w-full group">
                <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl opacity-20 group-hover:opacity-30 transition-opacity duration-300 blur"></div>
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-purple-400 w-5 h-5 z-10 group-focus-within:text-purple-300 transition-colors" />
                <input
                  type="text"
                  placeholder="Search products... / Raadi alaabta..."
                  value={searchTerm}
                  onChange={handleSearchChange}
                  onFocus={() => setShowSearchSuggestions(true)}
                  onBlur={() =>
                    setTimeout(() => setShowSearchSuggestions(false), 200)
                  }
                  className="relative w-full pl-12 pr-4 py-3 bg-white/5 border-2 border-white/10 text-white placeholder-slate-400/70 rounded-2xl focus:ring-4 focus:ring-purple-500/30 focus:border-purple-400/50 text-sm shadow-lg transition-all duration-300 hover:bg-white/10 hover:border-white/20"
                />

                {/* Search Suggestions */}
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

            {/* Desktop Actions */}
            <div className="hidden md:flex items-center space-x-3">
              {/* Cart */}
              <button
                onClick={onCartClick}
                className="relative p-3 text-slate-300 hover:text-white transition-all duration-300 hover:scale-110 group"
                aria-label={`Shopping cart with ${cart.totalItems} items`}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
                <ShoppingCart className="w-6 h-6 relative z-10" />
                {cart.totalItems > 0 && (
                  <span className="absolute -top-1 -right-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs rounded-full min-w-[20px] h-5 flex items-center justify-center font-bold shadow-lg animate-bounce-subtle px-1">
                    {cart.totalItems > 99 ? "99+" : cart.totalItems}
                  </span>
                )}
              </button>

              {/* User Menu */}
              <div className="relative">
                {user ? (
                  <>
                    <button
                      onClick={toggleUserMenu}
                      className="flex items-center space-x-2 p-2 text-slate-300 hover:text-purple-300 transition-colors"
                    >
                      <User className="w-6 h-6" />
                      <span className="text-sm font-medium">
                        {user.email?.split("@")[0]}
                      </span>
                    </button>

                    {isUserMenuOpen && (
                      <div className="absolute right-0 mt-2 w-56 bg-slate-800 backdrop-blur-xl rounded-xl shadow-2xl border border-white/20 py-2 z-50 animate-in slide-in-from-top-2 duration-200">
                        <div className="px-4 py-2 border-b border-white/20">
                          <p className="text-sm font-medium text-white">
                            Welcome back!
                          </p>
                          <p className="text-xs text-slate-400 truncate">
                            {user.email}
                          </p>
                        </div>

                        {onAdminClick && (
                          <button
                            onClick={() => {
                              onAdminClick();
                              setIsUserMenuOpen(false);
                            }}
                            className="w-full text-left px-4 py-3 text-sm text-slate-300 hover:bg-white/10 hover:text-purple-300 transition-all flex items-center space-x-3 group"
                          >
                            <div className="p-1 rounded-lg bg-purple-500/20 group-hover:bg-purple-500/30 transition-colors">
                              <Settings className="w-4 h-4 text-purple-400" />
                            </div>
                            <div>
                              <span className="font-medium">Admin Panel</span>
                              <p className="text-xs text-slate-500">
                                Manage store
                              </p>
                            </div>
                          </button>
                        )}

                        <button
                          onClick={handleSignOut}
                          className="w-full text-left px-4 py-3 text-sm text-slate-300 hover:bg-white/10 hover:text-red-300 transition-all flex items-center space-x-3 group"
                        >
                          <div className="p-1 rounded-lg bg-red-500/20 group-hover:bg-red-500/30 transition-colors">
                            <LogOut className="w-4 h-4 text-red-400" />
                          </div>
                          <div>
                            <span className="font-medium">Sign Out</span>
                            <p className="text-xs text-slate-500">
                              Logout safely
                            </p>
                          </div>
                        </button>
                      </div>
                    )}
                  </>
                ) : (
                  <button
                    onClick={onAuthClick}
                    className="bg-gradient-to-r from-purple-600 via-purple-500 to-blue-600 text-white px-5 py-2.5 rounded-xl hover:from-purple-700 hover:via-purple-600 hover:to-blue-700 transition-all duration-300 flex items-center space-x-2 shadow-lg hover:shadow-purple-500/50 hover:scale-105 font-semibold"
                  >
                    <User className="w-4 h-4" />
                    <span>Sign In</span>
                  </button>
                )}
              </div>
            </div>

            {/* Mobile menu button - Enhanced */}
            <div className="md:hidden">
              <button
                onClick={toggleMobileMenu}
                className="p-2.5 text-slate-300 hover:text-white transition-all duration-300 hover:bg-white/10 rounded-xl hover:scale-110"
                aria-label="Toggle mobile menu"
              >
                {isMobileMenuOpen ? (
                  <X className="w-6 h-6" />
                ) : (
                  <Menu className="w-6 h-6" />
                )}
              </button>
            </div>
          </div>

          {/* Mobile Search - Enhanced with better visibility */}
          <div className="md:hidden pb-4 pt-2">
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl opacity-20 group-hover:opacity-30 transition-opacity duration-300 blur-sm"></div>
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-purple-400 w-5 h-5 z-10 group-focus-within:text-purple-300 transition-colors" />
              <input
                type="text"
                placeholder="Search... / Raadi..."
                value={searchTerm}
                onChange={handleSearchChange}
                onFocus={() => setShowSearchSuggestions(true)}
                onBlur={() =>
                  setTimeout(() => setShowSearchSuggestions(false), 200)
                }
                className="relative w-full pl-12 pr-4 py-3.5 bg-white/5 border-2 border-white/10 text-white placeholder-slate-400/70 rounded-2xl focus:ring-4 focus:ring-purple-500/30 focus:border-purple-400/50 text-base shadow-xl transition-all duration-300"
              />

              {/* Mobile Search Suggestions */}
              <SearchSuggestions
                searchTerm={searchTerm}
                products={products}
                onSelectProduct={(product) => {
                  onProductSelect?.(product);
                  highlightProduct(product.id);
                  setShowSearchSuggestions(false);
                  setIsMobileMenuOpen(false);
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
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden bg-slate-800 border-t border-white/20">
            <div className="px-4 py-4 space-y-4">
              {/* Cart */}
              <button
                onClick={() => {
                  onCartClick();
                  setIsMobileMenuOpen(false);
                }}
                className="w-full flex items-center justify-between p-3 bg-white/10 rounded-lg hover:bg-white/20 transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <ShoppingCart className="w-5 h-5 text-slate-300" />
                  <span className="font-medium text-white">Shopping Cart</span>
                </div>
                {cart.totalItems > 0 && (
                  <span className="bg-gradient-to-r from-purple-600 to-blue-600 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center font-medium shadow-lg">
                    {cart.totalItems}
                  </span>
                )}
              </button>

              {/* Auth/User Actions */}
              {user ? (
                <div className="space-y-2">
                  <div className="p-3 bg-purple-500/20 border border-purple-500/30 rounded-lg">
                    <p className="text-sm font-medium text-purple-300">
                      Signed in as {user.email?.split("@")[0]}
                    </p>
                  </div>
                  {onAdminClick && (
                    <button
                      onClick={() => {
                        onAdminClick();
                        setIsMobileMenuOpen(false);
                      }}
                      className="w-full flex items-center space-x-3 p-3 bg-white/10 rounded-lg hover:bg-white/20 transition-colors"
                    >
                      <Settings className="w-5 h-5 text-slate-300" />
                      <span className="font-medium text-white">
                        Admin Panel
                      </span>
                    </button>
                  )}
                  <button
                    onClick={() => {
                      handleSignOut();
                      setIsMobileMenuOpen(false);
                    }}
                    className="w-full flex items-center space-x-3 p-3 bg-white/10 rounded-lg hover:bg-white/20 transition-colors"
                  >
                    <LogOut className="w-5 h-5 text-slate-300" />
                    <span className="font-medium text-white">Sign Out</span>
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => {
                    onAuthClick();
                    setIsMobileMenuOpen(false);
                  }}
                  className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white p-3 rounded-lg hover:from-purple-700 hover:to-blue-700 transition-colors flex items-center justify-center space-x-2 shadow-lg"
                >
                  <User className="w-5 h-5" />
                  <span className="font-medium">Sign In</span>
                </button>
              )}
            </div>
          </div>
        )}
      </header>
    );
  }
);

Navbar.displayName = "Navbar";

export default Navbar;
