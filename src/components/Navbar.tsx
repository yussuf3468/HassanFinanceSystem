import { useState, useCallback, memo } from "react";
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
    const cart = useCart();
    const { user, signOut } = useAuth();

    const handleSearchChange = useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        onSearchChange(value);

        // If user is searching, automatically scroll to products section
        if (value.trim()) {
          setTimeout(() => {
            const productsSection = document.getElementById("products-section");
            if (productsSection) {
              productsSection.scrollIntoView({
                behavior: "smooth",
                block: "start",
              });
            }
          }, 100);
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
      <header className="bg-white/95 backdrop-blur-md shadow-lg border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <h1 className="text-xl sm:text-2xl font-black bg-gradient-to-r from-slate-800 via-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Hassan Muse BookShop
                </h1>
                <p className="text-xs text-slate-600 hidden sm:block">
                  Dukaan Online
                </p>
              </div>
            </div>

            {/* Desktop Search */}
            <div className="hidden md:flex flex-1 max-w-md mx-8">
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search products... / Raadi alaabta..."
                  value={searchTerm}
                  onChange={handleSearchChange}
                  onFocus={() => setShowSearchSuggestions(true)}
                  onBlur={() =>
                    setTimeout(() => setShowSearchSuggestions(false), 200)
                  }
                  className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
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
            <div className="hidden md:flex items-center space-x-4">
              {/* Cart */}
              <button
                onClick={onCartClick}
                className="relative p-2 text-slate-600 hover:text-blue-600 transition-colors"
                aria-label={`Shopping cart with ${cart.totalItems} items`}
              >
                <ShoppingCart className="w-6 h-6" />
                {cart.totalItems > 0 && (
                  <span className="absolute -top-1 -right-1 bg-blue-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-medium">
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
                      className="flex items-center space-x-2 p-2 text-slate-600 hover:text-blue-600 transition-colors"
                    >
                      <User className="w-6 h-6" />
                      <span className="text-sm font-medium">
                        {user.email?.split("@")[0]}
                      </span>
                    </button>

                    {isUserMenuOpen && (
                      <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-2xl border border-slate-200 py-2 z-50 animate-in slide-in-from-top-2 duration-200">
                        <div className="px-4 py-2 border-b border-slate-100">
                          <p className="text-sm font-medium text-slate-900">
                            Welcome back!
                          </p>
                          <p className="text-xs text-slate-500 truncate">
                            {user.email}
                          </p>
                        </div>

                        {onAdminClick && (
                          <button
                            onClick={() => {
                              onAdminClick();
                              setIsUserMenuOpen(false);
                            }}
                            className="w-full text-left px-4 py-3 text-sm text-slate-700 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 hover:text-blue-700 transition-all flex items-center space-x-3 group"
                          >
                            <div className="p-1 rounded-lg bg-blue-100 group-hover:bg-blue-200 transition-colors">
                              <Settings className="w-4 h-4 text-blue-600" />
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
                          className="w-full text-left px-4 py-3 text-sm text-slate-700 hover:bg-gradient-to-r hover:from-red-50 hover:to-pink-50 hover:text-red-700 transition-all flex items-center space-x-3 group"
                        >
                          <div className="p-1 rounded-lg bg-red-100 group-hover:bg-red-200 transition-colors">
                            <LogOut className="w-4 h-4 text-red-600" />
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
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
                  >
                    <User className="w-4 h-4" />
                    <span>Sign In</span>
                  </button>
                )}
              </div>
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden">
              <button
                onClick={toggleMobileMenu}
                className="p-2 text-slate-600 hover:text-blue-600 transition-colors"
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

          {/* Mobile Search */}
          <div className="md:hidden pb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search products..."
                value={searchTerm}
                onChange={handleSearchChange}
                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              />
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden bg-white border-t border-slate-200">
            <div className="px-4 py-4 space-y-4">
              {/* Cart */}
              <button
                onClick={() => {
                  onCartClick();
                  setIsMobileMenuOpen(false);
                }}
                className="w-full flex items-center justify-between p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <ShoppingCart className="w-5 h-5 text-slate-600" />
                  <span className="font-medium">Shopping Cart</span>
                </div>
                {cart.totalItems > 0 && (
                  <span className="bg-blue-600 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center font-medium">
                    {cart.totalItems}
                  </span>
                )}
              </button>

              {/* Auth/User Actions */}
              {user ? (
                <div className="space-y-2">
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <p className="text-sm font-medium text-blue-800">
                      Signed in as {user.email?.split("@")[0]}
                    </p>
                  </div>
                  {onAdminClick && (
                    <button
                      onClick={() => {
                        onAdminClick();
                        setIsMobileMenuOpen(false);
                      }}
                      className="w-full flex items-center space-x-3 p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
                    >
                      <Settings className="w-5 h-5 text-slate-600" />
                      <span className="font-medium">Admin Panel</span>
                    </button>
                  )}
                  <button
                    onClick={() => {
                      handleSignOut();
                      setIsMobileMenuOpen(false);
                    }}
                    className="w-full flex items-center space-x-3 p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
                  >
                    <LogOut className="w-5 h-5 text-slate-600" />
                    <span className="font-medium">Sign Out</span>
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => {
                    onAuthClick();
                    setIsMobileMenuOpen(false);
                  }}
                  className="w-full bg-blue-600 text-white p-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
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
