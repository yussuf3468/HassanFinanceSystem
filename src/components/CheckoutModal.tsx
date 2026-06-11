import { useState, useCallback, memo, useEffect } from "react";
import {
  CreditCard,
  Truck,
  Phone,
  Mail,
  User,
  MessageSquare,
  CheckCircle,
} from "lucide-react";
import compactToast from "../utils/compactToast";
import { createOrderWithItemsAndStock } from "../api";
import { useCart } from "../contexts/CartContext";
import { useAuth } from "../contexts/AuthContext";
import DeliveryAddressSelector from "./DeliveryAddressSelector";
import type { CheckoutForm } from "../types";
import type { Database } from "../lib/database.types";
import Dialog from "./ecommerce/Dialog";
import Input from "./ecommerce/Input";
import OrderConfirmationDialog from "./ecommerce/OrderConfirmationDialog";
import {
  notifyAdminNewOrder,
  requestNotificationPermission,
} from "../utils/adminNotifications";

type Order = Database["public"]["Tables"]["orders"]["Row"];
interface SavedAddress {
  id: string;
  label: string;
  recipient: string;
  phone: string;
  line1: string;
  line2: string;
  city: string;
  isDefault: boolean;
}

interface CustomerPreferences {
  orderUpdates?: boolean;
  smsAlerts?: boolean;
  marketingEmails?: boolean;
  darkModeByDefault?: boolean;
  language?: "en" | "so";
  currency?: "KES" | "USD";
}

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOrderComplete?: (order: Order) => void;
}

