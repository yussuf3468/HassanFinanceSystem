import { useEffect, useState } from "react";
import { Heart, Search, ShoppingBag, UserRound } from "lucide-react";
import { useCart } from "../../contexts/CartContext";
import { storeConfig } from "../config/store";
import { useWishlist } from "../lib/prefs";
import { Link, useRoute } from "../lib/router";
import { useStorefrontUI } from "../lib/ui-context";

/* ═══════════════════════════════════════════════════════════════
   Header — transparent over the dark hero, condenses into a
   floating glass bar once the page scrolls.
   ═══════════════════════════════════════════════════════════════ */

const NAV_ITEMS = [
  { to: "/products", label: "Shop" },
  { to: "/categories", label: "Categories" },
  { to: "/collections", label: "Collections" },
  { to: "/offers", label: "Offers" },
  { to: "/about", label: "About" },
  { to: "/contact", label: "Contact" },
];

export default function Header() {
  const route = useRoute();
  const ui = useStorefrontUI();
  const { totalItems } = useCart();
  const wishlist = useWishlist();
  const [scrolled, setScrolled] = useState(false);

  // Only the homepage opens with a dark hero behind the header.
  const overHero = route.path === "/" && !scrolled;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const inkColor = overHero ? "var(--sf-dark-ink)" : "var(--sf-ink)";

  return (
    <header
      className="fixed inset-x-0 top-0 z-40 transition-all duration-500"
      style={
        scrolled
          ? {
              background: "rgba(250, 248, 244, 0.82)",
              backdropFilter: "blur(20px) saturate(1.6)",
              WebkitBackdropFilter: "blur(20px) saturate(1.6)",
              borderBottom: "1px solid var(--sf-line)",
            }
          : { background: "transparent" }
      }
    >
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between gap-4 px-5 sm:h-[72px] sm:px-8">
        {/* Logo */}
        <Link to="/" className="flex min-w-0 items-center gap-3">
          <span
            className="sf-display flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-lg font-semibold"
            style={{ background: "var(--sf-accent)", color: "var(--sf-accent-ink)" }}
          >
            {storeConfig.monogram}
          </span>
          <span
            className="sf-display truncate text-[17px] font-semibold tracking-tight"
            style={{ color: inkColor }}
          >
            {storeConfig.name}
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-7 lg:flex">
          {NAV_ITEMS.map((item) => {
            const active =
              route.path === item.to ||
              (item.to !== "/" && route.path.startsWith(item.to));
            return (
              <Link
                key={item.to}
                to={item.to}
                className="sf-link text-[13.5px] font-medium transition-colors"
                style={{
                  color: active
                    ? inkColor
                    : overHero
                      ? "var(--sf-dark-ink-soft)"
                      : "var(--sf-ink-soft)",
                }}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          <button
            type="button"
            onClick={ui.openSearch}
            aria-label="Search"
            className="flex h-10 items-center gap-2 rounded-full px-3 transition-all duration-300 hover:scale-105 sm:px-4"
            style={{
              color: inkColor,
              background: overHero ? "rgba(255,255,255,0.1)" : "var(--sf-accent-soft)",
            }}
          >
            <Search className="h-[18px] w-[18px]" />
            <span className="hidden text-[13px] font-medium md:inline">Search</span>
            <kbd
              className="hidden rounded-md px-1.5 py-0.5 text-[10px] font-semibold md:inline"
              style={{
                background: overHero ? "rgba(255,255,255,0.14)" : "rgba(24,20,12,0.07)",
              }}
            >
              ⌘K
            </kbd>
          </button>

          <Link
            to="/wishlist"
            aria-label="Wishlist"
            className="relative hidden h-10 w-10 items-center justify-center rounded-full transition-transform duration-300 hover:scale-110 sm:flex"
            style={{ color: inkColor }}
          >
            <Heart className="h-[19px] w-[19px]" />
            {wishlist.length > 0 && (
              <span
                className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-bold text-white"
                style={{ background: "#e11d48" }}
              >
                {wishlist.length}
              </span>
            )}
          </Link>

          <Link
            to="/account"
            aria-label="Account"
            className="hidden h-10 w-10 items-center justify-center rounded-full transition-transform duration-300 hover:scale-110 sm:flex"
            style={{ color: inkColor }}
          >
            <UserRound className="h-[19px] w-[19px]" />
          </Link>

          <button
            type="button"
            onClick={ui.openCart}
            aria-label="Cart"
            className="relative flex h-10 w-10 items-center justify-center rounded-full transition-transform duration-300 hover:scale-110"
            style={{ color: inkColor }}
          >
            <ShoppingBag className="h-[19px] w-[19px]" />
            {totalItems > 0 && (
              <span
                className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-bold"
                style={{ background: "var(--sf-accent)", color: "var(--sf-accent-ink)" }}
              >
                {totalItems}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
