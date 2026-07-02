import { lazy, Suspense, useEffect, useMemo } from "react";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./storefront.css";
import CartDrawer from "./components/CartDrawer";
import CompareTray from "./components/CompareTray";
import Footer from "./components/Footer";
import Header from "./components/Header";
import MobileTabBar from "./components/MobileTabBar";
import QuickView from "./components/QuickView";
import SearchOverlay from "./components/SearchOverlay";
import { storeConfig } from "./config/store";
import { RouteProvider, useRoute } from "./lib/router";
import { StorefrontUIProvider, useStorefrontUI } from "./lib/ui-context";
import AboutPage from "./pages/AboutPage";
import AccountPage from "./pages/AccountPage";
import CategoriesPage from "./pages/CategoriesPage";
import CollectionsPage from "./pages/CollectionsPage";
import ContactPage from "./pages/ContactPage";
import HomePage from "./pages/HomePage";
import ProductDetailPage from "./pages/ProductDetailPage";
import ProductsPage from "./pages/ProductsPage";
import TrackOrderPage from "./pages/TrackOrderPage";
import WishlistPage from "./pages/WishlistPage";

// Heavy commerce dialogs load on demand — they reuse the proven
// checkout / tracking / auth flows shared with the rest of the app.
const CheckoutModal = lazy(() => import("../components/CheckoutModal"));
const OrderTrackingModal = lazy(() => import("../components/OrderTrackingModal"));
const AuthModal = lazy(() => import("../components/AuthModal"));

/* ═══════════════════════════════════════════════════════════════
   STOREFRONT — the public commerce experience. Fully config-
   driven (see config/store.ts): swap the StoreConfig and the
   same code serves any retail vertical.
   ═══════════════════════════════════════════════════════════════ */

interface StorefrontAppProps {
  onAdminClick: () => void;
}

export default function StorefrontApp({ onAdminClick }: StorefrontAppProps) {
  // The storefront ships one deliberate palette and ignores the app's
  // dark-mode preference (like any brand site). Strip the `dark` class
  // while mounted so shared components render light, and restore it
  // for the admin side on unmount.
  useEffect(() => {
    const root = document.documentElement;
    const hadDark = root.classList.contains("dark");
    root.classList.remove("dark");
    return () => {
      if (hadDark) root.classList.add("dark");
    };
  }, []);

  // Inject the merchant palette as CSS variables so the entire
  // design system re-brands from config alone.
  const themeVars = useMemo(
    () =>
      ({
        "--sf-accent": storeConfig.theme.accent,
        "--sf-accent-deep": storeConfig.theme.accentDeep,
        "--sf-accent-ink": storeConfig.theme.accentInk,
        "--sf-accent-soft": storeConfig.theme.accentSoft,
        "--sf-accent-glow": storeConfig.theme.accentGlow,
        "--sf-gold": storeConfig.theme.gold,
      }) as React.CSSProperties,
    [],
  );

  return (
    <RouteProvider>
      <StorefrontUIProvider onAdminClick={onAdminClick}>
        <div className="sf-root min-h-screen" style={themeVars}>
          <Header />
          <main>
            <CurrentPage />
          </main>
          <Footer />
          <MobileTabBar />

          {/* Overlays */}
          <SearchOverlay />
          <CartDrawer />
          <QuickView />
          <CompareTray />
          <CommerceDialogs />

          <ToastContainer
            position="bottom-center"
            autoClose={2200}
            hideProgressBar
            newestOnTop
            closeOnClick
            pauseOnHover={false}
            theme="light"
            toastClassName="!rounded-2xl !shadow-lg"
          />
        </div>
      </StorefrontUIProvider>
    </RouteProvider>
  );
}

function CurrentPage() {
  const route = useRoute();
  const [head] = route.segments;

  switch (head) {
    case undefined:
      return <HomePage />;
    case "products":
      return <ProductsPage />;
    case "product":
      return <ProductDetailPage />;
    case "categories":
      return <CategoriesPage />;
    case "collections":
      return <CollectionsPage />;
    case "offers":
      return <CollectionsPage offersOnly />;
    case "about":
      return <AboutPage />;
    case "contact":
      return <ContactPage />;
    case "wishlist":
      return <WishlistPage />;
    case "track":
      return <TrackOrderPage />;
    case "account":
      return <AccountPage />;
    default:
      return <HomePage />;
  }
}

function CommerceDialogs() {
  const ui = useStorefrontUI();
  return (
    <Suspense fallback={null}>
      {ui.checkoutOpen && (
        <CheckoutModal isOpen={ui.checkoutOpen} onClose={ui.closeCheckout} />
      )}
      {ui.trackingOpen && (
        <OrderTrackingModal
          isOpen={ui.trackingOpen}
          onClose={ui.closeTracking}
          initialLookup={
            ui.trackingOrderNumber ? { orderNumber: ui.trackingOrderNumber } : undefined
          }
        />
      )}
      {ui.authOpen && <AuthModal isOpen={ui.authOpen} onClose={ui.closeAuth} />}
    </Suspense>
  );
}
