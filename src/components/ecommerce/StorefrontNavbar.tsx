import { useState } from "react";
import { ShoppingCart, User, Menu, X, Package, Search, Sun } from "lucide-react";
import { useCart } from "../../contexts/CartContext";
import { useAuth } from "../../contexts/AuthContext";
import { useTheme } from "../../contexts/ThemeContext";
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
  const { toggleTheme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-50 border-t border-amber-500/60 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white shadow-xl">
      <Container>
        <div className="flex items-center justify-between gap-4 py-3 sm:py-3.5">
          {/* Logo */}
          <button onClick={onLogoClick} className="min-w-0 text-left">
            <h1 className="truncate text-lg font-black uppercase tracking-wide text-amber-500 sm:text-2xl">
              HASSAN BOOKS
            </h1>
            <p className="text-xs text-slate-300 sm:text-sm">Your Business. Your Progress.</p>
          </button>

          {/* Desktop Search */}
          <div className="hidden md:flex flex-1 max-w-[540px]">
            <div className="relative w-full">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                placeholder="Search products... / Raadi alaabta..."
                className="w-full rounded-xl border border-slate-600 bg-slate-700/60 py-3 pl-12 pr-4 text-lg text-slate-200 placeholder:text-slate-400 outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-500/30"
              />
            </div>
          </div>

          {/* Desktop Actions */}
          <div className="hidden lg:flex items-center gap-4">
            <button
              onClick={onTrackOrderClick}
              className="inline-flex items-center gap-2 rounded-xl border border-amber-600 px-4 py-2.5 text-sm font-semibold text-amber-300 transition hover:bg-amber-600/10"
            >
              <Package className="w-4 h-4" />
              Track Order
            </button>

            <button
              onClick={toggleTheme}
              className="p-2 text-slate-300 transition hover:text-white"
              aria-label="Toggle theme"
            >
              <Sun className="h-5 w-5" />
            </button>

            <button
              onClick={onCartClick}
              className="relative p-2 text-slate-300 transition hover:text-white"
              aria-label="Open cart"
            >
              <ShoppingCart className="h-6 w-6" />
              {totalItems > 0 && (
                <span className="absolute -top-1 -right-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-amber-500 px-1 text-[10px] font-bold text-white">
                  {totalItems > 9 ? "9+" : totalItems}
                </span>
              )}
            </button>

            {user && (
              <button
                onClick={onDashboardClick}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-600 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:bg-slate-700"
              >
                <User className="w-4 h-4" />
                Dashboard
              </button>
            )}
          </div>

          {/* Auth + Mobile toggle */}
          <div className="flex items-center gap-2">
            <div className="hidden sm:block">
              {user ? (
                <div className="flex items-center gap-2">
                  <Button
                    onClick={() => signOut()}
                    variant="ghost"
                    size="sm"
                    className="!text-slate-200"
                  >
                    Sign Out
                  </Button>
                </div>
              ) : (
                <Button
                  onClick={onLoginClick}
                  variant="primary"
                  size="sm"
                  className="!rounded-xl !bg-amber-500 !border !border-amber-300 !px-5 !py-2 !text-sm !font-semibold hover:!bg-amber-400"
                >
                  <User className="w-4 h-4" />
                  Sign In
                </Button>
              )}
            </div>

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden w-10 h-10 rounded-xl bg-slate-700/70 flex items-center justify-center text-slate-200"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden py-4 border-t border-slate-700 space-y-2">
            <div className="px-2 pb-2">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search products..."
                  className="w-full rounded-xl border border-slate-600 bg-slate-700/60 py-2.5 pl-10 pr-3 text-slate-200 placeholder:text-slate-400"
                />
              </div>
            </div>
            <button
              onClick={() => {
                onTrackOrderClick?.();
                setMobileMenuOpen(false);
              }}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-100 hover:bg-slate-700 font-semibold"
            >
              <Package className="w-5 h-5" />
              Track Order
            </button>
            <button
              onClick={() => {
                onCartClick?.();
                setMobileMenuOpen(false);
              }}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-100 hover:bg-slate-700 font-semibold"
            >
              <ShoppingCart className="w-5 h-5" />
              Cart ({totalItems})
            </button>
            {user ? (
              <>
                <button
                  onClick={() => {
                    onDashboardClick?.();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-100 hover:bg-slate-700 font-semibold"
                >
                  <User className="w-5 h-5" />
                  My Dashboard
                </button>
                <button
                  onClick={() => {
                    signOut();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-300 hover:bg-red-950/40 font-semibold"
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
                className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl bg-amber-500 text-white font-semibold shadow-lg"
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
