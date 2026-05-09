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
import Button from "./ecommerce/Button";
import Input from "./ecommerce/Input";
import Badge from "./ecommerce/Badge";
import Alert from "./ecommerce/Alert";
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

        // Success! Show confirmation dialog
        setCompletedOrder(order);
        setOrderItems(displayOrderItems.length ? displayOrderItems : orderItems);
        setShowConfirmation(true);

        // Send admin notification
        try {
          await notifyAdminNewOrder(order);
        } catch (notifError) {
          console.error("Failed to send admin notification:", notifError);
          // Don't block the order flow if notification fails
        }

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
      <Dialog isOpen={isOpen} onClose={onClose} title="Complete Your Order" size="lg">
        <div className="space-y-4 sm:space-y-6">
          {/* Order Summary */}
          <div className="p-3 sm:p-4 bg-violet-50 dark:bg-violet-900/20 rounded-xl border border-violet-200 dark:border-violet-800">
            <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white mb-2 sm:mb-3 flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-violet-600" />
              Order Summary
            </h3>
            <div className="space-y-2">
              {cart.items.map((item) => (
                <div key={item.product.id} className="flex justify-between text-sm">
                  <span className="text-slate-700 dark:text-slate-300">
                    {item.product.name} x {item.quantity}
                  </span>
                  <span className="font-semibold text-slate-900 dark:text-white whitespace-nowrap text-xs sm:text-sm">
                    {currencyCode}{" "}
                    {(item.product.selling_price * item.quantity).toLocaleString()}
                  </span>
                </div>
              ))}
              <div className="pt-2 sm:pt-3 mt-2 border-t border-violet-200 dark:border-violet-800 flex justify-between">
                <span className="font-bold text-sm sm:text-base text-slate-900 dark:text-white">
                  Total
                </span>
                <span className="font-bold text-sm sm:text-base text-violet-600 dark:text-violet-400">
                  {currencyCode} {total.toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
            {/* Customer Information */}
            <div className="space-y-3 sm:space-y-4">
              <h3 className="font-bold text-base sm:text-lg text-slate-900 dark:text-white flex items-center gap-2">
                <User className="w-5 h-5 text-violet-600" />
                Customer Information
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
              <h3 className="font-bold text-base sm:text-lg text-slate-900 dark:text-white flex items-center gap-2">
                <Truck className="w-5 h-5 text-violet-600" />
                Delivery Information
              </h3>

              {savedAddresses.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    Saved Addresses
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
                          className={`rounded-xl border px-3 py-2 text-left transition ${
                            isSelected
                              ? "border-violet-500 bg-violet-50 dark:bg-violet-900/20"
                              : "border-slate-200 bg-white hover:border-violet-300 dark:border-slate-700 dark:bg-slate-900"
                          }`}
                        >
                          <p className="text-sm font-semibold text-slate-900 dark:text-white">
                            {address.label}
                            {address.isDefault ? " • Default" : ""}
                          </p>
                          <p className="max-w-[220px] text-xs text-slate-500 dark:text-slate-400">
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
              <h3 className="font-bold text-base sm:text-lg text-slate-900 dark:text-white flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-violet-600" />
                Payment Method
              </h3>

              <div className="grid grid-cols-2 gap-2 sm:gap-3">
                {[
                  { value: "mpesa", label: "M-Pesa", icon: "📱" },
                  { value: "cash", label: "Cash on Delivery", icon: "💵" },
                  { value: "card", label: "Card", icon: "💳" },
                  {
                    value: "bank_transfer",
                    label: "Bank Transfer",
                    icon: "🏦",
                  },
                ].map((method) => (
                  <button
                    key={method.value}
                    type="button"
                    onClick={() => setPaymentMethod(method.value as any)}
                    className={`p-3 sm:p-4 rounded-xl border-2 transition-all touch-manipulation active:scale-95 ${
                      paymentMethod === method.value
                        ? "border-violet-600 bg-violet-50 dark:bg-violet-900/20"
                        : "border-slate-200 dark:border-slate-700 hover:border-violet-300 dark:hover:border-violet-700"
                    }`}
                  >
                    <div className="text-xl sm:text-2xl mb-1">{method.icon}</div>
                    <div className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-white line-clamp-2">
                      {method.label}
                    </div>
                    {paymentMethod === method.value && (
                      <Badge variant="success" size="sm" className="mt-2">
                        Selected
                      </Badge>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-2 sm:pt-4 space-y-2 sm:space-y-3">
              {/* Save Info Checkbox */}
              <label className="flex items-start sm:items-center gap-2 sm:gap-3 p-2.5 sm:p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg cursor-pointer active:bg-slate-100 dark:active:bg-slate-800 transition-colors touch-manipulation">
                <input
                  type="checkbox"
                  checked={saveInfo}
                  onChange={(e) => setSaveInfo(e.target.checked)}
                  className="w-4 h-4 sm:w-5 sm:h-5 mt-0.5 sm:mt-0 rounded border-slate-300 text-violet-600 focus:ring-violet-500 focus:ring-offset-0 cursor-pointer"
                />
                <div className="flex-1">
                  <span className="text-xs sm:text-sm font-medium text-slate-900 dark:text-white">
                    Remember my information
                  </span>
                  <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Save my details for faster checkout next time
                  </p>
                </div>
              </label>

              <Alert variant="info">
                <strong>Secure Checkout:</strong> Your information is encrypted and secure
              </Alert>

              <Button
                type="submit"
                variant="primary"
                size="lg"
                fullWidth
                isLoading={isSubmitting}
                disabled={isSubmitting}
              >
                {isSubmitting
                  ? "Processing Order..."
                  : `Place Order • ${currencyCode} ${total.toLocaleString()}`}
              </Button>

              <Button
                type="button"
                onClick={onClose}
                variant="outline"
                size="md"
                fullWidth
                disabled={isSubmitting}
              >
                Cancel
              </Button>
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