const CheckoutModal = memo(({ isOpen, onClose, onOrderComplete }: CheckoutModalProps) => {
  const cart = useCart();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deliveryFee, setDeliveryFee] = useState(0);
  const [currencyCode, setCurrencyCode] = useState<"KES" | "USD">("KES");
  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([]);
  const [selectedAddressLabel, setSelectedAddressLabel] = useState<string | null>(null);
  const [formData, setFormData] = useState<CheckoutForm>({
    customer_name: "",
    phone_number: "",
    delivery_address: "",
    email: "",
    notes: "",
  });
  const [paymentMethod, setPaymentMethod] = useState<
    "cash" | "mpesa" | "card" | "bank_transfer"
  >("mpesa");
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [completedOrder, setCompletedOrder] = useState<Order | null>(null);
  const [orderItems, setOrderItems] = useState<any[]>([]);
  const [saveInfo, setSaveInfo] = useState(true);

  const formatSavedAddress = (address: SavedAddress) => {
    return [address.line1, address.line2, address.city].filter(Boolean).join(", ");
  };

  // Load saved customer info, dashboard preferences, and default address on open
  useEffect(() => {
    if (isOpen) {
      const userName = user?.user_metadata?.full_name || "";
      const userPhone = user?.user_metadata?.phone || "";
      const userEmail = user?.email || "";

      const userStorageKeyPrefix = user?.id ? `horumar.customer.${user.id}` : null;
      const addressesKey = userStorageKeyPrefix
        ? `${userStorageKeyPrefix}.addresses`
        : null;
      const preferencesKey = userStorageKeyPrefix
        ? `${userStorageKeyPrefix}.preferences`
        : null;

      let defaultAddress = "";
      if (addressesKey) {
        try {
          const rawAddresses = localStorage.getItem(addressesKey);
          if (rawAddresses) {
            const addresses = JSON.parse(rawAddresses) as SavedAddress[];
            if (Array.isArray(addresses) && addresses.length > 0) {
              setSavedAddresses(addresses);
              const preferred =
                addresses.find((address) => address.isDefault) || addresses[0];
              defaultAddress = formatSavedAddress(preferred);
              setSelectedAddressLabel(preferred.label || null);
            } else {
              setSavedAddresses([]);
              setSelectedAddressLabel(null);
            }
          } else {
            setSavedAddresses([]);
            setSelectedAddressLabel(null);
          }
        } catch (error) {
          console.error("Failed to load saved addresses", error);
          setSavedAddresses([]);
          setSelectedAddressLabel(null);
        }
      }

      if (preferencesKey) {
        try {
          const rawPreferences = localStorage.getItem(preferencesKey);
          if (rawPreferences) {
            const parsedPreferences = JSON.parse(rawPreferences) as CustomerPreferences;
            if (
              parsedPreferences.currency === "USD" ||
              parsedPreferences.currency === "KES"
            ) {
              setCurrencyCode(parsedPreferences.currency);
            }
          }
        } catch (error) {
          console.error("Failed to load customer preferences", error);
        }
      }

      const savedInfo = localStorage.getItem("customerInfo");
      if (savedInfo) {
        try {
          const parsed = JSON.parse(savedInfo);
          setFormData({
            customer_name: parsed.customer_name || userName,
            phone_number: parsed.phone_number || userPhone,
            delivery_address: parsed.delivery_address || defaultAddress,
            email: parsed.email || userEmail,
            notes: "", // Don't restore notes
          });
          if (parsed.payment_method) {
            setPaymentMethod(parsed.payment_method);
          }
        } catch (e) {
          console.error("Failed to load saved customer info", e);
          setFormData({
            customer_name: userName,
            phone_number: userPhone,
            delivery_address: defaultAddress,
            email: userEmail,
            notes: "",
          });
        }
      } else {
        setFormData({
          customer_name: userName,
          phone_number: userPhone,
          delivery_address: defaultAddress,
          email: userEmail,
          notes: "",
        });
      }

      // Request notification permission for admin alerts
      requestNotificationPermission().catch((err) => {
        console.log("Notification permission not granted:", err);
      });
    }
  }, [isOpen, user]);

  const handleDeliveryFeeChange = useCallback((fee: number) => {
    setDeliveryFee(fee);
  }, []);

  const handleInputChange = useCallback(
    (field: keyof CheckoutForm, value: string) => {
      setFormData((prev) => ({
        ...prev,
        [field]: value,
      }));
      if (field === "delivery_address") {
        const matchingAddress = savedAddresses.find(
          (address) => formatSavedAddress(address) === value,
        );
        setSelectedAddressLabel(matchingAddress?.label || null);
      }
    },
    [savedAddresses],
  );

  const applySavedAddress = useCallback((address: SavedAddress) => {
    const formattedAddress = formatSavedAddress(address);
    setSelectedAddressLabel(address.label || null);
    setFormData((prev) => ({
      ...prev,
      delivery_address: formattedAddress,
      phone_number: prev.phone_number || address.phone,
    }));
  }, []);

  const validateForm = useCallback(() => {
    if (!formData.customer_name.trim()) {
      compactToast.error("Please enter your name");
      return false;
    }
    if (!formData.phone_number.trim()) {
      compactToast.error("Please enter your phone number");
      return false;
    }
    if (!formData.delivery_address.trim()) {
      compactToast.error("Please enter your delivery address");
      return false;
    }
    if (formData.phone_number.length < 10) {
      compactToast.error("Please enter a valid phone number");
      return false;
    }
    return true;
  }, [formData]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      if (!validateForm()) return;
      if (cart.items.length === 0) {
        compactToast.error("Your cart is empty");
        return;
      }

      setIsSubmitting(true);

      try {
        const { order, orderItems } = await createOrderWithItemsAndStock({
          order: {
            customer_name: formData.customer_name,
            customer_email: formData.email || null,
            customer_phone: formData.phone_number,
            delivery_address: formData.delivery_address,
            delivery_fee: deliveryFee || 0,
            subtotal: cart.totalPrice,
            total_amount: cart.totalPrice + (deliveryFee || 0),
            payment_method: paymentMethod,
            payment_status: "pending",
            notes: formData.notes || null,
          },
          items: cart.items.map((item) => ({
            product_id: item.product.id,
            product_name: item.product.name,
            quantity: item.quantity,
            unit_price: item.product.selling_price,
            total_price: item.product.selling_price * item.quantity,
            quantity_in_stock: item.product.quantity_in_stock,
          })),
        });

        const displayOrderItems = cart.items.map((item) => ({
          product_id: item.product.id,
          product_name: item.product.name,
          quantity: item.quantity,
          unit_price: item.product.selling_price,
          total_price: item.product.selling_price * item.quantity,
        }));

        // Success! Show confirmation dialog immediately — don't make the
        // customer wait on the admin notification (it runs in the background).
        setCompletedOrder(order);
        setOrderItems(displayOrderItems.length ? displayOrderItems : orderItems);
        setShowConfirmation(true);
        setIsSubmitting(false);

        // Fire-and-forget admin notification (never blocks the customer)
        void notifyAdminNewOrder(order).catch((notifError) =>
          console.error("Failed to send admin notification:", notifError),
        );

        // Save customer info for next time if enabled
        if (saveInfo) {
          const customerInfo = {
            customer_name: formData.customer_name,
            phone_number: formData.phone_number,
            delivery_address: formData.delivery_address,
            email: formData.email,
            payment_method: paymentMethod,
          };
          localStorage.setItem("customerInfo", JSON.stringify(customerInfo));
        }

        // Save last order to localStorage for tracking
        localStorage.setItem("lastOrderNumber", order.order_number);
        localStorage.setItem("lastOrderDate", new Date().toISOString());

        onOrderComplete?.(order);
      } catch (error) {
        console.error("Checkout error:", error);
        compactToast.error("Failed to place order. Please try again.");
      } finally {
        setIsSubmitting(false);
      }
    },
    [formData, paymentMethod, deliveryFee, cart, validateForm, onOrderComplete, saveInfo],
  );

  if (!isOpen) return null;

  const subtotal = cart.totalPrice || 0;
  const total = subtotal + (deliveryFee || 0);

  return (
    <>
      <Dialog isOpen={isOpen} onClose={onClose} title="Checkout" size="lg">
        <div className="space-y-6">
          {/* Order Summary */}
          <div className="p-4 sm:p-5 bg-[#f5f5f7] dark:bg-[#2c2c2e] rounded-2xl">
            <h3 className="font-semibold text-[15px] text-[#1d1d1f] dark:text-white mb-3 flex items-center gap-2">
              <CheckCircle className="w-[18px] h-[18px] text-[#1d1d1f] dark:text-white" />
              Order summary
            </h3>
            <div className="space-y-2">
              {cart.items.map((item) => (
                <div key={item.product.id} className="flex justify-between text-[14px] gap-3">
                  <span className="text-[#6e6e73] dark:text-[#a1a1a6] min-w-0">
                    {item.product.name}{" "}
                    <span className="text-[#86868b]">× {item.quantity}</span>
                  </span>
                  <span className="font-medium text-[#1d1d1f] dark:text-white whitespace-nowrap tabular-nums">
                    {currencyCode}{" "}
                    {(item.product.selling_price * item.quantity).toLocaleString()}
                  </span>
                </div>
              ))}
              <div className="pt-3 mt-1 border-t border-black/8 dark:border-white/10 flex justify-between items-baseline">
                <span className="font-semibold text-[15px] text-[#1d1d1f] dark:text-white">
                  Total
                </span>
                <span className="font-semibold text-[17px] text-[#1d1d1f] dark:text-white tabular-nums">
                  {currencyCode} {total.toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Customer Information */}
            <div className="space-y-3 sm:space-y-4">
              <h3 className="font-semibold text-[17px] text-[#1d1d1f] dark:text-white flex items-center gap-2">
                <User className="w-[18px] h-[18px] text-[#1d1d1f] dark:text-white" />
                Your details
              </h3>

              <Input
                label="Full Name"
                type="text"
                placeholder="Enter your full name"
                value={formData.customer_name}
                onChange={(e) => handleInputChange("customer_name", e.target.value)}
                required
                icon={User}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Phone Number"
                  type="tel"
                  placeholder="+254 712 345 678"
                  value={formData.phone_number}
                  onChange={(e) => handleInputChange("phone_number", e.target.value)}
                  required
                  icon={Phone}
                />

                <Input
                  label="Email (Optional)"
                  type="email"
                  placeholder="your@email.com"
                  value={formData.email || ""}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  icon={Mail}
                />
              </div>
            </div>

            {/* Delivery Information */}
            <div className="space-y-3 sm:space-y-4">
              <h3 className="font-semibold text-[17px] text-[#1d1d1f] dark:text-white flex items-center gap-2">
                <Truck className="w-[18px] h-[18px] text-[#1d1d1f] dark:text-white" />
                Delivery
              </h3>

              {savedAddresses.length > 0 && (
                <div className="space-y-2">
                  <p className="text-[11px] font-medium uppercase tracking-wide text-[#86868b]">
                    Saved addresses
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {savedAddresses.map((address) => {
                      const formattedAddress = formatSavedAddress(address);
                      const isSelected = formData.delivery_address === formattedAddress;

                      return (
                        <button
                          key={address.id}
                          type="button"
                          onClick={() => applySavedAddress(address)}
                          className={`rounded-2xl border-2 px-3.5 py-2.5 text-left transition-colors ${
                            isSelected
                              ? "border-[#1d1d1f] dark:border-white bg-[#1d1d1f]/[0.04] dark:bg-white/[0.06]"
                              : "border-black/8 bg-white hover:border-black/20 dark:border-white/10 dark:bg-[#2c2c2e] dark:hover:border-white/25"
                          }`}
                        >
                          <p className="text-[14px] font-semibold text-[#1d1d1f] dark:text-white">
                            {address.label}
                            {address.isDefault ? " · Default" : ""}
                          </p>
                          <p className="max-w-[220px] text-[12px] text-[#86868b]">
                            {formattedAddress}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              <DeliveryAddressSelector
                value={formData.delivery_address}
                onChange={(address) => handleInputChange("delivery_address", address)}
                onDeliveryFeeChange={handleDeliveryFeeChange}
                dark
              />

              <Input
                label="Delivery Notes (Optional)"
                placeholder="Any special delivery instructions?"
                value={formData.notes || ""}
                onChange={(e) => handleInputChange("notes", e.target.value)}
                icon={MessageSquare}
              />
            </div>

            {/* Payment Method */}
            <div className="space-y-3 sm:space-y-4">
              <h3 className="font-semibold text-[17px] text-[#1d1d1f] dark:text-white flex items-center gap-2">
                <CreditCard className="w-[18px] h-[18px] text-[#1d1d1f] dark:text-white" />
                Payment
              </h3>

              <div className="grid grid-cols-2 gap-2.5">
                {[
                  { value: "mpesa", label: "M-Pesa", icon: "📱" },
                  { value: "cash", label: "Cash on Delivery", icon: "💵" },
                  { value: "card", label: "Card", icon: "💳" },
                  {
                    value: "bank_transfer",
                    label: "Bank Transfer",
                    icon: "🏦",
                  },
                ].map((method) => {
                  const selected = paymentMethod === method.value;
                  return (
                    <button
                      key={method.value}
                      type="button"
                      onClick={() => setPaymentMethod(method.value as any)}
                      className={`relative p-4 rounded-2xl border-2 text-left transition-colors touch-manipulation ${
                        selected
                          ? "border-[#1d1d1f] dark:border-white bg-[#1d1d1f]/[0.04] dark:bg-white/[0.06]"
                          : "border-black/8 dark:border-white/10 hover:border-black/20 dark:hover:border-white/25"
                      }`}
                    >
                      <div className="text-2xl mb-1.5">{method.icon}</div>
                      <div className="text-[14px] font-medium text-[#1d1d1f] dark:text-white line-clamp-2">
                        {method.label}
                      </div>
                      {selected && (
                        <CheckCircle className="absolute top-3 right-3 w-5 h-5 text-[#1d1d1f] dark:text-white" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-2 space-y-3">
              {/* Save Info Checkbox */}
              <label className="flex items-center gap-3 p-3.5 bg-[#f5f5f7] dark:bg-[#2c2c2e] rounded-2xl cursor-pointer transition-colors touch-manipulation">
                <input
                  type="checkbox"
                  checked={saveInfo}
                  onChange={(e) => setSaveInfo(e.target.checked)}
                  className="w-5 h-5 rounded-md border-black/20 text-[#1d1d1f] dark:text-white focus:ring-[#1d1d1f]/20 focus:ring-offset-0 cursor-pointer"
                />
                <div className="flex-1">
                  <span className="text-[14px] font-medium text-[#1d1d1f] dark:text-white">
                    Remember my information
                  </span>
                  <p className="text-[12px] text-[#86868b] mt-0.5">
                    Save my details for faster checkout next time
                  </p>
                </div>
              </label>

              <p className="text-[12px] text-[#86868b] text-center px-2">
                🔒 Your information is encrypted and secure.
              </p>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full h-12 flex items-center justify-center bg-[#1d1d1f] hover:bg-black dark:bg-white dark:hover:bg-[#f5f5f7] disabled:opacity-60 text-white dark:text-[#1d1d1f] text-[15px] font-medium rounded-full transition-colors"
              >
                {isSubmitting
                  ? "Processing…"
                  : `Place order · ${currencyCode} ${total.toLocaleString()}`}
              </button>

              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="w-full h-11 flex items-center justify-center text-[#1d1d1f] dark:text-white text-[15px] font-medium rounded-full hover:bg-[#f5f5f7] dark:hover:bg-[#2c2c2e] disabled:opacity-60 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </Dialog>

      {/* Order Confirmation Dialog */}
      {completedOrder && (
        <OrderConfirmationDialog
          isOpen={showConfirmation}
          onClose={() => {
            setShowConfirmation(false);
            setCompletedOrder(null);
            setOrderItems([]);
            cart.clearCart();
            onClose();
          }}
          orderNumber={completedOrder.order_number}
          orderId={completedOrder.id}
          paymentReference={completedOrder.payment_reference}
          orderDetails={{
            customer_name: completedOrder.customer_name,
            customer_phone: completedOrder.customer_phone,
            delivery_address_label: selectedAddressLabel,
            delivery_address: completedOrder.delivery_address,
            total_amount: completedOrder.total_amount,
            payment_method: completedOrder.payment_method,
            items: orderItems,
          }}
        />
      )}
    </>
  );
});

CheckoutModal.displayName = "CheckoutModal";

export default CheckoutModal;
