import { useEffect, useRef, useState } from "react";
import { Heart, Home, Search, ShoppingBag, Store } from "lucide-react";
import { useCart } from "../../contexts/CartContext";
import { useWishlist } from "../lib/prefs";
import { navigate, useRoute } from "../lib/router";
import { useStorefrontUI } from "../lib/ui-context";

/* ═══════════════════════════════════════════════════════════════
   Mobile bottom navigation — thumb-first, glass bar with a raised
   accent search button. Hides on scroll-down, returns on scroll-up.
   ═══════════════════════════════════════════════════════════════ */

export default function MobileTabBar() {
  const route = useRoute();
  const ui = useStorefrontUI();
  const { totalItems } = useCart();
  const wishlist = useWishlist();
  const [hidden, setHidden] = useState(false);
  const lastY = useRef(0);

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      // Ignore small jitters; never hide near the top.
      if (Math.abs(y - lastY.current) > 12) {
        setHidden(y > lastY.current && y > 160);
        lastY.current = y;
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const tabs = [
    { key: "home", label: "Home", icon: Home, to: "/" },
    { key: "shop", label: "Shop", icon: Store, to: "/products" },
    { key: "search", label: "Search", icon: Search, action: ui.openSearch },
    {
      key: "saved",
      label: "Saved",
      icon: Heart,
      to: "/wishlist",
      badge: wishlist.length,
    },
    {
      key: "cart",
      label: "Cart",
      icon: ShoppingBag,
      action: ui.openCart,
      badge: totalItems,
    },
  ] as const;

  return (
    <nav
      aria-label="Mobile navigation"
      className={`fixed inset-x-3 bottom-3 z-40 transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] lg:hidden ${
        hidden ? "translate-y-[130%]" : "translate-y-0"
      }`}
    >
      <div
        className="sf-safe-bottom flex items-center justify-around rounded-[26px] px-2 py-2"
        style={{
          background: "rgba(250, 248, 244, 0.88)",
          backdropFilter: "blur(24px) saturate(1.7)",
          WebkitBackdropFilter: "blur(24px) saturate(1.7)",
          border: "1px solid var(--sf-line)",
          boxShadow: "var(--sf-shadow-lg)",
        }}
      >
        {tabs.map((tab) => {
          const isSearch = tab.key === "search";
          const active = "to" in tab && tab.to ? route.path === tab.to : false;
          const Icon = tab.icon;

          if (isSearch) {
            return (
              <button
                key={tab.key}
                type="button"
                onClick={tab.action}
                aria-label="Search"
                className="-mt-7 flex h-14 w-14 items-center justify-center rounded-full transition-transform duration-300 active:scale-90"
                style={{
                  background: "var(--sf-accent)",
                  color: "var(--sf-accent-ink)",
                  boxShadow: "var(--sf-shadow-accent)",
                }}
              >
                <Icon className="h-6 w-6" />
              </button>
            );
          }

          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => {
                if ("action" in tab && tab.action) tab.action();
                else if ("to" in tab && tab.to) navigate(tab.to);
              }}
              className="relative flex min-w-[56px] flex-col items-center gap-0.5 rounded-2xl px-2 py-1.5 transition-colors active:scale-95"
              style={{ color: active ? "var(--sf-accent)" : "var(--sf-ink-faint)" }}
            >
              <span className="relative">
                <Icon className="h-[22px] w-[22px]" />
                {"badge" in tab && tab.badge > 0 && (
                  <span
                    className="absolute -right-2 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-bold"
                    style={{
                      background: "var(--sf-accent)",
                      color: "var(--sf-accent-ink)",
                    }}
                  >
                    {tab.badge > 99 ? "99+" : tab.badge}
                  </span>
                )}
              </span>
              <span className="text-[10px] font-semibold">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
