import { useState } from "react";
import { CartProvider } from "../contexts/CartContext";
import CustomerStore from "./CustomerStore";
import Checkout from "./Checkout";

type AppView = "store" | "checkout";

export default function EcommerceApp() {
  const [currentView, setCurrentView] = useState<AppView>("store");

  const handleCheckout = () => {
    setCurrentView("checkout");
  };

  const handleBackToStore = () => {
    setCurrentView("store");
  };

  const handleOrderSuccess = () => {
    setCurrentView("store");
  };

  return (
    <CartProvider>
      <div className="min-h-screen">
        {currentView === "store" && (
          <CustomerStore onCheckout={handleCheckout} />
        )}
        {currentView === "checkout" && (
          <Checkout onBack={handleBackToStore} onSuccess={handleOrderSuccess} />
        )}
      </div>
    </CartProvider>
  );
}
