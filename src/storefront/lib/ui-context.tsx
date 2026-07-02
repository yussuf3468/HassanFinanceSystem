/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Product } from "../../types";

/* ═══════════════════════════════════════════════════════════════
   Storefront UI state — overlays, drawers and the compare tray.
   Kept separate from data (catalog) and commerce (cart) concerns.
   ═══════════════════════════════════════════════════════════════ */

interface StorefrontUI {
  cartOpen: boolean;
  openCart: () => void;
  closeCart: () => void;

  searchOpen: boolean;
  openSearch: () => void;
  closeSearch: () => void;

  quickViewProduct: Product | null;
  openQuickView: (product: Product) => void;
  closeQuickView: () => void;

  checkoutOpen: boolean;
  openCheckout: () => void;
  closeCheckout: () => void;

  trackingOpen: boolean;
  trackingOrderNumber: string | undefined;
  openTracking: (orderNumber?: string) => void;
  closeTracking: () => void;

  authOpen: boolean;
  openAuth: () => void;
  closeAuth: () => void;

  compareIds: string[];
  toggleCompare: (id: string) => void;
  clearCompare: () => void;
  compareOpen: boolean;
  setCompareOpen: (open: boolean) => void;

  /** Entry to the staff/admin side (provided by the host app). */
  onAdminClick: () => void;
}

const UIContext = createContext<StorefrontUI | null>(null);

export function StorefrontUIProvider({
  children,
  onAdminClick,
}: {
  children: ReactNode;
  onAdminClick: () => void;
}) {
  const [cartOpen, setCartOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [trackingOpen, setTrackingOpen] = useState(false);
  const [trackingOrderNumber, setTrackingOrderNumber] = useState<string>();
  const [authOpen, setAuthOpen] = useState(false);
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [compareOpen, setCompareOpen] = useState(false);

  const anyOverlayOpen =
    cartOpen || searchOpen || checkoutOpen || quickViewProduct !== null;

  // Lock body scroll while an overlay is up.
  useEffect(() => {
    if (anyOverlayOpen) {
      const previous = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = previous;
      };
    }
  }, [anyOverlayOpen]);

  // ⌘K / Ctrl+K opens search anywhere in the storefront.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setSearchOpen((open) => !open);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const toggleCompare = useCallback((id: string) => {
    setCompareIds((current) => {
      if (current.includes(id)) return current.filter((v) => v !== id);
      // Compare works best with a handful — cap at 4.
      return current.length >= 4 ? current : [...current, id];
    });
  }, []);

  const openTracking = useCallback((orderNumber?: string) => {
    setTrackingOrderNumber(orderNumber);
    setTrackingOpen(true);
  }, []);

  const value = useMemo<StorefrontUI>(
    () => ({
      cartOpen,
      openCart: () => setCartOpen(true),
      closeCart: () => setCartOpen(false),
      searchOpen,
      openSearch: () => setSearchOpen(true),
      closeSearch: () => setSearchOpen(false),
      quickViewProduct,
      openQuickView: (product) => setQuickViewProduct(product),
      closeQuickView: () => setQuickViewProduct(null),
      checkoutOpen,
      openCheckout: () => {
        setCartOpen(false);
        setCheckoutOpen(true);
      },
      closeCheckout: () => setCheckoutOpen(false),
      trackingOpen,
      trackingOrderNumber,
      openTracking,
      closeTracking: () => setTrackingOpen(false),
      authOpen,
      openAuth: () => setAuthOpen(true),
      closeAuth: () => setAuthOpen(false),
      compareIds,
      toggleCompare,
      clearCompare: () => setCompareIds([]),
      compareOpen,
      setCompareOpen,
      onAdminClick,
    }),
    [
      cartOpen,
      searchOpen,
      quickViewProduct,
      checkoutOpen,
      trackingOpen,
      trackingOrderNumber,
      openTracking,
      authOpen,
      compareIds,
      toggleCompare,
      compareOpen,
      onAdminClick,
    ],
  );

  return <UIContext.Provider value={value}>{children}</UIContext.Provider>;
}

export function useStorefrontUI(): StorefrontUI {
  const context = useContext(UIContext);
  if (!context)
    throw new Error("useStorefrontUI must be used inside StorefrontUIProvider");
  return context;
}
