import { useState } from "react";
import { ShoppingCart, User, Menu, X, Package } from "lucide-react";
import { useCart } from "../../contexts/CartContext";
import { useAuth } from "../../contexts/AuthContext";
import Button from "./Button";
import Container from "./Container";

interface StorefrontNavbarProps {
  onCartClick?: () => void;
  onLoginClick?: () => void;
  onLogoClick?: () => void;
  onTrackOrderClick?: () => void;
  onDashboardClick?: () => void;
}

export default function StorefrontNavbar({
  onCartClick,
  onLoginClick,
  onLogoClick,
  onTrackOrderClick,
  onDashboardClick,
}: StorefrontNavbarProps) {
  const { totalItems } = useCart();
  const { user, signOut } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-50 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl shadow-lg border-b border-slate-200 dark:border-slate-800">
      <Container>
        <div className="flex items-center justify-between h-16 sm:h-20">
          {/* Logo */}
          <button
            onClick={onLogoClick}
            className="flex items-center gap-2 sm:gap-3 group"
          >
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-amber-600 to-yellow-600 rounded-xl flex items-center justify-center shadow-lg shadow-amber-500/50 group-hover:shadow-xl group-hover:shadow-amber-500/60 transition-shadow">
              <span className="text-white font-black text-xl sm:text-2xl">
                H
              </span>
            </div>
            <div className="hidden sm:block">
              <h1 className="text-xl sm:text-2xl font-black bg-gradient-to-r from-amber-600 to-yellow-600 bg-clip-text text-transparent">
                HORUMAR
              </h1>
              <p className="text-xs text-slate-600 dark:text-slate-400 -mt-1">
                Your Business. Your Progress.
              </p>
            </div>
          </button>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-6">
            <button
              onClick={onTrackOrderClick}
              className="flex items-center gap-2 text-slate-700 dark:text-slate-300 hover:text-amber-600 dark:hover:text-amber-400 font-semibold transition-colors"
            >
              <Package className="w-4 h-4" />
              Track Order
            </button>
            {user && (
              <button
                onClick={onDashboardClick}
                className="flex items-center gap-2 text-slate-700 dark:text-slate-300 hover:text-amber-600 dark:hover:text-amber-400 font-semibold transition-colors"
              >
                <User className="w-4 h-4" />
                Dashboard
              </button>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 sm:gap-4">
            {/* Cart Button */}
            <button onClick={onCartClick} className="relative group">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-amber-600 to-yellow-600 rounded-xl flex items-center justify-center shadow-lg shadow-amber-500/50 group-hover:shadow-xl group-hover:shadow-amber-500/60 transition-all group-hover:scale-105">
                <ShoppingCart className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              {totalItems > 0 && (
                <span className="absolute -top-1 -right-1 bg-gradient-to-r from-amber-500 to-yellow-500 text-white text-xs font-black rounded-full w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center shadow-lg animate-pulse">
                  {totalItems}
                </span>
              )}
            </button>

            {/* User Menu */}
            <div className="hidden sm:block">
              {user ? (
                <div className="flex items-center gap-2">
                  <button
                    onClick={onDashboardClick}
                    className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-green-500 rounded-full flex items-center justify-center text-white font-bold shadow-lg hover:shadow-xl transition-shadow"
                  >
                    {user.email?.charAt(0).toUpperCase()}
                  </button>
                  <Button onClick={() => signOut()} variant="ghost" size="sm">
                    Sign Out
                  </Button>
                </div>
              ) : (
                <Button onClick={onLoginClick} variant="primary" size="sm">
                  <User className="w-4 h-4" />
                  Sign In
                </Button>
              )}
            </div>

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-700 dark:text-slate-300"
            >
              {mobileMenuOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden py-4 border-t border-slate-200 dark:border-slate-800 space-y-2">
            <button
              onClick={() => {
                onTrackOrderClick?.();
                setMobileMenuOpen(false);
              }}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold"
            >
              <Package className="w-5 h-5" />
              Track Order
            </button>
            {user ? (
              <>
                <button
                  onClick={() => {
                    onDashboardClick?.();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold"
                >
                  <User className="w-5 h-5" />
                  My Dashboard
                </button>
                <button
                  onClick={() => {
                    signOut();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950 font-semibold"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <button
                onClick={() => {
                  onLoginClick?.();
                  setMobileMenuOpen(false);
                }}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-gradient-to-r from-amber-600 to-yellow-600 text-white font-semibold shadow-lg"
              >
                <User className="w-5 h-5" />
                Sign In
              </button>
            )}
          </div>
        )}
      </Container>
    </nav>
  );
}
